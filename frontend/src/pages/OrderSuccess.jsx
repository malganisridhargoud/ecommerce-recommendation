import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiDownload, FiMessageSquare, FiPackage, FiTruck } from "react-icons/fi";
import { downloadInvoice, formatCurrency, formatDateTime, formatOrderCode } from "../lib/orderUtils";

function readOrderPayload(locationState) {
  if (locationState?.orderSuccess?.bookings?.length) return locationState.orderSuccess;
  try {
    const raw = sessionStorage.getItem("taprent_last_order");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const payload = useMemo(() => readOrderPayload(location.state), [location.state]);
  const bookings = payload?.bookings || [];
  const total = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
  const primaryBooking = bookings[0];

  if (!bookings.length) {
    return (
      <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
        <div className="card border-0 shadow-sm rounded-4 text-center p-5" style={{ maxWidth: 500 }}>
          <div className="mx-auto bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
            <FiPackage size={40} />
          </div>
          <h1 className="fw-bold mb-3 text-dark">No recent order found</h1>
          <p className="text-muted mb-4 pb-2">Place an order first or open your order history to review an existing booking.</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/buyer?tab=orders" className="btn btn-dark rounded-pill px-4 py-2 fw-medium">Go to Orders</Link>
            <Link to="/equipment" className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-medium">Browse Equipment</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 min-vh-100 d-flex flex-column gap-4">
      
      {/* Hero Section */}
      <div className="card bg-dark text-white border-0 shadow-lg rounded-4 overflow-hidden position-relative">
        <div className="card-body p-4 p-md-5 position-relative z-1" style={{ background: "radial-gradient(circle at top right, rgba(13,110,253,0.15), transparent 60%)" }}>
          
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25 mb-4">
            <FiCheckCircle size={16} className="text-primary" />
            <span className="small fw-bold text-uppercase tracking-wider text-white-50">Order Confirmed</span>
          </div>

          <div className="row g-5 align-items-start">
            <div className="col-12 col-lg-7">
              <h1 className="display-4 fw-bold mb-3 text-white fst-italic">Your rental order is locked in.</h1>
              <p className="lead text-white-50 mb-0" style={{maxWidth: 600}}>
                {bookings.length > 1
                  ? `${bookings.length} bookings were created successfully.`
                  : "Your booking was created successfully."} Keep this order reference handy for tracking, support, and vendor communication.
              </p>
            </div>
            
            <div className="col-12 col-lg-5">
              <div className="bg-white bg-opacity-10 border border-white border-opacity-10 rounded-4 p-4 backdrop-blur">
                <div className="text-white-50 small fw-bold text-uppercase tracking-wider mb-2">Primary order</div>
                <div className="fs-3 fw-light fst-italic mb-4">{formatOrderCode(primaryBooking.id)}</div>
                
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 pb-2">
                    <span className="text-white-50 small">Payment</span>
                    <span className="text-white fw-medium text-capitalize">{payload.paymentMethod === "cod" ? "Cash on delivery" : "Card checkout"}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 pb-2">
                    <span className="text-white-50 small">Total</span>
                    <span className="text-white fw-medium">{formatCurrency(total)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pb-1">
                    <span className="text-white-50 small">Placed</span>
                    <span className="text-white fw-medium">{formatDateTime(primaryBooking.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Grid */}
      <div className="row g-4">
        
        {/* Left Column: What Happens Now */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 p-md-5">
              
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-5">
                <div>
                  <p className="text-primary small fw-bold text-uppercase tracking-wider mb-2">Next Steps</p>
                  <h2 className="fw-bold mb-0 text-dark fst-italic">What happens now</h2>
                </div>
                <button
                  onClick={() => downloadInvoice(bookings, { title: `TapRent Invoice ${formatOrderCode(primaryBooking.id)}` })}
                  className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-medium d-flex align-items-center gap-2"
                >
                  <FiDownload />
                  Download Invoice
                </button>
              </div>

              <div className="d-flex flex-column gap-4">
                {[
                  {
                    icon: FiCheckCircle,
                    title: "Order accepted",
                    body: "Your payment and rental request are recorded. The order now appears in your dashboard order ledger.",
                  },
                  {
                    icon: FiTruck,
                    title: "Vendor and logistics updates",
                    body: "You will see shipping or handoff progress under order tracking once the vendor updates the booking status.",
                  },
                  {
                    icon: FiMessageSquare,
                    title: "Need changes or support?",
                    body: "Use messages to coordinate pickup, delivery notes, or documentation directly with the vendor.",
                  },
                ].map((step) => (
                  <div key={step.title} className="d-flex gap-4 p-4 bg-light rounded-4 border">
                    <div className="bg-white text-primary border rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{width: 56, height: 56}}>
                      <step.icon size={24} />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark fst-italic mb-2">{step.title}</h5>
                      <p className="text-muted mb-0">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Actions */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">
          
          {/* Timeline Card */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 p-md-5">
              <p className="text-primary small fw-bold text-uppercase tracking-wider mb-2">Tracking Snapshot</p>
              <h3 className="fw-bold text-dark fst-italic mb-4">Order timeline</h3>
              
              <div className="d-flex flex-column gap-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-light p-4 rounded-4 border">
                    <div className="d-flex justify-content-between align-items-start mb-3 gap-3 flex-wrap">
                      <div>
                        <div className="fw-bold text-dark fst-italic fs-5 mb-1">{booking.equipment_detail?.name || "Equipment"}</div>
                        <div className="small text-muted font-monospace">{formatOrderCode(booking.id)}</div>
                      </div>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill text-uppercase tracking-wider">
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="d-flex flex-column gap-2 mt-3 pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Placed</span>
                        <span className="fw-medium text-dark small">{formatDateTime(booking.created_at)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Rental starts</span>
                        <span className="fw-medium text-dark small">{booking.start_date}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Rental ends</span>
                        <span className="fw-medium text-dark small">{booking.end_date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 p-md-5">
              <p className="text-primary small fw-bold text-uppercase tracking-wider mb-2">Actions</p>
              <h3 className="fw-bold text-dark fst-italic mb-4">Keep moving</h3>
              
              <div className="d-flex flex-column gap-3">
                <button onClick={() => navigate("/buyer?tab=orders")} className="btn btn-dark rounded-pill py-3 fw-bold d-flex align-items-center justify-content-between px-4 shadow-sm">
                  View Orders <FiArrowRight size={20} />
                </button>
                <button onClick={() => navigate("/buyer?tab=chat")} className="btn btn-outline-secondary rounded-pill py-3 fw-bold d-flex align-items-center justify-content-between px-4 bg-light shadow-sm">
                  Contact Vendor <FiMessageSquare size={20} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
