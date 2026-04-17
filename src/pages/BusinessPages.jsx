// pages/BusinessPages.jsx
// ══════════════════════════════════════════════════════════════
//  Awoundjô Business — Pages Frontend
//  Routes : /business/login  /business/register  /business/dashboard
//           /business/network  /business/commissions  /business/bonus
//           /business/invitation  /business/leaderboard  /business/members
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

// ── API helper ────────────────────────────────────────────────
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

// ── Auth Context ──────────────────────────────────────────────
const BizAuthContext = createContext(null);

export function BizAuthProvider({ children }) {
  const [member, setMember]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem("business_token");
    if (!token) { setLoading(false); return; }
    try {
      const { member: m } = await apiBiz("/me");
      setMember(m);
    } catch {
      localStorage.removeItem("business_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loginCtx = (token, m) => {
    localStorage.setItem("business_token", token);
    setMember(m);
  };
  const logoutCtx = () => {
    localStorage.removeItem("business_token");
    setMember(null);
  };

  return (
    <BizAuthContext.Provider value={{ member, loading, loginCtx, logoutCtx, reload: load }}>
      {children}
    </BizAuthContext.Provider>
  );
}

export function useBizAuth() { return useContext(BizAuthContext); }

// ── UI atoms ──────────────────────────────────────────────────
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
          <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700, color: "#0F172A" }}>{value}</p>
          {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>{sub}</p>}
        </div>
        {icon && <span style={{ fontSize: 28 }}>{icon}</span>}
      </div>
    </Card>
  );
}

function Alert({ type = "info", children }) {
  const map = {
    info:    { bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8" },
    success: { bg: "#F0FDF4", border: "#BBF7D0", color: "#166534" },
    error:   { bg: "#FFF1F2", border: "#FECDD3", color: "#BE123C" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" },
  };
  const s = map[type];
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 8, padding: "10px 14px", fontSize: 14,
    }}>
      {children}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ textAlign: "center", padding: 60, color: "#7C3AED", fontSize: 16 }}>
      Chargement...
    </div>
  );
}

function fmt(n) {
  return Number(n || 0).toLocaleString("fr-FR");
}

// ── Layout avec navigation ────────────────────────────────────
const NAV = [
  { to: "/business/dashboard",    icon: "📊", label: "Tableau de bord" },
  { to: "/business/network",      icon: "🌐", label: "Mon réseau"      },
  { to: "/business/commissions",  icon: "💰", label: "Commissions"     },
  { to: "/business/bonus",        icon: "🎁", label: "Bonus mensuel"   },
  { to: "/business/invitation",   icon: "🔗", label: "Invitation"      },
  { to: "/business/leaderboard",  icon: "🏆", label: "Classement"      },
  { to: "/business/members",      icon: "👥", label: "Mes membres"     },
];

