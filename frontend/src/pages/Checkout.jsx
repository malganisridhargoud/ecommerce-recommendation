import React, { useState } from "react";
import { Link } from "react-router-dom";
import { paymentsAPI } from "../api/axiosConfig";
import toast from "react-hot-toast";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  .co-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .co-root {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    --white:   #ffffff;
    --black:   #1d1d1f;
    --gray-1:  #f5f5f7;
    --gray-2:  #e8e8ed;
    --gray-3:  #d2d2d7;
    --gray-4:  #86868b;
    --gray-5:  #6e6e73;
    --blue:    #0071e3;
    --blue-lt: #e8f0fd;
    --green:   #1d8348;
    --green-lt:#eaf6ee;
    --shadow-card: 0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04);
    --shadow-lg: 0 8px 32px rgba(0,0,0,.10), 0 0 0 1px rgba(0,0,0,.05);
    --radius: 18px;
    --radius-sm: 10px;
    --transition: 200ms cubic-bezier(.4,0,.2,1);
    min-height: 100vh;
    background: var(--gray-1);
    display: flex; align-items: center; justify-content: center;
    padding: 32px 16px;
  }

  /* ── Card ── */
  .co-card {
    width: 100%; max-width: 460px;
    background: var(--white);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    animation: co-rise .4s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes co-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  /* ── Hero band ── */
  .co-band {
    background: var(--black);
    padding: 32px 32px 28px;
    position: relative; overflow: hidden;
  }
  /* subtle grid texture */
  .co-band::before {
    content:''; position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 36px 36px; pointer-events: none;
  }
  /* blue radial glow */
  .co-band::after {
    content:''; position:absolute; top:-80px; right:-60px;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(0,113,227,.22) 0%, transparent 65%);
    pointer-events: none;
  }
  .co-band-inner { position:relative; z-index:1; }

  .co-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(0,113,227,.15);
    color: var(--blue);
    border: 1px solid rgba(0,113,227,.25);
    border-radius: 980px;
    font-size: 10.5px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    padding: 3px 10px; margin-bottom: 14px;
  }
  .co-badge-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--blue);
    animation: co-pulse 2s ease-in-out infinite;
  }
  @keyframes co-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

  .co-title {
    font-size: 22px; font-weight: 700; color: var(--white);
    letter-spacing: -.03em; line-height: 1.15; margin-bottom: 6px;
  }
  .co-sub { font-size: 13px; color: rgba(255,255,255,.45); line-height: 1.6; }

  /* Price row */
  .co-price-row {
    display: flex; align-items: flex-end; gap: 6px;
    margin-top: 22px; padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,.08);
  }
  .co-price {
    font-size: 32px; font-weight: 700; color: var(--white);
    letter-spacing: -.03em; line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .co-price-period { font-size: 13px; color: rgba(255,255,255,.4); padding-bottom: 4px; }

  /* ── Body ── */
  .co-body { padding: 24px 28px 28px; }

  /* Feature list */
  .co-features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }

  .co-feature {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 14px;
    background: var(--gray-1);
    border: 1px solid var(--gray-2);
    border-radius: var(--radius-sm);
    transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    animation: co-rise .4s cubic-bezier(.22,1,.36,1) both;
  }
  .co-feature:hover {
    border-color: var(--gray-3);
    box-shadow: 0 2px 10px rgba(0,0,0,.06);
    transform: translateY(-1px);
  }

  .co-feature-icon {
    width: 32px; height: 32px; flex-shrink: 0;
    border-radius: 8px;
    background: var(--blue-lt);
    border: 1px solid rgba(0,113,227,.18);
    display: flex; align-items: center; justify-content: center;
    color: var(--blue);
    margin-top: 1px;
  }
  .co-feature-title { font-size: 13.5px; font-weight: 600; color: var(--black); margin-bottom: 2px; }
  .co-feature-desc  { font-size: 12px; color: var(--gray-5); line-height: 1.5; }

  /* CTA */
  .co-cta {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 20px;
    border-radius: 980px;
    font-family: inherit; font-size: 15px; font-weight: 600;
    cursor: pointer; border: none;
    background: var(--blue); color: var(--white);
    box-shadow: 0 1px 4px rgba(0,113,227,.35), 0 4px 16px rgba(0,113,227,.2);
    transition: opacity var(--transition), transform var(--transition), box-shadow var(--transition);
    letter-spacing: -.01em;
  }
  .co-cta:hover:not(:disabled) {
    opacity: .88;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,113,227,.4), 0 8px 24px rgba(0,113,227,.25);
  }
  .co-cta:active { transform: scale(.98); }
  .co-cta:disabled { opacity: .45; cursor: not-allowed; }

  /* Spinner */
  .co-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
    border-radius: 50%; animation: co-spin .65s linear infinite; flex-shrink: 0;
  }
  @keyframes co-spin { to{transform:rotate(360deg)} }

  /* Stripe trust row */
  .co-trust {
    display: flex; align-items: center; justify-content: center; gap: 5px;
    margin-top: 10px;
    font-size: 11.5px; color: var(--gray-4);
  }

  /* Cancel link */
  .co-cancel {
    display: block; text-align: center;
    font-size: 12.5px; color: var(--gray-4);
    text-decoration: none; margin-top: 14px;
    transition: color var(--transition);
  }
  .co-cancel:hover { color: var(--gray-5); }

  /* Guarantee bar */
  .co-guarantee {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    margin-top: 16px; padding-top: 16px;
    border-top: 1px solid var(--gray-2);
    font-size: 11.5px; color: var(--gray-4);
  }
  .co-guarantee svg { color: #1d8348; flex-shrink: 0; }
`;

const FEATURES = [
  {
    title: "Unlimited Equipment Listings",
    desc:  "List and manage as many assets as your fleet requires — no caps.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    title: "Booking Management & Analytics",
    desc:  "Vendor dashboard with real-time booking operations and revenue insights.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    title: "ML-Powered Recommendation Engine",
    desc:  "Your listings surface to buyers via personalised TF-IDF + collaborative filtering.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
];

export default function Checkout() {
  const [loading, setLoading] = useState(false);

  const subscribeToVendor = async () => {
    setLoading(true);
    try {
      const data = await paymentsAPI.createCheckout();
      if (data?.url) window.location.href = data.url;
      else toast.error("Failed to initialize subscription checkout.");
    } catch (err) {
      toast.error(err.message || "Subscription failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="co-root">
        <div className="co-card">

          {/* Hero band */}
          <div className="co-band">
            <div className="co-band-inner">
              <div className="co-badge">
                <span className="co-badge-dot" />
                Vendor Plan
              </div>
              <h1 className="co-title">Activate your vendor account</h1>
              <p className="co-sub">Start listing equipment and earning on the TapRent marketplace.</p>
              <div className="co-price-row">
                <span className="co-price">₹999</span>
                <span className="co-price-period">/ month</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="co-body">
            <div className="co-features">
              {FEATURES.map((f, i) => (
                <div key={i} className="co-feature" style={{ animationDelay: `${80 + i * 55}ms` }}>
                  <div className="co-feature-icon">{f.icon}</div>
                  <div>
                    <div className="co-feature-title">{f.title}</div>
                    <div className="co-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="co-cta" onClick={subscribeToVendor} disabled={loading}>
              {loading ? (
                <><span className="co-spinner" /> Redirecting…</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Proceed to Checkout
                </>
              )}
            </button>

            <div className="co-trust">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Secured by Stripe · SSL encrypted
            </div>

            <Link to="/" className="co-cancel">← Cancel and return home</Link>

            <div className="co-guarantee">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Cancel anytime · No hidden fees · INR billing
            </div>
          </div>

        </div>
      </div>
    </>
  );
}