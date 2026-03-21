import { Link } from "react-router-dom";
import { FiHeart, FiMapPin } from "react-icons/fi";
import { FaStar } from "react-icons/fa";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function EquipmentCard({ equipment }) {
  const available = typeof equipment.is_available === "boolean"
    ? equipment.is_available
    : Number(equipment.quantity || 0) > 0;

  const rating = equipment.average_rating || 0;
  const reviewCount = equipment.review_count || 0;

  const cardInner = (
    <>
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f5f5f7]">
        {equipment.image_url ? (
          <img
            src={equipment.image_url}
            alt={equipment.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-lg font-bold text-gray-200">RH</span>
            </div>
            <span className="text-[11px] font-medium text-[#86868b]">No Image</span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Wishlist */}
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/70 backdrop-blur-xl flex items-center justify-center text-[#86868b] hover:text-red-500 hover:bg-white transition-all duration-200 shadow-sm z-10"
          onClick={(e) => { e.preventDefault(); }}
        >
          <FiHeart className={`w-[15px] h-[15px] ${equipment.is_wishlisted ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Availability Badge */}
        <div className="absolute top-3 left-3">
          {available ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xl text-[10px] font-semibold tracking-wider text-green-700 shadow-sm uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xl text-[10px] font-semibold tracking-wider text-orange-600 shadow-sm uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Unavailable
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Category */}
        <span className="text-[10px] font-semibold text-[#0071e3] uppercase tracking-wider mb-1.5">
          {equipment.category || "Equipment"}
        </span>

        {/* Title */}
        <h3 className="font-semibold text-[16px] leading-snug text-[#1d1d1f] line-clamp-2 mb-2">
          {equipment.name}
        </h3>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center gap-0.5 text-orange-400">
              {[1, 2, 3, 4, 5].map(n => (
                <FaStar key={n} className={`w-3 h-3 ${n <= Math.round(rating) ? 'text-orange-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="text-[11px] font-medium text-[#86868b] ml-1">({reviewCount})</span>
          </div>
        )}

        {/* Bottom */}
        <div className="mt-auto pt-4">
          {/* Location */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#86868b] mb-3">
            <FiMapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{equipment.location || "Multiple Locations"}</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-[#1d1d1f]">
              {formatCurrency(equipment.price_per_day)}
            </span>
            <span className="text-[12px] text-[#86868b] font-medium">/day</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-500 ease-out will-change-transform ${available ? 'hover:-translate-y-1 cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'}
    >
      {/* Unavailable Overlay */}
      {!available && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg">
            <span className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Unavailable</span>
          </div>
        </div>
      )}

      {available ? (
        <Link to={`/equipment/${equipment.id}`} className="contents">
          {cardInner}
        </Link>
      ) : (
        <div className="contents">
          {cardInner}
        </div>
      )}
    </div>
  );
}
