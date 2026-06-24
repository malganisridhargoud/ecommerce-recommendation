import axios from "axios";

export function getApiBaseUrl() {
  let craUrl = process.env.REACT_APP_API_URL || "";
  
  // If we have a configured URL, normalize it
  if (craUrl) {
    // Add /api if it's missing at the end
    if (!craUrl.toLowerCase().endsWith("/api") && !craUrl.toLowerCase().endsWith("/api/")) {
      craUrl = craUrl.endsWith("/") ? `${craUrl}api` : `${craUrl}/api`;
    }
    return craUrl;
  }

  // If we are on a production-like host (Vercel/Custom Domain)
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isLocal) {
    return "/api"; 
  }

  return "http://localhost:8000/api";
}

const API_URL = getApiBaseUrl();
console.log(`[API] Base URL: ${API_URL}`);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach Clerk JWT on every request
let getTokenFn = null;

export function setTokenGetter(fn) {
  getTokenFn = fn;
}

export async function getAccessToken() {
  if (!getTokenFn) return "";
  try {
    return (await getTokenFn()) || "";
  } catch {
    return "";
  }
}

apiClient.interceptors.request.use(async (config) => {
  if (config.__skipAuth) return config;

  // Fetch Clerk token
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Unauthenticated request — let it through (public endpoints)
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error.response?.status;
    const originalConfig = error.config || {};

    // Retry any 401 once without auth headers.
    // Covers two cases:
    //   1. We sent a stale/invalid Clerk token → retry anonymously
    //   2. Backend required auth but we were unauthenticated → let AllowAny endpoints work
    if (status === 401 && !originalConfig.__isRetry) {
      originalConfig.__isRetry = true;
      originalConfig.__skipAuth = true;
      // Clear any auth header that might have caused the 401
      try {
        delete originalConfig.headers.Authorization;
        if (originalConfig.headers.authorization) delete originalConfig.headers.authorization;
      } catch {
        // ignore
      }
      // If the retry also returns 401, it means auth is genuinely required
      // — that error will fall through to the message builder below
      return apiClient.request(originalConfig);
    }

    let message;

    // Network/CORS/connection failure (no HTTP response)
    if (!error.response) {
      message = `Network error contacting API at ${API_URL}. Is the backend running and CORS configured?`;
    } else {
      message =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Something went wrong.";
    }
    if (typeof message !== "string") {
      try { message = JSON.stringify(message); } catch { message = "Something went wrong."; }
    }
    return Promise.reject(new Error(message));
  }
);

// ── Equipment ──────────────────────────────────────────────────────────────
export const equipmentAPI = {
  list: (params) => apiClient.get("/equipment/", { params }),
  detail: (id) => apiClient.get(`/equipment/${id}/`),
  create: (data) => apiClient.post("/equipment/create/", data),
  update: (id, data) => apiClient.patch(`/equipment/${id}/manage/`, data),
  delete: (id) => apiClient.delete(`/equipment/${id}/manage/`),
  mine: () => apiClient.get("/equipment/mine/"),
  reviews: (equipmentId) => apiClient.get(`/equipment/${equipmentId}/reviews/`),
  addReview: (equipmentId, data) => apiClient.post(`/equipment/${equipmentId}/reviews/`, data),
  vendorReviews: () => apiClient.get("/equipment/reviews/mine/"),
  buyerReviews: () => apiClient.get("/equipment/reviews/my/"),
  vendorReplyReview: (reviewId, vendorReply) =>
    apiClient.post(`/equipment/reviews/${reviewId}/reply/`, { vendor_reply: vendorReply }),

  wishlist: () => apiClient.get("/equipment/wishlist/"),
  addToWishlist: (equipmentId) => apiClient.post("/equipment/wishlist/", { equipment_id: equipmentId }),
  removeFromWishlist: (equipmentId) => apiClient.delete(`/equipment/wishlist/${equipmentId}/`),
  cart: () => apiClient.get("/equipment/cart/"),
  addToCart: (data) => apiClient.post("/equipment/cart/", data),
  updateCartItem: (id, data) => apiClient.patch(`/equipment/cart/${id}/`, data),
  removeCartItem: (id) => apiClient.delete(`/equipment/cart/${id}/`),
  seedVendorProducts: () => apiClient.post("/equipment/seed-sample/"),
};

// ── Bookings ────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  create: (data) => apiClient.post("/bookings/create/", data),
  mine: () => apiClient.get("/bookings/mine/"),
  detail: (id) => apiClient.get(`/bookings/${id}/`),
  cancel: (id) => apiClient.post(`/bookings/${id}/cancel/`),
  vendorAction: (id, action) => apiClient.post(`/bookings/${id}/${action}/`),
  availability: (equipmentId, month, year) =>
    apiClient.get(`/bookings/availability/${equipmentId}/`, { params: { month, year } }),
  vendorBookings: () => apiClient.get("/bookings/vendor/"),
  cartCheckout: (paymentMethod = "stripe", shippingAddress = null) =>
    apiClient.post("/bookings/cart/checkout/", {
      payment_method: paymentMethod,
      shipping_address: shippingAddress || undefined,
    }),
  confirmCartPayment: (paymentIntentId) =>
    apiClient.post("/bookings/cart/confirm/", { payment_intent_id: paymentIntentId }),
  complete: (id) => apiClient.post(`/bookings/${id}/complete/`),
  reportIssue: (id, data) => apiClient.post(`/bookings/${id}/issue/`, data),
};

// ── Payments ────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  createIntent: (bookingId) => apiClient.post(`/payments/intent/${bookingId}/`),
  confirmIntent: (paymentIntentId) => apiClient.post("/payments/confirm/", { payment_intent_id: paymentIntentId }),
  createCheckout: () => apiClient.post("/payments/checkout/"),
  confirmSubscriptionSession: (sessionId) => apiClient.post("/payments/confirm-subscription-session/", { session_id: sessionId }),
};
export const controlAPI = {
  equipment: (params) => apiClient.get("/control/equipment/", { params }),
  moderate: (id, data) => apiClient.post(`/control/equipment/${id}/moderate/`, data),
  vendors: (params) => apiClient.get("/control/vendors/", { params }),

  userAction: (data) => apiClient.post("/control/users/action/", data),
};





// ── Vendor profile ────────────────────────────────────────────────────────────
export const vendorAPI = {
  profile: () => apiClient.get("/vendors/profile/"),
  updateProfile: (data) => apiClient.patch("/vendors/profile/", data),
};

export const usersAPI = {
  me: () => apiClient.get("/users/me/"),
  updateMe: (data) => apiClient.patch("/users/me/", data),
  setRole: (data) => apiClient.post("/users/role/", data),
  roleSync: (role = "buyer") => apiClient.post("/users/role/sync/", { role }),
  addresses: () => apiClient.get("/users/addresses/"),
  createAddress: (data) => apiClient.post("/users/addresses/", data),
  updateAddress: (id, data) => apiClient.patch(`/users/addresses/${id}/`, data),
  deleteAddress: (id) => apiClient.delete(`/users/addresses/${id}/`),
};

export default apiClient;
