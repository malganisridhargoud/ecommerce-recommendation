import React from "react";

const paragraphs = [
  "One of the hardest problems we solved in TapRent was booking conflict detection. Equipment rentals look simple until the same excavator, camera body, or speaker rig is requested by multiple buyers at nearly the same time. If the platform allows even one overlapping booking through, trust collapses fast. Vendors lose confidence in availability, buyers pay for inventory that does not exist, and support teams are forced into manual damage control.",
  "We decided early that conflict detection had to live on the server, not in the UI. Frontend calendars are helpful for guidance, but they are never authoritative because two customers can click checkout seconds apart. Our booking service now validates every request against confirmed, active, shipped, delivered, and completed reservations before a booking is created. We treat the requested rental window as an interval and reject any record whose dates overlap the requested start and end dates.",
  "The tricky part was quantity-aware inventory. A listing can represent more than one unit, so we could not simply block every overlapping date range. Instead, we aggregate overlapping bookings and compare the reserved count against the equipment quantity. That allowed us to support legitimate concurrency while still rejecting the exact moment inventory would be oversold. We also kept the logic inside a dedicated service layer so the same validation path is reused by direct checkout and cart checkout flows.",
  "Pricing and payment introduced another wrinkle. Stripe intents and COD flows can both create temporary states where a booking exists but is not yet fully complete. We chose explicit statuses for pending, confirmed, active, shipped, delivered, completed, and cancelled so availability math could stay predictable. Cancelled bookings immediately free capacity, while active operational statuses continue to reserve inventory until the rental lifecycle is done.",
  "The final improvement was making conflict handling feel intentional to users. Instead of generic errors, the API returns a clear conflict response and the vendor dashboard receives realtime booking updates over WebSockets. That means the system is not only safer under concurrent load, it is easier to operate. The result is a booking engine that behaves more like infrastructure than a form submission, which is exactly what a rental marketplace needs when real money and real inventory are involved.",
];

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#f7f4ee] px-4 pb-20 pt-28 text-[#231f20] md:px-8">
      <article className="mx-auto max-w-[860px] rounded-[36px] bg-white p-8 shadow-[0_24px_80px_rgba(42,31,20,0.08)] md:p-12">
        <p className="text-[12px] font-bold uppercase tracking-[0.32em] text-[#0b6e93]">Engineering Blog</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl">How we solved booking conflict detection in a rental marketplace</h1>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.26em] text-[#907d6a]">Approx. 500 words</p>
        <div className="mt-10 space-y-6 text-[17px] leading-9 text-[#433930]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
