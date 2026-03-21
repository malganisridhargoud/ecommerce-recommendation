import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api, { chatAPI, equipmentAPI, recommendationsAPI, usersAPI } from "../api/axiosConfig";
import BookingForm from "../components/booking/BookingForm";
import EquipmentCard from "../components/equipment/EquipmentCard";
import { FiChevronRight, FiMapPin, FiHeart, FiMessageSquare, FiShield, FiCheckCircle, FiShoppingCart } from "react-icons/fi";
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
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <FaStar key={i} className={`w-3.5 h-3.5 ${i <= n ? "text-orange-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState([]);
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
        const [res, recsRes, reviewsRes] = await Promise.allSettled([
          api.get(`/equipment/${id}/`),
          recommendationsAPI.similar(id),
          equipmentAPI.reviews(id),
        ]);

        if (!mounted) return;

        if (res.status === "fulfilled") setItem(res.value);
        if (recsRes.status === "fulfilled") setRecs(recsRes.value || []);
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
      catch { setRole(""); }  // Disable button if role fetch fails
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

  const startChat = async () => {
    if (!isSignedIn) return toast.error("Please sign in first");
    if (!role) return toast.error("Loading user information...");
    if (role === "vendor") {
      return toast.error("Vendors cannot start conversations with themselves.");
    }
    try {
      const thread = await chatAPI.createThread(item.id);
      navigate(`/buyer?tab=chat&thread=${thread.id}`);
    } catch (err) {
      toast.error(err.message || "Failed to start chat.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-100 border-t-[#0071e3] rounded-full animate-spin"></div>
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center">
      <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mb-4">Equipment entirely elusive.</h2>
      <p className="text-[#86868b] mb-8">The gear you are looking for is no longer available.</p>
      <Link to="/" className="px-6 py-2.5 bg-[#1d1d1f] text-white rounded-full font-medium hover:bg-black transition-colors">
        Browse Marketplace
      </Link>
    </div>
  );

  const available = typeof item.is_available === "boolean" ? item.is_available : Number(item.quantity || 0) > 0;
  const rating = item.average_rating || 0;
  const reviewCount = item.review_count || 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 font-sans selection:bg-[#0071e3] selection:text-white">

      {/* Top Banner Area */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 py-4 text-[12px] font-medium text-[#86868b]">
            <Link to="/" className="hover:text-[#1d1d1f] transition-colors">Home</Link>
            <FiChevronRight className="w-3 h-3" />
            <Link to={`/equipment?category=${item.category}`} className="hover:text-[#1d1d1f] transition-colors uppercase">{item.category}</Link>
            <FiChevronRight className="w-3 h-3" />
            <span className="text-[#1d1d1f] truncate max-w-[200px]">{item.name}</span>
          </nav>

          {/* Title Area (Mobile only) */}
          <div className="md:hidden py-4 border-t border-gray-100">
            <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight leading-tight mb-2">{item.name}</h1>
            <div className="flex items-center gap-2 text-sm text-[#86868b]">
              <span className="font-semibold text-orange-500">{rating.toFixed(1)}</span>
              <StarRow rating={rating} />
              <span>({reviewCount})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-6 md:mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: Image & Details */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8 lg:sticky lg:top-[120px]">

            {/* Gallery / Main Image */}
            <div className="relative aspect-[4/3] w-full bg-white rounded-3xl overflow-hidden p-4 md:p-10 flex items-center justify-center group" style={{ boxShadow: 'var(--shadow-md)' }}>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-contain transition-transform duration-700 max-h-[500px]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <div className="text-4xl font-bold mb-2">TapRent</div>
                  <span className="text-sm font-medium">No Image Provided</span>
                </div>
              )}

              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {available ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 text-xs font-semibold tracking-wide text-green-700 shadow-sm uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 text-xs font-semibold tracking-wide text-red-600 shadow-sm uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Unavailable
                  </span>
                )}
              </div>
            </div>

            {/* Apple-style Tab Navigation */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200/60">
              <div className="flex gap-6 border-b border-gray-100 pb-2 mb-8 overflow-x-auto no-scrollbar">
                {["overview", "specifications", "reviews"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm font-semibold tracking-wide uppercase transition-colors whitespace-nowrap border-b-2 ${activeTab === tab ? "border-[#1d1d1f] text-[#1d1d1f]" : "border-transparent text-[#86868b] hover:text-[#1d1d1f]"}`}
                  >
                    {tab} {tab === "reviews" && `(${reviews.length})`}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-fade-in">
                {activeTab === "overview" && (
                  <div className="space-y-6 text-[#1d1d1f] text-[15px] leading-relaxed">
                    <p className="whitespace-pre-wrap">{item.description || "No detailed description provided for this equipment."}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f5f5f7]">
                        <FiShield className="w-6 h-6 text-[#0071e3] shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">TapRent Guarantee</h4>
                          <p className="text-xs text-[#86868b]">Your rental is protected against fraud and item misrepresentation.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f5f5f7]">
                        <FiCheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Verified Vendor</h4>
                          <p className="text-xs text-[#86868b]">{item.vendor_name || "This vendor has passed identity verification."}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "specifications" && (
                  <div className="space-y-0 text-sm">
                    {[
                      { l: "Category", v: item.category },
                      { l: "Base Location", v: item.location || "Multiple" },
                      { l: "Stock Quantity", v: `${item.quantity || 0} Units` },
                      { l: "Refundable Deposit", v: formatCurrency(item.deposit_amount || 0) },
                    ].map((row, i) => (
                      <div key={i} className={`flex justify-between py-4 px-4 rounded-xl ${i % 2 === 0 ? 'bg-[#f5f5f7]' : ''}`}>
                        <span className="font-semibold text-[#86868b] w-1/3">{row.l}</span>
                        <span className="font-medium text-[#1d1d1f] w-2/3">{row.v}</span>
                      </div>
                    ))}

                    {item.specifications && Object.keys(item.specifications).length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="font-bold text-lg mb-4">Technical Details</h4>
                        {Object.entries(item.specifications).map(([k, v], i) => (
                          <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-none">
                            <span className="font-semibold text-[#86868b] w-1/3 truncate">{k}</span>
                            <span className="font-medium text-[#1d1d1f] w-2/3">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-6">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-[#86868b] font-medium">Be the first to review this equipment after a successful rental.</p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {reviews.map((r, i) => (
                          <div key={r.id} className="p-6 rounded-3xl bg-[#f5f5f7] animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-bold text-[#1d1d1f] text-sm">{r.reviewer_name || "TapRent User"}</h5>
                                <p className="text-xs text-[#86868b] mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                              </div>
                              <StarRow rating={r.rating} />
                            </div>
                            <h6 className="font-semibold text-[15px] text-[#1d1d1f] mb-1">{r.title}</h6>
                            <p className="text-sm text-[#333336] leading-relaxed">{r.comment}</p>

                            {/* Vendor Reply */}
                            {r.vendor_reply && (
                              <div className="mt-4 p-4 rounded-xl bg-white border border-gray-200 relative">
                                <span className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-[#0071e3] uppercase tracking-wider">Vendor Response</span>
                                <p className="text-sm text-[#1d1d1f]">{r.vendor_reply}</p>
                              </div>
                            )}

                            {/* Comment Thread — Instagram-style */}
                            {r.comments && r.comments.length > 0 && (
                              <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200 space-y-3">
                                {r.comments.map((c) => (
                                  <div key={c.id} className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#f5f5f7] border border-gray-200 flex items-center justify-center text-[10px] font-bold text-[#86868b] shrink-0 mt-0.5">
                                      {(c.commenter_name || "U")[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm">
                                        <span className="font-bold text-[#1d1d1f]">{c.commenter_name || "User"}</span>
                                        {" "}<span className="text-[#333336] leading-relaxed">{c.comment}</span>
                                      </p>
                                      <p className="text-[11px] text-[#86868b] mt-1 font-medium">{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
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
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-[120px]">

            {/* Title Block (Desktop) */}
            <div className="hidden md:block mb-8 px-2">
              <span className="text-xs font-bold text-[#0071e3] tracking-widest uppercase mb-2 block">{item.category}</span>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-[1.1] mb-4">
                {item.name}
              </h1>

              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1.5 text-[#1d1d1f]">
                  <FaStar className="text-orange-400 w-4 h-4" />
                  <span className="text-base">{rating.toFixed(1)}</span>
                  <button onClick={() => setActiveTab("reviews")} className="text-[#0071e3] hover:underline ml-1">
                    See {reviewCount} reviews
                  </button>
                </div>
                <div className="w-[1px] h-4 bg-gray-300"></div>
                <div className="flex items-center gap-1.5 text-[#86868b]">
                  <FiMapPin className="w-4 h-4" /> {item.location || "Multiple locations"}
                </div>
              </div>
            </div>

            {/* Main Action Card */}
            <div className="bg-white rounded-3xl p-6 sticky top-4" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

              <div className="mb-8 border-b border-gray-100 pb-6">
                <span className="text-sm font-semibold text-[#86868b] uppercase tracking-wider block mb-1">Rental Rate</span>
                <div className="flex items-end gap-1 font-bold text-[#1d1d1f]">
                  <span className="text-4xl tracking-tight">{formatCurrency(item.price_per_day)}</span>
                  <span className="text-lg pb-1 text-[#86868b] font-medium">/ day</span>
                </div>
              </div>

              {/* Interaction Buttons (Contact/Wishlist) */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button
                  onClick={toggleWishlist}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold transition-colors ${wishlisted ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"}`}
                >
                  <FiHeart className={`w-5 h-5 ${wishlisted ? "fill-current" : ""}`} />
                  <span className="text-sm">{wishlisted ? "Saved" : "Save"}</span>
                </button>

                <button
                  onClick={startChat}
                  disabled={!isSignedIn || !role || role === "vendor"}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold transition-colors ${!isSignedIn || !role || role === "vendor"
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  <FiMessageSquare className="w-5 h-5" />
                  <span className="text-sm">Contact</span>
                </button>
              </div>

              {/* Booking Engine */}
              {role === "vendor" ? (
                <div className="bg-orange-50 rounded-2xl p-5 text-center border border-orange-100">
                  <p className="text-sm text-orange-800 font-medium">You are logged in as a Vendor. Only Buyer accounts can place bookings.</p>
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
                    className="mt-4 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-[15px] bg-[#1d1d1f] text-white hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <FiShoppingCart className="w-5 h-5" />
                    {addingCart ? "Adding..." : "Add to Cart"}
                  </button>
                </>
              )}

            </div>
          </div>

        </div>

        {/* Bottom Recommendations */}
        {recs.length > 0 && (
          <div className="mt-24 pt-16 border-t border-gray-100">
            <p className="text-[#0071e3] font-semibold text-[13px] tracking-wide uppercase mb-2">You might also like</p>
            <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-[#1d1d1f] mb-10 leading-[1.1]">Similar Equipment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {recs.slice(0, 4).map((rec, idx) => (
                <div key={rec.id} className="animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <EquipmentCard equipment={rec} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
