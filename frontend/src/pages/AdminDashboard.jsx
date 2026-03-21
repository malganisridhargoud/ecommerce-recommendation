import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { analyticsAPI, recommendationsAPI, controlAPI, usersAPI, disputeAPI, supportAPI } from "../api/axiosConfig";
import {
  FiShield, FiCheckCircle, FiXCircle, FiTrendingUp, FiUsers, FiBox,
  FiActivity, FiLogOut, FiRefreshCw, FiZap, FiAlertCircle,
  FiMessageSquare, FiExternalLink, FiChevronRight, FiClock,
  FiCpu, FiPackage, FiStar, FiAlertTriangle
} from "react-icons/fi";

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const TABS = [
  { id: "overview",   label: "Overview",   icon: <FiActivity size={13} /> },
  { id: "moderation", label: "Moderation", icon: <FiBox size={13} /> },
  { id: "kyc",        label: "KYC Review", icon: <FiShield size={13} /> },
  { id: "disputes",   label: "Disputes",   icon: <FiAlertCircle size={13} /> },
  { id: "tickets",    label: "Help Desk",  icon: <FiMessageSquare size={13} /> },
  { id: "users",      label: "User Ctrl",  icon: <FiUsers size={13} /> },
];

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES — matches VendorDashboard design language
   Apple.com reference: SF-level whitespace, tight tracking on
   display headings, neutral greys + single blue accent,
   translucent surfaces, generous line-height on body text.
───────────────────────────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,700&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

/* ── Apple.com–inspired palette ──────────────────────────────
   Background:  #f5f5f7  (Apple's signature off-white page bg)
   Surface:     #ffffff
   Surface2:    #f5f5f7  (same — Apple reuses this)
   Text:        #1d1d1f  (Apple's near-black headline colour)
   Text2:       #424245  (Apple secondary copy)
   Text3:       #6e6e73  (Apple tertiary / captions)
   Text4:       #a1a1a6  (Apple disabled / placeholders)
   Text5:       #d2d2d7  (Apple rules / dividers)
   Accent blue: #0066cc  (Apple's link / CTA blue)
   Blue light:  #e8f0fb
   Green:       #1d8348  (success — Apple Maps green-ish)
   Green light: #eaf5ee
   Amber:       #9e6c00  (caution)
   Amber light: #fdf5e6
   Red:         #d70015  (Apple's system red)
   Red light:   #fde8ea
─────────────────────────────────────────────────────────────*/

:root {
  --bg:           #f5f5f7;
  --surface:      #ffffff;
  --surface2:     #f5f5f7;
  --surface3:     #ebebed;
  --border:       #d2d2d7;
  --border2:      #c7c7cc;
  --ink:          #1d1d1f;
  --ink2:         #424245;
  --ink3:         #6e6e73;
  --ink4:         #a1a1a6;
  --ink5:         #d2d2d7;
  --blue:         #0066cc;
  --blue2:        #0077ed;
  --blue-bg:      #e8f0fb;
  --blue-border:  #bcd4f5;
  --green:        #1d8348;
  --green-bg:     #eaf5ee;
  --green-border: #a8d8b9;
  --amber:        #9e6c00;
  --amber-bg:     #fdf5e6;
  --amber-border: #f0d080;
  --red:          #d70015;
  --red-bg:       #fde8ea;
  --red-border:   #f5b8be;
  --serif:        'Fraunces', Georgia, serif;
  --mono:         'DM Mono', 'Courier New', monospace;
  --ease:         cubic-bezier(.4,0,.2,1);
}

/* ── reset & root ── */
.ad { all: unset; display: block; }
.ad *, .ad *::before, .ad *::after { box-sizing: border-box; }
.ad {
  font-family: var(--mono);
  background: var(--bg);
  color: var(--ink);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ── TOP NAV — frosted apple-style bar ── */
.nav {
  height: 52px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px;
  position: sticky; top: 0; z-index: 200;
}
.nav-logo {
  font-family: var(--serif);
  font-size: 17px; font-weight: 500;
  color: var(--ink); letter-spacing: -0.025em;
  display: flex; align-items: center; gap: 8px;
}
.nav-logo-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--blue);
  box-shadow: 0 0 0 2px rgba(0,102,204,0.18);
  animation: dotpulse 3s ease-in-out infinite;
}
@keyframes dotpulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(0,102,204,0.18); }
  50%      { box-shadow: 0 0 0 5px rgba(0,102,204,0.05); }
}
.nav-tabs { display: flex; gap: 1px; }
.nav-tab {
  all: unset; cursor: pointer;
  display: flex; align-items: center; gap: 7px;
  padding: 6px 14px;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--ink3);
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}
.nav-tab:hover { color: var(--ink); }
.nav-tab.on { color: var(--blue); border-bottom-color: var(--blue); }
.nav-actions { display: flex; gap: 6px; }
.nav-icon-btn {
  all: unset; cursor: pointer;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink3); border: 1px solid var(--border);
  background: var(--surface);
  transition: all 0.15s;
}
.nav-icon-btn:hover { color: var(--ink); border-color: var(--border2); }
.nav-icon-btn.red:hover { color: var(--red); border-color: var(--red-border); background: var(--red-bg); }

/* ── LAYOUT ── */
.layout { display: grid; grid-template-columns: 216px 1fr; min-height: calc(100vh - 52px); }

