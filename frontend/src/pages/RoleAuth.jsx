import React, { useState, useEffect, useCallback } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { usersAPI } from "../api/axiosConfig";
import toast from "react-hot-toast";
import { FiBriefcase, FiShoppingBag, FiInfo, FiCheckCircle } from "react-icons/fi";

const ROLE_LABELS = { buyer: "Buyer", vendor: "Vendor" };

const ROLE_META = {
  buyer: {
    icon: <FiShoppingBag size={24} />,
    desc: "Browse, book, and manage your equipment rentals.",
    colorClass: "text-primary",
    bgClass: "bg-primary bg-opacity-10",
    btnClass: "btn-primary",
    dest: "/buyer",
  },
  vendor: {
    icon: <FiBriefcase size={24} />,
    desc: "List equipment, manage bookings, and track revenue.",
    colorClass: "text-success",
    bgClass: "bg-success bg-opacity-10",
    btnClass: "btn-success",
    dest: "/vendor",
  },
};

export default function RoleAuth({ role }) {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasAutoRedirected, setHasAutoRedirected] = useState(false);

  const meta = ROLE_META[role] || ROLE_META.buyer;

  const onRoleSet = useCallback(async () => {
    try {
      setLoading(true);
      const payload = { role };
      await usersAPI.setRole(payload);
      toast.success(`${ROLE_LABELS[role]} role set successfully.`);
      window.location.href = meta.dest;
    } catch (err) {
      toast.error(err.message || "Failed to set role.");
    } finally {
      setLoading(false);
    }
  }, [role, meta.dest]);

  useEffect(() => {
    if (isSignedIn && !hasAutoRedirected) {
      setHasAutoRedirected(true);
      onRoleSet();
    }
  }, [isSignedIn, hasAutoRedirected, onRoleSet]);

  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-surface px-3 py-5">
      <div className="card-apple shadow-sm animate-slide-up w-100" style={{ maxWidth: '420px', padding: '0' }}>
        
        {/* Role Header */}
        <div className="p-4 border-bottom d-flex align-items-start gap-3">
          <div 
            className={`rounded-xl d-flex align-items-center justify-content-center flex-shrink-0 ${meta.bgClass} ${meta.colorClass}`}
            style={{ width: '48px', height: '48px' }}
          >
            {meta.icon}
          </div>
          <div>
            <div className="text-2xs fw-bold text-muted-custom text-uppercase tracking-widest mb-1">Portal Access</div>
            <h2 className="heading-title mb-1" style={{ fontSize: '20px' }}>{ROLE_LABELS[role]} Sign In</h2>
            <p className="text-sm text-muted-custom mb-0">{meta.desc}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 d-flex flex-column gap-4">
          
          {/* Auth status */}
          {isSignedIn ? (
            <div className="d-inline-flex align-items-center gap-2 text-xs fw-medium text-success bg-success bg-opacity-10 px-3 py-2 rounded-pill border border-success border-opacity-25 align-self-start">
              <span className="rounded-circle bg-success animate-pulse" style={{ width: '6px', height: '6px' }}></span>
              Signed in · ready to continue
            </div>
          ) : (
            <div className="d-inline-flex align-items-center gap-2 text-xs fw-medium text-muted-custom bg-surface px-3 py-2 rounded-pill border align-self-start">
              <FiInfo size={14} />
              Sign in or create an account first
            </div>
          )}

          {/* Sign in / Sign up pair */}
          {!isSignedIn && (
            <div className="row g-2">
              <div className="col-6">
                <SignInButton mode="modal" forceRedirectUrl={window.location.href}>
                  <button className="btn w-100 btn-dark fw-medium text-sm d-flex align-items-center justify-content-center py-2 rounded-lg">
                    Sign In
                  </button>
                </SignInButton>
              </div>
              <div className="col-6">
                <SignUpButton mode="modal" forceRedirectUrl={window.location.href}>
                  <button className="btn w-100 btn-outline-secondary fw-medium text-sm d-flex align-items-center justify-content-center py-2 rounded-lg bg-surface">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </div>
          )}

          {!isSignedIn && (
            <div className="d-flex align-items-center text-muted-custom text-xs text-uppercase tracking-widest my-2">
              <div className="flex-grow-1 border-top"></div>
              <span className="px-2">then continue</span>
              <div className="flex-grow-1 border-top"></div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onRoleSet}
            disabled={loading || !isSignedIn}
            className={`btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 py-2 rounded-lg transition-all ${isSignedIn ? meta.btnClass : 'btn-secondary opacity-50 text-white'}`}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Applying role...
              </>
            ) : isSignedIn ? (
              <>
                <FiCheckCircle size={16} />
                Continue as {ROLE_LABELS[role]}
              </>
            ) : (
              "Sign in above to continue"
            )}
          </button>

        </div>
      </div>
    </div>
  );
}