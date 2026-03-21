import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  bookingsAPI, chatAPI, disputeAPI, equipmentAPI,
  recommendationsAPI, supportAPI, usersAPI, setTokenGetter
} from "../api/axiosConfig";
import { useAppPreferences } from "../context/AppPreferencesContext";
import TapRentAssistant from "../components/common/TapRentAssistant";
import {
  FiPackage, FiHeart, FiStar, FiShoppingCart, FiMapPin,
  FiMessageSquare, FiUser, FiChevronRight, FiClock,
  FiCheckCircle, FiAlertCircle, FiXCircle, FiSend,
  FiTruck, FiActivity, FiHelpCircle
} from "react-icons/fi";

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function fmt(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES
   Palette: Apple.com (#f5f5f7 bg, #1d1d1f ink, #0066cc blue)
   Type:    Fraunces (display/serif) + DM Mono (utility)
   Large text: clamp-based display headings throughout
───────────────────────────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,700&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

:root {
  --bg:          #f5f5f7;
  --surface:     #ffffff;
  --surface2:    #f5f5f7;
  --surface3:    #ebebed;
  --border:      #d2d2d7;
  --border2:     #c7c7cc;
  --ink:         #1d1d1f;
  --ink2:        #424245;
  --ink3:        #6e6e73;
  --ink4:        #a1a1a6;
  --ink5:        #d2d2d7;
  --blue:        #0066cc;
  --blue2:       #0077ed;
  --blue-bg:     #e8f0fb;
  --blue-border: #bcd4f5;
  --green:       #1d8348;
  --green-bg:    #eaf5ee;
  --green-border:#a8d8b9;
  --amber:       #9e6c00;
  --amber-bg:    #fdf5e6;
  --amber-border:#f0d080;
  --red:         #d70015;
  --red-bg:      #fde8ea;
  --red-border:  #f5b8be;
  --purple:      #6e3ab0;
  --purple-bg:   #f3eeff;
  --purple-border:#d9c2f8;
  --serif:       'Fraunces', Georgia, serif;
  --mono:        'DM Mono', 'Courier New', monospace;
  --ease:        cubic-bezier(.4,0,.2,1);
}

.bd { all: unset; display: block; }
.bd *, .bd *::before, .bd *::after { box-sizing: border-box; }
.bd {
  font-family: var(--mono);
  background: var(--bg);
  color: var(--ink);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ── TOP NAV (frosted apple-style) ── */
.bd-nav {
  height: 52px;
  background: rgba(255,255,255,0.88);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
  position: sticky; top: 0; z-index: 200;
}
.bd-nav-logo {
  font-family: var(--serif); font-size: 17px; font-weight: 500;
  font-style: italic; color: var(--ink); letter-spacing: -0.025em;
  display: flex; align-items: center; gap: 8px;
}
.bd-nav-logo-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--blue);
  box-shadow: 0 0 0 2px rgba(0,102,204,0.2);
  animation: bdpulse 3s ease-in-out infinite;
}
@keyframes bdpulse {
  0%,100%{ box-shadow: 0 0 0 2px rgba(0,102,204,0.2); }
  50%    { box-shadow: 0 0 0 5px rgba(0,102,204,0.05); }
}
.bd-nav-right { display: flex; align-items: center; gap: 14px; }
.bd-nav-stat {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--ink4); display: flex; align-items: center; gap: 6px;
}
.bd-nav-stat strong { font-family: var(--serif); font-size: 15px; font-style: italic; font-weight: 400; color: var(--ink); letter-spacing: -0.01em; }
.bd-nav-sep { width: 1px; height: 18px; background: var(--border); }

/* ── LAYOUT ── */
.bd-layout { display: grid; grid-template-columns: 208px 1fr; min-height: calc(100vh - 52px); }

