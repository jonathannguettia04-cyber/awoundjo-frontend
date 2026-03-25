// src/diasporaApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const diasporaApi = axios.create({
  baseURL: `${API_URL}/api/diaspora`,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// ── Intercepteur requête : injecte le token ──────────────────
diasporaApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("diaspora_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Intercepteur réponse : gère les 401 proprement ──────────
// CORRECTION : on ne redirige vers /login QUE si on n'est pas
// déjà sur /diaspora/login (évite la boucle infinie)
diasporaApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const isLoginPage = window.location.pathname === "/diaspora/login";

    if (status === 401 && !isLoginPage) {
      // Nettoyer le storage
      localStorage.removeItem("diaspora_token");
      localStorage.removeItem("diaspora_data");
      // Rediriger une seule fois
      window.location.replace("/diaspora/login");
    }

    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const diasporaAuthAPI = {
  register: (data) => diasporaApi.post("/register", data),
  login:    (data) => diasporaApi.post("/login",    data),
  me:       ()     => diasporaApi.get("/me"),
  update:   (data) => diasporaApi.put("/me",        data),
};

// ── Dashboard ────────────────────────────────────────────────
export const diasporaDashAPI = {
  stats: () => diasporaApi.get("/dashboard"),
};

// ── Bénéficiaires ────────────────────────────────────────────
export const diasporaBeneAPI = {
  create:  (data) => diasporaApi.post("/beneficiaries",     data),
  getAll:  (p)    => diasporaApi.get("/beneficiaries",      { params: p }),
  getById: (id)   => diasporaApi.get(`/beneficiaries/${id}`),
};

// ── Paiements ────────────────────────────────────────────────
export const diasporaPayAPI = {
  initiate: (data) => diasporaApi.post("/payments",         data),
  confirm:  (data) => diasporaApi.post("/payments/confirm", data),
  getAll:   ()     => diasporaApi.get("/payments"),
};

// ── Commissions ──────────────────────────────────────────────
export const diasporaCommAPI = {
  getAll: () => diasporaApi.get("/commissions"),
};

// ── Parrainage ───────────────────────────────────────────────
export const diasporaRefAPI = {
  getLink:      () => diasporaApi.get("/referral-link"),
  getReferrals: () => diasporaApi.get("/referrals"),
};

// ── Réseau MLM ───────────────────────────────────────────────
export const diasporaNetAPI = {
  getNetwork: () => diasporaApi.get("/network"),
};

// ── Classement ───────────────────────────────────────────────
export const diasporaLeaderAPI = {
  getLeaderboard: (period = "month") =>
    diasporaApi.get("/leaderboard", { params: { period } }),
};

// ── Notifications ────────────────────────────────────────────
export const diasporaNotifAPI = {
  getAll:   () => diasporaApi.get("/notifications"),
  markRead: () => diasporaApi.put("/notifications/read"),
};

// ── Helpers session ──────────────────────────────────────────
export function diasporaLogin(token, data) {
  localStorage.setItem("diaspora_token", token);
  localStorage.setItem("diaspora_data",  JSON.stringify(data));
}

export function diasporaLogout() {
  localStorage.removeItem("diaspora_token");
  localStorage.removeItem("diaspora_data");
  window.location.replace("/diaspora/login");
}

export function getDiasporaData() {
  try { return JSON.parse(localStorage.getItem("diaspora_data")); }
  catch { return null; }
}

// Vérifier si le token existe et n'est pas expiré côté client
export function isDiasporaTokenValid() {
  const token = localStorage.getItem("diaspora_token");
  if (!token) return false;
  try {
    // Décoder sans vérifier la signature (juste pour lire exp)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export default diasporaApi;
