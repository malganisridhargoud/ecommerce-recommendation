import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { bookingsAPI, chatAPI, equipmentAPI, recommendationsAPI, usersAPI } from "../api/axiosConfig";
import { FiPackage, FiHeart, FiStar, FiShoppingCart, FiMapPin, FiMessageSquare, FiUser, FiChevronRight, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiSend, FiTruck } from "react-icons/fi";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold uppercase tracking-wider border border-green-200"><FiCheckCircle className="w-3.5 h-3.5" /> Completed</span>;
  if (s === "delivered") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider border border-emerald-200"><FiCheckCircle className="w-3.5 h-3.5" /> Delivered</span>;
  if (s === "shipped") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider border border-purple-200"><FiTruck className="w-3.5 h-3.5 animate-pulse" /> Shipped</span>;
  if (s === "confirmed") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wider border border-cyan-200"><FiCheckCircle className="w-3.5 h-3.5" /> Confirmed</span>;
  if (s === "active") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#0071e3] text-xs font-semibold uppercase tracking-wider border border-blue-200"><FiClock className="w-3.5 h-3.5 animate-pulse" /> Active</span>;
  if (s === "cancelled") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-wider border border-red-200"><FiXCircle className="w-3.5 h-3.5" /> Cancelled</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold uppercase tracking-wider border border-amber-200"><FiClock className="w-3.5 h-3.5" /> Pending</span>;
}

