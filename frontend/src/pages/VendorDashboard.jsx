import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import VendorEquipmentForm from "../components/vendor/VendorEquipmentForm";
import {
  analyticsAPI, bookingsAPI, chatAPI, equipmentAPI,
  paymentsAPI, vendorAPI, subscriptionAPI, controlAPI
} from "../api/axiosConfig";
import { openBookingSocket } from "../lib/realtime";
import {
  FiTrendingUp, FiPackage, FiBox, FiMessageSquare, FiSettings,
  FiPlus, FiStar, FiCheckCircle, FiClock, FiSend, FiTruck,
  FiZap, FiShield, FiXCircle,
  FiChevronRight,
  FiRadio, FiLock
} from "react-icons/fi";

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(v) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(Number(v || 0));
}
function describeClose(code) {
  if (code === 4401) return "Auth failure — re-authenticate";
  if (code === 1006) return "Connection dropped";
  return code ? `Disconnected [${code}]` : "Unavailable";
}

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,700&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

:root {
  --bg:       #f7f6f3;
  --surface:  #ffffff;
  --surface2: #f2f1ee;
  --border:   #e8e6e1;
  --border2:  #d8d5ce;
  --ink:      #1a1714;
  --ink2:     #3d3830;
  --ink3:     #6b6358;
  --ink4:     #9c9289;
  --ink5:     #c4bfb8;
  --coral:    #c8604a;
  --coral2:   #e07a63;
  --coral-bg: #fdf1ee;
  --coral-border: #f5d0c8;
  --teal:     #2a7a6e;
  --teal-bg:  #edf7f5;
  --amber:    #b87333;
  --amber-bg: #fdf5ec;
  --serif:    'Fraunces', Georgia, serif;
  --mono:     'DM Mono', 'Courier New', monospace;
}

/* ── Reset ── */
.vd { all: unset; display: block; }
.vd *, .vd *::before, .vd *::after { box-sizing: border-box; }
.vd { font-family: var(--mono); background: var(--bg); color: var(--ink); min-height: 100vh; }

/* subtle linen texture */
.vd::before {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 300px;
}
.vd > * { position: relative; z-index: 1; }

/* ── TOP BAR ── */
.topbar {
  height: 56px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
  position: sticky; top: 0; z-index: 200;
}
.topbar-logo {
  font-family: var(--serif); font-size: 18px; font-weight: 500;
  color: var(--ink); letter-spacing: -0.02em;
  display: flex; align-items: center; gap: 10px;
}
.topbar-logo-accent { color: var(--coral); font-style: italic; }
.topbar-center {
  display: flex; align-items: center; gap: 2px;
}
.topbar-right { display: flex; align-items: center; gap: 16px; }
.live-chip {
  display: flex; align-items: center; gap: 6px;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ink4); padding: 4px 10px; border: 1px solid var(--border);
  background: var(--surface);
}
.live-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.live-dot-on  { background: var(--teal); box-shadow: 0 0 0 2px rgba(42,122,110,0.2); animation: livepulse 2.5s ease infinite; }
.live-dot-off { background: var(--amber); }
@keyframes livepulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(42,122,110,0.2); }
  50%      { box-shadow: 0 0 0 4px rgba(42,122,110,0.05); }
}
.plan-chip {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 4px 10px; border: 1px solid;
}
.plan-chip-growth { color: var(--coral); border-color: var(--coral-border); background: var(--coral-bg); }
.plan-chip-std    { color: var(--ink4); border-color: var(--border); background: var(--surface); }
.vendor-name { font-family: var(--serif); font-size: 14px; font-weight: 500; color: var(--ink2); letter-spacing: -0.01em; font-style: italic; }

/* ── LAYOUT ── */
.layout { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100vh - 56px); }

/* ── SIDEBAR ── */
.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 32px 0 32px;
  display: flex; flex-direction: column;
  position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto;
}
.sidebar-section-label {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--ink5); padding: 0 24px 10px; margin-top: 8px;
}
.nav-item {
  all: unset; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 24px;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em;
  color: var(--ink3); transition: color 0.15s, background 0.15s;
  position: relative;
}
.nav-item:hover { color: var(--ink); background: var(--bg); }
.nav-item.active {
  color: var(--ink);
  background: var(--bg);
}
.nav-item.active::before {
  content: '';
  position: absolute; left: 0; top: 25%; bottom: 25%;
  width: 2px; background: var(--coral);
}
.nav-item-inner { display: flex; align-items: center; gap: 10px; }
.nav-badge {
  background: var(--coral); color: #fff;
  font-size: 8px; font-weight: 500; padding: 1px 6px;
  letter-spacing: 0.05em; border-radius: 20px;
}
.sidebar-footer {
  margin-top: auto; padding: 20px 24px 0;
  border-top: 1px solid var(--border);
}
.sidebar-status {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.08em;
  color: var(--ink5); line-height: 1.7;
}

/* ── MAIN ── */
.main { background: var(--bg); min-height: calc(100vh - 56px); }

/* ── SECTION HEADER ── */
.sec-header {
  padding: 32px 40px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.sec-eyebrow {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--coral); margin-bottom: 6px;
}
.sec-title {
  font-family: var(--serif); font-size: 36px; font-weight: 400;
  color: var(--ink); letter-spacing: -0.03em; line-height: 1.1;
  font-style: italic;
}
.sec-sub {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
  color: var(--ink4); margin-top: 4px;
}

