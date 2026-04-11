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
  },
  AGENT: {
    createAgents: false, viewAgents: false, createOnlyBasicAgents: false,
    createClients: true, viewClients: true,
    createPayments: true, viewPayments: true,
    viewCommissions: true, viewAllCommissions: false,
    manageProviders: false, importExport: false,
    dashboardFull: true, viewGroups: true,
  },
  RESPONSABLE_COMMERCIAL: {
    createAgents: true,  viewAgents: true, createOnlyBasicAgents: true, // seulement AGENT
    createClients: true, viewClients: true,
    createPayments: false, viewPayments: true,
    viewCommissions: true, viewAllCommissions: false, // seulement ses commerciaux
    manageProviders: false, importExport: false,
    dashboardFull: false, viewGroups: true,
  },
  CONSEILLERE_CLIENTELE: {
    createAgents: false, viewAgents: false, createOnlyBasicAgents: false,
    createClients: true, viewClients: true,  // adhésions uniquement
    createPayments: true, viewPayments: false,
    viewCommissions: false, viewAllCommissions: false,
    manageProviders: true, importExport: true, // import/export + établissements
    dashboardFull: false, viewGroups: false,
  },
};

// Labels lisibles pour affichage
export const ROLE_LABELS = {
  ADMIN:                  "Administrateur",
  AGENT:                  "Agent Commercial",
  RESPONSABLE_COMMERCIAL: "Responsable Commercial",
  CONSEILLERE_CLIENTELE:  "Conseillère Clientèle",
  APPORTEUR_AFFAIRES: "Apporteur d'Affaires",
};

export const ROLE_COLORS = {
  ADMIN:                  { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500" },
  AGENT:                  { bg: "bg-brand-100",  text: "text-brand-700",  dot: "bg-brand-500" },
  RESPONSABLE_COMMERCIAL: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  CONSEILLERE_CLIENTELE:  { bg: "bg-teal-100",   text: "text-teal-700",   dot: "bg-teal-500" },
  APPORTEUR_AFFAIRES: { bg:"bg-orange-50", text:"text-orange-700", dot:"bg-orange-500" },
};

export function useRole() {
  const { user } = useAuth();
  const role = user?.role || "AGENT";
  const perms = PERMISSIONS[role] || PERMISSIONS.AGENT;

  return {
    role,
    label:     ROLE_LABELS[role] || role,
    isAdmin:   role === "ADMIN",
    isAgent:   role === "AGENT",
    isRC:      role === "RESPONSABLE_COMMERCIAL",
    isCC:      role === "CONSEILLERE_CLIENTELE",
    can:       (perm) => perms[perm] === true,
    perms,
  };
}
