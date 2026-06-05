// src/pages/PortailHub.jsx
// ─────────────────────────────────────────────────────────────
//  Hub de sélection de portail
//  Affiché quand un utilisateur a plusieurs accès actifs
//  (ex : compte adhérent + compte business)
//  Détecte les tokens présents dans localStorage et propose
//  uniquement les portails accessibles.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Définition de tous les portails ──────────────────────────
const PORTAILS = [
  {
    key: "client",
    label: "Espace Adhérent",
    description: "Votre carte, vos cotisations, votre famille",
    path: "/client/dashboard",
    tokenKey: "client_token",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    accent: "#16a34a",
    bg: "from-green-50 to-emerald-100",
    border: "border-green-200",
    badge: "Adhérent",
  },
  {
    key: "business",
    label: "Espace Business",
    description: "Réseau, commissions, collectes",
    path: "/business/dashboard",
    tokenKey: "business_token",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
    accent: "#d97706",
    bg: "from-amber-50 to-orange-100",
    border: "border-amber-200",
    badge: "Business",
  },
  {
    key: "diaspora",
    label: "Espace Diaspora",
    description: "Tableau de bord ambassadeur Diaspora",
    path: "/diaspora/dashboard",
    tokenKey: "diaspora_token",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    accent: "#1b4fd8",
    bg: "from-blue-50 to-indigo-100",
    border: "border-blue-200",
    badge: "Diaspora",
  },
  {
    key: "referral",
    label: "Espace Fédération",
    description: "Réseau parrainage, leaders, pasteurs",
    path: "/referral/dashboard",
    tokenKey: "diaspora_token", // même token que diaspora
    // on distingue via diaspora_data.network_type
    networkType: "referral",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    accent: "#7c3aed",
    bg: "from-violet-50 to-purple-100",
    border: "border-violet-200",
    badge: "Fédération",
  },
  {
    key: "affilie",
    label: "Espace Affilié",
    description: "Réseau affilié, membres, superviseurs",
    path: "/affilie/dashboard",
    tokenKey: "affilie_token",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    accent: "#0d9488",
    bg: "from-teal-50 to-cyan-100",
    border: "border-teal-200",
    badge: "Affilié",
  },
  {
    key: "cnepeci",
    label: "Espace CNEPECI",
    description: "Portail membre CNEPECI",
    path: "/cnepeci/dashboard",
    tokenKey: "cnepeci_token",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    accent: "#be185d",
    bg: "from-rose-50 to-pink-100",
    border: "border-rose-200",
    badge: "CNEPECI",
  },
];

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

// Détecte les portails actifs selon les tokens présents
function detectPortails() {
  const actifs = [];

  // Client
  if (safeGet("client_token")) {
    actifs.push(PORTAILS.find(p => p.key === "client"));
  }

  // Business
  if (safeGet("business_token")) {
    actifs.push(PORTAILS.find(p => p.key === "business"));
  }

  // Diaspora vs Referral — même token, on distingue par diaspora_data.network_type
  const diasporaToken = safeGet("diaspora_token");
  if (diasporaToken) {
    try {
      const data = JSON.parse(safeGet("diaspora_data") || "{}");
      const networkType = data?.network_type || data?.networkType || "";
      if (networkType === "referral" || networkType === "federation") {
        actifs.push(PORTAILS.find(p => p.key === "referral"));
      } else {
        // Par défaut : Diaspora (ou les deux si les deux données existent)
        actifs.push(PORTAILS.find(p => p.key === "diaspora"));
      }
    } catch {
      actifs.push(PORTAILS.find(p => p.key === "diaspora"));
    }
  }

  // Affilié
  if (safeGet("affilie_token")) {
    actifs.push(PORTAILS.find(p => p.key === "affilie"));
  }

  // CNEPECI
  if (safeGet("cnepeci_token")) {
    actifs.push(PORTAILS.find(p => p.key === "cnepeci"));
  }

  return actifs.filter(Boolean);
}

// ── Composant carte portail ───────────────────────────────────
function PortailCard({ portail, onClick, animDelay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onClick(portail)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative flex flex-col items-start gap-4 p-6 rounded-2xl border-2
        bg-gradient-to-br ${portail.bg} ${portail.border}
        w-full text-left cursor-pointer
        transition-all duration-300
        ${hovered ? "shadow-xl -translate-y-1" : "shadow-md"}
      `}
      style={{
        animation: `fadeSlideUp 0.4s ease both`,
        animationDelay: `${animDelay}ms`,
      }}
    >
      {/* Badge */}
      <span
        className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
        style={{ backgroundColor: portail.accent }}
      >
        {portail.badge}
      </span>

      {/* Icône */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: portail.accent + "20", color: portail.accent }}
      >
        <div className="w-6 h-6">{portail.icon}</div>
      </div>

      {/* Texte */}
      <div>
        <h3 className="font-bold text-gray-800 text-base mb-1">{portail.label}</h3>
        <p className="text-sm text-gray-500 leading-snug">{portail.description}</p>
      </div>

      {/* Flèche */}
      <div
        className="mt-auto flex items-center gap-1 text-sm font-semibold transition-all duration-200"
        style={{ color: portail.accent }}
      >
        Accéder
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${hovered ? "translate-x-1" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </button>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function PortailHub() {
  const navigate = useNavigate();
  const [portailsActifs, setPortailsActifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const actifs = detectPortails();
    setPortailsActifs(actifs);
    setLoading(false);

    // Si un seul portail actif → redirection directe sans afficher le hub
    if (actifs.length === 1) {
      navigate(actifs[0].path, { replace: true });
    }
  }, [navigate]);

  const handleSelect = (portail) => {
    navigate(portail.path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Aucun portail actif → rediriger vers login client par défaut
  if (portailsActifs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Aucun accès actif</h2>
            <p className="text-gray-500 mt-2 text-sm">Vous n'avez aucune session ouverte. Veuillez vous connecter.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/client/login")}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
            >
              Connexion Adhérent
            </button>
            <button
              onClick={() => navigate("/diaspora/login")}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
              Connexion Ambassadeur
            </button>
            <button
              onClick={() => navigate("/business/login")}
              className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
            >
              Connexion Business
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grille des portails disponibles
  const cols = portailsActifs.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex flex-col items-center justify-center px-4 py-12">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="w-full max-w-3xl space-y-8">

        {/* En-tête */}
        <div className="text-center space-y-2" style={{ animation: "fadeSlideUp 0.35s ease both" }}>
          {/* Logo Awoundjô */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Bienvenue sur Awoundjô</h1>
          <p className="text-gray-500 text-sm">
            Vous avez <span className="font-semibold text-green-700">{portailsActifs.length} accès actifs</span>. Choisissez votre espace.
          </p>
        </div>

        {/* Grille portails */}
        <div className={`grid ${cols} gap-4`}>
          {portailsActifs.map((portail, i) => (
            <PortailCard
              key={portail.key}
              portail={portail}
              onClick={handleSelect}
              animDelay={100 + i * 80}
            />
          ))}
        </div>

        {/* Pied de page */}
        <p className="text-center text-xs text-gray-400" style={{ animation: "fadeSlideUp 0.5s ease both", animationDelay: "400ms" }}>
          Awoundjô · Mutuelle de santé · Côte d'Ivoire
        </p>
      </div>
    </div>
  );
}