export function BizLayout({ children }) {
  const { member, logoutCtx } = useBizAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logoutCtx(); nav("/business/login"); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: "#1E1B4B", color: "#fff",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh",
        overflowY: "auto", zIndex: 100,
        transform: mobileOpen ? "translateX(0)" : undefined,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #ffffff15" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA" }}>
            🚀 Awoundjô
          </div>
          <div style={{ fontSize: 11, color: "#A5B4FC", marginTop: 2 }}>Business Network</div>
        </div>

        {/* Profil */}
        {member && (
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #ffffff15" }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{member.name}</p>
            <Badge role={member.role} />
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(item => {
            const active = loc.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 20px", fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? "#A78BFA" : "#C4C9E2",
                background: active ? "#ffffff10" : "transparent",
                textDecoration: "none",
                borderLeft: active ? "3px solid #A78BFA" : "3px solid transparent",
                transition: "all .15s",
              }}>
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
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

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, padding: "28px 32px", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — LOGIN
// ══════════════════════════════════════════════════════════════
export function BizLoginPage() {
  const { loginCtx } = useBizAuth();
  const nav  = useNavigate();
  const loc  = useLocation();
  const ref  = new URLSearchParams(loc.search).get("ref");

  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      const { token, member, must_change_password } = await apiBiz("/login", {
        method: "POST",
        body:   JSON.stringify(form),
      });
      loginCtx(token, member);
      nav(must_change_password ? "/business/change-password" : "/business/dashboard");
    } catch (e) {
      setError(e?.message || "Identifiants incorrects");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1E1B4B,#312E81)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 36px",
        width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🚀</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1E1B4B" }}>
            Awoundjô Business
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
            Connexion à votre espace
          </p>
        </div>

        {error && <Alert type="error" style={{ marginBottom: 16 }}>{error}</Alert>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            placeholder="Email ou identifiant"
            value={form.email}
            onChange={set("email")}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={set("password")}
            style={inputStyle}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          <button onClick={handleSubmit} disabled={busy} style={btnPrimary}>
            {busy ? "Connexion..." : "Se connecter"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748B" }}>
          Nouveau membre ?{" "}
          <Link to={`/business/register${ref ? `?ref=${ref}` : ""}`}
            style={{ color: "#7C3AED", fontWeight: 600 }}>
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — REGISTER
// ══════════════════════════════════════════════════════════════
export function BizRegisterPage() {
  const { loginCtx } = useBizAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const refCode = new URLSearchParams(loc.search).get("ref") || "";

  const [form, setForm]   = useState({
    name: "", email: "", password: "", phone: "", country: "CI", city: "",
    invitation_code: refCode,
  });
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name || !form.email || !form.password)
      return setError("Nom, email et mot de passe sont requis.");
    setBusy(true);
    try {
      const { token, member } = await apiBiz("/register", {
        method: "POST",
        body:   JSON.stringify(form),
      });
      loginCtx(token, member);
      nav("/business/dashboard");
    } catch (e) {
      setError(e?.message || "Erreur d'inscription");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1E1B4B,#312E81)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 36px",
        width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🚀</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
            Rejoindre Awoundjô Business
          </h1>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <input placeholder="Nom complet *" value={form.name}     onChange={set("name")}     style={inputStyle} />
          <input placeholder="Email *"        value={form.email}    onChange={set("email")}    style={inputStyle} />
          <input type="password" placeholder="Mot de passe *" value={form.password} onChange={set("password")} style={inputStyle} />
          <input placeholder="Téléphone"      value={form.phone}    onChange={set("phone")}    style={inputStyle} />
          <input placeholder="Ville"          value={form.city}     onChange={set("city")}     style={inputStyle} />
          <input placeholder="Code d'invitation (optionnel)" value={form.invitation_code} onChange={set("invitation_code")} style={inputStyle} />
          <button onClick={handleSubmit} disabled={busy} style={btnPrimary}>
            {busy ? "Inscription..." : "Créer mon compte"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748B" }}>
          Déjà membre ?{" "}
          <Link to="/business/login" style={{ color: "#7C3AED", fontWeight: 600 }}>Connexion</Link>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — DASHBOARD
// ══════════════════════════════════════════════════════════════
export function BizDashboardPage() {
  const { member } = useBizAuth();
  const [stats, setStats] = useState(null);
  const [busy, setBusy]   = useState(true);

  useEffect(() => {
    apiBiz("/dashboard").then(d => setStats(d)).catch(console.error).finally(() => setBusy(false));
  }, []);

  if (busy) return <BizLayout><Loader /></BizLayout>;

  const s = stats || {};
  const comm = s.commissions || {};
  const net  = s.network     || {};
  const pool = s.bonus_pool  || {};

  return (
    <BizLayout>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
          Tableau de bord Business
        </h2>
        <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
          Bonjour {member?.name} 👋 — <Badge role={member?.role} />
        </p>
      </div>

      {/* Ligne 1 — commissions */}
      <div style={grid4}>
        <StatCard label="Total gagné"         value={`${fmt(comm.total_earned)} FCFA`}  color="#7C3AED" icon="💰" />
        <StatCard label="Ce mois"             value={`${fmt(comm.this_month)} FCFA`}    color="#2563EB" icon="📅" />
        <StatCard label="En attente"          value={`${fmt(comm.pending)} FCFA`}       color="#D97706" icon="⏳" />
        <StatCard label="Payé"                value={`${fmt(comm.paid)} FCFA`}          color="#059669" icon="✅" />
      </div>

      {/* Ligne 2 — réseau */}
      <div style={{ ...grid4, marginTop: 16 }}>
        <StatCard label="Réseau total"        value={net.network_size || 0}             color="#7C3AED" icon="🌐" />
        <StatCard label="Membres directs"     value={Object.values(net.direct_members || {}).reduce((a,b)=>a+b.total,0)} color="#2563EB" icon="👥" />
        <StatCard label="Bonus pool (mois)"   value={`${fmt(pool.montant)} FCFA`}       color="#D97706" icon="🎁" />
        <StatCard label="Commissions N1"      value={comm.direct_count || 0}            color="#059669" icon="🤝"
          sub={`${fmt(comm.total_earned - (comm.paid||0))} FCFA en attente`} />
      </div>

      {/* Composition réseau */}
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
                borderRadius: 10, padding: "12px 20px", textAlign: "center",
              }}>
                <div style={{ fontSize: 22 }}>{ROLE_ICON[role] || "👤"}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: ROLE_COLOR[role] || "#64748B" }}>
                  {data.total}
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{role}</div>
                <div style={{ fontSize: 11, color: "#059669" }}>{data.active} actifs</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions rapides */}
      <Card style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#1E1B4B" }}>
          ⚡ Actions rapides
        </h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/business/invitation" style={quickBtn("#7C3AED")}>🔗 Mon lien d'invitation</Link>
          <Link to="/business/members"    style={quickBtn("#2563EB")}>➕ Créer un membre</Link>
          <Link to="/business/commissions" style={quickBtn("#059669")}>📋 Mes commissions</Link>
          <Link to="/business/leaderboard" style={quickBtn("#D97706")}>🏆 Classement</Link>
        </div>
      </Card>
    </BizLayout>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — RÉSEAU
// ══════════════════════════════════════════════════════════════
export function BizNetworkPage() {
  const [data, setData]   = useState(null);
  const [level, setLevel] = useState(1);
  const [busy, setBusy]   = useState(true);

  useEffect(() => {
    apiBiz("/network").then(d => setData(d)).finally(() => setBusy(false));
  }, []);

  if (busy) return <BizLayout><Loader /></BizLayout>;

  const net    = data?.network    || {};
  const totals = data?.totals     || {};
  const list   = net[`level${level}`] || [];

  return (
    <BizLayout>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
        🌐 Mon réseau Business
      </h2>

      {/* Totaux */}
      <div style={grid4}>
        {[1,2,3,4].map(l => (
          <StatCard key={l}
            label={`Niveau ${l}`}
            value={totals[`level${l}`] || 0}
            color={["#7C3AED","#2563EB","#059669","#D97706"][l-1]}
            icon={["👑","🤝","⭐","🙋"][l-1]}
          />
        ))}
      </div>

      {/* Filtre niveau */}
      <div style={{ display: "flex", gap: 8, margin: "20px 0 16px" }}>
        {[1,2,3,4].map(l => (
          <button key={l} onClick={() => setLevel(l)} style={{
            padding: "6px 18px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: level===l ? "#7C3AED" : "#fff",
            color:      level===l ? "#fff"    : "#64748B",
            border:     level===l ? "none"    : "1px solid #E2E8F0",
          }}>
            Niveau {l}
          </button>
        ))}
      </div>

      {/* Liste */}
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
              {["Nom","Rôle","Pays","Statut","Date d'adhésion","Gains"].map(h => (
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
                <td style={{ padding: "10px 12px", color: "#64748B" }}>{m.country}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: m.status==="ACTIVE" ? "#D1FAE5" : "#FEF3C7",
                    color:      m.status==="ACTIVE" ? "#065F46" : "#92400E",
                  }}>
                    {m.status}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "#64748B" }}>
                  {new Date(m.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#7C3AED" }}>
                  {fmt(m.total_earned)} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </BizLayout>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — COMMISSIONS
// ══════════════════════════════════════════════════════════════
export function BizCommissionsPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    apiBiz("/commissions").then(d => setData(d)).finally(() => setBusy(false));
  }, []);

  if (busy) return <BizLayout><Loader /></BizLayout>;

  const totals = data?.totals       || {};
  const list   = data?.commissions  || [];

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

      {/* Règles */}
      <Alert type="info" style={{ marginTop: 16 }}>
        <strong>Règle de commission :</strong> Niveau 1 (apporteur direct) = 10% · Niveau 2 (parrain) = 5% · Bonus pool = 2%
      </Alert>

      {/* Tableau */}
      <Card style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Historique des gains</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
              {["Date","Source","Niveau","Taux","Montant","Statut"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                Aucune commission reçue.
              </td></tr>
            )}
            {list.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "9px 12px", color: "#64748B" }}>
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{ fontWeight: 600 }}>{c.source_name}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8", display: "block" }}>{c.source_role}</span>
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{
                    background: c.niveau===1 ? "#EDE9FE" : "#DBEAFE",
                    color:      c.niveau===1 ? "#7C3AED" : "#2563EB",
                    borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                  }}>
                    N{c.niveau}
                  </span>
                </td>
                <td style={{ padding: "9px 12px", color: "#64748B" }}>{c.rate_pct}%</td>
                <td style={{ padding: "9px 12px", fontWeight: 700, color: "#059669" }}>
                  +{fmt(c.montant)} FCFA
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </BizLayout>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING:   { bg: "#FEF3C7", color: "#92400E", label: "En attente" },
    VALIDATED: { bg: "#DBEAFE", color: "#1E40AF", label: "Validé" },
    PAID:      { bg: "#D1FAE5", color: "#065F46", label: "Payé" },
    REJECTED:  { bg: "#FFF1F2", color: "#BE123C", label: "Rejeté" },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 20,
      padding: "2px 10px", fontSize: 12, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — BONUS POOL
// ══════════════════════════════════════════════════════════════
export function BizBonusPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    apiBiz("/bonus-pool").then(d => setData(d)).finally(() => setBusy(false));
  }, []);

  if (busy) return <BizLayout><Loader /></BizLayout>;

  const history = data?.history || [];
  const current = data?.current_pool || 0;

  return (
    <BizLayout>
      <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
        🎁 Bonus pool mensuel
      </h2>

      <Alert type="info">
        <strong>Comment ça marche :</strong> 2% de chaque paiement validé alimente le pool du mois en cours.
        La distribution s'effectue en fin de mois selon les règles de performance.
      </Alert>

      <div style={{ ...grid4, marginTop: 20 }}>
        <StatCard label="Pool mois courant" value={`${fmt(current)} FCFA`} color="#D97706" icon="🎁" />
      </div>

      <Card style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Historique des pools</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
              {["Mois","Année","Montant pool","Distribué"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign:"center", padding:32, color:"#94A3B8" }}>
                Aucun historique.
              </td></tr>
            )}
            {history.map(p => {
              const monthNames = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{monthNames[p.mois-1]}</td>
                  <td style={{ padding: "10px 12px" }}>{p.annee}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#D97706" }}>
                    {fmt(p.montant_total)} FCFA
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {p.distribue
                      ? <span style={{ background: "#D1FAE5", color: "#065F46", borderRadius: 20, padding: "2px 10px", fontSize: 12 }}>✅ Distribué</span>
                      : <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 12 }}>⏳ En cours</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </BizLayout>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — LIEN D'INVITATION
// ══════════════════════════════════════════════════════════════
export function BizInvitationPage() {
  const [data, setData]     = useState(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy]     = useState(true);

  useEffect(() => {
    apiBiz("/invitation-link").then(d => setData(d)).finally(() => setBusy(false));
  }, []);

  const copy = text => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (busy) return <BizLayout><Loader /></BizLayout>;
  if (!data) return <BizLayout><Alert type="error">Erreur de chargement.</Alert></BizLayout>;

  return (
    <BizLayout>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
        🔗 Mon lien d'invitation
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Code */}
        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Mon code</h3>
          <div style={{
            background: "#EDE9FE", borderRadius: 10, padding: "16px 20px",
            textAlign: "center", fontFamily: "monospace", fontSize: 24,
            fontWeight: 800, color: "#7C3AED", letterSpacing: 4,
          }}>
            {data.code}
          </div>
          <button onClick={() => copy(data.code)} style={{ ...btnPrimary, marginTop: 12 }}>
            {copied ? "✅ Copié !" : "📋 Copier le code"}
          </button>
        </Card>

        {/* Infos */}
        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Votre rôle</h3>
          <Badge role={data.role} />
          {data.child_role && (
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "#64748B" }}>
              Vous pouvez inviter des : <strong><Badge role={data.child_role} /></strong>
            </p>
          )}
        </Card>
      </div>

      {/* Lien */}
      <Card style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Lien d'inscription</h3>
        <div style={{
          background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8,
          padding: "12px 16px", fontFamily: "monospace", fontSize: 13,
          color: "#2563EB", wordBreak: "break-all",
        }}>
          {data.link}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={() => copy(data.link)} style={btnSecondary}>
            📋 Copier le lien
          </button>
          <a href={data.whatsapp_message} target="_blank" rel="noreferrer" style={{
            ...btnPrimary, background: "#25D366", textDecoration: "none",
            display: "inline-flex", alignItems: "center",
          }}>
            📲 Partager WhatsApp
          </a>
        </div>
      </Card>

      {/* Règles */}
      <Card style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>💡 Vos droits de commission</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <CommRule label="Niveau 1" pct="10%" desc="Vous êtes l'apporteur direct" color="#7C3AED" />
          <CommRule label="Niveau 2" pct="5%"  desc="Votre filleul apporte un client" color="#2563EB" />
          <CommRule label="Bonus pool" pct="2%" desc="Vers le pool mensuel commun"  color="#D97706" />
        </div>
      </Card>
    </BizLayout>
  );
}

