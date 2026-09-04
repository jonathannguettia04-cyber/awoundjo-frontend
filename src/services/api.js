// src/services/api.js
import axios from "axios";
import { ADMIN_BASE } from "../config/adminBase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Instance AGENT (token agent) ─────────────────────────────────
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30s — Railway peut être endormi sur 1ère requête mobile
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
      window.location.href = `${ADMIN_BASE}/login`;
    }
    return Promise.reject(error);
  }
);

// ── Instance CLIENT (token client — portail adhérent) ────────────
// Séparée de l'instance agent pour éviter toute redirection vers /login agent
const clientApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
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
      window.location.href = "/client/login"; // portail client uniquement
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
  getAll:      (params)   => api.get("/agents", { params }),
  getById:     (id)       => api.get(`/agents/${id}`),
  create:      (data)     => api.post("/agents", data),
  update:      (id, data) => api.put(`/agents/${id}`, data),
  delete:      (id)       => api.delete(`/agents/${id}`),
  assignRole:  (id, role) => api.patch(`/agents/${id}/role`, { role }),
  toggleStatus:(id)       => api.patch(`/agents/${id}/toggle-status`),
};
// Alias sans "s" pour compatibilité avec Agents.jsx
export const agentAPI = agentsAPI;

// ── RÔLES & PERMISSIONS ──────────────────────────────────────────
// Préfixe séparé /api/roles (pas /api/agents/roles) — voir rolesRoutes.js
export const rolesAPI = {
  getAll:              ()               => api.get("/roles"),
  create:              (data)           => api.post("/roles", data),
  delete:              (roleId)         => api.delete(`/roles/${roleId}`),
  getAllPermissions:   ()               => api.get("/roles/permissions"),
  createPermission:    (data)           => api.post("/roles/permissions", data),
  getRolePermissions:  (roleId)         => api.get(`/roles/${roleId}/permissions`),
  setRolePermissions:  (roleId, ids)    => api.put(`/roles/${roleId}/permissions`, { permission_ids: ids }),
  getAgentPermissions: (agentId)        => api.get(`/agents/${agentId}/permissions`), // reste sous /api/agents
};

// ── CLIENTS ──────────────────────────────────────────────────────
export const clientAPI = {
  getAll:  (params)   => api.get("/clients", { params }),
  getById: (id)       => api.get(`/clients/${id}`),
  create:  (data)     => api.post("/clients", data),
  update:  (id, data) => api.put(`/clients/${id}`, data),
  delete:  (id)       => api.delete(`/clients/${id}`),
  search:        (q)        => api.get("/clients/search", { params: { q } }),
};

// ── PAIEMENTS ────────────────────────────────────────────────────
export const paymentsAPI = {
  initPayment:   (data)     => api.post("/payments/init", data),
  confirmPayment:(data)     => api.post("/payments/confirm", data),
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
  getAll:       (params)       => api.get("/groups", { params }),
  getById:      (id)           => api.get(`/groups/${id}`),
  create:       (data)         => api.post("/groups", data),
  update:       (id, data)     => api.put(`/groups/${id}`, data),
  delete:       (id)           => api.delete(`/groups/${id}`),
  // Membres — manquaient (causaient "Erreur ajout membre")
  addMembers:   (id, data)     => api.post(`/groups/${id}/members`, data),
  removeMember: (id, clientId) => api.delete(`/groups/${id}/members/${clientId}`),
  // Paiement groupe — manquait aussi
  pay:          (id, data)     => api.post(`/groups/${id}/payment`, data),
};
// Alias sans "s" pour compatibilité
export const groupAPI = groupsAPI;

// ── DASHBOARD / STATS ────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
};

// Alias utilisé par Dashboard.jsx
// La vraie route backend est /stats/dashboard (voir statsRoutes.js)
export const statsAPI = {
  getStats:     ()       => api.get("/stats/dashboard"),
  getMonthly:   (params) => api.get("/dashboard/monthly", { params }),
  getTopAgents: ()       => api.get("/dashboard/top-agents"),
  commissions:  (params) => api.get("/stats/commissions", { params }),
};
// Alias sans "s" pour compatibilité
export const statAPI = statsAPI;

// ── HEALTHCARE (réseau de soins + dossiers médicaux) ─────────────
export const healthcareAPI = {
  // Établissements
  // getProviders utilise clientApi → token client, redirige vers /client/login si 401
  getProviders:    (params)         => clientApi.get("/healthcare/providers", { params }),
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


// ── AYANTS DROIT (admin) ─────────────────────────────────────────
export const depsAPI = {
  getByClient:       (clientId)       => api.get(`/clients/${clientId}/dependents`),
  update:            (depId, data)    => api.put(`/dependents/${depId}`, data),
  deleteWithPassword:(depId, password)=> api.delete(`/dependents/${depId}`, { data: { adminPassword: password } }),
};

export default api;