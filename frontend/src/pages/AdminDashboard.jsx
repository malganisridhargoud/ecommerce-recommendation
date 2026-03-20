import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { analyticsAPI, recommendationsAPI } from "../api/axiosConfig";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .ad-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .ad-root {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --ink: #1d1d1f;
    --ink-muted: #6b7280;
    --ink-subtle: #9ca3af;
    --surface: #ffffff;
    --surface-2: #f8f9fb;
    --surface-3: #f3f4f6;
    --border: #e5e7eb;
    --border-strong: #d1d5db;
    --accent: #f97316;
    --accent-light: #fff7ed;
    --accent-border: #fed7aa;
    --green: #059669;
    --green-light: #ecfdf5;
    --green-border: #a7f3d0;
    --red: #e11d48;
    --red-light: #fff1f2;
    --blue: #3b82f6;
    --blue-light: #eff6ff;
    --radius: 18px;
    --radius-sm: 10px;
    --transition: 250ms cubic-bezier(.16,1,.3,1);
    background: var(--surface-2);
    min-height: 100vh;
  }

  .ad-shell {
    max-width: 1320px;
    margin: 0 auto;
    padding: 32px 24px 56px;
    display: flex; flex-direction: column; gap: 24px;
  }
  @media (max-width: 640px) { .ad-shell { padding: 20px 16px 40px; } }

  /* ── Header ── */
  .ad-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
    background: var(--ink);
    border-radius: 24px;
    padding: 28px 32px;
    position: relative;
    overflow: hidden;
  }
  .ad-header::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .ad-header::after {
    content: '';
    position: absolute; top: -80px; right: -80px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(249,115,22,.2) 0%, transparent 65%);
    pointer-events: none;
  }
  .ad-header-left { position: relative; z-index: 1; }
  .ad-header-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 600; letter-spacing: .1em;
    text-transform: uppercase; color: var(--accent);
    margin-bottom: 8px;
  }
  .ad-header-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--accent);
    animation: ad-pulse 2s ease-in-out infinite;
  }
  @keyframes ad-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
  .ad-header-title {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 700; color: #fff; letter-spacing: -.03em;
    line-height: 1.15; margin-bottom: 6px;
  }
  .ad-header-sub { font-size: 13px; color: rgba(255,255,255,.45); }
  .ad-header-actions {
    display: flex; align-items: center; gap: 8px;
    position: relative; z-index: 1; flex-shrink: 0; flex-wrap: wrap;
  }

  /* Buttons */
  .ad-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px;
    border-radius: var(--radius-sm);
    font-family: inherit; font-size: 13px; font-weight: 500;
    cursor: pointer; border: none;
    transition: transform var(--transition), box-shadow var(--transition), opacity var(--transition), background var(--transition);
    white-space: nowrap;
  }
  .ad-btn:active { transform: scale(.97); }
  .ad-btn-ghost {
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.8);
    border: 1px solid rgba(255,255,255,.12);
  }
  .ad-btn-ghost:hover { background: rgba(255,255,255,.13); color: #fff; }
  .ad-btn-accent {
    background: var(--green); color: #fff;
    box-shadow: 0 1px 3px rgba(5,150,105,.3), 0 4px 12px rgba(5,150,105,.15);
  }
  .ad-btn-accent:hover { opacity: .9; transform: translateY(-1px); }
  .ad-btn-accent:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .ad-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
    border-radius: 50%; animation: ad-spin .65s linear infinite;
  }
  @keyframes ad-spin { to { transform: rotate(360deg); } }

  /* ── KPI cards ── */
  .ad-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  @media (max-width: 1024px) { .ad-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px)  { .ad-kpi-grid { grid-template-columns: 1fr; } }

  .ad-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    transition: box-shadow var(--transition), transform var(--transition);
    animation: ad-rise .4s cubic-bezier(.22,1,.36,1) both;
  }
  .ad-kpi:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.06); transform: translateY(-2px); }
  @keyframes ad-rise { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .ad-kpi-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
    flex-shrink: 0;
  }
  .ad-kpi-label {
    font-size: 11px; font-weight: 600;
    letter-spacing: .07em; text-transform: uppercase;
    color: var(--ink-subtle); margin-bottom: 6px;
  }
  .ad-kpi-value {
    font-family: 'DM Mono', monospace;
    font-size: 26px; font-weight: 500;
    letter-spacing: -.02em; line-height: 1;
  }
  .ad-kpi-sub {
    font-size: 11.5px; color: var(--ink-subtle); margin-top: 6px;
  }
  /* accent bar on left */
  .ad-kpi::before {
    content: '';
    position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; border-radius: 0 3px 3px 0;
  }
  .ad-kpi-revenue::before { background: var(--green); }
  .ad-kpi-vendors::before { background: var(--blue); }
  .ad-kpi-listings::before { background: var(--accent); }
  .ad-kpi-bookings::before { background: var(--ink); }

  /* ── Mid section ── */
  .ad-mid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 16px;
  }
  @media (max-width: 1024px) { .ad-mid { grid-template-columns: 1fr; } }

  /* Chart card */
  .ad-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px 24px;
    animation: ad-rise .45s cubic-bezier(.22,1,.36,1) both;
  }
  .ad-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
  }
  .ad-card-title {
    font-size: 15px; font-weight: 600;
    color: var(--ink); letter-spacing: -.015em;
  }
  .ad-card-subtitle { font-size: 12px; color: var(--ink-subtle); margin-top: 2px; }

  /* Chart loading */
  .ad-chart-loading {
    height: 280px; display: flex; align-items: center; justify-content: center;
  }
  .ad-chart-spinner {
    width: 32px; height: 32px;
    border: 3px solid var(--border); border-top-color: var(--ink);
    border-radius: 50%; animation: ad-spin .7s linear infinite;
  }
  .ad-chart-empty {
    height: 280px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    color: var(--ink-subtle);
  }
  .ad-chart-error {
    border-radius: var(--radius-sm);
    background: var(--red-light);
    border: 1px solid #fecdd3;
    padding: 12px 16px;
    font-size: 13px; color: var(--red);
  }

  /* Custom tooltip */
  .ad-tooltip {
    background: var(--ink);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    border: none;
    box-shadow: 0 8px 24px rgba(0,0,0,.2);
  }
  .ad-tooltip-label { font-size: 11px; color: rgba(255,255,255,.5); margin-bottom: 4px; text-transform: capitalize; }
  .ad-tooltip-value { font-family: 'DM Mono', monospace; font-size: 14px; color: #fff; }

  /* Highlights panel */
  .ad-highlights { display: flex; flex-direction: column; gap: 10px; }
  .ad-highlight {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    transition: border-color var(--transition);
  }
  .ad-highlight:hover { border-color: var(--border-strong); }
  .ad-highlight-label {
    font-size: 10.5px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--ink-subtle); margin-bottom: 6px;
  }
  .ad-highlight-value {
    font-family: 'DM Mono', monospace;
    font-size: 17px; font-weight: 500; color: var(--ink);
    letter-spacing: -.01em; text-transform: capitalize;
  }
  .ad-highlight-sub { font-size: 12px; color: var(--ink-muted); margin-top: 4px; }

  /* ── Activity section ── */
  .ad-activity {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (max-width: 1024px) { .ad-activity { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px)  { .ad-activity { grid-template-columns: 1fr; } }

  .ad-feed { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .ad-feed::-webkit-scrollbar { width: 4px; }
  .ad-feed::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .ad-feed-item {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    transition: border-color var(--transition), background var(--transition);
    animation: ad-rise .3s cubic-bezier(.22,1,.36,1) both;
  }
  .ad-feed-item:hover { border-color: var(--border-strong); background: var(--surface-2); }

  .ad-feed-title { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ad-feed-meta  { font-size: 11.5px; color: var(--ink-subtle); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ad-feed-row   { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; }

  .ad-status-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 20px;
    font-size: 10.5px; font-weight: 500; letter-spacing: .03em;
    text-transform: capitalize;
  }
  .ad-status-confirmed, .ad-status-paid, .ad-status-completed {
    background: var(--green-light); color: var(--green); border: 1px solid var(--green-border);
  }
  .ad-status-pending {
    background: var(--accent-light); color: var(--accent); border: 1px solid var(--accent-border);
  }
  .ad-status-cancelled, .ad-status-failed {
    background: var(--red-light); color: var(--red); border: 1px solid #fecdd3;
  }
  .ad-status-default {
    background: var(--surface-3); color: var(--ink-muted); border: 1px solid var(--border);
  }

  .ad-feed-amount {
    font-family: 'DM Mono', monospace;
    font-size: 12px; font-weight: 500; color: var(--ink); flex-shrink: 0;
  }

  .ad-stars { color: var(--accent); font-size: 12px; letter-spacing: 1px; }

  .ad-empty-feed { font-size: 12.5px; color: var(--ink-subtle); text-align: center; padding: 32px 0; }
`;

/* Pill helper */
function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  let cls = "ad-status-default";
  if (["confirmed", "paid", "completed"].includes(s)) cls = "ad-status-confirmed";
  else if (s === "pending") cls = "ad-status-pending";
  else if (["cancelled", "failed"].includes(s)) cls = "ad-status-cancelled";
  return <span className={`ad-status-pill ${cls}`}>{status}</span>;
}

/* Custom tooltip for recharts */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ad-tooltip">
      <div className="ad-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="ad-tooltip-value">
          {p.dataKey === "revenue"
            ? formatCurrency(p.value)
            : `${Number(p.value).toLocaleString("en-IN")} bookings`}
        </div>
      ))}
    </div>
  );
}

/* KPI card */
function KpiCard({ label, value, sub, colorClass, icon, delay = 0 }) {
  return (
    <article className={`ad-kpi ${colorClass}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="ad-kpi-icon" style={{ background: "var(--surface-3)" }}>
        {icon}
      </div>
      <div className="ad-kpi-label">{label}</div>
      <div className="ad-kpi-value">{value}</div>
      {sub && <div className="ad-kpi-sub">{sub}</div>}
    </article>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ platformRevenue: 0, activeVendors: 0, activeListings: 0, totalBookings: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [training, setTraining] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await analyticsAPI.admin();
      setStats({
        platformRevenue: Number(data?.platform_revenue || 0),
        activeVendors: Number(data?.active_vendors || 0),
        activeListings: Number(data?.active_listings || 0),
        totalBookings: Number(data?.total_bookings || 0),
      });
      const cats = Array.isArray(data?.bookings_by_category) ? data.bookings_by_category : [];
      setCategoryData(cats.map(i => ({ name: i.equipment__category || "other", bookings: Number(i.count || 0), revenue: Number(i.revenue || 0) })));
      setRecentBookings(Array.isArray(data?.recent_bookings) ? data.recent_bookings : []);
      setRecentPayments(Array.isArray(data?.recent_payments) ? data.recent_payments : []);
      setRecentReviews(Array.isArray(data?.recent_reviews) ? data.recent_reviews : []);
    } catch (err) {
      const msg = err.message || "Unable to load admin analytics.";
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const trainRecommendations = async () => {
    setTraining(true);
    try {
      const result = await recommendationsAPI.train();
      toast.success(`Model trained on ${result.equipment_count} items`);
    } catch (err) {
      toast.error(err.message || "Training failed");
    } finally {
      setTraining(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/login/admin";
  };

  const topCategory = useMemo(() => {
    if (!categoryData.length) return null;
    return [...categoryData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [categoryData]);

  const listingsPerVendor = stats.activeVendors > 0
    ? (stats.activeListings / stats.activeVendors).toFixed(1) : "0.0";
  const revenuePerBooking = stats.totalBookings > 0
    ? formatCurrency(stats.platformRevenue / stats.totalBookings) : formatCurrency(0);

  return (
    <>
      <style>{styles}</style>
      <div className="ad-root">
        <div className="ad-shell">

          {/* ── Header ── */}
          <header className="ad-header">
            <div className="ad-header-left">
              <div className="ad-header-eyebrow">
                <span className="ad-header-dot" /> Platform Operations
              </div>
              <h1 className="ad-header-title">Admin Dashboard</h1>
              <p className="ad-header-sub">Monitor platform growth, activity, and category-level performance.</p>
            </div>
            <div className="ad-header-actions">
              <button 
                onClick={handleLogout} 
                className="ad-btn ad-btn-ghost text-red mx-2"
                style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
              >
                Log Out
              </button>
              <button className="ad-btn ad-btn-accent" onClick={trainRecommendations} disabled={training}>
                {training ? <><span className="ad-spinner" /> Training…</> : <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                  Train Recommender
                </>}
              </button>
              <button className="ad-btn ad-btn-ghost" onClick={loadDashboard}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                Refresh
              </button>
            </div>
          </header>

          {/* ── KPI row ── */}
          <section className="ad-kpi-grid">
            <KpiCard delay={0} colorClass="ad-kpi-revenue" label="Platform Revenue" value={formatCurrency(stats.platformRevenue)} sub="All-time gross"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={`var(--green)`} strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
            />
            <KpiCard delay={60} colorClass="ad-kpi-vendors" label="Active Vendors" value={stats.activeVendors.toLocaleString("en-IN")} sub="Currently onboarded"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={`var(--blue)`} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
            />
            <KpiCard delay={120} colorClass="ad-kpi-listings" label="Active Listings" value={stats.activeListings.toLocaleString("en-IN")} sub="Bookable equipment"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={`var(--accent)`} strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>}
            />
            <KpiCard delay={180} colorClass="ad-kpi-bookings" label="Total Bookings" value={stats.totalBookings.toLocaleString("en-IN")} sub="Confirmed + completed"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={`var(--ink)`} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
            />
          </section>

          {/* ── Chart + Highlights ── */}
          <section className="ad-mid">
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <div className="ad-card-title">Bookings by Category</div>
                  <div className="ad-card-subtitle">Volume across all equipment types</div>
                </div>
              </div>
              {loading ? (
                <div className="ad-chart-loading"><div className="ad-chart-spinner" /></div>
              ) : error ? (
                <div className="ad-chart-error">{error}</div>
              ) : categoryData.length === 0 ? (
                <div className="ad-chart-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                  <span style={{ fontSize: 13 }}>No category data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-muted)", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ink-muted)", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-3)", radius: 6 }} />
                    <Bar dataKey="bookings" fill="var(--ink)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <div className="ad-card-title">Highlights</div>
                  <div className="ad-card-subtitle">Key platform ratios</div>
                </div>
              </div>
              <div className="ad-highlights">
                <div className="ad-highlight">
                  <div className="ad-highlight-label">Top Category</div>
                  <div className="ad-highlight-value">{topCategory ? topCategory.name : "—"}</div>
                  {topCategory && <div className="ad-highlight-sub">{topCategory.bookings} bookings · {formatCurrency(topCategory.revenue)}</div>}
                </div>
                <div className="ad-highlight">
                  <div className="ad-highlight-label">Listings / Vendor</div>
                  <div className="ad-highlight-value">{listingsPerVendor}</div>
                  <div className="ad-highlight-sub">Average active listings per vendor</div>
                </div>
                <div className="ad-highlight">
                  <div className="ad-highlight-label">Revenue / Booking</div>
                  <div className="ad-highlight-value">{revenuePerBooking}</div>
                  <div className="ad-highlight-sub">Average booking value</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Activity feeds ── */}
          <section className="ad-activity">

            {/* Bookings */}
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <div className="ad-card-title">Recent Bookings</div>
                  <div className="ad-card-subtitle">Latest rental requests</div>
                </div>
              </div>
              <div className="ad-feed">
                {recentBookings.length === 0
                  ? <div className="ad-empty-feed">No booking activity yet</div>
                  : recentBookings.map((row, i) => (
                    <div key={row.id} className="ad-feed-item" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="ad-feed-title">{row.equipment__name}</div>
                      <div className="ad-feed-meta">{row.equipment__vendor__company_name}</div>
                      <div className="ad-feed-row">
                        <StatusPill status={row.status} />
                        <span className="ad-feed-amount">{formatCurrency(row.total_price)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Payments */}
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <div className="ad-card-title">Recent Payments</div>
                  <div className="ad-card-subtitle">Stripe transaction log</div>
                </div>
              </div>
              <div className="ad-feed">
                {recentPayments.length === 0
                  ? <div className="ad-empty-feed">No payment activity yet</div>
                  : recentPayments.map((row, i) => (
                    <div key={row.id} className="ad-feed-item" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="ad-feed-title">{row.booking__equipment__name}</div>
                      <div className="ad-feed-meta">{row.booking__user_id}</div>
                      <div className="ad-feed-row">
                        <StatusPill status={row.status} />
                        <span className="ad-feed-amount">{formatCurrency(row.amount)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="ad-card">
              <div className="ad-card-header">
                <div>
                  <div className="ad-card-title">Recent Reviews</div>
                  <div className="ad-card-subtitle">Buyer feedback on equipment</div>
                </div>
              </div>
              <div className="ad-feed">
                {recentReviews.length === 0
                  ? <div className="ad-empty-feed">No reviews yet</div>
                  : recentReviews.map((row, i) => (
                    <div key={row.id} className="ad-feed-item" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="ad-feed-title">{row.equipment__name}</div>
                      <div className="ad-feed-meta">{row.equipment__vendor__company_name}</div>
                      <div className="ad-feed-row">
                        <span className="ad-stars">{"★".repeat(Number(row.rating || 0))}{"☆".repeat(5 - Number(row.rating || 0))}</span>
                        <span style={{ fontSize: 11, color: "var(--ink-subtle)" }}>Rating {row.rating}/5</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </section>
        </div>
      </div>
    </>
  );
}