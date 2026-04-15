// src/pages/affilie/AffilieLayout.jsx
// ─────────────────────────────────────────────────────────────
//  Layout principal du portail Affilié
//  Sidebar collapsible + Outlet
//  Rôles : DIRECTRICE | LEADER_AFF | SUPERVISEUR_AFF | RECRUTEUR_AFF
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

// ── Helpers ────────────────────────────────────────────────────
function safe(method, key, val) {
  try { return val !== undefined ? localStorage[method](key, val) : localStorage[method](key); } catch { return null; }
}

function getMember() {
  try { return JSON.parse(safe("getItem", "affilie_member") || "{}"); } catch { return {}; }
}

// ── Couleurs ───────────────────────────────────────────────────
const C = {
  primary: "#7C3AED", primaryL: "#F5F3FF", primaryD: "#5B21B6",
  bg: "#F8FAFC", border: "#E2E8F0", dark: "#0F172A", slate: "#64748B",
  green: "#059669", greenL: "#ECFDF5",
};

// ── Labels des rôles ───────────────────────────────────────────
const ROLE_LABELS = {
  DIRECTRICE:      "👑 Directrice",
  LEADER_AFF:      "🌟 Leader",
  SUPERVISEUR_AFF: "🔷 Superviseur",
  RECRUTEUR_AFF:   "🤝 Recruteur",
};

// ── Navigation selon rôle ──────────────────────────────────────
function getNavItems(role) {
  const base = [
    { to: "/affilie/dashboard",      icon: "📊", label: "Tableau de bord" },
    { to: "/affilie/commissions",    icon: "💰", label: "Commissions"     },
    { to: "/affilie/reseau",         icon: "🌐", label: "Mon réseau"      },
    { to: "/affilie/notifications",  icon: "🔔", label: "Notifications"   },
    { to: "/affilie/profil",         icon: "👤", label: "Mon profil"      },
  ];
  // Directrice, Leader, Superviseur peuvent créer des membres
  if (["DIRECTRICE", "LEADER_AFF", "SUPERVISEUR_AFF"].includes(role)) {
    base.splice(3, 0, { to: "/affilie/membres", icon: "➕", label: "Mes membres" });
  }
  return base;
}

// ── Composant sidebar link ─────────────────────────────────────
function SideLink({ to, icon, label, collapsed, unread }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center", gap: 10,
        padding: collapsed ? "10px 0" : "10px 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 14,
        transition: "all .2s",
        background: isActive ? C.primaryL : "transparent",
        color:      isActive ? C.primary  : C.slate,
        position: "relative",
      })}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
      {unread > 0 && (
        <span style={{
          position: "absolute", top: 6, right: collapsed ? 4 : 10,
          background: "#EF4444", color: "#fff",
          borderRadius: "50%", minWidth: 18, height: 18,
          fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 4px",
        }}>{unread > 9 ? "9+" : unread}</span>
      )}
    </NavLink>
  );
}

// ── Layout principal ───────────────────────────────────────────
export default function AffilieLayout() {
  const navigate   = useNavigate();
  const member     = getMember();
  const [collapsed, setCollapsed] = useState(false);
  const [unread,    setUnread]    = useState(0);
  const [mobile,    setMobile]    = useState(window.innerWidth < 768);
  const [menuOpen,  setMenuOpen]  = useState(false);

  const BASE   = import.meta.env.VITE_API_URL || "https://awoundjo-backend-production-ba8c.up.railway.app";
  const token  = safe("getItem", "affilie_token");
  const navItems = getNavItems(member.role);

  // Responsive
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Compteur de notifications non lues
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/api/affilie/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const list = d?.data?.notifications || [];
        setUnread(list.filter(n => !n.is_read).length);
      })
      .catch(() => {});
  }, []);

  function logout() {
    safe("removeItem", "affilie_token");
    safe("removeItem", "affilie_member");
    navigate("/affilie/login");
  }

  // ── Sidebar desktop ──────────────────────────────────────────
  const sidebar = (
    <aside style={{
      width: collapsed ? 64 : 220, flexShrink: 0,
      background: "#fff", borderRight: `1.5px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      padding: "16px 10px", gap: 4,
      transition: "width .2s",
      position: mobile ? "fixed" : "relative",
      top: mobile ? 0 : "auto",
      left: mobile ? (menuOpen ? 0 : -280) : "auto",
      height: mobile ? "100vh" : "auto",
      zIndex: mobile ? 200 : "auto",
      boxShadow: mobile && menuOpen ? "4px 0 24px rgba(0,0,0,.13)" : "none",
    }}>
      {/* Header sidebar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px 14px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: C.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {member.name || "Affilié"}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{ROLE_LABELS[member.role] || member.role}</p>
          </div>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(p => !p)} style={{
            border: "none", background: C.bg, borderRadius: 8,
            padding: "5px 7px", cursor: "pointer", fontSize: 14, color: C.slate,
          }}>
            {collapsed ? "▶" : "◀"}
          </button>
        )}
        {mobile && (
          <button onClick={() => setMenuOpen(false)} style={{
            border: "none", background: "transparent", cursor: "pointer", fontSize: 20, color: C.slate, marginLeft: "auto",
          }}>✕</button>
        )}
      </div>

      {/* Nav links */}
      {navItems.map(item => (
        <SideLink key={item.to} {...item} collapsed={collapsed && !mobile}
          unread={item.to.includes("notifications") ? unread : 0}
        />
      ))}

      {/* Spacer + déconnexion */}
      <div style={{ flex: 1 }} />
      <button onClick={logout} style={{
        display: "flex", alignItems: "center", gap: 10,
        justifyContent: (collapsed && !mobile) ? "center" : "flex-start",
        padding: (collapsed && !mobile) ? "10px 0" : "10px 14px",
        border: "none", background: "transparent", cursor: "pointer",
        borderRadius: 10, color: "#EF4444", fontSize: 14, fontWeight: 600,
        width: "100%",
      }}>
        <span style={{ fontSize: 18 }}>🚪</span>
        {!(collapsed && !mobile) && <span>Déconnexion</span>}
      </button>
    </aside>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Overlay mobile */}
      {mobile && menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", zIndex: 199,
        }} />
      )}

      {sidebar}

      {/* Contenu */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar mobile */}
        {mobile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", background: "#fff", borderBottom: `1.5px solid ${C.border}`,
          }}>
            <button onClick={() => setMenuOpen(true)} style={{
              border: "none", background: C.primaryL, borderRadius: 8,
              padding: "6px 10px", cursor: "pointer", fontSize: 16, color: C.primary,
            }}>☰</button>
            <span style={{ fontWeight: 800, color: C.primary, fontSize: 15 }}>Awoundjô Affilié</span>
            {unread > 0 && (
              <span style={{
                marginLeft: "auto", background: "#EF4444", color: "#fff",
                borderRadius: 20, padding: "2px 8px", fontSize: 12, fontWeight: 800,
              }}>{unread}</span>
            )}
          </div>
        )}

        {/* Page principale */}
        <main style={{ flex: 1, padding: mobile ? "16px" : "24px 28px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
