import apiClient from "./axiosConfig";

export const getMe = () => apiClient.get("/users/me/");
export const setRole = (payload) => apiClient.post("/users/role/", payload);
