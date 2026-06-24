import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { bookingsAPI, equipmentAPI, usersAPI, setTokenGetter } from "../api/axiosConfig";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { downloadInvoice, formatDateTime, formatOrderCode } from "../lib/orderUtils";
import {
  FiPackage, FiHeart, FiStar, FiShoppingCart, FiMapPin,
  FiUser, FiChevronRight, FiClock,
  FiCheckCircle, FiXCircle,
  FiTruck, FiActivity, FiCreditCard,
  FiDownload, FiSmartphone, FiShield, FiMessageSquare
} from "react-icons/fi";

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function fmt(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function persistOrderSuccess(payload) {
  try {
    sessionStorage.setItem("taprent_last_order", JSON.stringify(payload));
  } catch {
    // Ignore storage failures
  }
}

function estimateDeliveryText(cartItems) {
  if (!cartItems?.length) return "Add rentals to calculate delivery";
  const earliest = [...cartItems]
    .map((item) => item.start_date)
    .filter(Boolean)
    .sort()[0];
  if (!earliest) return "Delivery estimate after checkout";
  return `Estimated by ${earliest}`;
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function StatusTag({ status }) {
  const s = (status || "").toLowerCase();
  let badgeClass = "bg-secondary";
  let icon = <FiClock className="me-1" />;

  if (["completed", "delivered", "confirmed"].includes(s)) {
    badgeClass = "bg-success";
    icon = <FiCheckCircle className="me-1" />;
  } else if (s === "shipped") {
    badgeClass = "bg-info text-dark";
    icon = <FiTruck className="me-1" />;
  } else if (s === "active") {
    badgeClass = "bg-primary";
  } else if (s === "cancelled") {
    badgeClass = "bg-danger";
    icon = <FiXCircle className="me-1" />;
  } else {
    badgeClass = "bg-warning text-dark";
  }

  return <span className={`badge ${badgeClass} d-inline-flex align-items-center px-2 py-1`}>{icon}<span className="text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>{status}</span></span>;
}

function OrderTimeline({ booking }) {
  const s = (booking?.status || "").toLowerCase();
  if (s === "cancelled") {
    return (
      <div className="alert alert-danger mb-0 py-2">
        <strong><FiXCircle className="me-1"/> Order Cancelled</strong>
        <div className="small mt-1">Placed: {formatDateTime(booking?.created_at)}</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-wrap gap-4 small text-muted bg-light p-3 rounded">
      <div><strong className="text-uppercase" style={{fontSize: '0.7rem'}}>Placed:</strong><br/>{formatDateTime(booking?.created_at)}</div>
      <div><strong className="text-uppercase" style={{fontSize: '0.7rem'}}>Start:</strong><br/>{booking?.start_date || "Pending"}</div>
      <div><strong className="text-uppercase" style={{fontSize: '0.7rem'}}>End:</strong><br/>{booking?.end_date || "Pending"}</div>
    </div>
  );
}

function CheckoutProgress({ currentStep }) {
  const steps = ["Cart", "Delivery", "Payment", "Review"];
  return (
    <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
      {steps.map((step, index) => (
        <div key={step} className={`flex-fill p-2 text-center rounded border ${index <= currentStep ? 'bg-primary text-white border-primary' : 'bg-light text-muted'}`} style={{minWidth: '80px'}}>
          <div className="small text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>Step {index + 1}</div>
          <div className="fw-semibold small">{step}</div>
        </div>
      ))}
    </div>
  );
}

function CartPaymentForm({ onConfirmed, navigate }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/buyer` },
        redirect: "if_required",
      });
      if (error) toast.error(error.message || "Payment failed.");
      else { 
        const result = await bookingsAPI.confirmCartPayment(paymentIntent.id);
        toast.success("Order completed!");
        if (onConfirmed) onConfirmed(result);
        setTimeout(() => {
          if (navigate) navigate("/buyer/success", { state: { orderSuccess: result } });
          else window.location.href = "/buyer/success";
        }, 1500);
      }
    } catch (err) { toast.error(err.message || "Failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleConfirm} className="mt-3">
      <div className="p-3 bg-white border rounded">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      <button type="submit" disabled={submitting || !stripe} className="btn btn-primary w-100 mt-3 rounded-pill py-2 fw-medium">
        {submitting ? "Processing…" : "Confirm Payment"}
      </button>
    </form>
  );
}

const TABS = [
  { id: "orders",    label: "Orders",    icon: <FiPackage className="me-2 text-muted" /> },
  { id: "wishlist",  label: "Wishlist",  icon: <FiHeart className="me-2 text-muted" /> },
  { id: "cart",      label: "Cart",      icon: <FiShoppingCart className="me-2 text-muted" /> },
  { id: "reviews",   label: "Reviews",   icon: <FiStar className="me-2 text-muted" /> },
  { id: "addresses", label: "Addresses", icon: <FiMapPin className="me-2 text-muted" /> },
  { id: "profile",   label: "Profile",   icon: <FiUser className="me-2 text-muted" /> },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function BuyerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken, isSignedIn, userId } = useAuth();
  const { setCartCount } = useAppPreferences();
  
  // Ensure token getter is initialized for auth interceptor
  useEffect(() => {
    if (getToken) setTokenGetter(getToken);
  }, [getToken]);
  
  const query = new URLSearchParams(location.search);
  const requestedHash = (location.hash || "").replace(/^#/, "");
  const hashTabMap = { wishlist:"wishlist", cart:"cart", messages:"chat", chat:"chat", orders:"orders", reviews:"reviews", addresses:"addresses", profile:"profile" };
  const requestedTab = query.get("tab") || hashTabMap[requestedHash];

  const allowedTabs = useMemo(() => new Set(TABS.map(t => t.id)), []);

  // STATE
  const [tab, setTab] = useState(allowedTabs.has(requestedTab) ? requestedTab : "orders");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [cartClientSecret, setCartClientSecret] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [checkoutMethod, setCheckoutMethod] = useState("stripe");
  const [checkoutDraft, setCheckoutDraft] = useState(null);
  
  const [addressForm, setAddressForm] = useState({ label:"Home", full_name:"", phone:"", line1:"", line2:"", city:"", state:"", postal_code:"", country:"India", is_default:false });
  const [profileForm, setProfileForm] = useState({ full_name:"", phone:"", bio:"", preferred_location:"" });
  const [savingProfile, setSavingProfile] = useState(false);

  // DERIVED STATE
  const completedBookings = useMemo(() => bookings.filter(b => b.status === "completed" || b.status === "delivered"), [bookings]);
  const totalSpend = useMemo(() => completedBookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [completedBookings]);
  const cartTotal  = useMemo(() => cartItems.reduce((s, i) => s + Number(i.subtotal || 0), 0), [cartItems]);
  const pendingOrders = bookings.filter(b => b.status === "pending").length;
  const selectedAddress = useMemo(
    () => addresses.find((address) => Number(address.id) === Number(selectedAddressId)) || addresses.find((address) => address.is_default) || addresses[0] || null,
    [addresses, selectedAddressId]
  );
  const firstName = profile?.full_name?.split(" ")[0];
  const checkoutStep = cartClientSecret ? 3 : checkoutMethod ? 2 : selectedAddress ? 1 : 0;
  const deliveryEstimate = estimateDeliveryText(cartItems);

  // DATA FETCHING
  const loadData = useCallback(async () => {
    setLoading(true);

    if (!isSignedIn || !userId) {
      setProfile(null); setBookings([]); setWishlist([]);
      setMyReviews([]); setCartItems([]); setAddresses([]);
      setCartClientSecret(""); setLoading(false);
      return;
    }

    try {
      const [me, myBookings, wl, addrs, reviews, cart] = await Promise.all([
        usersAPI.me(),
        bookingsAPI.mine(),
        equipmentAPI.wishlist().catch(() => []),
        usersAPI.addresses().catch(() => []),
        equipmentAPI.buyerReviews().catch(() => []),
        equipmentAPI.cart().catch(() => []),
      ]);
      setProfile(me);
      if (me) setProfileForm({ full_name:me.full_name||"", phone:me.phone||"", bio:me.bio||"", preferred_location:me.preferred_location||"" });
      setBookings(Array.isArray(myBookings) ? myBookings : myBookings?.results || []);
      setWishlist(Array.isArray(wl) ? wl : wl?.results || []);
      setMyReviews(Array.isArray(reviews) ? reviews : reviews?.results || []);
      setCartItems(Array.isArray(cart) ? cart : cart?.results || []);
      setAddresses(Array.isArray(addrs) ? addrs : addrs?.results || []);
    } catch (err) { toast.error(err.message || "Load failed."); }
    finally { setLoading(false); }
  }, [isSignedIn, userId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (allowedTabs.has(requestedTab)) setTab(requestedTab); }, [requestedTab, allowedTabs]);
  useEffect(() => {
    if (!addresses.length) {
      setSelectedAddressId(null);
      return;
    }
    if (selectedAddressId && addresses.some((address) => Number(address.id) === Number(selectedAddressId))) return;
    const nextDefault = addresses.find((address) => address.is_default) || addresses[0];
    setSelectedAddressId(nextDefault?.id || null);
  }, [addresses, selectedAddressId]);

  // ACTIONS
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.createAddress(addressForm);
      setAddressForm({ label:"Home", full_name:"", phone:"", line1:"", line2:"", city:"", state:"", postal_code:"", country:"India", is_default:false });
      toast.success("Address saved.");
      const next = await usersAPI.addresses();
      const nextAddresses = Array.isArray(next) ? next : next?.results || [];
      setAddresses(nextAddresses);
      const nextDefault = nextAddresses.find((address) => address.is_default) || nextAddresses[0];
      setSelectedAddressId(nextDefault?.id || null);
    } catch (err) { toast.error(err.message || "Failed."); }
  };

  const markCompleted = async (id) => { try { await bookingsAPI.complete(id); toast.success("Marked completed."); loadData(); } catch (err) { toast.error(err.message || "Failed."); } };
  const cancelOrder   = async (id) => { try { await bookingsAPI.cancel(id); toast.success("Cancelled."); loadData(); } catch (err) { toast.error(err.message || "Failed."); } };

  const removeCartItem = async (id) => {
    try { 
      await equipmentAPI.removeCartItem(id); 
      const n = await equipmentAPI.cart(); 
      const nextItems = Array.isArray(n) ? n : n?.results || [];
      setCartItems(nextItems);
      setCartCount(nextItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0));
    } catch (err) { toast.error(err.message || "Failed."); }
  };

  const checkoutCart = async (method) => {
    if (!selectedAddress) {
      toast.error("Choose a delivery address before checkout.");
      setTab("addresses");
      return;
    }
    if (["upi", "wallet"].includes(method)) {
      toast("This payment option is coming soon. Use Card or COD for now.", { icon: "i" });
      return;
    }
    try {
      const result = await bookingsAPI.cartCheckout(method, selectedAddress);
      setCheckoutDraft(result);
      if (method === "cod") {
        setCartClientSecret("");
        setCheckoutMethod(method);
        persistOrderSuccess(result);
        toast.success("COD order placed.");
        setCartCount(0);
        loadData();
        navigate("/buyer/success", { state: { orderSuccess: result } });
      } else {
        setCheckoutMethod(method);
        setCartClientSecret(result.client_secret || "");
      }
    } catch (err) {
      const errMsg = err.message || "Checkout failed.";
      if (errMsg.includes("403") || errMsg.includes("Only buyers")) {
        toast.error("Syncing account permissions...");
        try {
          await usersAPI.roleSync();
          toast.success("Account synced. Please try checkout again.");
          setCartClientSecret("");
          setCheckoutDraft(null);
          loadData();
        } catch (syncErr) {
          toast.error("Only buyers can checkout. Please verify your account role.");
          console.error("Role sync failed:", syncErr);
        }
      } else {
        toast.error(errMsg);
      }
    }
  };

  const submitReview = async (equipmentId) => {
    const draft = reviewDrafts[equipmentId];
    if (!draft?.rating) return;
    try {
      await equipmentAPI.addReview(equipmentId, { rating: Number(draft.rating), title: draft.title || "", comment: draft.comment || "" });
      toast.success("Review submitted.");
      setReviewDrafts(p => ({ ...p, [equipmentId]: { rating: 5, title: "", comment: "" } }));
      loadData();
    } catch (err) { toast.error(err.message || "Failed."); }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Hero Banner */}
      <div className="card text-white bg-dark mb-4 border-0 rounded-4 shadow-sm overflow-hidden">
        <div className="card-body p-4 p-md-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center position-relative z-1">
          <div>
            <h6 className="text-primary text-uppercase fw-bold mb-2 tracking-wider small"><FiActivity className="me-2"/>Buyer Hub</h6>
            <h1 className="display-5 fw-bold mb-2">{firstName ? `Welcome back, ${firstName}.` : "Your Dashboard"}</h1>
            <p className="lead text-white-50 mb-0">Manage orders, payments, and account settings.</p>
          </div>
          <div className="d-flex gap-4 mt-4 mt-md-0 bg-white bg-opacity-10 p-3 rounded-3 backdrop-blur">
            <div className="text-center px-2">
              <div className="text-white-50 text-uppercase tracking-wider mb-1" style={{fontSize: '0.7rem'}}>Orders</div>
              <div className="fs-3 fw-light">{completedBookings.length}</div>
            </div>
            <div className="text-center border-start border-white border-opacity-25 px-2 ps-4">
              <div className="text-white-50 text-uppercase tracking-wider mb-1" style={{fontSize: '0.7rem'}}>Total Spend</div>
              <div className="fs-3 fw-light">{fmt(totalSpend)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Sidebar Navigation */}
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 position-sticky" style={{top: '80px'}}>
            <div className="list-group list-group-flush rounded-4 overflow-hidden py-2">
              <div className="px-3 py-2 small fw-bold text-muted text-uppercase tracking-wider">Menu</div>
              {TABS.map(t => (
                <button 
                  key={t.id} 
                  className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between border-0 py-3 px-3 transition-all ${tab === t.id ? 'bg-primary bg-opacity-10 text-primary fw-semibold border-start border-3 border-primary' : 'text-secondary'}`}
                  onClick={() => setTab(t.id)}
                >
                  <div className="d-flex align-items-center">
                    <span className={tab === t.id ? 'text-primary' : ''}>{t.icon}</span> 
                    {t.label}
                  </div>
                  <div className="d-flex align-items-center">
                    {t.id === "orders" && pendingOrders > 0 && <span className="badge bg-danger rounded-pill me-2">{pendingOrders}</span>}
                    {t.id === "cart" && cartItems.length > 0 && <span className="badge bg-primary rounded-pill me-2">{cartItems.length}</span>}
                    {tab === t.id && <FiChevronRight className="text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-12 col-md-9">
          
          {/* ORDERS TAB */}
          {tab === "orders" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">My Orders</h4>
                <p className="text-muted small mb-0 mt-1">{bookings.length} rental records</p>
              </div>
              <div className="card-body p-4 bg-light bg-opacity-50">
                {bookings.length === 0 ? (
                  <div className="text-center py-5 bg-white rounded-3 border border-dashed">
                    <FiPackage size={48} className="text-muted mb-3 opacity-50" />
                    <h5 className="fw-bold">No orders yet</h5>
                    <p className="text-muted">Browse equipment to start renting.</p>
                    <Link to="/" className="btn btn-primary rounded-pill px-4 mt-2 fw-medium">Start Browsing</Link>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {bookings.map(b => (
                      <div key={b.id} className="card border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-shadow">
                        <div className="card-header bg-white border-bottom d-flex flex-wrap gap-4 py-3 px-4">
                          <div>
                            <div className="text-muted text-uppercase tracking-wider fw-semibold" style={{fontSize: '0.65rem'}}>Order Placed</div>
                            <div className="fw-medium small mt-1">{formatDateTime(b.created_at)}</div>
                          </div>
                          <div>
                            <div className="text-muted text-uppercase tracking-wider fw-semibold" style={{fontSize: '0.65rem'}}>Total</div>
                            <div className="fw-medium small mt-1">{fmt(b.total_price)}</div>
                          </div>
                          <div>
                            <div className="text-muted text-uppercase tracking-wider fw-semibold" style={{fontSize: '0.65rem'}}>Order #</div>
                            <div className="fw-medium small mt-1">{formatOrderCode(b.id)}</div>
                          </div>
                          <div className="ms-auto align-self-center">
                            <Link to={`/equipment/${b.equipment}`} className="btn btn-sm btn-outline-primary rounded-pill fw-medium px-3">View Details</Link>
                          </div>
                        </div>
                        <div className="card-body bg-white d-flex flex-column flex-md-row gap-4 p-4">
                          <div className="flex-shrink-0">
                            {b.equipment_detail?.image_url ? (
                              <img src={b.equipment_detail.image_url} alt={b.equipment_detail.name} className="rounded-3 object-fit-cover border" style={{width: 100, height: 100}} />
                            ) : (
                              <div className="bg-light rounded-3 border d-flex align-items-center justify-content-center text-muted" style={{width: 100, height: 100}}>
                                <FiPackage size={32} />
                              </div>
                            )}
                          </div>
                          <div className="flex-fill min-w-0">
                            <h5 className="fw-bold mb-1 text-truncate">{b.equipment_detail?.name || "Equipment Rental"}</h5>
                            <p className="text-muted small mb-3"><FiClock className="me-1 mb-1"/>{b.start_date} to {b.end_date}</p>
                            <StatusTag status={b.status} />
                            <div className="mt-4">
                              <OrderTimeline booking={b} />
                            </div>
                          </div>
                          <div className="d-flex flex-column gap-2 border-start-md ps-md-3" style={{minWidth: '160px'}}>
                            <button className="btn btn-sm btn-light border text-start" onClick={() => downloadInvoice([b], { title: `Invoice ${formatOrderCode(b.id)}` })}>
                              <FiDownload className="me-2 text-muted"/> Invoice
                            </button>
                            {b.status === "active" && (
                              <button className="btn btn-sm btn-success text-start" onClick={() => markCompleted(b.id)}>
                                <FiCheckCircle className="me-2"/> Mark Completed
                              </button>
                            )}
                            {["delivered", "completed"].includes((b.status || "").toLowerCase()) && (
                              <button className="btn btn-sm btn-outline-dark text-start" onClick={() => setTab("reviews")}>
                                <FiStar className="me-2"/> Write Review
                              </button>
                            )}
                            {!["cancelled", "completed", "delivered"].includes((b.status || "").toLowerCase()) && (
                              <button className="btn btn-sm btn-outline-danger text-start" onClick={() => cancelOrder(b.id)}>
                                <FiXCircle className="me-2"/> Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WISHLIST TAB */}
          {tab === "wishlist" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">Saved Items</h4>
                <p className="text-muted small mb-0 mt-1">{wishlist.length} items in your wishlist</p>
              </div>
              <div className="card-body p-4 bg-light bg-opacity-50">
                {wishlist.length === 0 ? (
                  <div className="text-center py-5 bg-white rounded-3 border border-dashed">
                    <FiHeart size={48} className="text-muted mb-3 opacity-50" />
                    <h5 className="fw-bold">Nothing saved yet</h5>
                    <p className="text-muted">Tap the heart on any listing to save it here.</p>
                  </div>
                ) : (
                  <div className="row g-4">
                    {wishlist.map(item => (
                      <div key={item.id} className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-shadow">
                          <div className="position-relative bg-light border-bottom" style={{aspectRatio: '4/3'}}>
                            {item.equipment_detail?.image_url ? (
                              <img src={item.equipment_detail.image_url} alt={item.equipment_detail.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <div className="w-100 h-100 d-flex justify-content-center align-items-center text-muted"><FiPackage size={40}/></div>
                            )}
                            <button 
                              className="btn btn-white bg-white rounded-circle shadow-sm position-absolute top-0 end-0 m-2 p-2 text-danger border-0 d-flex align-items-center justify-content-center" 
                              style={{width: '36px', height: '36px'}}
                              onClick={() => { equipmentAPI.removeFromWishlist(item.equipment); loadData(); }}
                            >
                              <FiHeart size={18} fill="currentColor" />
                            </button>
                          </div>
                          <div className="card-body d-flex flex-column p-3">
                            <h6 className="fw-bold mb-1 text-truncate" title={item.equipment_detail?.name}>{item.equipment_detail?.name}</h6>
                            <p className="text-muted mb-3 fw-medium">{fmt(item.equipment_detail?.price_per_day)} <span className="small text-muted fw-normal">/ day</span></p>
                            <Link to={`/equipment/${item.equipment}`} className="btn btn-outline-primary btn-sm mt-auto w-100 rounded-pill fw-medium">View Details</Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CART TAB */}
          {tab === "cart" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">Your Cart</h4>
                <p className="text-muted small mb-0 mt-1">{cartItems.length} items ready for checkout</p>
              </div>
              <div className="card-body p-4 bg-light bg-opacity-50">
                {cartItems.length === 0 ? (
                  <div className="text-center py-5 bg-white rounded-3 border border-dashed">
                    <FiShoppingCart size={48} className="text-muted mb-3 opacity-50" />
                    <h5 className="fw-bold">Cart is empty</h5>
                    <p className="text-muted">Add equipment to get started with your rental.</p>
                    <Link to="/" className="btn btn-primary rounded-pill px-4 mt-2 fw-medium">Browse Equipment</Link>
                  </div>
                ) : (
                  <div>
                    <CheckoutProgress currentStep={checkoutStep} />
                    <div className="row g-4">
                      {/* Left Column: Items and Address */}
                      <div className="col-12 col-lg-7">
                        <div className="d-flex flex-column gap-3 mb-4">
                          <h6 className="fw-bold mb-1">Rental Items</h6>
                          {cartItems.map(item => (
                            <div key={item.id} className="card border-0 shadow-sm rounded-3 flex-row align-items-center p-3">
                              {item.equipment_detail?.image_url ? (
                                <img src={item.equipment_detail.image_url} alt="" className="rounded object-fit-cover border me-3 flex-shrink-0" style={{width: 64, height: 64}} />
                              ) : (
                                <div className="bg-light rounded border d-flex align-items-center justify-content-center text-muted me-3 flex-shrink-0" style={{width: 64, height: 64}}>
                                  <FiPackage />
                                </div>
                              )}
                              <div className="flex-fill min-w-0">
                                <h6 className="fw-bold mb-1 text-truncate">{item.equipment_detail?.name}</h6>
                                <p className="text-muted small mb-0"><FiClock className="me-1 mb-1 text-muted opacity-50"/>{item.start_date} to {item.end_date}</p>
                              </div>
                              <div className="text-end me-3">
                                <div className="fw-bold text-primary">{fmt(item.subtotal)}</div>
                                <div className="text-muted small">Qty: {item.quantity}</div>
                              </div>
                              <button className="btn btn-light rounded-circle p-2 text-danger border-0 d-flex align-items-center justify-content-center" onClick={() => removeCartItem(item.id)}>
                                <FiXCircle size={18}/>
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                          <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center p-4">
                            <h6 className="mb-0 fw-bold">Delivery Address</h6>
                            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => setTab("addresses")}>Manage</button>
                          </div>
                          <div className="card-body p-4 bg-light">
                            {addresses.length === 0 ? (
                              <div className="alert alert-warning mb-0 d-flex align-items-center rounded-3 border-warning border-opacity-25">
                                <FiMapPin className="me-2 fs-5" /> Add a saved address before checkout.
                              </div>
                            ) : (
                              <div className="d-flex flex-column gap-3">
                                {addresses.map(address => {
                                  const isActive = Number(selectedAddress?.id) === Number(address.id);
                                  return (
                                    <div 
                                      key={address.id} 
                                      className={`card p-3 cursor-pointer transition-all ${isActive ? 'border-primary shadow-sm ring-1 ring-primary' : 'border'}`}
                                      onClick={() => setSelectedAddressId(address.id)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <div className="d-flex justify-content-between mb-2">
                                        <h6 className="fw-bold mb-0 d-flex align-items-center">
                                          {isActive ? <FiCheckCircle className="text-primary me-2" /> : <FiMapPin className="text-muted me-2 opacity-50" />}
                                          {address.label} 
                                          {address.is_default && <span className="badge bg-light text-dark border ms-2 fw-normal" style={{fontSize:'0.65rem'}}>Default</span>}
                                        </h6>
                                      </div>
                                      <div className="text-muted small ps-4 ms-1">
                                        <div className="fw-medium text-dark">{address.full_name}</div>
                                        <div>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</div>
                                        <div>{address.city}, {address.state} {address.postal_code}</div>
                                        <div className="mt-1"><FiSmartphone className="me-1 opacity-50"/>{address.phone}</div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Summary and Payment */}
                      <div className="col-12 col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 position-sticky" style={{top: '80px'}}>
                          <div className="card-body p-4">
                            <h5 className="fw-bold mb-4 border-bottom pb-3">Order Summary</h5>
                            
                            <div className="d-flex flex-column gap-2 mb-4">
                              <div className="d-flex justify-content-between small"><span className="text-muted">Items</span><span className="fw-medium">{cartItems.length}</span></div>
                              <div className="d-flex justify-content-between small"><span className="text-muted">Subtotal</span><span className="fw-medium">{fmt(cartTotal)}</span></div>
                              <div className="d-flex justify-content-between small"><span className="text-muted">Delivery</span><span className="fw-medium">{deliveryEstimate}</span></div>
                              <div className="d-flex justify-content-between small"><span className="text-muted">Protection Fee</span><span className="badge bg-success bg-opacity-10 text-success fw-medium">Included</span></div>
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center py-3 border-top border-bottom mb-4">
                              <span className="fw-bold text-uppercase tracking-wider small">Total</span>
                              <span className="fs-3 fw-bold text-primary">{fmt(cartTotal)}</span>
                            </div>

                            <div className="mb-4">
                              <label className="form-label small fw-bold text-uppercase tracking-wider text-muted mb-3">Payment Method</label>
                              <div className="d-flex flex-column gap-2">
                                {[
                                  { id:"stripe", label:"Credit / Debit Card", desc:"Secure via Stripe", icon: FiCreditCard, active:true },
                                  { id:"cod", label:"Cash on Delivery", desc:"Pay at delivery/pickup", icon: FiTruck, active:true },
                                ].map(method => {
                                  const isActive = checkoutMethod === method.id;
                                  return (
                                    <div 
                                      key={method.id} 
                                      className={`card p-3 cursor-pointer transition-all ${isActive ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border shadow-none bg-light bg-opacity-50'}`}
                                      onClick={() => method.active && setCheckoutMethod(method.id)}
                                      style={{ cursor: method.active ? 'pointer' : 'not-allowed', opacity: method.active ? 1 : 0.6 }}
                                    >
                                      <div className="d-flex align-items-center gap-3">
                                        <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${isActive ? 'bg-primary text-white' : 'bg-white border text-muted'}`}>
                                          <method.icon size={16}/>
                                        </div>
                                        <div className="flex-fill">
                                          <div className={`fw-bold small mb-0 ${isActive ? 'text-primary' : 'text-dark'}`}>{method.label}</div>
                                          <div className="text-muted" style={{fontSize: '0.7rem'}}>{method.desc}</div>
                                        </div>
                                        {isActive && <FiCheckCircle className="text-primary fs-5" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm" onClick={() => checkoutCart(checkoutMethod)}>
                              {checkoutMethod === "cod" ? "Place COD Order" : checkoutMethod === "stripe" ? "Continue to Secure Payment" : "Checkout"}
                            </button>
                            
                            <div className="mt-3 text-center text-muted" style={{fontSize: '0.65rem'}}>
                              <FiShield className="me-1 mb-1"/> Secure checkout process. Your data is protected.
                            </div>

                            {cartClientSecret && stripePromise && (
                              <div className="mt-4 pt-4 border-top">
                                <h6 className="fw-bold mb-3 small text-uppercase tracking-wider text-muted">Complete Payment</h6>
                                <Elements stripe={stripePromise} options={{ clientSecret: cartClientSecret }}>
                                  <CartPaymentForm
                                    onConfirmed={(result) => {
                                      setCartClientSecret("");
                                      setCheckoutDraft(result);
                                      persistOrderSuccess(result);
                                      setCartCount(0);
                                      loadData();
                                    }}
                                    navigate={navigate}
                                  />
                                </Elements>
                              </div>
                            )}

                            {checkoutDraft?.bookings?.length > 0 && (
                              <div className="mt-4 pt-3 border-top bg-success bg-opacity-10 p-3 rounded mt-3">
                                <div className="small fw-bold text-success text-uppercase tracking-wider mb-1">Order Prepared</div>
                                <div className="fw-bold fs-5 mb-1">{formatOrderCode(checkoutDraft.bookings[0].id)}</div>
                                <div className="small text-success opacity-75">{checkoutDraft.bookings.length} booking(s) ready.</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {tab === "reviews" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">My Reviews</h4>
                <p className="text-muted small mb-0 mt-1">{myReviews.length} published</p>
              </div>
              <div className="card-body p-4 bg-light bg-opacity-50">
                {myReviews.length > 0 && (
                  <div className="d-flex flex-column gap-3 mb-5">
                    {myReviews.map(r => (
                      <div key={r.id} className="card border-0 shadow-sm p-4 rounded-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="fw-bold mb-1 text-primary">{r.equipment_detail?.name || r.title || "Equipment"}</h6>
                            <div className="small text-muted fw-medium">{r.title && r.equipment_detail?.name ? r.title : ""}</div>
                          </div>
                          <div className="bg-warning bg-opacity-10 px-2 py-1 rounded text-warning fs-6">
                            {[1,2,3,4,5].map(n => <span key={n}>{n <= r.rating ? "★" : "☆"}</span>)}
                          </div>
                        </div>
                        <p className="mb-0 text-dark">"{r.comment}"</p>
                        
                        {r.vendor_reply && (
                          <div className="mt-4 p-3 bg-light border-start border-4 border-primary rounded-end-3 small">
                            <strong className="text-primary d-flex align-items-center gap-2 mb-2 text-uppercase tracking-wider" style={{fontSize: '0.7rem'}}>
                              <FiMessageSquare/> Vendor Reply
                            </strong>
                            <div className="text-dark fst-italic">{r.vendor_reply}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {bookings.filter(b => ["delivered","completed"].includes((b.status||"").toLowerCase())).length > 0 && (
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden mt-4">
                    <div className="card-header bg-dark text-white p-4">
                      <h5 className="fw-bold mb-0">Write a Review</h5>
                      <p className="text-white-50 small mb-0 mt-1">Share your experience with recently completed rentals</p>
                    </div>
                    <div className="card-body p-0">
                      <ul className="list-group list-group-flush">
                        {bookings.filter(b => ["delivered","completed"].includes((b.status||"").toLowerCase())).map(b => {
                          const eqId = b.equipment_detail?.id || b.equipment;
                          const draft = reviewDrafts[eqId] || { rating:5, title:"", comment:"" };
                          return (
                            <li key={b.id} className="list-group-item p-4">
                              <h6 className="fw-bold mb-3">{b.equipment_detail?.name || "Equipment"}</h6>
                              <div className="bg-light p-4 rounded-3 border">
                                <div className="mb-3 d-flex align-items-center gap-3">
                                  <label className="fw-medium small mb-0">Your Rating:</label>
                                  <div className="fs-4 text-warning" style={{cursor: 'pointer'}}>
                                    {[1,2,3,4,5].map(n => (
                                      <span key={n} onClick={() => setReviewDrafts({ ...reviewDrafts, [eqId]:{ ...draft, rating:n } })} className="me-1">
                                        {n <= draft.rating ? "★" : "☆"}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <input className="form-control fw-medium" type="text" placeholder="Review Title (Optional)" value={draft.title} onChange={e => setReviewDrafts({ ...reviewDrafts, [eqId]:{ ...draft, title:e.target.value } })} />
                                </div>
                                <div className="mb-3">
                                  <textarea className="form-control" rows="3" placeholder="What did you like or dislike about this rental?" value={draft.comment} onChange={e => setReviewDrafts({ ...reviewDrafts, [eqId]:{ ...draft, comment:e.target.value } })} />
                                </div>
                                <button className="btn btn-primary px-4 rounded-pill fw-medium" onClick={() => submitReview(eqId)}>Submit Review</button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {tab === "addresses" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">Shipping Addresses</h4>
                <p className="text-muted small mb-0 mt-1">{addresses.length} saved addresses</p>
              </div>
              <div className="card-body p-4 p-md-5">
                <div className="row g-5">
                  <div className="col-12 col-lg-6">
                    <div className="bg-light p-4 rounded-4 border">
                      <h5 className="fw-bold mb-4 d-flex align-items-center"><FiMapPin className="me-2 text-primary"/> Add New Address</h5>
                      <form onSubmit={handleSaveAddress}>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Address Label</label>
                          <input className="form-control" placeholder="e.g. Home, Office, Studio" value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label:e.target.value })} required />
                        </div>
                        <div className="row g-3 mb-3">
                          <div className="col-sm-6">
                            <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Full Name</label>
                            <input className="form-control" value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name:e.target.value })} required />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Phone Number</label>
                            <input className="form-control" type="tel" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone:e.target.value })} required />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Address Line 1</label>
                          <input className="form-control" placeholder="Street address, company name" value={addressForm.line1} onChange={e => setAddressForm({ ...addressForm, line1:e.target.value })} required />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Address Line 2 (Optional)</label>
                          <input className="form-control" placeholder="Apartment, suite, unit, etc." value={addressForm.line2} onChange={e => setAddressForm({ ...addressForm, line2:e.target.value })} />
                        </div>
                        <div className="row g-3 mb-4">
                          <div className="col-sm-6">
                            <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>City</label>
                            <input className="form-control" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city:e.target.value })} required />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>State / Province</label>
                            <input className="form-control" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state:e.target.value })} required />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>PIN / Postal Code</label>
                            <input className="form-control" value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code:e.target.value })} required />
                          </div>
                          <div className="col-sm-6">
                            <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Country</label>
                            <input className="form-control" value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country:e.target.value })} required />
                          </div>
                        </div>
                        <div className="form-check form-switch mb-4 bg-white p-3 rounded border">
                          <input className="form-check-input ms-0 me-3" type="checkbox" role="switch" id="defaultAddr" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default:e.target.checked })} />
                          <label className="form-check-label small fw-medium mt-1" htmlFor="defaultAddr">Make this my default shipping address</label>
                        </div>
                        <button type="submit" className="btn btn-dark w-100 rounded-pill py-2 fw-medium">Save Address</button>
                      </form>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <h5 className="fw-bold mb-4">Saved Addresses</h5>
                    {addresses.length === 0 ? (
                      <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                        <FiMapPin size={40} className="text-muted mb-3 opacity-50" />
                        <p className="text-muted mb-0">No addresses saved yet.</p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {addresses.map(a => (
                          <div key={a.id} className="card border shadow-sm rounded-4 overflow-hidden">
                            <div className="card-body p-4 position-relative">
                              {a.is_default && <span className="badge bg-primary position-absolute top-0 end-0 mt-4 me-4 px-2 py-1">Default</span>}
                              <h6 className="fw-bold mb-3 fs-5 d-flex align-items-center">
                                <div className="bg-light rounded p-2 me-3"><FiMapPin className="text-primary"/></div>
                                {a.label}
                              </h6>
                              <div className="text-muted ps-1">
                                <div className="fw-bold text-dark mb-1">{a.full_name}</div>
                                <div className="mb-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
                                <div className="mb-2">{a.city}, {a.state} {a.postal_code} • {a.country}</div>
                                <div className="d-flex align-items-center small bg-light d-inline-flex px-2 py-1 rounded">
                                  <FiSmartphone className="me-2 text-muted"/> {a.phone}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {tab === "profile" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">My Profile</h4>
                <p className="text-muted small mb-0 mt-1">Manage your account details and preferences</p>
              </div>
              <div className="card-body p-4 p-md-5">
                <div className="row justify-content-center">
                  <div className="col-12 col-lg-10 col-xl-8">
                    <div className="d-flex flex-column flex-sm-row align-items-center gap-4 mb-5 p-4 bg-light rounded-4 border">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fs-1 fw-bold shadow-sm" style={{width: 90, height: 90, flexShrink: 0}}>
                        {profileForm.full_name ? profileForm.full_name[0].toUpperCase() : <FiUser/>}
                      </div>
                      <div className="text-center text-sm-start">
                        <h4 className="fw-bold mb-1">{profileForm.full_name || "Buyer Account"}</h4>
                        <p className="text-muted mb-2">{profile?.email || "No email available"}</p>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><FiCheckCircle className="me-1 mb-1"/> Verified via Clerk</span>
                      </div>
                    </div>

                    <form onSubmit={async e => { e.preventDefault(); setSavingProfile(true); try { const r = await usersAPI.updateMe(profileForm); setProfile(r); toast.success("Profile successfully updated."); } catch (err) { toast.error(err.message || "Failed."); } finally { setSavingProfile(false); } }} className="bg-white p-4 rounded-4 border shadow-sm">
                      <h5 className="fw-bold mb-4 border-bottom pb-3">Personal Information</h5>
                      
                      <div className="row g-4 mb-4">
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Full Name</label>
                          <input className="form-control bg-light" type="text" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name:e.target.value })} placeholder="Your full name" />
                        </div>
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Phone Number</label>
                          <input className="form-control bg-light" type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone:e.target.value })} placeholder="+91 98765 43210" />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Preferred Location</label>
                          <input className="form-control bg-light" type="text" value={profileForm.preferred_location} onChange={e => setProfileForm({ ...profileForm, preferred_location:e.target.value })} placeholder="E.g. Mumbai, Maharashtra" />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{fontSize: '0.65rem'}}>About Me (Bio)</label>
                          <textarea className="form-control bg-light" rows="4" value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio:e.target.value })} placeholder="Tell vendors a bit about yourself, your projects, or what you typically rent..." />
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="submit" disabled={savingProfile} className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm">
                          {savingProfile ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
                          ) : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
