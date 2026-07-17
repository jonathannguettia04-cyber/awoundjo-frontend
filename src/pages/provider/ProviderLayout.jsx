// src/pages/provider/ProviderLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { providerLogout, getProviderData } from "../../providerApi";

const TYPE_ICONS  = { pharmacy: "💊", clinic: "🏥", hospital: "🏨", lab: "🔬", optician: "👓", dentist: "🦷", midwife: "🤱" };
const TYPE_LABELS = { pharmacy: "Pharmacie", clinic: "Clinique", hospital: "Hôpital", lab: "Laboratoire", optician: "Opticien", dentist: "Dentiste", midwife: "Sage-femme" };

// Menu par type de prestataire
const NAV_BY_TYPE = {
  // Pharmacie : voit les ordonnances émises par les cliniques → exécute des bons
  pharmacy: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/prescriptions",icon: "💊", label: "Ordonnances patients" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
  // Clinique / Hôpital : prise en charge + dossier médical + ordonnances émises
  clinic: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/scan",         icon: "🔍", label: "Prise en charge" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
    { path: "/etablissement/medical",      icon: "📋", label: "Dossiers médicaux" },
    { path: "/etablissement/exam-requests",icon: "🔬", label: "Accords préalables" },
    { path: "/etablissement/prior-auth",   icon: "🏨", label: "Actes lourds" },
    { path: "/etablissement/doctors",      icon: "🩺", label: "Praticiens" },
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
  hospital: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/scan",         icon: "🔍", label: "Prise en charge" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
    { path: "/etablissement/medical",      icon: "📋", label: "Dossiers médicaux" },
    { path: "/etablissement/prescriptions",icon: "💊", label: "Ordonnances émises" },
    { path: "/etablissement/exam-requests",icon: "🔬", label: "Accords préalables" },
    { path: "/etablissement/prior-auth",   icon: "🏨", label: "Actes lourds" },
    { path: "/etablissement/doctors",      icon: "🩺", label: "Praticiens" },
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
  // Labo / Opticien / Dentiste / Sage-femme : prise en charge simple, pas de dossier médical
  lab: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/scan",         icon: "🔍", label: "Prise en charge" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
    { path: "/etablissement/exam-requests",icon: "🔬", label: "Accords à exécuter" },
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
  optician: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/scan",         icon: "🔍", label: "Prise en charge" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
  dentist: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/scan",         icon: "🔍", label: "Prise en charge" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
  midwife: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/scan",         icon: "🔍", label: "Prise en charge" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
    { path: "/etablissement/medical",      icon: "📋", label: "Dossiers médicaux" },
    { path: "/etablissement/prior-auth",   icon: "🏨", label: "Actes lourds" },
    { path: "/etablissement/doctors",      icon: "🩺", label: "Praticiens" },
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
};

