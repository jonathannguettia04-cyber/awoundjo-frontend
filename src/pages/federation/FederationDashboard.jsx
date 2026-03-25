// src/pages/federation/FederationDashboard.jsx
// ─────────────────────────────────────────────────────────────
//  Dashboard + Layout pour le réseau Fédération Awoundjô
//  Hiérarchie : LEADER → EGLISE → SUPERV → RECRUTEUR
//  Commissions : 12% direct | 10% supérieur | 5% direction (sur 50% prime)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  federationDashAPI,
  federationRecruitAPI,
  federationCommAPI,
} from "../../federationApi";
import { getDiasporaData } from "../../diasporaApi";

// ── Palette ──────────────────────────────────────────────────
const C = {
  purple:  "#7C3AED",
  purpleL: "#F5F3FF",
  purpleM: "#DDD6FE",
  green:   "#059669",
  greenL:  "#ECFDF5",
  gold:    "#D97706",
  goldL:   "#FFFBEB",
  blue:    "#1B4FD8",
  blueL:   "#EEF2FF",
  red:     "#DC2626",
  redL:    "#FEF2F2",
  slate:   "#64748B",
  dark:    "#0F172A",
  border:  "#E2E8F0",
  bg:      "#F8FAFC",
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });

// ── Rôles Fédération ─────────────────────────────────────────
const ROLE_CONFIG = {
  AMBASSADEUR_LEADER:    { label: "Ambassadeur Leader",      icon: "👑", color: C.purple, bg: C.purpleL, level: 1 },
  AMBASSADEUR_EGLISE:    { label: "Ambassadeur Église",      icon: "⛪", color: C.blue,   bg: C.blueL,   level: 2 },
  AMBASSADEUR_SUPERV:    { label: "Ambassadeur Superviseur", icon: "📋", color: C.green,  bg: C.greenL,  level: 3 },
  AMBASSADEUR_RECRUTEUR: { label: "Recruteur Fédération",    icon: "🤝", color: C.gold,   bg: C.goldL,   level: 4 },
};

// ── Navigation ───────────────────────────────────────────────
const NAV = [
  { path: "/federation/dashboard",     icon: "🏠", label: "Accueil"        },
  { path: "/federation/network",       icon: "🌐", label: "Mon réseau"     },
  { path: "/federation/members",       icon: "👤", label: "Mes membres"    },
  { path: "/federation/payments",      icon: "💳", label: "Paiements"      },
  { path: "/federation/earnings",      icon: "💰", label: "Mes gains"      },
  { path: "/federation/referral",      icon: "🔗", label: "Recrutement"    },
  { path: "/federation/leaderboard",   icon: "🏆", label: "Classement"     },
  { path: "/federation/notifications", icon: "🔔", label: "Notifications"  },
  { path: "/federation/profile",       icon: "👤", label: "Mon profil"     },
];

