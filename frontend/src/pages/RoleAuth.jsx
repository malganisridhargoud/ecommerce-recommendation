import React, { useState } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { usersAPI } from "../api/axiosConfig";
import toast from "react-hot-toast";

const ROLE_LABELS = { buyer: "Buyer", vendor: "Vendor", admin: "Admin" };

const ROLE_META = {
  buyer: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
    desc: "Browse, book, and manage your equipment rentals.",
    color: "var(--blue)",
    colorLight: "var(--blue-light)",
    colorBorder: "var(--blue-border)",
    dest: "/buyer",
  },
  vendor: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
    desc: "List equipment, manage bookings, and track revenue.",
    color: "var(--accent)",
    colorLight: "var(--accent-light)",
    colorBorder: "var(--accent-border)",
    dest: "/vendor",
  },
  admin: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    desc: "Full platform oversight, analytics, and control.",
    color: "var(--ink)",
    colorLight: "var(--surface-3)",
    colorBorder: "var(--border-strong)",
    dest: "/admin",
  },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

  .ra-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .ra-root {
    font-family: 'DM Sans', sans-serif;
    --ink: #0f1117;
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
    --blue: #3b82f6;
    --blue-light: #eff6ff;
    --blue-border: #bfdbfe;
    --red: #e11d48;
    --radius: 14px;
    --radius-sm: 9px;
    --transition: 220ms cubic-bezier(.4,0,.2,1);
    min-height: 100vh;
    background: var(--surface-2);
    display: flex; align-items: center; justify-content: center;
    padding: 32px 16px;
    position: relative;
    overflow: hidden;
  }

  /* Background texture */
  .ra-root::before {
    content:'';
    position:absolute; inset:0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 48px 48px;
    opacity: .5;
    pointer-events: none;
  }

  /* ── Card ── */
  .ra-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 420px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: 0 4px 8px rgba(0,0,0,.04), 0 20px 48px rgba(0,0,0,.08);
    overflow: hidden;
    animation: ra-rise .45s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes ra-rise { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  /* ── Role cap ── */
  .ra-cap {
    padding: 26px 28px 22px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: flex-start; gap: 14px;
  }
  .ra-cap-icon {
    width: 48px; height: 48px; flex-shrink: 0;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid;
  }
  .ra-cap-text {}
  .ra-cap-label {
    font-size: 11px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--ink-subtle); margin-bottom: 4px;
  }
  .ra-cap-title {
    font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -.025em; line-height: 1.2;
    margin-bottom: 4px;
  }
  .ra-cap-desc {
    font-size: 12.5px; color: var(--ink-muted); line-height: 1.5;
  }

  /* ── Body ── */
  .ra-body { padding: 22px 28px 26px; display: flex; flex-direction: column; gap: 10px; }

  /* Auth buttons */
  .ra-auth-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  .ra-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-family: inherit; font-size: 13px; font-weight: 500;
    cursor: pointer; width: 100%; border: none;
    transition: transform var(--transition), box-shadow var(--transition), opacity var(--transition), background var(--transition), border-color var(--transition);
    white-space: nowrap;
  }
  .ra-btn:active { transform: scale(.97); }

  .ra-btn-solid {
    background: var(--ink); color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.09);
  }
  .ra-btn-solid:hover { opacity:.88; transform:translateY(-1px); box-shadow:0 2px 6px rgba(0,0,0,.14),0 10px 22px rgba(0,0,0,.12); }

  .ra-btn-outline {
    background: transparent; color: var(--ink-muted);
    border: 1.5px solid var(--border);
  }
  .ra-btn-outline:hover { color:var(--ink); border-color:var(--border-strong); background:var(--surface-2); }

  /* Divider */
  .ra-divider {
    display: flex; align-items: center; gap: 10px;
    font-size: 11px; color: var(--ink-subtle);
    letter-spacing: .05em; text-transform: uppercase;
  }
  .ra-divider::before, .ra-divider::after {
    content:''; flex:1; height:1px; background:var(--border);
  }

  /* Admin invite */
  .ra-field { display: flex; flex-direction: column; gap: 5px; }
  .ra-field-label {
    font-size: 11.5px; font-weight: 600;
    letter-spacing: .05em; text-transform: uppercase;
    color: var(--ink-muted);
  }
  .ra-field-wrap {
    position: relative; display: flex; align-items: center;
  }
  .ra-field-icon {
    position: absolute; left: 11px;
    color: var(--ink-subtle); pointer-events: none;
  }
  .ra-input {
    width: 100%; appearance: none;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    padding: 10px 12px 10px 34px;
    font-family: inherit; font-size: 13.5px; color: var(--ink);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
  }
  .ra-input:focus { border-color:var(--ink); background:var(--surface); box-shadow:0 0 0 3px rgba(15,17,23,.06); }
  .ra-input::placeholder { color:var(--ink-subtle); }

  .ra-admin-notice {
    display: flex; gap: 8px; align-items: flex-start;
    background: #fff7ed;
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    font-size: 12px; color: #9a3412; line-height: 1.5;
  }
  .ra-admin-notice svg { flex-shrink:0; margin-top:1px; }

  /* Continue CTA */
  .ra-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 20px;
    border-radius: var(--radius-sm);
    font-family: inherit; font-size: 14px; font-weight: 600;
    cursor: pointer; border: none; width: 100%;
    transition: transform var(--transition), box-shadow var(--transition), opacity var(--transition);
    letter-spacing: -.01em;
    position: relative; overflow: hidden;
  }
  .ra-cta::after { content:''; position:absolute; inset:0; background:rgba(255,255,255,0); transition:background .15s; }
  .ra-cta:hover:not(:disabled)::after { background:rgba(255,255,255,.08); }
  .ra-cta:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,.15); }
  .ra-cta:active { transform:scale(.985); }
  .ra-cta:disabled { opacity:.4; cursor:not-allowed; }

  /* Spinner */
  .ra-spinner {
    width:14px; height:14px;
    border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
    border-radius:50%; animation:ra-spin .65s linear infinite; flex-shrink:0;
  }
  @keyframes ra-spin { to{transform:rotate(360deg)} }

  /* Signed-in indicator */
  .ra-signed-in {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--green);
    background: var(--green-light);
    border: 1px solid var(--green-border);
    border-radius: 20px; padding: 4px 10px;
    font-weight: 500; align-self: flex-start;
  }
  .ra-signed-in-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:ra-gpulse 2s ease-in-out infinite; }
  @keyframes ra-gpulse { 0%,100%{opacity:1} 50%{opacity:.4} }

  .ra-not-signed-in {
    display:flex; align-items:center; gap:6px;
    font-size:12px; color:var(--ink-subtle);
    background:var(--surface-3); border:1px solid var(--border);
    border-radius:20px; padding:4px 10px;
    align-self:flex-start;
  }