export default function ProviderLayout() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const provider     = getProviderData();
  const [collapsed, setCollapsed] = useState(false);
  // Menu adapté au type de prestataire (fallback = menu clinique)
  const NAV = NAV_BY_TYPE[provider?.type] || NAV_BY_TYPE.clinic;

  return (
    <div style={s.root}>
      {/* ── Sidebar ── */}
      <aside style={{ ...s.sidebar, width: collapsed ? 72 : 240 }}>
        {/* Logo — bandeau dégradé */}
        <div style={s.logoBand}>
          <div style={s.logoRow}>
            <div style={s.logoBox}>
              <img src="/logo-awoundjjo.jpg" alt="Awoundjô" style={s.logoImg}
                onError={e => { e.target.style.display = "none"; }} />
            </div>
            {!collapsed && (
              <div style={s.logoText}>
                <p style={s.logoName}>Awoundjô</p>
                <p style={s.logoSub}>Portail Prestataire</p>
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} style={s.collapseBtn}>
              {collapsed ? "→" : "←"}
            </button>
          </div>
        </div>

        {/* Provider info — carte flottante en chevauchement du bandeau */}
        {!collapsed && provider && (
          <div style={s.providerCard}>
            <div style={s.providerAvatar}>
              {TYPE_ICONS[provider.type] || "🏥"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={s.providerName}>{provider.name}</p>
              <p style={s.providerType}>{TYPE_LABELS[provider.type]}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={s.nav}>
          {NAV.map(item => {
            const active = pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{
                  ...s.navItem,
                  background: active ? "#EFF6FF" : "transparent",
                  color: active ? "#1D4ED8" : "#64748B",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}>
                {active && <div style={s.navActive} />}
                <span style={{ fontSize: 18, flexShrink: 0, filter: active ? "none" : "grayscale(35%)", opacity: active ? 1 : 0.85 }}>{item.icon}</span>
                {!collapsed && <span style={s.navLabel}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button onClick={providerLogout} style={{ ...s.navItem, color: "#EF4444", marginTop: "auto", justifyContent: collapsed ? "center" : "flex-start" }}>
          <span style={{ fontSize: 18 }}>🚪</span>
          {!collapsed && <span style={s.navLabel}>Déconnexion</span>}
        </button>
      </aside>

      {/* ── Contenu ── */}
      <div style={s.content}>
        {/* Topbar */}
        <header style={s.topbar}>
          <div style={s.topbarLeft}>
            <h1 style={s.topbarTitle}>
              {NAV.find(n => pathname.startsWith(n.path))?.label || "Portail"}
            </h1>
          </div>
          <div style={s.topbarRight}>
            <div style={s.topbarDate}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {provider && (
              <div style={s.topbarProvider}>
                <span style={s.topbarProviderIcon}>{TYPE_ICONS[provider.type]}</span>
                <span style={s.topbarProviderName}>{provider.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page */}
        <main style={s.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const s = {
  root:         { display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',system-ui,sans-serif" },

  sidebar:      { background: "#fff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", padding: "0 12px 20px", transition: "width .25s", position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden", flexShrink: 0 },

  // Bandeau dégradé — signature visuelle du portail (teinte "nuit/confiance",
  // distincte du bleu d'action #2563EB utilisé pour les états actifs plus bas)
  logoBand:     { margin: "0 -12px 28px", padding: "18px 20px 24px", background: "linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%)", borderBottom: "3px solid #2563EB" },
  logoRow:      { display: "flex", alignItems: "center", gap: 10 },
  logoBox:      { width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoImg:      { width: "100%", height: "100%", objectFit: "cover" },
  logoText:     { flex: 1, minWidth: 0 },
  logoName:     { fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 },
  logoSub:      { fontSize: 10, color: "#93C5FD", margin: 0 },
  collapseBtn:  { background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", fontSize: 13, padding: "4px 7px", flexShrink: 0 },

  // Carte prestataire — chevauche le bas du bandeau pour un effet "flottant"
  providerCard: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,0.08)", borderRadius: 14, padding: "10px 12px", margin: "-20px 0 20px" },
  providerAvatar:{ fontSize: 20, width: 36, height: 36, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  providerName: { fontSize: 13, fontWeight: 700, color: "#1E293B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  providerType: { fontSize: 11, color: "#94A3B8", margin: 0 },

  nav:          { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
  navItem:      { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, transition: "background .15s, color .15s", position: "relative", textAlign: "left" },
  navLabel:     { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  navActive:    { position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", width: 3, height: 22, background: "#2563EB", borderRadius: "0 3px 3px 0" },

  content:      { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar:       { background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 3px rgba(15,23,42,0.04)" },
  topbarLeft:   {},
  topbarTitle:  { fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0 },
  topbarRight:  { display: "flex", alignItems: "center", gap: 20 },
  topbarDate:   { fontSize: 13, color: "#94A3B8", textTransform: "capitalize" },
  topbarProvider:{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "6px 12px" },
  topbarProviderIcon: { fontSize: 16 },
  topbarProviderName: { fontSize: 13, fontWeight: 600, color: "#374151" },

  main:         { flex: 1, padding: "28px 32px", overflowY: "auto" },
};
