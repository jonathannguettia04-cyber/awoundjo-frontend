// src/pages/AdminHub.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  ADMIN:       { label: "Administrateur Général",  color: "#7C3AED", bg: "#F5F3FF" },
  MANAGER:     { label: "Responsable Commercial",  color: "#0891B2", bg: "#ECFEFF" },
  CONSEILLERE: { label: "Conseillère Clientèle",   color: "#DB2777", bg: "#FDF2F8" },
  AGENT:       { label: "Commercial",              color: "#059669", bg: "#ECFDF5" },
};

const SECTIONS = [
  // ── Administration ──────────────────────────────────────────
  {
    title: "🏢 Administration",
    roles: ["ADMIN"],
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    links: [
      { icon: "📊", label: "Tableau de bord général",    path: "/",                    desc: "KPIs, revenus, stats globales" },
      { icon: "👥", label: "Gestion des agents",          path: "/agents",              desc: "Créer, modifier, suspendre les comptes" },
      { icon: "🏨", label: "Portail établissements",      path: "/admin/providers",     desc: "Valider les demandes d'accès" },
      { icon: "🏥", label: "Réseau de soins",             path: "/healthcare",          desc: "Gérer les établissements partenaires" },
      { icon: "💰", label: "Commissions globales",        path: "/commissions",         desc: "Toutes les commissions agents" },
      { icon: "🌍", label: "Ambassadeurs Diaspora",       path: "/admin/diaspora",      desc: "Gérer le réseau ambassadeurs diaspora" },
      { icon: "⛪", label: "Ambassadeurs Fédérations",    path: "/admin/federation",    desc: "Gérer le réseau fédérations & églises" },
    ],
  },

  // ── Commerce ─────────────────────────────────────────────────
  {
    title: "🤝 Commerce",
    roles: ["ADMIN", "MANAGER"],
    color: "#0891B2",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    links: [
      { icon: "📈", label: "Dashboard commercial",       path: "/",              desc: "Stats de l'équipe commerciale" },
      { icon: "👤", label: "Mes commerciaux",            path: "/agents",        desc: "Gérer et suivre les commerciaux" },
      { icon: "💳", label: "Commissions équipe",         path: "/commissions",   desc: "Performances et rémunérations" },
      { icon: "👥", label: "Clients (lecture)",          path: "/clients",       desc: "Consulter la base clients" },
      { icon: "💵", label: "Paiements",                  path: "/payments",      desc: "Historique des paiements" },
    ],
  },

  // ── Clientèle ────────────────────────────────────────────────
  {
    title: "🧑‍💼 Clientèle",
    roles: ["ADMIN", "CONSEILLERE"],
    color: "#DB2777",
    bg: "#FDF2F8",
    border: "#FBCFE8",
    links: [
      { icon: "👥", label: "Gérer les clients",          path: "/clients",            desc: "Créer, modifier, importer" },
      { icon: "📥", label: "Import CSV clients",         path: "/clients",            desc: "Importation en masse" },
      { icon: "📤", label: "Export clients",             path: "/clients?export=1",   desc: "Exporter en Excel/CSV" },
      { icon: "🏥", label: "Établissements réseau",      path: "/healthcare",         desc: "Gérer les établissements partenaires" },
      { icon: "📤", label: "Export établissements",      path: "/healthcare?export=1",desc: "Exporter en Excel/CSV" },
      { icon: "👨‍👩‍👧‍👦", label: "Groupes",                   path: "/groups",             desc: "Gérer les groupes cotisants" },
    ],
  },

  // ── Réseau Ambassadeurs ──────────────────────────────────────
  {
    title: "🌐 Réseau Ambassadeurs",
    roles: ["ADMIN"],
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    links: [
      { icon: "🌍", label: "Admin Diaspora",             path: "/admin/diaspora",                desc: "Gérer ambassadeurs diaspora" },
      { icon: "⛪", label: "Admin Fédérations",          path: "/admin/federation",              desc: "Gérer ambassadeurs fédérations" },
      { icon: "🚪", label: "Portail Ambassadeurs",       path: "/diaspora/login",                desc: "Accéder au portail unifié", external: true },
      { icon: "🏆", label: "Classement Global",          path: "/admin/ambassador-leaderboard",  desc: "Classement diaspora + fédérations" },
      { icon: "💰", label: "Commissions Ambassadeurs",   path: "/admin/ambassador-commissions",  desc: "Toutes les commissions réseau" },
    ],
  },

  // ── Portails ─────────────────────────────────────────────────
  {
    title: "🔗 Portails",
    roles: ["ADMIN"],
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    links: [
      { icon: "👤", label: "Portail Adhérent",           path: "/client/login",        desc: "Espace client mutualiste",           external: true },
      { icon: "🏥", label: "Portail Établissement",      path: "/etablissement",       desc: "Espace prestataires de soins",       external: true },
      { icon: "🔐", label: "Connexion Admin/Agent",      path: "/login",               desc: "Connexion espace commercial",        external: true },
      { icon: "🌍", label: "Portail Diaspora",           path: "/diaspora/login",      desc: "Espace ambassadeurs diaspora",       external: true },
      { icon: "⛪", label: "Portail Fédération",         path: "/diaspora/login",      desc: "Espace ambassadeurs fédération",     external: true },
    ],
  },
];

