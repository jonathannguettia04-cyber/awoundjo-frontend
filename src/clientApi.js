// src/clientApi.js
// Adapté à votre stack : Vite + React + Axios
// Compatible UUID (Supabase)

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Instance axios dédiée portail client (séparée de l'instance agent)
const clientApi = axios.create({
  baseURL: `${API_URL}/api/client`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("client_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

clientApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("client_token");
      localStorage.removeItem("client_data");
      window.location.href = "/client/login";
    }
    return Promise.reject(error);
  }
);

// ── AUTH ─────────────────────────────────────────────────────────
export const clientAuthAPI = {
  login:          (data) => axios.post(`${API_URL}/api/client/auth/login`, data),
  setupPassword:  (data) => axios.post(`${API_URL}/api/client/auth/setup-password`, data),
  changePassword: (data) => clientApi.post("/auth/change-password", data),
};

// ── PROFIL ───────────────────────────────────────────────────────
export const clientProfileAPI = {
  get:    ()     => clientApi.get("/profile"),
  update: (data) => clientApi.put("/profile", data),
};

// ── CARTE ────────────────────────────────────────────────────────
export const clientCardAPI = {
  get: () => clientApi.get("/card"),
};

// ── COTISATIONS ──────────────────────────────────────────────────
export const clientContribAPI = {
  get:     ()     => clientApi.get("/contributions"),
  pay:     (data) => clientApi.post("/contributions/pay", { ...data, payment_method: "CinetPay" }),
  initiate: (data) => clientApi.post("/contributions/initiate", data), // ✅ CORRECTION : route exacte du backend
  confirm: (data) => clientApi.post("/contributions/confirm", data), // ← ajoute ça
};
// ── DÉPENDANTS ───────────────────────────────────────────────────
export const clientDepsAPI = {
  get:    ()     => clientApi.get("/dependents"),
  add:    (data) => clientApi.post("/dependents", data),
  remove: (id)   => clientApi.delete(`/dependents/${id}`),
};

// ── DOSSIER MÉDICAL ──────────────────────────────────────────────
export const clientMedicalAPI = {
  get: () => clientApi.get("/medical-record"),
};

// ── TÉLÉCONSULTATION ─────────────────────────────────────────────
export const clientTeleAPI = {
  get:  ()     => clientApi.get("/teleconsultation"),
  send: (data) => clientApi.post("/teleconsultation", data),
};

// ── HELPERS ──────────────────────────────────────────────────────
export const clientLogout = () => {
  localStorage.removeItem("client_token");
  localStorage.removeItem("client_data");
  window.location.href = "/client/login";
};

export const getClientData = () => {
  const data = localStorage.getItem("client_data");
  return data ? JSON.parse(data) : null;
};

export const isClientAuth = () => !!localStorage.getItem("client_token");

export const PLANS = {
  ESSENTIELLE: { name: "Essentielle", coverage: "50%", color: "#1a56db", bg: "#EFF6FF" },
  IVOIRIENNE:  { name: "Ivoirienne",  coverage: "70%", color: "#10B981", bg: "#ECFDF5" },
  TURQUOISE:   { name: "Turquoise",   coverage: "80%", color: "#06B6D4", bg: "#ECFEFF" },
};

export const STATUS_LABELS = {
  active:           { label: "Actif",                 color: "#10B981", bg: "#ECFDF5" },
  suspended:        { label: "Suspendu",              color: "#EF4444", bg: "#FEF2F2" },
  renewal_required: { label: "Renouvellement requis", color: "#F59E0B", bg: "#FFFBEB" },
  late:             { label: "En retard",             color: "#EF4444", bg: "#FEF2F2" },
};
