import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import VendorEquipmentForm from "../components/vendor/VendorEquipmentForm";
import {
  bookingsAPI, equipmentAPI,
  paymentsAPI, vendorAPI
} from "../api/axiosConfig";

import {
  FiTrendingUp, FiPackage, FiBox, FiSettings,
  FiPlus, FiStar, FiCheckCircle, FiTruck,
  FiZap, FiShield, FiXCircle,
  FiChevronRight,
  FiRadio, FiLock, FiClock
} from "react-icons/fi";

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(v) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(Number(v || 0));
}

function StatusTag({ status }) {
  const s = (status || "").toLowerCase();
  let badgeClass = "bg-secondary";
  let icon = <FiClock className="me-1" />;

  if (["completed", "delivered", "confirmed", "active"].includes(s)) {
    badgeClass = "bg-success";
    icon = <FiCheckCircle className="me-1" />;
  } else if (s === "shipped") {
    badgeClass = "bg-info text-dark";
    icon = <FiTruck className="me-1" />;
  } else if (s === "cancelled") {
    badgeClass = "bg-danger";
    icon = <FiXCircle className="me-1" />;
  } else {
    badgeClass = "bg-warning text-dark";
  }

  return <span className={`badge ${badgeClass} d-inline-flex align-items-center px-2 py-1`}><span className="text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>{icon} {status}</span></span>;
}

