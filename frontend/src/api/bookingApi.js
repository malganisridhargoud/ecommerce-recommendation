import apiClient from "./axiosConfig";

export const createBooking = (data) => apiClient.post("/bookings/create/", data);
export const getMyBookings = () => apiClient.get("/bookings/mine/");
export const getBooking = (id) => apiClient.get(`/bookings/${id}/`);
export const cancelBooking = (id) => apiClient.post(`/bookings/${id}/cancel/`);
export const getVendorBookings = () => apiClient.get("/bookings/vendor/");
export const vendorBookingAction = (id, action) => apiClient.post(`/bookings/${id}/${action}/`);
export const getBookingAvailability = (equipmentId, month, year) => 
  apiClient.get(`/bookings/availability/${equipmentId}/`, { params: { month, year } });