function OrderTimeline({ status }) {
  const s = (status || "").toLowerCase();
  const stages = ["Placed", "Confirmed", "Shipped", "Delivered", "Completed"];
  let currentStage = 0;
  if (s === "confirmed") currentStage = 1;
  else if (s === "active") currentStage = 1;
  else if (s === "shipped") currentStage = 2;
  else if (s === "delivered") currentStage = 3;
  else if (s === "completed") currentStage = 4;
  else if (s === "cancelled") return (
    <div className="w-full bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-3 text-red-600 text-sm font-medium">
      <FiXCircle className="w-5 h-5" /> Order Cancelled
    </div>
  );

  return (
    <div className="relative flex items-center justify-between w-full max-w-[500px] mt-2 mb-4">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full z-0 transition-all duration-500" style={{ width: `${(currentStage / 4) * 100}%` }}></div>

      {stages.map((stage, idx) => (
        <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${idx <= currentStage ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-transparent'}`}>
            {idx === 2 ? <FiTruck className={`w-3 h-3 ${idx <= currentStage ? 'text-white' : 'text-transparent'}`} /> : <FiCheckCircle className={`w-3.5 h-3.5 ${idx <= currentStage ? 'text-white' : 'text-transparent'}`} />}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${idx <= currentStage ? 'text-green-700' : 'text-gray-400'}`}>{stage}</span>
        </div>
      ))}
    </div>
  );
}

function CartPaymentForm({ onConfirmed }) {
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
        await bookingsAPI.confirmCartPayment(paymentIntent.id);
        toast.success("Cart payment successful.");
        onConfirmed();
      }
    } catch (err) {
      toast.error(err.message || "Payment confirmation failed.");
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleConfirm} className="mt-4 animate-fade-in">
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button type="submit" disabled={submitting || !stripe} className="mt-4 w-full rounded-full bg-[#1d1d1f] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
        {submitting ? "Processing Securely..." : "Confirm Payment"}
      </button>
    </form>
  );
}

const TABS = [
  { id: "orders", label: "Orders", icon: <FiPackage /> },
  { id: "wishlist", label: "Wishlist", icon: <FiHeart /> },
  { id: "recommend", label: "For You", icon: <FiStar /> },
  { id: "cart", label: "Cart", icon: <FiShoppingCart /> },
  { id: "reviews", label: "Reviews", icon: <FiMessageSquare /> },
  { id: "addresses", label: "Addresses", icon: <FiMapPin /> },
  { id: "chat", label: "Messages", icon: <FiMessageSquare /> },
  { id: "profile", label: "Profile", icon: <FiUser /> },
];

export default function BuyerDashboard() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const requestedHash = (location.hash || "").replace(/^#/, "");
  const hashTabMap = {
    wishlist: "wishlist",
    cart: "cart",
    messages: "chat",
    chat: "chat",
    orders: "orders",
    recommend: "recommend",
    reviews: "reviews",
    addresses: "addresses",
    profile: "profile",
  };
  const requestedTab = query.get("tab") || hashTabMap[requestedHash];
  const requestedThreadId = Number(query.get("thread") || 0);
  const allowedTabs = new Set(TABS.map((t) => t.id));

  const [tab, setTab] = useState(allowedTabs.has(requestedTab) ? requestedTab : "orders");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [cartClientSecret, setCartClientSecret] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ label: "Home", full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "India", is_default: false });
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", bio: "", preferred_location: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const totalSpend = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [me, myBookings, wl, recs, addrs, threadList, reviews, cart] = await Promise.all([
        usersAPI.me(),
        bookingsAPI.mine(),
        equipmentAPI.wishlist().catch(() => []),
        recommendationsAPI.forMe().catch(() => []),
        usersAPI.addresses().catch(() => []),
        chatAPI.threads().catch(() => []),
        equipmentAPI.buyerReviews().catch(() => []),
        equipmentAPI.cart().catch(() => []),
      ]);
      setProfile(me);
      if (me) setProfileForm({ full_name: me.full_name || "", phone: me.phone || "", bio: me.bio || "", preferred_location: me.preferred_location || "" });
      setBookings(Array.isArray(myBookings) ? myBookings : myBookings?.results || []);
      setWishlist(Array.isArray(wl) ? wl : wl?.results || []);
      setRecommendations(Array.isArray(recs) ? recs : recs?.results || []);
      setMyReviews(Array.isArray(reviews) ? reviews : reviews?.results || []);
      setCartItems(Array.isArray(cart) ? cart : cart?.results || []);
      setAddresses(Array.isArray(addrs) ? addrs : addrs?.results || []);
      const tl = Array.isArray(threadList) ? threadList : threadList?.results || [];
      setThreads(tl);
      if (tl.length) {
        const requestedThread = requestedThreadId ? tl.find((t) => Number(t.id) === requestedThreadId) : null;
        setSelectedThread((p) => requestedThread || p || tl[0]);
      }
    } catch (err) { toast.error(err.message || "Failed to load dashboard."); }
    finally { setLoading(false); }
  }, [requestedThreadId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (allowedTabs.has(requestedTab)) setTab(requestedTab);
  }, [requestedTab, allowedTabs]);

  useEffect(() => {
    async function loadMsgs() {
      if (!selectedThread?.id) return;
      try { const d = await chatAPI.messages(selectedThread.id); setMessages(Array.isArray(d) ? d : d?.results || []); }
      catch { setMessages([]); }
    }
    loadMsgs();
  }, [selectedThread]);

  useEffect(() => {
    if (!selectedThread?.id) return;
    const t = setInterval(async () => {
      try { const d = await chatAPI.messages(selectedThread.id); setMessages(Array.isArray(d) ? d : d?.results || []); } catch { }
    }, 3000);
    return () => clearInterval(t);
  }, [selectedThread?.id]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.createAddress(addressForm);
      setAddressForm({ label: "Home", full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "India", is_default: false });
      toast.success("Address saved.");
      const next = await usersAPI.addresses();
      setAddresses(Array.isArray(next) ? next : next?.results || []);
    } catch (err) { toast.error(err.message || "Address save failed."); }
  };

  const handleSendMessage = async () => {
    if (!selectedThread?.id || !newMessage.trim()) return;
    try {
      await chatAPI.sendMessage(selectedThread.id, { message: newMessage.trim() });
      setNewMessage("");
      const d = await chatAPI.messages(selectedThread.id);
      setMessages(Array.isArray(d) ? d : d?.results || []);
    } catch (err) { toast.error(err.message || "Send failed."); }
  };

  const markOrderCompleted = async (id) => {
    try {
      await bookingsAPI.complete(id);
      toast.success("Order marked as completed.");
      loadData();
    } catch (err) { toast.error(err.message || "Failed to mark as complete."); }
  };

  const cancelOrder = async (id) => {
    try {
      await bookingsAPI.cancel(id);
      toast.success("Order cancelled.");
      loadData();
    } catch (err) { toast.error(err.message || "Failed to cancel order."); }
  };

  const reportIssue = async (id) => {
    toast("Issue reporting is being directed to support...", { icon: '🚨' });
    // In full prod, open a modal with issue form.
  };

  const removeCartItem = async (id) => {
    try { await equipmentAPI.removeCartItem(id); const n = await equipmentAPI.cart(); setCartItems(Array.isArray(n) ? n : n?.results || []); }
    catch (err) { toast.error(err.message || "Remove failed."); }
  };

  const checkoutCart = async (method) => {
    try {
      const result = await bookingsAPI.cartCheckout(method);
      if (method === "cod") { toast.success("COD order placed."); loadData(); }
      else setCartClientSecret(result.client_secret || "");
    } catch (err) { toast.error(err.message || "Checkout failed."); }
  };

  const submitReview = async (equipmentId) => {
    const draft = reviewDrafts[equipmentId];
    if (!draft?.rating) return;
    try {
      await equipmentAPI.addReview(equipmentId, { rating: Number(draft.rating), title: draft.title || "", comment: draft.comment || "" });
      toast.success("Review submitted.");
      setReviewDrafts(p => ({ ...p, [equipmentId]: { rating: 5, title: "", comment: "" } }));
      loadData();
    } catch (err) { toast.error(err.message || "Submit failed."); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0071e3] rounded-full animate-spin"></div>
    </div>
  );

  const pendingOrders = bookings.filter(b => b.status === "pending").length;
  const cartTotal = cartItems.reduce((s, i) => s + Number(i.subtotal || 0), 0);

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 font-sans selection:bg-[#0071e3] selection:text-white">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 pt-8 md:pt-12">

        {/* Apple-style Hero Banner */}
        <div className="bg-[#1d1d1f] rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden" style={{ boxShadow: '0 16px 50px rgba(0,0,0,0.15)' }}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#0071e3]/20 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse"></span>
                <span className="text-xs font-bold tracking-widest text-[#0071e3] uppercase">Buyer Hub</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                {profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}.` : "Your Dashboard."}
              </h1>
              <p className="text-gray-400 text-lg">Manage orders, payments, and communications seamlessly.</p>
            </div>

            <div className="flex gap-4 p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="px-4 text-center border-r border-white/10">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Orders</div>
                <div className="text-2xl font-bold text-white">{bookings.length}</div>
              </div>
              <div className="px-4 text-center">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Spend</div>
                <div className="text-2xl font-bold text-white tracking-tight">₹{formatCurrency(totalSpend).replace("₹", "")}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-3 lg:sticky lg:top-[100px]" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <nav className="flex flex-col gap-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl font-medium transition-all ${tab === t.id ? 'bg-[#1d1d1f] text-white shadow-md' : 'text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${tab === t.id ? 'text-[#0071e3]' : ''}`}>{t.icon}</span>
                    {t.label}
                  </div>
                  {t.id === "orders" && pendingOrders > 0 && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === t.id ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>{pendingOrders}</span>}
                  {t.id === "cart" && cartItems.length > 0 && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === t.id ? 'bg-white/20' : 'bg-[#0071e3]/10 text-[#0071e3]'}`}>{cartItems.length}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 animate-fade-in">
            {/* Orders Tab - Amazon/Flipkart Style */}
            {tab === "orders" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">My Orders</h2>
                {bookings.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200/60">
                    <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6">Looks like you haven't rented any equipment.</p>
                    <Link to="/" className="inline-flex px-8 py-3 rounded-full bg-[#0071e3] text-white font-semibold hover:bg-[#0077ed] transition-colors">Start Browsing</Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bookings.map((b) => (
                      <div key={b.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200/60">
                        {/* Order Header */}
                        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                              <span className="block text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Order Placed</span>
                              <span className="font-semibold text-[#1d1d1f]">{b.start_date}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Total Amount</span>
                              <span className="font-semibold text-[#1d1d1f]">{formatCurrency(b.total_price)}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Ship To</span>
                              <span className="font-semibold text-[#0071e3] hover:underline cursor-pointer truncate max-w-[120px] block border-b border-[#0071e3]/30">{b.shipping_address?.full_name || "Self"}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Order #</span>
                              <span className="font-semibold text-[#1d1d1f]">ORD-{b.id.toString().padStart(6, '0')}</span>
                            </div>
                          </div>
                          <Link to={`/equipment/${b.equipment}`} className="text-[#0071e3] font-semibold hover:underline">View Details / Invoice</Link>
                        </div>

                        {/* Order Body */}
                        <div className="p-6 md:p-8 flex flex-col gap-8">

                          <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                            <div className="flex gap-6 items-start">
                              <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200">
                                {b.equipment_detail?.image_url ? (
                                  <img src={b.equipment_detail.image_url} alt={b.equipment_detail.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <FiPackage className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight">{b.equipment_detail?.name || "Equipment Rental"}</h3>
                                <p className="text-sm text-gray-500">Rental duration: {b.start_date} to {b.end_date}</p>
                                <div className="pt-2"><StatusBadge status={b.status} /></div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col w-full lg:w-[220px] gap-2 flex-shrink-0">
                              {b.status === "active" && (
                                <>
                                  <button onClick={() => markOrderCompleted(b.id)} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Mark as Completed</button>
                                  <button onClick={() => reportIssue(b.id)} className="w-full py-2.5 bg-white border border-gray-300 text-[#1d1d1f] hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors shadow-sm">Report Issue</button>
                                </>
                              )}
                              {(b.status === "delivered" || b.status === "completed") && (
                                <button onClick={() => setTab("reviews")} className="w-full py-2.5 bg-white border border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/5 text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"><FiStar className="w-4 h-4" />Write Review</button>
                              )}
                              {b.status === "shipped" && (
                                <div className="w-full py-2.5 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2"><FiTruck className="w-4 h-4 animate-pulse" />In Transit</div>
                              )}
                              {!["cancelled", "completed", "delivered"].includes(b.status) && (
                                <button onClick={() => cancelOrder(b.id)} className="w-full py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"><FiXCircle className="w-4 h-4" />Cancel Order</button>
                              )}
                            </div>
                          </div>

                          {/* Tracker */}
                          <div className="pt-6 border-t border-gray-100">
                            <h4 className="text-sm font-bold text-[#1d1d1f] mb-4">Delivery & Status Tracking</h4>
                            <OrderTimeline status={b.status} />
                            <p className="text-xs text-gray-500 font-medium">Tracking info is updated manually by the vendor. For urgent queries, please message the vendor.</p>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {tab === "wishlist" && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">Your Wishlist</h2>
                  <span className="text-gray-500 font-medium">{wishlist.length} Items</span>
                </div>
                {wishlist.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200/60">
                    <FiHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">You haven't saved any items yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/60 overflow-hidden group">
                        <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
                          <img src={item.equipment_detail?.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <button onClick={() => { equipmentAPI.removeFromWishlist(item.equipment); loadData(); }} className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 shadow-sm hover:scale-110 transition-transform">
                            <FiHeart className="fill-current w-4 h-4" />
                          </button>
                        </div>
                        <h3 className="font-bold text-[#1d1d1f] truncate mb-1">{item.equipment_detail?.name}</h3>
                        <p className="text-gray-500 text-sm mb-4">₹{formatCurrency(item.equipment_detail?.price_per_day).replace("₹", "")} / day</p>
                        <Link to={`/equipment/${item.equipment}`} className="inline-block w-full py-2.5 text-center bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] font-semibold rounded-xl transition-colors">View Details</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {tab === "recommend" && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">Recommended for You</h2>
                  <span className="text-gray-500 font-medium">Machine Learning Powered</span>
                </div>
                {recommendations.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200/60">
                    <FiStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Rent more items to get personalized recommendations.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((item) => (
                      <Link key={item.id} to={`/equipment/${item.id}`} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/60 overflow-hidden group block">
                        <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-4 overflow-hidden"><img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                        <span className="text-[10px] font-bold text-[#0071e3] uppercase tracking-wider mb-1 block">{item.category}</span>
                        <h3 className="font-bold text-[#1d1d1f] truncate mb-1">{item.name}</h3>
                        <p className="text-[#86868b] text-sm">₹{formatCurrency(item.price_per_day).replace("₹", "")} / day</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cart Tab */}
            {tab === "cart" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">Your Cart</h2>
                {cartItems.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200/60">
                    <FiShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">Cart is purely decorative.</h3>
                    <p className="text-gray-500 mb-6">You have no items in your cart. Add some gear to proceed.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm border border-gray-200/60 relative pr-12">
                          <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden"><img src={item.equipment_detail?.image_url} className="w-full h-full object-cover" /></div>
                            <div>
                              <h4 className="font-bold text-[#1d1d1f] text-base">{item.equipment_detail?.name}</h4>
                              <p className="text-sm text-gray-500">{item.start_date} to {item.end_date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatCurrency(item.subtotal)}</div>
                            <div className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</div>
                          </div>
                          <button onClick={() => removeCartItem(item.id)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"><FiXCircle className="w-6 h-6" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-[100px]">
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/60">
                        <h3 className="font-bold text-xl mb-6">Order Summary</h3>
                        <div className="flex justify-between items-center mb-4 text-[#86868b]"><span className="font-medium">Subtotal ({cartItems.length} items)</span><span className="text-[#1d1d1f] font-semibold">{formatCurrency(cartTotal)}</span></div>
                        <div className="flex justify-between items-center pb-6 border-b border-gray-100 text-[#86868b]"><span className="font-medium">Platform Fee</span><span className="text-green-600 font-semibold">Free</span></div>
                        <div className="flex justify-between items-center py-6"><span className="font-bold text-lg">Total</span><span className="font-bold text-2xl tracking-tight text-[#1d1d1f]">{formatCurrency(cartTotal)}</span></div>

                        <div className="space-y-3">
                          <button onClick={() => checkoutCart("stripe")} className="w-full py-4 bg-[#0071e3] text-white font-bold rounded-2xl shadow-sm hover:bg-[#0077ed] transition-colors focus:ring-4 focus:ring-[#0071e3]/30">Checkout with Card</button>
                          <button onClick={() => checkoutCart("cod")} className="w-full py-4 bg-[#f5f5f7] text-[#1d1d1f] font-bold rounded-2xl hover:bg-[#e8e8ed] transition-colors">Cash on Delivery</button>
                        </div>

                        {cartClientSecret && (
                          <div className="mt-6 pt-6 border-t border-gray-100">
                            <Elements stripe={stripePromise} options={{ clientSecret: cartClientSecret }}>
                              <CartPaymentForm onConfirmed={() => { setCartClientSecret(""); loadData(); }} />
                            </Elements>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other Tabs (Reviews, Addresses, Messages, Profile) with Tailwind */}
            {tab === "addresses" && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/60">
                <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-8">Shipping Addresses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <h4 className="font-semibold text-lg border-b border-gray-100 pb-2 mb-4">Add New Address</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input className="col-span-2 px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none text-sm font-medium" placeholder="Label (e.g., Home, Office)" value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} required />
                      <input className="px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 outline-none text-sm font-medium focus:ring-[#0071e3]/20 transition-all" placeholder="Full Name" value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })} required />
                      <input className="px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 outline-none text-sm font-medium focus:ring-[#0071e3]/20 transition-all" placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} required />
                      <input className="col-span-2 px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none text-sm font-medium" placeholder="Address Line 1" value={addressForm.line1} onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })} required />
                      <input className="col-span-2 px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none text-sm font-medium" placeholder="Address Line 2 (Optional)" value={addressForm.line2} onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })} />
                      <input className="px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 outline-none text-sm font-medium focus:ring-[#0071e3]/20 transition-all" placeholder="City" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
                      <input className="px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 outline-none text-sm font-medium focus:ring-[#0071e3]/20 transition-all" placeholder="State" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} required />
                      <input className="px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 outline-none text-sm font-medium focus:ring-[#0071e3]/20 transition-all" placeholder="PIN Code" value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} required />
                      <input className="px-4 py-3 bg-[#f5f5f7] rounded-xl border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-2 outline-none text-sm font-medium focus:ring-[#0071e3]/20 transition-all" placeholder="Country" value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} required />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input type="checkbox" className="w-4 h-4 text-[#0071e3] rounded" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} />
                      <span className="text-sm font-medium text-[#1d1d1f]">Set as Default</span>
                    </label>
                    <button type="submit" className="px-6 py-3 bg-[#1d1d1f] text-white font-semibold rounded-xl mt-4 max-w-max hover:bg-black transition-colors">Save Address</button>
                  </form>

                  <div>
                    <h4 className="font-semibold text-lg border-b border-gray-100 pb-2 mb-4">Saved Addresses</h4>
                    <div className="flex flex-col gap-4">
                      {addresses.length === 0 ? (
                        <p className="text-[#86868b] text-sm">No saved addresses.</p>
                      ) : (
                        addresses.map(a => (
                          <div key={a.id} className="p-5 border border-gray-200 rounded-2xl relative bg-gray-50/50 hover:bg-white transition-colors">
                            {a.is_default && <span className="absolute top-4 right-4 text-[10px] font-bold bg-[#0071e3]/10 text-[#0071e3] px-2 py-1 rounded-full uppercase tracking-wider">Default</span>}
                            <h5 className="font-bold text-[#1d1d1f] mb-1 flex items-center gap-2"><FiMapPin className="text-[#86868b]" />{a.label}</h5>
                            <p className="text-sm text-[#1d1d1f] font-medium">{a.full_name}</p>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-[80%]">{a.line1}, {a.line2}<br />{a.city}, {a.state} {a.postal_code}<br />Ph: {a.phone}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {tab === "chat" && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200/60 h-[600px] flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50 h-[30%] md:h-full overflow-y-auto">
                  <div className="p-4 border-b border-gray-200/60 bg-white/80 backdrop-blur sticky top-0 font-bold text-lg text-[#1d1d1f]">Conversations</div>
                  {threads.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm font-medium">No open threads.</div>
                  ) : (
                    threads.map(t => (
                      <button key={t.id} onClick={() => setSelectedThread(t)} className={`w-full text-left p-4 border-b border-gray-100 transition-colors ${selectedThread?.id === t.id ? 'bg-[#0071e3]/10 border-l-4 border-l-[#0071e3]' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}>
                        <div className="truncate font-semibold text-[#1d1d1f] text-sm mb-1">{t.equipment_name || `Thread #${t.id}`}</div>
                        <div className="truncate text-xs text-gray-500 font-medium">{t.equipment_vendor_name || `Vendor`}</div>
                      </button>
                    ))
                  )}
                </div>
                <div className="w-full md:w-2/3 flex flex-col h-[70%] md:h-full">
                  {selectedThread ? (
                    <>
                      <div className="p-4 border-b border-gray-200 bg-white font-bold flex items-center justify-between">
                        <span className="truncate">{selectedThread.equipment_name}</span>
                        <span className="text-[10px] uppercase bg-green-100 text-green-700 px-2 py-1 rounded-full tracking-wider">Live</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3" style={{ backgroundColor: '#e5ddd5', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c9b99a\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                        {messages.length === 0 ? (
                          <div className="m-auto text-gray-500 font-medium text-sm bg-white/80 px-4 py-2 rounded-lg shadow-sm">Send a message to start chatting.</div>
                        ) : (
                          messages.map(m => {
                            const isBuyer = String(m.sender_id) === String(selectedThread.buyer_id);
                            const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                            return (
                              <div key={m.id} className={`max-w-[75%] flex flex-col ${isBuyer ? 'self-end items-end' : 'self-start items-start'}`}>
                                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-1 ${isBuyer ? 'text-[#075e54]' : 'text-[#6b5b95]'}`}>{isBuyer ? 'You' : 'Vendor'}</span>
                                <div className={`px-3.5 py-2 rounded-lg text-sm shadow-sm relative ${isBuyer ? 'bg-[#dcf8c6] text-[#1d1d1f] rounded-tr-none' : 'bg-white text-[#1d1d1f] rounded-tl-none'}`}>
                                  <div className="leading-relaxed pr-12">{m.message}</div>
                                  <span className="absolute bottom-1.5 right-2.5 text-[10px] text-gray-500 font-medium">{time}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex bg-gray-100 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-[#0071e3]/30 focus-within:border-[#0071e3] focus-within:bg-white transition-all overflow-hidden p-1">
                          <input type="text" className="flex-1 bg-transparent px-4 py-2 text-sm outline-none font-medium" placeholder="Type your message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMessage()} />
                          <button onClick={handleSendMessage} className="w-10 h-10 rounded-full bg-[#0071e3] text-white flex items-center justify-center hover:bg-[#0077ed] transition-colors"><FiSend className="-ml-0.5 mt-0.5" /></button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="m-auto text-gray-400 font-medium flex flex-col items-center gap-2"><FiMessageSquare className="w-12 h-12 stroke-1" /><span>Select a conversation</span></div>
                  )}
                </div>
              </div>
            )}

            {tab === "reviews" && (
              <div className="space-y-6">
                <div><h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">My Reviews</h2></div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/60">
                  <h3 className="font-bold text-lg border-b border-gray-100 pb-4 mb-6">Published Reviews</h3>
                  {myReviews.length === 0 ? (
                    <p className="text-gray-500 text-sm font-medium pb-4">No reviews published yet.</p>
                  ) : (
                    <div className="grid gap-6">
                      {myReviews.map(r => (
                        <div key={r.id} className="p-5 bg-[#f5f5f7] rounded-2xl">
                          <div className="flex items-center gap-1 mb-2 text-yellow-500 text-lg">
                            {[1, 2, 3, 4, 5].map(n => <span key={n} className={n <= r.rating ? "opacity-100" : "opacity-30"}>★</span>)}
                          </div>
                          <h4 className="font-bold text-[#1d1d1f] mb-1">{r.equipment_detail?.name || r.title || "Equipment"}</h4>
                          <p className="text-sm text-[#1d1d1f]/80 leading-relaxed">{r.comment}</p>
                          {r.vendor_reply && <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-sm leading-relaxed"><span className="font-bold text-[#0071e3] uppercase text-[10px] tracking-wider block mb-1">Vendor Reply</span>{r.vendor_reply}</div>}

                          {/* Comment Thread — Instagram-style */}
                          {r.comments && r.comments.length > 0 && (
                            <div className="mt-3 ml-3 pl-3 border-l-2 border-gray-200 space-y-2.5">
                              {r.comments.map((c) => (
                                <div key={c.id} className="flex items-start gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-[#f5f5f7] border border-gray-200 flex items-center justify-center text-[9px] font-bold text-[#86868b] shrink-0 mt-0.5">
                                    {(c.commenter_name || "U")[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                      <span className="font-bold text-[#1d1d1f]">{c.commenter_name || "User"}</span>
                                      {" "}<span className="text-[#1d1d1f]/80 leading-relaxed">{c.comment}</span>
                                    </p>
                                    <p className="text-[10px] text-[#86868b] mt-0.5 font-medium">{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {bookings.filter(b => ["active", "completed"].includes((b.status || "").toLowerCase())).length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/60">
                    <h3 className="font-bold text-lg border-b border-gray-100 pb-4 mb-6">Write a Review</h3>
                    <div className="grid gap-8">
                      {bookings.filter(b => ["active", "completed"].includes((b.status || "").toLowerCase())).map(b => {
                        const eqId = b.equipment_detail?.id || b.equipment;
                        const draft = reviewDrafts[eqId] || { rating: 5, title: "", comment: "" };
                        return (
                          <div key={b.id} className="border border-gray-200 rounded-2xl p-5">
                            <h4 className="font-bold text-[#1d1d1f] mb-3">{b.equipment_detail?.name || "Equipment"}</h4>
                            <div className="flex gap-2 text-2xl text-gray-300 mb-4 cursor-pointer">
                              {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setReviewDrafts({ ...reviewDrafts, [eqId]: { ...draft, rating: n } })} className={`transition-colors ${n <= draft.rating ? 'text-yellow-400' : 'hover:text-yellow-200'}`}>★</button>)}
                            </div>
                            <div className="space-y-3">
                              <input type="text" className="w-full bg-[#f5f5f7] border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all outline-none font-medium text-sm" placeholder="Summarize your experience" value={draft.title} onChange={e => setReviewDrafts({ ...reviewDrafts, [eqId]: { ...draft, title: e.target.value } })} />
                              <textarea className="w-full bg-[#f5f5f7] border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all outline-none min-h-[100px] resize-y font-medium text-sm" placeholder="What did you like or dislike?" value={draft.comment} onChange={e => setReviewDrafts({ ...reviewDrafts, [eqId]: { ...draft, comment: e.target.value } })}></textarea>
                              <button onClick={() => submitReview(eqId)} className="px-6 py-2.5 bg-[#1d1d1f] text-white font-semibold rounded-xl hover:bg-black transition-colors w-full md:w-auto">Submit Review</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "profile" && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/60 max-w-3xl">
                <div className="flex items-center gap-6 mb-8 border-b border-gray-100 pb-8">
                  <div className="w-24 h-24 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center text-4xl font-bold tracking-tight">
                    {profileForm.full_name ? profileForm.full_name[0].toUpperCase() : <FiUser />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mb-1">{profileForm.full_name || "Buyer Account"}</h2>
                    <p className="text-gray-500 font-medium">Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : "2026"}</p>
                  </div>
                </div>

                <form onSubmit={async (e) => { e.preventDefault(); setSavingProfile(true); try { const res = await usersAPI.updateMe(profileForm); setProfile(res); toast.success("Profile updated."); } catch (err) { toast.error(err.message || "Update failed."); } finally { setSavingProfile(false); } }} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Full Name</label>
                      <input type="text" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} className="w-full bg-[#f5f5f7] border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all outline-none font-medium text-sm" placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Phone</label>
                      <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full bg-[#f5f5f7] border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all outline-none font-medium text-sm" placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Bio</label>
                    <textarea value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} className="w-full bg-[#f5f5f7] border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all outline-none font-medium text-sm resize-y" placeholder="Tell us about yourself"></textarea>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Preferred Location</label>
                    <input type="text" value={profileForm.preferred_location} onChange={e => setProfileForm({ ...profileForm, preferred_location: e.target.value })} className="w-full bg-[#f5f5f7] border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all outline-none font-medium text-sm" placeholder="City, State" />
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
                    <button type="submit" disabled={savingProfile} className="px-8 py-3 bg-[#1d1d1f] text-white font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50">{savingProfile ? "Saving..." : "Save Changes"}</button>
                    <span className="text-sm text-gray-400 font-medium flex items-center gap-2"><FiCheckCircle className="text-green-500" /> Verified via Clerk</span>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
