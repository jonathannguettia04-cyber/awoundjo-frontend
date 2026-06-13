// src/medecinApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://YOUR-BACKEND.up.railway.app/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medecin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth (réutilise l'endpoint providers/login existant) ──────
export const medecinAuthAPI = {
  login: (login, password) =>
    api.post("/provider/login", { login, password }).then((res) => {
      localStorage.setItem("medecin_token", res.data.token);
      localStorage.setItem("medecin_info", JSON.stringify(res.data.provider));
      return res;
    }),
  logout: () => {
    localStorage.removeItem("medecin_token");
    localStorage.removeItem("medecin_info");
  },
  getInfo: () => JSON.parse(localStorage.getItem("medecin_info") || "null"),
};

// ─── Téléconsultations ──────────────────────────────────────────
export const medecinTeleAPI = {
  getQueue:    () => api.get("/provider/teleconsult/queue"),
  getMine:     () => api.get("/provider/teleconsult/mine"),
  getClosed:   () => api.get("/provider/teleconsult/closed"),
  claim:       (id) => api.post(`/provider/teleconsult/${id}/claim`),
  release:     (id) => api.post(`/provider/teleconsult/${id}/release`),
  getMessages: (id) => api.get(`/provider/teleconsult/${id}/messages`),
  sendMessage: (id, message) => api.post(`/provider/teleconsult/${id}/messages`, { message }),
  close:       (id) => api.post(`/provider/teleconsult/${id}/close`),
  getPrescription:    (id) => api.get(`/provider/teleconsult/${id}/prescription`),
  createPrescription: (id, data) => api.post(`/provider/teleconsult/${id}/prescription`, data),
};

export default api;
