import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import { bookingsAPI, paymentsAPI, usersAPI } from "../../api/axiosConfig";
import { FiCalendar, FiMapPin, FiCreditCard, FiCheckCircle } from "react-icons/fi";

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function StripePayForm({ clientSecret, onPaid }) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/buyer` },
        redirect: "if_required",
      });
      if (error) {
        toast.error(error.message || "Payment failed");
      } else {
        await paymentsAPI.confirmIntent(paymentIntent.id);
        toast.success("Order completed! Redirecting to your orders...");
        if (onPaid) onPaid();
        setTimeout(() => navigate("/buyer?tab=orders"), 1500);
      }
    } catch (err) {
      toast.error(err.message || "Payment confirmation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="p-3 bg-light rounded border mb-3">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="btn btn-dark w-100 py-2 d-flex justify-content-center align-items-center gap-2"
      >
        {submitting ? "Processing Securely..." : "Complete Payment"}
        {!submitting && <FiCheckCircle />}
      </button>
    </form>
  );
}

export default function BookingForm({ equipment, onBooked }) {
  const { isSignedIn } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [addressId, setAddressId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [booking, setBooking] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [creating, setCreating] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return 0;
    return Math.max(0, (e - s) / 86400000 + 1);
  }, [startDate, endDate]);

  const base = days * Number(equipment.price_per_day || 0);
  const discountPct = Math.min(Math.floor(days / 7) * 0.05, 0.25);
  const discountAmount = base * discountPct;
  const total = Math.max(base - discountAmount, 0);

  useEffect(() => {
    if (!isSignedIn) return;
    let mounted = true;
    async function loadAddresses() {
      try {
        const list = await usersAPI.addresses();
        if (!mounted) return;
        const normalized = Array.isArray(list) ? list : list?.results || [];
        setAddresses(normalized);
        const preferred = normalized.find((a) => a.is_default) || normalized[0];
        if (preferred) setAddressId(String(preferred.id));
      } catch {
        if (mounted) setAddresses([]);
      }
    }
    loadAddresses();
    return () => { mounted = false; };
  }, [isSignedIn]);

  const handleCreateBooking = async () => {
    if (!isSignedIn) return toast.error("Please sign in first.");
    if (!startDate || !endDate) return toast.error("Please select booking dates.");
    if (new Date(endDate) < new Date(startDate)) return toast.error("End date cannot be before start date.");
    if (!addressId && paymentMethod !== "pickup") return toast.error("Please select a delivery address.");

    setCreating(true);
    try {
      const selectedAddress = addresses.find((a) => String(a.id) === String(addressId));
      const created = await bookingsAPI.create({
        equipment_id: equipment.id,
        start_date: startDate,
        end_date: endDate,
        payment_method: paymentMethod,
        shipping_address: selectedAddress
          ? {
            full_name: selectedAddress.full_name,
            phone: selectedAddress.phone,
            line1: selectedAddress.line1,
            line2: selectedAddress.line2,
            city: selectedAddress.city,
            state: selectedAddress.state,
            postal_code: selectedAddress.postal_code,
            country: selectedAddress.country,
          }
          : {},
      });

      setBooking(created);

      if (paymentMethod === "stripe") {
        const intent = await paymentsAPI.createIntent(created.id);
        setClientSecret(intent.client_secret);
      } else {
        toast.success("Booking request placed successfully!");
        if (onBooked) onBooked(created);
      }
    } catch (err) {
      toast.error(err.message || "Booking failed.");
      setBooking(null);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {!booking && (
        <>
          {/* Dates Section */}
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <FiCalendar className="text-primary" />
              <h5 className="mb-0 fs-6">Rental Period</h5>
            </div>
            <div className="row g-2">
              <div className="col-6">
                <div className="form-floating border rounded">
                  <input
                    type="date"
                    id="startDate"
                    min={today}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && new Date(e.target.value) > new Date(endDate)) setEndDate("");
                    }}
                    className="form-control border-0"
                  />
                  <label htmlFor="startDate">Start Date</label>
                </div>
              </div>
              <div className="col-6">
                <div className="form-floating border rounded">
                  <input
                    type="date"
                    id="endDate"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-control border-0"
                  />
                  <label htmlFor="endDate">End Date</label>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          {days > 0 && (
            <div className="bg-light rounded p-3 border">
              <div className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between mb-2 small">
                  <span>₹{Number(equipment.price_per_day).toLocaleString("en-IN")} x {days} day{days !== 1 ? 's' : ''}</span>
                  <span className="fw-medium">₹{base.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between mb-2 small text-success">
                    <span>Long rental discount</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between small text-secondary">
                  <span>Platform fee</span>
                  <span>Free</span>
                </div>
              </div>
              <div className="d-flex justify-content-between fw-bold">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {/* Delivery Configuration */}
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <FiMapPin className="text-primary" />
              <h5 className="mb-0 fs-6">Delivery Details</h5>
            </div>

            {addresses.length > 0 ? (
              <select
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                className="form-select"
              >
                <option value="">Select delivery address...</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label || "Address"} - {a.line1}, {a.city}
                  </option>
                ))}
              </select>
            ) : (
              <div className="border rounded bg-light p-3 text-center">
                <p className="small text-secondary mb-2">No addresses found</p>
                <button
                  onClick={() => window.open("/buyer?tab=addresses", "_blank")}
                  className="btn btn-link btn-sm text-decoration-none"
                >
                  Add address in Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <FiCreditCard className="text-primary" />
              <h5 className="mb-0 fs-6">Payment Method</h5>
            </div>
            <div className="row g-2">
              <div className="col-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  className={`btn w-100 ${paymentMethod === "stripe" ? "btn-primary" : "btn-outline-secondary"}`}
                >
                  Card / NetBanking
                </button>
              </div>
              <div className="col-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`btn w-100 ${paymentMethod === "cod" ? "btn-primary" : "btn-outline-secondary"}`}
                >
                  Pay on Delivery
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateBooking}
            disabled={creating || days === 0}
            className="btn btn-dark w-100 py-2 mt-2"
          >
            {creating ? "Processing..." : "Continue to Book"}
          </button>
        </>
      )}

      {/* Stripe Payment Integration */}
      {paymentMethod === "stripe" && !stripeKey && (
        <div className="alert alert-danger p-2 small mb-0">
          Stripe is not configured. Please set <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> in your environment.
        </div>
      )}
      {clientSecret && paymentMethod === "stripe" && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePayForm
            clientSecret={clientSecret}
            onPaid={() => {
              if (onBooked) onBooked(booking);
            }}
          />
        </Elements>
      )}
    </div>
  );
}
