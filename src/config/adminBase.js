// src/config/adminBase.js
// [SÉCURITÉ] Préfixe non devinable pour tout le back-office agent/admin.
// Isolé dans son propre fichier pour éviter tout import circulaire
// entre App.jsx et les pages qui en ont besoin (Login.jsx, api.js, etc.).
// Ne jamais utiliser "/admin" seul : trop facilement scanné par les bots.
export const ADMIN_BASE = "/gestion-x7f2";
