// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_CONFIG = {
  ADMIN:       { label: "Administrateur",       color: "#7C3AED" },
  MANAGER:     { label: "Resp. Commercial",     color: "#0891B2" },
  CONSEILLERE: { label: "Conseillère Clientèle",color: "#DB2777" },
  AGENT:       { label: "Commercial",           color: "#059669" },
};

const NAV_BY_ROLE = {
  ADMIN: [
    { to: "/",                label: "Tableau de bord",  icon: "📊" },
    { to: "/clients",         label: "Clients",          icon: "👥" },
    { to: "/groups",          label: "Groupes",          icon: "👨‍👩‍👧‍👦" },
    { to: "/payments",        label: "Paiements",        icon: "💳" },
    { to: "/commissions",     label: "Commissions",      icon: "💰" },
    { to: "/healthcare",      label: "Réseau soins",     icon: "🏥" },
    { to: "/admin/providers", label: "Établissements",   icon: "🏨" },
    { to: "/agents",          label: "Agents",           icon: "🧑‍💼" },
    { to: "/hub",             label: "Hub Admin",        icon: "🔑" },
  ],
  MANAGER: [
    { to: "/",            label: "Dashboard",    icon: "📊" },
    { to: "/clients",     label: "Clients",      icon: "👥" },
    { to: "/payments",    label: "Paiements",    icon: "💳" },
    { to: "/commissions", label: "Commissions",  icon: "💰" },
    { to: "/agents",      label: "Mon équipe",   icon: "🧑‍💼" },
    { to: "/hub",         label: "Hub",          icon: "🔑" },
  ],
  CONSEILLERE: [
    { to: "/",           label: "Dashboard",     icon: "📊" },
    { to: "/clients",    label: "Clients",       icon: "👥" },
    { to: "/groups",     label: "Groupes",       icon: "👨‍👩‍👧‍👦" },
    { to: "/payments",   label: "Paiements",     icon: "💳" },
    { to: "/healthcare", label: "Établissements",icon: "🏥" },
    { to: "/hub",        label: "Hub",           icon: "🔑" },
  ],
  AGENT: [
    { to: "/",         label: "Dashboard", icon: "📊" },
    { to: "/clients",  label: "Clients",   icon: "👥" },
    { to: "/groups",   label: "Groupes",   icon: "👨‍👩‍👧‍👦" },
    { to: "/payments", label: "Paiements", icon: "💳" },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = (user?.role || "AGENT").toUpperCase();
  const links = NAV_BY_ROLE[role] || NAV_BY_ROLE.AGENT;
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.AGENT;

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-brand-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg flex-shrink-0">
          <img src="/logo-awoundjo.jpg" alt="Awoundjô" className="w-8 h-8 rounded-md object-cover object-top" />
          <span className="hidden sm:block">Awoundjô</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto max-w-3xl">
          {links.map(({ to, label, icon }) => {
            const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                  ${isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                <span>{icon}</span>{label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-white text-sm font-semibold leading-none">{user?.name}</p>
            <p className="text-white/60 text-xs mt-0.5">{roleConfig.label}</p>
          </div>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
            Déconnexion
          </button>
        </div>

        <button className="md:hidden text-white p-1" onClick={() => setMenuOpen(v => !v)}>
          <span className="text-2xl">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-brand-700 px-4 pb-4 space-y-1">
          {links.map(({ to, label, icon }) => {
            const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                  ${isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                <span>{icon}</span>{label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{user?.name}</p>
              <p className="text-white/60 text-xs">{roleConfig.label}</p>
            </div>
            <button onClick={handleLogout} className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg">
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
