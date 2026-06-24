import { Link, NavLink, useNavigate } from "react-router-dom";
import { SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { equipmentAPI, usersAPI } from "../../api/axiosConfig";
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

const ROLE_DASH = { buyer: "/buyer", vendor: "/vendor" };
const BUYER_TAB_LINKS = {
  wishlist: "/buyer?tab=wishlist",
  cart: "/buyer?tab=cart",
  messages: "/buyer?tab=chat",
};

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { language, setLanguage, location, setLocation, languageOptions, t, cartCount, setCartCount } = useAppPreferences();
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
        setCartCount(0);
        return;
      }
      try {
        const [me, wl, cart] = await Promise.all([
          usersAPI.me(),
          equipmentAPI.wishlist().catch(() => []),
          equipmentAPI.cart().catch(() => []),
        ]);
        if (!mounted) return;
        setRole(me?.role || "buyer");
        setWishlistCount(Array.isArray(wl) ? wl.length : 0);
        const cartList = Array.isArray(cart) ? cart : [];
        setCartCount(cartList.reduce((acc, item) => acc + item.quantity, 0));
      } catch {
        if (mounted) setRole("buyer");
      }
    }
    hydrate();
    return () => { mounted = false; };
  }, [isSignedIn, setCartCount]);

  const dashboardLink = useMemo(() => ROLE_DASH[role] || "/buyer", [role]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/equipment?search=${encodeURIComponent(searchInput)}`);
    } else {
      navigate(`/equipment`);
    }
  };

  const openCartDrawer = async () => {
    if (!isSignedIn || role === "vendor") return;
    try {
      const cart = await equipmentAPI.cart().catch(() => []);
      const cartList = Array.isArray(cart) ? cart : [];
      setCartCount(cartList.reduce((acc, item) => acc + Number(item.quantity || 0), 0));
    } catch {
      // keep existing snapshot on failure
    }
  };

  return (
    <>
      <header className="fixed-top bg-white border-bottom shadow-sm">
        <div className="container py-2 d-flex align-items-center justify-content-between gap-3">
          
          {/* Logo */}
          <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
            <div className="bg-primary text-white fw-bold rounded px-2 py-1">TR</div>
            <span className="fw-bold text-dark fs-5 d-none d-sm-block">TapRent</span>
          </Link>

          {/* Search & Location Bar */}
          <div className="d-none d-md-flex flex-grow-1 gap-2">
            <form onSubmit={handleSearch} className="flex-grow-1 position-relative">
              <FiSearch className="position-absolute top-50 translate-middle-y ms-3 text-secondary" />
              <input
                type="text"
                placeholder={t.searchPlaceholder || "Search equipment..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="form-control rounded-pill ps-5"
              />
            </form>
            <div className="position-relative" style={{ width: "200px" }}>
              <FiMapPin className="position-absolute top-50 translate-middle-y ms-3 text-secondary" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.location || "Location..."}
                className="form-control rounded-pill ps-5"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="d-flex align-items-center gap-3">
            <select
              className="form-select form-select-sm border-0 d-none d-sm-block w-auto"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languageOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>

            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="d-flex align-items-center gap-2">
                <SignInButton mode="modal">
                  <button className="btn btn-link text-dark text-decoration-none fw-medium">Sign In</button>
                </SignInButton>
                <Link to="/login" className="btn btn-primary rounded-pill px-4">Join</Link>
              </div>
            )}
          </div>
        </div>

        {/* Categories Navigation */}
        <div className="d-none d-md-block border-top bg-light">
          <div className="container py-2 d-flex align-items-center justify-content-between">
            <div className="d-flex gap-2 overflow-auto no-scrollbar">
              <NavLink 
                to="/equipment" 
                end 
                className={({ isActive }) => `btn btn-sm rounded-pill ${isActive ? 'btn-dark' : 'btn-outline-secondary border-0'}`}
              >
                All Products
              </NavLink>
              {CATEGORIES.map((c) => (
                <NavLink
                  key={c.slug}
                  to={`/equipment?category=${c.slug}`}
                  className={({ isActive }) => `btn btn-sm rounded-pill ${isActive ? 'btn-dark' : 'btn-outline-secondary border-0'}`}
                >
                  {c.label}
                </NavLink>
              ))}
            </div>

            <div className="d-flex align-items-center gap-3">
              {role !== "vendor" && (
                <Link to="/login/vendor" className="btn btn-sm btn-outline-primary rounded-pill">
                  Become a Seller
                </Link>
              )}
              {isSignedIn && (
                <div className="d-flex align-items-center gap-2">
                  <NavLink to={dashboardLink} className="btn btn-sm btn-light rounded-circle">
                    {role === "vendor" ? <FiPackage size={18} /> : <FiUser size={18} />}
                  </NavLink>
                  {role !== "vendor" && (
                    <NavLink to={BUYER_TAB_LINKS.wishlist} className="btn btn-sm btn-light rounded-circle position-relative">
                      <FiHeart size={18} />
                      {wishlistCount > 0 && <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>}
                    </NavLink>
                  )}
                  {role !== "vendor" && (
                    <button onClick={openCartDrawer} className="btn btn-sm btn-light rounded-circle position-relative">
                      <FiShoppingCart size={18} />
                      {cartCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">{cartCount}</span>}
                    </button>
                  )}
                  <NavLink to={role === "buyer" ? BUYER_TAB_LINKS.messages : `${dashboardLink}#messages`} className="btn btn-sm btn-light rounded-circle">
                    <FiMessageSquare size={18} />
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <div className="d-md-none fixed-bottom bg-white border-top py-2">
        <div className="d-flex justify-content-around align-items-center">
          <NavLink to="/" className={({ isActive }) => `d-flex flex-column align-items-center text-decoration-none ${isActive ? 'text-primary' : 'text-secondary'}`}>
            <FiGrid size={20} />
            <span style={{ fontSize: '10px' }}>Home</span>
          </NavLink>
          <NavLink to="/equipment" className={({ isActive }) => `d-flex flex-column align-items-center text-decoration-none ${isActive ? 'text-primary' : 'text-secondary'}`}>
            <FiSearch size={20} />
            <span style={{ fontSize: '10px' }}>Search</span>
          </NavLink>

          {role !== "vendor" && isSignedIn && (
            <NavLink to={BUYER_TAB_LINKS.cart} className={({ isActive }) => `d-flex flex-column align-items-center text-decoration-none ${isActive ? 'text-primary' : 'text-secondary'} position-relative`}>
              <FiShoppingCart size={20} />
              {cartCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '8px' }}>{cartCount}</span>}
              <span style={{ fontSize: '10px' }}>Cart</span>
            </NavLink>
          )}

          {isSignedIn && (
            <NavLink to={role === "buyer" ? BUYER_TAB_LINKS.messages : `${dashboardLink}#messages`} className={({ isActive }) => `d-flex flex-column align-items-center text-decoration-none ${isActive ? 'text-primary' : 'text-secondary'}`}>
              <FiMessageSquare size={20} />
              <span style={{ fontSize: '10px' }}>Inbox</span>
            </NavLink>
          )}

          <NavLink to={dashboardLink} className={({ isActive }) => `d-flex flex-column align-items-center text-decoration-none ${isActive ? 'text-primary' : 'text-secondary'}`}>
            <FiUser size={20} />
            <span style={{ fontSize: '10px' }}>Profile</span>
          </NavLink>
        </div>
      </div>
    </>
  );
}