/* ── BUTTONS ── */
.btn {
  all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 9px 18px; border: 1px solid; transition: all 0.15s;
}
.btn:disabled { opacity: 0.35; pointer-events: none; }
.btn-coral { background: var(--coral); color: #fff; border-color: var(--coral); }
.btn-coral:hover { background: var(--coral2); border-color: var(--coral2); }
.btn-ghost { background: transparent; color: var(--ink2); border-color: var(--border2); }
.btn-ghost:hover { border-color: var(--ink3); color: var(--ink); }
.btn-teal  { background: var(--teal); color: #fff; border-color: var(--teal); }
.btn-teal:hover { opacity: 0.88; }
.btn-danger { background: transparent; color: var(--coral); border-color: var(--coral-border); }
.btn-danger:hover { background: var(--coral-bg); }

/* ── STAT BAND ── */
.stat-band { display: grid; grid-template-columns: repeat(5, 1fr); background: var(--surface); border-bottom: 1px solid var(--border); }
@media(max-width:900px){ .stat-band { grid-template-columns: repeat(3,1fr); } }
.stat-cell {
  padding: 24px 28px; border-right: 1px solid var(--border);
  position: relative; transition: background 0.15s;
  display: flex; flex-direction: column; gap: 5px;
  overflow: hidden;
}
.stat-cell:last-child { border-right: none; }
.stat-cell:hover { background: var(--bg); }
/* accent bottom-bar on hover */
.stat-cell::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--coral); transform: scaleX(0); transform-origin: left;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1);
}
.stat-cell:hover::after { transform: scaleX(1); }
.stat-cell.featured { background: var(--ink); }
.stat-cell.featured:hover { background: var(--ink2); }
.stat-cell.featured::after { background: var(--coral2); }
.sc-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink4); }
.sc-label-inv { color: rgba(255,255,255,0.4); }
.sc-value { font-family: var(--serif); font-size: 28px; font-weight: 300; letter-spacing: -0.03em; color: var(--ink); line-height: 1; font-style: italic; }
.sc-value-inv { color: #fff; }
.sc-sub { font-family: var(--mono); font-size: 9px; color: var(--ink5); letter-spacing: 0.05em; }
.sc-sub-inv { color: rgba(255,255,255,0.3); }

/* ── CONTENT PADDING ── */
.content { padding: 32px 40px; display: flex; flex-direction: column; gap: 28px; }

/* ── HAIRLINE CARDS ── */
.card {
  background: var(--surface); border: 1px solid var(--border);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.card:hover { border-color: var(--border2); box-shadow: 0 4px 24px rgba(26,23,20,0.04); }
.card-header {
  padding: 20px 28px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.card-title {
  font-family: var(--serif); font-size: 16px; font-weight: 400;
  color: var(--ink); letter-spacing: -0.02em; font-style: italic;
}
.card-meta { font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; color: var(--ink4); text-transform: uppercase; }

/* ── BOOKING ROWS ── */
.booking-row {
  display: grid; grid-template-columns: 80px 1fr 160px 200px;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.booking-row:last-child { border-bottom: none; }
.booking-row:hover { background: var(--bg); }
.br-thumb { border-right: 1px solid var(--border); overflow: hidden; background: var(--surface2); }
.br-thumb img { width:100%; height:100%; object-fit:cover; filter:contrast(1.02) saturate(0.9); transition: filter 0.3s; }
.booking-row:hover .br-thumb img { filter: contrast(1.05) saturate(1); }
.br-thumb-empty { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color: var(--ink5); }
.br-info { padding: 18px 24px; display: flex; flex-direction: column; gap: 4px; justify-content: center; }
.br-id { font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em; color: var(--ink4); text-transform: uppercase; }
.br-name { font-family: var(--serif); font-size: 18px; font-weight: 400; color: var(--ink); letter-spacing: -0.02em; font-style: italic; }
.br-meta { font-family: var(--mono); font-size: 10px; color: var(--ink4); letter-spacing: 0.05em; }
.br-price { padding: 18px 24px; border-left: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.br-amount { font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--ink); letter-spacing: -0.02em; }
.br-actions { padding: 18px 24px; border-left: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; justify-content: center; }

/* ── STATUS TAGS ── */
.tag {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
  padding: 3px 9px; border: 1px solid;
}
.tag-pending   { color: var(--amber); border-color: rgba(184,115,51,0.25); background: var(--amber-bg); }
.tag-confirmed { color: var(--teal);  border-color: rgba(42,122,110,0.2);  background: var(--teal-bg); }
.tag-active    { color: var(--teal);  border-color: rgba(42,122,110,0.2);  background: var(--teal-bg); }
.tag-shipped   { color: var(--ink2);  border-color: var(--border2);        background: var(--surface2); }
.tag-delivered { color: var(--teal);  border-color: rgba(42,122,110,0.2);  background: var(--teal-bg); }
.tag-completed { color: var(--ink3);  border-color: var(--border);         background: var(--surface2); }
.tag-cancelled { color: var(--coral); border-color: var(--coral-border);   background: var(--coral-bg); }

/* ── PRODUCT GRID ── */
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1px; background: var(--border); }
.product-card {
  background: var(--surface);
  display: flex; flex-direction: column;
  transition: background 0.15s;
  position: relative;
}
.product-card:hover { background: var(--bg); }
.product-card.highlighted { outline: 2px solid var(--coral); outline-offset: -1px; }
.pc-img { aspect-ratio: 4/3; overflow: hidden; background: var(--surface2); position: relative; }
.pc-img img { width:100%; height:100%; object-fit:cover; filter:saturate(0.85); transition: filter 0.4s, transform 0.5s; }
.product-card:hover .pc-img img { filter:saturate(1); transform: scale(1.03); }
.pc-badge {
  position: absolute; top: 12px; left: 12px;
  font-family: var(--mono); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
  padding: 3px 8px; border: 1px solid;
  backdrop-filter: blur(6px);
}
.pc-badge-live { background: rgba(237,247,245,0.9); color: var(--teal); border-color: rgba(42,122,110,0.25); }
.pc-badge-off  { background: rgba(26,23,20,0.65); color: rgba(255,255,255,0.5); border-color: rgba(255,255,255,0.1); }
.pc-body { padding: 18px 20px; flex: 1; display: flex; flex-direction: column; gap: 5px; }
.pc-cat { font-family: var(--mono); font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink4); }
.pc-name { font-family: var(--serif); font-size: 20px; font-weight: 400; color: var(--ink); letter-spacing: -0.02em; font-style: italic; line-height: 1.15; }
.pc-price { font-family: var(--serif); font-size: 16px; font-weight: 300; color: var(--ink2); margin-top: 4px; }
.pc-price small { font-family: var(--mono); font-size: 9px; color: var(--ink4); font-style: normal; }
.pc-footer { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; gap: 8px; align-items: center; }
.qty-input {
  width: 52px; background: var(--bg); border: 1px solid var(--border);
  color: var(--ink); padding: 7px 6px; font-family: var(--mono); font-size: 12px;
  font-weight: 500; text-align: center; outline: none; transition: border-color 0.12s;
}
.qty-input:focus { border-color: var(--ink3); }

/* ── LOG ROWS ── */
.log-row {
  display: grid; grid-template-columns: 92px 1fr 100px;
  padding: 10px 28px; border-bottom: 1px solid var(--border);
  font-family: var(--mono); font-size: 10px; align-items: center;
  transition: background 0.1s; gap: 16px;
}
.log-row:last-child { border-bottom: none; }
.log-row:hover { background: var(--bg); }
.log-ts { color: var(--ink5); font-size: 9px; letter-spacing: 0.05em; }
.log-ev { color: var(--ink2); }
.log-ok   { color: var(--teal);  font-weight: 500; text-transform: uppercase; font-size: 9px; letter-spacing: 0.12em; }
.log-warn { color: var(--amber); font-weight: 500; text-transform: uppercase; font-size: 9px; letter-spacing: 0.12em; }
.log-err  { color: var(--coral); font-weight: 500; text-transform: uppercase; font-size: 9px; letter-spacing: 0.12em; }

/* ── ANA ROWS ── */
.ana-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 12px 28px; border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}
.ana-row:last-child { border-bottom: none; }
.ana-row:hover { background: var(--bg); }
.ana-key { font-family: var(--mono); font-size: 10px; color: var(--ink3); letter-spacing: 0.06em; }
.ana-val { font-family: var(--serif); font-size: 18px; font-weight: 300; color: var(--ink); letter-spacing: -0.02em; font-style: italic; }

/* ── USAGE BAR ── */
.usage-wrap { padding: 18px 28px; border-bottom: 1px solid var(--border); }
.usage-labels { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; color: var(--ink4); text-transform: uppercase; margin-bottom: 8px; }
.usage-track { height: 3px; background: var(--border); }
.usage-fill { height: 100%; background: var(--ink); transition: width 1.2s cubic-bezier(.4,0,.2,1); }
.usage-fill.hot { background: var(--coral); }

/* ── FIELD FORMS ── */
.field-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--ink4); display: block; margin-bottom: 8px; }
.field-input {
  width: 100%; background: var(--bg); border: 1px solid var(--border);
  color: var(--ink); padding: 11px 14px; font-family: var(--mono); font-size: 12px;
  outline: none; transition: border-color 0.12s;
}
.field-input:focus { border-color: var(--ink3); }
.field-select {
  width: 100%; background: var(--bg); border: 1px solid var(--border);
  color: var(--ink); padding: 11px 14px; font-family: var(--mono); font-size: 12px;
  outline: none; appearance: none; transition: border-color 0.12s;
}
.field-select:focus { border-color: var(--ink3); }

