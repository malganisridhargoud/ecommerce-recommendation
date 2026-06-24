import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import EquipmentCard from "../components/equipment/EquipmentCard";
import { equipmentAPI } from "../api/axiosConfig";
import { useAppPreferences } from "../context/AppPreferencesContext";
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
    <section className="py-5 py-md-5 bg-surface">
      <div className="container text-center py-5" style={{ maxWidth: '1200px' }}>
        <h2 className="display-5 fw-bold tracking-tight text-ink mb-3">How it works.</h2>
        <p className="fs-5 text-muted-custom mb-5 mx-auto" style={{ maxWidth: '600px' }}>Renting professional equipment has never been this seamless.</p>

        <div className="row position-relative g-5 pt-3">
          <div className="d-none d-md-block position-absolute start-0 end-0" style={{ top: '60px', height: '2px', background: 'linear-gradient(to right, transparent, rgba(0,113,227,0.3), transparent)', zIndex: 0 }}></div>

          {[
            { step: "01", icon: FiSearch, title: "Find the Perfect Gear", desc: "Browse thousands of high-end tools, cameras, and machinery near you." },
            { step: "02", icon: FiShield, title: "Book Securely", desc: "Reserve your dates and pay through our Stripe-encrypted gateway." },
            { step: "03", icon: FiTruck, title: "Pick Up & Create", desc: "Collect your equipment and get to work. Return it when you're done." }
          ].map((item) => (
            <div key={item.step} className="col-12 col-md-4 position-relative z-10 d-flex flex-column align-items-center">
              <div className="rounded-circle bg-white d-flex align-items-center justify-content-center mb-4" style={{ width: '64px', height: '64px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                <item.icon className="text-brand" style={{ width: '24px', height: '24px' }} />
              </div>
              <div className="fw-bold tracking-wider text-brand mb-2" style={{ fontSize: '12px' }}>{item.step}</div>
              <h3 className="h5 fw-bold text-ink mb-3">{item.title}</h3>
              <p className="text-muted-custom leading-relaxed" style={{ maxWidth: '280px' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCategories() {
  return (
    <section className="py-5 bg-white">
      <div className="container py-5" style={{ maxWidth: '1200px' }}>
        <div className="mb-5">
          <h2 className="display-5 fw-bold tracking-tight text-ink mb-2">Explore by category.</h2>
          <p className="fs-5 text-muted-custom">Industry-standard tools for any project.</p>
        </div>

        <div className="row g-4" style={{ gridAutoRows: '240px' }}>
          {/* Large Hero Card */}
          <div className="col-12 col-md-8">
            <Link to="/equipment?category=camera" className="d-flex align-items-end position-relative overflow-hidden rounded-3xl bg-surface p-4 p-md-5 h-100 text-decoration-none group">
              <div className="position-absolute inset-0 z-10 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
              <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop" alt="Cameras" className="position-absolute inset-0 w-100 h-100 object-cover transition-transform duration-700 hover-scale" />
              <div className="position-relative z-20 w-100 d-flex justify-content-between align-items-end">
                <div>
                  <p className="text-white-50 fw-medium text-sm mb-1 text-uppercase tracking-wide">Featured</p>
                  <h3 className="display-6 fw-bold text-white mb-0">Cameras & Lenses</h3>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                  <FiChevronRight />
                </div>
              </div>
            </Link>
          </div>

          <div className="col-12 col-md-4">
            <Link to="/equipment?category=construction" className="d-flex align-items-end position-relative overflow-hidden rounded-3xl bg-surface p-4 h-100 text-decoration-none group">
              <div className="position-absolute inset-0 z-10 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
              <img src="https://images.unsplash.com/photo-1541888087425-ce81dc592981?q=80&w=1000&auto=format&fit=crop" alt="Construction" className="position-absolute inset-0 w-100 h-100 object-cover transition-transform duration-700 hover-scale" />
              <div className="position-relative z-20">
                <h3 className="h4 fw-bold text-white mb-0">Heavy Machinery</h3>
              </div>
            </Link>
          </div>

          <div className="col-12 col-md-4">
            <Link to="/equipment?category=audio" className="d-flex align-items-end position-relative overflow-hidden rounded-3xl bg-surface p-4 h-100 text-decoration-none group">
              <div className="position-absolute inset-0 z-10 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
              <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop" alt="Audio" className="position-absolute inset-0 w-100 h-100 object-cover transition-transform duration-700 hover-scale" />
              <div className="position-relative z-20">
                <h3 className="h5 fw-bold text-white mb-0">Pro Audio</h3>
              </div>
            </Link>
          </div>

          <div className="col-12 col-md-8">
            <Link to="/equipment?category=event" className="d-flex align-items-end position-relative overflow-hidden rounded-3xl bg-surface p-4 p-md-5 h-100 text-decoration-none group">
              <div className="position-absolute inset-0 z-10 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
              <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop" alt="Event" className="position-absolute inset-0 w-100 h-100 object-cover transition-transform duration-700 hover-scale" />
              <div className="position-relative z-20">
                <h3 className="h4 fw-bold text-white mb-0">Event & Lighting</h3>
              </div>
            </Link>
          </div>
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
    <section className="py-5 bg-white border-top overflow-hidden">
      <div className="container py-5" style={{ maxWidth: '1200px' }}>
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold tracking-tight text-ink">Trusted by professionals.</h2>
        </div>
        <div className="row g-4">
          {reviews.map((r, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="bg-surface p-4 p-md-5 rounded-3xl h-100 d-flex flex-column">
                <div className="d-flex gap-1 mb-3 text-brand">
                  {[...Array(5)].map((_, idx) => <FiStar key={idx} className="fill-current w-4 h-4" />)}
                </div>
                <p className="text-ink fw-medium fs-6 mb-4 leading-relaxed flex-grow-1">"{r.text}"</p>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px', background: 'linear-gradient(to bottom right, #d1d5db, #9ca3af)' }}>
                    <FiUserCheck />
                  </div>
                  <div>
                    <p className="fw-bold text-ink text-sm mb-0">{r.author}</p>
                    <p className="text-xs text-muted-custom mb-0">{r.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EquipmentSection({ title, subtitle, items, viewAllLink }) {
  if (!items.length) return null;
  return (
    <section className="py-5">
      <div className="container py-4" style={{ maxWidth: '1200px' }}>
        <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between mb-5 gap-3">
          <div>
            {subtitle && <p className="text-brand fw-semibold text-xs tracking-wide text-uppercase mb-2">{subtitle}</p>}
            <h2 className="display-6 fw-bold tracking-tight text-ink mb-0" style={{ lineHeight: 1.1 }}>{title}</h2>
          </div>
          {viewAllLink && (
            <Link to={viewAllLink} className="d-flex align-items-center gap-1 text-brand fw-medium text-decoration-none hover-underline">
              View all <FiChevronRight className="transition-transform duration-300 group-hover-translate-x-1" />
            </Link>
          )}
        </div>

        <div className="row g-4">
          {items.map((item, idx) => (
            <div key={`${title}-${item.id}`} className="col-12 col-sm-6 col-lg-3 animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
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
        const [mainResult, newResult, popularResult, featuredResult] = await Promise.allSettled([
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

        if (mainResult.status === "fulfilled") {
          const main = mainResult.value;
          setListings(Array.isArray(main) ? main : main?.results || []);
        } else {
          throw new Error(mainResult.reason?.message || "Failed to load equipment.");
        }

        if (newResult.status === "fulfilled") {
          const newSet = newResult.value;
          setNewProducts((Array.isArray(newSet) ? newSet : newSet?.results || []).slice(0, 4));
        }
        if (popularResult.status === "fulfilled") {
          const popularSet = popularResult.value;
          setPopularProducts((Array.isArray(popularSet) ? popularSet : popularSet?.results || []).slice(0, 4));
        }
        if (featuredResult.status === "fulfilled") {
          const featuredSet = featuredResult.value;
          setFeaturedProducts((Array.isArray(featuredSet) ? featuredSet : featuredSet?.results || []).slice(0, 4));
        }

      } catch (err) {
        if (mounted) setError(err.message || "Unable to load marketplace.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchMarketplace();
    return () => { mounted = false; };
  }, [category, debouncedSearch, sort, maxPrice, selectedLocation]);


  const hasItems = useMemo(() => listings.length > 0, [listings]);
  const isFiltering = category || debouncedSearch || sort !== "popular" || maxPrice !== 50000 || selectedLocation;

  return (
    <div className="bg-white" style={{ minHeight: '100vh' }}>
      {/* ── Hero ── */}
      {!isFiltering && (
        <section className="position-relative overflow-hidden text-center py-5" style={{ backgroundColor: '#09090b', paddingBottom: '10rem', paddingTop: '8rem' }}>
          <div className="position-absolute inset-0 z-0">
             <div className="position-absolute inset-0 opacity-25" style={{ background: 'radial-gradient(circle at 50% -20%, #3b82f6, transparent 70%)' }}></div>
             <div className="position-absolute inset-0 opacity-10" style={{ background: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}></div>
          </div>

          <div className="container position-relative z-20 d-flex flex-column align-items-center" style={{ maxWidth: '1000px' }}>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill border mb-5 animate-fade-in shadow-lg" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
               <FiShield className="text-warning" style={{ width: '14px', height: '14px', color: '#d4af37' }} />
               <span className="fw-black text-uppercase tracking-wider" style={{ fontSize: '10px', color: '#d4af37', letterSpacing: '0.3em' }}>Certified Fleet Infrastructure</span>
            </div>
            
            <h1 className="display-2 fw-black tracking-tighter text-white mb-4 animate-slide-up" style={{ lineHeight: 0.9 }}>
              Pro gear.<br />
              <span style={{ color: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #d4af37, #ffffff, rgba(255,255,255,0.4))' }}>Synchronized.</span>
            </h1>
            
            <p className="fs-5 text-white-50 fw-bold mb-5 leading-relaxed animate-slide-up mx-auto" style={{ animationDelay: '100ms', maxWidth: '600px' }}>
              The gold standard for professional equipment rental. 
              Find exactly what you need, with industry-grade precision.
            </p>

            {/* Glass Search Interface */}
            <div className="w-100 animate-slide-up rounded-pill overflow-hidden border shadow-lg" style={{ maxWidth: '768px', animationDelay: '200ms', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(30px)' }}>
              <div className="d-flex flex-column flex-md-row p-2 gap-2">
                <div className="position-relative flex-grow-1" style={{ flex: 1.5 }}>
                  <FiSearch className="position-absolute start-0 top-50 translate-middle-y ms-4 text-white-50" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search the fleet..."
                    className="w-100 h-100 bg-transparent border-0 text-white fw-bold tracking-wider px-5 focus-none"
                    style={{ minHeight: '60px' }}
                  />
                </div>
                <div className="d-none d-md-block align-self-center" style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div className="position-relative flex-grow-1 d-flex align-items-center pe-3">
                   <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-100 h-100 bg-transparent border-0 text-white-50 fw-bold text-uppercase tracking-widest px-4 focus-none cursor-pointer appearance-none"
                    style={{ minHeight: '60px', fontSize: '13px' }}
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value} style={{ background: '#18181b', color: 'white' }}>{c.label}</option>
                    ))}
                  </select>
                  <FiChevronRight className="position-absolute end-0 me-4 text-white-50 pointer-events-none" />
                </div>
                <button 
                  onClick={() => setSearch(search)} 
                  className="btn rounded-circle d-flex align-items-center justify-content-center transition-all hover-scale"
                  style={{ width: '60px', height: '60px', backgroundColor: '#d4af37', color: 'black' }}
                >
                  <FiSearch strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Sub-Search Metrics */}
            <div className="mt-5 d-flex flex-wrap justify-content-center gap-5 opacity-50">
               {[
                 { l: "Realtime Sync", v: "100%" },
                 { l: "Stripe Powered", v: "Verified" },
                 { l: "Fleet Assets", v: "24.5k" },
               ].map(m => (
                 <div key={m.l} className="text-center text-white">
                    <div className="fw-black text-uppercase tracking-widest mb-1" style={{ fontSize: '10px' }}>{m.l}</div>
                    <div className="fs-5 fw-black">{m.v}</div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust Strip ── */}
      {!isFiltering && (
        <section className="border-bottom bg-white">
          <div className="container py-5" style={{ maxWidth: '1200px' }}>
            <div className="row g-4 g-md-5">
              {[
                { icon: FiShield, title: "Verified Equipment", desc: "Every listing is quality-checked and verified by our team." },
                { icon: FiTruck, title: "Fast Delivery", desc: "Get equipment delivered to your location within 24 hours." },
                { icon: FiClock, title: "Flexible Rentals", desc: "Rent for a day, a week, or a month. You decide the duration." },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="col-12 col-md-4 d-flex align-items-start gap-3 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="rounded-3 bg-surface d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                    <Icon className="text-brand fs-5" />
                  </div>
                  <div>
                    <h3 className="fw-semibold text-ink mb-1" style={{ fontSize: '15px' }}>{title}</h3>
                    <p className="text-muted-custom mb-0" style={{ fontSize: '13px' }}>{desc}</p>
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
      <div className={`container ${isFiltering ? "pt-4" : "pt-5"} pb-5`} style={{ maxWidth: '1200px' }}>

        {/* Header */}
        <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between mb-4 pb-3 border-bottom gap-3">
          <div>
            <h1 className="display-5 fw-bold tracking-tight text-ink mb-0" style={{ lineHeight: 1.1 }}>
              {isFiltering ? "Search Results" : "Explore Equipment"}
            </h1>
            {selectedLocation && (
              <p className="text-muted-custom mt-2 fw-medium mb-0" style={{ fontSize: '14px' }}>Showing equipment available in {selectedLocation}</p>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn rounded-pill d-flex align-items-center gap-2 px-4 fw-semibold transition-all align-self-start align-self-md-auto ${showFilters ? 'bg-ink text-white' : 'bg-surface text-ink hover-bg-surface-w'}`}
            style={{ fontSize: '13px' }}
          >
            <FiFilter /> Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-3xl p-4 p-md-5 mb-5 border shadow-sm animate-scale-in">
            <div className="row g-4">
              <div className="col-12 col-md-4">
                <label className="text-caption mb-2 d-block">Category</label>
                <div className="d-flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`btn rounded-pill px-3 py-1 fw-medium transition-all ${category === cat.value
                        ? "bg-ink text-white"
                        : "bg-surface text-ink hover-bg-surface-w"
                        }`}
                      style={{ fontSize: '13px' }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="text-caption mb-2 d-block">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="form-select rounded-xl border bg-surface px-3 py-2 fw-medium text-ink focus-border-brand"
                  style={{ fontSize: '13px' }}
                >
                  <option value="popular">Most Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="text-caption mb-2 d-block">
                  Max Price: <span className="text-ink text-none-transform">₹{maxPrice.toLocaleString("en-IN")} / day</span>
                </label>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="form-range"
                />
                <div className="d-flex justify-content-between text-muted-custom mt-1 fw-medium" style={{ fontSize: '11px' }}>
                  <span>₹500</span>
                  <span>₹50,000+</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-top d-flex justify-content-end">
              <button
                onClick={() => {
                  setCategory("");
                  setSearch("");
                  setSort("popular");
                  setMaxPrice(50000);
                }}
                className="btn btn-link text-brand fw-semibold p-0 text-decoration-none hover-underline"
                style={{ fontSize: '13px' }}
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="mb-5">
          {loading && (
            <div className="row g-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="col-12 col-sm-6 col-lg-3">
                  <div className="skeleton rounded-3xl w-100" style={{ aspectRatio: '3/4' }} />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl bg-danger bg-opacity-10 p-5 text-center text-danger fw-medium">
              We couldn't load the marketplace right now. Please try again later.
            </div>
          )}

          {!loading && !error && !hasItems && (
            <div className="d-flex flex-column align-items-center justify-content-center rounded-3xl bg-surface py-5 px-4 text-center">
              <div className="rounded-3 bg-white d-flex align-items-center justify-content-center shadow-sm mb-4" style={{ width: '64px', height: '64px' }}>
                <FiSearch className="text-muted-custom fs-4" />
              </div>
              <h3 className="h4 fw-bold text-ink mb-2">No results found</h3>
              <p className="text-muted-custom mb-4" style={{ maxWidth: '400px' }}>We couldn't find any equipment matching your criteria. Try adjusting your filters or location.</p>
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <button
                  onClick={() => { setCategory(""); setSearch(""); setMaxPrice(50000); }}
                  className="btn btn-primary-apple rounded-pill px-4 fw-semibold shadow-sm"
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
                  className="btn btn-light border bg-white rounded-pill px-4 fw-semibold shadow-sm"
                >
                  Seed Sample Data
                </button>
              </div>
            </div>
          )}

          {!loading && hasItems && (
            <div className="row g-4">
              {listings.map((item, idx) => (
                <div key={item.id} className="col-12 col-sm-6 col-lg-3 animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                  <EquipmentCard equipment={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Curated Sections ── */}
      {!isFiltering && (
        <div className="bg-surface">
          <EquipmentSection
            title="Featured Equipment"
            subtitle="Premium Selection"
            items={featuredProducts}
            viewAllLink="/equipment?section=featured"
          />
          <div className="container" style={{ maxWidth: '1200px' }}><hr className="my-0 text-muted" /></div>
          <EquipmentSection
            title="Trending Now"
            subtitle="Most Popular"
            items={popularProducts}
            viewAllLink="/equipment?section=popular"
          />
          <div className="container" style={{ maxWidth: '1200px' }}><hr className="my-0 text-muted" /></div>
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