// ── FederationLayout ──────────────────────────────────────────
export function FederationLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread]         = useState(0);
  const amb = getDiasporaData();

  useEffect(() => {
    import("../../federationApi").then(({ federationNotifAPI }) => {
      federationNotifAPI.getAll().then(r => {
        setUnread(r.data?.unread_count || 0);
      }).catch(() => {});
    });
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("diaspora_token");
    localStorage.removeItem("diaspora_data");
    navigate("/diaspora/login");
  };

  const isActive = (path) => location.pathname === path;
  const rc = ROLE_CONFIG[amb?.role] || ROLE_CONFIG.AMBASSADEUR_RECRUTEUR;

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>⛪</div>
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: C.dark }}>Awoundjô</p>
            <p style={{ margin: 0, fontSize: 10, color: C.slate, fontWeight: 600 }}>FÉDÉRATION</p>
          </div>
        </div>

        {/* Info ambassadeur */}
        {amb && (
          <div style={{ marginTop: 14, padding: "10px 12px", background: C.purpleL, borderRadius: 10 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: C.dark }}>{amb.name}</p>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 999, marginTop: 4,
              display: "inline-block",
              background: rc.bg, color: rc.color,
            }}>
              {rc.icon} {rc.label}
            </span>
            {/* Barre de niveau */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                {[1,2,3,4].map(l => (
                  <div key={l} style={{
                    width: "23%", height: 4, borderRadius: 2,
                    background: l <= rc.level ? C.purple : C.border,
                    transition: "background .3s",
                  }} />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 9, color: C.slate }}>Niveau {rc.level}/4 dans la hiérarchie</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
        {NAV.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, border: "none",
                background: active ? C.purple : "transparent",
                color:  active ? "#fff" : C.slate,
                fontWeight: active ? 700 : 500, fontSize: 13,
                cursor: "pointer", marginBottom: 2, textAlign: "left",
                transition: "all 0.15s", position: "relative",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.path === "/federation/notifications" && unread > 0 && (
                <span style={{
                  background: C.red, color: "#fff",
                  fontSize: 10, fontWeight: 800, padding: "1px 6px",
                  borderRadius: 999, minWidth: 18, textAlign: "center",
                }}>
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding: "12px 12px", borderTop: `1px solid ${C.border}` }}>
        <button onClick={logout} style={{
          width: "100%", padding: "9px 12px", borderRadius: 8,
          border: `1.5px solid ${C.border}`, background: "#fff",
          color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>

      {/* Sidebar desktop */}
      <aside style={{
        width: 240, flexShrink: 0, background: "#fff",
        borderRight: `1px solid ${C.border}`,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
        display: "none",
      }} className="federation-sidebar">
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      {/* Drawer mobile */}
      <aside style={{
        position: "fixed", top: 0, left: mobileOpen ? 0 : -280,
        width: 260, height: "100vh", background: "#fff",
        borderRight: `1px solid ${C.border}`,
        zIndex: 50, transition: "left 0.25s ease", overflowY: "auto",
      }}>
        <SidebarContent />
      </aside>

      {/* Zone principale */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar mobile */}
        <header style={{
          background: "#fff", borderBottom: `1px solid ${C.border}`,
          padding: "12px 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30,
        }}>
          <button onClick={() => setMobileOpen(true)}
            style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: C.dark }}>
            ☰
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>⛪</div>
            <span style={{ fontWeight: 900, fontSize: 14, color: C.dark }}>Awoundjô Fédération</span>
          </div>
          <button onClick={() => navigate("/federation/notifications")}
            style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", position: "relative" }}>
            🔔
            {unread > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                background: C.red, color: "#fff", borderRadius: 999,
                fontSize: 9, fontWeight: 800, padding: "1px 4px",
              }}>{unread}</span>
            )}
          </button>
        </header>

        <main style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .federation-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ── Composant : Arbre hiérarchique ────────────────────────────
