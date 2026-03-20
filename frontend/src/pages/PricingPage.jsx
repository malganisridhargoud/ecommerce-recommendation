import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiZap } from "react-icons/fi";

const plans = [
  {
    name: "Starter Vendor",
    price: "Rs. 2,999",
    cadence: "/month",
    accent: "bg-[#fff3d0] border-[#efd488]",
    cta: "Best for solo rental operators",
    features: [
      "Publish up to 25 active listings",
      "Subscription-gated listing enforcement",
      "Basic order management and messaging",
      "Realtime booking event feed",
    ],
  },
  {
    name: "Growth Marketplace",
    price: "Rs. 8,999",
    cadence: "/month",
    accent: "bg-[#0f2337] border-[#214a73] text-white",
    cta: "Best for scaling vendor teams",
    features: [
      "Unlimited active listings",
      "Advanced analytics and top revenue tracking",
      "Priority support for payment and dispute ops",
      "Branded onboarding and pricing support",
    ],
  },
  {
    name: "Platform Plus",
    price: "Custom",
    cadence: "",
    accent: "bg-[#eef7ff] border-[#b4d5ef]",
    cta: "Best for multi-region operators",
    features: [
      "White-label rollout assistance",
      "Redis-backed production realtime stack",
      "Custom SLA and admin reporting",
      "Migration help from legacy rental tools",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#231f20]">
      <section className="bg-[#102131] px-4 pb-20 pt-28 text-white md:px-8">
        <div className="mx-auto max-w-[1180px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/7 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#99d0ff]">
            <FiZap className="w-4 h-4" />
            Pricing built for SaaS monetization
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">Charge vendors for the right to publish, not just to sign up.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">TapRent now enforces active subscriptions all the way through the backend. If a vendor churns, listings are automatically unpublished and new inventory creation locks immediately.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`rounded-[32px] border p-8 shadow-[0_20px_60px_rgba(42,31,20,0.08)] ${plan.accent}`}>
              <div className="text-[12px] font-bold uppercase tracking-[0.28em] text-[#8b6734]">{plan.cta}</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight">{plan.name}</h2>
              <div className="mt-6 flex items-end gap-2">
                <div className="text-5xl font-black">{plan.price}</div>
                <div className="pb-2 text-sm font-medium opacity-75">{plan.cadence}</div>
              </div>
              <div className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-7">
                    <FiCheckCircle className="mt-1 h-5 w-5 shrink-0 text-[#0c8b55]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/login/vendor" className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#1e1a17] px-5 py-3 text-sm font-bold text-white transition hover:bg-black">
                Start vendor onboarding
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pb-20 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] bg-white p-8 shadow-[0_20px_60px_rgba(42,31,20,0.08)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-[#0b6e93]">What changed in the app</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-[#1f1a16]">Monetization now has teeth.</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#5d5248]">
              <p>Listing creation, publishing, sample seeding, and public marketplace visibility now depend on a live vendor subscription state. This closes the gap between demo-only gating and real SaaS enforcement.</p>
              <p>Booking operations also gained realtime fan-out with Django Channels, so vendors can react to confirms, cancellations, and delivery progress without waiting for polling refreshes.</p>
              <p>The product site has been reshaped to support conversion too, with screenshot-led storytelling, clear pricing tiers, and a technical blog post that shows engineering depth.</p>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#d9cbb5] bg-[#fbf7ef] p-8">
            <img src="/marketing-shot.svg" alt="Pricing and marketing screenshot" className="w-full rounded-[24px] border border-[#e7dccd]" />
            <Link to="/blog/booking-conflict-detection" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0b6e93]">
              Read the engineering blog post
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
