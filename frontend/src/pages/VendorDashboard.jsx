import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import VendorEquipmentForm from "../components/vendor/VendorEquipmentForm";
import { analyticsAPI, bookingsAPI, chatAPI, equipmentAPI, paymentsAPI, vendorAPI } from "../api/axiosConfig";
import { openBookingSocket } from "../lib/realtime";
import { FiTrendingUp, FiPackage, FiBox, FiMessageSquare, FiSettings, FiPlus, FiStar, FiCheckCircle, FiXCircle, FiClock, FiSend, FiTruck, FiZap, FiAward, FiBarChart2, FiShield } from "react-icons/fi";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function describeSocketClose(code) {
  if (code === 4401) return "Realtime auth failed. Sign out and sign back in to refresh your Clerk token.";
  if (code === 4403) return "Realtime access denied. Your vendor role or user identity did not match the socket session.";
  if (code === 4404) return "Realtime route was not found on the backend.";
  if (code === 1006) return "Realtime connection dropped before the socket could fully open.";
  if (code === 1008) return "Realtime connection was rejected by backend policy.";
  if (code === 1011) return "Realtime server error. Check the Django ASGI/Channels process.";
  return code ? `Realtime disconnected with code ${code}.` : "Realtime connection is unavailable right now.";
}

function PremiumStatCard({ label, value, icon, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#5b4a21] bg-[linear-gradient(160deg,#18140d,#251d11)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(115deg,transparent_20%,rgba(255,222,122,0.08)_45%,transparent_70%)] animate-[premiumShimmer_1.8s_linear_infinite]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c8b06d] mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: <FiTrendingUp /> },
  { id: "orders", label: "Orders", icon: <FiPackage /> },
  { id: "products", label: "Listings", icon: <FiBox /> },
  { id: "reviews", label: "Reviews", icon: <FiStar /> },
  { id: "chat", label: "Messages", icon: <FiMessageSquare /> },
  { id: "settings", label: "Settings", icon: <FiSettings /> },
];

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/40 text-green-400 text-xs font-bold uppercase tracking-wider border border-green-800"><FiCheckCircle className="w-3.5 h-3.5" /> Completed</span>;
  if (s === "delivered") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-800"><FiCheckCircle className="w-3.5 h-3.5" /> Delivered</span>;
  if (s === "shipped") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-800"><FiTruck className="w-3.5 h-3.5 animate-pulse" /> Shipped</span>;
  if (s === "confirmed") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-900/40 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-800"><FiCheckCircle className="w-3.5 h-3.5" /> Confirmed</span>;
  if (s === "active") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/40 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-800"><FiClock className="w-3.5 h-3.5 animate-pulse" /> Active</span>;
  if (s === "cancelled") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/40 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-800"><FiXCircle className="w-3.5 h-3.5" /> Cancelled</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900/40 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-800"><FiClock className="w-3.5 h-3.5" /> Pending</span>;
}

