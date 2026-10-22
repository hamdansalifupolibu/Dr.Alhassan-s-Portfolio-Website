import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
});

// Attach admin JWT token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach access token for past questions
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers['x-access-token'] = accessToken;
  }

  return config;
});

export default API;
