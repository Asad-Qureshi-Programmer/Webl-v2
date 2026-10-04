import axios from "axios";

// 🚀 SWITCH TO LOCALHOST ENVIRONMENT:
// This connects the frontend UI buttons directly to your active local workspace!
export const api = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://webl-v2.onrender.com',
});

api.interceptors.request.use(async (config) => {
  try {
    // Read active session token from Clerk
    if (window.Clerk && window.Clerk.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.error("Failed to attach Clerk token to request:", err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});