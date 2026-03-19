// src/services/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Instance AGENT (token agent) ─────────────────────────────────
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── AUTH AGENT ───────────────────────────────────────────────────
export const authAPI = {
  login:  (data) => api.post("/auth/login", data),
  logout: ()     => api.post("/auth/logout"),
  me:     ()     => api.get("/auth/me"),
};

// ── AGENTS ───────────────────────────────────────────────────────
export const agentsAPI = {
  getAll:  (params)   => api.get("/agents", { params }),
  getById: (id)       => api.get(`/agents/${id}`),
  create:  (data)     => api.post("/agents", data),
  update:  (id, data) => api.put(`/agents/${id}`, data),
  delete:  (id)       => api.delete(`/agents/${id}`),
};
// Alias sans "s" pour compatibilité avec Agents.jsx
export const agentAPI = agentsAPI;

// ── CLIENTS ──────────────────────────────────────────────────────
export const clientAPI = {
  getAll:  (params)   => api.get("/clients", { params }),
  getById: (id)       => api.get(`/clients/${id}`),
  create:  (data)     => api.post("/clients", data),
  update:  (id, data) => api.put(`/clients/${id}`, data),
  delete:  (id)       => api.delete(`/clients/${id}`),
  search:  (q)        => api.get("/clients/search", { params: { q } }),
};

// ── PAIEMENTS ────────────────────────────────────────────────────
export const paymentsAPI = {
  getAll:      (params)   => api.get("/payments", { params }),
  getByClient: (id)       => api.get(`/payments/client/${id}`),
  create:      (data)     => api.post("/payments", data),
  update:      (id, data) => api.put(`/payments/${id}`, data),
  delete:      (id)       => api.delete(`/payments/${id}`),
};

// Alias sans "s" pour compatibilité avec ClientDetails.jsx
export const paymentAPI = paymentsAPI;

// ── COMMISSIONS ──────────────────────────────────────────────────
export const commissionsAPI = {
  getAll:     (params) => api.get("/commissions", { params }),
  getByAgent: (id)     => api.get(`/commissions/agent/${id}`),
  validate:   (id)     => api.put(`/commissions/${id}/validate`),
};
// Alias sans "s" pour compatibilité
export const commissionAPI = commissionsAPI;

// ── GROUPES ──────────────────────────────────────────────────────
export const groupsAPI = {
  getAll:  (params)   => api.get("/groups", { params }),
  getById: (id)       => api.get(`/groups/${id}`),
  create:  (data)     => api.post("/groups", data),
  update:  (id, data) => api.put(`/groups/${id}`, data),
  delete:  (id)       => api.delete(`/groups/${id}`),
};
// Alias sans "s" pour compatibilité
export const groupAPI = groupsAPI;

// ── DASHBOARD / STATS ────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
};

// Alias utilisé par Dashboard.jsx
export const statsAPI = {
  getStats:     ()       => api.get("/stats/dashboard"),
  getMonthly:   (params) => api.get("/dashboard/monthly", { params }),
  getTopAgents: ()       => api.get("/dashboard/top-agents"),
};
// Alias sans "s" pour compatibilité
export const statAPI = statsAPI;

// ── HEALTHCARE (réseau de soins + dossiers médicaux) ─────────────
export const healthcareAPI = {
  // Établissements
  getProviders:    (params)         => api.get("/healthcare/providers", { params }),
  createProvider:  (data)           => api.post("/healthcare/providers", data),
  updateProvider:  (id, data)       => api.put(`/healthcare/providers/${id}`, data),
  deleteProvider:  (id)             => api.delete(`/healthcare/providers/${id}`),

  // Dossier médical complet
  getMedical:      (clientId)       => api.get(`/healthcare/medical/${clientId}`),
  upsertMedical:   (clientId, data) => api.put(`/healthcare/medical/${clientId}`, data),

  // Sous-sections du dossier
  addAllergy:      (clientId, data) => api.post(`/healthcare/medical/${clientId}/allergies`, data),
  addHistory:      (clientId, data) => api.post(`/healthcare/medical/${clientId}/history`, data),
  addConsultation: (clientId, data) => api.post(`/healthcare/medical/${clientId}/consultations`, data),
  addPrescription: (clientId, data) => api.post(`/healthcare/medical/${clientId}/prescriptions`, data),
  addAnalyse:      (clientId, data) => api.post(`/healthcare/medical/${clientId}/analyses`, data),
};

export default api;