/* ── ALERT / PLAN BANNERS ── */
.alert-banner {
  padding: 12px 32px; border-bottom: 1px solid var(--coral-border);
  background: var(--coral-bg);
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.alert-text { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--coral); display: flex; align-items: center; gap: 8px; }
.plan-banner {
  padding: 11px 32px; border-bottom: 1px solid var(--border);
  background: var(--ink); color: rgba(255,255,255,0.55);
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.plan-banner-txt { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 8px; }
.plan-chips { display: flex; gap: 8px; }
.plan-chip-sm {
  font-family: var(--mono); font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase;
  padding: 3px 9px; border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.45);
}

/* ── KYC ── */
.kyc-row { padding: 28px 40px; display: flex; align-items: center; gap: 20px; border-bottom: 1px solid var(--border); }
.kyc-icon-wrap { width: 56px; height: 56px; border: 1px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kyc-icon-v { border-color: rgba(42,122,110,0.3); color: var(--teal); background: var(--teal-bg); }
.kyc-icon-p { border-color: rgba(184,115,51,0.3); color: var(--amber); background: var(--amber-bg); }
.kyc-icon-n { border-color: var(--border); color: var(--ink4); background: var(--surface2); }
.kyc-state { font-family: var(--serif); font-size: 26px; font-weight: 400; color: var(--ink); letter-spacing: -0.02em; font-style: italic; text-transform: capitalize; }
.kyc-desc  { font-family: var(--mono); font-size: 10px; color: var(--ink4); letter-spacing: 0.06em; margin-top: 3px; }

/* ── PAYOUT PANEL ── */
.payout-kv-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--border); }
.payout-kv { padding: 24px 32px; border-right: 1px solid var(--border); }
.payout-kv:last-child { border-right: none; }
.payout-kv-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink4); margin-bottom: 8px; }
.payout-kv-val { font-family: var(--serif); font-size: 40px; font-weight: 300; color: var(--ink); letter-spacing: -0.03em; line-height: 1; font-style: italic; }
.payout-kv-sub { font-family: var(--mono); font-size: 9px; color: var(--ink5); margin-top: 5px; letter-spacing: 0.05em; }

/* ── TABLE ── */
.vd-tbl { width: 100%; border-collapse: collapse; }
.vd-tbl th { font-family: var(--mono); font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink4); padding: 12px 24px; border-bottom: 1px solid var(--border); text-align: left; background: var(--surface2); }
.vd-tbl td { padding: 14px 24px; border-bottom: 1px solid var(--border); font-family: var(--mono); font-size: 11px; }
.vd-tbl tr:last-child td { border-bottom: none; }
.vd-tbl tr:hover td { background: var(--bg); }

/* ── REVIEW ── */
.review-card { border-bottom: 1px solid var(--border); padding: 24px 40px; background: var(--surface); transition: background 0.12s; }
.review-card:hover { background: var(--bg); }
.review-quote { font-family: var(--serif); font-size: 15px; font-style: italic; font-weight: 300; color: var(--ink2); line-height: 1.7; border-left: 2px solid var(--coral); padding-left: 16px; margin: 12px 0; }
.review-thread { margin-top: 14px; padding-left: 20px; border-left: 1px dashed var(--border2); display: flex; flex-direction: column; gap: 10px; }
.reply-who { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; }
.reply-who-v { color: var(--coral); }
.reply-who-u { color: var(--ink4); }
.reply-body { font-family: var(--mono); font-size: 11px; color: var(--ink3); line-height: 1.6; }

