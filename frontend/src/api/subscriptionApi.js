import axiosInstance from './axiosConfig';

export const subscriptionAPI = {
  tiers: () => axiosInstance.get('/api/subscriptions/tiers/'),
  me: () => axiosInstance.get('/api/subscriptions/me/'),
  upgrade: (data) => axiosInstance.post('/api/subscriptions/upgrade/', data),
  usage: () => axiosInstance.post('/api/subscriptions/usage/'),
  cancel: () => axiosInstance.post('/api/subscriptions/cancel/'),
};