function HierarchyTree({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign: "center", padding: "24px", color: C.slate, fontSize: 13 }}>
      Aucun membre dans votre réseau pour le moment.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((member, i) => {
        const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.AMBASSADEUR_RECRUTEUR;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 10,
            background: rc.bg, border: `1px solid ${rc.color}22`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: rc.color, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
            }}>
              {rc.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.dark }}>{member.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{rc.label}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: rc.color }}>
                {fmt(member.total_members || 0)} membres
              </p>
              <p style={{ margin: 0, fontSize: 10, color: C.slate }}>
                {member.is_active ? "✅ Actif" : "⏸ Inactif"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Composant : Simulateur de commission ─────────────────────
function CommissionSimulator() {
  const [prime, setPrime] = useState("");
  const calc = prime ? federationCommAPI.simulate(Number(prime)) : null;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
      <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark, fontSize: 15 }}>
        🧮 Simulateur de commission
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: C.slate }}>
        Calcul sur 50% de la prime encaissée
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input
          type="number" min="0" placeholder="Montant de la prime (€)"
          value={prime} onChange={e => setPrime(e.target.value)}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none",
            fontFamily: "inherit", color: C.dark,
          }}
        />
        <span style={{ fontSize: 13, color: C.slate, whiteSpace: "nowrap" }}>€ prime</span>
      </div>

      {calc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Base de calcul */}
          <div style={{ background: C.bg, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: C.slate, fontWeight: 600 }}>Base de calcul (50%)</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>{calc.base.toFixed(2)} €</span>
          </div>
          {/* Lignes commissions */}
          {[
            { label: "🤝 Recruteur direct",        rate: "12%", amount: calc.recruteur, color: C.gold   },
            { label: "📋 Supérieur hiérarchique",   rate: "10%", amount: calc.superieur, color: C.green  },
            { label: "🏛️ Direction",                rate: "5%",  amount: calc.direction, color: C.purple },
          ].map(row => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", borderRadius: 8,
              background: `${row.color}11`, border: `1px solid ${row.color}22`,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: row.color }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: 10, color: C.slate }}>{row.rate} × {calc.base.toFixed(2)} €</p>
              </div>
              <span style={{ fontSize: 16, fontWeight: 900, color: row.color }}>
                {row.amount.toFixed(2)} €
              </span>
            </div>
          ))}
          {/* Total */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", borderRadius: 10,
            background: "linear-gradient(135deg, #7C3AED11, #7C3AED22)",
            border: `1.5px solid ${C.purple}44`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.purple }}>Total distribué</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: C.purple }}>{calc.total.toFixed(2)} €</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FederationDashboard (page principale) ────────────────────
