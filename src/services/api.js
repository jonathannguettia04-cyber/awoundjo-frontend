import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Injection automatique du JWT ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Gestion des erreurs globales ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  me:    ()     => api.get("/auth/me"),
};

// ── Agents ────────────────────────────────────────────────────
export const agentAPI = {
  create: (data)     => api.post("/agents", data),
  getAll: ()         => api.get("/agents"),
  update: (id, data) => api.put(`/agents/${id}`, data),
};

// ── Clients ───────────────────────────────────────────────────
export const clientAPI = {
  create:  (data)        => api.post("/clients", data),
  getAll:  (params = {}) => api.get("/clients", { params }),
  getById: (id)          => api.get(`/clients/${id}`),
  update:  (id, data)    => api.put(`/clients/${id}`, data),
};

// ── Paiements ─────────────────────────────────────────────────
export const paymentAPI = {
  create:      (data)        => api.post("/payments", data),
  getAll:      (params = {}) => api.get("/payments", { params }),
  getWaveLink: (data)        => api.post("/payments/wave-link", data),
};

// ── Stats ─────────────────────────────────────────────────────
export const statsAPI = {
  dashboard:   ()              => api.get("/stats/dashboard"),
  commissions: (params = {})   => api.get("/stats/commissions", { params }),
};

export default api;