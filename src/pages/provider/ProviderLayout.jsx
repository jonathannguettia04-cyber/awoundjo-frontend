// src/pages/provider/ProviderLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { providerLogout, getProviderData } from "../../providerApi";

const TYPE_ICONS = { pharmacy: "💊", clinic: "🏥", hospital: "🏨", lab: "🔬" };

const NAV = [
  { path: "/etablissement/dashboard", icon: "🏠", label: "Accueil" },
  { path: "/etablissement/scan",      icon: "📷", label: "Scanner" },
  { path: "/etablissement/services",  icon: "📝", label: "Services" },
  { path: "/etablissement/medical",   icon: "📋", label: "Dossiers" },
  { path: "/etablissement/billing",   icon: "💰", label: "Facturation" },
];

const S = {
  root:      { minHeight: "100vh", background: "#F0F4F8", fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 76 },
  header:    { background: "linear-gradient(135deg,#0f2942,#0a3d62)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(15,41,66,.4)" },
  hInner:    { maxWidth: 768, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  hLeft:     { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  logoImg:   { width: 34, height: 34, objectFit: "contain", borderRadius: 8, background: "rgba(255,255,255,.12)", padding: 4 },
  hName:     { color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 },
  hSub:      { color: "rgba(255,255,255,.5)", fontSize: 11 },
  hRight:    { display: "flex", alignItems: "center", gap: 8 },
  typeBadge: { fontSize: 11, fontWeight: 700, background: "rgba(0,188,212,.2)", color: "#00BCD4", border: "1px solid rgba(0,188,212,.3)", borderRadius: 8, padding: "3px 8px" },
  menuBtn:   { background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 4 },
  dropdown:  { position: "fixed", top: 58, left: 0, right: 0, background: "#0a3d62", boxShadow: "0 8px 30px rgba(0,0,0,.3)", zIndex: 99, maxWidth: 768, margin: "0 auto" },
  dropUser:  { display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.1)" },
  dropAvatar:{ width: 44, height: 44, background: "linear-gradient(135deg,#00BCD4,#0097A7)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  dropName:  { fontWeight: 700, fontSize: 15, color: "#fff" },
  dropSub:   { fontSize: 12, color: "rgba(255,255,255,.5)" },
  dropItem:  { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 20px", background: "none", border: "none", fontSize: 14, color: "rgba(255,255,255,.8)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background .15s" },
  dropLogout:{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 20px", background: "none", border: "none", fontSize: 14, color: "#FF6B6B", cursor: "pointer", fontFamily: "inherit", borderTop: "1px solid rgba(255,255,255,.08)" },
  main:      { maxWidth: 768, margin: "0 auto", padding: "16px 16px 0" },
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#0f2942", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", boxShadow: "0 -4px 20px rgba(0,0,0,.25)", zIndex: 100 },
  navItem:   { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 4px", background: "none", border: "none", cursor: "pointer", gap: 3, transition: "background .15s" },
  navIcon:   { fontSize: 20 },
  navLabel:  { fontSize: 10, color: "rgba(255,255,255,.45)", fontFamily: "'DM Sans',sans-serif" },
  navLabelActive: { color: "#00BCD4" },
};

export default function ProviderLayout() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const provider = getProviderData();

  return (
    <div style={S.root}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.hInner}>
          <div style={S.hLeft} onClick={() => navigate("/etablissement/dashboard")}>
            <img src="/logo-awoundjjo.png" alt="Awoundjô" style={S.logoImg} />
            <div>
              <div style={S.hName}>{provider?.name || "Établissement"}</div>
              <div style={S.hSub}>Portail Prestataire</div>
            </div>
          </div>
          <div style={S.hRight}>
            {provider?.type && (
              <span style={S.typeBadge}>{TYPE_ICONS[provider.type]} {provider.type}</span>
            )}
            <button onClick={() => setMenu(!menu)} style={S.menuBtn}>{menu ? "✕" : "☰"}</button>
          </div>
        </div>
      </header>

      {/* Dropdown */}
      {menu && (
        <div style={S.dropdown}>
          <div style={S.dropUser}>
            <div style={S.dropAvatar}>{TYPE_ICONS[provider?.type] || "🏥"}</div>
            <div>
              <div style={S.dropName}>{provider?.name}</div>
              <div style={S.dropSub}>{provider?.phone} · {provider?.city}</div>
            </div>
          </div>
          <button onClick={() => { navigate("/etablissement/profile"); setMenu(false); }} style={S.dropItem}>
            👤 Mon profil
          </button>
          <button onClick={() => { navigate("/etablissement/history"); setMenu(false); }} style={S.dropItem}>
            📅 Historique
          </button>
          <button onClick={providerLogout} style={S.dropLogout}>
            🚪 Se déconnecter
          </button>
        </div>
      )}

      {/* Contenu */}
      <main style={S.main}><Outlet /></main>

      {/* Bottom nav */}
      <nav style={S.bottomNav}>
        {NAV.map(item => {
          const active = pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{ ...S.navItem, ...(active ? { background: "rgba(0,188,212,.1)" } : {}) }}>
              <span style={S.navIcon}>{item.icon}</span>
              <span style={{ ...S.navLabel, ...(active ? S.navLabelActive : {}) }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
