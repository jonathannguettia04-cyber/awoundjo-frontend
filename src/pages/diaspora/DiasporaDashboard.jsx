// src/pages/diaspora/DiasporaDashboard.jsx
// ─────────────────────────────────────────────────────────────
//  Dashboard principal + DiasporaLayout (sidebar + nav mobile)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  diasporaDashAPI,
  diasporaRefAPI,
  getDiasporaData,
} from "../../diasporaApi";

// ── Palette ──────────────────────────────────────────────────
const C = {
  blue:   "#1B4FD8",
  blueL:  "#EEF2FF",
  green:  "#059669",
  greenL: "#ECFDF5",
  gold:   "#D97706",
  goldL:  "#FFFBEB",
  red:    "#DC2626",
  redL:   "#FEF2F2",
  purple: "#7C3AED",
  purpleL:"#F5F3FF",
  slate:  "#64748B",
  dark:   "#0F172A",
  border: "#E2E8F0",
  bg:     "#F8FAFC",
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });

const roleLabel = {
  DIRIGEANTE: { label: "Dirigeante", color: C.purple, bg: C.purpleL },
  DIASPORA:   { label: "Ambassadrice Diaspora", color: C.blue,   bg: C.blueL  },
  PAYS:       { label: "Ambassadeur Pays",       color: C.green,  bg: C.greenL },
  VILLE:      { label: "Ambassadeur Ville",       color: C.gold,   bg: C.goldL  },
  RECRUTEUR:  { label: "Recruteur",              color: C.slate,  bg: C.bg     },
};

// ── Navigation items ─────────────────────────────────────────
const NAV = [
  { path: "/diaspora/dashboard",       icon: "🏠", label: "Accueil"        },
  { path: "/diaspora/network",         icon: "🌐", label: "Mon réseau"     },
  { path: "/diaspora/beneficiaries",   icon: "👤", label: "Bénéficiaires"  },
  { path: "/diaspora/payments",        icon: "💳", label: "Paiements"      },
  { path: "/diaspora/earnings",        icon: "💰", label: "Mes gains"      },
  { path: "/diaspora/referral",        icon: "🔗", label: "Parrainage"     },
  { path: "/diaspora/leaderboard",     icon: "🏆", label: "Classement"     },
  { path: "/diaspora/notifications",   icon: "🔔", label: "Notifications"  },
  { path: "/diaspora/profile",         icon: "👤", label: "Mon profil"     },
];