/* ── SIDEBAR ── */
.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 28px 0 28px;
  display: flex; flex-direction: column;
  position: sticky; top: 52px;
  height: calc(100vh - 52px); overflow-y: auto;
}
.sidebar-label {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--ink5); padding: 0 22px 9px; margin-top: 6px;
}
.nav-item {
  all: unset; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 22px;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em;
  color: var(--ink3);
  border-left: 2px solid transparent;
  transition: color 0.14s, background 0.14s, border-color 0.14s;
  position: relative;
}
.nav-item:hover { color: var(--ink); background: var(--bg); }
.nav-item.active { color: var(--ink); background: var(--bg); border-left-color: var(--blue); }
.nav-item-inner { display: flex; align-items: center; gap: 9px; }
.nav-badge {
  background: var(--blue); color: #fff;
  font-size: 8px; padding: 1px 6px; border-radius: 20px; letter-spacing: 0.04em;
}
.sidebar-footer {
  margin-top: auto; padding: 18px 22px 0;
  border-top: 1px solid var(--border);
  font-family: var(--mono); font-size: 9px; color: var(--ink4); line-height: 1.8; letter-spacing: 0.04em;
}

/* ── MAIN ── */
.main { background: var(--bg); }

/* ── SECTION HEADER ── */
.sec-hdr {
  padding: 30px 40px 22px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.sec-eyebrow {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--blue); margin-bottom: 5px;
}
.sec-title {
  font-family: var(--serif); font-size: 34px; font-weight: 400;
  color: var(--ink); letter-spacing: -0.03em; line-height: 1.1;
  font-style: italic;
}
.sec-sub {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em;
  color: var(--ink4); margin-top: 4px;
}

