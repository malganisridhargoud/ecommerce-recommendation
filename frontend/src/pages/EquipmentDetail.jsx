import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api, { equipmentAPI, usersAPI } from "../api/axiosConfig";
import BookingForm from "../components/booking/BookingForm";
import { FiChevronRight, FiMapPin, FiHeart, FiShield, FiCheckCircle, FiShoppingCart } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useAppPreferences } from "../context/AppPreferencesContext";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function StarRow({ rating }) {
  const n = Math.min(5, Math.max(0, Number(rating || 0)));
  return (
    <div className="d-flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <FaStar key={i} size={14} color={i <= n ? "#fb923c" : "#e5e7eb"} />
      ))}
    </div>
  );
}

export default function EquipmentDetail() {
  const { id } = useParams();

  const { isSignedIn } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [role, setRole] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [addingCart, setAddingCart] = useState(false);
  const { setCartCount } = useAppPreferences();

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [res, reviewsRes] = await Promise.allSettled([
          api.get(`/equipment/${id}/`),
          equipmentAPI.reviews(id),
        ]);

        if (!mounted) return;

        if (res.status === "fulfilled") setItem(res.value);
        if (reviewsRes.status === "fulfilled") {
          const vals = reviewsRes.value;
          setReviews(Array.isArray(vals) ? vals : vals?.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    async function fetchRole() {
      if (!isSignedIn) { setRole(""); return; }
      try { const me = await usersAPI.me(); setRole(me.role || "buyer"); }
      catch { setRole(""); }
    }
    fetchRole();
  }, [isSignedIn]);

  useEffect(() => {
    let mounted = true;
    async function hydrateWishlist() {
      if (!isSignedIn || !item?.id) return;
      try {
        const list = await equipmentAPI.wishlist();
        if (!mounted) return;
        const normalized = Array.isArray(list) ? list : list?.results || [];
        setWishlisted(normalized.some(e => Number(e.equipment) === Number(item.id)));
      } catch {
        if (mounted) setWishlisted(false);
      }
    }
    hydrateWishlist();
    return () => { mounted = false; };
  }, [isSignedIn, item?.id]);

  const toggleWishlist = async () => {
    if (!isSignedIn) return toast.error("Please sign in first");
    try {
      if (!wishlisted) {
        await equipmentAPI.addToWishlist(item.id);
        setWishlisted(true);
        toast.success("Added to wishlist");
      } else {
        await equipmentAPI.removeFromWishlist(item.id);
        setWishlisted(false);
        toast.success("Removed from wishlist");
      }
    } catch (err) { console.error(err); }
  };


  if (loading) return (
    <div className="bg-white d-flex align-items-center justify-content-center min-vh-100">
      <div className="spinner-border text-brand" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (!item) return (
    <div className="bg-surface d-flex flex-column align-items-center justify-content-center min-vh-100">
      <h2 className="heading-display mb-3 text-center">Equipment entirely elusive.</h2>
      <p className="text-muted-custom mb-5">The gear you are looking for is no longer available.</p>
      <Link to="/" className="btn-apple bg-dark text-white px-4 py-2 text-decoration-none">
        Browse Marketplace
      </Link>
    </div>
  );

  const available = typeof item.is_available === "boolean" ? item.is_available : Number(item.quantity || 0) > 0;
  const rating = item.average_rating || 0;
  const reviewCount = item.review_count || 0;

  return (
    <div className="bg-surface pb-5 min-vh-100">

      {/* Top Banner Area */}
      <div className="bg-white border-bottom">
        <div className="container page-shell">

          {/* Breadcrumbs */}
          <nav className="d-flex align-items-center gap-2 py-3 text-muted-custom fw-medium text-xs">
            <Link to="/" className="text-decoration-none text-muted-custom hover-ink transition-colors">Home</Link>
            <FiChevronRight size={12} />
            <Link to={`/equipment?category=${item.category}`} className="text-decoration-none text-muted-custom hover-ink transition-colors text-uppercase">{item.category}</Link>
            <FiChevronRight size={12} />
            <span className="text-ink text-truncate d-inline-block" style={{ maxWidth: '250px' }}>{item.name}</span>
          </nav>

          {/* Title Area (Mobile only) */}
          <div className="d-md-none py-3 border-top">
            <h1 className="heading-title mb-2">{item.name}</h1>
            <div className="d-flex align-items-center gap-2 text-sm text-muted-custom">
              <span className="fw-semibold text-warning">{rating.toFixed(1)}</span>
              <StarRow rating={rating} />
              <span>({reviewCount})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container page-shell mt-4 mt-md-5">
        <div className="row g-4 g-lg-5 align-items-start">

          {/* Left Column: Image & Details */}
          <div className="col-12 col-lg-7 col-xl-8 d-flex flex-column gap-4 gap-lg-5 position-lg-sticky" style={{ top: '120px' }}>

            {/* Gallery / Main Image */}
            <div className="position-relative w-100 bg-white rounded-3xl overflow-hidden p-3 p-md-5 d-flex align-items-center justify-content-center shadow-sm" style={{ aspectRatio: '4/3', maxHeight: '500px' }}>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-100 h-100 object-contain transition-transform duration-700"
                />
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                  <div className="heading-display mb-2">TapRent</div>
                  <span className="text-sm fw-medium">No Image Provided</span>
                </div>
              )}

              <div className="position-absolute top-0 start-0 m-4 d-flex flex-column gap-2">
                {available ? (
                  <span className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill border bg-white bg-opacity-90 text-success fw-semibold tracking-wide text-uppercase shadow-sm text-2xs glass-surface">
                    <span className="rounded-circle bg-success animate-pulse" style={{ width: '6px', height: '6px' }}></span> In Stock
                  </span>
                ) : (
                  <span className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill border bg-white bg-opacity-90 text-danger fw-semibold tracking-wide text-uppercase shadow-sm text-2xs glass-surface">
                    <span className="rounded-circle bg-danger" style={{ width: '6px', height: '6px' }}></span> Unavailable
                  </span>
                )}
              </div>
            </div>

            {/* Apple-style Tab Navigation */}
            <div className="bg-white rounded-3xl p-4 p-md-5 border shadow-sm">
              <div className="d-flex gap-4 border-bottom pb-2 mb-4 overflow-auto no-scrollbar">
                {["overview", "specifications", "reviews"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`btn btn-link text-decoration-none pb-2 text-sm fw-semibold tracking-wide text-uppercase transition-colors text-nowrap rounded-0 border-0 border-bottom ${activeTab === tab ? "border-ink text-ink" : "border-transparent text-muted-custom hover-ink"}`}
                    style={{ borderBottomWidth: '2px' }}
                  >
                    {tab} {tab === "reviews" && `(${reviews.length})`}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-fade-in">
                {activeTab === "overview" && (
                  <div className="text-ink leading-relaxed text-sm">
                    <p className="white-space-pre-wrap mb-4">{item.description || "No detailed description provided for this equipment."}</p>

                    <div className="row g-3 mt-4 pt-4 border-top">
                      <div className="col-12 col-sm-6">
                        <div className="d-flex align-items-start gap-3 p-3 rounded-2xl bg-surface">
                          <FiShield className="text-brand flex-shrink-0 mt-1" size={24} />
                          <div>
                            <h4 className="fw-semibold text-sm mb-1">TapRent Guarantee</h4>
                            <p className="text-xs text-muted-custom mb-0">Your rental is protected against fraud and item misrepresentation.</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="d-flex align-items-start gap-3 p-3 rounded-2xl bg-surface">
                          <FiCheckCircle className="text-success flex-shrink-0 mt-1" size={24} />
                          <div>
                            <h4 className="fw-semibold text-sm mb-1">Verified Vendor</h4>
                            <p className="text-xs text-muted-custom mb-0">{item.vendor_name || "This vendor has passed identity verification."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "specifications" && (
                  <div className="text-sm">
                    {[
                      { l: "Category", v: item.category },
                      { l: "Base Location", v: item.location || "Multiple" },
                      { l: "Stock Quantity", v: `${item.quantity || 0} Units` },
                      { l: "Refundable Deposit", v: formatCurrency(item.deposit_amount || 0) },
                    ].map((row, i) => (
                      <div key={i} className={`d-flex justify-content-between py-3 px-3 rounded-xl ${i % 2 === 0 ? 'bg-surface' : ''}`}>
                        <span className="fw-semibold text-muted-custom w-50">{row.l}</span>
                        <span className="fw-medium text-ink w-50 text-end">{row.v}</span>
                      </div>
                    ))}

                    {item.specifications && Object.keys(item.specifications).length > 0 && (
                      <div className="mt-4 pt-4 border-top">
                        <h4 className="heading-subtitle mb-3">Technical Details</h4>
                        {Object.entries(item.specifications).map(([k, v], i) => (
                          <div key={i} className="d-flex justify-content-between py-2 border-bottom">
                            <span className="fw-semibold text-muted-custom w-50 text-truncate">{k}</span>
                            <span className="fw-medium text-ink w-50 text-end">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div>
                    {reviews.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted-custom fw-medium">Be the first to review this equipment after a successful rental.</p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-4">
                        {reviews.map((r, i) => (
                          <div key={r.id} className="p-4 rounded-3xl bg-surface animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h5 className="fw-bold text-ink text-sm mb-0">{r.reviewer_name || "TapRent User"}</h5>
                                <p className="text-xs text-muted-custom mt-1 mb-0">{new Date(r.created_at).toLocaleDateString()}</p>
                              </div>
                              <StarRow rating={r.rating} />
                            </div>
                            <h6 className="fw-semibold text-ink mb-1 text-sm">{r.title}</h6>
                            <p className="text-sm leading-relaxed mb-0 text-muted-2">{r.comment}</p>

                            {/* Vendor Reply */}
                            {r.vendor_reply && (
                              <div className="mt-3 p-3 rounded-xl bg-white border position-relative">
                                <span className="position-absolute bg-white text-brand fw-bold text-uppercase tracking-wider px-2 text-2xs" style={{ top: '-8px', left: '16px' }}>Vendor Response</span>
                                <p className="text-sm text-ink mb-0">{r.vendor_reply}</p>
                              </div>
                            )}

                            {/* Comment Thread */}
                            {r.comments && r.comments.length > 0 && (
                              <div className="mt-3 ms-3 ps-3 border-start border-2 d-flex flex-column gap-2">
                                {r.comments.map((c) => (
                                  <div key={c.id} className="d-flex align-items-start gap-2">
                                    <div className="rounded-circle bg-surface border d-flex align-items-center justify-content-center fw-bold text-muted-custom flex-shrink-0 mt-1 text-2xs" style={{ width: '28px', height: '28px' }}>
                                      {(c.commenter_name || "U")[0].toUpperCase()}
                                    </div>
                                    <div className="flex-grow-1 min-w-0">
                                      <p className="text-sm mb-0">
                                        <span className="fw-bold text-ink">{c.commenter_name || "User"}</span>
                                        {" "}<span className="leading-relaxed text-muted-2">{c.comment}</span>
                                      </p>
                                      <p className="text-muted-custom fw-medium mb-0 text-xs">{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
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
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="col-12 col-lg-5 col-xl-4 position-lg-sticky" style={{ top: '120px' }}>

            {/* Title Block (Desktop) */}
            <div className="d-none d-md-block mb-4 px-2">
              <span className="fw-bold text-brand tracking-widest text-uppercase d-block mb-2 text-xs">{item.category}</span>
              <h1 className="heading-hero tracking-tight mb-3">
                {item.name}
              </h1>

              <div className="d-flex align-items-center gap-3 text-sm fw-medium">
                <div className="d-flex align-items-center gap-1 text-ink">
                  <FaStar className="text-warning" size={16} />
                  <span className="fs-6">{rating.toFixed(1)}</span>
                  <button onClick={() => setActiveTab("reviews")} className="btn btn-link p-0 text-brand text-decoration-none hover-underline ms-1">
                    See {reviewCount} reviews
                  </button>
                </div>
                <div className="bg-secondary" style={{ width: '1px', height: '16px' }}></div>
                <div className="d-flex align-items-center gap-1 text-muted-custom">
                  <FiMapPin size={16} /> {item.location || "Multiple locations"}
                </div>
              </div>
            </div>

            {/* Main Action Card */}
            <div className="card-elevated position-sticky" style={{ top: '16px' }}>

              <div className="mb-4 border-bottom pb-4">
                <span className="text-sm fw-semibold text-muted-custom text-uppercase tracking-wider d-block mb-1">Rental Rate</span>
                <div className="d-flex align-items-end gap-1 fw-bold text-ink">
                  <span className="heading-display mb-0">{formatCurrency(item.price_per_day)}</span>
                  <span className="text-base pb-1 text-muted-custom fw-medium">/ day</span>
                </div>
              </div>

              {/* Interaction Buttons (Contact/Wishlist) */}
              <div className="mb-4">
                <button
                  onClick={toggleWishlist}
                  className={`btn w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-xl fw-semibold transition-colors ${wishlisted ? "bg-danger bg-opacity-10 text-danger border-0" : "bg-surface text-ink hover-bg-surface-w border"}`}
                >
                  <FiHeart className={wishlisted ? "fill-current" : ""} size={20} />
                  <span className="text-sm">{wishlisted ? "Saved" : "Save"}</span>
                </button>
              </div>

              {/* Booking Engine */}
              {role === "vendor" ? (
                <div className="bg-warning bg-opacity-10 rounded-2xl p-3 text-center border border-warning">
                  <p className="text-sm text-dark fw-medium mb-0">You are logged in as a Vendor. Only Buyer accounts can place bookings.</p>
                </div>
              ) : (
                <>
                  <BookingForm equipment={item} />

                  {/* Add to Cart Button */}
                  <button
                    onClick={async () => {
                      if (!isSignedIn) return toast.error("Please sign in first");
                      setAddingCart(true);
                      try {
                        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                        const weekLater = new Date(); weekLater.setDate(weekLater.getDate() + 8);
                        const fmt = d => d.toISOString().split("T")[0];
                        await equipmentAPI.addToCart({ equipment_id: item.id, quantity: 1, start_date: fmt(tomorrow), end_date: fmt(weekLater) });
                        const cart = await equipmentAPI.cart();
                        setCartCount(Array.isArray(cart) ? cart.reduce((a, c) => a + c.quantity, 0) : 0);
                        toast.success("Added to cart!");
                      } catch (err) {
                        toast.error(err?.message || "Could not add to cart.");
                      } finally { setAddingCart(false); }
                    }}
                    disabled={!available || addingCart}
                    className="btn-apple bg-dark text-white w-100 mt-3 d-flex align-items-center justify-content-center gap-2 text-sm"
                  >
                    <FiShoppingCart size={20} />
                    {addingCart ? "Adding..." : "Add to Cart"}
                  </button>
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
