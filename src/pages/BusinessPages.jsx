// pages/BusinessPages.jsx
// ══════════════════════════════════════════════════════════════
//  Awoundjô Business — Pages Frontend
//
//  CORRECTIONS APPLIQUÉES :
//  1. apiBiz() lit exclusivement "business_token"
//  2. BizAuthProvider supprime aussi "business_data" au logout
//  3. StatusBadge déclarée AVANT les composants qui l'utilisent
//  4. BizDashboardPage : champs alignés sur businessController.js
//       comm.total_earned / pending / paid / this_month / today / this_week
//       net.network_size / net.direct_members{role:{total,active}}
//       bonus_pool.montant / bonus_pool.mois / bonus_pool.annee
//  5. BizNetworkPage : lit data.network.level1..4 + data.totals
//  6. BizCommissionsPage : data.commissions[]{montant/rate_pct/niveau/
//       status/created_at/amount_xof/source_name/source_role}
//  7. BizBonusPage : data.history[]{mois/annee/montant_total} + current_pool
//       (pas de champ "distribue" dans le schéma)
//  8. BizInvitationPage : data.code/link/child_role/whatsapp_message
//  9. BizMembersPage : POST /members (route backend correcte)
//       + colonne status_validation
// 10. BizLayout sans BizAuthProvider (App.jsx le gère déjà)
//
//  FIX CRITIQUE :
//  - Import/export useBizAuth corrigé : import d'abord, re-export ensuite
//    (l'ancien "export ... from" + "import" sur le même module cassait le scope)
//  - BizMembersPage : suppression de la référence invalide à `m` hors scope
//    dans le bloc creds (utilisait la variable de la boucle .map, pas le résultat API)
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
//  API HELPER
// ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://awoundjo-backend.up.railway.app";

