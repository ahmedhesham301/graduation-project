import axios from "axios";
import API_BASE from "./Api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("isSeller");
    }
    return Promise.reject(error);
  }
);