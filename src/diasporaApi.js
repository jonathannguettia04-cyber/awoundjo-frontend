// src/diasporaApi.js
// ─────────────────────────────────────────────────────────────
//  Client API Awoundjô — Réseaux Diaspora & Parrainage
//  Token unique partagé entre les deux réseaux
// ─────────────────────────────────────────────────────────────
import axios from "axios";

const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/diaspora`;

// ── Instance axios ────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("diaspora_token");
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

// ── Token helpers ─────────────────────────────────────────────
export function getDiasporaToken() {
  return localStorage.getItem("diaspora_token");
}

export function getDiasporaData() {
  try {
    const raw = localStorage.getItem("diaspora_data");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * Valide le token JWT côté client (existence + non-expiré).
 * Utilisé par DiasporaGuard dans App.jsx pour les deux réseaux.
 */
export function isDiasporaTokenValid() {
  const token = getDiasporaToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch { return false; }
}

export function diasporaLogin(token, data) {
  localStorage.setItem("diaspora_token", token);
  localStorage.setItem("diaspora_data", JSON.stringify(data));
}

export function diasporaLogout() {
  localStorage.removeItem("diaspora_token");
  localStorage.removeItem("diaspora_data");
  window.location.href = "/diaspora/login";
}

// ── Auth ──────────────────────────────────────────────────────
export const diasporaAuthAPI = {
  register: (data) => api.post("/register", data),
  login:    (data) => api.post("/login",    data),
  me:       ()     => api.get("/me"),
  update:   (data) => api.put("/me",        data),
};

// ── Dashboard ─────────────────────────────────────────────────
export const diasporaDashAPI = {
  getStats: () => api.get("/dashboard"),
};

// ── Profil ────────────────────────────────────────────────────
export const diasporaProfileAPI = {
  getMe:  ()     => api.get("/me"),
  update: (data) => api.put("/me", data),
};

// ── Bénéficiaires / Clients (RECRUTEUR) ───────────────────────
export const diasporaBeneAPI = {
  // Clients finaux
  getAll:  (params) => api.get("/beneficiaries",    { params }),
  getById: (id)     => api.get(`/beneficiaries/${id}`),
  create:  (data)   => api.post("/beneficiaries",   data),   // enregistre un client final

  // Ambassadeurs intermédiaires (Amb. Pays, Recruteur)
  // POST /api/diaspora/ambassadors — crée un rôle intermédiaire et retourne ses credentials
  createAmbassador: (data)   => api.post("/ambassadors",   data),
  getAmbassadors:   (params) => api.get("/ambassadors",    { params }),
};

// ── Paiements ─────────────────────────────────────────────────
export const diasporaPayAPI = {
  getAll:   ()     => api.get("/payments"),
  initiate: (data) => api.post("/payments",         data),
  confirm:  (data) => api.post("/payments/confirm", data),
};

// ── Commissions ───────────────────────────────────────────────
export const diasporaCommAPI = {
  getAll: (params) => api.get("/commissions", { params }),
};

// ── Parrainage ────────────────────────────────────────────────
export const diasporaRefAPI = {
  getLink:      () => api.get("/referral-link"),
  getReferrals: () => api.get("/referrals"),
};

// ── Réseau ────────────────────────────────────────────────────
export const diasporaNetAPI = {
  getNetwork: () => api.get("/network"),
};

// ── Classement ────────────────────────────────────────────────
export const diasporaLeaderAPI = {
  getLeaderboard: (period = "month") => api.get("/leaderboard", { params: { period } }),
};

// ── Notifications ─────────────────────────────────────────────
export const diasporaNotifAPI = {
  getAll:   () => api.get("/notifications"),
  markRead: () => api.put("/notifications/read"),
};

// ── Admin ─────────────────────────────────────────────────────
// Routes admin pour voir/gérer les credentials de tous les ambassadeurs
export const diasporaAdminAPI = {
  getAll:           (params) => api.get("/admin/ambassadors",              { params }),
  getCredentials:   (id)     => api.get(`/admin/ambassadors/${id}/credentials`),
  resetPassword:    (id)     => api.post(`/admin/ambassadors/${id}/reset-password`),
  generateTempPass: (id)     => api.post(`/admin/ambassadors/${id}/temp-password`),
  validateComm:     (id)     => api.put(`/admin/commissions/${id}/validate`),
  payComm:          (id)     => api.put(`/admin/commissions/${id}/pay`),
};

export default api;
