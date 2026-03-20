// src/pages/client/ClientLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { clientLogout, getClientData } from "../../clientApi";

const NAV = [
  { path: "/client/dashboard",   icon: "🏠", label: "Accueil" },
  { path: "/client/carte",       icon: "💳", label: "Carte" },
  { path: "/client/cotisations", icon: "💰", label: "Cotisations" },
  { path: "/client/famille",     icon: "👨‍👩‍👧‍👦", label: "Famille" },
  { path: "/client/profil",      icon: "👤", label: "Profil" },
];

const MORE = [
  { path: "/client/dossier",          icon: "📋", label: "Dossier Médical" },
  { path: "/client/teleconsultation", icon: "💬", label: "Téléconsultation" },
  { path: "/client/reseau",           icon: "🏥", label: "Réseau de Soins" },
];

export default function ClientLayout() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const client = getClientData();

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.hInner}>
          <div style={s.hLeft} onClick={() => navigate("/client/dashboard")}>
            <img src="/logo-awoundjjo.png" alt="Awoundjô" style={s.logo} />
            <div>
              <div style={s.appName}>Awoundjô</div>
              <div style={s.appSub}>Espace Adhérent</div>
            </div>
          </div>
          <div style={s.hRight}>
            {client && <div style={s.avatar}>{client.name?.charAt(0).toUpperCase()}</div>}
            <button onClick={() => setMenu(!menu)} style={s.menuBtn}>{menu ? "✕" : "☰"}</button>
          </div>
        </div>
      </header>

      {/* Dropdown */}
      {menu && (
        <div style={s.dropdown}>
          <div style={s.dropUser}>
            <div style={s.dropAvatar}>{client?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={s.dropName}>{client?.name}</div>
              <div style={s.dropNum}>{client?.mutual_number}</div>
            </div>
          </div>
          {MORE.map(item => (
            <button key={item.path} onClick={() => { navigate(item.path); setMenu(false); }}
              style={{ ...s.dropItem, ...(pathname === item.path ? s.dropActive : {}) }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          <hr style={s.hr} />
          <button onClick={clientLogout} style={s.dropLogout}>🚪 Se déconnecter</button>
        </div>
      )}

      {/* Contenu */}
      <main style={s.main}><Outlet /></main>

      {/* Bottom nav */}
      <nav style={s.bottomNav}>
        {NAV.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            style={{ ...s.navItem, ...(pathname === item.path ? s.navActive : {}) }}>
            <span style={s.navIcon}>{item.icon}</span>
            <span style={{ ...s.navLabel, ...(pathname === item.path ? { color: "#1a56db" } : {}) }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const s = {
  root:      { minHeight: "100vh", background: "#F9FAFB", fontFamily: "'Poppins',sans-serif", paddingBottom: 80 },
  header:    { background: "linear-gradient(135deg,#1a56db,#1e40af)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(26,86,219,.25)" },
  hInner:    { maxWidth: 768, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  hLeft:     { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  logo:      { width: 36, height: 36, borderRadius: 10, objectFit: "contain", background: "rgba(255,255,255,.15)", padding: 3 },
  appSub:    { color: "rgba(255,255,255,.7)", fontSize: 11 },
  hRight:    { display: "flex", alignItems: "center", gap: 10 },
  avatar:    { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "rgba(255,255,255,.2)", borderRadius: "50%", color: "#fff", fontWeight: 700, fontSize: 14 },
  menuBtn:   { background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 4 },
  dropdown:  { position: "fixed", top: 60, left: 0, right: 0, background: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,.15)", zIndex: 99, padding: "8px 0", maxWidth: 768, margin: "0 auto" },
  dropUser:  { display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "#F0F7FF", marginBottom: 8 },
  dropAvatar:{ width: 44, height: 44, background: "linear-gradient(135deg,#1a56db,#1e40af)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 },
  dropName:  { fontWeight: 600, fontSize: 15, color: "#111827" },
  dropNum:   { fontSize: 12, color: "#6B7280" },
  dropItem:  { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 20px", background: "none", border: "none", fontSize: 14, color: "#374151", cursor: "pointer", textAlign: "left", fontFamily: "'Poppins',sans-serif" },
  dropActive:{ background: "#EFF6FF", color: "#1a56db", fontWeight: 600 },
  hr:        { border: "none", borderTop: "1px solid #F3F4F6", margin: "4px 0" },
  dropLogout:{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 20px", background: "none", border: "none", fontSize: 14, color: "#EF4444", cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
  main:      { maxWidth: 768, margin: "0 auto", padding: "0 0 20px" },
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E5E7EB", display: "flex", boxShadow: "0 -4px 20px rgba(0,0,0,.08)", zIndex: 100 },
  navItem:   { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 4px", background: "none", border: "none", cursor: "pointer", gap: 2 },
  navActive: { color: "#1a56db" },
  navIcon:   { fontSize: 22 },
  navLabel:  { fontSize: 10, color: "#6B7280", fontFamily: "'Poppins',sans-serif" },
};
