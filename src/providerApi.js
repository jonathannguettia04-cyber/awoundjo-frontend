// src/providerApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const providerApi = axios.create({
  baseURL: `${API_URL}/api/provider`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

providerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("provider_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

providerApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("provider_token");
      localStorage.removeItem("provider_data");
      window.location.href = "/etablissement";
    }
    return Promise.reject(error);
  }
);

export const providerAuthAPI = {
  login:         (data) => providerApi.post("/login", data),
  requestAccess: (data) => providerApi.post("/request-access", data),
  me:            ()     => providerApi.get("/me"),
  changePassword:(data) => providerApi.put("/me/password", data),
};

export const providerDashAPI = {
  stats: () => providerApi.get("/dashboard/stats"),
};

export const providerClientAPI = {
  scan:        (mutual_number) => providerApi.get(`/client/scan/${mutual_number}`),
  search:      (q)             => providerApi.get("/client/search", { params: { q } }),
  eligibility: (id, service_type) => providerApi.get(`/client/${id}/eligibility`, { params: { service_type } }),
};

export const providerServiceAPI = {
  create:  (data)         => providerApi.post("/services", data),
  getAll:  (params)       => providerApi.get("/services", { params }),
  getById: (id)           => providerApi.get(`/services/${id}`),
};

export const providerMedicalAPI = {
  getRecords: (clientId)       => providerApi.get(`/medical/${clientId}`),
  addRecord:  (clientId, data) => providerApi.post(`/medical/${clientId}`, data),
};

export const providerBillingAPI = {
  getInvoices:     ()     => providerApi.get("/invoices"),
  generateInvoice: (data) => providerApi.post("/invoices/generate", data),
  getInvoice:      (id)   => providerApi.get(`/invoices/${id}`),
};

// Helpers
export function providerLogin(token, data) {
  localStorage.setItem("provider_token", token);
  localStorage.setItem("provider_data", JSON.stringify(data));
}
export function providerLogout() {
  localStorage.removeItem("provider_token");
  localStorage.removeItem("provider_data");
  window.location.href = "/etablissement";
}
export function getProviderData() {
  try { return JSON.parse(localStorage.getItem("provider_data")); }
  catch { return null; }
}

export default providerApi;