`;

export default function RoleAuth({ role }) {
  const { isSignedIn } = useAuth();
  const [loading, setLoading]             = useState(false);
  const [adminInviteCode, setAdminInviteCode] = useState("");
  const [showCode, setShowCode]           = useState(false);

  const meta = ROLE_META[role] || ROLE_META.buyer;

  const onRoleSet = async () => {
    if (role === "admin" && !adminInviteCode.trim()) {
      toast.error("Admin invite code is required.");
      return;
    }
    setLoading(true);
    try {
      const payload = { role };
      if (role === "admin") payload.admin_invite_code = adminInviteCode.trim();
      await usersAPI.setRole(payload);
      toast.success(`${ROLE_LABELS[role]} role set successfully.`);
      window.location.href = meta.dest;
    } catch (err) {
      toast.error(err.message || "Failed to set role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ra-root">
        <div className="ra-card">

          {/* Role cap */}
          <div className="ra-cap">
            <div
              className="ra-cap-icon"
              style={{ background: meta.colorLight, borderColor: meta.colorBorder, color: meta.color }}
            >
              {meta.icon}
            </div>
            <div className="ra-cap-text">
              <div className="ra-cap-label">Portal Access</div>
              <div className="ra-cap-title">{ROLE_LABELS[role]} Sign In</div>
              <div className="ra-cap-desc">{meta.desc}</div>
            </div>
          </div>

          {/* Body */}
          <div className="ra-body">

            {/* Auth status */}
            {isSignedIn ? (
              <div className="ra-signed-in">
                <span className="ra-signed-in-dot" />
                Signed in · ready to continue
              </div>
            ) : (
              <div className="ra-not-signed-in">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Sign in or create an account first
              </div>
            )}

            {/* Sign in / Sign up pair */}
            <div className="ra-auth-pair">
              <SignInButton mode="modal">
                <button className="ra-btn ra-btn-solid">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="ra-btn ra-btn-outline">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Sign Up
                </button>
              </SignUpButton>
            </div>

            {/* Admin invite code */}
            {role === "admin" && (
              <>
                <div className="ra-divider">Admin only</div>

                <div className="ra-admin-notice">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Admin access requires a valid invite code issued by the platform owner.
                </div>

                <div className="ra-field">
                  <label className="ra-field-label">Invite Code</label>
                  <div className="ra-field-wrap">
                    <span className="ra-field-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </span>
                    <input
                      type={showCode ? "text" : "password"}
                      value={adminInviteCode}
                      onChange={e => setAdminInviteCode(e.target.value)}
                      placeholder="••••••••••••"
                      className="ra-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCode(v => !v)}
                      style={{ position:"absolute", right:10, background:"none", border:"none", cursor:"pointer", color:"var(--ink-subtle)", display:"flex", alignItems:"center", padding:2 }}
                    >
                      {showCode
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="ra-divider">then continue</div>

            {/* CTA */}
            <button
              className="ra-cta"
              onClick={onRoleSet}
              disabled={loading || !isSignedIn}
              style={{
                background: isSignedIn ? meta.color : "var(--border-strong)",
                color: "#fff",
                boxShadow: isSignedIn ? `0 1px 3px rgba(0,0,0,.14), 0 6px 18px rgba(0,0,0,.1)` : "none",
              }}
            >
              {loading
                ? <><span className="ra-spinner" /> Applying role…</>
                : isSignedIn
                  ? <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Continue as {ROLE_LABELS[role]}
                    </>
                  : "Sign in above to continue"
              }
            </button>

          </div>
        </div>
      </div>
    </>
  );
}