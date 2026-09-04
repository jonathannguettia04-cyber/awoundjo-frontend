// src/components/Sidebar.jsx
// Remplace Navbar.jsx : navigation latérale collapsible, liens groupés par catégorie.
// Mêmes contexts (useAuth, useRole) et même ADMIN_BASE — rien à changer côté routing/auth.
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";
import { ADMIN_BASE } from "../config/adminBase";

const EXPANDED_WIDTH  = 248;
const COLLAPSED_WIDTH = 76;

// ── Navigation groupée par catégorie et par rôle ──────────────────────────
// (avant : liste plate coupée après 6 liens + menu "Plus..." qui débordait)
function getNavSections(role) {
  const dashboard = { to: ADMIN_BASE, label: "Tableau de bord", icon: "ti-layout-dashboard" };

  const sectionsByRole = {
    ADMIN: [
      { title: null, links: [dashboard] },
      { title: "Adhésions", links: [
        { to: `${ADMIN_BASE}/clients`, label: "Clients",   icon: "ti-users" },
        { to: `${ADMIN_BASE}/groups`,  label: "Groupes",   icon: "ti-users-group" },
      ]},
      { title: "Finance", links: [
        { to: `${ADMIN_BASE}/payments`,    label: "Paiements",   icon: "ti-credit-card" },
        { to: `${ADMIN_BASE}/commissions`, label: "Commissions", icon: "ti-coins" },
      ]},
      { title: "Réseau", links: [
        { to: `${ADMIN_BASE}/healthcare`, label: "Réseau de soins", icon: "ti-heart-rate-monitor" },
        { to: `${ADMIN_BASE}/providers`,  label: "Établissements",  icon: "ti-building-hospital" },
      ]},
      { title: "Organisation", links: [
        { to: `${ADMIN_BASE}/agents`,   label: "Agents",   icon: "ti-id-badge" },
        { to: `${ADMIN_BASE}/diaspora`, label: "Diaspora", icon: "ti-world" },
      ]},
      { title: "Contenu", links: [
        { to: `${ADMIN_BASE}/blog`, label: "Blog", icon: "ti-notes" },
      ]},
      { title: "Système", links: [
        { to: `${ADMIN_BASE}/settings`, label: "Paramètres", icon: "ti-adjustments" },
        { to: `${ADMIN_BASE}/hub`,      label: "Hub Admin",  icon: "ti-key" },
      ]},
    ],
    AGENT: [
      { title: null, links: [dashboard] },
      { title: "Adhésions", links: [
        { to: `${ADMIN_BASE}/clients`, label: "Clients", icon: "ti-users" },
        { to: `${ADMIN_BASE}/groups`,  label: "Groupes", icon: "ti-users-group" },
      ]},
      { title: "Finance", links: [
        { to: `${ADMIN_BASE}/payments`,    label: "Paiements",   icon: "ti-credit-card" },
        { to: `${ADMIN_BASE}/commissions`, label: "Commissions", icon: "ti-coins" },
      ]},
    ],
    RESPONSABLE_COMMERCIAL: [
      { title: null, links: [dashboard] },
      { title: "Adhésions", links: [
        { to: `${ADMIN_BASE}/clients`, label: "Clients", icon: "ti-users" },
        { to: `${ADMIN_BASE}/groups`,  label: "Groupes", icon: "ti-users-group" },
      ]},
      { title: "Finance", links: [
        { to: `${ADMIN_BASE}/payments`,    label: "Paiements",   icon: "ti-credit-card" },
        { to: `${ADMIN_BASE}/commissions`, label: "Commissions", icon: "ti-coins" },
      ]},
      { title: "Équipe", links: [
        { to: `${ADMIN_BASE}/agents`, label: "Mon équipe", icon: "ti-id-badge" },
      ]},
    ],
    CONSEILLERE_CLIENTELE: [
      { title: null, links: [dashboard] },
      { title: "Adhésions", links: [
        { to: `${ADMIN_BASE}/clients`, label: "Clients", icon: "ti-users" },
        { to: `${ADMIN_BASE}/groups`,  label: "Groupes", icon: "ti-users-group" },
      ]},
      { title: "Réseau", links: [
        { to: `${ADMIN_BASE}/healthcare`, label: "Réseau de soins", icon: "ti-heart-rate-monitor" },
        { to: `${ADMIN_BASE}/providers`,  label: "Établissements",  icon: "ti-building-hospital" },
      ]},
    ],
    COMMUNITY_MANAGER: [
      { title: null, links: [dashboard] },
      { title: "Adhésions", links: [
        { to: `${ADMIN_BASE}/clients`, label: "Clients", icon: "ti-users" },
      ]},
      { title: "Communication", links: [
        { to: `${ADMIN_BASE}/broadcasts`, label: "Broadcast", icon: "ti-speakerphone" },
        { to: `${ADMIN_BASE}/blog`,       label: "Blog",      icon: "ti-notes" },
      ]},
      { title: "Réseau", links: [
        { to: `${ADMIN_BASE}/healthcare`, label: "Réseau de soins", icon: "ti-heart-rate-monitor" },
      ]},
    ],
    APPORTEUR_AFFAIRES: [
      { title: null, links: [dashboard] },
      { title: "Adhésions", links: [
        { to: `${ADMIN_BASE}/clients`,    label: "Clients",    icon: "ti-users" },
        { to: `${ADMIN_BASE}/groups`,     label: "Groupes",    icon: "ti-users-group" },
        { to: `${ADMIN_BASE}/cotations`,  label: "Cotations",  icon: "ti-file-text" },
      ]},
      { title: "Finance", links: [
        { to: `${ADMIN_BASE}/commissions`, label: "Commissions", icon: "ti-coins" },
      ]},
    ],
  };

  return sectionsByRole[role] || [{ title: null, links: [dashboard] }];
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function isLinkActive(to, pathname) {
  return to === ADMIN_BASE ? pathname === ADMIN_BASE : pathname.startsWith(to);
}

/** Lien de nav — s'adapte à l'état collapsed (icône seule + tooltip) */
function SidebarLink({ to, label, icon, active, collapsed, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className="group relative flex items-center gap-3 rounded-xl text-sm font-medium no-underline transition-colors duration-150"
      style={{
        padding: collapsed ? "10px" : "9px 12px",
        justifyContent: collapsed ? "center" : "flex-start",
        color: active ? "#fff" : "rgba(255,255,255,0.62)",
        background: active ? "rgba(255,255,255,0.14)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#fff"; }
      }}
      onMouseLeave={(e) => {
        if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.62)"; }
      }}
    >
      {active && !collapsed && (
        <span className="absolute left-0 rounded-r-full" style={{ width: 3, height: 18, background: "#00c4b4" }} />
      )}
      <i className={`ti ${icon} flex-shrink-0`} aria-hidden="true" style={{ fontSize: 18 }} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { role, label: roleLabel, can } = useRole();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("awj_sidebar_collapsed") === "1");
  const [mobileOpen, setMobileOpen] = useState(false);

  const rawSections = getNavSections(role);
  // Liens pilotables depuis le backoffice (Rôles & permissions) — masqués
  // tant que la permission correspondante n'est pas accordée au rôle,
  // affichés dès qu'un admin la coche, sans redéploiement.
  const LINK_PERMISSION = {
    [`${ADMIN_BASE}/groups`]:    "viewGroups",
    [`${ADMIN_BASE}/cotations`]: "viewCotations",
  };
  const sections = rawSections
    .map((section) => ({
      ...section,
      links: section.links.filter((l) => {
        const perm = LINK_PERMISSION[l.to];
        return !perm || can(perm);
      }),
    }))
    .filter((section) => section.links.length > 0);
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  useEffect(() => {
    localStorage.setItem("awj_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Fermer le drawer mobile au changement de route
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function handleLogout() {
    logout();
    navigate(`${ADMIN_BASE}/login`);
  }

  const railContent = (isMobile) => (
    <div className="h-full flex flex-col" style={{ background: "#0e2a49" }}>
      {/* Logo + toggle */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ height: 60, padding: collapsed && !isMobile ? "0 16px" : "0 16px" }}>
        <Link to={ADMIN_BASE} className="flex items-center gap-2.5 no-underline flex-1 min-w-0">
          <div
            className="flex items-center justify-center rounded-lg text-white font-bold text-sm flex-shrink-0"
            style={{ width: 32, height: 32, background: "#00c4b4", letterSpacing: "-0.5px" }}
          >
            Aw
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-white font-bold text-sm truncate">Awoundjô</span>
          )}
        </Link>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="flex-shrink-0 flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: "rgba(255,255,255,0.08)" }} aria-label="Fermer le menu">
            <i className="ti ti-x text-white" aria-hidden="true" style={{ fontSize: 16 }} />
          </button>
        )}
      </div>

      {/* Nav groupée, scrollable */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: "thin" }}>
        {sections.map((section, i) => (
          <div key={i} className="mb-1">
            {section.title && (!collapsed || isMobile) && (
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.32)" }}>
                {section.title}
              </p>
            )}
            {section.title && collapsed && !isMobile && i > 0 && (
              <div className="mx-2 my-3" style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
            )}
            <div className="flex flex-col gap-0.5">
              {section.links.map((l) => (
                <SidebarLink
                  key={l.to}
                  {...l}
                  active={isLinkActive(l.to, pathname)}
                  collapsed={collapsed && !isMobile}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer : collapse toggle (desktop) + utilisateur + déconnexion */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        {!isMobile && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-3 text-xs font-medium transition-colors"
            style={{ color: "rgba(255,255,255,0.5)", justifyContent: collapsed ? "center" : "flex-start" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
          >
            <i className={`ti ${collapsed ? "ti-layout-sidebar-right-expand" : "ti-layout-sidebar-left-expand"}`} aria-hidden="true" style={{ fontSize: 17 }} />
            {!collapsed && <span>Réduire</span>}
          </button>
        )}

        <div className="px-3 pb-3 pt-1 flex items-center gap-2.5" style={{ justifyContent: collapsed && !isMobile ? "center" : "flex-start" }}>
          <div
            className="flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
            style={{ width: 32, height: 32, background: "#00c4b4", fontSize: 12 }}
          >
            {initials(user?.name)}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <span
                className="inline-block text-[10px] font-semibold px-1.5 rounded-full mt-0.5"
                style={{ background: "rgba(0,196,180,0.20)", color: "#00c4b4" }}
              >
                {roleLabel}
              </span>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="flex-shrink-0 flex items-center justify-center rounded-lg transition-colors"
              style={{ width: 30, height: 30, color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
              aria-label="Déconnexion"
            >
              <i className="ti ti-logout" aria-hidden="true" style={{ fontSize: 16 }} />
            </button>
          )}
        </div>
        {collapsed && !isMobile && (
          <div className="px-3 pb-3 flex justify-center">
            <button onClick={handleLogout} title="Déconnexion" className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
              aria-label="Déconnexion">
              <i className="ti ti-logout" aria-hidden="true" style={{ fontSize: 16 }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop : sidebar fixe, largeur animée ── */}
      <aside
        className="hidden md:block fixed inset-y-0 left-0 z-40 transition-[width] duration-200"
        style={{ width }}
      >
        {railContent(false)}
      </aside>

      {/* ── Mobile : barre supérieure fine + drawer plein écran ── */}
      <header className="md:hidden fixed inset-x-0 top-0 z-50 flex items-center gap-3 px-4" style={{ height: 52, background: "#0e2a49" }}>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 32, height: 32, background: "rgba(255,255,255,0.10)" }}
          aria-label="Ouvrir le menu"
        >
          <i className="ti ti-menu-2 text-white" aria-hidden="true" style={{ fontSize: 18 }} />
        </button>
        <div className="flex items-center justify-center rounded-md text-white font-bold text-sm flex-shrink-0" style={{ width: 26, height: 26, background: "#00c4b4" }}>Aw</div>
        <span className="text-white font-bold text-sm">Awoundjô</span>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0" style={{ width: 280, maxWidth: "82vw" }}>
            {railContent(true)}
          </div>
        </div>
      )}

      {/* ── Spacer : pousse le contenu de la page (remplace le pt-[52px] de l'ancienne navbar) ── */}
      <div className="hidden md:block flex-shrink-0 transition-[width] duration-200" style={{ width }} aria-hidden="true" />
      <div className="md:hidden" style={{ height: 52 }} aria-hidden="true" />
    </>
  );
}