/* ── SIDEBAR ── */
.bd-sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 28px 0;
  display: flex; flex-direction: column;
  position: sticky; top: 52px;
  height: calc(100vh - 52px); overflow-y: auto;
}
.bd-sidebar-lbl {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--ink5); padding: 0 20px 9px; margin-top: 6px;
}
.bd-nav-item {
  all: unset; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 20px;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em;
  color: var(--ink3);
  border-left: 2px solid transparent;
  transition: color 0.14s, background 0.14s, border-color 0.14s;
}
.bd-nav-item:hover { color: var(--ink); background: var(--bg); }
.bd-nav-item.on { color: var(--ink); background: var(--bg); border-left-color: var(--blue); }
.bd-nav-item-inner { display: flex; align-items: center; gap: 9px; }
.bd-badge {
  font-size: 8px; font-weight: 500; padding: 1px 6px;
  border-radius: 20px; letter-spacing: 0.04em;
}
.bd-badge-blue { background: var(--blue); color: #fff; }
.bd-badge-red  { background: var(--red); color: #fff; }
.bd-sidebar-footer {
  margin-top: auto; padding: 16px 20px 0;
  border-top: 1px solid var(--border);
  font-family: var(--mono); font-size: 9px; color: var(--ink4); line-height: 1.8; letter-spacing: 0.04em;
}

/* ── MAIN ── */
.bd-main { background: var(--bg); }

/* ── HERO — Apple-scale large display text ── */
.bd-hero {
  background: var(--ink);
  padding: 44px 48px;
  position: relative; overflow: hidden;
  border-bottom: none;
}
/* Apple.com diagonal light accent */
.bd-hero::before {
  content: '';
  position: absolute; top: -120px; right: -120px;
  width: 480px; height: 480px;
  background: radial-gradient(circle, rgba(0,102,204,0.22) 0%, transparent 65%);
  pointer-events: none;
}
.bd-hero::after {
  content: '';
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}
.bd-hero-inner {
  position: relative; z-index: 1;
  display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; flex-wrap: wrap;
}
.bd-hero-eyebrow {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--blue); display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
}
/* THE LARGE TITLE — Apple product-page scale */
.bd-hero-title {
  font-family: var(--serif);
  font-size: clamp(44px, 6vw, 80px);
  font-weight: 300; font-style: italic;
  color: #fff; letter-spacing: -0.04em; line-height: 1;
  margin-bottom: 10px;
}
.bd-hero-sub {
  font-family: var(--mono); font-size: 12px; color: rgba(255,255,255,0.42);
  letter-spacing: 0.06em; line-height: 1.7;
}
.bd-hero-stats {
  display: flex; gap: 0;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}
.bd-hero-stat {
  padding: 18px 28px; border-right: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column; gap: 5px;
}
.bd-hero-stat:last-child { border-right: none; }
.bhs-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.38); }
.bhs-val { font-family: var(--serif); font-size: 28px; font-weight: 300; font-style: italic; color: #fff; letter-spacing: -0.03em; line-height: 1; }

/* ── SECTION HEADER ── */
.sec-hdr {
  padding: 28px 40px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
/* Large italic section title — matches Apple page section headings */
.sec-eyebrow {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--blue); margin-bottom: 5px;
}
.sec-title {
  font-family: var(--serif);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 300; font-style: italic;
  color: var(--ink); letter-spacing: -0.03em; line-height: 1.05;
}
.sec-sub {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em;
  color: var(--ink4); margin-top: 4px;
}

/* ── CONTENT ── */
.content { padding: 28px 40px; display: flex; flex-direction: column; gap: 24px; }

/* ── BUTTONS ── */
.btn {
  all: unset; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 9px 18px; border: 1px solid; transition: all 0.14s;
}
.btn:disabled { opacity: 0.35; pointer-events: none; }
.btn-blue   { background: var(--blue); color: #fff; border-color: var(--blue); }
.btn-blue:hover { background: var(--blue2); border-color: var(--blue2); }
.btn-ink    { background: var(--ink); color: #fff; border-color: var(--ink); }
.btn-ink:hover { background: #2a2a2e; }
.btn-ghost  { background: transparent; color: var(--ink2); border-color: var(--border2); }
.btn-ghost:hover { border-color: var(--ink3); color: var(--ink); }
.btn-green  { background: var(--green); color: #fff; border-color: var(--green); }
.btn-green:hover { opacity: 0.88; }
.btn-red    { background: transparent; color: var(--red); border-color: var(--red-border); }
.btn-red:hover { background: var(--red-bg); border-color: var(--red); }
.btn-pill   { border-radius: 99px; }

/* ── STATUS TAGS ── */
.tag {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  padding: 3px 9px; border: 1px solid;
}
.tag-green  { color: var(--green);  border-color: var(--green-border);  background: var(--green-bg); }
.tag-blue   { color: var(--blue);   border-color: var(--blue-border);   background: var(--blue-bg); }
.tag-amber  { color: var(--amber);  border-color: var(--amber-border);  background: var(--amber-bg); }
.tag-red    { color: var(--red);    border-color: var(--red-border);    background: var(--red-bg); }
.tag-purple { color: var(--purple); border-color: var(--purple-border); background: var(--purple-bg); }
.tag-muted  { color: var(--ink3);   border-color: var(--border2);       background: var(--surface2); }

/* ── ORDER CARD ── */
.order-card {
  background: var(--surface); border: 1px solid var(--border);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.order-card:hover { border-color: var(--border2); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.order-card-hdr {
  padding: 14px 24px; border-bottom: 1px solid var(--border);
  background: var(--surface2);
  display: grid; grid-template-columns: repeat(4, 1fr) auto;
  gap: 16px; align-items: start;
}
@media(max-width:800px){ .order-card-hdr { grid-template-columns: repeat(2,1fr); } }
.order-hdr-lbl { font-family: var(--mono); font-size: 8px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink4); margin-bottom: 3px; }
.order-hdr-val { font-family: var(--serif); font-size: 14px; font-style: italic; color: var(--ink); letter-spacing: -0.01em; }
.order-hdr-link { font-family: var(--mono); font-size: 10px; color: var(--blue); letter-spacing: 0.08em; text-decoration: none; }
.order-hdr-link:hover { text-decoration: underline; }
.order-body { padding: 24px; display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; }
.order-thumb { width: 80px; height: 80px; background: var(--surface2); border: 1px solid var(--border); overflow: hidden; flex-shrink: 0; }
.order-thumb img { width:100%; height:100%; object-fit:cover; }
.order-thumb-empty { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--ink5); }
.order-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
/* Large italic product name */
.order-name {
  font-family: var(--serif); font-size: clamp(18px, 2.5vw, 26px);
  font-weight: 400; font-style: italic;
  color: var(--ink); letter-spacing: -0.02em; line-height: 1.2;
}
.order-dates { font-family: var(--mono); font-size: 10px; color: var(--ink4); letter-spacing: 0.06em; margin-top: 3px; }
.order-actions { display: flex; flex-direction: column; gap: 7px; min-width: 180px; }

/* ── ORDER TIMELINE ── */
.timeline-wrap { padding: 20px 24px; border-top: 1px solid var(--border); background: var(--surface2); }
.timeline-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink4); margin-bottom: 14px; }
.timeline { display: flex; align-items: center; justify-content: space-between; position: relative; max-width: 520px; }
.timeline-track {
  position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%);
  height: 2px; background: var(--border); z-index: 0;
}
.timeline-fill {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  height: 2px; background: var(--green); z-index: 1; transition: width 0.6s var(--ease);
}
.timeline-step { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px; background: transparent; }
.timeline-dot {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--border); background: var(--surface);
  transition: all 0.3s;
}
.timeline-dot.done { background: var(--green); border-color: var(--green); color: #fff; }
.timeline-step-lbl {
  font-family: var(--mono); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink5); white-space: nowrap;
}
.timeline-step-lbl.done { color: var(--green); }
.timeline-cancelled {
  padding: 12px 16px; background: var(--red-bg); border: 1px solid var(--red-border);
  display: flex; align-items: center; gap: 10px;
  font-family: var(--mono); font-size: 10px; color: var(--red); letter-spacing: 0.08em;
}

/* ── GRID CARDS (wishlist / recommendations) ── */
.grid-card {
  background: var(--surface); border: 1px solid var(--border);
  transition: box-shadow 0.2s, border-color 0.2s;
  display: flex; flex-direction: column;
  position: relative;
}
.grid-card:hover { border-color: var(--border2); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.grid-card-img { aspect-ratio: 4/3; overflow: hidden; background: var(--surface2); position: relative; }
.grid-card-img img { width:100%; height:100%; object-fit:cover; filter:saturate(0.88); transition: filter 0.4s, transform 0.5s; }
.grid-card:hover .grid-card-img img { filter:saturate(1); transform: scale(1.04); }
.grid-card-body { padding: 16px 18px; flex:1; display:flex; flex-direction:column; gap:5px; }
.gc-cat { font-family: var(--mono); font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--blue); }
/* Large italic product name in cards */
.gc-name { font-family: var(--serif); font-size: 20px; font-weight: 400; font-style: italic; color: var(--ink); letter-spacing: -0.02em; line-height: 1.15; }
.gc-price { font-family: var(--serif); font-size: 15px; font-weight: 300; color: var(--ink2); margin-top: 3px; }
.gc-price small { font-family: var(--mono); font-size: 9px; color: var(--ink4); }
.gc-footer { padding: 12px 18px; border-top: 1px solid var(--border); display: flex; gap: 8px; }
.wl-remove {
  position: absolute; top: 10px; right: 10px;
  width: 30px; height: 30px;
  background: rgba(255,255,255,0.9); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  color: var(--red); cursor: pointer; transition: all 0.14s;
  backdrop-filter: blur(4px);
}
.wl-remove:hover { background: var(--red-bg); border-color: var(--red-border); }

/* ── CART ── */
.cart-item {
  background: var(--surface); border: 1px solid var(--border);
  padding: 16px 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  position: relative; transition: background 0.12s;
}
.cart-item:hover { background: var(--bg); }
.cart-thumb { width: 60px; height: 60px; overflow: hidden; background: var(--surface2); border: 1px solid var(--border); flex-shrink: 0; }
.cart-thumb img { width:100%; height:100%; object-fit:cover; }
.cart-name { font-family: var(--serif); font-size: 16px; font-style: italic; color: var(--ink); letter-spacing: -0.01em; }
.cart-dates { font-family: var(--mono); font-size: 10px; color: var(--ink4); letter-spacing: 0.05em; }
.cart-price { font-family: var(--serif); font-size: 20px; font-style: italic; font-weight: 300; color: var(--ink); letter-spacing: -0.02em; }
.cart-qty   { font-family: var(--mono); font-size: 9px; color: var(--ink4); letter-spacing: 0.1em; text-transform: uppercase; }
.cart-remove { all:unset; cursor:pointer; color:var(--ink5); transition:color 0.12s; }
.cart-remove:hover { color: var(--red); }

/* order summary card */
.summary-card {
  background: var(--surface); border: 1px solid var(--border);
  padding: 24px;
}
.summary-title { font-family: var(--serif); font-size: 22px; font-style: italic; font-weight: 300; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--border); }
.summary-row:last-of-type { border-bottom: none; }
.summary-row-lbl { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; color: var(--ink3); }
.summary-row-val { font-family: var(--serif); font-size: 15px; font-style: italic; color: var(--ink); letter-spacing: -0.01em; }
.summary-total-lbl { font-family: var(--serif); font-size: 18px; font-style: italic; color: var(--ink); }
/* Apple-scale total amount */
.summary-total-val {
  font-family: var(--serif);
  font-size: clamp(24px, 3vw, 36px);
  font-style: italic; font-weight: 300;
  color: var(--ink); letter-spacing: -0.03em;
}

