import { Link, NavLink, useNavigate } from "react-router-dom";
import { SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { chatAPI, equipmentAPI, usersAPI } from "../../api/axiosConfig";
import { useAppPreferences } from "../../context/AppPreferencesContext";
import { FiSearch, FiMapPin, FiHeart, FiShoppingCart, FiMessageSquare, FiUser, FiPackage, FiGrid } from "react-icons/fi";

const CATEGORIES = [
  { slug: "camera", label: "Camera" },
  { slug: "construction", label: "Construction" },
  { slug: "event", label: "Event" },
  { slug: "industrial", label: "Industrial" },
  { slug: "audio", label: "Audio" },
  { slug: "vehicles", label: "Vehicles" },
];

const ROLE_DASH = { buyer: "/buyer", vendor: "/vendor", admin: "/admin" };
const BUYER_TAB_LINKS = {
  wishlist: "/buyer?tab=wishlist",
  cart: "/buyer?tab=cart",
  messages: "/buyer?tab=chat",
};

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { language, setLanguage, location, setLocation, languageOptions, t, cartCount, setCartCount, unreadMessages, setUnreadMessages } = useAppPreferences();
  const [role, setRole] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      if (!isSignedIn) {
        setRole("");
        setWishlistCount(0);
        setUnreadMessages(0);
        setCartCount(0);
        return;
      }
      try {
        const [me, wl, threads, cart] = await Promise.all([
          usersAPI.me(),
          equipmentAPI.wishlist().catch(() => []),
          chatAPI.threads().catch(() => []),
          equipmentAPI.cart().catch(() => [])
        ]);
        if (!mounted) return;
        setRole(me?.role || "buyer");
        setWishlistCount(Array.isArray(wl) ? wl.length : 0);
        setUnreadMessages(Array.isArray(threads) ? threads.length : 0);
        setCartCount(Array.isArray(cart) ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0);
      } catch {
        if (mounted) setRole("buyer");
      }
    }
    hydrate();
    return () => { mounted = false; };
  }, [isSignedIn, setCartCount, setUnreadMessages]);

  const dashboardLink = useMemo(() => ROLE_DASH[role] || "/buyer", [role]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/equipment?search=${encodeURIComponent(searchInput)}`);
    } else {
      navigate(`/equipment`);
    }
  };

  return (
    <>
      {/* ── Main Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-200/40 transition-all duration-300">

        {/* Top Row */}
        <div className="mx-auto flex max-w-[1200px] h-[52px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#00c7ff] flex items-center justify-center text-white font-bold text-xs shadow-md transition-transform duration-300 group-hover:scale-105">
              TR
            </div>
            <span className="font-semibold text-[17px] text-[#1d1d1f] tracking-tight hidden sm:block">
              <span className="text-[#0071e3]">Tap</span>Rent
            </span>
          </Link>

          {/* Center Search & Location */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex-1 relative group">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] w-4 h-4 group-focus-within:text-[#0071e3] transition-colors duration-200" />
              <input
                type="text"
                placeholder={t.searchPlaceholder || "Search equipment..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-[#f5f5f7] border border-transparent focus:bg-white focus:border-[#0071e3]/30 focus:ring-2 focus:ring-[#0071e3]/10 rounded-full h-9 pl-10 pr-4 text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] transition-all duration-200"
              />
            </form>
            <div className="relative w-44 shrink-0 group">
              <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] w-4 h-4 group-focus-within:text-[#0071e3] transition-colors duration-200" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.location || "Location..."}
                className="w-full bg-[#f5f5f7] border border-transparent focus:bg-white focus:border-[#0071e3]/30 focus:ring-2 focus:ring-[#0071e3]/10 rounded-full h-9 pl-10 pr-4 text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <select
              className="hidden sm:block rounded-md border-transparent hover:bg-gray-100 bg-transparent px-2 py-1.5 text-[11px] text-[#86868b] font-medium cursor-pointer transition-colors"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languageOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>

            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded-full ring-2 ring-gray-100" } }} />
            ) : (
              <div className="flex items-center gap-1.5">
                <SignInButton mode="modal">
                  <button className="text-[13px] font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors px-3 py-1.5 rounded-full hover:bg-[#0071e3]/5">Sign In</button>
                </SignInButton>
                <Link to="/login" className="rounded-full bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 px-4 py-1.5 text-[13px] font-medium text-white shadow-sm hover:shadow-md">
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Nav (Desktop) */}
        <div className="hidden md:flex mx-auto max-w-[1200px] border-t border-gray-100/60">
          <nav className="flex items-center w-full px-4 sm:px-6 lg:px-8 py-2">
            {/* Category Pills */}
            <div className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar pr-4">
              <NavLink to="/equipment" end className={({ isActive }) => `px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}`}>
                All Products
              </NavLink>
              <NavLink to="/pricing" className={({ isActive }) => `px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}`}>
                Pricing
              </NavLink>
              <NavLink to="/blog/booking-conflict-detection" className={({ isActive }) => `px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}`}>
                Engineering
              </NavLink>
              {CATEGORIES.map((c) => (
                <NavLink key={c.slug} to={`/equipment?category=${c.slug}`} className={({ isActive }) => `px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}`}>
                  {c.label}
                </NavLink>
              ))}
            </div>

            {/* Icon Nav */}
            <div className="flex items-center gap-0.5 pl-4 border-l border-gray-200/60 shrink-0">
              {role !== "vendor" && (
                <Link to="/login/vendor" className="text-[11px] font-semibold tracking-wide text-[#0071e3] hover:text-[#0077ed] mr-1 hover:bg-[#0071e3]/5 px-2.5 py-1.5 rounded-full transition-all duration-200">
                  {t.becomeSeller || "Become a Seller"}
                </Link>
              )}

              {isSignedIn && (
                <>
                  <NavLink to={dashboardLink} title="Dashboard" className={({ isActive }) => `p-2 rounded-full transition-all duration-200 relative ${isActive ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'}`}>
                    {role === "vendor" ? <FiPackage className="w-[18px] h-[18px]" /> : <FiUser className="w-[18px] h-[18px]" />}
                  </NavLink>
                  {role !== "vendor" && (
                    <NavLink to={BUYER_TAB_LINKS.wishlist} title="Wishlist" className="p-2 rounded-full transition-all duration-200 relative text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]">
                      <FiHeart className="w-[18px] h-[18px]" />
                      {wishlistCount > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 border-[1.5px] border-white rounded-full"></span>}
                    </NavLink>
                  )}
                  {role !== "vendor" && (
                    <NavLink to={BUYER_TAB_LINKS.cart} title="Cart" className="p-2 rounded-full transition-all duration-200 relative text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]">
                      <FiShoppingCart className="w-[18px] h-[18px]" />
                      {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-[#0071e3] text-white flex items-center justify-center text-[9px] font-bold rounded-full px-1 border-[1.5px] border-white">{cartCount}</span>}
                    </NavLink>
                  )}
                  <NavLink to={role === "buyer" ? BUYER_TAB_LINKS.messages : `${dashboardLink}#messages`} title="Messages" className="p-2 rounded-full transition-all duration-200 relative text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]">
                    <FiMessageSquare className="w-[18px] h-[18px]" />
                    {unreadMessages > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white flex items-center justify-center text-[9px] font-bold rounded-full px-1 border-[1.5px] border-white">{unreadMessages}</span>}
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-gray-200/40 safe-area-pb">
        <div className="flex items-center justify-around h-14 px-1">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 gap-0.5 transition-colors duration-200 ${isActive ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
            <FiGrid className="w-[20px] h-[20px]" />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>
          <NavLink to="/equipment" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 gap-0.5 transition-colors duration-200 ${isActive ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
            <FiSearch className="w-[20px] h-[20px]" />
            <span className="text-[10px] font-medium">Search</span>
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 gap-0.5 transition-colors duration-200 ${isActive ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
            <FiPackage className="w-[20px] h-[20px]" />
            <span className="text-[10px] font-medium">Pricing</span>
          </NavLink>
          {role !== "vendor" && isSignedIn && (
            <NavLink to={BUYER_TAB_LINKS.cart} className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 gap-0.5 transition-colors duration-200 relative ${isActive ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
              <div className="relative">
                <FiShoppingCart className="w-[20px] h-[20px]" />
                {cartCount > 0 && <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-[#0071e3] text-white flex items-center justify-center text-[8px] font-bold rounded-full border border-white">{cartCount}</span>}
              </div>
              <span className="text-[10px] font-medium">Cart</span>
            </NavLink>
          )}
          {isSignedIn && (
            <NavLink to={role === "buyer" ? BUYER_TAB_LINKS.messages : `${dashboardLink}#messages`} className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 gap-0.5 transition-colors duration-200 relative ${isActive ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
              <div className="relative">
                <FiMessageSquare className="w-[20px] h-[20px]" />
                {unreadMessages > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 border border-white rounded-full"></span>}
              </div>
              <span className="text-[10px] font-medium">Inbox</span>
            </NavLink>
          )}
          <NavLink to={dashboardLink} className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 gap-0.5 transition-colors duration-200 ${isActive ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
            <FiUser className="w-[20px] h-[20px]" />
            <span className="text-[10px] font-medium">Profile</span>
          </NavLink>
        </div>
      </div>

      {/* Mobile Top Search */}
      <div className="md:hidden fixed top-[52px] left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-200/40 px-4 py-2">
        <form onSubmit={handleSearch} className="flex relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] w-4 h-4" />
          <input
            type="text"
            placeholder={t.searchPlaceholder || "Search..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-[#f5f5f7] rounded-full h-9 pl-9 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:bg-white transition-all duration-200"
          />
        </form>
      </div>
    </>
  );
}
