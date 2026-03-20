import apiClient from "./axiosConfig";

export const listEquipments = (params) => apiClient.get("/equipment/", { params });
export const getEquipment = (id) => apiClient.get(`/equipment/${id}/`);
export const createEquipment = (data) => apiClient.post("/equipment/create/", data);
export const updateEquipment = (id, data) => apiClient.patch(`/equipment/${id}/manage/`, data);
export const deleteEquipment = (id) => apiClient.delete(`/equipment/${id}/manage/`);
export const getMyEquipment = () => apiClient.get("/equipment/mine/");
