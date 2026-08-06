// src/pages/AdminHub.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ADMIN_BASE } from "../config/adminBase";

const ROLE_LABELS = {
  ADMIN:       { label: "Administrateur Général",  accent: "#00c4b4", dim: "rgba(0,196,180,0.12)"  },
  MANAGER:     { label: "Responsable Commercial",  accent: "#1a5fa8", dim: "rgba(26,95,168,0.12)"  },
  CONSEILLERE: { label: "Conseillère Clientèle",   accent: "#f472b6", dim: "rgba(244,114,182,0.12)" },
  AGENT:       { label: "Commercial",              accent: "#a78bfa", dim: "rgba(167,139,250,0.12)" },
};

const SECTIONS = [
  {
    title: "Administration",
    icon: "🏢",
    roles: ["ADMIN"],
    accent: "#a78bfa",
    dim: "rgba(167,139,250,0.07)",
    glow: "rgba(167,139,250,0.18)",
    links: [
      { icon: "📊", label: "Tableau de bord général",    path: `${ADMIN_BASE}`,                              desc: "KPIs, revenus, stats globales" },
      { icon: "👥", label: "Gestion des agents",          path: `${ADMIN_BASE}/agents`,                        desc: "Créer, modifier, suspendre" },
      { icon: "✅", label: "Validation clients",          path: `${ADMIN_BASE}/clients/validation`,      desc: "Approuver / rejeter les inscriptions" },
      { icon: "🔑", label: "Reset MDP clients",           path: `${ADMIN_BASE}/clients/reset-password`,  desc: "Réinitialiser les mots de passe" },
      { icon: "🏨", label: "Portail établissements",      path: `${ADMIN_BASE}/providers`,               desc: "Valider les demandes d'accès" },
      { icon: "🏥", label: "Réseau de soins",             path: `${ADMIN_BASE}/healthcare`,                    desc: "Gérer les établissements partenaires" },
      { icon: "💰", label: "Commissions globales",        path: `${ADMIN_BASE}/commissions`,                   desc: "Toutes les commissions agents" },
      { icon: "🌍", label: "Ambassadeurs Diaspora",       path: `${ADMIN_BASE}/diaspora`,                desc: "Gérer le réseau ambassadeurs" },
      { icon: "⛪", label: "Ambassadeurs Fédérations",    path: `${ADMIN_BASE}/federation`,              desc: "Gérer fédérations & églises" },
      { icon: "💼", label: "Réseau Business",             path: `${ADMIN_BASE}/business`,                desc: "Directrices, Leaders, Superviseurs" },
      { icon: "📣", label: "Notifications Broadcast",    path: `${ADMIN_BASE}/broadcasts`,              desc: "Envoyer des messages à tous les clients" },
    ],
  },
  {
    title: "Commerce",
    icon: "🤝",
    roles: ["ADMIN", "MANAGER"],
    accent: "#1a5fa8",
    dim: "rgba(26,95,168,0.07)",
    glow: "rgba(26,95,168,0.18)",
    links: [
      { icon: "📈", label: "Dashboard commercial",        path: `${ADMIN_BASE}`,            desc: "Stats de l'équipe commerciale" },
      { icon: "👤", label: "Mes commerciaux",             path: `${ADMIN_BASE}/agents`,      desc: "Gérer et suivre les commerciaux" },
      { icon: "💳", label: "Commissions équipe",          path: `${ADMIN_BASE}/commissions`, desc: "Performances et rémunérations" },
      { icon: "👥", label: "Clients (lecture)",           path: `${ADMIN_BASE}/clients`,     desc: "Consulter la base clients" },
      { icon: "💵", label: "Paiements",                   path: `${ADMIN_BASE}/payments`,    desc: "Historique des paiements" },
    ],
  },
  {
    title: "Clientèle",
    icon: "🧑‍💼",
    roles: ["ADMIN", "CONSEILLERE"],
    accent: "#f472b6",
    dim: "rgba(244,114,182,0.07)",
    glow: "rgba(244,114,182,0.18)",
    links: [
      { icon: "👥", label: "Gérer les clients",           path: `${ADMIN_BASE}/clients`,    desc: "Créer, modifier, importer" },
      { icon: "📥", label: "Import CSV clients",          path: `${ADMIN_BASE}/clients`,    desc: "Importation en masse" },
      { icon: "🏥", label: "Établissements réseau",       path: `${ADMIN_BASE}/healthcare`, desc: "Gérer les établissements partenaires" },
      { icon: "👨‍👩‍👧‍👦", label: "Groupes",                  path: `${ADMIN_BASE}/groups`,     desc: "Gérer les groupes cotisants" },
    ],
  },
  {
    title: "Exports",
    icon: "📤",
    roles: ["ADMIN"],
    accent: "#fb923c",
    dim: "rgba(251,146,60,0.07)",
    glow: "rgba(251,146,60,0.18)",
    links: [
      { icon: "👥", label: "Export clients",              path: `${ADMIN_BASE}/exports`, desc: "Télécharger la base clients (CSV/Excel)" },
      { icon: "👤", label: "Export agents",               path: `${ADMIN_BASE}/exports`, desc: "Télécharger la liste des agents" },
      { icon: "🌍", label: "Export Diaspora",             path: `${ADMIN_BASE}/exports`, desc: "Télécharger le réseau diaspora" },
      { icon: "⛪", label: "Export Fédérations",          path: `${ADMIN_BASE}/exports`, desc: "Télécharger le réseau fédérations" },
      { icon: "🏥", label: "Export établissements",       path: `${ADMIN_BASE}/exports`, desc: "Télécharger les établissements partenaires" },
    ],
  },
  {
    title: "Réseau Ambassadeurs",
    icon: "🌐",
    roles: ["ADMIN"],
    accent: "#00c4b4",
    dim: "rgba(0,196,180,0.07)",
    glow: "rgba(0,196,180,0.18)",
    links: [
      { icon: "🌍", label: "Admin Diaspora",              path: `${ADMIN_BASE}/diaspora`,               desc: "Gérer ambassadeurs diaspora" },
      { icon: "⛪", label: "Admin Fédérations",           path: `${ADMIN_BASE}/federation`,             desc: "Gérer ambassadeurs fédérations" },
      { icon: "💼", label: "Admin Business",              path: `${ADMIN_BASE}/business`,               desc: "Directrices, Leaders, Superviseurs" },
      { icon: "🚪", label: "Portail Ambassadeurs",        path: "/diaspora/login",               desc: "Accéder au portail unifié", external: true },
      { icon: "🔐", label: "Portail Business",            path: "/business/login",               desc: "Espace membres réseau business", external: true },
      { icon: "🏆", label: "Classement Global",           path: `${ADMIN_BASE}/admin/ambassador-leaderboard`, desc: "Classement diaspora + fédérations" },
      { icon: "💰", label: "Commissions Ambassadeurs",    path: `${ADMIN_BASE}/admin/ambassador-commissions`, desc: "Toutes les commissions réseau" },
    ],
  },
  {
    title: "Réseau CNEPECI",
    icon: "⛪",
    roles: ["ADMIN"],
    accent: "#60a5fa",
    dim: "rgba(96,165,250,0.07)",
    glow: "rgba(96,165,250,0.18)",
    links: [
      { icon: "📊", label: "Admin CNEPECI",               path: `${ADMIN_BASE}/cnepeci`, desc: "Vue d'ensemble du réseau" },
      { icon: "👥", label: "Membres CNEPECI",             path: `${ADMIN_BASE}/cnepeci`, desc: "Bureaux, Coordonnateurs, Pasteurs" },
      { icon: "💰", label: "Paiements CNEPECI",           path: `${ADMIN_BASE}/cnepeci`, desc: "Adhésions, cotisations, cash" },
      { icon: "🏆", label: "Commissions & Bonus",         path: `${ADMIN_BASE}/cnepeci`, desc: "Commissions réseau + bonus 1,5%" },
      { icon: "🏛️", label: "Bureau Centrale",             path: `${ADMIN_BASE}/cnepeci`, desc: "Coordonnateurs généraux" },
      { icon: "🔐", label: "Portail Membre CNEPECI",      path: "/cnepeci/login", desc: "Accéder au portail membres", external: true },
    ],
  },
  {
    title: "Portails",
    icon: "🔗",
    roles: ["ADMIN"],
    accent: "#fbbf24",
    dim: "rgba(251,191,36,0.07)",
    glow: "rgba(251,191,36,0.18)",
    links: [
      { icon: "👤", label: "Portail Adhérent",            path: "/client/login",   desc: "Espace client mutualiste",        external: true },
      { icon: "🏥", label: "Portail Établissement",       path: "/etablissement",  desc: "Espace prestataires de soins",    external: true },
      { icon: "🔐", label: "Connexion Admin/Agent",       path: `${ADMIN_BASE}/login`,          desc: "Connexion espace commercial",     external: true },
      { icon: "🌍", label: "Portail Diaspora",            path: "/diaspora/login", desc: "Espace ambassadeurs diaspora",    external: true },
      { icon: "⛪", label: "Portail Fédération",          path: "/diaspora/login", desc: "Espace ambassadeurs fédération",  external: true },
      { icon: "💼", label: "Portail Business",            path: "/business/login", desc: "Espace membres réseau business",  external: true },
      { icon: "🔐", label: "Portail CNEPECI",             path: "/cnepeci/login",  desc: "Espace membres CNEPECI",          external: true },
      { icon: "👨‍⚕️", label: "Portail Médecin",           path: "/medecin",        desc: "Espace téléconsultation médecins", external: true },
    ],
  },
];

