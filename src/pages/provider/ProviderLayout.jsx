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
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
  hospital: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/scan",         icon: "🔍", label: "Prise en charge" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
    { path: "/etablissement/medical",      icon: "📋", label: "Dossiers médicaux" },
    { path: "/etablissement/prescriptions",icon: "💊", label: "Ordonnances émises" },
    { path: "/etablissement/billing",      icon: "💰", label: "Facturation" },
  ],
  // Labo / Opticien / Dentiste / Sage-femme : prise en charge simple, pas de dossier médical
  lab: [
    { path: "/etablissement/dashboard",    icon: "🏠", label: "Tableau de bord" },
    { path: "/etablissement/scan",         icon: "🔍", label: "Prise en charge" },
    { path: "/etablissement/services",     icon: "📝", label: "Actes enregistrés" },
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
        {/* Logo */}
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

        {/* Provider info */}
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
                  color: active ? "#2563EB" : "#64748B",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                {active && !collapsed && <div style={s.navActive} />}
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

  sidebar:      { background: "#fff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", padding: "20px 12px", transition: "width .25s", position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden", flexShrink: 0 },
  logoRow:      { display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #F1F5F9" },
  logoBox:      { width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" },
  logoImg:      { width: "100%", height: "100%", objectFit: "cover" },
  logoText:     { flex: 1, minWidth: 0 },
  logoName:     { fontSize: 14, fontWeight: 800, color: "#1E293B", margin: 0 },
  logoSub:      { fontSize: 10, color: "#94A3B8", margin: 0 },
  collapseBtn:  { background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14, padding: 4, flexShrink: 0 },

  providerCard: { display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC", borderRadius: 12, padding: "10px 12px", marginBottom: 20 },
  providerAvatar:{ fontSize: 20, width: 36, height: 36, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  providerName: { fontSize: 13, fontWeight: 700, color: "#1E293B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  providerType: { fontSize: 11, color: "#94A3B8", margin: 0 },

  nav:          { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navItem:      { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, transition: "all .15s", position: "relative", textAlign: "left" },
  navLabel:     { flex: 1 },
  navActive:    { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: "#2563EB", borderRadius: 2 },

  content:      { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar:       { background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  topbarLeft:   {},
  topbarTitle:  { fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0 },
  topbarRight:  { display: "flex", alignItems: "center", gap: 20 },
  topbarDate:   { fontSize: 13, color: "#94A3B8", textTransform: "capitalize" },
  topbarProvider:{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "6px 12px" },
  topbarProviderIcon: { fontSize: 16 },
  topbarProviderName: { fontSize: 13, fontWeight: 600, color: "#374151" },

  main:         { flex: 1, padding: "28px 32px", overflowY: "auto" },
};
