import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiZap, FiTarget, FiShield, FiTrendingUp } from "react-icons/fi";
import { subscriptionAPI } from "../api/axiosConfig";
import toast from "react-hot-toast";

const staticPlans = [
  {
    id: "starter",
    name: "Starter Tier",
    price: "₹0",
    cadence: "/month",
    description: "Ideal for individual vendors starting their rental journey.",
    buttonText: "Join for Free",
    accentColor: "from-blue-600 to-blue-400",
    badge: "Public Entry",
    features: [
      "Up to 3 active listings",
      "3 images per listing",
      "Real-time order notifications",
      "Basic inventory management",
      "Standard dashboard theme",
    ],
    isPopular: false,
    theme: "light",
  },
  {
    id: "growth",
    name: "Growth Plan",
    price: "₹2,499",
    cadence: "/month",
    description: "The gold standard for scaling your rental fleet professionally.",
    buttonText: "Unlock Gold Access",
    accentColor: "from-[#d4af37] to-[#f9d423]",
    badge: "Merchant Choice",
    features: [
      "Up to 20 active listings",
      "10 images per listing",
      "Premium Gold-Plated Dashboard",
      "Advanced revenue analytics",
      "Priority equipment publishing",
      "Priority support access",
    ],
    isPopular: true,
    theme: "premium",
  },
  {
    id: "enterprise",
    name: "Fleet Ops",
    price: "₹9,999",
    cadence: "/month",
    description: "Enterprise-grade solutions for large-scale rental houses.",
    buttonText: "Go Enterprise",
    accentColor: "from-purple-600 to-indigo-400",
    badge: "Scale Ready",
    features: [
      "Unlimited fleet assets",
      "50 images per listing",
      "SLA-backed priority support",
      "Custom domain options",
      "Advanced analytics widgets",
      "Multi-region coordination",
    ],
    isPopular: false,
    theme: "light",
  },
];

function FAQ() {
  const faqs = [
    { q: "How does the Growth Plan activation work?", a: "Once you subscribe, your dashboard instantly transforms into the premium 'Gold Plated' dark theme, and all advanced listing controls are unlocked without a page reload." },
    { q: "Can I cancel my subscription any time?", a: "Yes. You have full control in your Settings tab to manage or cancel your plan. Changes take effect at the end of your billing cycle." },
    { q: "What is 'Gold Access'?", a: "Gold Access refers to our highest-fidelity vendor interface, designed for professional merchants who need superior visibility and faster workflow tools." }
  ];

  return (
    <div className="mt-28 w-full max-w-4xl mx-auto px-4">
      <h3 className="text-3xl font-black text-center mb-12 tracking-tight">Venture Intelligence FAQ</h3>
      <div className="grid gap-6">
        {faqs.map((f, i) => (
          <div key={i} className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <h4 className="font-bold text-lg mb-2">{f.q}</h4>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const navigate = useNavigate();

  const handleSelectPlan = async (planId) => {
    if (planId === 'starter') {
      navigate("/login?role=vendor");
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await subscriptionAPI.upgrade({
        tier_slug: planId,
        billing_cycle: 'monthly'
      });
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      toast.error(err.message || "Failed to initiate subscription.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#0f172a] pb-32">
      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-48 overflow-hidden bg-[#09090b] text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 animate-fade-in">
            <FiZap className="w-4 h-4 text-[#d4af37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Monetization Orchestrated</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8 animate-slide-up">
            Powering your <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f9d423]">rental empire.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-400 font-medium leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
            Choose the tier that fits your growth. From solo operators to multi-region fleets, TapRent provides the infrastructure to scale your assets.
          </p>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="relative z-20 -mt-24 mx-auto max-w-[1200px] px-6">
        <div className="grid gap-8 lg:grid-cols-3 items-stretch">
          {staticPlans.map((plan, idx) => (
            <article 
              key={plan.id} 
              className={`relative flex flex-col p-10 rounded-[48px] border transition-all duration-700 hover:scale-[1.02] animate-slide-up ${
                plan.theme === 'premium' 
                ? 'bg-[#18181b] border-[#d4af37]/30 text-white shadow-[0_32px_80px_rgba(212,175,55,0.1)]' 
                : 'bg-white border-gray-100 text-[#0f172a] shadow-[0_32px_60px_rgba(0,0,0,0.03)]'
              }`}
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f9d423] text-black text-[10px] font-black uppercase tracking-widest shadow-xl">
                  {plan.badge}
                </div>
              )}
              
              <div className="mb-10">
                <h3 className={`text-xs font-black uppercase tracking-[0.3em] mb-4 ${plan.theme === 'premium' ? 'text-[#d4af37]' : 'text-blue-600'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-sm font-bold opacity-40">{plan.cadence}</span>
                </div>
                <p className="mt-4 text-sm font-bold opacity-60 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-5 mb-12">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${plan.theme === 'premium' ? 'bg-[#d4af37]/10 text-[#d4af37]' : 'bg-blue-50 text-blue-600'}`}>
                      <FiCheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold tracking-tight opacity-90">{f}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loadingPlan === plan.id}
                className={`w-full py-5 rounded-[24px] text-center font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
                  plan.theme === 'premium' 
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f9cd34] text-black hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]' 
                  : 'bg-[#0f172a] text-white hover:bg-black'
                } ${loadingPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingPlan === plan.id ? 'Connecting...' : plan.buttonText}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ── Feature Comparison / Trust ── */}
      <section className="mx-auto max-w-[1200px] px-6 mt-32 text-center">
        <h2 className="text-4xl font-black tracking-tight text-[#111827] mb-16">Intelligence for every fleet.</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {[
            { icon: FiTarget, title: "Precision Gating", desc: "Automated listing controls based on real-time sub status." },
            { icon: FiShield, title: "Vault Security", desc: "Encryption for all fleet sensitive data and payouts." },
            { icon: FiTrendingUp, title: "Scale Matrix", desc: "Deep analytics that track revenue per asset category." },
            { icon: FiZap, title: "Pulse Engine", desc: "High-speed realtime orchestration for vendor client streams." }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-6 transition-transform hover:scale-110">
                <item.icon className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="font-bold text-lg mb-2">{item.title}</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[180px]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQ />

      {/* ── CTA Footer ── */}
      <section className="mt-32 mx-6">
        <div className="mx-auto max-w-[1200px] rounded-[60px] bg-[#09090b] p-16 md:p-24 text-center relative overflow-hidden text-white shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_bottom_left,#3b82f6,transparent_50%)]" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Ready to synchronize?</h2>
            <p className="max-w-xl mx-auto text-lg text-gray-400 font-medium mb-12">Join hundreds of merchants who have upgraded to our gold-standard fleet management stack.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/contact" className="px-10 py-5 rounded-3xl bg-white text-[#09090b] font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Request Demo</Link>
              <Link to="/login?role=vendor" className="px-10 py-5 rounded-3xl border border-white/20 bg-white/5 backdrop-blur-md font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Start Onboarding</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
