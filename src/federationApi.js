// src/federationApi.js
// ─────────────────────────────────────────────────────────────
//  Client API pour le module Fédération Awoundjô
//  Commissions : 12% recruteur direct | 10% supérieur | 5% direction
//  Calculées sur 50% de la prime encaissée
// ─────────────────────────────────────────────────────────────
import axios from "axios";

const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/federation`;

// ── Instance axios ────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("diaspora_token"); // même token que Diaspora
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/diaspora/login")
    ) {
      localStorage.removeItem("diaspora_token");
      localStorage.removeItem("diaspora_data");
      window.location.href = "/diaspora/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth (partagée avec Diaspora via /api/diaspora) ───────────
// Utilise diasporaAuthAPI de diasporaApi.js — pas dupliqué ici

// ── Dashboard Fédération ──────────────────────────────────────
export const federationDashAPI = {
  getStats: () => api.get("/dashboard"),
};

// ── Profil ambassadeur fédération ────────────────────────────
export const federationProfileAPI = {
  getMe:  ()     => api.get("/me"),
  update: (data) => api.put("/me", data),
};

// ── Réseau hiérarchique MLM ───────────────────────────────────
export const federationNetAPI = {
  getHierarchy: () => api.get("/network"),     // arbre complet
  getTeam:      () => api.get("/ambassadors"),  // recrutés directs
  getNetwork:   () => api.get("/network"),      // réseau étendu
};

// ── Recrutement ───────────────────────────────────────────────
export const federationRecruitAPI = {
  getLink:      () => api.get("/referral-link"),
  getReferrals: () => api.get("/referrals"),
};

// ── Instance diaspora — création clients (route réelle = /api/diaspora) ──────
// La route /api/federation/beneficiaries n'existe pas côté backend.
// Les rôles Fédération (RUM, LEADER, PASTEUR, RESPONSABLE) sont autorisés
// par diasporaAuth + createBeneficiary dans /api/diaspora/beneficiaries.
const diasporaBase = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/diaspora`;
const diasporaApiForFed = axios.create({
  baseURL: diasporaBase,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});
diasporaApiForFed.interceptors.request.use((config) => {
  const token = localStorage.getItem("diaspora_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
diasporaApiForFed.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/diaspora/login")
    ) {
      localStorage.removeItem("diaspora_token");
      localStorage.removeItem("diaspora_data");
      window.location.href = "/diaspora/login";
    }
    return Promise.reject(error);
  }
);

// ── Membres / Adhérents recrutés ──────────────────────────────
export const federationMemberAPI = {
  getAll:       (params) => api.get("/ambassadors", { params }),
  getById:      (id)     => diasporaApiForFed.get(`/beneficiaries/${id}`),
  create:       (data)   => diasporaApiForFed.post("/beneficiaries", data),
  // createClient pointe sur /api/diaspora/beneficiaries (même route que Diaspora & Parrainage)
  createClient: (data)   => diasporaApiForFed.post("/beneficiaries", data),
};

// ── Primes & Commissions ──────────────────────────────────────
// Calcul : base = prime * 0.5
// Recruteur direct : 12% | Supérieur : 10% | Direction : 5%
export const federationCommAPI = {
  getAll:    (params) => api.get("/commissions", { params }),
  getSummary: ()      => api.get("/commissions"),
  // Simuler le calcul avant validation
  simulate:  (prime)  => {
    const base = prime * 0.5;
    return {
      prime,
      base,
      recruteur:  +(base * 0.12).toFixed(2),  // 12%
      superieur:  +(base * 0.10).toFixed(2),  // 10%
      direction:  +(base * 0.05).toFixed(2),  //  5%
      total:      +(base * 0.27).toFixed(2),
    };
  },
};

// ── Paiements ─────────────────────────────────────────────────
export const federationPayAPI = {
  getAll:   ()     => api.get("/payments"),
  initiate: (data) => api.post("/payments",         data),
  confirm:  (data) => api.post("/payments/confirm", data),
};

// ── Notifications ─────────────────────────────────────────────
export const federationNotifAPI = {
  getAll:   () => api.get("/notifications"),
  markRead: () => api.put("/notifications/read"),
};

// ── Classement fédération ────────────────────────────────────
export const federationLeaderAPI = {
  getLeaderboard: (period = "month") => api.get("/leaderboard", { params: { period } }),
};

export default api;
