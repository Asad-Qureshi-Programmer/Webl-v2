import axios from "axios";

// 🚀 SWITCH TO LOCALHOST ENVIRONMENT:
// This connects the frontend UI buttons directly to your active local workspace!
export const api = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://webl-7q46.onrender.com',
});