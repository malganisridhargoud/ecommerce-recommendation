import React, { useState } from "react";
import { Link } from "react-router-dom";
import { paymentsAPI } from "../api/axiosConfig";
import toast from "react-hot-toast";
import { FiLayers, FiActivity, FiLock, FiShield, FiCreditCard, FiArrowLeft } from "react-icons/fi";

const FEATURES = [
  {
    title: "Unlimited Equipment Listings",
    desc: "List and manage as many assets as your fleet requires — no caps.",
    icon: <FiLayers size={20} />
  },
  {
    title: "Booking Management & Analytics",
    desc: "Vendor dashboard with real-time booking operations and revenue insights.",
    icon: <FiActivity size={20} />
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: 460, width: "100%" }}>

        {/* Hero Banner */}
        <div className="bg-dark text-white p-4 p-md-5 position-relative overflow-hidden">
          {/* Subtle background glow effect using inline style for simplicity */}
          <div className="position-absolute rounded-circle" style={{ top: -100, right: -50, width: 300, height: 300, background: "radial-gradient(circle, rgba(13,110,253,0.3) 0%, transparent 60%)", pointerEvents: "none" }}></div>

          <div className="position-relative z-1">
            <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 mb-3 text-uppercase tracking-wider fw-bold d-inline-flex align-items-center gap-2">
              <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: 8, height: 8 }}></span>
              Vendor Plan
            </span>

            <h2 className="fw-bold mb-2 text-white fst-italic">Activate your vendor account</h2>
            <p className="text-white-50 mb-4" style={{ fontSize: "0.9rem" }}>Start listing equipment and earning on the TapRent marketplace.</p>

            <div className="d-flex align-items-end gap-2 pt-3 border-top border-white border-opacity-10">
              <span className="display-5 fw-bold text-white lh-1">₹999</span>
              <span className="text-white-50 pb-1">/ month</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="card-body p-4 p-md-5 bg-white">
          <div className="d-flex flex-column gap-3 mb-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="d-flex gap-3 p-3 bg-light border rounded-3 transition-all hover-shadow">
                <div className="bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                  {f.icon}
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-dark">{f.title}</h6>
                  <p className="text-muted small mb-0 lh-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary w-100 rounded-pill py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm mb-3"
            onClick={subscribeToVendor}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Redirecting…</>
            ) : (
              <><FiCreditCard size={18} /> Proceed to Checkout</>
            )}
          </button>

          <div className="d-flex align-items-center justify-content-center gap-2 text-muted small mb-4">
            <FiLock size={14} />
            <span>Secured by Stripe · SSL encrypted</span>
          </div>

          <div className="text-center">
            <Link to="/" className="text-muted text-decoration-none small d-inline-flex align-items-center gap-1 hover-text-primary transition-all">
              <FiArrowLeft size={14} /> Cancel and return home
            </Link>
          </div>

          <div className="d-flex align-items-center justify-content-center gap-2 text-muted small mt-4 pt-3 border-top">
            <FiShield size={14} className="text-success" />
            <span>Cancel anytime · No hidden fees · INR billing</span>
          </div>
        </div>
      </div>
    </div>
  );
}