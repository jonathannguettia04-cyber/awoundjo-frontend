import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_COMMON = [
  { to: "/",            label: "Tableau de bord", icon: "📊" },
  { to: "/clients",     label: "Clients",         icon: "👥" },
  { to: "/groups",      label: "Groupes",         icon: "👨‍👩‍👧‍👦" },
  { to: "/payments",    label: "Paiements",       icon: "💳" },
  { to: "/commissions", label: "Commissions",     icon: "💰" },
];

const NAV_ADMIN_EXTRA = [
  { to: "/healthcare",      label: "Réseau de soins", icon: "🏥" },
  { to: "/admin/providers", label: "Établissements",  icon: "🏨" },
  { to: "/agents",          label: "Agents",          icon: "🧑‍💼" },
];

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = isAdmin ? [...NAV_COMMON, ...NAV_ADMIN_EXTRA] : NAV_COMMON;

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-brand-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 h-14 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-base flex-shrink-0">
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
                  ${isActive
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}>
                <span className="text-sm">{icon}</span>
                <span className="hidden lg:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden lg:block">
            <p className="text-white text-xs font-medium leading-none">{user?.name}</p>
            <p className="text-white/60 text-xs">{user?.role}</p>
          </div>
          <button onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Déconnexion
          </button>
        </div>

        {/* Burger mobile */}
        <button className="md:hidden text-white p-1 flex-shrink-0" onClick={() => setMenuOpen((v) => !v)}>
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
              <p className="text-white text-sm font-medium">{user?.name}</p>
              <p className="text-white/60 text-xs">{user?.role}</p>
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