const TABS = [
  { id: "overview", label: "Overview", icon: <FiTrendingUp className="me-2 text-muted" /> },
  { id: "orders", label: "Orders", icon: <FiPackage className="me-2 text-muted" /> },
  { id: "products", label: "Listings", icon: <FiBox className="me-2 text-muted" /> },
  { id: "reviews", label: "Reviews", icon: <FiStar className="me-2 text-muted" /> },
  { id: "settings", label: "Settings", icon: <FiSettings className="me-2 text-muted" /> },
];

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
export default function VendorDashboard() {
  const { userId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorReviews, setVendorReviews] = useState([]);

  const [settingsForm, setSettingsForm] = useState({ company_name: "", email: "", phone: "" });
  const [savingSettings, setSavingSettings] = useState(false);

  const [activatingPlan, setActivatingPlan] = useState(false);
  const [confirmingPlan, setConfirmingPlan] = useState(false);
  const [createdListingId, setCreatedListingId] = useState(null);
  const [listingFormVersion, setListingFormVersion] = useState(0);
  const [editingListing, setEditingListing] = useState(null);

  const stats = useMemo(() => {
    const rev = bookings.reduce((s, b) => s + Number(b.total_price || 0), 0);
    const count = bookings.length;
    return {
      revenue: rev,
      totalBookings: count,
      avgBookingValue: count > 0 ? rev / count : 0,
      activeProducts: products.filter(p => p.is_active).length,
    };
  }, [bookings, products]);

  const subLocked = Boolean(vendor) && !vendor.subscription_active && stats.activeProducts >= 3;
  const isGrowth = Boolean(vendor?.subscription_active);
  const pendingOrders = bookings.filter(b => b.status === "pending").length;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [v, vb, mp, rev] = await Promise.all([
        vendorAPI.profile().catch(() => null),
        bookingsAPI.vendorBookings(),
        equipmentAPI.mine(),
        equipmentAPI.vendorReviews().catch(() => []),
      ]);
      setVendor(v);
      if (v) setSettingsForm({ company_name: v.company_name || "", email: v.email || "", phone: v.phone || "" });
      setBookings(Array.isArray(vb) ? vb : vb?.results || []);
      setProducts(Array.isArray(mp) ? mp : mp?.results || []);
      const rl = Array.isArray(rev) ? rev : rev?.results || [];
      setVendorReviews(rl);
    } catch (e) { toast.error(e.message || "Load failed."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const canceled = p.get("canceled");
    const sid = p.get("session_id") || localStorage.getItem("vendor_checkout_session_id");
    if (canceled === "true") { localStorage.removeItem("vendor_checkout_session_id"); toast.error("Checkout canceled."); navigate("/vendor", { replace: true }); return; }
    if (!sid || !userId || (vendor && vendor.subscription_active)) { if (vendor?.subscription_active) localStorage.removeItem("vendor_checkout_session_id"); return; }
    let cancelled = false, attempt = 0;
    async function confirm() {
      setConfirmingPlan(true);
      try {
        const c = await paymentsAPI.confirmSubscriptionSession(sid);
        if (c?.subscription_active && !cancelled) { setVendor(c.vendor || { ...vendor, subscription_active: true }); localStorage.removeItem("vendor_checkout_session_id"); setTab("products"); toast.success("Growth plan activated."); loadDashboard(); navigate("/vendor", { replace: true }); setConfirmingPlan(false); return; }
      } catch { }
      while (!cancelled && attempt < 12) {
        attempt++;
        try { const pr = await vendorAPI.profile(); if (pr?.subscription_active) { setVendor(pr); localStorage.removeItem("vendor_checkout_session_id"); setTab("products"); toast.success("Activated."); navigate("/vendor", { replace: true }); setConfirmingPlan(false); return; } } catch { }
        await new Promise(r => setTimeout(r, 2000));
      }
      if (!cancelled) { toast("Payment recorded — awaiting Stripe…", { icon: "⏳" }); setConfirmingPlan(false); }
    }
    confirm(); return () => { cancelled = true; };
  }, [location.search, navigate, userId, vendor, loadDashboard]);

  useEffect(() => {
    if (tab !== "products" || !createdListingId || !products.length) return;
    if (!products.find(i => String(i.id) === String(createdListingId))) return;
    const t = setTimeout(() => document.getElementById(`vl-${createdListingId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    return () => clearTimeout(t);
  }, [tab, createdListingId, products]);

  const toggleLive = async p => {
    if (subLocked && !p.is_active) { toast.error("Listing limit reached (3/3). Upgrade to publish more."); return; }
    try { await equipmentAPI.update(p.id, { is_active: !p.is_active }); toast.success(`Listing ${!p.is_active ? "published" : "unlisted"}.`); loadDashboard(); }
    catch (e) { toast.error(e.message || "Failed."); }
  };
  const updateInventory = async (id, qty) => { try { await equipmentAPI.update(id, { quantity: Number(qty) }); toast.success("Updated."); loadDashboard(); } catch (e) { toast.error(e.message || "Failed."); } };
  const updateBooking = async (id, action) => { try { await bookingsAPI.vendorAction(id, action); toast.success(`Booking ${action}ed.`); loadDashboard(); } catch (e) { toast.error(e.message || "Failed."); } };

  const seedProducts = async () => { if (subLocked) { toast.error("Listing limit reached (3/3). Upgrade to seed more."); return; } try { const r = await equipmentAPI.seedVendorProducts(); toast.success(r.message || "Seeded."); loadDashboard(); } catch (e) { toast.error(e.message || "Failed."); } };
  const activateSub = async () => {
    setActivatingPlan(true);
    try { const r = await paymentsAPI.createCheckout(); if (r?.url) { if (r.session_id) localStorage.setItem("vendor_checkout_session_id", r.session_id); window.location.href = r.url; return; } toast.error("Checkout failed."); }
    catch (e) { toast.error(e.message || "Failed."); }
    finally { setActivatingPlan(false); }
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

  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="container py-4">
      {/* Hero Banner */}
      <div className="card text-white bg-dark mb-4 border-0 rounded-4 shadow-sm overflow-hidden">
        <div className="card-body p-4 p-md-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center position-relative z-1">
          <div>
            <h6 className="text-primary text-uppercase fw-bold mb-2 tracking-wider small"><FiTrendingUp className="me-2" />Vendor Hub</h6>
            <h1 className="display-5 fw-bold mb-2">{vendor?.company_name || vendor?.email?.split("@")[0] || "Vendor Portal"}</h1>
            <p className="lead text-white-50 mb-0">Manage your fleet, orders, and customer reputation.</p>
          </div>
          <div className="d-flex flex-column align-items-md-end mt-4 mt-md-0 gap-3">
            {isGrowth ? (
              <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 rounded-pill"><FiRadio className="me-2" /> Growth Plan Active</span>
            ) : (
              <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary px-3 py-2 rounded-pill"><FiLock className="me-2" /> Free Tier</span>
            )}

            <div className="d-flex gap-4 bg-white bg-opacity-10 p-3 rounded-3 backdrop-blur mt-2">
              <div className="text-center px-2">
                <div className="text-white-50 text-uppercase tracking-wider mb-1" style={{ fontSize: '0.7rem' }}>Live Listings</div>
                <div className="fs-3 fw-light">{stats.activeProducts}</div>
              </div>
              <div className="text-center border-start border-white border-opacity-25 px-2 ps-4">
                <div className="text-white-50 text-uppercase tracking-wider mb-1" style={{ fontSize: '0.7rem' }}>Total Revenue</div>
                <div className="fs-3 fw-light text-primary">{fmt(stats.revenue)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {!isGrowth && vendor && (
        <div className={`alert ${subLocked ? 'alert-danger' : 'alert-warning'} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-4`}>
          <div>
            <FiShield className="me-2 fs-5" />
            <span className="fw-medium">
              {confirmingPlan ? "Synchronising plan activation…" : (subLocked ? "Listing limit reached (3/3). Upgrade to publish more." : `Free Plan (${stats.activeProducts}/3 listings). Upgrade for unlimited.`)}
            </span>
          </div>
          <button className="btn btn-sm btn-primary rounded-pill px-3 fw-medium" onClick={activateSub} disabled={activatingPlan || confirmingPlan}>
            <FiZap className="me-1" /> {activatingPlan ? "Redirecting…" : confirmingPlan ? "Syncing…" : "Unlock Growth Plan"}
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="row g-4">
        {/* Sidebar Navigation */}
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 position-sticky" style={{ top: '80px' }}>
            <div className="list-group list-group-flush rounded-4 overflow-hidden py-2">
              <div className="px-3 py-2 small fw-bold text-muted text-uppercase tracking-wider">Navigation</div>
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
                    {tab === t.id && <FiChevronRight className="text-primary" />}
                  </div>
                </button>
              ))}
              <div className="px-3 py-2 small fw-bold text-muted text-uppercase tracking-wider mt-3 text-center border-top pt-3 opacity-50">{dateStr}</div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-12 col-md-9">

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <div className="row g-4">
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                  <h6 className="text-muted text-uppercase tracking-wider small fw-bold mb-3">Revenue</h6>
                  <div className="fs-1 fw-bold text-dark mb-1 text-truncate" title={fmt(stats.revenue)}>{fmt(stats.revenue)}</div>
                  <div className="small text-muted">Total lifetime revenue</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                  <h6 className="text-muted text-uppercase tracking-wider small fw-bold mb-3">Orders</h6>
                  <div className="fs-1 fw-bold text-dark mb-1">{stats.totalBookings}</div>
                  <div className="small text-muted">Total bookings all time</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                  <h6 className="text-muted text-uppercase tracking-wider small fw-bold mb-3">Avg. Order Value</h6>
                  <div className="fs-1 fw-bold text-dark mb-1 text-truncate" title={fmt(stats.avgBookingValue)}>{fmt(stats.avgBookingValue)}</div>
                  <div className="small text-muted">Average revenue per booking</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                  <h6 className="text-muted text-uppercase tracking-wider small fw-bold mb-3">Active Fleet</h6>
                  <div className="fs-1 fw-bold text-dark mb-1">{stats.activeProducts}</div>
                  <div className="small text-muted">Published inventory units</div>
                </div>
              </div>
              <div className="col-12 col-md-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-dark text-white">
                  <h6 className="text-white-50 text-uppercase tracking-wider small fw-bold mb-3">Plan Tier</h6>
                  <div className="fs-1 fw-bold mb-1 text-primary">{isGrowth ? "Growth Plan" : "Inactive"}</div>
                  <div className="small text-white-50">{isGrowth ? "All premium features active" : "Upgrade to unlock unlimited listings"}</div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === "orders" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">Order Ledger</h4>
                <p className="text-muted small mb-0 mt-1">{bookings.length} transaction records</p>
              </div>
              <div className="card-body p-4 bg-light bg-opacity-50">
                {bookings.length === 0
                  ? <div className="text-center py-5 bg-white rounded-3 border border-dashed"><FiPackage size={48} className="text-muted mb-3 opacity-50" /><h5 className="fw-bold">No orders on record</h5></div>
                  : <div className="d-flex flex-column gap-3">
                    {bookings.map(book => (
                      <div key={book.id} className="card border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-shadow">
                        <div className="d-flex flex-column flex-lg-row">
                          <div className="bg-light d-flex align-items-center justify-content-center p-3 border-end" style={{ width: 120 }}>
                            {book.equipment_detail?.image_url
                              ? <img src={book.equipment_detail.image_url} alt="" className="img-fluid rounded object-fit-cover" style={{ height: 80, width: 80 }} />
                              : <FiBox size={32} className="text-muted opacity-50" />}
                          </div>
                          <div className="p-4 flex-grow-1">
                            <div className="text-muted small text-uppercase tracking-wider mb-1 fw-bold" style={{ fontSize: '0.65rem' }}>Ref · {String(book.id).slice(0, 8)}</div>
                            <h5 className="fw-bold mb-2">{book.equipment_detail?.name}</h5>
                            <div className="text-muted small"><FiClock className="me-1 mb-1 opacity-50" />{book.start_date} — {book.end_date}</div>
                          </div>
                          <div className="p-4 border-start d-flex flex-column justify-content-center bg-light" style={{ minWidth: 160 }}>
                            <div className="fs-4 fw-bold text-primary mb-2">{fmt(book.total_price)}</div>
                            <div><StatusTag status={book.status} /></div>
                          </div>
                          <div className="p-4 border-start d-flex flex-column justify-content-center gap-2" style={{ minWidth: 160 }}>
                            {book.status === "pending" && <>
                              <button className="btn btn-sm btn-success rounded-pill fw-medium" onClick={() => updateBooking(book.id, "confirm")}><FiCheckCircle className="me-1" />Authorize</button>
                              <button className="btn btn-sm btn-outline-danger rounded-pill fw-medium" onClick={() => updateBooking(book.id, "cancel")}><FiXCircle className="me-1" />Dismiss</button>
                            </>}
                            {["confirmed", "active"].includes(book.status) && <button className="btn btn-sm btn-primary rounded-pill fw-medium" onClick={() => updateBooking(book.id, "ship")}><FiTruck className="me-1" />Dispatch</button>}
                            {book.status === "shipped" && <button className="btn btn-sm btn-success rounded-pill fw-medium" onClick={() => updateBooking(book.id, "deliver")}><FiCheckCircle className="me-1" />Delivered</button>}
                            {book.status === "delivered" && <button className="btn btn-sm btn-outline-dark rounded-pill fw-medium" onClick={() => updateBooking(book.id, "complete")}>Archive</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {tab === "products" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="fw-bold mb-0">Fleet Catalogue</h4>
                  <p className="text-muted small mb-0 mt-1">{products.length} units registered</p>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary rounded-pill px-3 fw-medium" onClick={seedProducts} disabled={subLocked}>Seed Samples</button>
                  <button className="btn btn-primary rounded-pill px-3 fw-medium d-flex align-items-center" disabled={subLocked}
                    onClick={() => { setEditingListing(null); setCreatedListingId(null); setListingFormVersion(v => v + 1); setTab("add"); }}>
                    <FiPlus className="me-1" />New Listing
                  </button>
                </div>
              </div>
              <div className="card-body p-4 bg-light bg-opacity-50">
                {products.length === 0
                  ? <div className="text-center py-5 bg-white rounded-3 border border-dashed"><FiBox size={48} className="text-muted mb-3 opacity-50" /><h5 className="fw-bold">No listings yet</h5></div>
                  : <div className="row g-4">
                    {products.map(p => (
                      <div id={`vl-${p.id}`} key={p.id} className="col-12 col-md-6 col-lg-4">
                        <div className={`card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-shadow ${String(createdListingId) === String(p.id) ? 'border border-primary border-2' : ''}`}>
                          <div className="position-relative bg-light border-bottom" style={{ aspectRatio: '4/3' }}>
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="w-100 h-100 object-fit-cover" />
                              : <div className="w-100 h-100 d-flex justify-content-center align-items-center text-muted"><FiBox size={40} className="opacity-50" /></div>}
                            <div className={`position-absolute top-0 start-0 m-3 badge rounded-pill ${p.is_active ? 'bg-success text-white' : 'bg-dark text-white bg-opacity-75'}`}>
                              {p.is_active ? "● Live" : "○ Off"}
                            </div>
                          </div>
                          <div className="card-body d-flex flex-column p-3">
                            <div className="text-primary text-uppercase tracking-wider small fw-bold mb-1" style={{ fontSize: '0.65rem' }}>{p.category}</div>
                            <h6 className="fw-bold mb-2 text-truncate" title={p.name}>{p.name}</h6>
                            <p className="text-muted mb-3 fw-medium">{fmt(p.price_per_day)} <span className="small text-muted fw-normal">/ day</span></p>
                          </div>
                          <div className="card-footer bg-white border-top p-3 d-flex gap-2 align-items-center">
                            <input type="number" min="0" defaultValue={p.quantity} className="form-control form-control-sm text-center fw-medium border-secondary" style={{ width: 60 }} onBlur={e => updateInventory(p.id, e.target.value)} title="Manage Inventory Quantity" />
                            <button className="btn btn-outline-secondary btn-sm flex-fill rounded-pill fw-medium" onClick={() => { setEditingListing(p); setListingFormVersion(v => v + 1); setTab("add"); }}>Edit</button>
                            <button
                              className={`btn btn-sm flex-fill rounded-pill fw-medium ${p.is_active ? "btn-outline-dark" : "btn-primary"}`}
                              onClick={() => toggleLive(p)} disabled={subLocked && !p.is_active}>
                              {p.is_active ? "Retire" : "Publish"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            </div>
          )}

          {/* ADD LISTING TAB */}
          {tab === "add" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4 d-flex align-items-center gap-3">
                <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" onClick={() => setTab("products")}><FiChevronRight style={{ transform: 'rotate(180deg)' }} /></button>
                <div>
                  <h4 className="fw-bold mb-0">{editingListing ? "Edit Listing" : "New Listing"}</h4>
                </div>
              </div>
              <div className="card-body p-4 bg-light bg-opacity-50">
                {subLocked && !editingListing
                  ? <div className="text-center py-5 bg-white rounded-3 border border-dashed"><FiShield size={48} className="text-muted mb-3 opacity-50" /><h5 className="fw-bold">Listing limit reached</h5><p className="text-muted">Upgrade to publish more.</p><button className="btn btn-primary rounded-pill px-4 mt-3 fw-medium d-inline-flex align-items-center" onClick={activateSub}><FiZap className="me-1" />Activate Growth Plan</button></div>
                  : <VendorEquipmentForm key={listingFormVersion} equipment={editingListing} onSaved={async r => { setCreatedListingId(r?.id || null); await loadDashboard(); setTab("products"); }} onCancel={() => setTab("products")} />
                }
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {tab === "reviews" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">Customer Reviews</h4>
                <p className="text-muted small mb-0 mt-1">{vendorReviews.length} entries</p>
              </div>
              <div className="card-body p-4 bg-light bg-opacity-50">
                {vendorReviews.length === 0
                  ? <div className="text-center py-5 bg-white rounded-3 border border-dashed"><FiStar size={48} className="text-muted mb-3 opacity-50" /><h5 className="fw-bold">No reviews yet</h5></div>
                  : <div className="d-flex flex-column gap-3">
                    {vendorReviews.map(r => (
                      <div key={r.id} className="card border-0 shadow-sm p-4 rounded-4">
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                          <div>
                            <h6 className="fw-bold mb-1 text-primary fs-5">{r.title || "Review"}</h6>
                            <div className="small text-muted fw-medium text-uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>{r.equipment_detail?.name} • {r.reviewer_name || "Anonymous"}</div>
                          </div>
                          <div className="bg-warning bg-opacity-10 px-2 py-1 rounded text-warning fs-6">
                            {[1, 2, 3, 4, 5].map(n => <span key={n}>{n <= r.rating ? "★" : "☆"}</span>)}
                          </div>
                        </div>
                        <p className="mb-0 text-dark fst-italic fs-6">"{r.comment}"</p>
                      </div>
                    ))}
                  </div>
                }
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {tab === "settings" && (
            <div className="card border-0 shadow-sm mb-4 rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">Settings</h4>
                <p className="text-muted small mb-0 mt-1">Profile & subscription configuration</p>
              </div>
              <div className="card-body p-4 p-md-5">
                <div className="row justify-content-center">
                  <div className="col-12 col-lg-8">
                    <form
                      onSubmit={async e => { e.preventDefault(); setSavingSettings(true); try { await vendorAPI.updateProfile(settingsForm); toast.success("Saved."); loadDashboard(); } catch (e) { toast.error(e.message); } finally { setSavingSettings(false); } }}
                      className="bg-light p-4 rounded-4 border shadow-sm"
                    >
                      <h5 className="fw-bold mb-4 border-bottom pb-3">Company Details</h5>
                      <div className="d-flex flex-column gap-3 mb-4">
                        {[
                          { label: "Company Name", key: "company_name", type: "text" },
                          { label: "Contact Email", key: "email", type: "email" },
                          { label: "Contact Phone", key: "phone", type: "tel" },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="form-label small fw-bold text-muted text-uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>{f.label}</label>
                            <input type={f.type} className="form-control bg-white" value={settingsForm[f.key]} onChange={e => setSettingsForm({ ...settingsForm, [f.key]: e.target.value })} />
                          </div>
                        ))}
                      </div>

                      <div className="border-top pt-4 mb-4">
                        <label className="form-label small fw-bold text-muted text-uppercase tracking-wider mb-3" style={{ fontSize: '0.65rem' }}>Plan</label>
                        <div className="d-flex align-items-center justify-content-between p-4 bg-white rounded-3 border shadow-sm">
                          <div>
                            <span className="fw-bold fs-5 text-dark d-block">{isGrowth ? "Growth Plan" : "No Active Plan"}</span>
                            <span className="text-muted small">{isGrowth ? "Unlimited listings enabled" : "Limited to 3 active listings"}</span>
                          </div>
                          {!isGrowth && <button type="button" className="btn btn-primary rounded-pill px-4 fw-medium" onClick={activateSub} disabled={activatingPlan}><FiZap className="me-1 mb-1" />Activate</button>}
                          {isGrowth && <span className="badge bg-success bg-opacity-25 text-success px-3 py-2 rounded-pill fw-bold"><FiRadio className="me-1" /> Active</span>}
                        </div>
                      </div>

                      <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="submit" className="btn btn-dark rounded-pill px-5 py-2 fw-bold shadow-sm" disabled={savingSettings}>
                          {savingSettings ? "Saving…" : "Save Changes"}
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