// ── DiasporaLayout ────────────────────────────────────────────
export function DiasporaLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread]         = useState(0);
  const amb = getDiasporaData();

  useEffect(() => {
    // Compter les notifications non lues au chargement
    import("../../diasporaApi").then(({ diasporaNotifAPI }) => {
      diasporaNotifAPI.getAll().then(r => {
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

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #1B4FD8, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🌍</div>
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: C.dark }}>Awoundjô</p>
            <p style={{ margin: 0, fontSize: 10, color: C.slate, fontWeight: 600 }}>DIASPORA</p>
          </div>
        </div>

        {/* Info ambassadeur */}
        {amb && (
          <div style={{ marginTop: 14, padding: "10px 12px", background: C.blueL, borderRadius: 10 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: C.dark }}>{amb.name}</p>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 999, marginTop: 4,
              display: "inline-block",
              background: roleLabel[amb.role]?.bg || C.bg,
              color: roleLabel[amb.role]?.color || C.slate,
            }}>
              {roleLabel[amb.role]?.label || amb.role}
            </span>
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
                background: active ? C.blue : "transparent",
                color: active ? "#fff" : C.slate,
                fontWeight: active ? 700 : 500, fontSize: 13,
                cursor: "pointer", marginBottom: 2, textAlign: "left",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.path === "/diaspora/notifications" && unread > 0 && (
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
        <button
          onClick={logout}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: 8,
            border: `1.5px solid ${C.border}`, background: "#fff",
            color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
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
        // Affiché via media query inline — on utilise une classe css
      }}
        className="diaspora-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 40,
          }}
        />
      )}

      {/* Drawer mobile */}
      <aside style={{
        position: "fixed", top: 0, left: mobileOpen ? 0 : -280,
        width: 260, height: "100vh", background: "#fff",
        borderRight: `1px solid ${C.border}`,
        zIndex: 50, transition: "left 0.25s ease",
        overflowY: "auto",
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
          <button
            onClick={() => setMobileOpen(true)}
            style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: C.dark }}
          >
            ☰
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #1B4FD8, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🌍</div>
            <span style={{ fontWeight: 900, fontSize: 14, color: C.dark }}>Awoundjô Diaspora</span>
          </div>
          <button
            onClick={() => navigate("/diaspora/notifications")}
            style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", position: "relative" }}
          >
            🔔
            {unread > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                background: C.red, color: "#fff", borderRadius: 999,
                fontSize: 9, fontWeight: 800, padding: "1px 4px",
              }}>
                {unread}
              </span>
            )}
          </button>
        </header>

        {/* Contenu des pages */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>

      {/* CSS sidebar desktop */}
      <style>{`
        @media (min-width: 768px) {
          .diaspora-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ── DiasporaDashboard ─────────────────────────────────────────
export default function DiasporaDashboard() {
  const navigate         = useNavigate();
  const [stats, setStats] = useState(null);
  const [link, setLink]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const amb = getDiasporaData();

  useEffect(() => {
    Promise.all([
      diasporaDashAPI.getStats(),
      diasporaRefAPI.getLink(),
    ]).then(([s, l]) => {
      setStats(s.data);
      setLink(l.data);
    }).finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(link?.link || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const role = amb?.role || "RECRUTEUR";
  const rl   = roleLabel[role] || roleLabel.RECRUTEUR;

  // ── Cartes statistiques principales ──
  const statCards = stats ? [
    {
      icon: "👥",
      label: "Bénéficiaires actifs",
      value: stats.beneficiaries?.active || 0,
      sub: `${stats.beneficiaries?.total || 0} au total`,
      color: C.blue,
      bg: C.blueL,
      path: "/diaspora/beneficiaries",
    },
    {
      icon: "🎴",
      label: "Cartes vendues",
      value: stats.payments?.total || 0,
      sub: `${fmt(stats.payments?.amount_eur || 0)} € encaissés`,
      color: C.green,
      bg: C.greenL,
      path: "/diaspora/payments",
    },
    {
      icon: "💰",
      label: "Commissions ce mois",
      value: `${fmt(stats.commissions?.this_month || 0)} €`,
      sub: `Total : ${fmt(stats.commissions?.total_earned || 0)} €`,
      color: C.gold,
      bg: C.goldL,
      path: "/diaspora/earnings",
      isText: true,
    },
    {
      icon: "🌐",
      label: "Mon réseau",
      value: stats.network_size || 0,
      sub: `${stats.referrals || 0} filleul(s) direct(s)`,
      color: C.purple,
      bg: C.purpleL,
      path: "/diaspora/network",
    },
  ] : [];

  // ── Actions rapides ──
  const quickActions = [
    { icon: "➕", label: "Nouveau bénéficiaire", path: "/diaspora/beneficiaries/new", color: C.blue  },
    { icon: "💳", label: "Nouveau paiement",     path: "/diaspora/payments/new",      color: C.green },
    { icon: "🌐", label: "Mon réseau",           path: "/diaspora/network",            color: C.purple },
    { icon: "🏆", label: "Classement",           path: "/diaspora/leaderboard",        color: C.gold  },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <div style={{
          width: 40, height: 40, border: `3px solid ${C.blueL}`,
          borderTop: `3px solid ${C.blue}`, borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", maxWidth: 960, margin: "0 auto" }}>

      {/* ── Bannière ambassadeur ── */}
      <div style={{
        background: "linear-gradient(135deg, #1B4FD8 0%, #3B82F6 100%)",
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
          <span style={{
            background: rl.bg, color: rl.color,
            padding: "3px 12px", borderRadius: 999,
            fontSize: 11, fontWeight: 700,
          }}>
            {rl.label}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600 }}>
            GAINS EN ATTENTE
          </p>
          <p style={{ margin: 0, color: "#fff", fontSize: 28, fontWeight: 900 }}>
            {fmt(stats?.commissions?.pending || 0)} €
          </p>
        </div>
      </div>

      {/* ── Cartes stats cliquables ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 14, marginBottom: 24,
      }}>
        {statCards.map(s => (
          <div
            key={s.label}
            onClick={() => navigate(s.path)}
            style={{
              background: s.bg, borderRadius: 14,
              border: `1px solid ${s.color}22`,
              padding: "16px 18px", cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}33`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>Voir →</span>
            </div>
            <p style={{ margin: "10px 0 2px", fontSize: s.isText ? 20 : 28, fontWeight: 900, color: s.color }}>
              {s.isText ? s.value : fmt(s.value)}
            </p>
            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748B" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Bloc partage lien ambassadeur ── */}
      {link && (
        <div style={{
          background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`,
          padding: "18px 20px", marginBottom: 24,
        }}>
          <p style={{ margin: "0 0 12px", fontWeight: 800, color: C.dark, fontSize: 15 }}>
            🔗 Mon lien ambassadeur
          </p>

          {/* Lien affiché */}
          <div style={{
            background: C.bg, border: `1.5px solid ${C.border}`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
          }}>
            <span style={{
              fontSize: 12, color: C.blue, fontWeight: 600,
              wordBreak: "break-all", flex: 1,
            }}>
              {link.link}
            </span>
            <span style={{
              background: C.blueL, color: C.blue,
              padding: "3px 12px", borderRadius: 999,
              fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
            }}>
              Code : {link.code}
            </span>
          </div>

          {/* Boutons partage */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={copyLink} style={{
              padding: "8px 18px", borderRadius: 8,
              border: `1.5px solid ${C.blue}`, background: C.blueL,
              color: C.blue, fontWeight: 700, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {copied ? "✅ Copié !" : "📋 Copier le lien"}
            </button>
            {link.whatsapp_message && (
              <a
                href={link.whatsapp_message}
                target="_blank" rel="noreferrer"
                style={{
                  padding: "8px 18px", borderRadius: 8, border: "none",
                  background: "#25D366", color: "#fff", fontWeight: 700,
                  fontSize: 13, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                📲 Partager sur WhatsApp
              </a>
            )}
            <button onClick={() => navigate("/diaspora/referral")} style={{
              padding: "8px 18px", borderRadius: 8,
              border: `1.5px solid ${C.border}`, background: "#fff",
              color: C.slate, fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              👥 Voir mes filleuls
            </button>
          </div>
        </div>
      )}

      {/* ── Actions rapides ── */}
      <div style={{
        background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`,
        padding: "18px 20px", marginBottom: 24,
      }}>
        <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark, fontSize: 15 }}>
          ⚡ Actions rapides
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {quickActions.map(a => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              style={{
                padding: "12px 10px", borderRadius: 10,
                border: `2px solid ${a.color}22`,
                background: `${a.color}11`, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${a.color}22`}
              onMouseLeave={e => e.currentTarget.style.background = `${a.color}11`}
            >
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: a.color, textAlign: "center" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Résumé réseau ── */}
      {stats && (
        <div
          onClick={() => navigate("/diaspora/network")}
          style={{
            background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "18px 20px", cursor: "pointer",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ margin: 0, fontWeight: 800, color: C.dark, fontSize: 15 }}>🌐 Mon réseau</p>
            <span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>Voir le détail →</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Total",    value: stats.network_size, color: C.blue   },
              { label: "Filleuls", value: stats.referrals,    color: C.green  },
              { label: "Actifs",   value: stats.beneficiaries?.active, color: C.gold   },
              { label: "En attente",value:stats.beneficiaries?.pending,color: C.slate  },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "10px 6px", background: C.bg, borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: s.color }}>{fmt(s.value)}</p>
                <p style={{ margin: "3px 0 0", fontSize: 10, color: C.slate, fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
