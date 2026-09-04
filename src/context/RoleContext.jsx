// src/context/RoleContext.jsx
// Hook centralisé pour la gestion des rôles et permissions frontend

import { useAuth } from "./AuthContext";

// Définition des permissions par rôle
const PERMISSIONS = {
  ADMIN: {
    createAgents: true, viewAgents: true, createOnlyBasicAgents: false,
    createClients: true, viewClients: true,
    createPayments: true, viewPayments: true,
    viewCommissions: true, viewAllCommissions: true,
    manageProviders: true, importExport: true,
    dashboardFull: true, viewGroups: true,
    manageBroadcast: true, manageGallery: true, manageBlog: true,
  },
  AGENT: {
    createAgents: false, viewAgents: false, createOnlyBasicAgents: false,
    createClients: true, viewClients: true,
    createPayments: true, viewPayments: true,
    viewCommissions: true, viewAllCommissions: false,
    manageProviders: false, importExport: false,
    dashboardFull: true, viewGroups: true,
    manageBroadcast: false, manageGallery: false, manageBlog: false,
  },
  RESPONSABLE_COMMERCIAL: {
    createAgents: true,  viewAgents: true, createOnlyBasicAgents: true, // seulement AGENT
    createClients: true, viewClients: true,
    createPayments: false, viewPayments: true,
    viewCommissions: true, viewAllCommissions: false, // seulement ses commerciaux
    manageProviders: false, importExport: false,
    dashboardFull: false, viewGroups: true,
    manageBroadcast: false, manageGallery: false, manageBlog: false,
  },
  CONSEILLERE_CLIENTELE: {
    createAgents: false, viewAgents: false, createOnlyBasicAgents: false,
    createClients: true, viewClients: true,  // adhésions uniquement
    createPayments: true, viewPayments: false,
    viewCommissions: false, viewAllCommissions: false,
    manageProviders: true, importExport: true, // import/export + établissements
    dashboardFull: false, viewGroups: false,
    manageBroadcast: false, manageGallery: false, manageBlog: false,
  },
  APPORTEUR_AFFAIRES: {
    createAgents: false, viewAgents: false, createOnlyBasicAgents: false,
    createClients: true, viewClients: true, // clients finaux uniquement
    createPayments: false, viewPayments: false,
    viewCommissions: true, viewAllCommissions: false, // commission adhésion 5%
    manageProviders: false, importExport: false,
    dashboardFull: false, viewGroups: false,
    manageBroadcast: false, manageGallery: false, manageBlog: false,
  },
  COMMUNITY_MANAGER: {
    createAgents: false, viewAgents: false, createOnlyBasicAgents: false,
    createClients: true, viewClients: true,
    createPayments: false, viewPayments: false,
    viewCommissions: false, viewAllCommissions: false,
    manageProviders: true,  // établissements
    importExport: false,
    dashboardFull: false, viewGroups: false,
    manageBroadcast: true, manageGallery: true, manageBlog: true,
  },
};

// Labels lisibles pour affichage
export const ROLE_LABELS = {
  ADMIN:                  "Administrateur",
  AGENT:                  "Agent Commercial",
  RESPONSABLE_COMMERCIAL: "Responsable Commercial",
  CONSEILLERE_CLIENTELE:  "Conseillère Clientèle",
  APPORTEUR_AFFAIRES: "Apporteur d'Affaires",
  COMMUNITY_MANAGER: "Community Manager",
};

export const ROLE_COLORS = {
  ADMIN:                  { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500" },
  AGENT:                  { bg: "bg-brand-100",  text: "text-brand-700",  dot: "bg-brand-500" },
  RESPONSABLE_COMMERCIAL: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  CONSEILLERE_CLIENTELE:  { bg: "bg-teal-100",   text: "text-teal-700",   dot: "bg-teal-500" },
  APPORTEUR_AFFAIRES: { bg:"bg-orange-50", text:"text-orange-700", dot:"bg-orange-500" },
  COMMUNITY_MANAGER:  { bg:"bg-pink-50",   text:"text-pink-700",   dot:"bg-pink-500" },
};

export function useRole() {
  const { user, permissions: dynamicPermissions } = useAuth();
  const role = user?.role || "AGENT";
  const perms = PERMISSIONS[role] || PERMISSIONS.AGENT;

  // Permissions accordées dynamiquement depuis le backoffice (table
  // role_permissions), en plus des permissions statiques ci-dessus.
  // Additif uniquement : une permission déjà à `true` en dur le reste ;
  // une permission absente du dictionnaire statique (ex: "viewCotations",
  // "viewGroups" pour un rôle qui ne l'avait pas) devient disponible dès
  // qu'un admin la coche pour ce rôle, sans redéploiement.
  const dynamicCodes = new Set((dynamicPermissions || []).map((p) => p.code));

  return {
    role,
    label:     ROLE_LABELS[role] || role,
    isAdmin:   role === "ADMIN",
    isAgent:   role === "AGENT",
    isRC:      role === "RESPONSABLE_COMMERCIAL",
    isCC:      role === "CONSEILLERE_CLIENTELE",
    isCM:      role === "COMMUNITY_MANAGER",
    can:       (perm) => perms[perm] === true || dynamicCodes.has(perm),
    perms,
  };
}
