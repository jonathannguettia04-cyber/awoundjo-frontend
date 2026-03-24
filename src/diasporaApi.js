// src/diasporaApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const diasporaApi = axios.create({
  baseURL: `${API_URL}/api/diaspora`,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

diasporaApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("diaspora_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

diasporaApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("diaspora_token");
      localStorage.removeItem("diaspora_data");
      window.location.href = "/diaspora/login";
    }
    return Promise.reject(error);
  }
);

export const diasporaAuthAPI = {
  register: (data) => diasporaApi.post("/register", data),
  login:    (data) => diasporaApi.post("/login", data),
  me:       ()     => diasporaApi.get("/me"),
  update:   (data) => diasporaApi.put("/me", data),
};

export const diasporaDashAPI = {
  stats: () => diasporaApi.get("/dashboard"),
};

export const diasporaBeneAPI = {
  create:  (data) => diasporaApi.post("/beneficiaries", data),
  getAll:  (p)    => diasporaApi.get("/beneficiaries", { params: p }),
  getById: (id)   => diasporaApi.get(`/beneficiaries/${id}`),
};

export const diasporaPayAPI = {
  initiate: (data) => diasporaApi.post("/payments", data),
  confirm:  (data) => diasporaApi.post("/payments/confirm", data),
  getAll:   ()     => diasporaApi.get("/payments"),
};

export const diasporaCommAPI = {
  getAll: () => diasporaApi.get("/commissions"),
};

export const diasporaRefAPI = {
  getLink:    () => diasporaApi.get("/referral-link"),
  getReferrals: () => diasporaApi.get("/referrals"),
};

// Helpers
export function diasporaLogin(token, data) {
  localStorage.setItem("diaspora_token", token);
  localStorage.setItem("diaspora_data",  JSON.stringify(data));
}
export function diasporaLogout() {
  localStorage.removeItem("diaspora_token");
  localStorage.removeItem("diaspora_data");
  window.location.href = "/diaspora/login";
}
export function getDiasporaData() {
  try { return JSON.parse(localStorage.getItem("diaspora_data")); }
  catch { return null; }
}

export default diasporaApi;
