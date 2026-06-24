import { Link } from "react-router-dom";
import { FiHeart, FiMapPin } from "react-icons/fi";
import { FaStar } from "react-icons/fa";

// Format money values to Indian Rupees
function formatCurrency(value) {
  // Set to 0 if no value is provided, then convert to a Number
  const numericValue = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export default function EquipmentCard({ equipment }) {
  // ==========================================
  // 1. DATA PREPARATION & LOGIC
  // ==========================================

  // Figure out if the equipment is available
  let isAvailable = false;

  if (typeof equipment.is_available === "boolean") {
    isAvailable = equipment.is_available;
  } else {
    // If it's not a true/false value, check if we have more than 0 in quantity
    isAvailable = Number(equipment.quantity || 0) > 0;
  }

  // Get ratings and review counts (default to 0 if they don't exist)
  const rating = equipment.average_rating || 0;
  const reviewCount = equipment.review_count || 0;

  // ==========================================
  // 2. EVENT HANDLERS
  // ==========================================

  const handleWishlistClick = (e) => {
    e.preventDefault(); // Prevents the main link from being clicked when interacting with the heart
  };

  const handleMouseEnter = (e) => {
    // Add a deeper shadow when hovering
    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';

    // Only "lift" the card if the item is actually available to click
    if (isAvailable) {
      e.currentTarget.style.transform = 'translateY(-4px)';
    }
  };

  const handleMouseLeave = (e) => {
    // Reset the shadow and position when the mouse leaves
    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  // ==========================================
  // 3. CARD INNER CONTENT (Reusable UI Block)
  // ==========================================

  const cardContent = (
    <>
      {/* ----- TOP HALF: Image & Badges ----- */}
      <div className="position-relative aspect-square w-100 overflow-hidden bg-surface">

        {/* If we have an image, show it. Otherwise, show a placeholder. */}
        {equipment.image_url ? (
          <img
            src={equipment.image_url}
            alt={equipment.name}
            className="w-100 h-100 object-cover transition-transform duration-700"
            style={{ transformOrigin: 'center' }}
          />
        ) : (
          <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted-custom gap-2">
            <div className="d-flex align-items-center justify-content-center bg-white rounded-2xl" style={{ width: '3.5rem', height: '3.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <span className="text-lg fw-bold" style={{ color: '#d1d5db' }}>RH</span>
            </div>
            <span className="text-2xs fw-semibold text-muted-custom">No Image</span>
          </div>
        )}

        {/* Bottom gradient overlay to make text pop against the image */}
        <div className="position-absolute inset-x-0 bottom-0 transition-opacity" style={{ height: '5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)', opacity: 0 }} />

        {/* Wishlist Heart Button */}
        <button
          className="position-absolute d-flex align-items-center justify-content-center rounded-circle glass transition-all z-10"
          style={{ top: '0.75rem', right: '0.75rem', width: '2rem', height: '2rem', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
          onClick={handleWishlistClick}
        >
          <FiHeart
            style={{ width: '15px', height: '15px' }}
            className={equipment.is_wishlisted ? "text-danger" : ""}
            fill={equipment.is_wishlisted ? "currentColor" : "none"}
          />
        </button>

        {/* Top Left Badge: Available vs Unavailable */}
        <div className="position-absolute" style={{ top: '0.75rem', left: '0.75rem' }}>
          {isAvailable ? (
            <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill glass-surface text-2xs fw-semibold tracking-wider text-uppercase" style={{ color: '#15803d', boxShadow: 'var(--shadow-sm)' }}>
              <span className="rounded-circle animate-pulse" style={{ width: '0.375rem', height: '0.375rem', backgroundColor: '#22c55e' }}></span>
              Available
            </span>
          ) : (
            <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill glass-surface text-2xs fw-semibold tracking-wider text-uppercase" style={{ color: '#ea580c', boxShadow: 'var(--shadow-sm)' }}>
              <span className="rounded-circle" style={{ width: '0.375rem', height: '0.375rem', backgroundColor: '#f97316' }}></span>
              Unavailable
            </span>
          )}
        </div>
      </div>

      {/* ----- BOTTOM HALF: Text Details ----- */}
      <div className="d-flex flex-column flex-grow-1 p-3">

        {/* Category Name */}
        <span className="text-2xs fw-semibold text-brand text-uppercase tracking-wider mb-1">
          {equipment.category || "Equipment"}
        </span>

        {/* Equipment Title */}
        <h3 className="fw-semibold leading-snug text-ink line-clamp-2 mb-2" style={{ fontSize: '16px' }}>
          {equipment.name}
        </h3>

        {/* Star Ratings Section */}
        {reviewCount > 0 && (
          <div className="d-flex align-items-center gap-1 mb-3">
            <div className="d-flex align-items-center gap-0">

              {/* Loop to generate exactly 5 stars */}
              {[1, 2, 3, 4, 5].map(starNumber => {
                // If the star number is less than or equal to the rating, color it orange
                const isFilledStar = starNumber <= Math.round(rating);

                return (
                  <FaStar
                    key={starNumber}
                    style={{ width: '0.75rem', height: '0.75rem', color: isFilledStar ? '#fb923c' : '#e5e7eb' }}
                  />
                );
              })}

            </div>
            <span className="text-2xs fw-medium text-muted-custom ms-1">({reviewCount})</span>
          </div>
        )}

        {/* Location & Price (Pushed to the bottom of the card) */}
        <div className="mt-auto pt-3">

          <div className="d-flex align-items-center gap-1 text-2xs fw-medium text-muted-custom mb-3">
            <FiMapPin style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0 }} />
            <span className="text-truncate">{equipment.location || "Multiple Locations"}</span>
          </div>

          <div className="d-flex align-items-baseline gap-1">
            <span className="text-xl fw-bold tracking-tight text-ink">
              {formatCurrency(equipment.price_per_day)}
            </span>
            <span className="text-xs text-muted-custom fw-medium">/day</span>
          </div>

        </div>
      </div>
    </>
  );

  // ==========================================
  // 4. FINAL COMPONENT RENDER
  // ==========================================

  // Decide what CSS classes the main wrapper needs
  const wrapperClasses = `group position-relative d-flex flex-column bg-white rounded-2xl overflow-hidden transition-all duration-500 will-change-transform ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
    }`;

  return (
    <div
      className={wrapperClasses}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >

      {/* Dark overlay that blocks out the card if the item is unavailable */}
      {!isAvailable && (
        <div className="position-absolute inset-0 z-20 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-surface rounded-2xl px-4 py-2" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <span className="text-sm fw-semibold text-uppercase tracking-wider" style={{ color: '#1f2937' }}>Unavailable</span>
          </div>
        </div>
      )}

      {/* If available, wrap the contents in a clickable Link. If not, just show them inside a div. */}
      {isAvailable ? (
        <Link to={`/equipment/${equipment.id}`} className="contents">
          {cardContent}
        </Link>
      ) : (
        <div className="contents">
          {cardContent}
        </div>
      )}

    </div>
  );
}