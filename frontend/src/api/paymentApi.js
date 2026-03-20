import apiClient from "./axiosConfig";

export const createPaymentIntent = (bookingId) => apiClient.post(`/payments/intent/${bookingId}/`);
export const confirmPaymentIntent = (paymentIntentId) =>
  apiClient.post("/payments/confirm/", { payment_intent_id: paymentIntentId });
export const createSubscription = (data) => apiClient.post("/payments/subscribe/", data);
export const createCheckoutSession = () => apiClient.post("/payments/create-checkout/");
