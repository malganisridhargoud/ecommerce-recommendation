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
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-[32px] border border-gray-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#eef5ff] text-[#0071e3] flex items-center justify-center mb-5">
            <FiPackage className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mb-3">No recent order found</h1>
          <p className="text-[#6e6e73] leading-relaxed mb-6">Place an order first or open your order history to review an existing booking.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/buyer?tab=orders" className="px-5 py-3 rounded-full bg-[#1d1d1f] text-white font-medium">Go to Orders</Link>
            <Link to="/equipment" className="px-5 py-3 rounded-full border border-gray-200 text-[#1d1d1f] font-medium">Browse Equipment</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-10 md:py-14 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="bg-[#111827] text-white rounded-[36px] overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div className="p-8 md:p-12 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.28),transparent_35%)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/75 mb-6">
              <FiCheckCircle className="w-4 h-4 text-[#93c5fd]" />
              Order Confirmed
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">Your rental order is locked in.</h1>
                <p className="text-white/70 text-[15px] leading-relaxed max-w-2xl">
                  {bookings.length > 1
                    ? `${bookings.length} bookings were created successfully.`
                    : "Your booking was created successfully."} Keep this order reference handy for tracking, support, and vendor communication.
                </p>
              </div>
              <div className="bg-white/8 border border-white/10 rounded-[28px] p-5 md:p-6 backdrop-blur-xl">
                <div className="text-[11px] tracking-[0.18em] uppercase text-white/50 font-semibold mb-2">Primary order</div>
                <div className="text-2xl font-bold tracking-tight">{formatOrderCode(primaryBooking.id)}</div>
                <div className="mt-4 space-y-2 text-sm text-white/70">
                  <div className="flex justify-between gap-4">
                    <span>Payment</span>
                    <span className="text-white capitalize">{payload.paymentMethod === "cod" ? "Cash on delivery" : "Card checkout"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Total</span>
                    <span className="text-white">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Placed</span>
                    <span className="text-white">{formatDateTime(primaryBooking.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-7 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold mb-2">Next Steps</p>
                <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">What happens now</h2>
              </div>
              <button
                onClick={() => downloadInvoice(bookings, { title: `TapRent Invoice ${formatOrderCode(primaryBooking.id)}` })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 hover:border-gray-300 text-sm font-semibold text-[#1d1d1f]"
              >
                <FiDownload className="w-4 h-4" />
                Download Invoice
              </button>
            </div>

            <div className="space-y-4">
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
                <div key={step.title} className="rounded-[24px] bg-[#f8fafc] border border-gray-100 p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-[#0071e3] shrink-0">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1d1d1f] mb-1">{step.title}</h3>
                    <p className="text-sm text-[#6e6e73] leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-7">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold mb-2">Tracking Snapshot</p>
              <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-5">Order timeline</h2>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-[24px] bg-[#f5f5f7] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-[#1d1d1f]">{booking.equipment_detail?.name || "Equipment"}</div>
                        <div className="text-xs text-[#6e6e73] mt-1">{formatOrderCode(booking.id)}</div>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#16a34a] font-semibold">{booking.status}</span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[#4b5563]">
                      <div className="flex justify-between gap-4">
                        <span>Placed</span>
                        <span>{formatDateTime(booking.created_at)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Rental starts</span>
                        <span>{booking.start_date}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Rental ends</span>
                        <span>{booking.end_date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-7">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold mb-2">Actions</p>
              <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-5">Keep moving</h2>
              <div className="grid gap-3">
                <button
                  onClick={() => navigate("/buyer?tab=orders")}
                  className="w-full inline-flex items-center justify-between px-5 py-4 rounded-[22px] bg-[#1d1d1f] text-white font-semibold"
                >
                  View Orders
                  <FiArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate("/buyer?tab=chat")}
                  className="w-full inline-flex items-center justify-between px-5 py-4 rounded-[22px] border border-gray-200 text-[#1d1d1f] font-semibold"
                >
                  Contact Vendor
                  <FiMessageSquare className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