async function apiBiz(path, options = {}) {
  const token = localStorage.getItem("business_token");
  const res = await fetch(`${API_BASE}/api/business${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// ─────────────────────────────────────────────────────────────
//  AUTH CONTEXT — importé depuis le fichier isolé
//  FIX : import d'abord (met useBizAuth dans le scope local),
//        puis re-export séparé. L'ancienne syntaxe
//        "export { ... } from ..." + "import { ... } from ..."
//        sur le même module empêchait useBizAuth d'être résolu
//        dans les composants du même fichier.
// ─────────────────────────────────────────────────────────────
import { BizAuthProvider, BizAuthContext, useBizAuth } from "./business/BizAuthContext";
export { BizAuthProvider, BizAuthContext, useBizAuth };

// ─────────────────────────────────────────────────────────────
//  UI ATOMS
// ─────────────────────────────────────────────────────────────
const ROLE_COLOR = {
  DIRECTRICE:  "#7C3AED",
  LEADER:      "#2563EB",
  SUPERVISEUR: "#059669",
  RECRUTEUR:   "#D97706",
};
const ROLE_ICON = {
  DIRECTRICE:  "👑",
  LEADER:      "🏆",
  SUPERVISEUR: "⭐",
  RECRUTEUR:   "🤝",
};

function fmt(n) { return Number(n || 0).toLocaleString("fr-FR"); }

// StatusBadge déclarée en premier pour éviter tout usage avant définition
function StatusBadge({ status }) {
  const map = {
    PENDING:   { bg: "#FEF3C7", color: "#92400E", label: "En attente" },
    VALIDATED: { bg: "#DBEAFE", color: "#1E40AF", label: "Validé"     },
    PAID:      { bg: "#D1FAE5", color: "#065F46", label: "Payé"       },
    REJECTED:  { bg: "#FFF1F2", color: "#BE123C", label: "Rejeté"     },
    ACTIVE:    { bg: "#D1FAE5", color: "#065F46", label: "Actif"      },
    SUSPENDED: { bg: "#FFF1F2", color: "#BE123C", label: "Suspendu"   },
  };
  const s = map[status] || { bg: "#F1F5F9", color: "#64748B", label: status || "-" };
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 20,
      padding: "2px 10px", fontSize: 12, fontWeight: 600,
    }}>{s.label}</span>
  );
}

function Badge({ role }) {
  const color = ROLE_COLOR[role] || "#64748B";
  const icon  = ROLE_ICON[role]  || "👤";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: color + "20", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
    }}>
      {icon} {role}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,.08)", ...style,
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color = "#7C3AED", icon }) {
  return (
    <Card style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>{label}</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>{value}</p>
          {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>{sub}</p>}
        </div>
        {icon && <span style={{ fontSize: 28 }}>{icon}</span>}
      </div>
    </Card>
  );
}

function Alert({ type = "info", children, style = {} }) {
  const map = {
    info:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8" },
    success: { bg: "#F0FDF4", border: "#BBF7D0", color: "#166534" },
    error:   { bg: "#FFF1F2", border: "#FECDD3", color: "#BE123C" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" },
  };
  const s = map[type] || map.info;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 8, padding: "10px 14px", fontSize: 14, ...style,
    }}>
      {children}
    </div>
  );
}

function Loader() {
  return <div style={{ textAlign: "center", padding: 60, color: "#7C3AED", fontSize: 16 }}>Chargement…</div>;
}

// ─────────────────────────────────────────────────────────────
//  LAYOUT SIDEBAR
// ─────────────────────────────────────────────────────────────
const NAV = [
  { to: "/business/dashboard",    icon: "📊", label: "Tableau de bord" },
  { to: "/business/network",      icon: "🌐", label: "Mon réseau"      },
  { to: "/business/commissions",  icon: "💰", label: "Commissions"     },
  { to: "/business/bonus",        icon: "🎁", label: "Bonus mensuel"   },
  { to: "/business/invitation",   icon: "🔗", label: "Invitation"      },
  { to: "/business/leaderboard",  icon: "🏆", label: "Classement"      },
  { to: "/business/members",      icon: "👥", label: "Mes membres"     },
  { to: "/business/collectes",    icon: "💳", label: "Collectes"       },
  { to: "/business/clients",      icon: "🏥", label: "Mes clients"     },
  { to: "/business/parrainage",   icon: "🎯", label: "Parrainage"      },
];

export function BizLayout({ children }) {
  const { member, logoutCtx } = useBizAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const handleLogout = () => { logoutCtx(); nav("/business/login"); };

  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      <style>{`
        @media (max-width: 768px) {
          .biz-sidebar { transform: translateX(-100%); transition: transform .25s ease; }
          .biz-sidebar.open { transform: translateX(0); }
          .biz-main { margin-left: 0 !important; padding: 16px !important; }
          .biz-hamburger { display: flex !important; }
          .biz-topbar { padding: 12px 16px !important; display: flex !important; }
          .biz-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .biz-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .biz-stats-grid-3 { grid-template-columns: 1fr !important; }
          .biz-card-actions { flex-direction: column !important; gap: 8px !important; }
        }
        @media (max-width: 480px) {
          .biz-stats-grid { grid-template-columns: 1fr !important; }
          .biz-tab-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; }
        }
        .biz-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 99; }
        .biz-hamburger { display: none; align-items: center; justify-content: center;
          width: 36px; height: 36px; background: #1E1B4B; border: none; border-radius: 8px;
          color: #fff; cursor: pointer; font-size: 18px; flex-shrink: 0; }
        .biz-sidebar { transition: transform .25s ease; }
        @media (min-width: 769px) {
          .biz-topbar { display: none !important; }
        }
      `}</style>

      {sidebarOpen && <div className="biz-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`biz-sidebar${sidebarOpen ? " open" : ""}`} style={{
        width: 240, background: "#1E1B4B", color: "#fff",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh",
        overflowY: "auto", zIndex: 100,
      }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #ffffff15" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA" }}>💼 Awoundjô</div>
          <div style={{ fontSize: 11, color: "#A5B4FC", marginTop: 2 }}>Business Network</div>
        </div>

        {member && (
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #ffffff15" }}>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14 }}>{member.name}</p>
            <Badge role={member.role} />
          </div>
        )}

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(item => {
            const active = loc.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 20px", fontSize: 14, fontWeight: active ? 700 : 400,
                color: active ? "#A78BFA" : "#C4C9E2",
                background: active ? "#ffffff10" : "transparent",
                textDecoration: "none",
                borderLeft: active ? "3px solid #A78BFA" : "3px solid transparent",
                transition: "all .15s",
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #ffffff15" }}>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "8px 0", borderRadius: 8,
            background: "#EF444420", border: "1px solid #EF444440",
            color: "#FCA5A5", cursor: "pointer", fontWeight: 600, fontSize: 13,
          }}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      <main className="biz-main" style={{ marginLeft: 240, flex: 1, padding: "28px 32px", minWidth: 0 }}>
        {/* Topbar mobile */}
        <div className="biz-topbar" style={{
          display: "flex", alignItems: "center", gap: 12,
          marginBottom: 20, paddingBottom: 16,
          borderBottom: "1px solid #E2E8F0",
        }}>
          <button className="biz-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1E1B4B" }}>💼 Awoundjô Business</span>
        </div>
        {children}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — DASHBOARD
// ─────────────────────────────────────────────────────────────
export function BizDashboardPage() {
  const { member } = useBizAuth();
  const [stats, setStats] = useState(null);
  const [busy,  setBusy]  = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiBiz("/dashboard")
      .then(d => setStats(d))
      .catch(e => setError(e?.error || "Erreur de chargement"))
      .finally(() => setBusy(false));
  }, []);

  if (busy) return <BizLayout><Loader /></BizLayout>;
  if (error) return <BizLayout><Alert type="error">{error}</Alert></BizLayout>;

  const comm   = stats?.commissions || {};
  const net    = stats?.network     || {};
  const pool   = stats?.bonus_pool  || {};
  const unread = stats?.notifications_unread || 0;

  const totalDirect = Object.values(net.direct_members || {})
    .reduce((acc, r) => acc + Number(r.total || 0), 0);

  return (
    <BizLayout>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
          Tableau de bord Business
        </h2>
        <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
          Bonjour {member?.name} 👋 — <Badge role={member?.role} />
          {unread > 0 && (
            <span style={{
              marginLeft: 10, background: "#EF4444", color: "#fff",
              borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 700,
            }}>{unread} notif.</span>
          )}
        </p>
      </div>

      <div style={grid4}>
        <StatCard label="Total gagné"   value={`${fmt(comm.total_earned)} FCFA`} color="#7C3AED" icon="💰" />
        <StatCard label="Ce mois"       value={`${fmt(comm.this_month)} FCFA`}   color="#2563EB" icon="📅" />
        <StatCard label="En attente"    value={`${fmt(comm.pending)} FCFA`}      color="#D97706" icon="⏳" />
        <StatCard label="Payé"          value={`${fmt(comm.paid)} FCFA`}         color="#059669" icon="✅" />
      </div>

      <div style={{ ...grid4, marginTop: 16 }}>
        <StatCard label="Réseau total"      value={net.network_size || 0}         color="#7C3AED" icon="🌐" />
        <StatCard label="Membres directs"   value={totalDirect}                   color="#2563EB" icon="👥" />
        <StatCard label="Bonus pool (mois)" value={`${fmt(pool.montant)} FCFA`}   color="#D97706" icon="🎁"
          sub={pool.mois ? `${pool.mois}/${pool.annee}` : undefined} />
        <StatCard label="Aujourd'hui"       value={`${fmt(comm.today)} FCFA`}     color="#059669" icon="🌅"
          sub={`Semaine : ${fmt(comm.this_week)} FCFA`} />
      </div>

      {net.direct_members && Object.keys(net.direct_members).length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1E1B4B" }}>
            🌐 Composition du réseau direct
          </h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(net.direct_members).map(([role, data]) => (
              <div key={role} style={{
                background: (ROLE_COLOR[role] || "#64748B") + "15",
                border: `1px solid ${(ROLE_COLOR[role] || "#64748B")}30`,
                borderRadius: 10, padding: "12px 20px", textAlign: "center", minWidth: 100,
              }}>
                <div style={{ fontSize: 22 }}>{ROLE_ICON[role] || "👤"}</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: ROLE_COLOR[role] || "#64748B" }}>{data.total}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{role}</div>
                <div style={{ fontSize: 11, color: "#059669" }}>{data.active} actifs</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#1E1B4B" }}>⚡ Actions rapides</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/business/invitation"  style={quickBtn("#7C3AED")}>🔗 Mon lien d'invitation</Link>
          <Link to="/business/members"     style={quickBtn("#2563EB")}>➕ Créer un membre</Link>
          <Link to="/business/commissions" style={quickBtn("#059669")}>📋 Mes commissions</Link>
          <Link to="/business/leaderboard" style={quickBtn("#D97706")}>🏆 Classement</Link>
        </div>
      </Card>
    </BizLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — RÉSEAU
// ─────────────────────────────────────────────────────────────
export function BizNetworkPage() {
  const [data,  setData]  = useState(null);
  const [level, setLevel] = useState(1);
  const [busy,  setBusy]  = useState(true);

  useEffect(() => {
    apiBiz("/network").then(d => setData(d)).finally(() => setBusy(false));
  }, []);

  if (busy) return <BizLayout><Loader /></BizLayout>;

  const net    = data?.network || {};
  const totals = data?.totals  || {};
  const list   = net[`level${level}`] || [];

  return (
    <BizLayout>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
        🌐 Mon réseau Business
      </h2>

      <div style={grid4}>
        {[1, 2, 3, 4].map(l => (
          <StatCard key={l}
            label={`Niveau ${l}`}
            value={totals[`level${l}`] || 0}
            color={["#7C3AED", "#2563EB", "#059669", "#D97706"][l - 1]}
            icon={["👑", "🤝", "⭐", "🙋"][l - 1]}
          />
        ))}
      </div>

      <Alert type="info" style={{ marginTop: 16 }}>
        Réseau total : <strong>{totals.total || 0} membre(s)</strong>
      </Alert>

      <div style={{ display: "flex", gap: 8, margin: "20px 0 16px" }}>
        {[1, 2, 3, 4].map(l => (
          <button key={l} onClick={() => setLevel(l)} style={{
            padding: "6px 18px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: level === l ? "#7C3AED" : "#fff",
            color:      level === l ? "#fff"    : "#64748B",
            border:     level === l ? "none"    : "1px solid #E2E8F0",
          }}>
            Niveau {l}
          </button>
        ))}
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <div className="biz-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                  {["Nom", "Rôle", "Pays", "Statut", "Date d'adhésion", "Gains"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                    Aucun membre à ce niveau.
                  </td></tr>
                )}
                {list.map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: "10px 12px" }}><Badge role={m.role} /></td>
                    <td style={{ padding: "10px 12px", color: "#64748B" }}>{m.country || "—"}</td>
                    <td style={{ padding: "10px 12px" }}><StatusBadge status={m.status} /></td>
                    <td style={{ padding: "10px 12px", color: "#64748B" }}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#7C3AED" }}>
                      {fmt(m.total_earned)} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </BizLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — COMMISSIONS
// ─────────────────────────────────────────────────────────────
export function BizCommissionsPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    apiBiz("/commissions").then(d => setData(d)).finally(() => setBusy(false));
  }, []);

  if (busy) return <BizLayout><Loader /></BizLayout>;

  const totals = data?.totals      || {};
  const list   = data?.commissions || [];

  return (
    <BizLayout>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
        💰 Mes commissions
      </h2>

      <div style={grid4}>
        <StatCard label="Total gagné"    value={`${fmt(totals.total_earned)} FCFA`}  color="#7C3AED" icon="💰" />
        <StatCard label="Niveau 1 (10%)" value={`${fmt(totals.niveau1_total)} FCFA`} color="#2563EB" icon="🎯"
          sub={`${totals.niveau1_count || 0} transactions`} />
        <StatCard label="Niveau 2 (5%)"  value={`${fmt(totals.niveau2_total)} FCFA`} color="#059669" icon="🔗"
          sub={`${totals.niveau2_count || 0} transactions`} />
        <StatCard label="Ce mois"        value={`${fmt(totals.this_month)} FCFA`}    color="#D97706" icon="📅" />
      </div>

      <Alert type="info" style={{ marginTop: 16 }}>
        <strong>Règle :</strong> Niveau 1 (apporteur direct) = 10% · Niveau 2 (parrain) = 5% · Bonus pool = 2%
      </Alert>

      <Card style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Historique des gains</h3>
        <div style={{ overflowX: "auto" }}>
          <div className="biz-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                  {["Date", "Source", "Niv.", "Taux", "Base paiement", "Commission", "Statut"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                    Aucune commission reçue.
                  </td></tr>
                )}
                {list.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "9px 12px", color: "#64748B" }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ fontWeight: 600 }}>{c.source_name || "—"}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8", display: "block" }}>{c.source_role || ""}</span>
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{
                        background: c.niveau === 1 ? "#EDE9FE" : "#DBEAFE",
                        color:      c.niveau === 1 ? "#7C3AED" : "#2563EB",
                        borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                      }}>N{c.niveau}</span>
                    </td>
                    <td style={{ padding: "9px 12px", color: "#64748B" }}>{c.rate_pct}%</td>
                    <td style={{ padding: "9px 12px", color: "#64748B" }}>{fmt(c.amount_xof)} FCFA</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: "#059669" }}>
                      +{fmt(c.montant)} FCFA
                    </td>
                    <td style={{ padding: "9px 12px" }}><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </BizLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — BONUS POOL
// ─────────────────────────────────────────────────────────────
export function BizBonusPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    apiBiz("/bonus-pool").then(d => setData(d)).finally(() => setBusy(false));
  }, []);

  if (busy) return <BizLayout><Loader /></BizLayout>;

  const history = data?.history      || [];
  const current = data?.current_pool || 0;
  const MONTHS  = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const now     = new Date();

  return (
    <BizLayout>
      <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
        🎁 Bonus pool mensuel
      </h2>
      <Alert type="info" style={{ marginBottom: 20 }}>
        <strong>Comment ça marche :</strong> 2% de chaque paiement validé alimente le pool du mois.
        La distribution s'effectue en fin de mois selon les règles de performance.
      </Alert>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <StatCard
          label={`Pool ${MONTHS[now.getMonth()]} ${now.getFullYear()} (en cours)`}
          value={`${fmt(current)} FCFA`}
          color="#D97706" icon="🎁"
        />
        <StatCard label="Mois d'historique" value={history.length} color="#7C3AED" icon="📅" />
      </div>

      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Historique des pools</h3>
        <div className="biz-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                {["Mois", "Année", "Montant pool", "Statut"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                  Aucun historique disponible.
                </td></tr>
              )}
              {history.map((p, i) => {
                const isCurrent = p.mois === (now.getMonth() + 1) && p.annee === now.getFullYear();
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{MONTHS[(p.mois || 1) - 1]}</td>
                    <td style={{ padding: "10px 12px" }}>{p.annee}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#D97706" }}>
                      {fmt(p.montant_total)} FCFA
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isCurrent
                        ? <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 12 }}>⏳ En cours</span>
                        : <span style={{ background: "#DBEAFE", color: "#1E40AF", borderRadius: 20, padding: "2px 10px", fontSize: 12 }}>✅ Clôturé</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </BizLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — INVITATION
// ─────────────────────────────────────────────────────────────
export function BizInvitationPage() {
  const [data,   setData]   = useState(null);
  const [copied, setCopied] = useState(null);
  const [busy,   setBusy]   = useState(true);

  useEffect(() => {
    apiBiz("/invitation-link").then(d => setData(d)).finally(() => setBusy(false));
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (busy)  return <BizLayout><Loader /></BizLayout>;
  if (!data) return <BizLayout><Alert type="error">Erreur de chargement du lien d'invitation.</Alert></BizLayout>;

  return (
    <BizLayout>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
        🔗 Mon lien d'invitation
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Mon code</h3>
          <div style={{
            background: "#EDE9FE", borderRadius: 10, padding: "16px 20px",
            textAlign: "center", fontFamily: "monospace", fontSize: 24,
            fontWeight: 800, color: "#7C3AED", letterSpacing: 4,
          }}>
            {data.code}
          </div>
          <button onClick={() => copy(data.code, "code")} style={{ ...btnPrimary, marginTop: 12, width: "100%" }}>
            {copied === "code" ? "✅ Copié !" : "📋 Copier le code"}
          </button>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Votre rôle</h3>
          <Badge role={data.role} />
          {data.child_role ? (
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "#64748B" }}>
              Vous invitez des : <strong><Badge role={data.child_role} /></strong>
            </p>
          ) : (
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "#94A3B8" }}>
              En tant que Recruteur, vous ne pouvez pas recruter d'autres membres.
            </p>
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Lien d'inscription</h3>
        <div style={{
          background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8,
          padding: "12px 16px", fontFamily: "monospace", fontSize: 13,
          color: "#2563EB", wordBreak: "break-all",
        }}>
          {data.link}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={() => copy(data.link, "link")} style={btnSecondary}>
            {copied === "link" ? "✅ Copié !" : "📋 Copier le lien"}
          </button>
          {data.whatsapp_message && (
            <a href={data.whatsapp_message} target="_blank" rel="noreferrer" style={{
              ...btnPrimary, background: "#25D366", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              📲 Partager WhatsApp
            </a>
          )}
        </div>
      </Card>

      <Card style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>💡 Vos droits de commission</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <CommRule label="Niveau 1" pct="10%" desc="Vous êtes l'apporteur direct"   color="#7C3AED" />
          <CommRule label="Niveau 2" pct="5%"  desc="Votre filleul apporte un client" color="#2563EB" />
          <CommRule label="Bonus pool" pct="2%" desc="Pool mensuel commun"            color="#D97706" />
        </div>
      </Card>
    </BizLayout>
  );
}

function CommRule({ label, pct, desc, color }) {
  return (
    <div style={{
      background: color + "10", border: `1px solid ${color}25`, borderRadius: 10,
      padding: "14px 20px", minWidth: 150, textAlign: "center", flex: 1,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{pct}</div>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{label}</div>
      <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{desc}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — CLASSEMENT
// ─────────────────────────────────────────────────────────────
export function BizLeaderboardPage() {
  const [data,   setData]   = useState(null);
  const [period, setPeriod] = useState("month");
  const [busy,   setBusy]   = useState(true);

  useEffect(() => {
    setBusy(true);
    apiBiz(`/leaderboard?period=${period}`)
      .then(d => setData(d))
      .finally(() => setBusy(false));
  }, [period]);

  return (
    <BizLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
          🏆 Classement Business
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          {["week", "month", "all"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "6px 16px", borderRadius: 20, cursor: "pointer",
              background: period === p ? "#7C3AED" : "#fff",
              color:      period === p ? "#fff"    : "#64748B",
              border:     period === p ? "none"    : "1px solid #E2E8F0",
              fontWeight: 600, fontSize: 13,
            }}>
              {{ week: "Semaine", month: "Mois", all: "Tout temps" }[p]}
            </button>
          ))}
        </div>
      </div>

      {data?.my_rank && (
        <Alert type="info" style={{ marginBottom: 16 }}>
          Votre position : <strong>#{data.my_rank}</strong>
        </Alert>
      )}

      {busy ? <Loader /> : (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <div className="biz-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                    {["#", "Nom", "Rôle", "Pays", "Gains (FCFA)", "Recrues"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.top_earners || []).length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                      Aucun classement disponible.
                    </td></tr>
                  )}
                  {(data?.top_earners || []).map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #F1F5F9", background: i < 3 ? "#FAFAF7" : undefined }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 16 }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: "10px 12px" }}><Badge role={m.role} /></td>
                      <td style={{ padding: "10px 12px", color: "#64748B" }}>{m.country || "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#059669" }}>{fmt(m.earnings)}</td>
                      <td style={{ padding: "10px 12px" }}>{m.recruits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </BizLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — MES MEMBRES
//  FIX : référence `m` dans le bloc creds corrigée — on utilisait
//        la variable de boucle `m` hors de son scope (.map).
//        Remplacé par creds.member_id directement (déjà stocké via
//        setCreds({ ...credentials, member_id: newMember?.id }))
// ─────────────────────────────────────────────────────────────
export function BizMembersPage() {
  const { member } = useBizAuth();
  const [members,  setMembers]  = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name: "", email: "", phone: "", country: "CI", city: "", payment_method: "cash", jeko_method: "orange" });
  const [creds,    setCreds]    = useState(null);
  const [jekoUrl,  setJekoUrl]  = useState(null);   // lien de paiement Jeko si payment_method=jeko
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);
  const [loading,  setLoading]  = useState(true);

  const CAN_CREATE = { DIRECTRICE: "LEADER", LEADER: "SUPERVISEUR", SUPERVISEUR: "RECRUTEUR" };
  const targetRole = CAN_CREATE[member?.role];
  const canCreate  = !!targetRole;

  const load = () => {
    setLoading(true);
    apiBiz("/members")
      .then(d => setMembers(d.members || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async () => {
    setError(""); setJekoUrl(null);
    if (!form.name || !form.email) return setError("Nom et email requis.");
    setBusy(true);
    try {
      const payload = { ...form };
      const res = await apiBiz("/members", { method: "POST", body: JSON.stringify(payload) });

      // Réponse cash ou sans paiement : { member, credentials, payment_status }
      if (res.credentials) {
        setCreds({ ...res.credentials, member_id: res.member?.id, payment_status: res.payment_status });
      }
      // Réponse Jeko : { data: { redirect_url } } + _business_credentials dans headers (non exposé)
      // Le backend retourne le redirect_url directement
      if (res.data?.redirect_url) {
        setJekoUrl(res.data.redirect_url);
        // Ouvrir dans un nouvel onglet
        window.open(res.data.redirect_url, "_blank");
      }

      setForm({ name: "", email: "", phone: "", country: "CI", city: "", payment_method: "cash", jeko_method: "orange" });
      setShowForm(false);
      load();
    } catch (e) {
      setError(e?.error || e?.message || "Erreur lors de la création");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BizLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
          👥 Mes membres directs
        </h2>
        {canCreate && (
          <button onClick={() => { setShowForm(s => !s); setError(""); setCreds(null); }} style={btnPrimary}>
            ➕ Créer un {targetRole}
          </button>
        )}
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20, border: "2px solid #EDE9FE" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Nouveau {targetRole}</h3>
          {error && <Alert type="error" style={{ marginBottom: 12 }}>{error}</Alert>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <input placeholder="Nom complet *" value={form.name}  onChange={setF("name")}  style={inputStyle} />
            <input placeholder="Email *"        value={form.email} onChange={setF("email")} style={inputStyle} />
            <input placeholder="Téléphone"      value={form.phone} onChange={setF("phone")} style={inputStyle} />
            <input placeholder="Ville"          value={form.city}  onChange={setF("city")}  style={inputStyle} />
            <select value={form.country} onChange={setF("country")} style={{ ...inputStyle }}>
              {["CI","SN","CM","GH","BF","ML","TG","BN","GN","FR","BE","CH","CA","US","GB"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* ── Paiement à la création (MODIF 2) ── */}
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Mode de paiement de l'adhésion
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { value: "",     label: "⏳ Sans paiement (admin validera)" },
                { value: "jeko", label: "📲 Mobile Money (Jeko)"            },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, payment_method: opt.value }))}
                  type="button"
                  style={{
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                    fontWeight: 600, fontFamily: "inherit",
                    background: form.payment_method === opt.value ? "#7C3AED" : "#F8FAFC",
                    color:      form.payment_method === opt.value ? "#fff"    : "#374151",
                    border: form.payment_method === opt.value ? "none" : "1px solid #E2E8F0",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sous-méthode Jeko */}
            {form.payment_method === "jeko" && (
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 6 }}>
                  Opérateur Mobile Money
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {JEKO_METHODS.map(jm => (
                    <button key={jm.value} type="button"
                      onClick={() => setForm(f => ({ ...f, jeko_method: jm.value }))}
                      style={{
                        padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                        fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                        background: form.jeko_method === jm.value ? "#EDE9FE" : "#F8FAFC",
                        color:      form.jeko_method === jm.value ? "#7C3AED" : "#374151",
                        border: form.jeko_method === jm.value ? "1px solid #7C3AED" : "1px solid #E2E8F0",
                      }}
                    >
                      {jm.icon} {jm.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={handleCreate} disabled={busy} style={btnPrimary}>
              {busy ? "Création…" : "Créer le membre"}
            </button>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </Card>
      )}

      {/* ── Identifiants créés (cash / sans paiement) ── */}
      {creds && (
        <Card style={{ marginBottom: 20, background: "#F0FDF4", border: "2px solid #6EE7B7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: "#065F46", fontSize: 16 }}>
              ✅ Membre créé — Identifiants à transmettre
            </h3>
            {creds.payment_status && (
              <span style={{
                padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: creds.payment_status === "paid" ? "#D1FAE5" : "#FEF3C7",
                color:      creds.payment_status === "paid" ? "#065F46" : "#92400E",
              }}>
                {creds.payment_status === "paid" ? "💵 Adhésion payée (cash)" : "⏳ Paiement en attente"}
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, fontSize: 14 }}>
            {[
              { label: "🪪 ID membre",       value: creds.member_id || "—"    },
              { label: "👤 Identifiant",     value: creds.username            },
              { label: "🔑 Mot de passe",    value: creds.temp_password       },
              { label: "🎫 Code invitation", value: creds.invitation_code     },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #A7F3D0", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{label}</div>
                <code style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{value}</code>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                const txt = `ID membre : ${creds.member_id || "—"}\nIdentifiant : ${creds.username}\nMot de passe : ${creds.temp_password}\nCode invitation : ${creds.invitation_code}\nLien connexion : ${creds.login_url || ""}`;
                navigator.clipboard.writeText(txt);
                alert("✅ Identifiants copiés !");
              }}
              style={{ ...btnPrimary, background: "#059669" }}
            >
              📋 Copier tout
            </button>
            <button onClick={() => setCreds(null)} style={btnSecondary}>Fermer</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#6B7280" }}>
            ⚠️ Transmettez ces identifiants au membre — le mot de passe est temporaire.
          </div>
        </Card>
      )}

      {/* ── Lien Jeko en attente de paiement ── */}
      {jekoUrl && !creds && (
        <Card style={{ marginBottom: 20, background: "#FFF7ED", border: "2px solid #FDE68A" }}>
          <h3 style={{ margin: "0 0 10px", color: "#92400E", fontSize: 15 }}>
            📲 Paiement Mobile Money initié
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#78350F" }}>
            Le lien de paiement a été ouvert dans un nouvel onglet. Le compte sera activé automatiquement après confirmation Jeko.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <a href={jekoUrl} target="_blank" rel="noreferrer" style={{ ...btnPrimary, background: "#F59E0B", textDecoration: "none" }}>
              🔗 Rouvrir le lien de paiement
            </a>
            <button onClick={() => setJekoUrl(null)} style={btnSecondary}>Fermer</button>
          </div>
        </Card>
      )}

      {loading ? <Loader /> : (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <div className="biz-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                    {["Nom", "Email", "Rôle", "Statut", "Paiement", "Validation", "Clients", "Commissions", "Inscription"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                      Aucun membre direct.
                    </td></tr>
                  )}
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: "10px 12px", color: "#64748B", fontSize: 12 }}>{m.email}</td>
                      <td style={{ padding: "10px 12px" }}><Badge role={m.role} /></td>
                      <td style={{ padding: "10px 12px" }}><StatusBadge status={m.status} /></td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: m.status_payment === "paid" ? "#D1FAE5" : "#FFF1F2",
                          color:      m.status_payment === "paid" ? "#065F46" : "#BE123C",
                        }}>
                          {m.status_payment === "paid" ? "✅ Payé" : "❌ Impayé"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: m.status_validation === "approved" ? "#D1FAE5" : m.status_validation === "rejected" ? "#FFF1F2" : "#FEF3C7",
                          color:      m.status_validation === "approved" ? "#065F46" : m.status_validation === "rejected" ? "#BE123C" : "#92400E",
                        }}>
                          {m.status_validation === "approved" ? "Validé" : m.status_validation === "rejected" ? "Refusé" : "En attente"}
                        </span>
                      </td>
                        <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          background: "#EDE9FE", color: "#7C3AED",
                          borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                        }}>
                          {m.total_clients_created || 0}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#059669", whiteSpace: "nowrap" }}>
                        {m.total_commissions > 0 ? `${fmt(m.total_commissions)} FCFA` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748B", whiteSpace: "nowrap" }}>
                        {m.created_at ? new Date(m.created_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </BizLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  MODAL — CRÉER UN CLIENT MUTUALISTE
//  Flux 4 étapes : Infos → Formule → Paiement → Confirmation
//  Accessible à tous les niveaux (DIRECTRICE, LEADER, SUPERVISEUR, RECRUTEUR)
// ─────────────────────────────────────────────────────────────
const JEKO_METHODS = [
  { value: "orange", label: "Orange Money", icon: "🟠" },
  { value: "wave",   label: "Wave",         icon: "🔵" },
  { value: "mtn",    label: "MTN MoMo",     icon: "🟡" },
  { value: "moov",   label: "Moov Money",   icon: "🟢" },
  { value: "djamo",  label: "Djamo",        icon: "💜" },
];
const MODAL_STEPS = ["Informations", "Formule", "Paiement", "Confirmation"];

function CreateClientModal({ onClose, onCreated }) {
  const [step,         setStep]         = useState(0);
  const [plans,        setPlans]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  // Étape 1
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [city,         setCity]         = useState("");
  const [isReturning,  setIsReturning]  = useState(false);
  const [expDate,      setExpDate]      = useState("");
  // Étape 2
  const [selectedPlan, setSelectedPlan] = useState(null);
  // Étape 3
  const [payMethod,    setPayMethod]    = useState("jeko");
  const [jekoMethod,   setJekoMethod]   = useState("orange");
  // Étape 4
  const [result,       setResult]       = useState(null);
  const [copied,       setCopied]       = useState(null);

  // Charger les formules
  useEffect(() => {
    apiBiz("/plans")
      .then(d => setPlans(d.plans || []))
      .catch(() => setError("Impossible de charger les formules."));
  }, []);

  // Fermer sur Escape
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  function validateStep1() {
    setError("");
    if (!name.trim())  return setError("Le nom est requis.");
    if (!phone.trim()) return setError("Le téléphone est requis.");
    if (isReturning && !expDate) return setError("La date d'expiration est requise pour un ancien client.");
    setStep(1);
  }

  function validateStep2() {
    setError("");
    if (!selectedPlan) return setError("Veuillez choisir une formule.");
    setStep(2);
  }

  async function handleSubmit() {
    setError("");

    // ── Garde : Jeko obligatoire sauf ancien client ──────────
    if (!isReturning && payMethod !== "jeko") {
      return setError("Veuillez sélectionner le paiement mobile (JEKO).");
    }

    setLoading(true);
    try {
      // 1. Créer le client
      const createData = await apiBiz("/clients", {
        method: "POST",
        body: JSON.stringify({
          name:                name.trim(),
          phone:               phone.trim(),
          city:                city.trim() || undefined,
          plan_slug:           selectedPlan.slug,
          is_returning_client: isReturning,
          expiration_date:     isReturning ? expDate : undefined,
        }),
      });

      const { client, access_code, mutual_number, adhesion_fee } = createData.data || createData;
      const clientId = client.id;

      // Ancien client migré → pas de paiement
      if (isReturning) {
        setResult({ client, access_code, mutual_number, adhesion_fee: 0, isReturning: true });
        setStep(3);
        onCreated?.();
        return;
      }

      // ── Paiement JEKO obligatoire ────────────────────────────
      const jekoData = await apiBiz(`/clients/${clientId}/pay-adhesion-jeko`, {
        method: "POST",
        body: JSON.stringify({
          jeko_method: jekoMethod,
          success_url: `${window.location.origin}/business/clients?payment=success&mut=${mutual_number}`,
          failure_url: `${window.location.origin}/business/clients?payment=failed&client=${clientId}`,
        }),
      });

      // Le backend peut retourner le lien dans data.payment_url, data.redirect_url,
      // ou data.data.payment_url selon la version de paymentController
      const raw = jekoData?.data ?? jekoData;
      const redirectUrl =
        raw?.payment_url    ||
        raw?.redirect_url   ||
        raw?.data?.payment_url ||
        raw?.data?.redirect_url ||
        null;

      // Afficher d'abord le numéro + MDP, puis rediriger
      setResult({ client, access_code, mutual_number, adhesion_fee, paymentMethod: "jeko", redirectUrl });
      setStep(3);
      onCreated?.();

      // Ouvrir la page de paiement dans un nouvel onglet
      if (redirectUrl) {
        setTimeout(() => window.open(redirectUrl, "_blank"), 800);
      } else {
        // URL non reçue : log pour debug
        console.warn("[Jeko] URL de paiement non trouvée dans la réponse :", jekoData);
      }

    } catch (e) {
      setError(e?.error || e?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,.55)", display: "flex",
    alignItems: "center", justifyContent: "center", padding: 16,
  };
  const modalStyle = {
    background: "#fff", borderRadius: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
    width: "100%", maxWidth: 520,
    maxHeight: "92vh", display: "flex", flexDirection: "column",
    overflow: "hidden",
  };

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>

        {/* En-tête */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                Nouveau client mutualiste
              </h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94A3B8" }}>
                Étape {step + 1} / {MODAL_STEPS.length} — {MODAL_STEPS[step]}
              </p>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", fontSize: 22,
              cursor: "pointer", color: "#94A3B8", lineHeight: 1, padding: 0,
            }}>×</button>
          </div>
          {/* Barre de progression */}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {MODAL_STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 4,
                background: i <= step ? "#7C3AED" : "#E2E8F0",
                transition: "background .3s",
              }} />
            ))}
          </div>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>

          {error && (
            <Alert type="error" style={{ marginBottom: 14 }}>{error}</Alert>
          )}

          {/* ── Étape 1 : Infos client ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Nom complet <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="ex : Kouamé Adjoua Marie" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Téléphone <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="ex : 0707080808" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Ville
                </label>
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="ex : Abidjan" style={inputStyle} />
              </div>
              {/* Ancien client — désactivé temporairement */}
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0",
                borderRadius: 10, padding: "14px 16px", opacity: 0.5,
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "not-allowed" }}>
                  <input type="checkbox" checked={false} disabled
                    style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#94A3B8" }}>
                    Ancien client (migration de dossier)
                  </span>
                  <span style={{ fontSize: 11, color: "#CBD5E1", fontStyle: "italic", marginLeft: 4 }}>
                    — Non disponible actuellement
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ── Étape 2 : Choix formule ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {plans.length === 0 && (
                <p style={{ textAlign: "center", color: "#94A3B8", padding: 32 }}>Chargement des formules…</p>
              )}
              {plans.map(plan => (
                <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan)} style={{
                  width: "100%", textAlign: "left", borderRadius: 12, padding: 16, cursor: "pointer",
                  border: `2px solid ${selectedPlan?.id === plan.id ? "#7C3AED" : "#E2E8F0"}`,
                  background: selectedPlan?.id === plan.id ? "#F5F3FF" : "#fff",
                  transition: "all .15s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{plan.name}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>
                        Couverture {plan.coverage_percent}%
                        {plan.benefits?.length > 0 && ` · ${plan.benefits.length} catégorie(s)`}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#7C3AED" }}>
                        {Number(plan.adhesion_price).toLocaleString("fr-FR")} FCFA
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94A3B8" }}>adhésion</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                        {Number(plan.monthly_price).toLocaleString("fr-FR")} FCFA/mois
                      </p>
                    </div>
                  </div>
                  {selectedPlan?.id === plan.id && plan.benefits?.length > 0 && (
                    <div style={{
                      marginTop: 12, paddingTop: 12,
                      borderTop: "1px solid #DDD6FE",
                      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
                    }}>
                      {plan.benefits.map(b => (
                        <div key={b.category} style={{ fontSize: 12, color: "#374151", display: "flex", gap: 4 }}>
                          <span style={{ color: "#7C3AED" }}>✓</span>
                          <span>{b.category} ({b.coverage_percent}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Étape 3 : Paiement ── */}
          {step === 2 && selectedPlan && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Récap */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px", fontSize: 14 }}>
                <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#0F172A" }}>Récapitulatif</p>
                <p style={{ margin: "0 0 4px", color: "#64748B" }}>Client : <strong style={{ color: "#0F172A" }}>{name}</strong> — {phone}</p>
                <p style={{ margin: "0 0 4px", color: "#64748B" }}>Formule : <strong style={{ color: "#0F172A" }}>{selectedPlan.name}</strong></p>
                <p style={{ margin: 0, color: "#64748B" }}>Adhésion : <strong style={{ color: "#7C3AED", fontSize: 16 }}>
                  {Number(selectedPlan.adhesion_price).toLocaleString("fr-FR")} FCFA
                </strong></p>
              </div>

              {isReturning ? (
                <Alert type="warning">
                  ✓ Migration de dossier — aucun paiement requis à cette étape.
                </Alert>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>Mode de paiement</p>
                  {/* Cash — désactivé temporairement */}
                  <button type="button" disabled style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    borderRadius: 12, cursor: "not-allowed", textAlign: "left",
                    border: "2px solid #E2E8F0",
                    background: "#F1F5F9", opacity: 0.5,
                  }}>
                    <span style={{ fontSize: 28 }}>💵</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#94A3B8" }}>Paiement Cash</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>Espèces reçues — activation immédiate</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#CBD5E1", fontStyle: "italic" }}>Non disponible actuellement</p>
                    </div>
                  </button>
                  {/* JEKO */}
                  <button type="button" onClick={() => setPayMethod("jeko")} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    borderRadius: 12, cursor: "pointer", textAlign: "left",
                    border: `2px solid ${payMethod === "jeko" ? "#7C3AED" : "#E2E8F0"}`,
                    background: payMethod === "jeko" ? "#F5F3FF" : "#fff",
                  }}>
                    <span style={{ fontSize: 28 }}>📱</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0F172A" }}>Paiement Mobile (JEKO)</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>Orange, Wave, MTN, Moov, Djamo</p>
                    </div>
                  </button>
                  {/* Sous-choix JEKO */}
                  {payMethod === "jeko" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                      {JEKO_METHODS.map(m => (
                        <button key={m.value} type="button" onClick={() => setJekoMethod(m.value)} style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          gap: 4, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                          border: `2px solid ${jekoMethod === m.value ? "#7C3AED" : "#E2E8F0"}`,
                          background: jekoMethod === m.value ? "#F5F3FF" : "#fff",
                          fontSize: 11, fontWeight: 600,
                          color: jekoMethod === m.value ? "#7C3AED" : "#64748B",
                        }}>
                          <span style={{ fontSize: 22 }}>{m.icon}</span>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Étape 4 : Confirmation ── */}
          {step === 3 && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* En-tête */}
              <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: result.isReturning ? "#D1FAE5" : "#EDE9FE",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, margin: "0 auto 12px",
                }}>
                  {result.isReturning ? "✅" : "📋"}
                </div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                  {result.isReturning ? "Client migré !" : "Client créé !"}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                  {result.isReturning
                    ? "Dossier enregistré avec succès."
                    : "Notez le numéro et le code, puis finalisez le paiement."}
                </p>
              </div>

              {/* Bouton paiement Jeko — si URL reçue */}
              {result.redirectUrl && (
                <a
                  href={result.redirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "14px 20px", borderRadius: 12, textDecoration: "none",
                    background: "#7C3AED", color: "#fff", fontWeight: 700, fontSize: 15,
                    boxShadow: "0 4px 14px rgba(124,58,237,.35)",
                  }}
                >
                  📱 Ouvrir la page de paiement JEKO →
                </a>
              )}
              {result.paymentMethod === "jeko" && !result.redirectUrl && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#92400E" }}>
                  ⚠️ Lien de paiement non reçu. Réessayez depuis la liste des clients via le bouton Jeko.
                </div>
              )}

              {/* ── Numéro mutualiste ── */}
              <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: 1 }}>
                  Numéro mutualiste
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: "#5B21B6" }}>
                    {result.mutual_number}
                  </span>
                  <button onClick={() => copy(result.mutual_number, "num")} style={{
                    fontSize: 12, padding: "4px 12px", borderRadius: 8,
                    border: "1px solid #DDD6FE", background: "#fff",
                    color: "#7C3AED", cursor: "pointer", fontWeight: 600,
                  }}>
                    {copied === "num" ? "✅ Copié" : "Copier"}
                  </button>
                </div>
              </div>

              {/* ── Code d'accès / MDP temporaire ── */}
              <div style={{ background: "#FFFBEB", border: "2px solid #FDE68A", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: 1 }}>
                  🔑 Mot de passe temporaire (portail client)
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 800, letterSpacing: 4, color: "#78350F" }}>
                    {result.access_code}
                  </span>
                  <button onClick={() => copy(result.access_code, "code")} style={{
                    fontSize: 12, padding: "4px 12px", borderRadius: 8,
                    border: "1px solid #FDE68A", background: "#fff",
                    color: "#92400E", cursor: "pointer", fontWeight: 600,
                  }}>
                    {copied === "code" ? "✅ Copié" : "Copier"}
                  </button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#92400E" }}>
                  ⚠️ À remettre au client — il devra le changer à la première connexion.
                </p>
              </div>

              {/* ── Résumé client ── */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 16px", fontSize: 13 }}>
                <p style={{ margin: "0 0 4px" }}><span style={{ color: "#64748B" }}>Nom :</span> <strong>{result.client?.name}</strong></p>
                <p style={{ margin: "0 0 4px" }}><span style={{ color: "#64748B" }}>Téléphone :</span> {result.client?.phone}</p>
                <p style={{ margin: "0 0 4px" }}><span style={{ color: "#64748B" }}>Formule :</span> {result.client?.plan}</p>
                <p style={{ margin: 0 }}>
                  <span style={{ color: "#64748B" }}>Statut :</span>{" "}
                  <span style={{ fontWeight: 700, color: result.client?.status === "actif" ? "#059669" : "#D97706" }}>
                    {result.client?.status === "actif" ? "✅ Actif" : "⏳ En attente de paiement"}
                  </span>
                </p>
              </div>

              {/* ── Copier tout ── */}
              <button onClick={() => copy(
                `Numéro mutualiste : ${result.mutual_number}\nMot de passe : ${result.access_code}\nPortail : ${API_BASE.replace("/api/business","")}/client/login`,
                "all"
              )} style={{ ...btnSecondary, width: "100%", textAlign: "center" }}>
                {copied === "all" ? "✅ Copié !" : "📋 Copier numéro + mot de passe"}
              </button>
            </div>
          )}
        </div>

        {/* Pied de modal */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", gap: 10,
          background: "#FAFAFA", flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={() => { if (step === 0) onClose(); else setStep(s => s - 1); }}
            disabled={loading || step === 3}
            style={{ ...btnSecondary, opacity: (loading || step === 3) ? .5 : 1 }}
          >
            {step === 0 ? "Annuler" : "← Retour"}
          </button>

          {step === 0 && (
            <button type="button" onClick={validateStep1} style={btnPrimary}>Suivant →</button>
          )}
          {step === 1 && (
            <button type="button" onClick={validateStep2} style={btnPrimary}>Suivant →</button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!isReturning && payMethod !== "jeko")}
              style={{ ...btnPrimary, opacity: (loading || (!isReturning && payMethod !== "jeko")) ? .7 : 1 }}
            >
              {loading ? "Traitement…" :
                isReturning ? "✅ Enregistrer" :
                "📱 Créer & payer par JEKO"}
            </button>
          )}
          {step === 3 && (
            <button type="button" onClick={onClose} style={{ ...btnPrimary, background: "#059669" }}>
              ✅ Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MODAL — COLLECTE PROGRESSIVE (Wave / Orange / MTN / Moov / Djamo)
//  Flux JEKO : choix méthode + montant → jekoInit → redirect paiement
//  Flux Wave manuel : confirm référence Wave
// ─────────────────────────────────────────────────────────────
const COLLECTE_METHODS = [
  { value: "wave",   label: "Wave",         icon: "🔵" },
  { value: "orange", label: "Orange Money", icon: "🟠" },
  { value: "mtn",    label: "MTN MoMo",     icon: "🟡" },
  { value: "moov",   label: "Moov Money",   icon: "🟢" },
  { value: "djamo",  label: "Djamo",        icon: "💜" },
];

function CollecteWaveModal({ client, onClose, onCompleted }) {
  const [step,     setStep]    = useState("overview"); // overview | confirm_wave
  const [collecte, setCollecte]= useState(null);
  const [montant,  setMontant] = useState("");
  const [method,   setMethod]  = useState("wave");
  const [waveRef,  setWaveRef] = useState("");
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const [success,  setSuccess] = useState("");
  const [showLienModal, setShowLienModal] = useState(false); // lien token

  useEffect(() => {
    apiBiz(`/clients/${client.id}/collecte`)
      .then(d => {
        setCollecte(d.collecte || d);
        const reste = d.collecte?.reste ?? d.reste ?? 0;
        if (reste > 0) setMontant(String(reste));
      })
      .catch(() => setError("Impossible de charger la collecte."));
  }, [client.id]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleJekoInit() {
    setError(""); setLoading(true);
    try {
      const mont = Number(montant);
      if (!mont || mont < 500) { setError("Montant minimum : 500 FCFA"); return; }
      const d = await apiBiz(`/clients/${client.id}/collecte/jeko-init`, {
        method: "POST",
        body: JSON.stringify({ montant: mont, jeko_method: method }),
      });
      const redirectUrl = d?.data?.redirect_url || d?.redirect_url || d?.payment_url;
      if (redirectUrl) {
        window.open(redirectUrl, "_blank");
        setSuccess("Lien de paiement ouvert dans un nouvel onglet. Le versement sera enregistré automatiquement après confirmation.");
      } else {
        setError("Impossible d\'obtenir le lien de paiement JEKO.");
      }
    } catch (e) {
      setError(e?.error || e?.message || "Erreur initiation paiement.");
    } finally { setLoading(false); }
  }

  async function handleWaveConfirm() {
    setError(""); setLoading(true);
    try {
      const mont = Number(montant);
      if (!mont || mont < 500) { setError("Montant minimum : 500 FCFA"); return; }
      if (!waveRef.trim()) { setError("La référence Wave est requise."); return; }
      const d = await apiBiz(`/clients/${client.id}/collecte/wave-confirm`, {
        method: "POST",
        body: JSON.stringify({ montant: mont, wave_ref: waveRef.trim() }),
      });
      setSuccess(d.message || "Versement enregistré !");
      setCollecte(d.collecte);
      if (d.collecte?.complete) setTimeout(() => onCompleted(), 1800);
    } catch (e) {
      setError(e?.error || e?.message || "Erreur confirmation versement.");
    } finally { setLoading(false); }
  }

  const pct = collecte
    ? Math.min(100, Math.round(((collecte.total_verse || 0) / (collecte.adhesion_price || 15000)) * 100))
    : 0;

  const fmt = n => Number(n || 0).toLocaleString("fr-FR");

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.25)", width: "100%", maxWidth: 460, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* En-tête */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>💳 Collecte</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94A3B8" }}>{client.name} — {client.mutual_number}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94A3B8", lineHeight: 1, padding: 0 }}>×</button>
          </div>
        </div>

        {/* Corps */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {error   && <div style={{ background: "#FFF1F2", color: "#BE123C", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>{error}</div>}
          {success && <div style={{ background: "#F0FDF4", color: "#15803D", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>{success}</div>}

          {/* Progression */}
          {collecte && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Progression</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED" }}>{pct}%</span>
              </div>
              <div style={{ height: 10, background: "#E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 8, background: pct >= 100 ? "#059669" : "#7C3AED", width: `${pct}%`, transition: "width .4s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#64748B" }}>
                <span>Versé : <strong style={{ color: "#0F172A" }}>{fmt(collecte.total_verse)} FCFA</strong></span>
                <span>Total : <strong style={{ color: "#0F172A" }}>{fmt(collecte.adhesion_price)} FCFA</strong></span>
              </div>
              {collecte.reste > 0 && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#D97706", fontWeight: 600 }}>Reste : {fmt(collecte.reste)} FCFA</p>}
              {collecte.complete && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#059669", fontWeight: 700 }}>✅ Collecte complète — client activé !</p>}
            </div>
          )}

          {/* Saisie montant + méthode */}
          {!success && collecte && !collecte.complete && step === "overview" && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Montant à encaisser (FCFA) <span style={{ fontSize: 11, color: "#94A3B8" }}>min. 500</span>
                </label>
                <input
                  type="number" min={500}
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  placeholder={`Suggéré : ${fmt(collecte.reste)} FCFA`}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>Moyen de paiement</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {COLLECTE_METHODS.map(m => (
                    <div
                      key={m.value}
                      onClick={() => setMethod(m.value)}
                      style={{
                        border: method === m.value ? "2px solid #7C3AED" : "2px solid #E2E8F0",
                        borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                        background: method === m.value ? "#F5F3FF" : "#fff",
                        display: "flex", alignItems: "center", gap: 8, transition: "all .15s",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: method === m.value ? 700 : 500, color: method === m.value ? "#7C3AED" : "#374151" }}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {method === "wave" && (
                <button
                  onClick={() => setStep("confirm_wave")}
                  style={{ background: "none", border: "none", color: "#7C3AED", fontSize: 12, cursor: "pointer", textAlign: "left", textDecoration: "underline", padding: 0 }}
                >
                  Paiement Wave déjà effectué ? Saisir la référence manuellement →
                </button>
              )}

              {/* Lien autonome client */}
              <div style={{ borderTop: "1px dashed #E2E8F0", paddingTop: 12 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#94A3B8", textAlign: "center" }}>— ou —</p>
                <button
                  onClick={() => setShowLienModal(true)}
                  style={{
                    width: "100%", padding: "11px 16px", borderRadius: 10,
                    border: "1.5px solid #7C3AED", background: "#F5F3FF",
                    color: "#7C3AED", fontWeight: 700, fontSize: 13,
                    fontFamily: "inherit", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  📤 Envoyer un lien de paiement au client
                </button>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
                  Le client paie lui-même depuis son téléphone (Wave, Orange, MTN, Moov)
                </p>
              </div>
            </>
          )}

          {/* Wave manuel */}
          {step === "confirm_wave" && !success && (
            <>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#1D4ED8" }}>
                Entrez la référence visible sur le reçu Wave du client.
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Montant versé (FCFA)</label>
                <input type="number" min={500} value={montant} onChange={e => setMontant(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Référence Wave <span style={{ color: "#EF4444" }}>*</span></label>
                <input value={waveRef} onChange={e => setWaveRef(e.target.value)} placeholder="ex : WV-2024-XXXXXX" style={inputStyle} />
              </div>
              <button onClick={() => setStep("overview")} style={{ background: "none", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", textAlign: "left", padding: 0 }}>← Retour</button>
            </>
          )}
        </div>

        {/* Pied */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", gap: 10, background: "#FAFAFA", flexShrink: 0 }}>
          <button onClick={onClose} style={btnSecondary}>Fermer</button>
          {step === "overview" && collecte && !collecte.complete && !success && (
            <button
              onClick={handleJekoInit}
              disabled={loading || !montant || Number(montant) < 500}
              style={{ ...btnPrimary, background: "#7C3AED", opacity: (loading || !montant || Number(montant) < 500) ? .6 : 1 }}
            >
              {loading ? "Chargement…" : `${COLLECTE_METHODS.find(m => m.value === method)?.icon} Payer via ${COLLECTE_METHODS.find(m => m.value === method)?.label}`}
            </button>
          )}
          {step === "confirm_wave" && !success && (
            <button
              onClick={handleWaveConfirm}
              disabled={loading || !waveRef.trim() || !montant || Number(montant) < 500}
              style={{ ...btnPrimary, background: "#059669", opacity: (loading || !waveRef.trim()) ? .6 : 1 }}
            >
              {loading ? "Enregistrement…" : "✅ Confirmer le versement"}
            </button>
          )}
        </div>
      </div>

      {showLienModal && (
        <CollecteLienModal
          client={client}
          onClose={() => setShowLienModal(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — MES CLIENTS (MUTUALISTES)
// ─────────────────────────────────────────────────────────────
export function BizClientsPage() {
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({});
  const [collecteClient, setCollecteClient] = useState(null);
  const [lienClient,     setLienClient]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search)      params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    apiBiz(`/my-clients?${params}`)
      .then(d => {
        setClients(d.clients || []);
        setPagination(d.pagination || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const STATUS_LABELS = {
    actif:            { label: "Actif",      bg: "#D1FAE5", color: "#065F46" },
    attente:          { label: "En attente", bg: "#FEF3C7", color: "#92400E" },
    suspendu:         { label: "Suspendu",   bg: "#FFF1F2", color: "#BE123C" },
    renewal_required: { label: "Renouvellement", bg: "#DBEAFE", color: "#1E40AF" },
  };

  return (
    <BizLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
            🏥 Mes clients mutualistes
          </h2>
          {pagination.total !== undefined && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
              {pagination.total} client(s) au total
            </p>
          )}
        </div>
        <button onClick={() => setShowModal(true)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 8 }}>
          ➕ Nouveau client
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Nom, téléphone ou numéro…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inputStyle, maxWidth: 280 }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ ...inputStyle, maxWidth: 180 }}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="attente">En attente</option>
          <option value="suspendu">Suspendu</option>
          <option value="renewal_required">Renouvellement</option>
        </select>
      </div>

      <Card>
        {loading ? <Loader /> : (
          <>
            <div style={{ overflowX: "auto" }}>
              <div className="biz-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                      {["N° Mutualiste", "Nom", "Téléphone", "Formule", "Statut", "Paiement", "Inscription", "Cotisation", ""].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
                          Aucun client enregistré.<br />
                          <button onClick={() => setShowModal(true)} style={{ ...btnPrimary, marginTop: 12, fontSize: 13 }}>
                            ➕ Créer votre premier client
                          </button>
                        </td>
                      </tr>
                    )}
                    {clients.map(c => {
                      const st = STATUS_LABELS[c.status] || { label: c.status, bg: "#F1F5F9", color: "#64748B" };
                      const payOk = c.status_payment === "paid";
                      return (
                        <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#7C3AED", fontSize: 13 }}>
                              {c.mutual_number}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0F172A" }}>{c.name}</td>
                          <td style={{ padding: "10px 12px", color: "#64748B" }}>{c.phone}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              background: "#EDE9FE", color: "#7C3AED",
                              borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                            }}>{c.plan}</span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              background: st.bg, color: st.color,
                              borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                            }}>{st.label}</span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              background: payOk ? "#D1FAE5" : "#FFF1F2",
                              color: payOk ? "#065F46" : "#BE123C",
                              borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                            }}>
                              {payOk ? "✅ Payé" : "❌ Impayé"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#64748B", whiteSpace: "nowrap" }}>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#64748B", whiteSpace: "nowrap" }}>
                            {c.expiration_date
                              ? new Date(c.expiration_date).toLocaleDateString("fr-FR")
                              : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                            {!payOk && (
                              <button
                                onClick={() => setCollecteClient(c)}
                                style={{
                                  padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                                  background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 12,
                                  display: "inline-flex", alignItems: "center", gap: 5,
                                }}
                              >
                                🔵 Collecte Wave
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ ...btnSecondary, padding: "6px 14px", opacity: page === 1 ? .5 : 1 }}>
                  ← Préc.
                </button>
                <span style={{ padding: "8px 14px", fontSize: 13, color: "#64748B" }}>
                  Page {page} / {pagination.pages}
                </span>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  style={{ ...btnSecondary, padding: "6px 14px", opacity: page === pagination.pages ? .5 : 1 }}>
                  Suiv. →
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {showModal && (
        <CreateClientModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}

      {collecteClient && (
        <CollecteWaveModal
          client={collecteClient}
          onClose={() => setCollecteClient(null)}
          onCompleted={() => { setCollecteClient(null); load(); }}
        />
      )}

      {lienClient && (
        <CollecteLienModal
          client={lienClient}
          onClose={() => setLienClient(null)}
        />
      )}
    </BizLayout>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
  border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};
const btnPrimary = {
  padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer",
  background: "#7C3AED", color: "#fff", fontWeight: 700, fontSize: 14,
  fontFamily: "inherit",
};
const btnSecondary = {
  padding: "10px 22px", borderRadius: 8, cursor: "pointer",
  background: "#fff", border: "1px solid #E2E8F0", color: "#374151",
  fontWeight: 600, fontSize: 14, fontFamily: "inherit",
};
const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 16,
};
const quickBtn = color => ({
  padding: "9px 18px", borderRadius: 8, background: color + "15",
  border: `1px solid ${color}30`, color, fontWeight: 600, fontSize: 13,
  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
});


// ─────────────────────────────────────────────────────────────
//  MODAL — NOUVELLE COLLECTE (créer client + démarrer collecte)
// ─────────────────────────────────────────────────────────────
function NouvelleCollecteModal({ onClose, onCreated }) {
  const [step,         setStep]         = useState(0);
  const [plans,        setPlans]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [city,         setCity]         = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    apiBiz("/plans").then(d => setPlans(d.plans || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleCreate() {
    setError(""); setLoading(true);
    try {
      await apiBiz("/clients", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), city: city.trim() || undefined, plan_slug: selectedPlan.slug }),
      });
      setStep(2);
      // onCreated appelé à la fermeture (step 2) pour ne pas fermer la modal prématurément
    } catch (e) {
      setError(e?.error || e?.message || "Erreur lors de la création.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.25)", width: "100%", maxWidth: 480, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>💳 Nouvelle collecte</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748B" }}>
              {step === 0 ? "Informations du client" : step === 1 ? "Choisir la formule" : "Client créé ✅"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {error && <div style={{ background: "#FFF1F2", color: "#BE123C", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{error}</div>}

          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Nom complet *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Koné Mariam" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Téléphone *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 0709876543" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Ville (optionnel)</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Abidjan" style={inputStyle} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {plans.map(p => (
                <div key={p.id} onClick={() => setSelectedPlan(p)} style={{
                  border: selectedPlan?.id === p.id ? "2px solid #7C3AED" : "2px solid #E2E8F0",
                  borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                  background: selectedPlan?.id === p.id ? "#F5F3FF" : "#fff", transition: "all .15s",
                }}>
                  <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>
                    Adhésion : <strong>{(p.adhesion_price || 15000).toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>Client créé. Retrouvez-le dans <strong>Mes collectes</strong> pour enregistrer les versements.</p>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", gap: 10 }}>
          {step === 0 && (
            <>
              <button onClick={onClose} style={btnSecondary}>Annuler</button>
              <button onClick={() => { if (!name.trim()) return setError("Le nom est requis."); if (!phone.trim()) return setError("Le téléphone est requis."); setError(""); setStep(1); }} style={btnPrimary}>Suivant →</button>
            </>
          )}
          {step === 1 && (
            <>
              <button onClick={() => setStep(0)} style={btnSecondary}>← Retour</button>
              <button onClick={() => { if (!selectedPlan) return setError("Choisissez une formule."); handleCreate(); }} disabled={loading} style={{ ...btnPrimary, opacity: loading ? .6 : 1 }}>
                {loading ? "Création…" : "Créer"}
              </button>
            </>
          )}
          {step === 2 && <button onClick={() => { onCreated?.(); onClose(); }} style={{ ...btnPrimary, width: "100%" }}>Fermer</button>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MODAL — LIEN DE COLLECTE CLIENT AUTONOME
//  Permet à l'agent de générer/partager un lien unique
//  que le client peut utiliser sans se connecter.
//  Backend : POST /clients/:id/collecte/generer-lien
//            DELETE /clients/:id/collecte/lien
// ─────────────────────────────────────────────────────────────
function CollecteLienModal({ client, onClose }) {
  const [lienData,  setLienData]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [revoking,  setRevoking]  = useState(false);
  const [error,     setError]     = useState("");
  const [copied,    setCopied]    = useState(null);
  const [liveData,  setLiveData]  = useState(null);
  const [lastSince, setLastSince] = useState(null);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleGenerer() {
    setError(""); setLoading(true);
    try {
      const res = await apiBiz(`/clients/${client.id}/collecte/generer-lien`, { method: "POST" });
      // ok() retourne à plat : { success, collecte_link, token, qr_data, ... }
      // On normalise en un objet uniforme
      const payload = res.data ?? res;
      const normalized = {
        ...payload,
        collecte_link: payload.collecte_link || payload.url || payload.lien || payload.link,
        qr_data:       payload.qr_data || payload.qr_code || payload.qr,
      };
      setLienData(normalized);
      setLastSince(new Date().toISOString());
    } catch (e) {
      setError(e?.error || e?.message || "Erreur lors de la génération du lien.");
    } finally { setLoading(false); }
  }

  async function handleRevoquer() {
    if (!window.confirm("Révoquer ce lien ? Le client ne pourra plus l'utiliser.")) return;
    setRevoking(true);
    try {
      await apiBiz(`/clients/${client.id}/collecte/lien`, { method: "DELETE" });
      setLienData(null); setLastSince(null);
    } catch (e) {
      setError(e?.error || e?.message || "Erreur lors de la révocation.");
    } finally { setRevoking(false); }
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2500);
    });
  }

  function partagerWhatsApp() {
    if (!lienData?.collecte_link) return;
    const msg = encodeURIComponent(
      `Bonjour ${client.name} 👋\n\nVoici votre lien sécurisé pour régler votre adhésion Awoundjô en plusieurs versements :\n\n${lienData.collecte_link}\n\nCe lien est valable 90 jours. Cliquez dessus pour payer via Wave, Orange Money, MTN ou Moov.`
    );
    window.open(`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  }

  // Polling live des versements (toutes les 8s tant que le lien est actif)
  useEffect(() => {
    if (!lienData || !lastSince) return;
    const poll = async () => {
      try {
        const res = await apiBiz(`/collectes/live?since=${encodeURIComponent(lastSince)}`);
        if (res.versements?.length > 0 || res.summary) {
          setLiveData(res);
          setLastSince(new Date().toISOString());
        }
      } catch {}
    };
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [lienData, lastSince]);

  const fmtL = n => Number(n || 0).toLocaleString("fr-FR");

  const _btnInline = { padding: "6px 14px", borderRadius: 8, cursor: "pointer", background: "#fff", border: "1px solid #E2E8F0", color: "#374151", fontWeight: 600, fontSize: 12, fontFamily: "inherit" };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,.3)", width: "100%", maxWidth: 480, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>📤 Lien de collecte client</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94A3B8" }}>{client.name} — {client.mutual_number}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94A3B8", lineHeight: 1, padding: 0 }}>×</button>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ background: "#FFF1F2", color: "#BE123C", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>{error}</div>}

          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#1D4ED8" }}>
            <strong>📲 Comment ça marche :</strong> Générez un lien sécurisé à envoyer au client par WhatsApp ou SMS. Il pourra payer ses versements directement depuis son téléphone, sans se connecter.
          </div>

          {!lienData && (
            <button onClick={handleGenerer} disabled={loading} style={{
              padding: "14px 20px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#E2E8F0" : "#7C3AED", color: loading ? "#94A3B8" : "#fff",
              fontWeight: 700, fontSize: 15, fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {loading ? "Génération…" : "✨ Générer le lien de collecte"}
            </button>
          )}

          {lienData && (
            <>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: .8 }}>Lien client</p>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "#2563EB", wordBreak: "break-all", fontFamily: "monospace" }}>{lienData.collecte_link}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => copy(lienData.collecte_link, "url")} style={_btnInline}>
                    {copied === "url" ? "✅ Copié !" : "📋 Copier le lien"}
                  </button>
                  <button onClick={partagerWhatsApp} style={{ ..._btnInline, background: "#25D366", color: "#fff", border: "none" }}>
                    📲 WhatsApp
                  </button>
                </div>
              </div>

              {lienData.qr_data && (
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748B" }}>QR Code à montrer ou imprimer</p>
                  <img src={lienData.qr_data} alt="QR Code collecte" style={{ width: 160, height: 160, border: "1px solid #E2E8F0", borderRadius: 10 }} />
                </div>
              )}

              {lienData.expires_at && (
                <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center" }}>
                  ⏳ Lien valide jusqu'au {new Date(lienData.expires_at).toLocaleDateString("fr-FR")}
                </div>
              )}

              {liveData && (
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#166534" }}>🟢 Versements reçus (temps réel)</p>
                  {liveData.summary && (
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "#15803D" }}>
                      Total versé : <strong>{fmtL(liveData.summary.total_verse_global)} FCFA</strong>
                      {" · "}{liveData.summary.clients_actifs_ce_soir} client(s) actif(s)
                    </p>
                  )}
                  {liveData.versements?.map((v, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#166534", padding: "4px 0", borderTop: i > 0 ? "1px solid #BBF7D0" : "none", display: "flex", gap: 8, alignItems: "center" }}>
                      <span>✅</span>
                      <span><strong>{fmtL(v.montant)} FCFA</strong> via {v.payment_method?.toUpperCase() || "WAVE"}</span>
                      <span style={{ color: "#86EFAC", marginLeft: "auto" }}>{new Date(v.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleRevoquer} disabled={revoking} style={{
                padding: "9px 16px", borderRadius: 8, cursor: "pointer",
                background: "#FFF1F2", border: "1px solid #FECDD3",
                color: "#BE123C", fontWeight: 600, fontSize: 13, fontFamily: "inherit", alignSelf: "flex-start",
              }}>
                {revoking ? "Révocation…" : "🗑 Révoquer ce lien"}
              </button>
            </>
          )}
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end", background: "#FAFAFA", flexShrink: 0 }}>
          <button onClick={onClose} style={btnSecondary}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — COLLECTES WAVE (page dédiée menu latéral)
// ─────────────────────────────────────────────────────────────
export function BizCollectesPage() {
  const [clients,        setClients]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [collecteClient, setCollecteClient] = useState(null);
  const [lienClient,     setLienClient]     = useState(null); // modal lien token
  const [search,         setSearch]         = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiBiz("/my-clients?limit=200")
      .then(d => setClients(d.clients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const enCours   = clients.filter(c => c.status_payment !== "paid");
  const completes = clients.filter(c => c.status_payment === "paid");

  const filt = arr => arr.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.mutual_number || "").includes(search)
  );

  function CollecteRow({ c, complete, onClick, onLien }) {
    return (
      <div
        onClick={complete ? undefined : onClick}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 16px", borderRadius: 12, marginBottom: 8,
          background: "#fff",
          border: complete ? "1.5px solid #D1FAE5" : "1.5px solid #EFF6FF",
          cursor: complete ? "default" : "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,.05)",
          transition: "box-shadow .15s",
        }}
        onMouseEnter={e => { if (!complete) e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,.12)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"; }}
      >
        <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: complete ? "#D1FAE5" : "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {complete ? "✅" : "💳"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            {c.phone} · <span style={{ fontFamily: "monospace", color: "#7C3AED" }}>{c.mutual_number}</span> · {c.plan}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {!complete && (
            <button
              onClick={e => { e.stopPropagation(); onLien?.(); }}
              title="Envoyer un lien de paiement au client"
              style={{
                padding: "5px 10px", borderRadius: 8, border: "1px solid #DDD6FE",
                background: "#F5F3FF", color: "#7C3AED", cursor: "pointer",
                fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              📤 Lien
            </button>
          )}
          <span style={{
            background: complete ? "#D1FAE5" : "#EFF6FF",
            color: complete ? "#065F46" : "#2563EB",
            borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {complete ? "Complète ✅" : "En cours →"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <BizLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>💳 Collectes</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>Collectez les frais d'adhésion en plusieurs versements</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 8 }}>
          ➕ Nouvelle collecte
        </button>
      </div>

      <input
        placeholder="🔍 Nom, téléphone ou numéro mutualiste…"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, maxWidth: 340, marginBottom: 20 }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Chargement…</div>
      ) : (
        <>
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".08em" }}>
              En cours ({filt(enCours).length})
            </h3>
            {filt(enCours).length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
                Aucune collecte en cours.
                <br />
                <button onClick={() => setShowModal(true)} style={{ ...btnPrimary, marginTop: 12, fontSize: 13 }}>➕ Démarrer une collecte</button>
              </div>
            ) : filt(enCours).map(c => (
              <CollecteRow key={c.id} c={c} complete={false} onClick={() => setCollecteClient(c)} onLien={() => setLienClient(c)} />
            ))}
          </div>

          {filt(completes).length > 0 && (
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".08em" }}>
                Complètes ({filt(completes).length})
              </h3>
              {filt(completes).map(c => (
                <CollecteRow key={c.id} c={c} complete={true} />
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <NouvelleCollecteModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(); }} />
      )}

      {collecteClient && (
        <CollecteWaveModal
          client={collecteClient}
          onClose={() => setCollecteClient(null)}
          onCompleted={() => { setCollecteClient(null); load(); }}
        />
      )}

      {lienClient && (
        <CollecteLienModal
          client={lienClient}
          onClose={() => setLienClient(null)}
        />
      )}
    </BizLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE — PARRAINAGE CLIENT MUTUALISTE
//  Permet à chaque membre Business de générer un lien public
//  pour recruter un prospect → commission 10 % à l'activation.
// ─────────────────────────────────────────────────────────────
export function BizParrainagePage() {
  const [data,     setData]     = useState(null);   // { parrainage_link, token, expires_at, whatsapp_message, stats:{click_count,conversion_count} }
  const [stats,    setStats]    = useState(null);   // { active_link, totals:{total_filleuls,filleuls_actifs,total_commissions}, filleuls[], links_history[] }
  const [busy,     setBusy]     = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Charger les stats au montage ────────────────────────────
  useEffect(() => {
    apiBiz("/parrainage/stats")
      .then(d => {
        setStats(d);
        // Pré-remplir data si un lien actif existe déjà
        if (d?.active_link) {
          setData({
            parrainage_link:  d.active_link.url,
            token:            d.active_link.token,
            expires_at:       d.active_link.expires_at,
            whatsapp_message: null, // disponible seulement après génération via POST
            stats: {
              click_count:      d.active_link.click_count,
              conversion_count: d.active_link.conversion_count,
            },
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  // ── Copier dans le presse-papiers ───────────────────────────
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  // ── Générer (ou récupérer) le lien de parrainage ────────────
  const handleGenerer = async () => {
    setError(""); setBusy(true);
    try {
      const res = await apiBiz("/parrainage/generer-lien", { method: "POST", body: JSON.stringify({}) });
      setData(res); // contient parrainage_link, token, expires_at, whatsapp_message
      // Rafraîchir les stats
      apiBiz("/parrainage/stats").then(d => setStats(d)).catch(() => {});
    } catch (e) {
      setError(e?.error || e?.message || "Impossible de générer le lien.");
    } finally {
      setBusy(false);
    }
  };

  // ── Révoquer le lien actif ───────────────────────────────────
  const handleRevoquer = async () => {
    if (!window.confirm("Révoquer ce lien ? Les prospects qui l'ont déjà reçu ne pourront plus s'inscrire via ce lien.")) return;
    setRevoking(true);
    try {
      await apiBiz("/parrainage/lien", { method: "DELETE" });
      setData(null);
      apiBiz("/parrainage/stats").then(d => setStats(d)).catch(() => {});
    } catch (e) {
      setError(e?.error || e?.message || "Erreur lors de la révocation.");
    } finally {
      setRevoking(false);
    }
  };

  // ── Message WhatsApp pré-rempli ──────────────────────────────
  // Le backend retourne déjà whatsapp_message (lien wa.me complet) après POST
  // Fallback : on le reconstruit à partir de parrainage_link
  const parrainageUrl = data?.parrainage_link;
  const whatsappHref  = data?.whatsapp_message
    ?? (parrainageUrl
      ? `https://wa.me/?text=${encodeURIComponent(
          `🏥 Rejoignez Awoundjô Mutuelle !\n\nInscrivez-vous en quelques clics et bénéficiez d'une couverture santé dès le premier mois.\n\n👉 ${parrainageUrl}`
        )}`
      : null);

  return (
    <BizLayout>
      {/* ── En-tête ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
          🎯 Parrainage client mutualiste
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B" }}>
          Partagez votre lien — chaque adhésion payée vous rapporte <strong style={{ color: "#7C3AED" }}>10 %</strong> de commission.
        </p>
      </div>

      {/* ── Règles de commission ─────────────────────────────── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <CommRule label="Vous (niveau 1)" pct="10%" desc="Commission sur l'adhésion payée"    color="#7C3AED" />
        <CommRule label="Votre parrain"   pct="5%"  desc="Si votre parrain a un compte actif" color="#2563EB" />
        <CommRule label="Bonus pool"      pct="2%"  desc="Pool mensuel commun"                color="#D97706" />
      </div>

      {error && <Alert type="error" style={{ marginBottom: 16 }}>{error}</Alert>}

      {/* ── Stats ────────────────────────────────────────────── */}
      {!loadingStats && stats && (
        <div className="biz-stats-grid" style={{ ...grid4, marginBottom: 20 }}>
          <StatCard
            label="Clics sur vos liens"
            value={stats.active_link?.click_count ?? 0}
            color="#2563EB" icon="👆"
          />
          <StatCard
            label="Conversions (paiements)"
            value={stats.active_link?.conversion_count ?? 0}
            color="#059669" icon="✅"
          />
          <StatCard
            label="Commissions générées"
            value={`${fmt(stats.totals?.total_commissions)} FCFA`}
            color="#7C3AED" icon="💰"
          />
          <StatCard
            label="Filleuls actifs"
            value={stats.totals?.filleuls_actifs ?? 0}
            color="#D97706" icon="🔗"
          />
        </div>
      )}

      {/* ── Bloc lien actif ou bouton génération ─────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1E1B4B" }}>
          🔗 Votre lien de parrainage
        </h3>

        {!data ? (
          /* ─ Pas encore de lien généré ─ */
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <p style={{ margin: "0 0 20px", color: "#64748B", fontSize: 14 }}>
              Générez votre lien unique et commencez à recruter des clients mutualistes.
            </p>
            <button onClick={handleGenerer} disabled={busy} style={{ ...btnPrimary, fontSize: 15, padding: "12px 28px" }}>
              {busy ? "Génération…" : "✨ Générer mon lien de parrainage"}
            </button>
          </div>
        ) : (
          /* ─ Lien actif ─ */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* URL */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
                URL de parrainage
              </label>
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8,
                padding: "12px 16px", fontFamily: "monospace", fontSize: 13,
                color: "#2563EB", wordBreak: "break-all",
              }}>
                {parrainageUrl}
              </div>
            </div>

            {/* Expiration */}
            {data.expires_at && (
              <Alert type="warning" style={{ fontSize: 13 }}>
                ⏳ Ce lien expire le <strong>{new Date(data.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong>.
                Vous pourrez en générer un nouveau ensuite.
              </Alert>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => copy(parrainageUrl, "url")} style={btnPrimary}>
                {copied === "url" ? "✅ Copié !" : "📋 Copier le lien"}
              </button>
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noreferrer" style={{
                  ...btnPrimary, background: "#25D366", textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  📲 Partager WhatsApp
                </a>
              )}
              <button
                onClick={handleGenerer}
                disabled={busy}
                title="Régénérer un nouveau token (révoque l'ancien)"
                style={{ ...btnSecondary }}
              >
                {busy ? "…" : "🔄 Nouveau lien"}
              </button>
              <button onClick={handleRevoquer} disabled={revoking} style={{
                ...btnSecondary, color: "#BE123C", borderColor: "#FECDD3",
              }}>
                {revoking ? "Révocation…" : "🗑 Révoquer"}
              </button>
            </div>

            {/* Message prêt à coller */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>
                Message prêt à envoyer
              </label>
              <div style={{
                background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8,
                padding: "12px 16px", fontSize: 13, color: "#166534", lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}>
                {`🏥 Rejoignez Awoundjô Mutuelle !\n\nInscrivez-vous en quelques clics et bénéficiez d'une couverture santé dès le premier mois.\n\n👉 ${parrainageUrl}`}
              </div>
              <button
                onClick={() => copy(`🏥 Rejoignez Awoundjô Mutuelle !\n\nInscrivez-vous en quelques clics et bénéficiez d'une couverture santé dès le premier mois.\n\n👉 ${parrainageUrl}`, "msg")}
                style={{ ...btnSecondary, marginTop: 8, fontSize: 13 }}
              >
                {copied === "msg" ? "✅ Copié !" : "📋 Copier le message"}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Historique des liens ─────────────────────────────── */}
      {stats?.links_history?.length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1E1B4B" }}>
            📋 Historique de vos liens
          </h3>
          <div className="biz-table-wrap" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                  {["Token", "Clics", "Conversions", "Expiration", "Statut"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.links_history.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "9px 12px", fontFamily: "monospace", color: "#64748B", fontSize: 12 }}>
                      {l.token?.slice(0, 12)}…
                    </td>
                    <td style={{ padding: "9px 12px" }}>{l.click_count ?? 0}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: "#059669" }}>{l.conversion_count ?? 0}</td>
                    <td style={{ padding: "9px 12px", color: "#64748B", whiteSpace: "nowrap" }}>
                      {l.expires_at ? new Date(l.expires_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      {l.revoked
                        ? <span style={{ background: "#FFF1F2", color: "#BE123C", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>Révoqué</span>
                        : new Date(l.expires_at) < new Date()
                          ? <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>Expiré</span>
                          : <span style={{ background: "#D1FAE5", color: "#065F46", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>✅ Actif</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </BizLayout>
  );
}
