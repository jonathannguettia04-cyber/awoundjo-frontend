import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  me:    ()     => api.get("/auth/me"),
};

export const agentAPI = {
  create: (data)     => api.post("/agents", data),
  getAll: ()         => api.get("/agents"),
  update: (id, data) => api.put(`/agents/${id}`, data),
};

export const clientAPI = {
  create:  (data)        => api.post("/clients", data),
  getAll:  (params = {}) => api.get("/clients", { params }),
  getById: (id)          => api.get(`/clients/${id}`),
  update:  (id, data)    => api.put(`/clients/${id}`, data),
};

export const paymentAPI = {
  create:      (data)        => api.post("/payments", data),
  getAll:      (params = {}) => api.get("/payments", { params }),
  getWaveLink: (data)        => api.post("/payments/wave-link", data),
};

export const groupAPI = {
  create:       (data)        => api.post("/groups", data),
  getAll:       ()            => api.get("/groups"),
  getById:      (id)          => api.get(`/groups/${id}`),
  addMembers:   (id, data)    => api.post(`/groups/${id}/members`, data),
  removeMember: (id, cid)     => api.delete(`/groups/${id}/members/${cid}`),
  pay:          (id, data)    => api.post(`/groups/${id}/payment`, data),
};

export const statsAPI = {
  dashboard:   ()            => api.get("/stats/dashboard"),
  commissions: (params = {}) => api.get("/stats/commissions", { params }),
};

export default api;
