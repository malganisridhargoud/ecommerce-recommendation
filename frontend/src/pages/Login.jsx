import React from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiShoppingBag, FiLock } from "react-icons/fi";

const ROLE_CARDS = [
  {
    key: "buyer",
    title: "Buyer Portal",
    description: "Rent equipment and manage bookings securely.",
    to: "/login/buyer",
    icon: <FiShoppingBag size={24} />,
    colorClass: "text-primary",
    bgClass: "bg-primary bg-opacity-10"
  },
  {
    key: "vendor",
    title: "Vendor Portal",
    description: "List equipment, manage orders, and track revenue analytics.",
    to: "/login/vendor",
    icon: <FiBriefcase size={24} />,
    colorClass: "text-success",
    bgClass: "bg-success bg-opacity-10"
  },
];

export default function Login() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-surface px-3 py-5">
      <div className="text-center mb-5 mx-auto" style={{ maxWidth: '400px' }}>
        <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-4 hover-scale">
          <div 
            className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" 
            style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--brand), #00c7ff)', fontSize: '18px' }}
          >
            TR
          </div>
          <span className="fw-bold text-ink" style={{ fontSize: '24px', letterSpacing: '-0.5px' }}>
            <span className="text-brand">Tap</span>Rent
          </span>
        </Link>
        <h1 className="heading-title mb-2">Choose your portal</h1>
        <p className="text-muted-custom text-body">Choose and continue with the exact dashboard: Buyer or Vendor.</p>
      </div>

      <div className="row g-4 justify-content-center w-100" style={{ maxWidth: '720px' }}>
        {ROLE_CARDS.map((card, index) => (
          <div key={card.key} className="col-12 col-md-6 d-flex animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <Link 
              to={card.to} 
              className="card-apple text-decoration-none w-100 d-flex flex-column hover-lift border"
            >
              <div 
                className={`rounded-xl d-flex align-items-center justify-content-center mb-4 ${card.bgClass} ${card.colorClass}`}
                style={{ width: '56px', height: '56px' }}
              >
                {card.icon}
              </div>
              <h3 className="heading-subtitle mb-2 text-ink">{card.title}</h3>
              <p className="text-muted-custom flex-grow-1 text-sm mb-4">
                {card.description}
              </p>
              <div className="d-flex align-items-center text-brand fw-medium text-sm mt-auto transition-colors">
                Continue as {card.key.charAt(0).toUpperCase() + card.key.slice(1)}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ms-2 transition-transform hover-scale">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-5 d-flex align-items-center gap-2 text-muted-custom text-xs fw-medium animate-fade-in" style={{ animationDelay: '300ms' }}>
        <FiLock size={14} />
        All portals use Clerk authentication · End-to-end encrypted
      </div>
    </div>
  );
}