export default function AdminHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role?.toUpperCase();
  const roleConfig = ROLE_LABELS[role] || ROLE_LABELS.AGENT;

  const visibleSections = SECTIONS.filter(s => s.roles.includes(role));

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerAvatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={s.headerTitle}>Bienvenue, {user?.name?.split(" ")[0]} 👋</h1>
            <span style={{ ...s.roleBadge, background: roleConfig.bg, color: roleConfig.color }}>
              {roleConfig.label}
            </span>
          </div>
        </div>
        <div style={s.headerRight}>
          <p style={s.headerDate}>
            {new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </p>
          <p style={s.headerTime}>
            {new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div style={s.sections}>
        {visibleSections.map((section, si) => (
          <div key={si} style={{ ...s.section, borderTop: `3px solid ${section.color}` }}>
            <div style={s.sectionHeader}>
              <h2 style={{ ...s.sectionTitle, color: section.color }}>{section.title}</h2>
              <span style={{ ...s.sectionBadge, background: section.bg, color: section.color, border: `1px solid ${section.border}` }}>
                {section.links.length} accès
              </span>
            </div>
            <div style={s.linksGrid}>
              {section.links.map((link, li) => (
                <button
                  key={li}
                  onClick={() => link.external ? window.open(link.path, "_blank") : navigate(link.path)}
                  style={s.linkCard}
                  onMouseEnter={e => {
                    e.currentTarget.style.background    = section.bg;
                    e.currentTarget.style.borderColor   = section.border;
                    e.currentTarget.style.transform     = "translateY(-2px)";
                    e.currentTarget.style.boxShadow     = "0 8px 24px rgba(0,0,0,.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background    = "#fff";
                    e.currentTarget.style.borderColor   = "#E2E8F0";
                    e.currentTarget.style.transform     = "translateY(0)";
                    e.currentTarget.style.boxShadow     = "0 1px 4px rgba(0,0,0,.04)";
                  }}
                >
                  <div style={s.linkIconWrap}>
                    <span style={s.linkIcon}>{link.icon}</span>
                    {link.external && <span style={s.externalTag}>↗</span>}
                  </div>
                  <div style={s.linkText}>
                    <p style={{ ...s.linkLabel, color: section.color }}>{link.label}</p>
                    <p style={s.linkDesc}>{link.desc}</p>
                  </div>
                  <span style={{ ...s.linkArrow, color: section.color }}>→</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page:         { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans',system-ui,sans-serif" },

  header:       { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 20, padding: "24px 28px", marginBottom: 28, boxShadow: "0 2px 12px rgba(0,0,0,.04)" },
  headerLeft:   { display: "flex", alignItems: "center", gap: 16 },
  headerAvatar: { width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#2563EB,#7C3AED)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 },
  headerTitle:  { fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" },
  roleBadge:    { fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 },
  headerRight:  { textAlign: "right" },
  headerDate:   { fontSize: 13, color: "#94A3B8", margin: "0 0 2px", textTransform: "capitalize" },
  headerTime:   { fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0 },

  sections:     { display: "flex", flexDirection: "column", gap: 20 },
  section:      { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  sectionHeader:{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 800, margin: 0 },
  sectionBadge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },

  linksGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 },
  linkCard:     { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all .15s", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  linkIconWrap: { position: "relative", flexShrink: 0 },
  linkIcon:     { fontSize: 22, display: "block" },
  externalTag:  { position: "absolute", top: -4, right: -6, fontSize: 9, fontWeight: 800, color: "#94A3B8" },
  linkText:     { flex: 1, minWidth: 0 },
  linkLabel:    { fontSize: 13, fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  linkDesc:     { fontSize: 11, color: "#94A3B8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  linkArrow:    { fontSize: 16, fontWeight: 700, flexShrink: 0, opacity: 0.6 },
};