export default function VendorDashboard() {
  const { userId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [vendorReviews, setVendorReviews] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [reviewComments, setReviewComments] = useState({});
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [settingsForm, setSettingsForm] = useState({ company_name: "", email: "", phone: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [liveStatusText, setLiveStatusText] = useState("Connecting to realtime updates...");
  const [liveRetryCount, setLiveRetryCount] = useState(0);
  const [activatingPlan, setActivatingPlan] = useState(false);
  const [confirmingPlan, setConfirmingPlan] = useState(false);
  const [recentlyActivated, setRecentlyActivated] = useState(false);
  const [createdListingId, setCreatedListingId] = useState(null);
  const [listingFormVersion, setListingFormVersion] = useState(0);

  const stats = useMemo(
    () => ({
      revenue: Number(analytics?.total_revenue || 0),
      totalBookings: Number(analytics?.total_bookings || 0),
      avgBookingValue: Number(analytics?.avg_booking_value || 0),
      activeProducts: products.filter((p) => p.is_active).length,
    }),
    [analytics, products]
  );
  const subscriptionLocked = Boolean(vendor) && !vendor.subscription_active;
  const unlockedFeatures = [
    "Publish and unpublish listings instantly",
    "Create sample inventory and full vendor catalog",
    "Realtime booking updates in operations view",
    "Growth-plan badge and conversion-ready storefront presence",
  ];
  const isGrowthPlan = Boolean(vendor?.subscription_active);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [v, vendorBookings, myProducts, a, ts, reviews] = await Promise.all([
        vendorAPI.profile().catch(() => null),
        bookingsAPI.vendorBookings(),
        equipmentAPI.mine(),
        analyticsAPI.vendor().catch(() => null),
        chatAPI.threads().catch(() => []),
        equipmentAPI.vendorReviews().catch(() => []),
      ]);
      setVendor(v);
      if (v) setSettingsForm({ company_name: v.company_name || "", email: v.email || "", phone: v.phone || "" });
      setBookings(Array.isArray(vendorBookings) ? vendorBookings : vendorBookings?.results || []);
      setProducts(Array.isArray(myProducts) ? myProducts : myProducts?.results || []);
      setAnalytics(a);
      const reviewList = Array.isArray(reviews) ? reviews : reviews?.results || [];
      setVendorReviews(reviewList);
      setReplyDrafts({});
      // Load comments for each review
      const commentsMap = {};
      await Promise.all(
        reviewList.map(async (r) => {
          try {
            const c = await equipmentAPI.reviewComments(r.id);
            commentsMap[r.id] = Array.isArray(c) ? c : c?.results || [];
          } catch { commentsMap[r.id] = []; }
        })
      );
      setReviewComments(commentsMap);
      const threadList = Array.isArray(ts) ? ts : ts?.results || [];
      setThreads(threadList);
      if (threadList.length && !selectedThread) setSelectedThread(threadList[0]);
    } catch (err) {
      toast.error(err.message || "Vendor dashboard load failed.");
    } finally {
      setLoading(false);
    }
  }, [selectedThread]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedThread?.id) return;
      try {
        const data = await chatAPI.messages(selectedThread.id);
        setMessages(Array.isArray(data) ? data : data?.results || []);
      } catch { setMessages([]); }
    }
    loadMessages();
  }, [selectedThread]);

  useEffect(() => {
    if (!selectedThread?.id) return;
    const timer = setInterval(async () => {
      try {
        const data = await chatAPI.messages(selectedThread.id);
        setMessages(Array.isArray(data) ? data : data?.results || []);
      } catch { /* ignore polling errors */ }
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedThread?.id]);

  useEffect(() => {
    let socket = null;
    let cancelled = false;
    let reconnectTimer = null;
    let retryAttempt = 0;

    async function connect() {
      if (!userId || cancelled) return;
      setLiveStatusText(retryAttempt === 0 ? "Connecting to realtime updates..." : `Reconnecting to realtime updates... (attempt ${retryAttempt})`);
      socket = await openBookingSocket({
        role: "vendor",
        userId,
        onOpen: () => {
          if (cancelled) return;
          retryAttempt = 0;
          setLiveConnected(true);
          setLiveRetryCount(0);
          setLiveStatusText("Realtime booking updates are live.");
        },
        onClose: (event) => {
          if (cancelled) return;
          setLiveConnected(false);
          setLiveStatusText(describeSocketClose(event?.code));
          retryAttempt += 1;
          setLiveRetryCount(retryAttempt);
          const delay = Math.min(1000 * (2 ** Math.max(retryAttempt - 1, 0)), 10000);
          reconnectTimer = setTimeout(() => {
            connect();
          }, delay);
        },
        onError: () => {
          if (cancelled) return;
          setLiveConnected(false);
          setLiveStatusText("Realtime socket error. Waiting to retry...");
        },
        onMessage: (payload) => {
          if (!payload || payload.type !== "booking.event" || !payload.booking) return;
          setBookings((current) => {
            const existing = Array.isArray(current) ? [...current] : [];
            const next = payload.booking;
            const idx = existing.findIndex((item) => item.id === next.id);
            if (idx >= 0) existing[idx] = next;
            else existing.unshift(next);
            return existing;
          });
          setLiveEvents((current) => [
            {
              id: `${payload.booking.id}-${payload.timestamp || Date.now()}`,
              bookingId: payload.booking.id,
              status: payload.booking.status,
              actor: payload.actor || "system",
              equipmentName: payload.booking?.equipment_detail?.name || "Equipment",
              timestamp: payload.timestamp || new Date().toISOString(),
            },
            ...current,
          ].slice(0, 6));
          toast.success(`Live update: booking #${payload.booking.id} is now ${payload.booking.status}.`);
        },
      });
    }

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket && socket.readyState < 2) socket.close();
    };
  }, [userId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");
    const sessionId = params.get("session_id") || localStorage.getItem("vendor_checkout_session_id");

    if (canceled === "true") {
      localStorage.removeItem("vendor_checkout_session_id");
      toast.error("Subscription checkout was canceled.");
      navigate("/vendor", { replace: true });
      return;
    }

    // Persistent Activation Logic:
    // If we have a sessionId (from URL or localStorage) and the vendor is not yet active,
    // we must try to confirm activation.
    if (!sessionId || !userId || (vendor && vendor.subscription_active)) {
      if (vendor?.subscription_active) localStorage.removeItem("vendor_checkout_session_id");
      return;
    }

    let cancelled = false;
    let attempt = 0;

    async function confirmActivation() {
      setConfirmingPlan(true);
      try {
        const confirmed = await paymentsAPI.confirmSubscriptionSession(sessionId);
        if (confirmed?.subscription_active) {
          if (!cancelled) {
            setVendor(confirmed.vendor || {
              ...vendor,
              subscription_active: true,
              subscription_id: confirmed.subscription_id,
            });
            localStorage.removeItem("vendor_checkout_session_id");
            setRecentlyActivated(true);
            setTab("products");
            toast.success("Growth plan activated. Listing tools are now unlocked.");
            loadDashboard();
            navigate("/vendor", { replace: true });
            setConfirmingPlan(false);
            return;
          }
        }
      } catch {
        // fall back to short polling below if webhook/Stripe state is still settling
      }

      while (!cancelled && attempt < 12) {
        attempt += 1;
        try {
          const profile = await vendorAPI.profile();
          if (profile?.subscription_active) {
            setVendor(profile);
            localStorage.removeItem("vendor_checkout_session_id");
            setRecentlyActivated(true);
            setTab("products");
            toast.success("Growth plan activated. Listing tools are now unlocked.");
            navigate("/vendor", { replace: true });
            setConfirmingPlan(false);
            return;
          }
        } catch {
          // keep retrying briefly
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!cancelled) {
        toast("Payment recorded. Still waiting for Stripe to sync account status...", { icon: "⏳" });
        setConfirmingPlan(false);
        // We do NOT navigate away or clear localStorage here, allowing the user to 
        // manually refresh or wait on this page.
      }
    }

    confirmActivation();
    return () => {
      cancelled = true;
    };
  }, [location.search, navigate, userId, vendor]);

  useEffect(() => {
    if (tab !== "products" || !createdListingId || !products.length) return;
    const listing = products.find((item) => String(item.id) === String(createdListingId));
    if (!listing) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(`vendor-listing-${createdListingId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => clearTimeout(timer);
  }, [tab, createdListingId, products]);

  const toggleProductLive = async (product) => {
    if (subscriptionLocked && !product.is_active) {
      toast.error("Activate a subscription before publishing listings.");
      return;
    }
    try {
      await equipmentAPI.update(product.id, { is_active: !product.is_active });
      toast.success(`Listing ${!product.is_active ? "published" : "unlisted"} successfully.`);
      loadDashboard();
    } catch (err) { toast.error(err.message || "Unable to update listing visibility."); }
  };

  const updateInventory = async (productId, quantity) => {
    try {
      await equipmentAPI.update(productId, { quantity: Number(quantity) });
      toast.success("Inventory updated.");
      loadDashboard();
    } catch (err) { toast.error(err.message || "Inventory update failed."); }
  };

  const updateBookingStatus = async (bookingId, action) => {
    try {
      await bookingsAPI.vendorAction(bookingId, action);
      toast.success(`Booking ${action}ed.`);
      loadDashboard();
    } catch (err) { toast.error(err.message || "Booking update failed."); }
  };

  const sendMessage = async () => {
    if (!selectedThread?.id || !newMessage.trim()) return;
    try {
      await chatAPI.sendMessage(selectedThread.id, { message: newMessage.trim() });
      setNewMessage("");
      const data = await chatAPI.messages(selectedThread.id);
      setMessages(Array.isArray(data) ? data : data?.results || []);
    } catch (err) { toast.error(err.message || "Message send failed."); }
  };

  const saveReply = async (reviewId) => {
    const text = (replyDrafts[reviewId] || "").trim();
    if (!text) return;
    try {
      await equipmentAPI.addReviewComment(reviewId, { comment: text });
      toast.success("Reply posted.");
      setReplyDrafts((d) => ({ ...d, [reviewId]: "" }));
      // Refresh comments for this review
      const c = await equipmentAPI.reviewComments(reviewId);
      setReviewComments((prev) => ({ ...prev, [reviewId]: Array.isArray(c) ? c : c?.results || [] }));
    } catch (err) { toast.error(err.message || "Reply failed."); }
  };

  const seedProducts = async () => {
    if (subscriptionLocked) {
      toast.error("Activate a subscription before creating listings.");
      return;
    }
    try {
      const res = await equipmentAPI.seedVendorProducts();
      toast.success(res.message || "Sample products synced.");
      loadDashboard();
    } catch (err) { toast.error(err.message || "Unable to seed products."); }
  };

  const activateSubscription = async () => {
    setActivatingPlan(true);
    try {
      const response = await paymentsAPI.createCheckout();
      if (response?.url) {
        if (response.session_id) {
          localStorage.setItem("vendor_checkout_session_id", response.session_id);
        }
        window.location.href = response.url;
        return;
      }
      toast.error("Unable to start subscription checkout.");
    } catch (err) {
      toast.error(err.message || "Subscription checkout failed.");
    } finally {
      setActivatingPlan(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#111113] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gray-800 border-t-[#0a84ff] rounded-full animate-spin"></div>
    </div>
  );

  const pendingOrders = bookings.filter(b => b.status === "pending").length;

  return (
    <div className={`min-h-screen pb-24 font-sans selection:text-white ${isGrowthPlan ? "bg-[#09090b] text-white selection:bg-[#d4af37]" : "bg-[#0f1115] text-white selection:bg-[#0071e3]"}`}>
      {isGrowthPlan && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.07)_0%,transparent_70%)] blur-[80px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_70%)] blur-[80px]"></div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 md:pt-12 relative z-10">

        {/* Pro Hero Banner */}
        <div className={`rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden ${isGrowthPlan ? "border border-[#c89d3d] bg-[linear-gradient(135deg,#fffdfa,#fff6de_32%,#eef6ff_64%,#fff8e8)] shadow-[0_22px_80px_rgba(201,154,52,0.18),0_0_0_1px_rgba(200,157,61,0.28)]" : "border border-[#1f2937] bg-[linear-gradient(135deg,#161a22,#10151d_52%,#0f141b)]"}`} style={{ boxShadow: isGrowthPlan ? '0 22px 65px rgba(201,154,52,0.18)' : '0 16px 50px rgba(0,0,0,0.32)' }}>
          <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none ${isGrowthPlan ? "bg-gradient-to-br from-[#f6d57a]/26 via-[#d4af37]/18 to-transparent" : "bg-gradient-to-br from-[#0a84ff]/20 to-transparent"}`}></div>
          {isGrowthPlan && <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_18%,rgba(212,175,55,0.12)_45%,transparent_72%)] animate-[premiumShimmer_3.4s_linear_infinite]" />}

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${liveConnected ? "bg-[#32d74b] shadow-[0_0_10px_rgba(50,215,75,0.6)]" : "bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.35)]"}`}></span>
                <span className={`text-[10px] font-bold tracking-widest uppercase ${liveConnected ? "text-[#32d74b]" : "text-[#f59e0b]"}`}>{liveConnected ? "Realtime Updates Live" : "Connecting..."}</span>
              </div>
              <h1 className={`text-4xl md:text-5xl font-bold tracking-tight mb-2 ${isGrowthPlan ? "text-black" : "text-black"}`}>
                {vendor?.company_name || vendor?.email?.split('@')[0] || "Seller Dashboard"}
              </h1>
              <p className={`text-lg ${isGrowthPlan ? "text-gray-400" : "text-gray-400"}`}>
                {isGrowthPlan
                  ? "Premium vendor fleet operations console."
                  : "Manage your rental fleet and track business performance."}
              </p>
            </div>
            {subscriptionLocked ? (
              <div className={`rounded-2xl border px-5 py-4 min-w-[260px] shadow-sm ${isGrowthPlan ? "border-[#d4af37] bg-[#1a1a1c]" : "border-[#1f2937] bg-[#11151c]"}`}>
                <div className={`text-[10px] font-bold uppercase tracking-[0.28em] mb-2 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#60a5fa]"}`}>Plan enforcement</div>
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isGrowthPlan ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-100"}`}>
                    Publishing locked
                  </span>
                  <button onClick={activateSubscription} disabled={activatingPlan || confirmingPlan} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black hover:bg-[#c19e31]" : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"}`}>
                    <FiZap className="w-4 h-4" />
                    {activatingPlan ? "..." : confirmingPlan ? "Wait" : "Upgrade"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#d4af37] bg-[#1a1a1c] px-5 py-4 min-w-[260px] shadow-[0_14px_36px_rgba(212,175,55,0.12)]">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#d4af37] mb-2">Growth plan active</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30">
                    Premium Unlocked
                  </span>
                  <span className="text-xs font-semibold text-gray-400">{recentlyActivated ? "Just activated" : "Secured"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {subscriptionLocked && (
          <div className={`mb-8 rounded-3xl border p-6 shadow-sm transition-all ${isGrowthPlan ? "border-[#d4af37]/30 bg-[#18181b]" : "border-[#1f2937] bg-[#11151c]"}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-[0.3em] ${isGrowthPlan ? "text-[#d4af37]" : "text-[#60a5fa]"}`}>{confirmingPlan ? "Verifying Payment" : "Subscription required"}</p>
                <h2 className={`mt-2 text-2xl font-bold ${isGrowthPlan ? "text-white" : "text-white"}`}>
                  {confirmingPlan ? "Activating your Growth Plan..." : "Unlock full vendor capabilities."}
                </h2>
                <p className={`mt-2 max-w-2xl text-sm ${isGrowthPlan ? "text-gray-400" : "text-gray-400"}`}>
                  {confirmingPlan 
                    ? "We've detected a successful payment tracking ID. We are now synchronizing your status with Stripe. This takes a few seconds..." 
                    : "Standard accounts are restricted from publishing new listings until a Growth Plan is active. You can still manage existing operations and view analytics."
                  }
                </p>
              </div>
              <button onClick={activateSubscription} disabled={activatingPlan || confirmingPlan} className={`inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black hover:bg-[#c19e31]" : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"}`}>
                {confirmingPlan ? (
                  <>
                    <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isGrowthPlan ? "border-black" : "border-white"}`}></div>
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <FiZap className="w-4 h-4" />
                    {activatingPlan ? "Redirecting..." : "Unlock Premium Growth"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {isGrowthPlan && (
          <div className="mb-8 rounded-3xl border border-[#d4af37] bg-[#1a1a1c] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">Growth plan active</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Your vendor account is active and ready to scale.</h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-400">All premium listing controls are now unlocked. You have full access to marketplace publishing, advanced inventory management, and gold-plated workflow tools.</p>
              </div>
              <div className="grid gap-2 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                {unlockedFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {isGrowthPlan && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-[#d4af37] bg-[#1a1a1c] shadow-[0_16px_50px_rgba(0,0,0,0.3)]">
            <div className="relative flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="absolute inset-0 opacity-40 bg-[linear-gradient(115deg,transparent_24%,#d4af37_48%,transparent_74%)] rounded-3xl" style={{ filter: 'blur(60px)' }} />
              <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">Premium Workflow</div>
                <div className="mt-1 text-white font-semibold text-lg">Unlimited publishing and priority orchestration unlocked.</div>
              </div>
              <div className="relative flex flex-wrap gap-2">
                {["unlimited listings", "premium visibility", "direct chat"].map((item) => (
                  <span key={item} className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Theme-Aware Sidebar */}
          <div className={`lg:col-span-3 rounded-2xl p-3 lg:sticky lg:top-[100px] border shadow-sm ${isGrowthPlan ? "bg-[#18181b] border-[#d4af37]/30" : "bg-[#11151c] border-[#1f2937]"}`}>
            <nav className="flex flex-col gap-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${tab === t.id ? (isGrowthPlan ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/20') : (isGrowthPlan ? 'text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/5' : 'text-gray-400 hover:text-[#60a5fa] hover:bg-[#17202b]')}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{t.icon}</span>
                    {t.label}
                  </div>
                  {t.id === "orders" && pendingOrders > 0 && <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${tab === t.id ? (isGrowthPlan ? 'bg-black/20 text-black' : 'bg-white/20 text-white') : (isGrowthPlan ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#2563eb]/10 text-[#2563eb]')}`}>{pendingOrders}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 animate-fade-in w-full">


            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="space-y-8">
                {/* Live Sync Banner */}
                <div className={`rounded-3xl border p-6 md:p-8 shadow-sm relative overflow-hidden transition-all duration-500 ${isGrowthPlan ? "bg-[#18181b] border-[#d4af37]/20" : "bg-[#11151c] border-[#1f2937]"}`}>
                   {isGrowthPlan && <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 blur-2xl rounded-full" />}
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                     <div>
                       <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#60a5fa]"}`}>Live Operations</div>
                       <h2 className={`text-2xl font-black tracking-tight ${isGrowthPlan ? "text-white" : "text-white"}`}>Realtime Sync: {liveConnected ? "Online" : "Restoring"}</h2>
                       <p className={`mt-2 text-sm leading-relaxed max-w-md ${isGrowthPlan ? "text-gray-400" : "text-gray-400"}`}>Track booking activity, order status, and vendor-side updates in one live operational view.</p>
                     </div>
                     <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest ${liveConnected ? (isGrowthPlan ? "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]" : "border-emerald-100 bg-emerald-50 text-emerald-700") : "border-amber-100 bg-amber-50 text-amber-700"}`}>
                       <span className={`h-2.5 w-2.5 rounded-full ${liveConnected ? (isGrowthPlan ? "bg-[#d4af37] shadow-[0_0_12px_#d4af37]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]") : "bg-amber-400 animate-pulse"}`} />
                       {liveConnected ? "Synchronized" : "Establishing..."}
                     </div>
                   </div>
                   
                   <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                     {(liveEvents.length ? liveEvents : [{ id: "idle", equipmentName: "Vanguard Guard", status: "Monitoring", timestamp: new Date().toISOString() }]).map((event) => (
                       <div key={event.id} className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] ${isGrowthPlan ? "bg-[#27272a]/40 border-[#d4af37]/10" : "bg-[#17202b] border-[#243041]"}`}>
                         <div className="flex items-center justify-between mb-2">
                           <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] ${isGrowthPlan ? "text-white" : "text-white"}`}>{event.equipmentName}</span>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isGrowthPlan ? "bg-[#d4af37]/20 text-[#d4af37]" : "bg-[#2563eb]/10 text-[#2563eb]"}`}>{event.status}</span>
                         </div>
                         <div className="text-[9px] font-bold opacity-30 mt-1 uppercase tracking-widest">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[
                    { label: "Revenue", value: formatCurrency(stats.revenue), icon: <FiAward />, accent: isGrowthPlan ? "bg-[#1a1a1c] border-[#d4af37]/20 text-white" : "bg-[#11151c] border-[#1f2937] text-white" },
                    { label: "Orders", value: stats.totalBookings, icon: <FiPackage />, accent: isGrowthPlan ? "bg-[#1a1a1c] border-[#d4af37]/20 text-white" : "bg-[#11151c] border-[#1f2937] text-white" },
                    { label: "Value", value: formatCurrency(stats.avgBookingValue), icon: <FiBarChart2 />, accent: isGrowthPlan ? "bg-[#1a1a1c] border-[#d4af37]/20 text-white" : "bg-[#11151c] border-[#1f2937] text-white" },
                    { label: "Fleet", value: stats.activeProducts, icon: <FiShield />, accent: isGrowthPlan ? "bg-[#1a1a1c] border-[#d4af37]/20 text-white" : "bg-[#11151c] border-[#1f2937] text-white" },
                    { label: "Tier", value: isGrowthPlan ? "Growth" : "Standard", icon: <FiZap />, accent: isGrowthPlan ? "bg-[#d4af37] border-[#d4af37] text-black" : "bg-black border-black text-white" },
                  ].map((stat, i) => (
                    <div key={i} className={`p-5 rounded-2xl border shadow-sm transition-all hover:shadow-lg ${stat.accent}`}>
                      <div className="flex items-center justify-between opacity-50 mb-3">
                         <span className="text-[8px] font-black uppercase tracking-[0.2em]">{stat.label}</span>
                         <span className="text-sm">{stat.icon}</span>
                      </div>
                      <div className="text-xl font-black tracking-tighter">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Analytics Block */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {[
                     { title: "Top performance", data: analytics?.top_equipment, key: 'equipment__name', val: 'revenue' },
                     { title: "Revenue Velocity", data: analytics?.monthly_revenue, key: 'start_date__month', val: 'revenue', date: true }
                   ].map((block, i) => (
                     <div key={i} className={`p-6 md:p-8 rounded-3xl border shadow-sm ${isGrowthPlan ? "bg-[#18181b] border-[#d4af37]/20" : "bg-[#11151c] border-[#1f2937]"}`}>
                        <h3 className={`text-xs font-black uppercase tracking-[0.3em] mb-6 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#60a5fa]"}`}>{block.title}</h3>
                        <div className="space-y-3">
                          {(block.data || []).map((item, idx) => (
                            <div key={idx} className={`flex justify-between items-center px-4 py-3 rounded-2xl border transition-all ${isGrowthPlan ? "bg-[#27272a]/30 border-[#d4af37]/10 hover:border-[#d4af37]/30" : "bg-[#17202b] border-[#243041] hover:border-[#2563eb]/30"}`}>
                               <span className={`text-[10px] font-black uppercase tracking-widest truncate pr-4 ${isGrowthPlan ? "text-white/80" : "text-white"}`}>{block.date ? `${item.start_date__month}/${item.start_date__year}` : item[block.key]}</span>
                               <span className={`text-xs font-black tracking-tight ${isGrowthPlan ? "text-[#d4af37]" : "text-[#60a5fa]"}`}>{formatCurrency(item[block.val])}</span>
                            </div>
                          ))}
                          {(!block.data || block.data.length === 0) && <p className="text-[10px] uppercase font-black text-center py-12 opacity-20 tracking-widest">Awaiting Datasets</p>}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}


            {/* Orders Tab */}
            {tab === "orders" && (
              <div className="space-y-8">
                <div className="flex items-end justify-between border-b border-[#1f2937] pb-6">
                  <div>
                    <h2 className={`text-4xl font-black tracking-tight ${isGrowthPlan ? "text-white" : "text-white"}`}>Order Ledger</h2>
                    <p className={`text-sm mt-1 font-bold ${isGrowthPlan ? "text-gray-500" : "text-gray-400"}`}>{bookings.length} transactions</p>
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className={`p-20 text-center rounded-[40px] border border-dashed flex flex-col items-center gap-4 ${isGrowthPlan ? "border-[#d4af37]/20 bg-[#18181b]/50" : "border-[#243041] bg-[#11151c]"}`}>
                    <FiPackage className={`w-12 h-12 opacity-10 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#2563eb]"}`} />
                    <p className="text-xs font-black uppercase tracking-widest opacity-30">Queue is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(book => (
                      <div key={book.id} className={`rounded-[32px] p-6 border shadow-sm transition-all duration-300 ${isGrowthPlan ? "bg-[#18181b] border-[#d4af37]/20 hover:border-[#d4af37]/50" : "bg-[#11151c] border-[#1f2937] hover:border-[#2563eb]/30"}`}>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                          <div className="flex gap-6 items-center">
                            <div className={`w-24 h-24 rounded-2xl overflow-hidden border ${isGrowthPlan ? "border-[#d4af37]/10" : "border-[#243041]"}`}>
                               {book.equipment_detail?.image_url ? 
                                 <img src={book.equipment_detail.image_url} className="w-full h-full object-cover" /> : 
                                 <div className="w-full h-full flex items-center justify-center opacity-10"><FiBox className="w-8 h-8" /></div>
                               }
                            </div>
                            <div>
                               <div className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#60a5fa]"}`}>#{String(book.id).slice(0, 8)}</div>
                               <h3 className={`text-xl font-bold mb-3 ${isGrowthPlan ? "text-white" : "text-white"}`}>{book.equipment_detail?.name}</h3>
                               <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                                 <span>User: {String(book.user_id).slice(0, 10)}...</span>
                                 <span>Schedule: {book.start_date} → {book.end_date}</span>
                               </div>
                            </div>
                          </div>

                          <div className="flex flex-col lg:items-end gap-5">
                             <div className="lg:text-right">
                               <div className={`text-2xl font-black tracking-tighter ${isGrowthPlan ? "text-white" : "text-white"}`}>{formatCurrency(book.total_price)}</div>
                               <div className="mt-2 text-right"><StatusBadge status={book.status} /></div>
                             </div>
                             
                             <div className="flex flex-wrap gap-2">
                               {book.status === "pending" && (
                                  <>
                                    <button onClick={() => updateBookingStatus(book.id, "confirm")} className={`py-2 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black" : "bg-green-600 text-white"}`}>Authorize</button>
                                    <button onClick={() => updateBookingStatus(book.id, "cancel")} className={`py-2 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500/10`}>Dismiss</button>
                                  </>
                               )}
                               {["confirmed", "active"].includes(book.status) && (
                                 <button onClick={() => updateBookingStatus(book.id, "ship")} className={`py-2.5 px-6 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black" : "bg-[#2563eb] text-white"}`}><FiTruck /> Dispatch Unit</button>
                               )}
                               {book.status === "shipped" && (
                                 <button onClick={() => updateBookingStatus(book.id, "deliver")} className="py-2.5 px-6 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-all"><FiCheckCircle /> Confirm Arrival</button>
                               )}
                               {book.status === "delivered" && (
                                 <button onClick={() => updateBookingStatus(book.id, "complete")} className={`py-2.5 px-6 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black" : "bg-black text-white"}`}>Archive History</button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Products Tab */}
            {tab === "products" && (
              <div className="space-y-8">
                <div className="flex items-end justify-between border-b border-[#1f2937] pb-6">
                  <div>
                    <h2 className={`text-4xl font-black tracking-tight ${isGrowthPlan ? "text-white" : "text-white"}`}>Fleet Inventory</h2>
                    <p className={`text-sm mt-1 font-bold ${isGrowthPlan ? "text-gray-500" : "text-gray-400"}`}>{products.length} units</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={seedProducts} disabled={subscriptionLocked} className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${isGrowthPlan ? "bg-[#1a1a1c] border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10" : "bg-[#11151c] border-[#243041] text-gray-400 hover:bg-[#17202b] hover:text-white"}`}>Samples</button>
                    <button onClick={() => { setCreatedListingId(null); setListingFormVersion((current) => current + 1); setTab("add"); }} disabled={subscriptionLocked} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${isGrowthPlan ? "bg-[#d4af37] text-black hover:scale-[1.03]" : "bg-[#2563eb] text-white"}`}><FiPlus className="w-4 h-4" /> New Unit</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.length === 0 ? (
                    <div className={`md:col-span-2 xl:col-span-3 rounded-[32px] border border-dashed p-14 text-center ${isGrowthPlan ? "bg-[#18181b]/60 border-[#d4af37]/20 text-gray-400" : "bg-[#11151c] border-[#243041] text-gray-400"}`}>
                      <div className="text-[11px] font-black uppercase tracking-[0.35em] opacity-70">No Listings Yet</div>
                      <p className="mt-3 text-sm font-semibold">Create your first equipment listing or add sample products to populate the dashboard.</p>
                    </div>
                  ) : products.map(p => (
                    <div id={`vendor-listing-${p.id}`} key={p.id} className={`group rounded-[32px] overflow-hidden border transition-all duration-700 hover:shadow-2xl flex flex-col ${String(createdListingId) === String(p.id) ? (isGrowthPlan ? "ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#09090b]" : "ring-2 ring-[#2563eb] ring-offset-2 ring-offset-[#0f1115]") : ""} ${isGrowthPlan ? "bg-[#18181b] border-[#d4af37]/20 hover:border-[#d4af37]/60" : "bg-[#11151c] border-[#1f2937] hover:border-[#2563eb]/30"}`}>
                      <div className="aspect-[5/4] relative overflow-hidden bg-black/10">
                         {p.image_url ? 
                           <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.25] group-hover:grayscale-0" /> : 
                           <div className="w-full h-full flex items-center justify-center opacity-10"><FiBox className="w-12 h-12" /></div>
                         }
                         <div className="absolute top-5 right-5">
                           <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${p.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>{p.is_active ? 'Market Active' : 'Off-Market'}</span>
                         </div>
                      </div>
                      <div className="p-7 flex-1 flex flex-col">
                         <div className={`text-[9px] font-black uppercase tracking-[0.4em] mb-3 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#60a5fa]"}`}>{p.category}</div>
                         <h3 className={`text-2xl font-bold tracking-tight mb-4 leading-tight ${isGrowthPlan ? "text-white" : "text-white"}`}>{p.name}</h3>
                         <div className="text-[22px] font-black tracking-tighter mb-8">{formatCurrency(p.price_per_day)} <span className="text-[10px] opacity-30 uppercase">/ day</span></div>
                         
                         <div className={`mt-auto pt-6 border-t flex gap-3 ${isGrowthPlan ? "border-white/5" : "border-[#1f2937]"}`}>
                           <input type="number" min="0" defaultValue={p.quantity} onBlur={e => updateInventory(p.id, e.target.value)} className={`w-16 h-10 rounded-xl text-center text-xs font-black outline-none transition-all ${isGrowthPlan ? "bg-[#27272a] border border-[#d4af37]/20 text-white focus:border-[#d4af37]" : "bg-[#17202b] border border-[#243041] text-white focus:border-[#2563eb]"}`} />
                           <button onClick={() => toggleProductLive(p)} disabled={subscriptionLocked && !p.is_active} className={`flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${p.is_active ? (isGrowthPlan ? 'bg-white/5 border border-white/10 text-white' : 'bg-[#17202b] border border-[#243041] text-gray-300') : (isGrowthPlan ? 'bg-[#d4af37] text-black' : 'bg-[#2563eb] text-white')}`}>{p.is_active ? "Retire" : "Go Public"}</button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Tab */}
            {tab === "add" && (
              <div className={`rounded-[40px] p-8 md:p-12 border shadow-sm transition-all duration-500 ${isGrowthPlan ? "bg-[#18181b] border-[#d4af37]/20 shadow-[#d4af37]/5" : "bg-[#11151c] border-[#1f2937]"}`}>
                <div className="flex items-center gap-6 mb-12">
                   <button onClick={() => setTab("products")} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isGrowthPlan ? "bg-[#27272a] border-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/10" : "bg-[#17202b] border-[#243041] text-gray-400 hover:bg-[#1d2936]"}`}><FiPlus className="rotate-45 w-6 h-6" /></button>
                   <div>
                     <h2 className={`text-4xl font-black tracking-tight ${isGrowthPlan ? "text-white" : "text-white"}`}>Create Listing</h2>
                     <p className={`text-sm mt-1 font-bold ${isGrowthPlan ? "text-gray-500" : "text-gray-400"}`}>Add pricing, availability, and equipment details for your fleet.</p>
                   </div>
                </div>
                {subscriptionLocked ? (
                  <div className={`p-16 text-center rounded-3xl border border-dashed flex flex-col items-center gap-6 ${isGrowthPlan ? "border-[#d4af37]/30 bg-black/40" : "border-[#243041] bg-[#17202b]"}`}>
                    <FiShield className={`w-12 h-12 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#2563eb]"}`} />
                    <p className={`text-sm leading-relaxed max-w-sm font-bold ${isGrowthPlan ? "text-gray-400" : "text-gray-400"}`}>An active vendor plan is required before you can publish new listings.</p>
                    <button onClick={activateSubscription} className={`px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black" : "bg-[#2563eb] text-white"}`}>Activate Growth Plan</button>
                  </div>
                ) : (
                  <VendorEquipmentForm
                    key={listingFormVersion}
                    onSaved={async (result) => {
                      setCreatedListingId(result?.id || null);
                      await loadDashboard();
                      setTab("products");
                    }}
                  />
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {tab === "reviews" && (
              <div className="space-y-8">
                 <h2 className={`text-4xl font-black tracking-tight ${isGrowthPlan ? "text-white" : "text-white"}`}>Customer Reviews</h2>
                 <div className="grid gap-6">
                    {vendorReviews.length === 0 ? (
                      <div className={`p-24 text-center rounded-[40px] border border-dashed flex flex-col items-center gap-6 ${isGrowthPlan ? "border-[#d4af37]/20 bg-[#18181b]/50" : "border-[#243041] bg-[#11151c]"}`}>
                        <FiStar className={`w-14 h-14 opacity-10 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#2563eb]"}`} />
                        <p className="text-xs font-black uppercase tracking-widest opacity-30">No Reviews Yet</p>
                      </div>
                    ) : (
                      vendorReviews.map(r => (
                        <div key={r.id} className={`rounded-[32px] p-8 border shadow-sm transition-all ${isGrowthPlan ? "bg-[#18181b] border-[#d4af37]/20" : "bg-[#11151c] border-[#1f2937]"}`}>
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                              <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs ${isGrowthPlan ? "bg-[#d4af37] text-black" : "bg-[#2563eb] text-white"}`}>{(r.reviewer_name || "A")[0]}</div>
                                 <div>
                                   <h4 className={`text-lg font-bold ${isGrowthPlan ? "text-white" : "text-white"}`}>{r.title || "Review"}</h4>
                                   <p className={`text-[10px] uppercase font-black tracking-[0.2em] mt-0.5 ${isGrowthPlan ? "text-[#d4af37]" : "text-[#60a5fa]"}`}>{r.equipment_detail?.name}</p>
                                 </div>
                              </div>
                              <div className="flex gap-1">
                                 {[1,2,3,4,5].map(n => <FiStar key={n} className={`w-4 h-4 ${n <= r.rating ? (isGrowthPlan ? 'fill-[#d4af37] text-[#d4af37]' : 'fill-yellow-400 text-yellow-400') : 'text-gray-200'}`} />)}
                              </div>
                           </div>
                           <div className={`p-6 rounded-2xl mb-8 italic ${isGrowthPlan ? "bg-black/20 text-white/80" : "bg-[#17202b] text-gray-300"}`}>"{r.comment}"</div>
                           
                           <div className="space-y-4 ml-6 pl-6 border-l-2 border-[#243041]">
                             {(reviewComments[r.id] || []).map(c => {
                               const isV = String(c.user_id) === String(vendor?.user_id);
                               return (
                                 <div key={c.id} className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isV ? (isGrowthPlan ? 'bg-[#d4af37] text-black' : 'bg-black text-white') : 'bg-[#17202b] text-white border border-[#243041]'}`}>{isV ? 'V' : 'U'}</div>
                                    <div>
                                       <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isV ? (isGrowthPlan ? 'text-[#d4af37]' : 'text-[#60a5fa]') : 'opacity-40'}`}>{isV ? 'Vendor' : 'Customer'}</div>
                                       <p className={`text-sm ${isGrowthPlan ? "text-white/80" : "text-gray-300"}`}>{c.comment}</p>
                                    </div>
                                 </div>
                               );
                             })}
                             <div className="flex items-center gap-3 pt-2">
                               <div className={`flex-1 flex items-center rounded-2xl border ${isGrowthPlan ? "bg-black/20 border-[#d4af37]/20 focus-within:border-[#d4af37]" : "bg-[#17202b] border-[#243041] focus-within:border-[#2563eb]"}`}>
                                 <input type="text" value={replyDrafts[r.id] || ""} onChange={e => setReplyDrafts({...replyDrafts, [r.id]: e.target.value})} className="flex-1 bg-transparent px-5 py-3 text-sm outline-none text-current" placeholder="Write a vendor reply..." />
                                 <button onClick={() => saveReply(r.id)} disabled={!(replyDrafts[r.id] || "").trim()} className={`w-10 h-10 rounded-xl mr-1 flex items-center justify-center transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black" : "bg-[#2563eb] text-white"}`}><FiSend className="w-4 h-4" /></button>
                               </div>
                             </div>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            )}

            {/* Chat Tab */}
            {tab === "chat" && (
               <div className={`rounded-[40px] overflow-hidden border shadow-2xl h-[700px] flex flex-col md:flex-row ${isGrowthPlan ? "bg-[#09090b] border-[#d4af37]/20" : "bg-[#0f1115] border-[#1f2937]"}`}>
                 <div className={`w-full md:w-[300px] border-b md:border-b-0 md:border-r h-[30%] md:h-full flex flex-col ${isGrowthPlan ? "bg-[#18181b] border-white/5" : "bg-[#11151c] border-[#1f2937]"}`}>
                    <div className={`p-6 border-b ${isGrowthPlan ? "border-white/5" : "border-[#1f2937]"}`}>
                       <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isGrowthPlan ? "text-[#d4af37]" : "text-[#2563eb]"}`}>Conversations</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                       {threads.map(t => (
                         <button key={t.id} onClick={() => setSelectedThread(t)} className={`w-full text-left p-4 rounded-2xl transition-all ${selectedThread?.id === t.id ? (isGrowthPlan ? 'bg-[#d4af37]/10 border-l-4 border-[#d4af37]' : 'bg-[#17202b] shadow-sm border-l-4 border-[#2563eb]') : 'hover:opacity-50 border-l-4 border-transparent'}`}>
                            <div className={`truncate font-bold text-sm ${isGrowthPlan ? "text-white" : "text-white"}`}>{t.equipment_name || `Thread #${t.id}`}</div>
                            <div className="text-[9px] font-bold opacity-30 mt-1 uppercase">Client #{t.buyer_id?.slice(0,4)}</div>
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex-1 flex flex-col h-[70%] md:h-full">
                    {selectedThread ? (
                      <>
                        <div className={`p-6 border-b flex items-center justify-between ${isGrowthPlan ? "border-white/5 bg-[#18181b]" : "border-[#1f2937] bg-[#11151c]"}`}>
                           <h4 className={`text-sm font-black uppercase tracking-widest ${isGrowthPlan ? "text-white" : "text-white"}`}>{selectedThread.equipment_name || `Thread #${selectedThread.id}`}</h4>
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isGrowthPlan ? "border-[#d4af37]/30 text-[#d4af37]" : "border-emerald-100 text-emerald-700"}`}>Live</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col" style={{ backgroundColor: isGrowthPlan ? '#09090b' : '#0f1115' }}>
                           {messages.map(m => {
                             const isMe = String(m.sender_id) === String(selectedThread.vendor_id);
                             return (
                               <div key={m.id} className={`max-w-[80%] flex flex-col ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                  <div className={`px-4 py-3 rounded-2xl text-sm font-bold shadow-sm ${isMe ? (isGrowthPlan ? 'bg-[#d4af37] text-black rounded-tr-none' : 'bg-[#2563eb] text-white rounded-tr-none') : (isGrowthPlan ? 'bg-[#18181b] text-white border border-[#d4af37]/20 rounded-tl-none' : 'bg-[#17202b] border border-[#243041] text-white rounded-tl-none')}`}>
                                     {m.message}
                                  </div>
                               </div>
                             );
                           })}
                        </div>
                        <div className={`p-4 border-t ${isGrowthPlan ? "border-white/5 bg-[#18181b]" : "border-[#1f2937] bg-[#11151c]"}`}>
                           <div className={`flex items-center gap-2 p-1 rounded-2xl border ${isGrowthPlan ? "bg-black/20 border-[#d4af37]/20" : "bg-[#17202b] border-[#243041]"}`}>
                              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} className="flex-1 bg-transparent px-4 py-2 text-xs font-black outline-none tracking-widest text-current" placeholder="Type your message..." />
                              <button onClick={sendMessage} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black" : "bg-[#2563eb] text-white"}`}><FiSend className="w-4 h-4" /></button>
                           </div>
                        </div>
                      </>
                    ) : (
                      <div className="m-auto opacity-10 text-xs font-black uppercase tracking-[0.5em] text-center p-12">Select Stream</div>
                    )}
                 </div>
               </div>
            )}

            {/* Settings Tab */}
            {tab === "settings" && (
               <div className={`rounded-[40px] p-8 md:p-12 border shadow-sm transition-all duration-500 max-w-2xl mx-auto ${isGrowthPlan ? "bg-[#18181b] border-[#d4af37]/20" : "bg-[#11151c] border-[#1f2937]"}`}>
                  <h2 className={`text-4xl font-black tracking-tight mb-8 ${isGrowthPlan ? "text-white" : "text-white"}`}>Settings</h2>
                  <form onSubmit={async (e) => { e.preventDefault(); setSavingSettings(true); try { await vendorAPI.updateProfile(settingsForm); toast.success("Synchronized."); loadDashboard(); } catch (err) { toast.error(err.message); } finally { setSavingSettings(false); } }} className="space-y-6">
                     {[
                       { label: "Company Name", key: "company_name", type: "text" },
                       { label: "Contact Email", key: "email", type: "email" },
                       { label: "Contact Phone", key: "phone", type: "tel" }
                     ].map(f => (
                       <div key={f.key}>
                         <label className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-2 opacity-60`}>{f.label}</label>
                         <input type={f.type} value={settingsForm[f.key]} onChange={e => setSettingsForm({...settingsForm, [f.key]: e.target.value})} className={`w-full rounded-2xl px-5 py-3.5 text-sm font-black outline-none border transition-all ${isGrowthPlan ? "bg-black/30 border-[#d4af37]/10 text-white focus:border-[#d4af37]" : "bg-[#17202b] border-[#243041] text-white focus:border-[#2563eb]"}`} />
                       </div>
                     ))}
                     
                     <div className="pt-8 border-t border-opacity-10 border-current">
                        <div className={`p-6 rounded-3xl border mb-8 ${isGrowthPlan ? "bg-[#d4af37]/5 border-[#d4af37]/20" : "bg-[#17202b] border-[#243041]"}`}>
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Plan Status</div>
                           <div className={`text-xl font-black mb-4 ${isGrowthPlan ? "text-[#d4af37]" : "text-white"}`}>{isGrowthPlan ? "Growth Plan Active" : "Standard Plan"}</div>
                           <button type="button" onClick={activateSubscription} disabled={isGrowthPlan || activatingPlan || confirmingPlan} className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isGrowthPlan ? "border border-[#d4af37] text-[#d4af37] bg-transparent opacity-40" : "bg-black text-white"}`}>
                              {isGrowthPlan ? "Verified" : "Upgrade"}
                           </button>
                        </div>
                        <button type="submit" disabled={savingSettings} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all ${isGrowthPlan ? "bg-[#d4af37] text-black" : "bg-[#2563eb] text-white"}`}>
                          {savingSettings ? "Saving..." : "Save Changes"}
                        </button>
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
