// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole, ROLE_LABELS, ROLE_COLORS } from "../context/RoleContext";

// Menu par rôle
function getNavLinks(role) {
  const common = [
    { to: "/",        label: "Tableau de bord", icon: "📊" },
    { to: "/clients", label: "Clients",         icon: "👥" },
  ];

  const byRole = {
    ADMIN: [
      ...common,
      { to: "/groups",          label: "Groupes",         icon: "👨‍👩‍👧‍👦" },
      { to: "/payments",        label: "Paiements",       icon: "💳" },
      { to: "/commissions",     label: "Commissions",     icon: "💰" },
      { to: "/healthcare",      label: "Réseau de soins", icon: "🏥" },
      { to: "/admin/providers", label: "Établissements",  icon: "🏨" },
      { to: "/agents",          label: "Agents",          icon: "🧑‍💼" },
      { to: "/admin/diaspora",  label: "Diaspora",         icon: "🌍" },
      { to: "/hub",             label: "Hub Admin",        icon: "🔑" },
    ],
    AGENT: [
      ...common,
      { to: "/groups",      label: "Groupes",     icon: "👨‍👩‍👧‍👦" },
      { to: "/payments",    label: "Paiements",   icon: "💳" },
      { to: "/commissions", label: "Commissions", icon: "💰" },
    ],
    RESPONSABLE_COMMERCIAL: [
      ...common,
      { to: "/groups",      label: "Groupes",     icon: "👨‍👩‍👧‍👦" },
      { to: "/payments",    label: "Paiements",   icon: "💳" },
      { to: "/commissions", label: "Commissions", icon: "💰" },
      { to: "/agents",          label: "Mon équipe",  icon: "🧑‍💼" },
    ],
    CONSEILLERE_CLIENTELE: [
      ...common,
      { to: "/groups",          label: "Groupes",         icon: "👨‍👩‍👧‍👦" },
      { to: "/healthcare",      label: "Réseau de soins", icon: "🏥" },
      { to: "/admin/providers", label: "Établissements",  icon: "🏨" },
    ],
  };

  return byRole[role] || common;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { role, label: roleLabel } = useRole();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = getNavLinks(role);
  const roleColors = ROLE_COLORS[role] || ROLE_COLORS.AGENT;

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-brand-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 h-14 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold flex-shrink-0">
          <img src="/logo-awoundjjo.png" alt="Awoundjô" className="w-7 h-7 rounded-md object-contain" />
          <span className="hidden lg:block text-sm font-bold">Awoundjô</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center overflow-hidden">
          {links.map(({ to, label, icon }) => {
            const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0
                  ${isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                <span className="text-sm">{icon}</span>
                <span className="hidden lg:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden lg:block">
            <p className="text-white text-xs font-semibold leading-none">{user?.name}</p>
            <p className={`text-xs mt-0.5 px-1.5 py-0.5 rounded-full font-medium ${roleColors.bg} ${roleColors.text}`}>
              {roleLabel}
            </p>
          </div>
          <button onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Déconnexion
          </button>
        </div>

        {/* Burger mobile */}
        <button className="md:hidden text-white p-1 flex-shrink-0" onClick={() => setMenuOpen(v => !v)}>
          <span className="text-2xl">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Menu mobile */}
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
              <p className="text-white text-sm font-semibold">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors.bg} ${roleColors.text}`}>
                {roleLabel}
              </span>
            </div>
            <button onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