export default function AdminHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role?.toUpperCase();
  const roleConfig = ROLE_LABELS[role] || ROLE_LABELS.AGENT;
  const visibleSections = SECTIONS.filter((s) => s.roles.includes(role));

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    .awj-hub * { box-sizing: border-box; }
    .awj-hub {
      font-family: 'Outfit', system-ui, sans-serif;
      background: #0a1628;
      min-height: 100vh;
      color: #f0f0f0;
      padding: 28px 24px 60px;
    }
    .awj-hub .inner { max-width: 1160px; margin: 0 auto; }

    /* Header */
    .awj-header {
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 20px;
      padding: 22px 28px;
      margin-bottom: 28px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .awj-avatar-lg {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg,#1a5fa8,#00c4b4);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .awj-role-badge {
      font-size: 11px; font-weight: 600; padding: 4px 12px;
      border-radius: 20px; letter-spacing: 0.04em;
    }

    /* Section blocks */
    .awj-section {
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.07);
      overflow: hidden;
      margin-bottom: 16px;
      transition: border-color 0.2s;
    }
    .awj-section-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 22px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .awj-section-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 15px; font-weight: 800;
    }
    .awj-section-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
    }
    .awj-count-badge {
      font-size: 11px; font-weight: 600; padding: 3px 10px;
      border-radius: 20px;
    }

    /* Link grid */
    .awj-link-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 1px;
      background: rgba(255,255,255,0.05);
    }
    .awj-link-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 18px;
      background: #0a1628;
      cursor: pointer;
      border: none;
      font-family: inherit;
      text-align: left;
      transition: background 0.15s;
      position: relative;
      overflow: hidden;
    }
    .awj-link-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .awj-link-card:hover { background: rgba(255,255,255,0.04); }
    .awj-link-card:hover::before { opacity: 1; }
    .awj-link-card:active { background: rgba(255,255,255,0.07); }

    .awj-link-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
      position: relative;
    }
    .awj-ext-tag {
      position: absolute; top: -3px; right: -3px;
      width: 14px; height: 14px; border-radius: 4px;
      background: rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 700;
    }
    .awj-link-label {
      font-size: 13px; font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin: 0 0 3px;
    }
    .awj-link-desc {
      font-size: 11px; color: rgba(255,255,255,0.3);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin: 0;
    }
    .awj-link-arrow {
      margin-left: auto; flex-shrink: 0;
      font-size: 14px; opacity: 0;
      transition: opacity 0.15s, transform 0.15s;
    }
    .awj-link-card:hover .awj-link-arrow {
      opacity: 0.5; transform: translateX(3px);
    }

    .awj-fade-in { animation: awjFi 0.45s ease both; }
    @keyframes awjFi { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
    .awj-pulse { animation: awjP 2.5s ease-in-out infinite; }
    @keyframes awjP { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="awj-hub awj-fade-in">
        <div className="inner">

          {/* ══ HEADER ══ */}
          <div className="awj-header">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="awj-avatar-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="awj-pulse" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: roleConfig.accent }} />
                  {greeting}
                </p>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px", lineHeight: 1 }}>
                  {user?.name?.split(" ")[0]}{" "}
                  <span style={{ background: `linear-gradient(135deg, ${roleConfig.accent}, rgba(255,255,255,0.7))`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    👋
                  </span>
                </h1>
                <span className="awj-role-badge" style={{ background: roleConfig.dim, color: roleConfig.accent }}>
                  {roleConfig.label}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", textTransform: "capitalize" }}>
                {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", margin: 0, color: "rgba(255,255,255,0.85)" }}>
                {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* ══ SECTIONS ══ */}
          {visibleSections.map((section, si) => (
            <div
              key={si}
              className="awj-section"
              style={{
                animationDelay: `${si * 0.06}s`,
                animation: `awjFi 0.45s ease ${si * 0.06}s both`,
              }}
            >
              {/* Section header */}
              <div
                className="awj-section-head"
                style={{ background: section.dim }}
              >
                <div className="awj-section-title" style={{ color: section.accent }}>
                  <div
                    className="awj-section-icon"
                    style={{ background: `rgba(255,255,255,0.07)`, border: `1px solid rgba(255,255,255,0.08)` }}
                  >
                    {section.icon}
                  </div>
                  {section.title}
                </div>
                <span
                  className="awj-count-badge"
                  style={{ background: `rgba(255,255,255,0.07)`, color: "rgba(255,255,255,0.4)" }}
                >
                  {section.links.length} accès
                </span>
              </div>

              {/* Links grid */}
              <div className="awj-link-grid">
                {section.links.map((link, li) => (
                  <button
                    key={li}
                    className="awj-link-card"
                    onClick={() =>
                      link.external ? window.open(link.path, "_blank") : navigate(link.path)
                    }
                    style={{ "--accent": section.accent }}
                  >
                    {/* Accent bar on hover (via ::before in CSS, color set inline) */}
                    <style>{`.awj-link-card:hover::before { background: ${section.accent}; }`}</style>

                    <div
                      className="awj-link-icon-wrap"
                      style={{ background: section.dim, border: `1px solid ${section.glow}` }}
                    >
                      {link.icon}
                      {link.external && <span className="awj-ext-tag">↗</span>}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="awj-link-label" style={{ color: section.accent }}>
                        {link.label}
                      </p>
                      <p className="awj-link-desc">{link.desc}</p>
                    </div>

                    <span className="awj-link-arrow" style={{ color: section.accent }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </>
  );
}
