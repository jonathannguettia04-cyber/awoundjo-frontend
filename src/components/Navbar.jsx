import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_COMMON = [
  { to: "/",            label: "Tableau de bord", icon: "📊" },
  { to: "/clients",     label: "Clients",         icon: "👥" },
  { to: "/payments",    label: "Paiements",       icon: "💳" },
  { to: "/commissions", label: "Commissions",     icon: "💰" },
];

const NAV_ADMIN_EXTRA = [
  { to: "/agents", label: "Agents", icon: "🧑‍💼" },
];

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = isAdmin ? [...NAV_COMMON, ...NAV_ADMIN_EXTRA] : NAV_COMMON;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-brand-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg flex-shrink-0">
          <img src="/logo-awoundjo.jpg" alt="Awoundjô" className="w-8 h-8 rounded-md object-cover object-top" />
          <span className="hidden sm:block">Awoundjô</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon }) => {
            const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                <span>{icon}</span>{label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-white text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-white/60 text-xs">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Déconnexion
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="text-2xl">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-700 px-4 pb-4 space-y-1">
          {links.map(({ to, label, icon }) => {
            const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                  ${isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                <span>{icon}</span>{label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{user?.name}</p>
              <p className="text-white/60 text-xs">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}