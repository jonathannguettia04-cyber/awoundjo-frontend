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
  { to: "/business/clients",      icon: "🏥", label: "Mes clients"     },
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
  const [payMethod,    setPayMethod]    = useState("cash");
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

      // Paiement CASH
      if (payMethod === "cash") {
        await apiBiz(`/clients/${clientId}/pay-adhesion-cash`, {
          method: "POST",
          body: JSON.stringify({ amount: adhesion_fee }),
        });
        setResult({ client, access_code, mutual_number, adhesion_fee, paymentMethod: "cash" });
        setStep(3);
        onCreated?.();
        return;
      }

      // Paiement JEKO
      if (payMethod === "jeko") {
        const jekoData = await apiBiz(`/clients/${clientId}/pay-adhesion-jeko`, {
          method: "POST",
          body: JSON.stringify({ jeko_method: jekoMethod }),
        });
        const redirectUrl = jekoData?.data?.redirect_url;
        if (redirectUrl) window.open(redirectUrl, "_blank");
        setResult({ client, access_code, mutual_number, adhesion_fee, paymentMethod: "jeko", pending: !redirectUrl });
        setStep(3);
        onCreated?.();
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
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: result.pending ? "#FEF3C7" : "#D1FAE5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, margin: "0 auto 12px",
                }}>
                  {result.pending ? "⏳" : "✅"}
                </div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                  {result.pending ? "Paiement en attente" : "Client enregistré !"}
                </h3>
                {result.pending && (
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                    La page de paiement s'est ouverte. Le compte sera activé automatiquement.
                  </p>
                )}
              </div>

              {/* Numéro mutualiste */}
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

              {/* Code d'accès */}
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: 1 }}>
                  Code d'accès temporaire (portail client)
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, letterSpacing: 4, color: "#78350F" }}>
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

              {/* Résumé client */}
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

              {/* Copier tout */}
              <button onClick={() => copy(
                `Numéro mutualiste : ${result.mutual_number}\nCode d'accès : ${result.access_code}\nPortail : ${API_BASE.replace("/api/business","")}/client/login`,
                "all"
              )} style={{ ...btnSecondary, width: "100%", textAlign: "center" }}>
                {copied === "all" ? "✅ Copié !" : "📋 Copier numéro + code"}
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
            <button type="button" onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, opacity: loading ? .7 : 1 }}>
              {loading ? "Traitement…" :
                isReturning ? "✅ Enregistrer" :
                payMethod === "cash" ? "💵 Confirmer le paiement" : "📱 Payer par mobile"}
            </button>
          )}
          {step === 3 && (
            <button type="button" onClick={onClose} style={{ ...btnPrimary, background: "#059669" }}>
              Fermer
            </button>
          )}
        </div>
      </div>
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
                      {["N° Mutualiste", "Nom", "Téléphone", "Formule", "Statut", "Paiement", "Inscription", "Cotisation"].map(h => (
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
