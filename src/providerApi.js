// src/providerApi.js — v2
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

// ── Auth ──────────────────────────────────────────────────────
export const providerAuthAPI = {
  login:         (data) => providerApi.post("/login", data),
  requestAccess: (data) => providerApi.post("/request-access", data),
  me:            ()     => providerApi.get("/me"),
  changePassword:(data) => providerApi.put("/me/password", data),
};

// ── Dashboard ─────────────────────────────────────────────────
export const providerDashAPI = {
  stats: () => providerApi.get("/dashboard/stats"),
};

// ── Catalogue ─────────────────────────────────────────────────
export const providerCatalogAPI = {
  getAll: (plan) => providerApi.get("/catalog", { params: { plan } }),
};

// ── Client ────────────────────────────────────────────────────
export const providerClientAPI = {
  scan:        (mutual_number) => providerApi.get(`/client/scan/${mutual_number}`),
  search:      (q)             => providerApi.get("/client/search", { params: { q } }),
  eligibility: (id, catalog_code) => providerApi.get(`/client/${id}/eligibility`, { params: { catalog_code } }),
};

// ── Services (actes) ─────────────────────────────────────────
export const providerServiceAPI = {
  create:  (data)   => providerApi.post("/services", data),
  getAll:  (params) => providerApi.get("/services", { params }),
  getById: (id)     => providerApi.get(`/services/${id}`),
};

// ── Prescriptions — émission (clinique/hôpital/sage-femme) ────
export const providerPrescriptionAPI = {
  create:       (data)      => providerApi.post("/prescriptions", data),
  getByService: (serviceId) => providerApi.get(`/prescriptions/${serviceId}`),
};

// ── Prescriptions — lecture pharmacie ────────────────────────
// Recherche par numéro mutualiste ou téléphone du patient
// Retourne toutes les ordonnances actives + infos bons restants
export const providerPharmacyAPI = {
  // Voir les ordonnances actives d'un patient
  getPatientPrescriptions: (query) =>
    providerApi.get("/patient-prescriptions", { params: query }),
    // query = { mutual_number: "AWJ-..." } ou { phone: "0707..." }

  // Exécuter un bon pharmacie sur une ordonnance
  dispense: (data) =>
    providerApi.post("/dispense", data),
    // data = { prescription_id, items: [...], total_amount }
};

// ── Dossier médical ───────────────────────────────────────────
export const providerMedicalAPI = {
  getRecords: (clientId)       => providerApi.get(`/medical/${clientId}`),
  addRecord:  (clientId, data) => providerApi.post(`/medical/${clientId}`, data),
};

// ── Facturation ───────────────────────────────────────────────
export const providerBillingAPI = {
  getInvoices:     ()     => providerApi.get("/invoices"),
  generateInvoice: (data) => providerApi.post("/invoices/generate", data),
  getInvoice:      (id)   => providerApi.get(`/invoices/${id}`),
};

// ── Helpers auth ─────────────────────────────────────────────
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
