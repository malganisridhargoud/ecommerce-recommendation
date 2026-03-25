import axios from "axios";

function getApiBaseUrl() {
  const craUrl = process.env.REACT_APP_API_URL || "";
  
  // If we have a configured URL, use it
  if (craUrl) return craUrl;

  // If we are on a production-like host (Vercel/Custom Domain), 
  // do NOT fall back to localhost automatically as it will fail anyway.
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  if (!isLocal) {
    console.warn("[API] REACT_APP_API_URL is NOT set. API calls will likely fail.");
    return "/api"; // Relative path fallback for same-origin or reverse proxy
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
  const adminToken = localStorage.getItem("admin_token");
  if (adminToken) return adminToken;
  if (!getTokenFn) return "";
  try {
    return (await getTokenFn()) || "";
  } catch {
    return "";
  }
}

apiClient.interceptors.request.use(async (config) => {
  // First, check for our custom admin token
  const adminToken = localStorage.getItem("admin_token");
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
    return config;
  }

  // Fallback to Clerk
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
  (error) => {
    let message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Something went wrong.";
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
  reviewComments: (reviewId) => apiClient.get(`/equipment/reviews/${reviewId}/comments/`),
  addReviewComment: (reviewId, data) => apiClient.post(`/equipment/reviews/${reviewId}/comments/`, data),
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
  cartCheckout: (paymentMethod = "stripe") =>
    apiClient.post("/bookings/cart/checkout/", { payment_method: paymentMethod }),
  confirmCartPayment: (paymentIntentId) =>
    apiClient.post("/bookings/cart/confirm/", { payment_intent_id: paymentIntentId }),
  complete: (id) => apiClient.post(`/bookings/${id}/complete/`),
  reportIssue: (id, data) => apiClient.post(`/bookings/${id}/issue/`, data),
};

export const chatAPI = {
  threads: () => apiClient.get("/chat/threads/"),
  createThread: (equipmentId) => apiClient.post("/chat/threads/", { equipment_id: equipmentId }),
  messages: (threadId) => apiClient.get(`/chat/threads/${threadId}/messages/`),
  sendMessage: (threadId, data) => apiClient.post(`/chat/threads/${threadId}/messages/`, data),
  faq: () => apiClient.get("/chat/faq/"),
  askAssistant: (question) => apiClient.post("/chat/assistant/", { question }),
};

// ── Payments ────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  createIntent: (bookingId) => apiClient.post(`/payments/intent/${bookingId}/`),
  confirmIntent: (paymentIntentId) => apiClient.post("/payments/confirm/", { payment_intent_id: paymentIntentId }),
  createCheckout: () => apiClient.post("/payments/checkout/"),
  confirmSubscriptionSession: (sessionId) => apiClient.post("/payments/confirm-subscription-session/", { session_id: sessionId }),
  payouts: () => apiClient.get("/payments/payouts/"),
  bankAccount: () => apiClient.get("/payments/bank/"),
  saveBankAccount: (data) => apiClient.post("/payments/bank/", data),
  updateBankAccount: (data) => apiClient.put("/payments/bank/", data),
  schedulePayout: () => apiClient.post("/payments/payouts/schedule/"),
};
export const subscriptionAPI = {
  tiers: () => apiClient.get("/subscriptions/tiers/"),
  me: () => apiClient.get("/subscriptions/me/"),
  upgrade: (data) => apiClient.post("/subscriptions/upgrade/", data),
  usage: () => apiClient.post("/subscriptions/usage/"),
  cancel: () => apiClient.post("/subscriptions/cancel/"),
};
export const controlAPI = {
  equipment: (params) => apiClient.get("/control/equipment/", { params }),
  moderate: (id, data) => apiClient.post(`/control/equipment/${id}/moderate/`, data),
  vendors: (params) => apiClient.get("/control/vendors/", { params }),
  kycApprove: (id, data) => apiClient.post(`/control/vendors/kyc/${id}/approve/`, data),
  kycSubmit: (data) => apiClient.post("/control/vendors/kyc/submit/", data),
  userAction: (data) => apiClient.post("/control/users/action/", data),
};
export const disputeAPI = {
  list: () => apiClient.get("/control/disputes/"),
  create: (data) => apiClient.post("/control/disputes/", data),
};
export const supportAPI = {
  tickets: () => apiClient.get("/control/support/tickets/"),
  createTicket: (data) => apiClient.post("/control/support/tickets/", data),
};

// ── Recommendations ──────────────────────────────────────────────────────────
export const recommendationsAPI = {
  similar: (equipmentId) => apiClient.get(`/recommendations/similar/${equipmentId}/`),
  forMe: () => apiClient.get("/recommendations/for-me/"),
  train: () => apiClient.post("/recommendations/train/"),
};

// ── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  vendor: () => apiClient.get("/analytics/vendor/"),
  admin: () => apiClient.get("/analytics/admin/"),
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
  adminLogin: (data) => apiClient.post("/users/admin/login/", data),
  list: () => apiClient.get("/control/vendors/"),
};

export default apiClient;