/* ── COMMAND HEADER ── */
.cmd-hdr {
  padding: 36px 40px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap;
  /* Apple hero: very clean, nothing decorative */
}
.cmd-eyebrow {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--blue); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
}
.cmd-title {
  /* Apple.com headline style: SF-sized, tight tracking, near-black */
  font-family: var(--serif);
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 300; font-style: italic;
  color: var(--ink); letter-spacing: -0.04em; line-height: 1.05;
}
.cmd-subtitle {
  font-family: var(--mono); font-size: 12px; color: var(--ink3);
  letter-spacing: 0.05em; margin-top: 6px; line-height: 1.6;
}
/* Apple-style "Today at Apple" datestamp */
.cmd-date {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--ink4); margin-top: 10px;
}
.cmd-actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* ── STAT BAND — same grid pattern as Vendor ── */
.stat-band {
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: var(--surface); border-bottom: 1px solid var(--border);
}
@media(max-width:900px){ .stat-band { grid-template-columns: repeat(2,1fr); } }
.stat-cell {
  padding: 22px 26px; border-right: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 5px;
  position: relative; transition: background 0.15s; overflow: hidden;
}
.stat-cell:last-child { border-right: none; }
.stat-cell:hover { background: var(--bg); }
.stat-cell::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.25s var(--ease);
}
.stat-cell:hover::after { transform: scaleX(1); }
.sc-rev::after   { background: var(--blue);  }
.sc-ven::after   { background: var(--green); }
.sc-list::after  { background: var(--amber); }
.sc-book::after  { background: var(--blue);  }
.stat-cell.featured {
  background: var(--ink);
}
.stat-cell.featured:hover { background: #2a2a2e; }
.stat-cell.featured::after { background: var(--blue2); }
.sc-label     { font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink4); }
.sc-label-inv { color: rgba(255,255,255,0.38); }
.sc-value     { font-family: var(--serif); font-size: 28px; font-weight: 300; font-style: italic; color: var(--ink); letter-spacing: -0.03em; line-height: 1; }
.sc-value-inv { color: #fff; }
.sc-sub       { font-family: var(--mono); font-size: 9px; color: var(--ink5); letter-spacing: 0.05em; }
.sc-sub-inv   { color: rgba(255,255,255,0.28); }

/* ── BUTTONS ── */
.btn {
  all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 9px 18px; border: 1px solid; transition: all 0.14s;
}
.btn:disabled { opacity: 0.35; pointer-events: none; }
/* Apple's primary blue CTA */
.btn-blue {
  background: var(--blue); color: #fff; border-color: var(--blue);
}
.btn-blue:hover { background: var(--blue2); border-color: var(--blue2); }
.btn-ghost {
  background: transparent; color: var(--ink2); border-color: var(--border2);
}
.btn-ghost:hover { border-color: var(--ink3); color: var(--ink); }
.btn-green { background: var(--green); color: #fff; border-color: var(--green); }
.btn-green:hover { opacity: 0.88; }
.btn-red   { background: transparent; color: var(--red); border-color: var(--red-border); }
.btn-red:hover { background: var(--red-bg); border-color: var(--red); }

/* ── STATUS TAGS ── */
.tag {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  padding: 3px 9px; border: 1px solid;
}
.tag-green  { color: var(--green); border-color: var(--green-border); background: var(--green-bg); }
.tag-blue   { color: var(--blue);  border-color: var(--blue-border);  background: var(--blue-bg); }
.tag-amber  { color: var(--amber); border-color: var(--amber-border); background: var(--amber-bg); }
.tag-red    { color: var(--red);   border-color: var(--red-border);   background: var(--red-bg); }
.tag-muted  { color: var(--ink3);  border-color: var(--border2);      background: var(--surface2); }

/* ── CARD ── */
.card {
  background: var(--surface); border: 1px solid var(--border);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.card:hover { border-color: var(--border2); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.card-hdr {
  padding: 18px 26px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.card-title {
  font-family: var(--serif); font-size: 16px; font-weight: 400;
  font-style: italic; color: var(--ink); letter-spacing: -0.02em;
}
.card-meta { font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink4); }

/* ── DATA TABLE ── */
.dtbl { width: 100%; border-collapse: collapse; }
.dtbl th {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase;
  color: var(--ink4); padding: 11px 24px; border-bottom: 1px solid var(--border);
  text-align: left; background: var(--surface2);
}
.dtbl td { padding: 15px 24px; border-bottom: 1px solid var(--border); font-family: var(--mono); font-size: 12px; vertical-align: middle; }
.dtbl tr:last-child td { border-bottom: none; }
.dtbl tr:hover td { background: var(--bg); }
.dtbl-name { font-family: var(--serif); font-size: 15px; font-weight: 400; font-style: italic; color: var(--ink); letter-spacing: -0.015em; }
.dtbl-sub  { font-family: var(--mono); font-size: 9px; color: var(--ink4); letter-spacing: 0.08em; margin-top: 2px; }
.dtbl-empty {
  padding: 60px 24px; text-align: center;
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.28em; color: var(--ink5); text-transform: uppercase;
}

/* ── OVERVIEW GRID ── */
.ov-grid {
  display: grid; grid-template-columns: 1fr 360px;
  gap: 1px; background: var(--border); border: 1px solid var(--border);
}
@media(max-width:1100px){ .ov-grid { grid-template-columns: 1fr; } }

.chart-wrap { background: var(--surface); padding: 24px 28px; }
.chart-title {
  font-family: var(--serif); font-size: 14px; font-weight: 400; font-style: italic;
  color: var(--ink); letter-spacing: -0.02em; margin-bottom: 20px;
  display: flex; align-items: center; gap: 8px;
}
.chart-title::before {
  content: '';
  display: inline-block; width: 3px; height: 14px;
  background: var(--blue); flex-shrink: 0;
}

.ov-aside { background: var(--surface); border-left: 1px solid var(--border); display: flex; flex-direction: column; }
.aside-kv { padding: 17px 24px; border-bottom: 1px solid var(--border); transition: background 0.12s; }
.aside-kv:last-child { border-bottom: none; }
.aside-kv:hover { background: var(--bg); }
.aside-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink4); margin-bottom: 5px; }
.aside-val { font-family: var(--serif); font-size: 20px; font-weight: 300; font-style: italic; color: var(--ink); letter-spacing: -0.02em; }
.aside-sub { font-family: var(--mono); font-size: 9px; color: var(--ink5); margin-top: 3px; }

/* usage bars */
.health-bar { padding: 16px 24px; border-bottom: 1px solid var(--border); }
.health-lbl {
  display: flex; justify-content: space-between;
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink4); margin-bottom: 7px;
}
.health-track { height: 3px; background: var(--border); }
.health-fill { height: 100%; transition: width 1.2s var(--ease); }
.hf-amber { background: var(--amber); }
.hf-blue  { background: var(--blue); }

/* ── ACTIVITY FEEDS ── */
.act-grid {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 1px; background: var(--border); border: 1px solid var(--border);
}
@media(max-width:1100px){ .act-grid { grid-template-columns: 1fr 1fr; } }
@media(max-width:640px)  { .act-grid { grid-template-columns: 1fr; } }
.act-col { background: var(--surface); }
.act-col-hdr {
  padding: 11px 20px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink4);
}
.act-count { color: var(--blue); }
.act-scroll { max-height: 280px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.act-scroll::-webkit-scrollbar { width: 3px; }
.act-scroll::-webkit-scrollbar-thumb { background: var(--border2); }
.act-item { padding: 11px 20px; border-bottom: 1px solid var(--border); transition: background 0.1s; display: flex; flex-direction: column; gap: 4px; }
.act-item:last-child { border-bottom: none; }
.act-item:hover { background: var(--bg); }
.act-name { font-family: var(--serif); font-size: 13px; font-weight: 400; font-style: italic; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.act-meta { font-family: var(--mono); font-size: 10px; color: var(--ink4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.act-row  { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.act-amt  { font-family: var(--serif); font-size: 14px; font-style: italic; color: var(--ink); }
.act-stars { color: var(--blue); font-size: 11px; letter-spacing: 2px; }
.act-empty { padding: 40px; text-align: center; font-family: var(--mono); font-size: 9px; letter-spacing: 0.25em; color: var(--ink5); text-transform: uppercase; }

/* ── DISPUTE / TICKET CARD ── */
.dt-card {
  background: var(--surface); border: 1px solid var(--border);
  margin-bottom: 1px; transition: border-color 0.15s, box-shadow 0.15s;
}
.dt-card:hover { border-color: var(--border2); box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.dt-inner { padding: 22px 28px; display: flex; gap: 24px; flex-wrap: wrap; }
.dt-body  { flex: 1; display: flex; flex-direction: column; gap: 9px; min-width: 0; }
.dt-ref   { font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink4); }
.dt-subj  {
  font-family: var(--serif); font-size: 20px; font-weight: 400; font-style: italic;
  color: var(--ink); letter-spacing: -0.02em; text-transform: capitalize;
}
/* Apple.com pull-quote treatment: left blue rule, generous italic text */
.dt-desc  {
  font-family: var(--serif); font-size: 14px; font-style: italic; font-weight: 300;
  color: var(--ink2); line-height: 1.75;
  border-left: 2px solid var(--blue); padding-left: 14px;
}
.dt-actions { display: flex; flex-direction: column; gap: 8px; min-width: 180px; justify-content: center; }
.dt-textarea {
  width: 100%; height: 78px; background: var(--bg); border: 1px solid var(--border);
  color: var(--ink); padding: 9px 13px; font-family: var(--mono); font-size: 11px;
  outline: none; resize: none; transition: border-color 0.12s;
}
.dt-textarea:focus { border-color: var(--blue); }
.dt-btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

/* ── CONTENT AREA ── */
.content { padding: 28px 40px; display: flex; flex-direction: column; gap: 24px; }

/* ── TRAIN BUTTON — Apple CTA style ── */
.train-btn {
  all: unset; cursor: pointer; width: 100%; padding: 13px;
  /* Apple's blue CTA: flat, clean, full-width */
  background: var(--blue); color: #fff;
  font-family: var(--serif); font-size: 13px; font-style: italic; font-weight: 400;
  letter-spacing: -0.01em;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  transition: background 0.14s;
  border-top: 1px solid var(--border);
}
.train-btn:hover { background: var(--blue2); }
.train-btn:disabled { opacity: 0.35; pointer-events: none; }

/* ── TOOLTIP ── */
.ct-wrap { background: var(--ink); padding: 10px 14px; border: none; }
.ct-lbl  { font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.42); margin-bottom: 4px; }
.ct-val  { font-family: var(--serif); font-size: 16px; font-style: italic; color: #fff; }

/* ── EMPTY ── */
.empty {
  padding: 64px 40px; text-align: center; font-family: var(--mono);
  font-size: 9px; letter-spacing: 0.28em; color: var(--ink5); text-transform: uppercase;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}

/* ── ANIMATIONS ── */
@keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
.fade-up { animation: fadeUp 0.3s var(--ease) both; }

/* ── LOADING ── */
.loading-wrap { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; }
.loading-ring { width: 28px; height: 28px; border: 1.5px solid var(--border2); border-top-color: var(--blue); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── SETTINGS ── */
.settings-wrap { max-width: 540px; padding: 28px 40px; display: flex; flex-direction: column; gap: 20px; }
.field-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--ink4); display: block; margin-bottom: 7px; }
.field-input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--ink); padding: 10px 13px; font-family: var(--mono); font-size: 12px; outline: none; transition: border-color 0.12s; }
.field-input:focus { border-color: var(--blue); }

/* ── KYC ── */
.kyc-row { padding: 26px 40px; display: flex; align-items: center; gap: 18px; border-bottom: 1px solid var(--border); background: var(--surface); }
.kyc-icon { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border: 1px solid; flex-shrink: 0; }
.kyc-icon-v { border-color: var(--green-border); color: var(--green); background: var(--green-bg); }
.kyc-icon-p { border-color: var(--amber-border); color: var(--amber); background: var(--amber-bg); }
.kyc-icon-n { border-color: var(--border); color: var(--ink4); background: var(--surface2); }
.kyc-state { font-family: var(--serif); font-size: 26px; font-weight: 400; font-style: italic; color: var(--ink); letter-spacing: -0.02em; text-transform: capitalize; }
.kyc-desc  { font-family: var(--mono); font-size: 10px; color: var(--ink4); letter-spacing: 0.06em; margin-top: 3px; }

/* ── PLAN CHIP ── */
.growth-chip { color: var(--amber); border-color: var(--amber-border); background: var(--amber-bg); }
.std-chip    { color: var(--ink3); border-color: var(--border2); background: var(--surface2); }

/* ── scrollbar ── */
* { scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
*::-webkit-scrollbar { width: 4px; height: 4px; }
*::-webkit-scrollbar-thumb { background: var(--border2); }

@media(max-width:700px){
  .nav-tabs { display: none; }
  .layout { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; flex-direction: row; flex-wrap: wrap; padding: 8px 10px; }
  .sidebar-label, .sidebar-footer { display: none; }
  .nav-item { padding: 7px 11px; border-left: none; border-bottom: 2px solid transparent; font-size: 10px; }
  .nav-item.active { border-bottom-color: var(--blue); border-left: none; background: transparent; }
  .stat-band { grid-template-columns: repeat(2,1fr); }
  .content { padding: 18px 18px; }
  .sec-hdr { padding: 20px 18px 16px; }
  .cmd-hdr { padding: 24px 18px 20px; }
  .dt-inner { flex-direction: column; }
  .dtbl th, .dtbl td { padding: 10px 14px; }
}
`;

/* ─── Sub-components ──────────────────────────────────────── */
function StatusTag({ status }) {
  const s = (status || "").toLowerCase().replace(/\s+/g, "_");
  const map = {
    confirmed: "tag-green", paid: "tag-green", completed: "tag-green",
    verified: "tag-green", active: "tag-green",
    pending: "tag-amber", open: "tag-amber", in_progress: "tag-blue",
    cancelled: "tag-red", failed: "tag-red", rejected: "tag-red", suspended: "tag-red",
    not_started: "tag-muted", standard: "tag-muted",
  };
  return <span className={`tag ${map[s] || "tag-muted"}`}>{status || "—"}</span>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ct-wrap">
      <div className="ct-lbl">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="ct-val">
          {p.dataKey === "revenue" ? fmt(p.value) : `${p.value} bookings`}
        </div>
      ))}
    </div>
  );
}

function DisputesView({ disputes, onAction }) {
  const [acting, setActing] = useState(null);
  const [notes, setNotes] = useState({});

  const handle = async (id, status) => {
    setActing(id);
    try {
      await controlAPI.userAction({
        target_user_id: `Dispute-${id}`, action_type: "warn",
        reason: `Status → ${status}. ${notes[id] || ""}`,
      });
      toast.success(`Dispute ${status}`);
      onAction();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  return (
    <div className="fade-up">
      <div className="sec-hdr">
        <div>
          <div className="sec-eyebrow">Arbitration</div>
          <div className="sec-title">Dispute Resolution</div>
          <div className="sec-sub">{disputes.filter(d => d.status === "open").length} open claims</div>
        </div>
        <span className="tag tag-amber">{disputes.filter(d => d.status === "open").length} open</span>
      </div>
      <div>
        {disputes.length === 0
          ? <div className="empty" style={{ background: "var(--surface)" }}><FiAlertCircle size={28} style={{ opacity: 0.12 }} />No disputes on record</div>
          : disputes.map(d => (
            <div key={d.id} className="dt-card">
              <div className="dt-inner">
                <div className="dt-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusTag status={d.status} />
                    <span className="dt-ref">Booking #{d.booking}</span>
                  </div>
                  <div className="dt-subj">{d.reason.replace(/_/g, " ")}</div>
                  <div className="dt-desc">"{d.description}"</div>
                  {d.evidence_url && (
                    <a href={d.evidence_url} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--blue)", textDecoration: "none", textTransform: "uppercase" }}>
                      <FiExternalLink size={11} /> View Evidence
                    </a>
                  )}
                </div>
                {d.status === "open" && (
                  <div className="dt-actions">
                    <textarea className="dt-textarea" placeholder="Arbitration notes…"
                      value={notes[d.id] || ""} onChange={e => setNotes({ ...notes, [d.id]: e.target.value })} />
                    <div className="dt-btn-row">
                      <button className="btn btn-green" style={{ fontSize: 9, padding: "7px 10px", justifyContent: "center" }}
                        onClick={() => handle(d.id, "resolved_refunded")} disabled={acting === d.id}>
                        <FiCheckCircle size={10} /> Approve
                      </button>
                      <button className="btn btn-red" style={{ fontSize: 9, padding: "7px 10px", justifyContent: "center" }}
                        onClick={() => handle(d.id, "resolved_rejected")} disabled={acting === d.id}>
                        <FiXCircle size={10} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function TicketsView({ tickets, onAction }) {
  const [acting, setActing] = useState(null);

  const handle = async (id, status) => {
    setActing(id);
    try {
      await controlAPI.userAction({ target_user_id: `Ticket-${id}`, action_type: "warn", reason: `Status → ${status}` });
      toast.success(`Ticket → ${status}`);
      onAction();
    } catch { toast.error("Failed."); }
    finally { setActing(null); }
  };

  return (
    <div className="fade-up">
      <div className="sec-hdr">
        <div>
          <div className="sec-eyebrow">Support</div>
          <div className="sec-title">Help Desk</div>
          <div className="sec-sub">{tickets.filter(t => t.status === "open").length} open tickets</div>
        </div>
        <span className="tag tag-blue">{tickets.filter(t => t.status === "open").length} open</span>
      </div>
      <div>
        {tickets.length === 0
          ? <div className="empty" style={{ background: "var(--surface)" }}><FiMessageSquare size={28} style={{ opacity: 0.12 }} />No tickets on record</div>
          : tickets.map(t => (
            <div key={t.id} className="dt-card">
              <div className="dt-inner">
                <div className="dt-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusTag status={t.status} />
                    <span className="dt-ref">Ticket #{t.id}</span>
                    {t.priority > 1 && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", display: "inline-block", animation: "dotpulse 1.8s infinite" }} />
                    )}
                  </div>
                  <div className="dt-subj">{t.subject}</div>
                  <div className="dt-desc">{t.message}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--ink4)", textTransform: "uppercase" }}>uid · {t.user_id}</div>
                </div>
                {t.status === "open" && (
                  <div className="dt-actions">
                    <button className="btn btn-blue" style={{ fontSize: 9, padding: "9px 12px", justifyContent: "center" }}
                      onClick={() => handle(t.id, "in_progress")} disabled={acting === t.id}>
                      Take Ownership
                    </button>
                    <button className="btn btn-ghost" style={{ fontSize: 9, padding: "9px 12px", justifyContent: "center" }}
                      onClick={() => handle(t.id, "closed")} disabled={acting === t.id}>
                      Close Ticket
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────── */
export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ platformRevenue: 0, activeVendors: 0, activeListings: 0, totalBookings: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [training, setTraining] = useState(false);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [kycQueue, setKycQueue] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      const data = await analyticsAPI.admin();
      setStats({
        platformRevenue: Number(data?.platform_revenue || 0),
        activeVendors:   Number(data?.active_vendors || 0),
        activeListings:  Number(data?.active_listings || 0),
        totalBookings:   Number(data?.total_bookings || 0),
      });
      const cats = Array.isArray(data?.bookings_by_category) ? data.bookings_by_category : [];
      setCategoryData(cats.map(i => ({ name: i.equipment__category || "other", bookings: Number(i.count || 0), revenue: Number(i.revenue || 0) })));
      setRecentBookings(Array.isArray(data?.recent_bookings) ? data.recent_bookings : []);
      setRecentPayments(Array.isArray(data?.recent_payments) ? data.recent_payments : []);
      setRecentReviews(Array.isArray(data?.recent_reviews) ? data.recent_reviews : []);
    } catch (e) { console.error(e); }
  }, []);

  const loadModeration = useCallback(async () => { try { const d = await controlAPI.equipment({ moderation_status: "pending" }); setModerationQueue(Array.isArray(d) ? d : d?.results || []); } catch {} }, []);
  const loadKYC        = useCallback(async () => { try { const d = await controlAPI.vendors({ kyc_status: "pending" }); setKycQueue(Array.isArray(d) ? d : d?.results || []); } catch {} }, []);
  const loadUsers      = useCallback(async () => { try { const d = await usersAPI.list(); setUsersList(Array.isArray(d) ? d : d?.results || []); } catch {} }, []);
  const loadDisputes   = useCallback(async () => { try { const d = await disputeAPI.list(); setDisputes(Array.isArray(d) ? d : d?.results || []); } catch {} }, []);
  const loadTickets    = useCallback(async () => { try { const d = await supportAPI.tickets(); setTickets(Array.isArray(d) ? d : d?.results || []); } catch {} }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadOverview(), loadModeration(), loadKYC(), loadUsers(), loadDisputes(), loadTickets()]);
    setLoading(false);
  }, [loadOverview, loadModeration, loadKYC, loadUsers, loadDisputes, loadTickets]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleModerate = async (id, action) => {
    setProcessingId(id);
    try { await controlAPI.moderate(id, { action, notes: `Admin: ${action}` }); toast.success(`Listing ${action}.`); loadModeration(); }
    catch (e) { toast.error(e.message); } finally { setProcessingId(null); }
  };

  const handleKYC = async (id, status) => {
    setProcessingId(id);
    try { await controlAPI.kycApprove(id, { status, rejection_reason: status === "rejected" ? "Documents invalid" : "" }); toast.success(`KYC ${status}.`); loadKYC(); }
    catch (e) { toast.error(e.message); } finally { setProcessingId(null); }
  };

  const trainRecommendations = async () => {
    setTraining(true);
    try { const r = await recommendationsAPI.train(); toast.success(`Model trained · ${r.equipment_count} items`); }
    catch (e) { toast.error(e.message || "Training failed"); } finally { setTraining(false); }
  };

  const handleLogout = () => { localStorage.removeItem("admin_token"); window.location.href = "/login/admin"; };

  const topCategory = useMemo(() => {
    if (!categoryData.length) return null;
    return [...categoryData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [categoryData]);

  const listingsPerVendor = stats.activeVendors > 0 ? (stats.activeListings / stats.activeVendors).toFixed(1) : "0.0";
  const revenuePerBooking = stats.totalBookings > 0 ? fmt(stats.platformRevenue / stats.totalBookings) : fmt(0);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) return (
    <>
      <style>{G}</style>
      <div className="ad"><div className="loading-wrap"><div className="loading-ring" /></div></div>
    </>
  );

  return (
    <>
      <style>{G}</style>
      <div className="ad">

        {/* ── NAV ── */}
        <nav className="nav">
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div className="nav-logo">
              <div className="nav-logo-dot" />
              TapRent<span style={{ color: "var(--ink3)", fontWeight: 300, fontStyle: "italic" }}>.admin</span>
            </div>
            <div className="nav-tabs">
              {TABS.map(t => (
                <button key={t.id} className={`nav-tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="nav-actions">
            <button className="nav-icon-btn" onClick={loadDashboard} title="Refresh"><FiRefreshCw size={13} /></button>
            <button className="nav-icon-btn red" onClick={handleLogout} title="Log out"><FiLogOut size={13} /></button>
          </div>
        </nav>

        <div className="layout">

          {/* ── SIDEBAR ── */}
          <nav className="sidebar">
            <div className="sidebar-label">Navigation</div>
            {TABS.map(t => (
              <button key={t.id} className={`nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <div className="nav-item-inner">{t.icon}{t.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {t.id === "moderation" && moderationQueue.length > 0 && <span className="nav-badge">{moderationQueue.length}</span>}
                  {t.id === "disputes"   && disputes.filter(d => d.status === "open").length > 0 && <span className="nav-badge">{disputes.filter(d => d.status === "open").length}</span>}
                  {t.id === "tickets"    && tickets.filter(t => t.status === "open").length > 0  && <span className="nav-badge">{tickets.filter(t => t.status === "open").length}</span>}
                  {tab === t.id && <FiChevronRight size={11} style={{ color: "var(--blue)", opacity: 0.6 }} />}
                </div>
              </button>
            ))}
            <div className="sidebar-footer">
              <div>{dateStr}</div>
              <div style={{ marginTop: 4, color: "var(--ink5)" }}>Admin console v2</div>
            </div>
          </nav>

          {/* ── MAIN ── */}
          <main className="main">

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div className="fade-up">
                {/* Apple-style hero header */}
                <div className="cmd-hdr">
                  <div>
                    <div className="cmd-eyebrow">
                      <FiActivity size={10} /> Platform Operations
                    </div>
                    {/* Apple.com headline: large, italic serif, letter-spaced tight */}
                    <div className="cmd-title">Admin Dashboard.</div>
                    <div className="cmd-subtitle">
                      Platform-wide analytics, moderation, and merchant governance.
                    </div>
                    <div className="cmd-date">{dateStr}</div>
                  </div>
                  <div className="cmd-actions">
                    <button className="btn btn-ghost" onClick={loadDashboard} style={{ fontSize: 9 }}>
                      <FiRefreshCw size={10} /> Refresh
                    </button>
                    <button className="btn btn-blue" onClick={trainRecommendations} disabled={training} style={{ fontSize: 9 }}>
                      <FiCpu size={10} />{training ? "Training…" : "Train AI Model"}
                    </button>
                  </div>
                </div>

                {/* Stat band */}
                <div className="stat-band">
                  {[
                    { label: "Platform Revenue", value: fmt(stats.platformRevenue), sub: "All time",         cls: "sc-rev" },
                    { label: "Active Vendors",   value: stats.activeVendors,         sub: "Verified merchants", cls: "sc-ven" },
                    { label: "Active Listings",  value: stats.activeListings,        sub: "Published units",    cls: "sc-list" },
                    { label: "Total Bookings",   value: stats.totalBookings,         sub: "Lifetime events",    cls: "sc-book" },
                  ].map((s, i) => (
                    <div key={i} className={`stat-cell ${s.cls}`}>
                      <div className="sc-label">{s.label}</div>
                      <div className="sc-value">{s.value}</div>
                      <div className="sc-sub">{s.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="content">
                  {/* Chart + aside */}
                  <div className="ov-grid">
                    <div className="chart-wrap">
                      <div className="chart-title">Category Intelligence</div>
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={270}>
                          <BarChart data={categoryData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false}
                              tick={{ fontSize: 9, fill: "var(--ink4)", fontFamily: "DM Mono", letterSpacing: "0.12em" }} />
                            <YAxis axisLine={false} tickLine={false}
                              tick={{ fontSize: 9, fill: "var(--ink4)", fontFamily: "DM Mono" }} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,102,204,0.04)" }} />
                            <Bar dataKey="bookings" fill="var(--blue)" radius={[2, 2, 0, 0]} barSize={32} opacity={0.85} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.28em", color: "var(--ink5)", textTransform: "uppercase" }}>
                          No category data
                        </div>
                      )}
                    </div>

                    <div className="ov-aside">
                      <div style={{ padding: "12px 24px 10px", borderBottom: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.25em", color: "var(--ink4)", textTransform: "uppercase" }}>
                        Platform Vitals
                      </div>
                      <div className="aside-kv">
                        <div className="aside-lbl">Top Category</div>
                        <div className="aside-val" style={{ textTransform: "capitalize" }}>{topCategory?.name || "—"}</div>
                        <div className="aside-sub">{topCategory ? fmt(topCategory.revenue) : "No data"}</div>
                      </div>
                      <div className="aside-kv">
                        <div className="aside-lbl">Listings / Vendor</div>
                        <div className="aside-val">{listingsPerVendor}</div>
                        <div className="aside-sub">Avg. fleet depth</div>
                      </div>
                      <div className="aside-kv">
                        <div className="aside-lbl">Revenue / Booking</div>
                        <div className="aside-val">{revenuePerBooking}</div>
                        <div className="aside-sub">Platform average</div>
                      </div>
                      <div className="health-bar">
                        <div className="health-lbl">
                          <span>Mod Queue</span>
                          <span style={{ color: "var(--amber)" }}>{moderationQueue.length} pending</span>
                        </div>
                        <div className="health-track">
                          <div className="health-fill hf-amber" style={{ width: `${Math.min(100, (moderationQueue.length / 10) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="health-bar">
                        <div className="health-lbl">
                          <span>KYC Backlog</span>
                          <span style={{ color: "var(--blue)" }}>{kycQueue.length} active</span>
                        </div>
                        <div className="health-track">
                          <div className="health-fill hf-blue" style={{ width: `${Math.min(100, (kycQueue.length / 5) * 100)}%` }} />
                        </div>
                      </div>
                      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)" }}>
                        <button className="train-btn" onClick={trainRecommendations} disabled={training}>
                          <FiCpu size={14} />{training ? "Refining AI models…" : "Sync Recommendation Engine"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Activity feeds */}
                  <div className="act-grid">
                    {[
                      {
                        label: "Recent Bookings", items: recentBookings,
                        render: b => (
                          <div key={b.id} className="act-item">
                            <div className="act-name">{b.equipment_name || `Booking #${b.id}`}</div>
                            <div className="act-meta">{b.renter_email || "—"}</div>
                            <div className="act-row">
                              <StatusTag status={b.status} />
                              <span className="act-amt">{fmt(b.total_price)}</span>
                            </div>
                          </div>
                        )
                      },
                      {
                        label: "Recent Payments", items: recentPayments,
                        render: p => (
                          <div key={p.id} className="act-item">
                            <div className="act-name">{p.booking_id ? `Booking #${p.booking_id}` : `Payment #${p.id}`}</div>
                            <div className="act-meta">{p.payment_intent_id || "—"}</div>
                            <div className="act-row">
                              <StatusTag status={p.status} />
                              <span className="act-amt">{fmt(p.amount)}</span>
                            </div>
                          </div>
                        )
                      },
                      {
                        label: "Recent Reviews", items: recentReviews,
                        render: r => (
                          <div key={r.id} className="act-item">
                            <div className="act-name">{r.equipment_name || "Equipment"}</div>
                            <div className="act-meta">{r.comment?.slice(0, 55) || "—"}</div>
                            <div className="act-row">
                              <span className="act-stars">{"★".repeat(Math.min(5, r.rating || 0))}</span>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink4)" }}>{r.reviewer_name || "Anon"}</span>
                            </div>
                          </div>
                        )
                      },
                    ].map((col, i) => (
                      <div key={i} className="act-col">
                        <div className="act-col-hdr">
                          <span>{col.label}</span>
                          <span className="act-count">{col.items.length}</span>
                        </div>
                        <div className="act-scroll">
                          {col.items.length === 0
                            ? <div className="act-empty">No data</div>
                            : col.items.map(col.render)
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── MODERATION ── */}
            {tab === "moderation" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Content Review</div>
                    <div className="sec-title">Moderation Queue</div>
                    <div className="sec-sub">Audit and approve equipment listings</div>
                  </div>
                  <span className="tag tag-amber">{moderationQueue.length} pending</span>
                </div>
                <div style={{ background: "var(--surface)", overflowX: "auto" }}>
                  <table className="dtbl">
                    <thead>
                      <tr>
                        <th>Asset Details</th><th>Merchant</th><th>Category</th>
                        <th>Unit Price</th><th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moderationQueue.length === 0
                        ? <tr><td colSpan="5" className="dtbl-empty">Queue clear — no items pending audit</td></tr>
                        : moderationQueue.map(item => (
                          <tr key={item.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 44, height: 44, background: "var(--surface2)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink5)" }}>
                                  <FiBox size={16} />
                                </div>
                                <div>
                                  <div className="dtbl-name">{item.name}</div>
                                  <div className="dtbl-sub">Ref · {item.id}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontFamily: "var(--serif)", fontSize: 14, fontStyle: "italic", color: "var(--ink2)" }}>{item.vendor_name}</td>
                            <td><StatusTag status={item.category} /></td>
                            <td style={{ fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic", color: "var(--ink)" }}>
                              {fmt(item.price_per_day)}<span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink4)", marginLeft: 4 }}>/day</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                <button className="btn btn-green" style={{ fontSize: 9, padding: "7px 14px" }} onClick={() => handleModerate(item.id, "approved")} disabled={processingId === item.id}>
                                  <FiCheckCircle size={10} /> Approve
                                </button>
                                <button className="btn btn-red" style={{ fontSize: 9, padding: "7px 14px" }} onClick={() => handleModerate(item.id, "rejected")} disabled={processingId === item.id}>
                                  <FiXCircle size={10} /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── KYC ── */}
            {tab === "kyc" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Compliance</div>
                    <div className="sec-title">KYC Audit</div>
                    <div className="sec-sub">Verify merchant identity and business credentials</div>
                  </div>
                  <span className="tag tag-blue">{kycQueue.length} submissions</span>
                </div>
                <div style={{ background: "var(--surface)", overflowX: "auto" }}>
                  <table className="dtbl">
                    <thead>
                      <tr><th>Identity</th><th>Doc Type</th><th>Asset</th><th style={{ textAlign: "right" }}>Decision</th></tr>
                    </thead>
                    <tbody>
                      {kycQueue.length === 0
                        ? <tr><td colSpan="4" className="dtbl-empty">KYC pipeline clear</td></tr>
                        : kycQueue.map(item => (
                          <tr key={item.id}>
                            <td>
                              <div className="dtbl-name">{item.vendor_name || "Verification Request"}</div>
                              <div className="dtbl-sub">Vendor · {item.vendor}</div>
                            </td>
                            <td>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", padding: "3px 9px", border: "1px solid var(--border)", color: "var(--ink3)", background: "var(--surface2)" }}>
                                {item.document_type}
                              </span>
                            </td>
                            <td>
                              <a href={item.document_url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 9, padding: "7px 13px", textDecoration: "none" }}>
                                <FiExternalLink size={10} /> Review Doc
                              </a>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                <button className="btn btn-green" style={{ fontSize: 9, padding: "7px 13px" }} onClick={() => handleKYC(item.id, "verified")} disabled={processingId === item.id}>Verify</button>
                                <button className="btn btn-red"   style={{ fontSize: 9, padding: "7px 13px" }} onClick={() => handleKYC(item.id, "rejected")} disabled={processingId === item.id}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── DISPUTES ── */}
            {tab === "disputes" && <DisputesView disputes={disputes} onAction={loadDisputes} />}

            {/* ── TICKETS ── */}
            {tab === "tickets" && <TicketsView tickets={tickets} onAction={loadTickets} />}

            {/* ── USERS ── */}
            {tab === "users" && (
              <div className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <div className="sec-eyebrow">Directory</div>
                    <div className="sec-title">User Control</div>
                    <div className="sec-sub">Platform-wide accounts and access management</div>
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink4)", letterSpacing: "0.1em" }}>{usersList.length} accounts</span>
                </div>
                <div style={{ background: "var(--surface)", overflowX: "auto" }}>
                  <table className="dtbl">
                    <thead>
                      <tr><th>User Profile</th><th>Trust Status</th><th>Plan Tier</th><th style={{ textAlign: "right" }}>Access</th></tr>
                    </thead>
                    <tbody>
                      {usersList.length === 0
                        ? <tr><td colSpan="4" className="dtbl-empty">No users found</td></tr>
                        : usersList.map(item => (
                          <tr key={item.id}>
                            <td>
                              <div className="dtbl-name">{item.company_name || "—"}</div>
                              <div className="dtbl-sub">{item.email}</div>
                            </td>
                            <td><StatusTag status={item.kyc_status} /></td>
                            <td>
                              <span className={`tag ${item.subscription_active ? "growth-chip" : "std-chip"}`}>
                                {item.subscription_active ? "Growth Plan" : "Standard"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button className="btn btn-red" style={{ fontSize: 9, padding: "7px 14px" }}>
                                Suspend
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}