function CommRule({ label, pct, desc, color }) {
  return (
    <div style={{
      background: color + "10", border: `1px solid ${color}25`, borderRadius: 10,
      padding: "14px 20px", minWidth: 180, textAlign: "center",
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{pct}</div>
      <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{label}</div>
      <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{desc}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — CLASSEMENT
// ══════════════════════════════════════════════════════════════
export function BizLeaderboardPage() {
  const [data, setData]     = useState(null);
  const [period, setPeriod] = useState("month");
  const [busy, setBusy]     = useState(true);

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
          {["week","month","all"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "6px 16px", borderRadius: 20, cursor: "pointer",
              background: period===p ? "#7C3AED" : "#fff",
              color:      period===p ? "#fff"    : "#64748B",
              border:     period===p ? "none"    : "1px solid #E2E8F0",
              fontWeight: 600, fontSize: 13,
            }}>
              {{week:"Semaine",month:"Mois",all:"Tout temps"}[p]}
            </button>
          ))}
        </div>
      </div>

      {data?.my_rank && (
        <Alert type="info" style={{ marginBottom: 16 }}>
          Votre position : <strong>#{data.my_rank}</strong> sur la période sélectionnée
        </Alert>
      )}

      {busy ? <Loader /> : (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                {["#","Nom","Rôle","Pays","Gains (FCFA)","Recrues"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.top_earners || []).map((m, i) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #F1F5F9", background: i < 3 ? "#FAFAF7" : undefined }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 16 }}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: "10px 12px" }}><Badge role={m.role} /></td>
                  <td style={{ padding: "10px 12px", color: "#64748B" }}>{m.country}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#059669" }}>
                    {fmt(m.earnings)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>{m.recruits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </BizLayout>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE — MES MEMBRES (créer + liste)
// ══════════════════════════════════════════════════════════════
export function BizMembersPage() {
  const { member } = useBizAuth();
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]   = useState({ name: "", email: "", phone: "", country: "CI", city: "" });
  const [creds, setCreds] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiBiz("/members").then(d => setMembers(d.members || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const canCreate = !!{ DIRECTRICE:"LEADER", LEADER:"SUPERVISEUR", SUPERVISEUR:"RECRUTEUR" }[member?.role];

  const handleCreate = async () => {
    setError("");
    if (!form.name || !form.email) return setError("Nom et email requis.");
    setBusy(true);
    try {
      const { member: m, credentials } = await apiBiz("/members", {
        method: "POST", body: JSON.stringify(form),
      });
      setCreds(credentials);
      setForm({ name: "", email: "", phone: "", country: "CI", city: "" });
      setShowForm(false);
      load();
    } catch (e) {
      setError(e?.message || "Erreur création");
    } finally {
      setBusy(false);
    }
  };

  const targetRole = { DIRECTRICE:"LEADER", LEADER:"SUPERVISEUR", SUPERVISEUR:"RECRUTEUR" }[member?.role];

  return (
    <BizLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E1B4B" }}>
          👥 Mes membres directs
        </h2>
        {canCreate && (
          <button onClick={() => setShowForm(s => !s)} style={btnPrimary}>
            ➕ Créer un {targetRole}
          </button>
        )}
      </div>

      {/* Formulaire création */}
      {showForm && (
        <Card style={{ marginBottom: 20, border: "2px solid #EDE9FE" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>
            Nouveau {targetRole}
          </h3>
          {error && <Alert type="error" style={{ marginBottom: 12 }}>{error}</Alert>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input placeholder="Nom complet *" value={form.name}    onChange={set("name")}    style={inputStyle} />
            <input placeholder="Email *"        value={form.email}   onChange={set("email")}   style={inputStyle} />
            <input placeholder="Téléphone"      value={form.phone}   onChange={set("phone")}   style={inputStyle} />
            <input placeholder="Ville"          value={form.city}    onChange={set("city")}    style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={handleCreate} disabled={busy} style={btnPrimary}>
              {busy ? "Création..." : "Créer"}
            </button>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </Card>
      )}

      {/* Identifiants générés */}
      {creds && (
        <Card style={{ marginBottom: 20, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <h3 style={{ margin: "0 0 10px", color: "#065F46" }}>✅ Membre créé — Identifiants</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14 }}>
            <div><strong>Identifiant :</strong> {creds.username}</div>
            <div><strong>Mot de passe :</strong> <code>{creds.temp_password}</code></div>
            <div><strong>Code invitation :</strong> {creds.invitation_code}</div>
            <div><strong>Lien :</strong> <a href={creds.login_url}>{creds.login_url}</a></div>
          </div>
          <button onClick={() => setCreds(null)} style={{ ...btnSecondary, marginTop: 10 }}>Fermer</button>
        </Card>
      )}

      {/* Liste */}
      {loading ? <Loader /> : (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                {["Nom","Email","Rôle","Statut","Paiement","Inscription"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                  Aucun membre direct.
                </td></tr>
              )}
              {members.map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: "10px 12px", color: "#64748B", fontSize: 12 }}>{m.email}</td>
                  <td style={{ padding: "10px 12px" }}><Badge role={m.role} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: m.status==="ACTIVE" ? "#D1FAE5" : "#FEF3C7",
                      color:      m.status==="ACTIVE" ? "#065F46" : "#92400E",
                    }}>{m.status}</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: m.status_payment==="paid" ? "#D1FAE5" : "#FFF1F2",
                      color:      m.status_payment==="paid" ? "#065F46" : "#BE123C",
                    }}>{m.status_payment}</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748B" }}>
                    {new Date(m.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </BizLayout>
  );
}

// ── Styles partagés ───────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
  border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box",
};
const btnPrimary = {
  padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer",
  background: "#7C3AED", color: "#fff", fontWeight: 700, fontSize: 14,
};
const btnSecondary = {
  padding: "10px 22px", borderRadius: 8, cursor: "pointer",
  background: "#fff", border: "1px solid #E2E8F0", color: "#374151",
  fontWeight: 600, fontSize: 14,
};
const grid4 = {
  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16,
};
const quickBtn = color => ({
  padding: "9px 18px", borderRadius: 8, background: color + "15",
  border: `1px solid ${color}30`, color, fontWeight: 600, fontSize: 13,
  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
});