/* ── CHAT ── */
.chat-layout { display: grid; grid-template-columns: 240px 1fr; height: calc(100vh - 56px - 57px); }
.chat-threads { background: var(--surface); border-right: 1px solid var(--border); overflow-y: auto; }
.chat-thread-item { padding: 14px 20px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
.chat-thread-item:hover { background: var(--bg); }
.chat-thread-item.active { background: var(--bg); border-left: 2px solid var(--coral); }
.ct-name { font-family: var(--serif); font-size: 14px; font-weight: 400; font-style: italic; color: var(--ink); letter-spacing: -0.01em; }
.ct-meta { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; color: var(--ink4); margin-top: 2px; text-transform: uppercase; }
.chat-main { display: flex; flex-direction: column; background: var(--bg); }
.chat-top { padding: 14px 24px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.chat-top-name { font-family: var(--serif); font-size: 16px; font-style: italic; color: var(--ink); }
.chat-msgs { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 10px; }
.msg { max-width: 72%; }
.msg-me   { align-self: flex-end; }
.msg-them { align-self: flex-start; }
.msg-bubble { padding: 10px 16px; font-family: var(--mono); font-size: 11px; line-height: 1.55; }
.msg-me   .msg-bubble { background: var(--ink); color: rgba(255,255,255,0.85); }
.msg-them .msg-bubble { background: var(--surface); border: 1px solid var(--border); color: var(--ink2); }
.chat-input-row { padding: 14px 24px; border-top: 1px solid var(--border); background: var(--surface); display: flex; gap: 0; }
.chat-input {
  flex: 1; background: var(--bg); border: 1px solid var(--border); border-right: none;
  color: var(--ink); padding: 10px 16px; font-family: var(--mono); font-size: 11px; outline: none;
  transition: border-color 0.12s;
}
.chat-input:focus { border-color: var(--ink3); }
.chat-send {
  all: unset; cursor: pointer; width: 44px; background: var(--ink); color: rgba(255,255,255,0.8);
  display: flex; align-items: center; justify-content: center; border: 1px solid var(--ink);
  transition: background 0.12s;
}
.chat-send:hover { background: var(--coral); border-color: var(--coral); }

/* ── EMPTY ── */
.empty { padding: 72px 40px; text-align: center; font-family: var(--mono); font-size: 9px; letter-spacing: 0.3em; color: var(--ink5); text-transform: uppercase; display: flex; flex-direction: column; align-items: center; gap: 14px; }

/* ── ANIMATE IN ── */
@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.fade-up { animation: fadeUp 0.35s cubic-bezier(.4,0,.2,1) both; }

/* ── LOADING ── */
.loading-wrap { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; }
.loading-ring { width: 32px; height: 32px; border: 1.5px solid var(--border2); border-top-color: var(--coral); border-radius: 50%; animation: spin 0.85s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── SETTINGS ── */
.settings-wrap { max-width: 560px; padding: 32px 40px; display: flex; flex-direction: column; gap: 22px; }

@media(max-width:860px){
  .layout { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; flex-direction: row; flex-wrap: wrap; padding: 8px 12px; }
  .sidebar-section-label,.sidebar-footer { display: none; }
  .nav-item { padding: 7px 12px; border-left: none; border-bottom: 2px solid transparent; font-size: 10px; }
  .nav-item.active { border-bottom-color: var(--coral); border-left: none; background: transparent; }
  .nav-item.active::before { display: none; }
  .stat-band { grid-template-columns: repeat(2,1fr); }
  .booking-row { grid-template-columns: 60px 1fr; }
  .br-price,.br-actions { display: none; }
  .chat-layout { grid-template-columns: 1fr; height: auto; }
  .payout-kv-grid { grid-template-columns: 1fr; }
  .payout-kv { border-right: none; border-bottom: 1px solid var(--border); }
  .sec-header { padding: 20px 20px 16px; }
  .content { padding: 20px 20px; gap: 20px; }
}
`;

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */
function StatusTag({ status }) {
  const s = (status || "").toLowerCase();
  const map = { pending:"tag-pending", confirmed:"tag-confirmed", active:"tag-active", shipped:"tag-shipped", delivered:"tag-delivered", completed:"tag-completed", cancelled:"tag-cancelled" };
  return <span className={`tag ${map[s] || "tag-shipped"}`}>{status}</span>;
}

function PayoutsView({ payouts, bankAccount, onRefresh }) {
  const [sched, setSched] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [stripeId, setStripeId] = useState(bankAccount?.stripe_connect_account_id || "");
  const [saving, setSaving] = useState(false);

  const isVerified = bankAccount?.verification_status === "verified";
  const pendingAmt = payouts.reduce((a, p) => p.status === "pending" ? a + Number(p.net_amount) : a, 0);

  const go = async () => {
    setSched(true);
    try { await paymentsAPI.schedulePayout(); toast.success("Payout initiated."); onRefresh(); }
    catch (e) { toast.error(e.message || "Failed."); }
    finally { setSched(false); }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (!stripeId) return toast.error("Account ID required.");
    setSaving(true);
    try {
      if (bankAccount?.id) {
        await paymentsAPI.updateBankAccount({ stripe_connect_account_id: stripeId });
      } else {
        await paymentsAPI.saveBankAccount({ stripe_connect_account_id: stripeId });
      }
      toast.success("Stripe account connected.");
      setShowSetup(false);
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to connect.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-up">
      <div className="sec-header">
        <div>
          <div className="sec-eyebrow">Financial</div>
          <div className="sec-title">Ledger</div>
          <div className="sec-sub">Settlements · Payouts · Connected accounts</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {!bankAccount?.stripe_connect_account_id && <button className="btn btn-ghost" onClick={() => setShowSetup(!showSetup)}>Setup Stripe Connect</button>}
          {bankAccount?.stripe_connect_account_id && !isVerified && <button className="btn btn-ghost" onClick={() => setShowSetup(!showSetup)}>Update Account</button>}
          {isVerified && <button className="btn btn-coral" onClick={go} disabled={sched}><FiSend size={11}/>{sched?"Processing…":"Transfer Funds"}</button>}
        </div>
      </div>

      {showSetup && (
        <div style={{ padding: "20px 24px", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>Connect Stripe Account</div>
          <form onSubmit={handleSetup} style={{ display: "flex", gap: 12 }}>
            <input 
              className="vd-input" 
              placeholder="e.g. acct_100..." 
              value={stripeId} 
              onChange={e => setStripeId(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-dark" disabled={saving}>
              {saving ? "Saving..." : "Connect"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowSetup(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div style={{background:"var(--surface)"}}>
        <div className="payout-kv-grid">
          <div className="payout-kv">
            <div className="payout-kv-lbl">Connected Account</div>
            <div style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--ink2)",wordBreak:"break-all",letterSpacing:"0.04em"}}>{bankAccount?.stripe_connect_account_id || "—"}</div>
            <div className="payout-kv-sub" style={{color: isVerified?"var(--teal)":"var(--coral)",fontWeight:500}}>
              {isVerified ? "● Verified" : "● Disconnected"}
            </div>
          </div>
          <div className="payout-kv">
            <div className="payout-kv-lbl">Net Payout Potential</div>
            <div className="payout-kv-val">{fmt(pendingAmt)}</div>
            <div className="payout-kv-sub">From eligible pending bookings</div>
          </div>
        </div>

        <div style={{padding:"12px 24px 10px",borderBottom:"1px solid var(--border)"}}>
          <span style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.28em",color:"var(--ink4)",textTransform:"uppercase"}}>Transaction record</span>
        </div>
        <table className="vd-tbl">
          <thead><tr><th>Ref</th><th>Date</th><th>Amount</th><th>Status</th><th style={{textAlign:"right"}}>Net Settlement</th></tr></thead>
          <tbody>
            {payouts.length === 0
              ? <tr><td colSpan="5" className="empty">No transactions recorded</td></tr>
              : payouts.map(p => (
                <tr key={p.id}>
                  <td style={{color:"var(--ink4)"}}>#{p.id}</td>
                  <td>{new Date(p.initiated_at).toLocaleDateString()}</td>
                  <td style={{fontWeight:500}}>{fmt(p.amount)}</td>
                  <td>
                    {p.status==="completed" && <span style={{color:"var(--teal)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.15em"}}>COMPLETE</span>}
                    {p.status==="failed"    && <span style={{color:"var(--coral)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.15em"}}>FAILED</span>}
                    {p.status==="pending"   && <span style={{color:"var(--amber)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.15em"}}>PENDING</span>}
                  </td>
                  <td style={{textAlign:"right",fontFamily:"var(--serif)",fontSize:18,fontStyle:"italic",color:"var(--ink)"}}>{fmt(p.net_amount)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VerificationView({ vendor, onRefresh }) {
  const [sub, setSub] = useState(false);
  const [form, setForm] = useState({ document_type:"id_card", document_url:"" });
  const status = vendor?.kyc_status || "not_started";

  const go = async (e) => {
    e.preventDefault();
    if (!form.document_url) return toast.error("Document URL required.");
    setSub(true);
    try { await controlAPI.kycSubmit(form); toast.success("Submitted."); onRefresh(); }
    catch (e) { toast.error(e.message || "Failed."); }
    finally { setSub(false); }
  };

  return (
    <div className="fade-up">
      <div className="sec-header">
        <div>
          <div className="sec-eyebrow">Compliance</div>
          <div className="sec-title">Verification</div>
          <div className="sec-sub">KYC · Identity &amp; trust status</div>
        </div>
      </div>
      <div style={{background:"var(--surface)"}}>
        <div className="kyc-row">
          <div className={`kyc-icon-wrap ${status==="verified"?"kyc-icon-v":status==="pending"?"kyc-icon-p":"kyc-icon-n"}`}>
            <FiShield size={24}/>
          </div>
          <div>
            <div className="kyc-state">{status.replace("_"," ")}</div>
            <div className="kyc-desc">
              {status==="verified"    && "Identity confirmed — full marketplace access granted"}
              {status==="pending"     && "Under review — listings paused until verification clears"}
              {status==="not_started" && "Submit documents to unlock marketplace publishing"}
            </div>
          </div>
        </div>
        {status==="not_started" && (
          <form onSubmit={go} style={{padding:"28px 40px",display:"flex",flexDirection:"column",gap:20,maxWidth:520}}>
            <div>
              <label className="field-label">Document Type</label>
              <select className="field-select" value={form.document_type} onChange={e=>setForm({...form,document_type:e.target.value})}>
                <option value="id_card">National ID / Aadhar</option>
                <option value="passport">Passport</option>
                <option value="business_license">Business License</option>
              </select>
            </div>
            <div>
              <label className="field-label">Document URL (mock)</label>
              <input className="field-input" type="text" placeholder="https://…" value={form.document_url} onChange={e=>setForm({...form,document_url:e.target.value})}/>
            </div>
            <button type="submit" className="btn btn-coral" disabled={sub} style={{alignSelf:"flex-start"}}>{sub?"Submitting…":"Submit for Review"}</button>
          </form>
        )}
        {status==="pending"  && <div style={{padding:"32px 40px",display:"flex",alignItems:"center",gap:12}}><FiClock size={18} style={{color:"var(--amber)"}}/><span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--ink3)",letterSpacing:"0.05em"}}>Moderation team review in progress. Listings remain hidden until approved.</span></div>}
        {status==="verified" && <div style={{padding:"32px 40px",display:"flex",alignItems:"center",gap:12}}><FiCheckCircle size={18} style={{color:"var(--teal)"}}/><span style={{fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.05em"}}>Fully verified. All marketplace features unlocked.</span></div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TABS CONFIG
───────────────────────────────────────────────────────────── */
const TABS = [
  { id:"overview",      label:"Overview",      icon:<FiTrendingUp size={13}/> },
  { id:"orders",        label:"Orders",        icon:<FiPackage size={13}/> },
  { id:"products",      label:"Listings",      icon:<FiBox size={13}/> },
  { id:"payouts",       label:"Payouts",       icon:<FiSend size={13}/> },
  { id:"reviews",       label:"Reviews",       icon:<FiStar size={13}/> },
  { id:"verification",  label:"Verification",  icon:<FiShield size={13}/> },
  { id:"chat",          label:"Messages",      icon:<FiMessageSquare size={13}/> },
  { id:"settings",      label:"Settings",      icon:<FiSettings size={13}/> },
];

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────── */
export default function VendorDashboard() {
  const { userId }  = useAuth();
  const location    = useLocation();
  const navigate    = useNavigate();

  const [tab,setTab] = useState("overview");
  const [loading,setLoading] = useState(true);
  const [vendor,setVendor] = useState(null);
  const [bookings,setBookings] = useState([]);
  const [products,setProducts] = useState([]);
  const [analytics,setAnalytics] = useState(null);
  const [vendorReviews,setVendorReviews] = useState([]);
  const [replyDrafts,setReplyDrafts] = useState({});
  const [reviewComments,setReviewComments] = useState({});
  const [threads,setThreads] = useState([]);
  const [selectedThread,setSelectedThread] = useState(null);
  const [messages,setMessages] = useState([]);
  const [newMessage,setNewMessage] = useState("");
  const [settingsForm,setSettingsForm] = useState({company_name:"",email:"",phone:""});
  const [savingSettings,setSavingSettings] = useState(false);
  const [liveConnected,setLiveConnected] = useState(false);
  const [liveEvents,setLiveEvents] = useState([]);
  const [liveStatusText,setLiveStatusText] = useState("Connecting…");
  const [activatingPlan,setActivatingPlan] = useState(false);
  const [confirmingPlan,setConfirmingPlan] = useState(false);
  const [recentlyActivated,setRecentlyActivated] = useState(false);
  const [createdListingId,setCreatedListingId] = useState(null);
  const [listingFormVersion,setListingFormVersion] = useState(0);
  const [payouts,setPayouts] = useState([]);
  const [bankAccount,setBankAccount] = useState(null);
  const [subscription,setSubscription] = useState(null);

  const stats = useMemo(() => ({
    revenue:         Number(analytics?.total_revenue || 0),
    totalBookings:   Number(analytics?.total_bookings || 0),
    avgBookingValue: Number(analytics?.avg_booking_value || 0),
    activeProducts:  products.filter(p => p.is_active).length,
  }), [analytics, products]);

  const subLocked  = Boolean(vendor) && !vendor.subscription_active;
  const isGrowth   = Boolean(vendor?.subscription_active);
  const pendingOrders = bookings.filter(b => b.status === "pending").length;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [v,vb,mp,a,ts,rev,pp,ba,sub] = await Promise.all([
        vendorAPI.profile().catch(() => null),
        bookingsAPI.vendorBookings(),
        equipmentAPI.mine(),
        analyticsAPI.vendor().catch(() => null),
        chatAPI.threads().catch(() => []),
        equipmentAPI.vendorReviews().catch(() => []),
        paymentsAPI.payouts().catch(() => []),
        paymentsAPI.bankAccount().catch(() => null),
        subscriptionAPI.me().catch(() => null),
      ]);
      setVendor(v); setSubscription(sub);
      if (v) setSettingsForm({ company_name:v.company_name||"", email:v.email||"", phone:v.phone||"" });
      setPayouts(Array.isArray(pp) ? pp : pp?.results || []);
      setBankAccount(ba);
      setBookings(Array.isArray(vb) ? vb : vb?.results || []);
      setProducts(Array.isArray(mp) ? mp : mp?.results || []);
      setAnalytics(a);
      const rl = Array.isArray(rev) ? rev : rev?.results || [];
      setVendorReviews(rl);
      const cm = {};
      await Promise.all(rl.map(async r => {
        try { const c = await equipmentAPI.reviewComments(r.id); cm[r.id] = Array.isArray(c) ? c : c?.results || []; }
        catch { cm[r.id] = []; }
      }));
      setReviewComments(cm);
      const tl = Array.isArray(ts) ? ts : ts?.results || [];
      setThreads(tl);
      if (tl.length && !selectedThread) setSelectedThread(tl[0]);
    } catch (e) { toast.error(e.message || "Load failed."); }
    finally { setLoading(false); }
  }, [selectedThread]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    if (!selectedThread?.id) return;
    chatAPI.messages(selectedThread.id).then(d => setMessages(Array.isArray(d) ? d : d?.results || [])).catch(() => setMessages([]));
  }, [selectedThread]);

  useEffect(() => {
    if (!selectedThread?.id) return;
    const t = setInterval(() => chatAPI.messages(selectedThread.id).then(d => setMessages(Array.isArray(d) ? d : d?.results || [])).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [selectedThread?.id]);

  useEffect(() => {
    let socket = null, cancelled = false, timer = null, retry = 0;
    async function conn() {
      if (!userId || cancelled) return;
      setLiveStatusText(retry === 0 ? "Connecting…" : `Reconnecting… (${retry})`);
      socket = await openBookingSocket({
        role: "vendor", userId,
        onOpen: () => { if (cancelled) return; retry = 0; setLiveConnected(true); setLiveStatusText("Live feed active."); },
        onClose: (ev) => {
          if (cancelled) return; setLiveConnected(false); setLiveStatusText(describeClose(ev?.code)); retry++;
          timer = setTimeout(conn, Math.min(1000 * (2 ** Math.max(retry - 1, 0)), 10000));
        },
        onError: () => { if (!cancelled) { setLiveConnected(false); setLiveStatusText("Error — retrying…"); } },
        onMessage: (payload) => {
          if (!payload || payload.type !== "booking.event" || !payload.booking) return;
          setBookings(cur => {
            const l = Array.isArray(cur) ? [...cur] : [];
            const i = l.findIndex(x => x.id === payload.booking.id);
            if (i >= 0) l[i] = payload.booking; else l.unshift(payload.booking);
            return l;
          });
          setLiveEvents(cur => [{
            id: `${payload.booking.id}-${Date.now()}`,
            bookingId: payload.booking.id, status: payload.booking.status,
            equipmentName: payload.booking?.equipment_detail?.name || "Equipment",
            timestamp: payload.timestamp || new Date().toISOString(),
          }, ...cur].slice(0, 8));
          toast.success(`Booking #${payload.booking.id} → ${payload.booking.status}`);
        },
      });
    }
    conn();
    return () => { cancelled = true; if (timer) clearTimeout(timer); if (socket?.readyState < 2) socket.close(); };
  }, [userId]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const canceled = p.get("canceled");
    const sid = p.get("session_id") || localStorage.getItem("vendor_checkout_session_id");
    if (canceled === "true") { localStorage.removeItem("vendor_checkout_session_id"); toast.error("Checkout canceled."); navigate("/vendor", { replace:true }); return; }
    if (!sid || !userId || (vendor && vendor.subscription_active)) { if (vendor?.subscription_active) localStorage.removeItem("vendor_checkout_session_id"); return; }
    let cancelled = false, attempt = 0;
    async function confirm() {
      setConfirmingPlan(true);
      try {
        const c = await paymentsAPI.confirmSubscriptionSession(sid);
        if (c?.subscription_active && !cancelled) { setVendor(c.vendor || { ...vendor, subscription_active:true }); localStorage.removeItem("vendor_checkout_session_id"); setRecentlyActivated(true); setTab("products"); toast.success("Growth plan activated."); loadDashboard(); navigate("/vendor", { replace:true }); setConfirmingPlan(false); return; }
      } catch {}
      while (!cancelled && attempt < 12) {
        attempt++;
        try { const pr = await vendorAPI.profile(); if (pr?.subscription_active) { setVendor(pr); localStorage.removeItem("vendor_checkout_session_id"); setRecentlyActivated(true); setTab("products"); toast.success("Activated."); navigate("/vendor", { replace:true }); setConfirmingPlan(false); return; } } catch {}
        await new Promise(r => setTimeout(r, 2000));
      }
      if (!cancelled) { toast("Payment recorded — awaiting Stripe…", { icon:"⏳" }); setConfirmingPlan(false); }
    }
    confirm(); return () => { cancelled = true; };
  }, [location.search, navigate, userId, vendor, loadDashboard]);

  useEffect(() => {
    if (tab !== "products" || !createdListingId || !products.length) return;
    if (!products.find(i => String(i.id) === String(createdListingId))) return;
    const t = setTimeout(() => document.getElementById(`vl-${createdListingId}`)?.scrollIntoView({ behavior:"smooth", block:"center" }), 120);
    return () => clearTimeout(t);
  }, [tab, createdListingId, products]);

  const toggleLive = async p => {
    if (subLocked && !p.is_active) { toast.error("Activate subscription first."); return; }
    try { await equipmentAPI.update(p.id, { is_active:!p.is_active }); toast.success(`Listing ${!p.is_active?"published":"unlisted"}.`); loadDashboard(); }
    catch (e) { toast.error(e.message || "Failed."); }
  };
  const updateInventory = async (id, qty) => { try { await equipmentAPI.update(id, { quantity:Number(qty) }); toast.success("Updated."); loadDashboard(); } catch (e) { toast.error(e.message || "Failed."); } };
  const updateBooking = async (id, action) => { try { await bookingsAPI.vendorAction(id, action); toast.success(`Booking ${action}ed.`); loadDashboard(); } catch (e) { toast.error(e.message || "Failed."); } };
  const sendMessage = async () => {
    if (!selectedThread?.id || !newMessage.trim()) return;
    try { await chatAPI.sendMessage(selectedThread.id, { message:newMessage.trim() }); setNewMessage(""); const d = await chatAPI.messages(selectedThread.id); setMessages(Array.isArray(d) ? d : d?.results || []); }
    catch (e) { toast.error(e.message || "Failed."); }
  };
  const saveReply = async reviewId => {
    const text = (replyDrafts[reviewId] || "").trim(); if (!text) return;
    try { await equipmentAPI.addReviewComment(reviewId, { comment:text }); toast.success("Reply posted."); setReplyDrafts(d => ({ ...d, [reviewId]:"" })); const c = await equipmentAPI.reviewComments(reviewId); setReviewComments(prev => ({ ...prev, [reviewId]:Array.isArray(c)?c:c?.results||[] })); }
    catch (e) { toast.error(e.message || "Failed."); }
  };
  const seedProducts = async () => { if (subLocked) { toast.error("Activate subscription first."); return; } try { const r = await equipmentAPI.seedVendorProducts(); toast.success(r.message || "Seeded."); loadDashboard(); } catch (e) { toast.error(e.message || "Failed."); } };
  const activateSub = async () => {
    setActivatingPlan(true);
    try { const r = await paymentsAPI.createCheckout(); if (r?.url) { if (r.session_id) localStorage.setItem("vendor_checkout_session_id", r.session_id); window.location.href = r.url; return; } toast.error("Checkout failed."); }
    catch (e) { toast.error(e.message || "Failed."); }
    finally { setActivatingPlan(false); }
  };

  if (loading) return (
    <>
      <style>{G}</style>
      <div className="vd"><div className="loading-wrap"><div className="loading-ring"/></div></div>
    </>
  );

  const dateStr = new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" });

  return (
    <>
      <style>{G}</style>
      <div className="vd">

        {/* ── TOP BAR ── */}
        <header className="topbar">
          <div className="topbar-logo">
            Tap<span className="topbar-logo-accent">Rent</span>
          </div>
          <div className="topbar-center"/>
          <div className="topbar-right">
            <span className="live-chip">
              <span className={`live-dot ${liveConnected ? "live-dot-on" : "live-dot-off"}`}/>
              {liveConnected ? "Live" : "Reconnecting"}
            </span>
            <span className={`plan-chip ${isGrowth ? "plan-chip-growth" : "plan-chip-std"}`}>
              {isGrowth ? "Growth" : "Standard"}
            </span>
            <span className="vendor-name">{vendor?.company_name || vendor?.email?.split("@")[0] || "Vendor"}</span>
          </div>
        </header>

        {/* ── BANNERS ── */}
        {subLocked && (
          <div className="alert-banner">
            <div className="alert-text">
              <FiLock size={12}/>
              {confirmingPlan ? "Synchronising plan activation…" : "Publishing locked · Subscription required"}
            </div>
            <button className="btn btn-coral" style={{fontSize:9,padding:"7px 14px"}} onClick={activateSub} disabled={activatingPlan || confirmingPlan}>
              <FiZap size={10}/>{activatingPlan ? "Redirecting…" : confirmingPlan ? "Syncing…" : "Unlock Growth Plan"}
            </button>
          </div>
        )}
        {isGrowth && (
          <div className="plan-banner">
            <div className="plan-banner-txt">
              <FiRadio size={10}/>
              Growth plan active{recentlyActivated ? " · just activated" : ""}
            </div>
            <div className="plan-chips">
              {["Unlimited listings","Premium visibility","Direct chat"].map(t => (
                <span key={t} className="plan-chip-sm">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── BODY ── */}
        <div className="layout">

          {/* ── SIDEBAR ── */}
          <nav className="sidebar">
            <div className="sidebar-section-label">Navigation</div>
            {TABS.map(t => (
              <button key={t.id} className={`nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <div className="nav-item-inner">
                  {t.icon}
                  {t.label}
                </div>
                {t.id === "orders" && pendingOrders > 0 && <span className="nav-badge">{pendingOrders}</span>}
                {tab === t.id && <FiChevronRight size={11} style={{color:"var(--coral)",opacity:0.6}}/>}
              </button>
            ))}
            <div className="sidebar-footer">
              <div className="sidebar-status">{liveStatusText}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink5)",marginTop:6,letterSpacing:"0.08em"}}>{dateStr}</div>
            </div>
          </nav>

          {/* ── MAIN ── */}
          <main className="main">

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div className="fade-up">
                {/* stat band */}
                <div className="stat-band">
                  <div className="stat-cell">
                    <div className="sc-label">Revenue</div>
                    <div className="sc-value">{fmt(stats.revenue)}</div>
                    <div className="sc-sub">Total lifetime</div>
                  </div>
                  <div className="stat-cell">
                    <div className="sc-label">Orders</div>
                    <div className="sc-value">{stats.totalBookings}</div>
                    <div className="sc-sub">All time</div>
                  </div>
                  <div className="stat-cell">
                    <div className="sc-label">Avg. Order</div>
                    <div className="sc-value">{fmt(stats.avgBookingValue)}</div>
                    <div className="sc-sub">Per booking</div>
                  </div>
                  <div className="stat-cell">
                    <div className="sc-label">Active Fleet</div>
                    <div className="sc-value">{stats.activeProducts}</div>
                    <div className="sc-sub">Published units</div>
                  </div>
                  <div className="stat-cell featured">
                    <div className="sc-label sc-label-inv">Plan Tier</div>
                    <div className="sc-value sc-value-inv" style={{fontSize:22}}>{subscription?.tier?.name || (isGrowth ? "Growth" : "Standard")}</div>
                    <div className="sc-sub sc-sub-inv">{isGrowth ? "All features" : "Limited"}</div>
                  </div>
                </div>

                {/* usage meter */}
                {subscription && (
                  <div style={{background:"var(--surface)",borderBottom:"1px solid var(--border)"}}>
                    <div className="usage-wrap">
                      <div style={{flex:1}}>
                        <div className="usage-labels">
                          <span>Fleet capacity</span>
                          <span>{subscription.listings_used} / {subscription.tier?.max_listings === 0 ? "∞" : subscription.tier?.max_listings} listings · {subscription.usage_pct}%</span>
                        </div>
                        <div className="usage-track">
                          <div className={`usage-fill ${subscription.usage_pct > 90 ? "hot" : ""}`} style={{width:`${subscription.usage_pct}%`}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="content">
                  {/* live feed + analytics */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:"var(--border)"}}>
                    {/* Live event log */}
                    <div className="card" style={{border:"none"}}>
                      <div className="card-header">
                        <div>
                          <div className="card-title">Live Event Feed</div>
                          <div className="card-meta" style={{marginTop:3}}>{liveConnected ? "Receiving updates" : "Reconnecting"}</div>
                        </div>
                        <span style={{width:7,height:7,borderRadius:"50%",background:liveConnected?"var(--teal)":"var(--amber)",display:"inline-block",flexShrink:0}}/>
                      </div>
                      {(liveEvents.length ? liveEvents : [{ id:"idle",equipmentName:"Awaiting events",status:"monitoring",timestamp:new Date().toISOString() }]).map(ev => (
                        <div key={ev.id} className="log-row">
                          <span className="log-ts">{new Date(ev.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
                          <span className="log-ev">{ev.equipmentName}{ev.bookingId ? <span style={{color:"var(--ink5)"}}> · #{ev.bookingId}</span> : null}</span>
                          <span className={ev.status==="cancelled"?"log-err":ev.status==="pending"?"log-warn":"log-ok"}>{ev.status}</span>
                        </div>
                      ))}
                    </div>

                    {/* Analytics */}
                    <div style={{display:"flex",flexDirection:"column",gap:1,background:"var(--border)"}}>
                      {[
                        {title:"Top Equipment",   data:analytics?.top_equipment,    key:"equipment__name", val:"revenue", date:false},
                        {title:"Revenue by Month",data:analytics?.monthly_revenue,  key:"start_date__month",val:"revenue",date:true},
                      ].map((blk, i) => (
                        <div key={i} className="card" style={{border:"none"}}>
                          <div className="card-header">
                            <div className="card-title">{blk.title}</div>
                          </div>
                          {(blk.data||[]).map((item,idx) => (
                            <div key={idx} className="ana-row">
                              <span className="ana-key">{blk.date ? `${item.start_date__month}/${item.start_date__year}` : item[blk.key]}</span>
                              <span className="ana-val">{fmt(item[blk.val])}</span>
                            </div>
                          ))}
                          {(!blk.data || blk.data.length === 0) && <div className="empty">No data</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div className="fade-up">
                <div className="sec-header">
                  <div>
                    <div className="sec-eyebrow">Operations</div>
                    <div className="sec-title">Order Ledger</div>
                    <div className="sec-sub">{bookings.length} transaction records</div>
                  </div>
                </div>
                <div style={{background:"var(--surface)"}}>
                  {bookings.length === 0
                    ? <div className="empty"><FiPackage size={32} style={{opacity:0.15}}/> No orders on record</div>
                    : bookings.map(book => (
                      <div key={book.id} className="booking-row">
                        <div className="br-thumb">
                          {book.equipment_detail?.image_url
                            ? <img src={book.equipment_detail.image_url} alt=""/>
                            : <div className="br-thumb-empty"><FiBox size={18}/></div>}
                        </div>
                        <div className="br-info">
                          <div className="br-id">Ref · {String(book.id).slice(0,8)}</div>
                          <div className="br-name">{book.equipment_detail?.name}</div>
                          <div className="br-meta">{book.start_date} — {book.end_date}</div>
                        </div>
                        <div className="br-price">
                          <div className="br-amount">{fmt(book.total_price)}</div>
                          <StatusTag status={book.status}/>
                        </div>
                        <div className="br-actions">
                          {book.status==="pending" && <>
                            <button className="btn btn-teal" style={{fontSize:9,padding:"7px 12px"}} onClick={()=>updateBooking(book.id,"confirm")}><FiCheckCircle size={11}/>Authorize</button>
                            <button className="btn btn-danger" style={{fontSize:9,padding:"7px 12px"}} onClick={()=>updateBooking(book.id,"cancel")}><FiXCircle size={11}/>Dismiss</button>
                          </>}
                          {["confirmed","active"].includes(book.status) && <button className="btn btn-ghost" style={{fontSize:9,padding:"7px 12px"}} onClick={()=>updateBooking(book.id,"ship")}><FiTruck size={11}/>Dispatch</button>}
                          {book.status==="shipped"   && <button className="btn btn-teal" style={{fontSize:9,padding:"7px 12px"}} onClick={()=>updateBooking(book.id,"deliver")}><FiCheckCircle size={11}/>Delivered</button>}
                          {book.status==="delivered" && <button className="btn btn-ghost" style={{fontSize:9,padding:"7px 12px"}} onClick={()=>updateBooking(book.id,"complete")}>Archive</button>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {tab === "products" && (
              <div className="fade-up">
                <div className="sec-header">
                  <div>
                    <div className="sec-eyebrow">Inventory</div>
                    <div className="sec-title">Fleet Catalogue</div>
                    <div className="sec-sub">{products.length} units registered</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-ghost" style={{fontSize:9}} onClick={seedProducts} disabled={subLocked}>Seed Samples</button>
                    <button className="btn btn-coral" style={{fontSize:9}} disabled={subLocked}
                      onClick={()=>{ setCreatedListingId(null); setListingFormVersion(v=>v+1); setTab("add"); }}>
                      <FiPlus size={11}/>New Listing
                    </button>
                  </div>
                </div>
                {products.length === 0
                  ? <div className="empty" style={{background:"var(--surface)"}}><FiBox size={32} style={{opacity:0.15}}/>No listings yet</div>
                  : <div className="product-grid">
                    {products.map(p => (
                      <div id={`vl-${p.id}`} key={p.id} className={`product-card ${String(createdListingId)===String(p.id)?"highlighted":""}`}>
                        <div className="pc-img">
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name}/>
                            : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ink5)"}}><FiBox size={28}/></div>}
                          <div className={`pc-badge ${p.is_active?"pc-badge-live":"pc-badge-off"}`}>{p.is_active?"● Live":"○ Off"}</div>
                        </div>
                        <div className="pc-body">
                          <div className="pc-cat">{p.category}</div>
                          <div className="pc-name">{p.name}</div>
                          <div className="pc-price">{fmt(p.price_per_day)}<small> / day</small></div>
                        </div>
                        <div className="pc-footer">
                          <input type="number" min="0" defaultValue={p.quantity} className="qty-input" onBlur={e=>updateInventory(p.id,e.target.value)}/>
                          <button
                            className={p.is_active ? "btn btn-ghost" : "btn btn-coral"}
                            style={{flex:1,fontSize:9,padding:"8px 10px",justifyContent:"center"}}
                            onClick={()=>toggleLive(p)} disabled={subLocked && !p.is_active}>
                            {p.is_active ? "Retire" : "Publish"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}

            {/* ── ADD ── */}
            {tab === "add" && (
              <div className="fade-up">
                <div className="sec-header">
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <button className="btn btn-ghost" style={{fontSize:9,padding:"7px 12px"}} onClick={()=>setTab("products")}>← Back</button>
                    <div>
                      <div className="sec-eyebrow">Inventory</div>
                      <div className="sec-title">New Listing</div>
                    </div>
                  </div>
                </div>
                <div style={{padding:32,background:"var(--surface)"}}>
                  {subLocked
                    ? <div className="empty"><FiShield size={28} style={{opacity:0.15}}/>Active subscription required to publish<br/><button className="btn btn-coral" style={{marginTop:16,fontSize:9}} onClick={activateSub}><FiZap size={10}/>Activate Growth Plan</button></div>
                    : <VendorEquipmentForm key={listingFormVersion} onSaved={async r => { setCreatedListingId(r?.id||null); await loadDashboard(); setTab("products"); }}/>
                  }
                </div>
              </div>
            )}

            {/* ── PAYOUTS ── */}
            {tab === "payouts" && <PayoutsView payouts={payouts} bankAccount={bankAccount} onRefresh={loadDashboard}/>}

            {/* ── REVIEWS ── */}
            {tab === "reviews" && (
              <div className="fade-up">
                <div className="sec-header">
                  <div>
                    <div className="sec-eyebrow">Reputation</div>
                    <div className="sec-title">Customer Reviews</div>
                    <div className="sec-sub">{vendorReviews.length} entries</div>
                  </div>
                </div>
                <div>
                  {vendorReviews.length === 0
                    ? <div className="empty" style={{background:"var(--surface)"}}><FiStar size={28} style={{opacity:0.15}}/>No reviews yet</div>
                    : vendorReviews.map(r => (
                      <div key={r.id} className="review-card">
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
                          <div>
                            <div style={{fontFamily:"var(--serif)",fontSize:18,fontWeight:400,fontStyle:"italic",color:"var(--ink)"}}>{r.title || "Review"}</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.2em",color:"var(--ink4)",marginTop:3,textTransform:"uppercase"}}>{r.equipment_detail?.name} · {r.reviewer_name||"Anonymous"}</div>
                          </div>
                          <div style={{display:"flex",gap:2,paddingTop:2}}>
                            {[1,2,3,4,5].map(n => <FiStar key={n} size={12} style={{fill:n<=r.rating?"var(--coral)":"none",color:n<=r.rating?"var(--coral)":"var(--ink5)"}}/>)}
                          </div>
                        </div>
                        <div className="review-quote">"{r.comment}"</div>
                        <div className="review-thread">
                          {(reviewComments[r.id]||[]).map(c => {
                            const isV = String(c.user_id) === String(vendor?.user_id);
                            return (
                              <div key={c.id} style={{display:"flex",gap:10}}>
                                <div className={`reply-who ${isV?"reply-who-v":"reply-who-u"}`}>[{isV?"Vendor":"User"}]</div>
                                <div className="reply-body">{c.comment}</div>
                              </div>
                            );
                          })}
                          <div style={{display:"flex",gap:0}}>
                            <input type="text" className="chat-input" placeholder="Write a reply…"
                              value={replyDrafts[r.id]||""} onChange={e=>setReplyDrafts({...replyDrafts,[r.id]:e.target.value})}
                              style={{fontSize:11}}/>
                            <button className="chat-send" onClick={()=>saveReply(r.id)} disabled={!(replyDrafts[r.id]||"").trim()}><FiSend size={12}/></button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* ── VERIFICATION ── */}
            {tab === "verification" && <VerificationView vendor={vendor} onRefresh={loadDashboard}/>}

            {/* ── CHAT ── */}
            {tab === "chat" && (
              <div className="fade-up">
                <div className="chat-layout">
                  <div className="chat-threads">
                    <div style={{padding:"12px 20px 10px",borderBottom:"1px solid var(--border)"}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.28em",color:"var(--ink4)",textTransform:"uppercase"}}>Conversations</span>
                    </div>
                    {threads.map(t => (
                      <div key={t.id} className={`chat-thread-item ${selectedThread?.id===t.id?"active":""}`} onClick={()=>setSelectedThread(t)}>
                        <div className="ct-name">{t.equipment_name || `Thread #${t.id}`}</div>
                        <div className="ct-meta">Client · {t.buyer_id?.slice(0,6)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="chat-main">
                    {selectedThread ? <>
                      <div className="chat-top">
                        <div className="chat-top-name">{selectedThread.equipment_name || `Thread #${selectedThread.id}`}</div>
                        <span className="tag tag-confirmed">● Live</span>
                      </div>
                      <div className="chat-msgs">
                        {messages.map(m => {
                          const isMe = String(m.sender_id) === String(selectedThread.vendor_id);
                          return (
                            <div key={m.id} className={`msg ${isMe?"msg-me":"msg-them"}`}>
                              <div className="msg-bubble">{m.message}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="chat-input-row">
                        <input className="chat-input" type="text" placeholder="Type message…"
                          value={newMessage} onChange={e=>setNewMessage(e.target.value)}
                          onKeyDown={e=>e.key==="Enter"&&sendMessage()}/>
                        <button className="chat-send" onClick={sendMessage}><FiSend size={13}/></button>
                      </div>
                    </> : <div className="empty">Select a conversation</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === "settings" && (
              <div className="fade-up">
                <div className="sec-header">
                  <div>
                    <div className="sec-eyebrow">Account</div>
                    <div className="sec-title">Settings</div>
                    <div className="sec-sub">Profile &amp; subscription configuration</div>
                  </div>
                </div>
                <div style={{background:"var(--surface)"}}>
                  <form
                    onSubmit={async e => { e.preventDefault(); setSavingSettings(true); try { await vendorAPI.updateProfile(settingsForm); toast.success("Saved."); loadDashboard(); } catch (e) { toast.error(e.message); } finally { setSavingSettings(false); } }}
                    className="settings-wrap"
                  >
                    {[
                      { label:"Company Name", key:"company_name", type:"text" },
                      { label:"Contact Email", key:"email", type:"email" },
                      { label:"Contact Phone", key:"phone", type:"tel" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="field-label">{f.label}</label>
                        <input type={f.type} className="field-input" value={settingsForm[f.key]} onChange={e=>setSettingsForm({...settingsForm,[f.key]:e.target.value})}/>
                      </div>
                    ))}

                    <div style={{borderTop:"1px solid var(--border)",paddingTop:20,display:"flex",flexDirection:"column",gap:10}}>
                      <label className="field-label">Plan</label>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontFamily:"var(--serif)",fontSize:22,fontStyle:"italic",color:"var(--ink)"}}>{isGrowth ? "Growth Plan" : "Standard Plan"}</span>
                        {!isGrowth && <button type="button" className="btn btn-coral" style={{fontSize:9}} onClick={activateSub} disabled={activatingPlan}><FiZap size={10}/>Upgrade</button>}
                        {isGrowth  && <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--teal)",letterSpacing:"0.15em"}}>● Active</span>}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-coral" disabled={savingSettings} style={{alignSelf:"flex-start",marginTop:4}}>
                      {savingSettings ? "Saving…" : "Save Changes"}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}