/* ── REVIEWS ── */
.review-card { background: var(--surface); border: 1px solid var(--border); padding: 22px 28px; margin-bottom: 1px; transition: background 0.12s; }
.review-card:hover { background: var(--bg); }
.review-item-name { font-family: var(--serif); font-size: 18px; font-style: italic; font-weight: 400; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 5px; }
.review-body { font-family: var(--serif); font-size: 14px; font-style: italic; font-weight: 300; color: var(--ink2); line-height: 1.75; border-left: 2px solid var(--blue); padding-left: 14px; margin: 10px 0; }
.review-thread { margin-top: 12px; padding-left: 18px; border-left: 1px dashed var(--border2); display: flex; flex-direction: column; gap: 8px; }
.thread-msg { display: flex; gap: 8px; }
.thread-who { font-family: var(--mono); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; white-space: nowrap; padding-top: 2px; }
.thread-who-v { color: var(--blue); }
.thread-who-u { color: var(--ink4); }
.thread-body { font-family: var(--mono); font-size: 11px; color: var(--ink3); line-height: 1.6; }
.stars-row { display: flex; gap: 2px; }
.star { font-size: 14px; cursor: pointer; transition: color 0.1s; }
.star-on  { color: #f5a623; }
.star-off { color: var(--ink5); }
.star-off:hover { color: #f5c87a; }

/* vendor reply */
.vendor-reply { margin-top: 8px; padding: 10px 14px; background: var(--blue-bg); border: 1px solid var(--blue-border); }
.vendor-reply-lbl { font-family: var(--mono); font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--blue); margin-bottom: 4px; }
.vendor-reply-body { font-family: var(--serif); font-size: 13px; font-style: italic; color: var(--ink2); line-height: 1.65; }

/* ── CHAT ── */
.chat-layout { display: grid; grid-template-columns: 230px 1fr; height: calc(100vh - 52px - 57px); }
.chat-threads { background: var(--surface); border-right: 1px solid var(--border); overflow-y: auto; }
.chat-thread-item { padding: 13px 18px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
.chat-thread-item:hover { background: var(--bg); }
.chat-thread-item.active { background: var(--bg); border-left: 2px solid var(--blue); }
.ct-name { font-family: var(--serif); font-size: 14px; font-weight: 400; font-style: italic; color: var(--ink); }
.ct-vendor { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; color: var(--ink4); margin-top: 2px; text-transform: uppercase; }
.chat-body { display: flex; flex-direction: column; }
.chat-top {
  padding: 13px 20px; background: var(--surface); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.chat-top-name { font-family: var(--serif); font-size: 16px; font-style: italic; color: var(--ink); }
.chat-msgs { flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; background: var(--bg); }
.chat-msg { max-width: 72%; }
.chat-msg-me   { align-self: flex-end; }
.chat-msg-them { align-self: flex-start; }
.chat-bubble { padding: 10px 15px; font-family: var(--mono); font-size: 11px; line-height: 1.55; }
.chat-msg-me   .chat-bubble { background: var(--ink); color: rgba(255,255,255,0.82); }
.chat-msg-them .chat-bubble { background: var(--surface); border: 1px solid var(--border); color: var(--ink2); }
.chat-input-row { padding: 12px 18px; border-top: 1px solid var(--border); background: var(--surface); display: flex; gap: 0; }
.chat-input { flex:1; background: var(--bg); border:1px solid var(--border); border-right:none; color:var(--ink); padding:9px 14px; font-family:var(--mono); font-size:11px; outline:none; transition:border-color 0.12s; }
.chat-input:focus { border-color: var(--ink3); }
.chat-send { all:unset; cursor:pointer; width:40px; background:var(--blue); color:#fff; display:flex; align-items:center; justify-content:center; border:1px solid var(--blue); transition:background 0.12s; }
.chat-send:hover { background:var(--blue2); border-color:var(--blue2); }

/* ── ADDRESS ── */
.addr-card { background: var(--surface); border: 1px solid var(--border); padding: 18px 22px; transition: background 0.12s; position: relative; margin-bottom: 1px; }
.addr-card:hover { background: var(--bg); }
.addr-name { font-family: var(--serif); font-size: 16px; font-style: italic; color: var(--ink); letter-spacing: -0.01em; }
.addr-body { font-family: var(--mono); font-size: 10px; color: var(--ink3); line-height: 1.7; letter-spacing: 0.04em; margin-top: 4px; }
.addr-default { position: absolute; top: 14px; right: 16px; font-family: var(--mono); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; padding: 2px 8px; border: 1px solid var(--blue-border); color: var(--blue); background: var(--blue-bg); }

/* ── FORM FIELDS ── */
.field-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--ink4); display: block; margin-bottom: 7px; }
.field-in { width:100%; background:var(--bg); border:1px solid var(--border); color:var(--ink); padding:10px 13px; font-family:var(--mono); font-size:12px; outline:none; transition:border-color 0.12s; }
.field-in:focus { border-color: var(--blue); }
.field-ta { width:100%; background:var(--bg); border:1px solid var(--border); color:var(--ink); padding:10px 13px; font-family:var(--mono); font-size:12px; outline:none; transition:border-color 0.12s; resize:vertical; min-height:90px; }
.field-ta:focus { border-color: var(--blue); }
.field-sel { width:100%; background:var(--bg); border:1px solid var(--border); color:var(--ink); padding:10px 13px; font-family:var(--mono); font-size:12px; outline:none; appearance:none; }
.field-sel:focus { border-color: var(--blue); }

/* ── PROFILE ── */
.profile-avatar {
  width: 72px; height: 72px;
  border: 1px solid var(--border); background: var(--blue-bg);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--serif); font-size: 28px; font-style: italic; color: var(--blue); flex-shrink: 0;
}

/* ── DISPUTE MODAL ── */
.modal-backdrop { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(29,29,31,0.55); backdrop-filter:blur(10px); }
.modal {
  background: var(--surface); width:100%; max-width:500px; overflow:hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.18);
  animation: modalIn 0.22s var(--ease) both;
}
@keyframes modalIn { from{opacity:0;transform:translateY(10px) scale(.98)} to{opacity:1;transform:none} }
.modal-hdr { padding:24px 28px; border-bottom:1px solid var(--border); background:var(--surface2); display:flex; align-items:center; justify-content:space-between; }
.modal-title { font-family:var(--serif); font-size:24px; font-style:italic; font-weight:400; color:var(--ink); letter-spacing:-0.02em; }
.modal-close { all:unset; cursor:pointer; color:var(--ink4); transition:color 0.12s; }
.modal-close:hover { color:var(--red); }
.modal-body { padding:24px 28px; display:flex; flex-direction:column; gap:18px; }

/* ── NOTIFICATION CARDS ── */
.notif-card { border:1px solid var(--border); padding:14px 18px; display:flex; align-items:flex-start; gap:12px; background:var(--surface); margin-bottom:1px; transition:background 0.12s; }
.notif-card:hover { background:var(--bg); }
.notif-title { font-family:var(--serif); font-size:14px; font-style:italic; color:var(--ink); letter-spacing:-0.01em; }
.notif-body  { font-family:var(--mono); font-size:10px; color:var(--ink3); letter-spacing:0.04em; line-height:1.65; margin-top:2px; }

