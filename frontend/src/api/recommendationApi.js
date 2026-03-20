import apiClient from "./axiosConfig";

export const getRecommendations = (equipmentId) => 
  apiClient.get(`/recommendations/similar/${equipmentId}/`);
export const getPersonalizedRecommendations = () => 
  apiClient.get("/recommendations/for-me/");
export const trainRecommendationModel = () =>
  apiClient.post("/recommendations/train/");
