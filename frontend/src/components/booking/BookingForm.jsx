import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import { bookingsAPI, paymentsAPI, usersAPI } from "../../api/axiosConfig";
import { FiCalendar, FiMapPin, FiCreditCard, FiCheckCircle } from "react-icons/fi";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function StripePayForm({ clientSecret, onPaid }) {
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
        toast.success("Payment successful!");
        onPaid();
      }
    } catch (err) {
      toast.error(err.message || "Payment confirmation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 animate-fade-in">
      <div className="p-4 bg-[#f5f5f7] rounded-2xl border border-gray-200">
        <PaymentElement options={{
          layout: 'tabs',
          appearance: {
            theme: 'none',
            variables: {
              colorPrimary: '#0071e3',
              colorBackground: '#ffffff',
              colorText: '#1d1d1f',
              colorDanger: '#d70015',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              spacingUnit: '4px',
              borderRadius: '12px',
            }
          }
        }}
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="mt-4 w-full rounded-full bg-[#1d1d1f] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
    <div className="flex flex-col gap-6">
      {!booking && (
        <>
          {/* Dates Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FiCalendar className="text-[#0071e3]" />
              <h4 className="text-sm font-semibold text-[#1d1d1f]">Rental Period</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative border border-gray-200 rounded-xl bg-[#f5f5f7] focus-within:bg-white focus-within:border-[#0071e3] focus-within:ring-1 focus-within:ring-[#0071e3] transition-all">
                <label className="absolute top-1.5 left-3 text-[10px] font-semibold text-[#86868b] uppercase tracking-wide">Start</label>
                <input
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && new Date(e.target.value) > new Date(endDate)) setEndDate("");
                  }}
                  className="w-full h-12 bg-transparent border-none text-sm font-medium pt-4 px-3 focus:outline-none"
                />
              </div>
              <div className="relative border border-gray-200 rounded-xl bg-[#f5f5f7] focus-within:bg-white focus-within:border-[#0071e3] focus-within:ring-1 focus-within:ring-[#0071e3] transition-all">
                <label className="absolute top-1.5 left-3 text-[10px] font-semibold text-[#86868b] uppercase tracking-wide">End</label>
                <input
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-12 bg-transparent border-none text-sm font-medium pt-4 px-3 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          {days > 0 && (
            <div className="bg-[#f5f5f7] rounded-2xl p-4 animate-slide-up border border-gray-200/60">
              <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                <div className="flex justify-between text-sm text-[#1d1d1f]">
                  <span>₹{Number(equipment.price_per_day).toLocaleString("en-IN")} x {days} day{days !== 1 ? 's' : ''}</span>
                  <span className="font-medium">₹{base.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Long rental discount</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-[#86868b]">
                  <span>Platform fee</span>
                  <span>Free</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg text-[#1d1d1f]">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {/* Delivery Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FiMapPin className="text-[#0071e3]" />
              <h4 className="text-sm font-semibold text-[#1d1d1f]">Delivery Details</h4>
            </div>

            {addresses.length > 0 ? (
              <select
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#f5f5f7] px-4 py-3.5 text-sm font-medium text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0071e3] focus:border-[#0071e3] transition-all"
              >
                <option value="">Select delivery address...</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label || "Address"} - {a.line1}, {a.city}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-[#f5f5f7] p-4 text-center">
                <p className="text-sm text-[#86868b] mb-2">No addresses found</p>
                <button
                  onClick={() => window.open("/buyer?tab=addresses", "_blank")}
                  className="text-sm font-semibold text-[#0071e3] hover:underline"
                >
                  Add address in Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FiCreditCard className="text-[#0071e3]" />
              <h4 className="text-sm font-semibold text-[#1d1d1f]">Payment Method</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${paymentMethod === "stripe" ? "border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]" : "border-gray-200 bg-[#f5f5f7] text-[#1d1d1f] hover:bg-gray-100"}`}
              >
                Card / NetBanking
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${paymentMethod === "cod" ? "border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]" : "border-gray-200 bg-[#f5f5f7] text-[#1d1d1f] hover:bg-gray-100"}`}
              >
                Pay on Delivery
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateBooking}
            disabled={creating || days === 0}
            className="w-full rounded-full bg-[#0071e3] py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)] transition-all hover:bg-[#0077ed] hover:shadow-[0_4px_12px_rgba(0,113,227,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed mt-2"
          >
            {creating ? "Processing..." : "Continue to Book"}
          </button>
        </>
      )}

      {/* Stripe Payment Integration */}
      {clientSecret && paymentMethod === "stripe" && (
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
