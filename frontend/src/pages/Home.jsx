import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import EquipmentCard from "../components/equipment/EquipmentCard";
import { equipmentAPI } from "../api/axiosConfig";
import { useAppPreferences } from "../context/AppPreferencesContext";
import { getWebSocketBaseUrl } from "../lib/realtime";
import { FiChevronRight, FiFilter, FiSearch, FiShield, FiTruck, FiClock, FiStar, FiUserCheck } from "react-icons/fi";

const categories = [
  { value: "", label: "All Gear" },
  { value: "camera", label: "Cameras & Lenses" },
  { value: "construction", label: "Construction" },
  { value: "event", label: "Event & Lighting" },
  { value: "industrial", label: "Industrial" },
  { value: "audio", label: "Pro Audio" },
  { value: "vehicles", label: "Vehicles" },
  { value: "other", label: "Other" },
];

function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-[#f5f5f7]">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8 text-center">
        <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-[#1d1d1f] mb-4">How it works.</h2>
        <p className="text-lg text-[#86868b] max-w-2xl mx-auto mb-16">Renting professional equipment has never been this seamless.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-[60px] left-1/6 right-1/6 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3]/30 to-transparent z-0"></div>
          
          {[
            { step: "01", icon: FiSearch, title: "Find the Perfect Gear", desc: "Browse thousands of high-end tools, cameras, and machinery near you." },
            { step: "02", icon: FiShield, title: "Book Securely", desc: "Reserve your dates and pay through our Stripe-encrypted gateway." },
            { step: "03", icon: FiTruck, title: "Pick Up & Create", desc: "Collect your equipment and get to work. Return it when you're done." }
          ].map((item, i) => (
            <div key={item.step} className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center mb-6">
                <item.icon className="w-6 h-6 text-[#0071e3]" />
              </div>
              <div className="text-[12px] font-bold tracking-widest text-[#0071e3] mb-2">{item.step}</div>
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">{item.title}</h3>
              <p className="text-[#86868b] leading-relaxed max-w-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCategories() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-[#1d1d1f] mb-2">Explore by category.</h2>
          <p className="text-[#86868b] text-lg">Industry-standard tools for any project.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
          {/* Large Hero Card */}
          <Link to="/equipment?category=camera" className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-[#f5f5f7] flex items-end p-8">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
            <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop" alt="Cameras" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="relative z-20 w-full flex justify-between items-end">
              <div>
                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wide">Featured</p>
                <h3 className="text-3xl font-bold text-white">Cameras & Lenses</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"><FiChevronRight /></div>
            </div>
          </Link>
          
          <Link to="/equipment?category=construction" className="group relative overflow-hidden rounded-[2rem] bg-[#f5f5f7] flex items-end p-8">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
             <img src="https://images.unsplash.com/photo-1541888087425-ce81dc592981?q=80&w=1000&auto=format&fit=crop" alt="Construction" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             <div className="relative z-20">
               <h3 className="text-2xl font-bold text-white">Heavy Machinery</h3>
             </div>
          </Link>
          
          <Link to="/equipment?category=audio" className="group relative overflow-hidden rounded-[2rem] bg-[#f5f5f7] flex items-end p-6">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
             <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop" alt="Audio" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             <div className="relative z-20">
               <h3 className="text-xl font-bold text-white">Pro Audio</h3>
             </div>
          </Link>
          
          <Link to="/equipment?category=event" className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-[#f5f5f7] flex items-end p-8">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
             <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop" alt="Event" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             <div className="relative z-20">
               <h3 className="text-2xl font-bold text-white">Event & Lighting</h3>
             </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { text: "TapRent completely changed how our production house sources lenses. The quality is verified and delivery is always on time.", author: "James M.", role: "Creative Director" },
    { text: "Renting heavy machinery used to be a nightmare of paperwork. This platform makes it as easy as booking a hotel.", author: "Sarah T.", role: "Site Manager" },
    { text: "I list my idle audio gear and make a steady passive income every weekend. The guarantee gives me total peace of mind.", author: "David L.", role: "Audio Engineer" },
  ];
  return (
    <section className="py-24 bg-white border-t border-gray-100 overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8 text-center mb-16">
        <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-[#1d1d1f]">Trusted by professionals.</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-6 max-w-[1200px] mx-auto px-4 md:px-8">
        {reviews.map((r, i) => (
          <div key={i} className="flex-1 bg-[#f5f5f7] p-8 rounded-[2rem]">
            <div className="flex gap-1 mb-4 text-[#0071e3]">
              {[...Array(5)].map((_, idx) => <FiStar key={idx} className="fill-current w-4 h-4" />)}
            </div>
            <p className="text-[#1d1d1f] font-medium text-lg mb-6 leading-relaxed">"{r.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold"><FiUserCheck /></div>
              <div className="text-left">
                <p className="font-bold text-[#1d1d1f] text-sm">{r.author}</p>
                <p className="text-xs text-[#86868b]">{r.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EquipmentSection({ title, subtitle, items, viewAllLink }) {
  if (!items.length) return null;
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            {subtitle && <p className="text-[#0071e3] font-semibold text-[13px] tracking-wide uppercase mb-2">{subtitle}</p>}
            <h2 className="text-3xl md:text-[44px] font-bold tracking-tight text-[#1d1d1f] leading-[1.1]">{title}</h2>
          </div>
          {viewAllLink && (
            <Link to={viewAllLink} className="group flex items-center gap-1 text-[#0071e3] font-medium text-[15px] hover:underline underline-offset-4">
              View all <FiChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {items.map((item, idx) => (
            <div key={`${title}-${item.id}`} className="animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
              <EquipmentCard equipment={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const location = useLocation();
  const queryCategory = new URLSearchParams(location.search).get("category") || "";
  const querySearch = new URLSearchParams(location.search).get("search") || "";
  const { location: selectedLocation } = useAppPreferences();

  const [category, setCategory] = useState(queryCategory);
  const [search, setSearch] = useState(querySearch);
  const [debouncedSearch, setDebouncedSearch] = useState(querySearch);
  const [sort, setSort] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(50000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [listings, setListings] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const wsRef = useRef(null);

  useEffect(() => {
    setCategory(queryCategory);
    setSearch(querySearch);
    setDebouncedSearch(querySearch);
  }, [queryCategory, querySearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let mounted = true;
    async function fetchMarketplace() {
      setLoading(true);
      setError("");
      try {
        const [main, newSet, popularSet, featuredSet] = await Promise.all([
          equipmentAPI.list({
            category: category || undefined,
            search: debouncedSearch || undefined,
            sort,
            max_price: maxPrice,
            location: selectedLocation || undefined,
          }),
          equipmentAPI.list({ section: "new", location: selectedLocation || undefined }),
          equipmentAPI.list({ section: "popular", sort: "popular", location: selectedLocation || undefined }),
          equipmentAPI.list({ section: "featured", location: selectedLocation || undefined }),
        ]);
        if (!mounted) return;
        setListings(Array.isArray(main) ? main : main?.results || []);
        setNewProducts((Array.isArray(newSet) ? newSet : newSet?.results || []).slice(0, 4));
        setPopularProducts((Array.isArray(popularSet) ? popularSet : popularSet?.results || []).slice(0, 4));
        setFeaturedProducts((Array.isArray(featuredSet) ? featuredSet : featuredSet?.results || []).slice(0, 4));
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load marketplace.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchMarketplace();
    return () => { mounted = false; };
  }, [category, debouncedSearch, sort, maxPrice, selectedLocation]);

  // WebSocket for real-time equipment updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const wsBase = getWebSocketBaseUrl();
        const wsUrl = `${wsBase}/ws/equipment/updates/`;
        wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to equipment updates WebSocket');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'equipment_update') {
            // Refresh the marketplace data when equipment is updated
            async function refreshData() {
              try {
                const [main, newSet, popularSet, featuredSet] = await Promise.all([
                  equipmentAPI.list({
                    category: category || undefined,
                    search: debouncedSearch || undefined,
                    sort,
                    max_price: maxPrice,
                    location: selectedLocation || undefined,
                  }),
                  equipmentAPI.list({ section: "new", location: selectedLocation || undefined }),
                  equipmentAPI.list({ section: "popular", sort: "popular", location: selectedLocation || undefined }),
                  equipmentAPI.list({ section: "featured", location: selectedLocation || undefined }),
                ]);
                setListings(Array.isArray(main) ? main : main?.results || []);
                setNewProducts((Array.isArray(newSet) ? newSet : newSet?.results || []).slice(0, 4));
                setPopularProducts((Array.isArray(popularSet) ? popularSet : popularSet?.results || []).slice(0, 4));
                setFeaturedProducts((Array.isArray(featuredSet) ? featuredSet : featuredSet?.results || []).slice(0, 4));
              } catch (err) {
                console.error('Failed to refresh equipment data:', err);
              }
            }
            refreshData();
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Equipment updates WebSocket closed, reconnecting...');
        setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
      };

      wsRef.current.onerror = (error) => {
        console.error('Equipment updates WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [category, debouncedSearch, sort, maxPrice, selectedLocation]);

  const hasItems = useMemo(() => listings.length > 0, [listings]);
  const isFiltering = category || debouncedSearch || sort !== "popular" || maxPrice !== 50000 || selectedLocation;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      {!isFiltering && (
        <section className="relative overflow-hidden bg-[#09090b] text-center pt-28 pb-40 md:pt-40 md:pb-60">
          <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent_70%)] opacity-30"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          </div>

          <div className="relative z-20 max-w-[1000px] mx-auto px-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-10 animate-fade-in shadow-2xl">
               <FiShield className="w-4 h-4 text-[#d4af37]" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37]">Certified Fleet Infrastructure</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[104px] font-black tracking-tighter text-white mb-8 leading-[0.85] animate-slide-up">
              Pro gear.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-white to-white/40">Synchronized.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/50 font-bold max-w-xl mb-16 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
              The gold standard for professional equipment rental. 
              Find exactly what you need, with industry-grade precision.
            </p>

            {/* Glass Search Interface */}
            <div className="w-full max-w-3xl animate-slide-up shadow-[0_40px_100px_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-3xl" style={{ animationDelay: '200ms' }}>
              <div className="p-2 flex flex-col md:flex-row gap-2">
                <div className="relative flex-[1.5] group">
                  <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-[#d4af37] transition-colors" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search the fleet..."
                    className="w-full h-16 bg-transparent border-none text-white text-[15px] pl-14 pr-6 focus:ring-0 placeholder:text-white/20 font-black tracking-wider transition-all"
                  />
                </div>
                <div className="hidden md:block w-[1px] h-10 bg-white/10 self-center"></div>
                <div className="flex-1 flex items-center relative pr-4">
                   <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-16 bg-transparent border-none text-white/60 text-[13px] font-black uppercase tracking-widest appearance-none focus:ring-0 px-6 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value} className="bg-[#18181b] text-white py-4">{c.label}</option>
                    ))}
                  </select>
                  <FiChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
                <button 
                  onClick={() => setSearch(search)} 
                  className="md:w-16 h-16 rounded-[24px] bg-[#d4af37] text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl"
                >
                  <FiSearch className="w-6 h-6 stroke-[3px]" />
                </button>
              </div>
            </div>

            {/* Sub-Search Metrics */}
            <div className="mt-12 flex flex-wrap justify-center gap-10 opacity-30">
               {[
                 { l: "Realtime Sync", v: "100%" },
                 { l: "Stripe Powered", v: "Verified" },
                 { l: "Fleet Assets", v: "24.5k" },
               ].map(m => (
                 <div key={m.l} className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1">{m.l}</div>
                    <div className="text-lg font-black">{m.v}</div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust Strip ── */}
      {!isFiltering && (
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-10 md:py-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { icon: FiShield, title: "Verified Equipment", desc: "Every listing is quality-checked and verified by our team." },
                { icon: FiTruck, title: "Fast Delivery", desc: "Get equipment delivered to your location within 24 hours." },
                { icon: FiClock, title: "Flexible Rentals", desc: "Rent for a day, a week, or a month. You decide the duration." },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#0071e3]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px] text-[#1d1d1f] mb-1">{title}</h3>
                    <p className="text-[13px] text-[#86868b] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!isFiltering && <HowItWorks />}
      {!isFiltering && <FeaturedCategories />}

      {/* ── Browse / Filter Area ── */}
      <div className={`mx-auto max-w-[1200px] px-4 md:px-8 ${isFiltering ? "pt-8" : "pt-16"} pb-24`}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl md:text-[40px] font-bold tracking-tight text-[#1d1d1f] leading-[1.1]">
              {isFiltering ? "Search Results" : "Explore Equipment"}
            </h1>
            {selectedLocation && (
              <p className="text-[#86868b] mt-2 font-medium text-[14px]">Showing equipment available in {selectedLocation}</p>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-full transition-all duration-200 self-start md:self-auto text-[13px] ${showFilters ? 'bg-[#1d1d1f] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'}`}
          >
            <FiFilter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-6 md:p-8 mb-10 animate-scale-in border border-gray-200/60" style={{ boxShadow: 'var(--shadow-md)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="text-caption mb-3 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${category === cat.value
                        ? "bg-[#1d1d1f] text-white shadow-sm"
                        : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-caption mb-3 block">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-[#f5f5f7] px-4 py-3 text-[13px] font-medium text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
                >
                  <option value="popular">Most Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <div>
                <label className="text-caption mb-3 block">
                  Max Price: <span className="text-[#1d1d1f]">₹{maxPrice.toLocaleString("en-IN")} / day</span>
                </label>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
                />
                <div className="flex justify-between text-[11px] text-[#86868b] mt-2 font-medium">
                  <span>₹500</span>
                  <span>₹50,000+</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setCategory("");
                  setSearch("");
                  setSort("popular");
                  setMaxPrice(50000);
                }}
                className="text-[13px] font-semibold text-[#0071e3] hover:underline underline-offset-4"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="mb-8">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="aspect-[3/4] skeleton rounded-2xl" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl bg-red-50 p-8 text-center text-red-600 font-medium">
              We couldn't load the marketplace right now. Please try again later.
            </div>
          )}

          {!loading && !error && !hasItems && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-[#f5f5f7] py-28 px-6 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-5">
                <FiSearch className="w-6 h-6 text-[#86868b]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">No results found</h3>
              <p className="text-[#86868b] max-w-md text-[15px]">We couldn't find any equipment matching your criteria. Try adjusting your filters or location.</p>
              <div className="flex flex-wrap gap-4 mt-8 justify-center">
                <button
                  onClick={() => { setCategory(""); setSearch(""); setMaxPrice(50000); }}
                  className="px-6 py-3 bg-[#0071e3] text-white rounded-full font-semibold text-[14px] hover:bg-[#0077ed] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Clear Filters
                </button>
                <button
                  onClick={async () => {
                    try {
                      await equipmentAPI.seedVendorProducts();
                      window.location.reload();
                    } catch (err) {
                      alert("Please log in as a vendor to seed sample products, or ensure your API URL is correct.");
                    }
                  }}
                  className="px-6 py-3 bg-white border border-gray-200 text-[#1d1d1f] rounded-full font-semibold text-[14px] hover:bg-gray-50 transition-all duration-200 shadow-sm"
                >
                  Seed Sample Data
                </button>
              </div>
            </div>
          )}

          {!loading && hasItems && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {listings.map((item, idx) => (
                <div key={item.id} className="animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                  <EquipmentCard equipment={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Curated Sections ── */}
      {!isFiltering && (
        <div className="bg-[#f5f5f7]">
          <EquipmentSection
            title="Featured Equipment"
            subtitle="Premium Selection"
            items={featuredProducts}
            viewAllLink="/equipment?section=featured"
          />
          <div className="max-w-[1200px] mx-auto px-4 md:px-8"><div className="border-t border-gray-200/60" /></div>
          <EquipmentSection
            title="Trending Now"
            subtitle="Most Popular"
            items={popularProducts}
            viewAllLink="/equipment?section=popular"
          />
          <div className="max-w-[1200px] mx-auto px-4 md:px-8"><div className="border-t border-gray-200/60" /></div>
          <EquipmentSection
            title="New Arrivals"
            subtitle="Just Added"
            items={newProducts}
            viewAllLink="/equipment?section=new"
          />
        </div>
      )}

      {!isFiltering && <Testimonials />}
    </div>
  );
}