/* ── SUPPORT BOT ── */
.bot-wrap { position:fixed; bottom:28px; right:28px; z-index:1001; }
.bot-btn {
  all:unset; cursor:pointer; width:54px; height:54px;
  background:var(--blue); color:#fff;
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  box-shadow:0 8px 30px rgba(0,102,204,0.3);
  transition:transform 0.18s, box-shadow 0.18s;
}
.bot-btn:hover { transform:scale(1.08); box-shadow:0 12px 36px rgba(0,102,204,0.35); }
.bot-window {
  width:300px; height:420px; background:var(--surface); border:1px solid var(--border);
  display:flex; flex-direction:column; overflow:hidden;
  box-shadow:0 24px 60px rgba(0,0,0,0.14);
  animation:modalIn 0.2s var(--ease) both;
}
.bot-hdr { padding:14px 18px; background:var(--ink); color:#fff; display:flex; align-items:center; justify-content:space-between; }
.bot-hdr-name { font-family:var(--serif); font-size:14px; font-style:italic; color:#fff; }
.bot-close { all:unset; cursor:pointer; color:rgba(255,255,255,0.5); transition:color 0.12s; }
.bot-close:hover { color:#fff; }
.bot-msgs { flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:8px; background:var(--bg); }
.bot-msg { max-width:80%; padding:8px 12px; font-family:var(--mono); font-size:11px; line-height:1.55; }
.bot-msg-bot  { align-self:flex-start; background:var(--surface); border:1px solid var(--border); color:var(--ink2); }
.bot-msg-user { align-self:flex-end; background:var(--blue); color:#fff; }
.bot-input-row { padding:10px 14px; border-top:1px solid var(--border); display:flex; gap:0; }
.bot-input { flex:1; background:var(--bg); border:1px solid var(--border); border-right:none; color:var(--ink); padding:8px 12px; font-family:var(--mono); font-size:11px; outline:none; }
.bot-send { all:unset; cursor:pointer; width:36px; background:var(--blue); color:#fff; display:flex; align-items:center; justify-content:center; border:1px solid var(--blue); }

/* ── EMPTY STATES ── */
.empty-state { padding:64px 32px; text-align:center; background:var(--surface); border:1px solid var(--border); display:flex; flex-direction:column; align-items:center; gap:12px; }
.empty-icon { color:var(--ink5); }
.empty-title { font-family:var(--serif); font-size:22px; font-style:italic; font-weight:400; color:var(--ink); letter-spacing:-0.02em; }
.empty-sub { font-family:var(--mono); font-size:10px; letter-spacing:0.08em; color:var(--ink4); }

/* ── SECTION CARD ── */
.section-card { background:var(--surface); border:1px solid var(--border); }
.section-card-hdr { padding:18px 24px; border-bottom:1px solid var(--border); background:var(--surface2); display:flex; align-items:center; justify-content:space-between; gap:12px; }
.section-card-title { font-family:var(--serif); font-size:18px; font-style:italic; font-weight:400; color:var(--ink); letter-spacing:-0.02em; }

/* ── ANIMATIONS ── */
@keyframes fadeUp { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
.fade-up { animation:fadeUp 0.3s var(--ease) both; }
.fade-up-1 { animation-delay:0.06s; }
.fade-up-2 { animation-delay:0.12s; }
.fade-up-3 { animation-delay:0.18s; }

/* ── LOADING ── */
.loading-screen { min-height:100vh; background:var(--bg); display:flex; align-items:center; justify-content:center; }
.loading-ring { width:28px; height:28px; border:1.5px solid var(--border2); border-top-color:var(--blue); border-radius:50%; animation:spin 0.8s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }

/* ── SCROLLBAR ── */
* { scrollbar-width:thin; scrollbar-color:var(--border2) transparent; }
*::-webkit-scrollbar { width:3px; height:3px; }
*::-webkit-scrollbar-thumb { background:var(--border2); }

@media(max-width:860px){
  .bd-layout { grid-template-columns:1fr; }
  .bd-sidebar { position:static; height:auto; flex-direction:row; flex-wrap:wrap; padding:8px 12px; }
  .bd-sidebar-lbl,.bd-sidebar-footer { display:none; }
  .bd-nav-item { padding:7px 10px; border-left:none; border-bottom:2px solid transparent; font-size:10px; }
  .bd-nav-item.on { border-bottom-color:var(--blue); border-left:none; background:transparent; }
  .bd-hero { padding:28px 24px; }
  .content { padding:18px 18px; }
  .sec-hdr { padding:18px 18px 14px; }
  .chat-layout { grid-template-columns:1fr; height:auto; }
  .order-card-hdr { grid-template-columns:repeat(2,1fr); }
  .order-actions { min-width:unset; }
}
`;

/* ─── StatusTag ──────────────────────────────────────────── */
function StatusTag({ status }) {
  const s = (status || "").toLowerCase();
  if (["completed", "delivered", "confirmed"].includes(s)) return <span className="tag tag-green"><FiCheckCircle size={9} />{status}</span>;
  if (s === "shipped") return <span className="tag tag-purple"><FiTruck size={9} />Shipped</span>;
  if (s === "active") return <span className="tag tag-blue"><FiClock size={9} />Active</span>;
  if (s === "cancelled") return <span className="tag tag-red"><FiXCircle size={9} />Cancelled</span>;
  return <span className="tag tag-amber"><FiClock size={9} />Pending</span>;
}

/* ─── Order Timeline ─────────────────────────────────────── */
function OrderTimeline({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "cancelled") return (
    <div className="timeline-cancelled">
      <FiXCircle size={14} /> Order Cancelled
    </div>
  );
  const stages = ["Placed", "Confirmed", "Shipped", "Delivered", "Completed"];
  const cur = s === "confirmed" || s === "active" ? 1 : s === "shipped" ? 2 : s === "delivered" ? 3 : s === "completed" ? 4 : 0;
  const pct = (cur / 4) * 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="timeline" style={{ maxWidth: 500 }}>
        <div className="timeline-track" />
        <div className="timeline-fill" style={{ width: `${pct}%` }} />
        {stages.map((stage, i) => (
          <div key={i} className="timeline-step">
            <div className={`timeline-dot ${i <= cur ? "done" : ""}`}>
              {i === 2 ? <FiTruck size={10} /> : <FiCheckCircle size={10} />}
            </div>
            <span className={`timeline-step-lbl ${i <= cur ? "done" : ""}`}>{stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CartPaymentForm ────────────────────────────────────── */
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
        await bookingsAPI.confirmCartPayment(paymentIntent.id); 
        toast.success("Order completed! Redirecting to your orders..."); 
        if (onConfirmed) onConfirmed(); 
        setTimeout(() => {
          if (navigate) navigate("/buyer?tab=orders");
          else window.location.href = "/buyer?tab=orders";
        }, 1500);
      }
    } catch (err) { toast.error(err.message || "Failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleConfirm} style={{ marginTop: 16 }}>
      <div style={{ padding: 16, background: "var(--bg)", border: "1px solid var(--border)" }}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      <button type="submit" disabled={submitting || !stripe} className="btn btn-blue btn-pill" style={{ width: "100%", marginTop: 12, padding: "12px 0" }}>
        {submitting ? "Processing…" : "Confirm Payment"}
      </button>
    </form>
  );
}

/* ─── DisputeModal ───────────────────────────────────────── */
function DisputeModal({ booking, onClose, onSubmitted }) {
  const [sub, setSub] = useState(false);
  const [form, setForm] = useState({ reason: "not_as_described", description: "", evidence_url: "" });

  const go = async (e) => {
    e.preventDefault();
    if (!form.description) return toast.error("Description required.");
    setSub(true);
    try {
      await disputeAPI.create({ booking: booking.id, ...form });
      toast.success("Dispute filed.");
      onSubmitted();
    } catch (err) { toast.error(err.message || "Failed."); }
    finally { setSub(false); }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Report an Issue</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", color: "var(--ink4)", textTransform: "uppercase", marginTop: 3 }}>Order #{booking.id}</div>
          </div>
          <button className="modal-close" onClick={onClose}><FiXCircle size={20} /></button>
        </div>
        <form onSubmit={go} className="modal-body">
          <div>
            <label className="field-lbl">Reason</label>
            <select className="field-sel" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
              <option value="not_as_described">Equipment not as described</option>
              <option value="defective">Equipment defective</option>
              <option value="late_delivery">Late delivery</option>
              <option value="cancellation">Cancellation issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="field-lbl">Description</label>
            <textarea className="field-ta" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail…" />
          </div>
          <div>
            <label className="field-lbl">Evidence URL (optional)</label>
            <input className="field-in" type="text" value={form.evidence_url} onChange={e => setForm({ ...form, evidence_url: e.target.value })} placeholder="Link to photos or documents" />
          </div>
          <button type="submit" className="btn btn-red" disabled={sub} style={{ width: "100%", padding: "11px 0", borderColor: "var(--red)", background: "var(--red)", color: "#fff" }}>
            {sub ? "Submitting…" : "File Official Dispute"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── TABS ───────────────────────────────────────────────── */
const TABS = [
  { id: "orders",    label: "Orders",    icon: <FiPackage size={13} /> },
  { id: "wishlist",  label: "Wishlist",  icon: <FiHeart size={13} /> },
  { id: "recommend", label: "For You",   icon: <FiStar size={13} /> },
  { id: "cart",      label: "Cart",      icon: <FiShoppingCart size={13} /> },
  { id: "reviews",   label: "Reviews",   icon: <FiMessageSquare size={13} /> },
  { id: "addresses", label: "Addresses", icon: <FiMapPin size={13} /> },
  { id: "chat",      label: "Messages",  icon: <FiMessageSquare size={13} /> },
  { id: "profile",   label: "Profile",   icon: <FiUser size={13} /> },
];

/* ─── Main export ────────────────────────────────────────── */
export default function BuyerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { setCartCount } = useAppPreferences();
  
  // Ensure token getter is initialized for auth interceptor
  useEffect(() => {
    if (getToken) setTokenGetter(getToken);
  }, [getToken]);
  
  const query = new URLSearchParams(location.search);
  const requestedHash = (location.hash || "").replace(/^#/, "");
  const hashTabMap = { wishlist:"wishlist", cart:"cart", messages:"chat", chat:"chat", orders:"orders", recommend:"recommend", reviews:"reviews", addresses:"addresses", profile:"profile" };
  const requestedTab = query.get("tab") || hashTabMap[requestedHash];
  const requestedThreadId = Number(query.get("thread") || 0);
  const allowedTabs = useMemo(() => new Set(TABS.map(t => t.id)), []);

  const { isSignedIn, userId } = useAuth();
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
  const [addressForm, setAddressForm] = useState({ label:"Home", full_name:"", phone:"", line1:"", line2:"", city:"", state:"", postal_code:"", country:"India", is_default:false });
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [profileForm, setProfileForm] = useState({ full_name:"", phone:"", bio:"", preferred_location:"" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeBooking, setDisputeBooking] = useState(null);
  const [is2FA, setIs2FA] = useState(false);

  const totalSpend = useMemo(() => bookings.reduce((s, b) => s + Number(b.total_price || 0), 0), [bookings]);
  const cartTotal  = useMemo(() => cartItems.reduce((s, i) => s + Number(i.subtotal || 0), 0), [cartItems]);
  const pendingOrders = bookings.filter(b => b.status === "pending").length;

  const loadData = useCallback(async () => {
    setLoading(true);

    if (!isSignedIn || !userId) {
      setProfile(null);
      setBookings([]);
      setWishlist([]);
      setRecommendations([]);
      setMyReviews([]);
      setCartItems([]);
      setAddresses([]);
      setThreads([]);
      setSelectedThread(null);
      setCartClientSecret("");
      setLoading(false);
      return;
    }

    try {
      const [me, myBookings, wl, recs, addrs, tl, reviews, cart] = await Promise.all([
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
      if (me) setProfileForm({ full_name:me.full_name||"", phone:me.phone||"", bio:me.bio||"", preferred_location:me.preferred_location||"" });
      setBookings(Array.isArray(myBookings) ? myBookings : myBookings?.results || []);
      setWishlist(Array.isArray(wl) ? wl : wl?.results || []);
      setRecommendations(Array.isArray(recs) ? recs : recs?.results || []);
      setMyReviews(Array.isArray(reviews) ? reviews : reviews?.results || []);
      setCartItems(Array.isArray(cart) ? cart : cart?.results || []);
      setAddresses(Array.isArray(addrs) ? addrs : addrs?.results || []);
      const threadList = Array.isArray(tl) ? tl : tl?.results || [];
      setThreads(threadList);
      if (threadList.length) {
        const req = requestedThreadId ? threadList.find(t => Number(t.id) === requestedThreadId) : null;
        setSelectedThread(p => req || p || threadList[0]);
      }
    } catch (err) { toast.error(err.message || "Load failed."); }
    finally { setLoading(false); }
  }, [requestedThreadId, isSignedIn, userId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (allowedTabs.has(requestedTab)) setTab(requestedTab); }, [requestedTab, allowedTabs]);

  useEffect(() => {
    if (!selectedThread?.id) return;
    chatAPI.messages(selectedThread.id).then(d => setMessages(Array.isArray(d) ? d : d?.results || [])).catch(() => setMessages([]));
  }, [selectedThread]);

  useEffect(() => {
    if (!selectedThread?.id) return;
    const t = setInterval(() => chatAPI.messages(selectedThread.id).then(d => setMessages(Array.isArray(d) ? d : d?.results || [])).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [selectedThread?.id]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.createAddress(addressForm);
      setAddressForm({ label:"Home", full_name:"", phone:"", line1:"", line2:"", city:"", state:"", postal_code:"", country:"India", is_default:false });
      toast.success("Address saved.");
      const next = await usersAPI.addresses();
      setAddresses(Array.isArray(next) ? next : next?.results || []);
    } catch (err) { toast.error(err.message || "Failed."); }
  };

  const sendMessage = async () => {
    if (!selectedThread?.id || !newMessage.trim()) return;
    try {
      await chatAPI.sendMessage(selectedThread.id, { message: newMessage.trim() });
      setNewMessage("");
      const d = await chatAPI.messages(selectedThread.id);
      setMessages(Array.isArray(d) ? d : d?.results || []);
    } catch (err) { toast.error(err.message || "Failed."); }
  };

  const markCompleted = async (id) => { try { await bookingsAPI.complete(id); toast.success("Marked completed."); loadData(); } catch (err) { toast.error(err.message || "Failed."); } };
  const cancelOrder   = async (id) => { try { await bookingsAPI.cancel(id); toast.success("Cancelled."); loadData(); } catch (err) { toast.error(err.message || "Failed."); } };

  const removeCartItem = async (id) => {
    try { 
      await equipmentAPI.removeCartItem(id); 
      const n = await equipmentAPI.cart(); 
      setCartItems(Array.isArray(n) ? n : n?.results || []); 
      setCartCount(0);
    } catch (err) { toast.error(err.message || "Failed."); }
  };

  const checkoutCart = async (method) => {
    try {
      const result = await bookingsAPI.cartCheckout(method);
      if (method === "cod") {
        setCartClientSecret("");
        toast.success("COD order placed.");
        setCartCount(0);
        loadData();
      } else {
        setCartClientSecret(result.client_secret || "");
      }
    } catch (err) {
      const errMsg = err.message || "Checkout failed.";
      if (errMsg.includes("403") || errMsg.includes("Only buyers")) {
        toast.error("Syncing account permissions...");
        try {
          // Try to reset role to buyer
          await usersAPI.roleSync();
          toast.success("Account synced. Please try checkout again.");
          setCartClientSecret("");
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

  if (loading) return (
    <>
      <style>{G}</style>
      <div className="bd"><div className="loading-screen"><div className="loading-ring" /></div></div>
    </>
  );

  const firstName = profile?.full_name?.split(" ")[0];
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" });

  return (
    <>
      <style>{G}</style>
      <div className="bd">

        {/* ── NAV ── */}
        <nav className="bd-nav">
          <div className="bd-nav-logo">
            <div className="bd-nav-logo-dot" />
            TapRent<span style={{ color:"var(--ink3)", fontWeight:300 }}>.buyer</span>
          </div>
          <div className="bd-nav-right">
            <div className="bd-nav-stat"><span>Orders</span><strong>{bookings.length}</strong></div>
            <div className="bd-nav-sep" />
            <div className="bd-nav-stat"><span>Spend</span><strong>{fmt(totalSpend)}</strong></div>
            <div className="bd-nav-sep" />
            <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--ink2)", letterSpacing:"-0.01em" }}>
              {firstName || "Account"}
            </div>
          </div>
        </nav>

        {/* ── LAYOUT ── */}
        <div className="bd-layout">

          {/* ── SIDEBAR ── */}
          <nav className="bd-sidebar">
            <div className="bd-sidebar-lbl">Menu</div>
            {TABS.map(t => (
              <button key={t.id} className={`bd-nav-item ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
                <div className="bd-nav-item-inner">{t.icon}{t.label}</div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  {t.id === "orders" && pendingOrders > 0 && <span className="bd-badge bd-badge-red">{pendingOrders}</span>}
                  {t.id === "cart"   && cartItems.length > 0 && <span className="bd-badge bd-badge-blue">{cartItems.length}</span>}
                  {tab === t.id && <FiChevronRight size={11} style={{ color:"var(--blue)", opacity:0.6 }} />}
                </div>
              </button>
            ))}
            <div className="bd-sidebar-footer">
              <button
                onClick={() => setAssistantOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0071e3] hover:bg-[#0066cc] text-white rounded-xl font-medium transition-colors mb-3"
              >
                <FiHelpCircle className="w-4 h-4" />
                <span className="text-sm">TapRent Assistant</span>
              </button>
              <div>{dateStr}</div>
            </div>
          </nav>

          {/* ── MAIN ── */}
          <main className="bd-main">

            {/* ── HERO BANNER ── */}
            <div className="bd-hero">
              <div className="bd-hero-inner">
                <div>
                  <div className="bd-hero-eyebrow"><FiActivity size={10} />Buyer Hub</div>
                  {/* Apple.com scale: large italic serif, very tight tracking */}
                  <div className="bd-hero-title">
                    {firstName ? `Welcome back,\u00A0${firstName}.` : "Your Dashboard."}
                  </div>
                  <div className="bd-hero-sub">Manage orders, payments,<br />and communications seamlessly.</div>
                </div>
                <div className="bd-hero-stats">
                  <div className="bd-hero-stat">
                    <div className="bhs-lbl">Orders</div>
                    <div className="bhs-val">{bookings.length}</div>
                  </div>
                  <div className="bd-hero-stat">
                    <div className="bhs-lbl">Total Spend</div>
                    <div className="bhs-val">{fmt(totalSpend)}</div>
                  </div>
                  <div className="bd-hero-stat">
                    <div className="bhs-lbl">Saved Items</div>
                    <div className="bhs-val">{wishlist.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">History</div>
                    <div className="sec-title">My Orders</div>
                    <div className="sec-sub">{bookings.length} rental records</div>
                  </div>
                </div>
                <div className="content">
                  {bookings.length === 0 ? (
                    <div className="empty-state">
                      <FiPackage size={36} className="empty-icon" />
                      <div className="empty-title">No orders yet.</div>
                      <div className="empty-sub">Browse equipment to start renting</div>
                      <Link to="/" className="btn btn-blue btn-pill" style={{ marginTop:8, padding:"9px 22px" }}>Start Browsing</Link>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                      {bookings.map((b, idx) => (
                        <div key={b.id} className={`order-card fade-up`} style={{ animationDelay:`${idx * 0.05}s` }}>
                          {/* Order header row */}
                          <div className="order-card-hdr">
                            <div>
                              <div className="order-hdr-lbl">Order Placed</div>
                              <div className="order-hdr-val">{b.start_date}</div>
                            </div>
                            <div>
                              <div className="order-hdr-lbl">Total</div>
                              <div className="order-hdr-val">{fmt(b.total_price)}</div>
                            </div>
                            <div>
                              <div className="order-hdr-lbl">Ship To</div>
                              <div className="order-hdr-val" style={{ color:"var(--blue)", fontSize:13 }}>{b.shipping_address?.full_name || "Self"}</div>
                            </div>
                            <div>
                              <div className="order-hdr-lbl">Order #</div>
                              <div className="order-hdr-val">ORD-{String(b.id).padStart(6,"0")}</div>
                            </div>
                            <Link to={`/equipment/${b.equipment}`} className="order-hdr-link" style={{ alignSelf:"flex-start" }}>
                              View Details
                            </Link>
                          </div>

                          {/* Body */}
                          <div className="order-body">
                            <div style={{ display:"flex", gap:18, alignItems:"flex-start", flex:1 }}>
                              <div className="order-thumb">
                                {b.equipment_detail?.image_url
                                  ? <img src={b.equipment_detail.image_url} alt={b.equipment_detail.name} />
                                  : <div className="order-thumb-empty"><FiPackage size={22} /></div>}
                              </div>
                              <div className="order-info">
                                <div className="order-name">{b.equipment_detail?.name || "Equipment Rental"}</div>
                                <div className="order-dates">{b.start_date} — {b.end_date}</div>
                                <div style={{ marginTop:6 }}><StatusTag status={b.status} /></div>
                              </div>
                            </div>
                            <div className="order-actions">
                              {b.status === "active" && <>
                                <button className="btn btn-green" style={{ fontSize:9, padding:"8px 14px" }} onClick={() => markCompleted(b.id)}><FiCheckCircle size={10} /> Mark Completed</button>
                                <button className="btn btn-ghost" style={{ fontSize:9, padding:"8px 14px" }} onClick={() => { setDisputeBooking(b); setShowDispute(true); }}><FiAlertCircle size={10} /> Report Issue</button>
                              </>}
                              {["delivered","completed"].includes(b.status) && (
                                <button className="btn btn-ghost" style={{ fontSize:9, padding:"8px 14px" }} onClick={() => setTab("reviews")}><FiStar size={10} /> Write Review</button>
                              )}
                              {b.status === "shipped" && (
                                <div className="tag tag-purple" style={{ justifyContent:"center" }}><FiTruck size={9} /> In Transit</div>
                              )}
                              {!["cancelled","completed","delivered"].includes(b.status) && (
                                <button className="btn btn-red" style={{ fontSize:9, padding:"8px 14px" }} onClick={() => cancelOrder(b.id)}><FiXCircle size={10} /> Cancel</button>
                              )}
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="timeline-wrap">
                            <div className="timeline-lbl">Delivery &amp; Status Tracking</div>
                            <OrderTimeline status={b.status} />
                            <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--ink4)", letterSpacing:"0.05em", marginTop:8 }}>
                              Tracking info is updated by the vendor. Message them for urgent queries.
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── WISHLIST ── */}
            {tab === "wishlist" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Saved</div>
                    <div className="sec-title">Wishlist</div>
                    <div className="sec-sub">{wishlist.length} items saved</div>
                  </div>
                </div>
                <div className="content">
                  {wishlist.length === 0 ? (
                    <div className="empty-state">
                      <FiHeart size={36} className="empty-icon" />
                      <div className="empty-title">Nothing saved yet.</div>
                      <div className="empty-sub">Tap the heart on any listing to save it here</div>
                    </div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:1, background:"var(--border)" }}>
                      {wishlist.map(item => (
                        <div key={item.id} className="grid-card">
                          <div className="grid-card-img">
                            <img src={item.equipment_detail?.image_url} alt={item.equipment_detail?.name} />
                            <button className="wl-remove" onClick={() => { equipmentAPI.removeFromWishlist(item.equipment); loadData(); }}>
                              <FiHeart size={13} style={{ fill:"currentColor" }} />
                            </button>
                          </div>
                          <div className="grid-card-body">
                            <div className="gc-name">{item.equipment_detail?.name}</div>
                            <div className="gc-price">{fmt(item.equipment_detail?.price_per_day)}<small> / day</small></div>
                          </div>
                          <div className="gc-footer">
                            <Link to={`/equipment/${item.equipment}`} className="btn btn-ghost" style={{ flex:1, fontSize:9, padding:"8px 10px" }}>View Details</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RECOMMENDATIONS ── */}
            {tab === "recommend" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Personalised</div>
                    <div className="sec-title">For You</div>
                    <div className="sec-sub">ML-powered recommendations</div>
                  </div>
                </div>
                <div className="content">
                  {recommendations.length === 0 ? (
                    <div className="empty-state">
                      <FiStar size={36} className="empty-icon" />
                      <div className="empty-title">Rent more to unlock recommendations.</div>
                      <div className="empty-sub">Our ML engine learns from your rental history</div>
                    </div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:1, background:"var(--border)" }}>
                      {recommendations.map(item => (
                        <Link key={item.id} to={`/equipment/${item.id}`} className="grid-card" style={{ textDecoration:"none" }}>
                          <div className="grid-card-img"><img src={item.image_url} alt={item.name} /></div>
                          <div className="grid-card-body">
                            <div className="gc-cat">{item.category}</div>
                            <div className="gc-name">{item.name}</div>
                            <div className="gc-price">{fmt(item.price_per_day)}<small> / day</small></div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── CART ── */}
            {tab === "cart" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Checkout</div>
                    <div className="sec-title">Your Cart</div>
                    <div className="sec-sub">{cartItems.length} items</div>
                  </div>
                </div>
                <div className="content">
                  {cartItems.length === 0 ? (
                    <div className="empty-state">
                      <FiShoppingCart size={36} className="empty-icon" />
                      <div className="empty-title">Cart is empty.</div>
                      <div className="empty-sub">Add equipment to get started</div>
                    </div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start" }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                        {cartItems.map(item => (
                          <div key={item.id} className="cart-item">
                            <div style={{ display:"flex", gap:14, alignItems:"center", flex:1, minWidth:0 }}>
                              <div className="cart-thumb"><img src={item.equipment_detail?.image_url} alt={item.equipment_detail?.name} /></div>
                              <div>
                                <div className="cart-name">{item.equipment_detail?.name}</div>
                                <div className="cart-dates">{item.start_date} — {item.end_date}</div>
                              </div>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0 }}>
                              <div className="cart-price">{fmt(item.subtotal)}</div>
                              <div className="cart-qty">Qty: {item.quantity}</div>
                            </div>
                            <button className="cart-remove" onClick={() => removeCartItem(item.id)}><FiXCircle size={18} /></button>
                          </div>
                        ))}
                      </div>

                      <div className="summary-card" style={{ position:"sticky", top:68 }}>
                        <div className="summary-title">Order Summary</div>
                        <div className="summary-row">
                          <span className="summary-row-lbl">Subtotal ({cartItems.length} items)</span>
                          <span className="summary-row-val">{fmt(cartTotal)}</span>
                        </div>
                        <div className="summary-row">
                          <span className="summary-row-lbl">Platform Fee</span>
                          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--green)", letterSpacing:"0.08em" }}>Free</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"16px 0", borderTop:"2px solid var(--ink)", marginTop:8 }}>
                          <span className="summary-total-lbl">Total</span>
                          <span className="summary-total-val">{fmt(cartTotal)}</span>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
                          <button className="btn btn-blue btn-pill" style={{ width:"100%", padding:"12px 0", fontSize:10 }} onClick={() => checkoutCart("stripe")}>
                            Checkout with Card
                          </button>
                          <button className="btn btn-ghost btn-pill" style={{ width:"100%", padding:"12px 0", fontSize:10 }} onClick={() => checkoutCart("cod")}>
                            Cash on Delivery
                          </button>
                        </div>
                        {!stripeKey && (
                          <div style={{ marginTop:14, padding:"10px 14px", background:"var(--red-bg)", border:"1px solid var(--red-border)", fontFamily:"var(--mono)", fontSize:10, color:"var(--red)", letterSpacing:"0.04em" }}>
                            Stripe key not configured.
                          </div>
                        )}
                        {cartClientSecret && stripePromise && (
                          <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)" }}>
                            <Elements stripe={stripePromise} options={{ clientSecret: cartClientSecret }}>
                              <CartPaymentForm onConfirmed={() => { setCartClientSecret(""); loadData(); }} navigate={navigate} />
                            </Elements>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── REVIEWS ── */}
            {tab === "reviews" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Feedback</div>
                    <div className="sec-title">My Reviews</div>
                    <div className="sec-sub">{myReviews.length} published</div>
                  </div>
                </div>
                <div className="content">
                  {/* Published reviews */}
                  {myReviews.length > 0 && (
                    <div>
                      {myReviews.map(r => (
                        <div key={r.id} className="review-card">
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                            <div className="review-item-name">{r.equipment_detail?.name || r.title || "Equipment"}</div>
                            <div className="stars-row">{[1,2,3,4,5].map(n => <span key={n} className={`star ${n <= r.rating ? "star-on" : "star-off"}`}>★</span>)}</div>
                          </div>
                          <div className="review-body">"{r.comment}"</div>
                          {r.vendor_reply && (
                            <div className="vendor-reply">
                              <div className="vendor-reply-lbl">Vendor Reply</div>
                              <div className="vendor-reply-body">{r.vendor_reply}</div>
                            </div>
                          )}
                          {r.comments && r.comments.length > 0 && (
                            <div className="review-thread">
                              {r.comments.map(c => (
                                <div key={c.id} className="thread-msg">
                                  <div className={`thread-who ${c.is_vendor ? "thread-who-v" : "thread-who-u"}`}>[{c.commenter_name || "User"}]</div>
                                  <div className="thread-body">{c.comment}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Write review */}
                  {bookings.filter(b => ["active","completed"].includes((b.status||"").toLowerCase())).length > 0 && (
                    <div className="section-card">
                      <div className="section-card-hdr">
                        <div className="section-card-title">Write a Review</div>
                      </div>
                      <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:20 }}>
                        {bookings.filter(b => ["active","completed"].includes((b.status||"").toLowerCase())).map(b => {
                          const eqId = b.equipment_detail?.id || b.equipment;
                          const draft = reviewDrafts[eqId] || { rating:5, title:"", comment:"" };
                          return (
                            <div key={b.id} style={{ borderBottom:"1px solid var(--border)", paddingBottom:20 }}>
                              <div style={{ fontFamily:"var(--serif)", fontSize:17, fontStyle:"italic", color:"var(--ink)", marginBottom:10 }}>
                                {b.equipment_detail?.name || "Equipment"}
                              </div>
                              <div className="stars-row" style={{ marginBottom:12 }}>
                                {[1,2,3,4,5].map(n => (
                                  <button key={n} className={`star ${n <= draft.rating ? "star-on" : "star-off"}`}
                                    onClick={() => setReviewDrafts({ ...reviewDrafts, [eqId]:{ ...draft, rating:n } })}>★</button>
                                ))}
                              </div>
                              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                <input className="field-in" type="text" placeholder="Summarize your experience" value={draft.title} onChange={e => setReviewDrafts({ ...reviewDrafts, [eqId]:{ ...draft, title:e.target.value } })} />
                                <textarea className="field-ta" placeholder="What did you like or dislike?" value={draft.comment} onChange={e => setReviewDrafts({ ...reviewDrafts, [eqId]:{ ...draft, comment:e.target.value } })} />
                                <button className="btn btn-ink" style={{ alignSelf:"flex-start", fontSize:9 }} onClick={() => submitReview(eqId)}>Submit Review</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ADDRESSES ── */}
            {tab === "addresses" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Shipping</div>
                    <div className="sec-title">Addresses</div>
                    <div className="sec-sub">{addresses.length} saved</div>
                  </div>
                </div>
                <div className="content" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>
                  {/* Form */}
                  <div>
                    <div style={{ fontFamily:"var(--serif)", fontSize:18, fontStyle:"italic", color:"var(--ink)", marginBottom:18 }}>Add New Address</div>
                    <form onSubmit={handleSaveAddress} style={{ display:"flex", flexDirection:"column", gap:13 }}>
                      <div>
                        <label className="field-lbl">Label</label>
                        <input className="field-in" placeholder="Home, Office…" value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label:e.target.value })} required />
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div><label className="field-lbl">Full Name</label><input className="field-in" placeholder="Full Name" value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name:e.target.value })} required /></div>
                        <div><label className="field-lbl">Phone</label><input className="field-in" placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone:e.target.value })} required /></div>
                      </div>
                      <div><label className="field-lbl">Line 1</label><input className="field-in" placeholder="Address Line 1" value={addressForm.line1} onChange={e => setAddressForm({ ...addressForm, line1:e.target.value })} required /></div>
                      <div><label className="field-lbl">Line 2</label><input className="field-in" placeholder="Line 2 (optional)" value={addressForm.line2} onChange={e => setAddressForm({ ...addressForm, line2:e.target.value })} /></div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div><label className="field-lbl">City</label><input className="field-in" placeholder="City" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city:e.target.value })} required /></div>
                        <div><label className="field-lbl">State</label><input className="field-in" placeholder="State" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state:e.target.value })} required /></div>
                        <div><label className="field-lbl">PIN Code</label><input className="field-in" placeholder="PIN" value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code:e.target.value })} required /></div>
                        <div><label className="field-lbl">Country</label><input className="field-in" placeholder="Country" value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country:e.target.value })} required /></div>
                      </div>
                      <label style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.08em", color:"var(--ink3)", cursor:"pointer" }}>
                        <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default:e.target.checked })} />
                        Set as default
                      </label>
                      <button type="submit" className="btn btn-ink" style={{ alignSelf:"flex-start", marginTop:4, fontSize:9 }}>Save Address</button>
                    </form>
                  </div>

                  {/* Saved addresses */}
                  <div>
                    <div style={{ fontFamily:"var(--serif)", fontSize:18, fontStyle:"italic", color:"var(--ink)", marginBottom:18 }}>Saved Addresses</div>
                    {addresses.length === 0
                      ? <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--ink4)", letterSpacing:"0.08em" }}>No addresses saved.</div>
                      : addresses.map(a => (
                        <div key={a.id} className="addr-card">
                          {a.is_default && <div className="addr-default">Default</div>}
                          <div className="addr-name"><FiMapPin size={12} style={{ marginRight:5, verticalAlign:"middle" }} />{a.label}</div>
                          <div className="addr-body">{a.full_name}<br/>{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br/>{a.city}, {a.state} {a.postal_code}<br/>Ph: {a.phone}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}

            {/* ── CHAT ── */}
            {tab === "chat" && (
              <div className="fade-up">
                <div className="chat-layout">
                  <div className="chat-threads">
                    <div style={{ padding:"11px 18px 9px", borderBottom:"1px solid var(--border)", fontFamily:"var(--mono)", fontSize:9, letterSpacing:"0.25em", color:"var(--ink4)", textTransform:"uppercase" }}>Conversations</div>
                    {threads.map(t => (
                      <div key={t.id} className={`chat-thread-item ${selectedThread?.id === t.id ? "active" : ""}`} onClick={() => setSelectedThread(t)}>
                        <div className="ct-name">{t.equipment_name || `Thread #${t.id}`}</div>
                        <div className="ct-vendor">{t.equipment_vendor_name || "Vendor"}</div>
                      </div>
                    ))}
                  </div>
                  <div className="chat-body">
                    {selectedThread ? <>
                      <div className="chat-top">
                        <div className="chat-top-name">{selectedThread.equipment_name}</div>
                        <span className="tag tag-green">● Live</span>
                      </div>
                      <div className="chat-msgs">
                        {messages.length === 0 && (
                          <div style={{ margin:"auto", fontFamily:"var(--mono)", fontSize:10, color:"var(--ink4)", letterSpacing:"0.1em" }}>Send a message to start.</div>
                        )}
                        {messages.map(m => {
                          const isBuyer = String(m.sender_id) === String(selectedThread.buyer_id);
                          return (
                            <div key={m.id} className={`chat-msg ${isBuyer ? "chat-msg-me" : "chat-msg-them"}`}>
                              <div className="chat-bubble">{m.message}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="chat-input-row">
                        <input className="chat-input" type="text" placeholder="Type your message…" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
                        <button className="chat-send" onClick={sendMessage}><FiSend size={13} /></button>
                      </div>
                    </> : <div style={{ margin:"auto", fontFamily:"var(--mono)", fontSize:10, color:"var(--ink4)", letterSpacing:"0.1em" }}>Select a conversation</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── PROFILE ── */}
            {tab === "profile" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Account</div>
                    {/* Extra-large title for profile */}
                    <div className="sec-title">{profileForm.full_name || "Your Profile"}</div>
                    <div className="sec-sub">Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : "2026"}</div>
                  </div>
                </div>
                <div className="content" style={{ maxWidth:620 }}>
                  {/* Profile form */}
                  <div className="section-card">
                    <div className="section-card-hdr">
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <div className="profile-avatar">
                          {profileForm.full_name ? profileForm.full_name[0].toUpperCase() : <FiUser size={24} />}
                        </div>
                        <div>
                          <div className="section-card-title">{profileForm.full_name || "Buyer Account"}</div>
                          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--ink4)", letterSpacing:"0.12em", marginTop:2 }}>
                            <FiCheckCircle size={9} style={{ color:"var(--green)", verticalAlign:"middle", marginRight:4 }} />
                            Verified via Clerk
                          </div>
                        </div>
                      </div>
                    </div>
                    <form
                      onSubmit={async e => { e.preventDefault(); setSavingProfile(true); try { const r = await usersAPI.updateMe(profileForm); setProfile(r); toast.success("Saved."); } catch (err) { toast.error(err.message || "Failed."); } finally { setSavingProfile(false); } }}
                      style={{ padding:"22px 24px", display:"flex", flexDirection:"column", gap:16 }}
                    >
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                        <div><label className="field-lbl">Full Name</label><input className="field-in" type="text" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name:e.target.value })} placeholder="Your full name" /></div>
                        <div><label className="field-lbl">Phone</label><input className="field-in" type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone:e.target.value })} placeholder="+91 98765 43210" /></div>
                      </div>
                      <div><label className="field-lbl">Bio</label><textarea className="field-ta" value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio:e.target.value })} placeholder="Tell us about yourself" /></div>
                      <div><label className="field-lbl">Preferred Location</label><input className="field-in" type="text" value={profileForm.preferred_location} onChange={e => setProfileForm({ ...profileForm, preferred_location:e.target.value })} placeholder="City, State" /></div>
                      <button type="submit" disabled={savingProfile} className="btn btn-ink" style={{ alignSelf:"flex-start", marginTop:4, fontSize:9 }}>
                        {savingProfile ? "Saving…" : "Save Changes"}
                      </button>
                    </form>
                  </div>

                  {/* Notifications */}
                  <div className="section-card">
                    <div className="section-card-hdr">
                      <div className="section-card-title">Notifications</div>
                    </div>
                    <div>
                      <div className="notif-card">
                        <FiAlertCircle size={16} style={{ color:"var(--amber)", flexShrink:0, marginTop:1 }} />
                        <div>
                          <div className="notif-title">Subscription Renewal</div>
                          <div className="notif-body">Your Standard plan renews on April 1st. Ensure your payment method is active.</div>
                        </div>
                      </div>
                      <div className="notif-card">
                        <FiClock size={16} style={{ color:"var(--blue)", flexShrink:0, marginTop:1 }} />
                        <div>
                          <div className="notif-title">Scheduled Maintenance</div>
                          <div className="notif-body">Platform will be down for 2 hours on Sunday for security updates.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2FA */}
                  <div className="section-card">
                    <div className="section-card-hdr">
                      <div className="section-card-title">Security &amp; 2FA</div>
                    </div>
                    <div style={{ padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                      <div>
                        <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--ink)", marginBottom:3 }}>Two-Factor Authentication</div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--ink4)", letterSpacing:"0.05em" }}>Protect your account via Clerk.</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span className={`tag ${is2FA ? "tag-green" : "tag-red"}`}>{is2FA ? "Enabled" : "Disabled"}</span>
                        <button className="btn btn-ghost" style={{ fontSize:9 }} onClick={() => { setIs2FA(!is2FA); toast.success(is2FA ? "2FA Disabled" : "2FA Enabled"); }}>
                          {is2FA ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Help Ticket */}
                  <div className="section-card">
                    <div className="section-card-hdr">
                      <div className="section-card-title">Help &amp; Support</div>
                    </div>
                    <form
                      onSubmit={async e => { e.preventDefault(); const fd = new FormData(e.target); try { await supportAPI.createTicket({ subject:fd.get("subject"), message:fd.get("message") }); toast.success("Ticket created."); e.target.reset(); } catch { toast.error("Failed."); } }}
                      style={{ padding:"18px 24px", display:"flex", flexDirection:"column", gap:12 }}
                    >
                      <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--ink4)", letterSpacing:"0.06em", marginBottom:4 }}>Our team responds within 24 hours.</div>
                      <input name="subject" required className="field-in" placeholder="What can we help you with?" />
                      <textarea name="message" required className="field-ta" placeholder="Detailed explanation…" />
                      <button type="submit" className="btn btn-blue" style={{ alignSelf:"flex-start", fontSize:9 }}>Submit Ticket</button>
                    </form>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {showDispute && disputeBooking && (
          <DisputeModal booking={disputeBooking} onClose={() => setShowDispute(false)} onSubmitted={() => { setShowDispute(false); loadData(); }} />
        )}
        {assistantOpen && (
          <TapRentAssistant isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
        )}
      </div>
    </>
  );
}