export default function FederationDashboard() {
  const navigate          = useNavigate();
  const [stats, setStats]  = useState(null);
  const [link, setLink]    = useState(null);
  const [team, setTeam]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const amb = getDiasporaData();

  useEffect(() => {
    Promise.all([
      federationDashAPI.getStats(),
      federationRecruitAPI.getLink(),
      import("../../federationApi").then(m => m.federationNetAPI.getTeam()),
    ]).then(([s, l, t]) => {
      setStats(s.data);
      setLink(l.data);
      setTeam(t.data?.team || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(link?.link || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const role = amb?.role || "AMBASSADEUR_RECRUTEUR";
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.AMBASSADEUR_RECRUTEUR;

  const statCards = stats ? [
    {
      icon: "👥", label: "Membres recrutés",
      value: stats.total_members || 0,
      sub: `${stats.active_members || 0} actifs`,
      color: C.purple, bg: C.purpleL,
      path: "/federation/members",
    },
    {
      icon: "💰", label: "Commissions ce mois",
      value: `${fmt(stats.commissions?.this_month || 0)} €`,
      sub: `Total : ${fmt(stats.commissions?.total_earned || 0)} €`,
      color: C.gold, bg: C.goldL,
      path: "/federation/earnings", isText: true,
    },
    {
      icon: "⏳", label: "En attente",
      value: `${fmt(stats.commissions?.pending || 0)} €`,
      sub: "À percevoir prochainement",
      color: C.green, bg: C.greenL,
      path: "/federation/earnings", isText: true,
    },
    {
      icon: "🌐", label: "Taille du réseau",
      value: stats.network_size || 0,
      sub: `${stats.direct_recruits || 0} recrutement(s) direct(s)`,
      color: C.blue, bg: C.blueL,
      path: "/federation/network",
    },
  ] : [];

  const quickActions = [
    { icon: "➕", label: "Nouveau membre",   path: "/federation/members/new",  color: C.purple },
    { icon: "💳", label: "Nouveau paiement", path: "/federation/payments/new", color: C.green  },
    { icon: "🌐", label: "Mon réseau",       path: "/federation/network",      color: C.blue   },
    { icon: "🏆", label: "Classement",       path: "/federation/leaderboard",  color: C.gold   },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <div style={{
          width: 40, height: 40, border: `3px solid ${C.purpleL}`,
          borderTop: `3px solid ${C.purple}`, borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", maxWidth: 960, margin: "0 auto" }}>

      {/* ── Bannière ── */}
      <div style={{
        background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600 }}>
            BONJOUR 👋
          </p>
          <h1 style={{ margin: "0 0 8px", color: "#fff", fontSize: 22, fontWeight: 900 }}>
            {amb?.name || "Ambassadeur"}
          </h1>
          <span style={{ background: rc.bg, color: rc.color, padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
            {rc.icon} {rc.label}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600 }}>GAINS EN ATTENTE</p>
          <p style={{ margin: 0, color: "#fff", fontSize: 28, fontWeight: 900 }}>
            {fmt(stats?.commissions?.pending || 0)} €
          </p>
        </div>
      </div>

      {/* ── Cartes stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} onClick={() => navigate(s.path)}
            style={{ background: s.bg, borderRadius: 14, border: `1px solid ${s.color}22`, padding: "16px 18px", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}33`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>Voir →</span>
            </div>
            <p style={{ margin: "10px 0 2px", fontSize: s.isText ? 20 : 28, fontWeight: 900, color: s.color }}>
              {s.isText ? s.value : fmt(s.value)}
            </p>
            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: C.dark }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Lien de recrutement ── */}
      {link && (
        <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px", marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 800, color: C.dark, fontSize: 15 }}>🔗 Mon lien de recrutement</p>
          <div style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.purple, fontWeight: 600, wordBreak: "break-all", flex: 1 }}>{link.link}</span>
            <span style={{ background: C.purpleL, color: C.purple, padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
              Code : {link.code}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={copyLink} style={{ padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${C.purple}`, background: C.purpleL, color: C.purple, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {copied ? "✅ Copié !" : "📋 Copier le lien"}
            </button>
            {link.whatsapp_message && (
              <a href={link.whatsapp_message} target="_blank" rel="noreferrer"
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                📲 Partager sur WhatsApp
              </a>
            )}
            <button onClick={() => navigate("/federation/referral")} style={{ padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#fff", color: C.slate, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              👥 Voir mes recrutés
            </button>
          </div>
        </div>
      )}

      {/* ── Grille : Actions rapides + Simulateur ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Actions rapides */}
        <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
          <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark, fontSize: 15 }}>⚡ Actions rapides</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {quickActions.map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                style={{ padding: "12px 10px", borderRadius: 10, border: `2px solid ${a.color}22`, background: `${a.color}11`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${a.color}22`}
                onMouseLeave={e => e.currentTarget.style.background = `${a.color}11`}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: a.color, textAlign: "center" }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Simulateur */}
        <CommissionSimulator />
      </div>

      {/* ── Hiérarchie réseau ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 800, color: C.dark, fontSize: 15 }}>🏛️ Ma hiérarchie directe</p>
          <button onClick={() => navigate("/federation/network")}
            style={{ fontSize: 12, color: C.purple, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
            Voir tout →
          </button>
        </div>

        {/* Organigramme visuel */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 16, overflowX: "auto" }}>
          {Object.entries(ROLE_CONFIG).map(([key, cfg], i, arr) => (
            <div key={key} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "10px 14px", borderRadius: 12,
                background: role === key ? cfg.bg : C.bg,
                border: `2px solid ${role === key ? cfg.color : C.border}`,
                minWidth: 90,
              }}>
                <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: role === key ? cfg.color : C.slate, textAlign: "center" }}>
                  {cfg.label.replace("Ambassadeur ", "")}
                </span>
                {role === key && (
                  <span style={{ fontSize: 9, background: cfg.color, color: "#fff", padding: "1px 6px", borderRadius: 999 }}>
                    Vous
                  </span>
                )}
              </div>
              {i < arr.length - 1 && (
                <div style={{ width: 20, height: 2, background: C.border, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        <HierarchyTree data={team} />
      </div>
    </div>
  );
}
