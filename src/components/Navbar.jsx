// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";

function getNavLinks(role) {
  const common = [
    { to: "/",        label: "Tableau de bord", icon: "ti-layout-dashboard" },
    { to: "/clients", label: "Clients",         icon: "ti-users" },
  ];

  const byRole = {
    ADMIN: [
      ...common,
      { to: "/groups",          label: "Groupes",         icon: "ti-users-group" },
      { to: "/payments",        label: "Paiements",       icon: "ti-credit-card" },
      { to: "/commissions",     label: "Commissions",     icon: "ti-coins" },
      { to: "/healthcare",      label: "Réseau de soins", icon: "ti-heart-rate-monitor" },
      { to: "/admin/providers", label: "Établissements",  icon: "ti-building-hospital" },
      { to: "/agents",          label: "Agents",          icon: "ti-id-badge" },
      { to: "/admin/diaspora",  label: "Diaspora",        icon: "ti-world" },
      { to: "/hub",             label: "Hub Admin",       icon: "ti-key" },
    ],
    AGENT: [
      ...common,
      { to: "/groups",      label: "Groupes",     icon: "ti-users-group" },
      { to: "/payments",    label: "Paiements",   icon: "ti-credit-card" },
      { to: "/commissions", label: "Commissions", icon: "ti-coins" },
    ],
    RESPONSABLE_COMMERCIAL: [
      ...common,
      { to: "/groups",      label: "Groupes",     icon: "ti-users-group" },
      { to: "/payments",    label: "Paiements",   icon: "ti-credit-card" },
      { to: "/commissions", label: "Commissions", icon: "ti-coins" },
      { to: "/agents",      label: "Mon équipe",  icon: "ti-id-badge" },
    ],
    CONSEILLERE_CLIENTELE: [
      ...common,
      { to: "/groups",          label: "Groupes",         icon: "ti-users-group" },
      { to: "/healthcare",      label: "Réseau de soins", icon: "ti-heart-rate-monitor" },
      { to: "/admin/providers", label: "Établissements",  icon: "ti-building-hospital" },
    ],
  };

  return byRole[role] || common;
}

/** Initiales à partir du nom complet */
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { role, label: roleLabel } = useRole();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = getNavLinks(role);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 shadow-md" style={{ background: "#1a5fa8" }}>
      {/* ── Barre principale ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 h-[52px] flex items-center gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 no-underline">
          <div
            className="flex items-center justify-center rounded-md text-white font-bold text-sm"
            style={{ width: 28, height: 28, background: "#00c4b4", letterSpacing: "-0.5px" }}
          >
            Aw
          </div>
          <span className="hidden sm:block text-white font-bold text-sm">Awoundjô</span>
        </Link>

        {/* Séparateur */}
        <div className="hidden md:block flex-shrink-0 w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.2)" }} />

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 min-w-0 overflow-hidden">
          {links.map(({ to, label, icon }) => {
            const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-150 no-underline"
                style={{
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                  background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.10)";
                  if (!isActive) e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                  if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }}
              >
                <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 15 }} />
                <span className="hidden lg:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Séparateur */}
        <div className="hidden md:block flex-shrink-0 w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.2)" }} />

        {/* Utilisateur + déconnexion */}
        <div className="hidden md:flex items-center gap-2.5 flex-shrink-0 ml-auto">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
              style={{ width: 28, height: 28, background: "#00c4b4", fontSize: 11 }}
            >
              {initials(user?.name)}
            </div>
            {/* Nom + rôle */}
            <div className="hidden lg:block leading-tight">
              <p className="text-white text-xs font-semibold">{user?.name}</p>
              <span
                className="text-xs font-semibold px-2 rounded-full"
                style={{
                  background: "rgba(0,196,180,0.20)",
                  color: "#00c4b4",
                  fontSize: 10,
                  paddingTop: 1,
                  paddingBottom: 1,
                }}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-medium rounded-lg px-3 py-1.5 transition-colors duration-150"
            style={{
              color: "rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.14)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            }}
          >
            Déconnexion
          </button>
        </div>

        {/* Burger mobile */}
        <button
          className="md:hidden flex items-center justify-center rounded-lg ml-auto flex-shrink-0 transition-colors"
          style={{
            width: 32,
            height: 32,
            background: menuOpen ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)",
          }}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <i
            className={`ti ${menuOpen ? "ti-x" : "ti-menu-2"} text-white`}
            aria-hidden="true"
            style={{ fontSize: 18 }}
          />
        </button>
      </div>

      {/* ── Drawer mobile ───────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="md:hidden px-3 pb-3 flex flex-col gap-0.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
        >
          {links.map(({ to, label, icon }) => {
            const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium no-underline"
                style={{
                  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                  background: isActive ? "rgba(255,255,255,0.16)" : "transparent",
                  marginTop: 2,
                }}
              >
                <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 17 }} />
                {label}
              </Link>
            );
          })}

          {/* Footer utilisateur */}
          <div
            className="mt-2 pt-3 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
                style={{ width: 32, height: 32, background: "#00c4b4", fontSize: 12 }}
              >
                {initials(user?.name)}
              </div>
              <div className="leading-tight">
                <p className="text-white text-sm font-semibold">{user?.name}</p>
                <span
                  className="font-semibold rounded-full"
                  style={{
                    background: "rgba(0,196,180,0.20)",
                    color: "#00c4b4",
                    fontSize: 11,
                    padding: "1px 8px",
                  }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
              style={{
                color: "rgba(255,255,255,0.8)",
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.2)",
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
