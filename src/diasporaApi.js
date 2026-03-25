// src/diasporaApi.js
// ─────────────────────────────────────────────────────────────
//  Client API pour le module Diaspora Awoundjô
// ─────────────────────────────────────────────────────────────
import axios from "axios";

const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/diaspora`;

// ── Instance axios avec token auto-injecté ────────────────────

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

// Intercepteur 401 : nettoyer + rediriger — mais pas si on est déjà
// sur la page de login (évite la boucle infinie)
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
  } catch {
    return null;
  }
}

/**
 * Vérifie que le token JWT existe ET n'est pas expiré côté client.
 * Évite le flash dashboard → login : on redirige avant même d'appeler l'API.
 */
export function isDiasporaTokenValid() {
  const token = getDiasporaToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/**
 * Sauvegarde le token et les données utilisateur après connexion.
 */
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

// ── Profil ambassadeur ────────────────────────────────────────

export const diasporaProfileAPI = {
  getMe:  ()     => api.get("/me"),
  update: (data) => api.put("/me", data),
};

// ── Bénéficiaires ─────────────────────────────────────────────

export const diasporaBeneAPI = {
  getAll:  (params) => api.get("/beneficiaries", { params }),
  getById: (id)     => api.get(`/beneficiaries/${id}`),
  create:  (data)   => api.post("/beneficiaries", data),
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

// ── Réseau MLM ────────────────────────────────────────────────

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

export default api;
