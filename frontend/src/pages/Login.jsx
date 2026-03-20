import React from "react";
import { Link } from "react-router-dom";

const ROLE_CARDS = [
  {
    key: "buyer",
    title: "Buyer Portal",
    description: "Rent equipment, manage bookings, and get personalised recommendations.",
    to: "/login/buyer",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    accent: "#f97316",
    accentLight: "#fff7ed",
    accentBorder: "#fed7aa",
  },
  {
    key: "vendor",
    title: "Vendor Portal",
    description: "List equipment, manage orders, and track revenue analytics.",
    to: "/login/vendor",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    accent: "#3b82f6",
    accentLight: "#eff6ff",
    accentBorder: "#bfdbfe",
  },
  {
    key: "admin",
    title: "Admin Portal",
    description: "Monitor platform metrics, users, listings, and recommendation training.",
    to: "/login/admin",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    accent: "#8b5cf6",
    accentLight: "#f5f3ff",
    accentBorder: "#ddd6fe",
  },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

  .lg-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .lg-root {
    font-family: 'DM Sans', sans-serif;
    --ink: #0f1117;
    --ink-muted: #6b7280;
    --ink-subtle: #9ca3af;
    --surface: #ffffff;
    --surface-2: #f8f9fb;
    --border: #e5e7eb;
    --border-strong: #d1d5db;
    --radius: 16px;
    --radius-sm: 9px;
    --transition: 230ms cubic-bezier(.4,0,.2,1);
    min-height: 100vh;
    background: var(--surface-2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
  }

  /* ── Header ── */
  .lg-header { text-align: center; margin-bottom: 40px; }
  .lg-logo {
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none; margin-bottom: 28px;
  }
  .lg-logo-mark {
    width: 38px; height: 38px; border-radius: 10px;
    background: #0f1117; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700;
  }
  .lg-logo-name {
    font-size: 17px; font-weight: 700;
    color: var(--ink); letter-spacing: -.02em;
  }
  .lg-logo-name span { color: #f97316; }
  .lg-title {
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 700; color: var(--ink);
    letter-spacing: -.03em; line-height: 1.15;
    margin-bottom: 10px;
  }
  .lg-sub {
    font-size: 14px; color: var(--ink-muted); line-height: 1.6;
    max-width: 400px; margin: 0 auto;
  }

  /* ── Grid ── */
  .lg-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    width: 100%;
    max-width: 860px;
  }
  @media (max-width: 768px) { .lg-grid { grid-template-columns: 1fr; max-width: 400px; } }

  /* ── Card ── */
  .lg-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.04);
    animation: lg-rise .4s cubic-bezier(.22,1,.36,1) both;
    text-decoration: none;
  }
  .lg-card:hover {
    border-color: var(--border-strong);
    box-shadow: 0 4px 8px rgba(0,0,0,.06), 0 16px 36px rgba(0,0,0,.09);
    transform: translateY(-3px);
  }
  .lg-card:active { transform: translateY(-1px); }

  @keyframes lg-rise {
    from { opacity:0; transform: translateY(12px); }
    to   { opacity:1; transform: translateY(0); }
  }

  /* Accent top bar */
  .lg-card-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    border-radius: var(--radius) var(--radius) 0 0;
    transform: scaleX(0); transform-origin: left;
    transition: transform var(--transition);
  }
  .lg-card:hover .lg-card-bar { transform: scaleX(1); }

  /* Icon */
  .lg-icon-wrap {
    width: 44px; height: 44px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px; flex-shrink: 0;
    border: 1px solid transparent;
    transition: transform var(--transition);
  }
  .lg-card:hover .lg-icon-wrap { transform: scale(1.06); }

  .lg-card-title {
    font-size: 15.5px; font-weight: 700;
    color: var(--ink); letter-spacing: -.02em;
    margin-bottom: 7px;
  }
  .lg-card-desc {
    font-size: 13px; color: var(--ink-muted);
    line-height: 1.6; flex: 1;
  }

  /* CTA row */
  .lg-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 20px; padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .lg-card-cta {
    font-size: 12.5px; font-weight: 600;
    color: var(--ink-muted);
    display: flex; align-items: center; gap: 5px;
    transition: color var(--transition), gap var(--transition);
  }
  .lg-card:hover .lg-card-cta { color: var(--ink); gap: 8px; }

  .lg-card-arrow {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--surface-2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--ink-muted);
    transition: background var(--transition), color var(--transition), border-color var(--transition), transform var(--transition);
    flex-shrink: 0;
  }
  .lg-card:hover .lg-card-arrow {
    background: var(--ink); color: #fff; border-color: var(--ink);
    transform: translate(2px, -2px);
  }

  /* ── Footer note ── */
  .lg-footer {
    margin-top: 32px;
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--ink-subtle);
  }
`;

export default function Login() {
  return (
    <>
      <style>{styles}</style>
      <div className="lg-root">

        {/* Header */}
        <header className="lg-header">
          <Link to="/" className="lg-logo">
            <div className="lg-logo-mark">R</div>
            <span className="lg-logo-name">Rent<span>Hub</span></span>
          </Link>
          <h1 className="lg-title">Choose your portal</h1>
          <p className="lg-sub">Choose and continue with the exact dashboard: Buyer, Vendor, or Admin.</p>
        </header>

        {/* Cards */}
        <section className="lg-grid">
          {ROLE_CARDS.map((card, i) => (
            <Link
              key={card.key}
              to={card.to}
              className="lg-card"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {/* Accent bar */}
              <div className="lg-card-bar" style={{ background: card.accent }} />

              {/* Icon */}
              <div
                className="lg-icon-wrap"
                style={{
                  background: card.accentLight,
                  borderColor: card.accentBorder,
                  color: card.accent,
                }}
              >
                {card.icon}
              </div>

              <div className="lg-card-title">{card.title}</div>
              <div className="lg-card-desc">{card.description}</div>

              <div className="lg-card-footer">
                <span className="lg-card-cta">
                  Continue as {card.key.charAt(0).toUpperCase() + card.key.slice(1)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
                <div className="lg-card-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Footer */}
        <div className="lg-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          All portals use Clerk authentication · End-to-end encrypted
        </div>

      </div>
    </>
  );
}
