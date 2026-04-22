import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/cnepeci";

function apiHeaders() {
  const token = localStorage.getItem("cnepeci_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...apiHeaders(), ...(options.headers || {}) },
    });
    if (res.status === 401) {
      localStorage.removeItem("cnepeci_token");
      localStorage.removeItem("cnepeci_membre");
      window.location.reload();
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("[apiFetch]", path, e.message);
    return null;
  }
}

function extractData(json) {
  if (!json) return null;
  if (json.data !== undefined) return json.data;
  const { success, message, ...rest } = json;
  return Object.keys(rest).length ? rest : null;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ROLES = {
  BUREAU_CENTRALE:       { label: "Bureau Centrale",       abbr: "BC", color: "#7C3AED", grad: "linear-gradient(135deg,#7C3AED,#5B21B6)", level: 1 },
  COORDONNATEUR_GENERAL: { label: "Coordonnateur Général", abbr: "CG", color: "#059669", grad: "linear-gradient(135deg,#059669,#047857)", level: 2 },
  BUREAU_LOCAL:          { label: "Bureau Local",          abbr: "BL", color: "#2563EB", grad: "linear-gradient(135deg,#2563EB,#1D4ED8)", level: 3 },
  COORDONNATEUR_LOCAL:   { label: "Coordonnateur Local",   abbr: "CL", color: "#D97706", grad: "linear-gradient(135deg,#D97706,#B45309)", level: 4 },
  PASTEUR:               { label: "Pasteur d'Église",      abbr: "PA", color: "#DC2626", grad: "linear-gradient(135deg,#DC2626,#B91C1C)", level: 5 },
  SOUSCRIPTEUR:          { label: "Souscripteur Final",    abbr: "SF", color: "#6B7280", grad: "linear-gradient(135deg,#6B7280,#4B5563)", level: 6 },
};

const CREATION_MAP = {
  BUREAU_CENTRALE:       "COORDONNATEUR_GENERAL",
  COORDONNATEUR_GENERAL: "BUREAU_LOCAL",
  BUREAU_LOCAL:          "COORDONNATEUR_LOCAL",
  COORDONNATEUR_LOCAL:   "PASTEUR",
  PASTEUR:               "SOUSCRIPTEUR",
};

const MONTHS = ["Nov", "Déc", "Jan", "Fév", "Mar", "Avr"];
const BAR_VALUES_STATIC = [32000, 45000, 28000, 61000, 55000, 82500];

const fmt = n => (parseFloat(n) || 0).toLocaleString("fr-FR") + " F";
const fmtShort = n => {
  const v = parseFloat(n) || 0;
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M F";
  if (v >= 1000) return Math.round(v / 1000) + "k F";
  return v + " F";
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const G = {
  sidebar: "#0F0E17",
  sidebarBorder: "rgba(255,255,255,0.06)",
  bg: "#F0F2F8",
  surface: "#FFFFFF",
  border: "#E4E8F0",
  text: "#111827",
  muted: "#6B7280",
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  green: "#059669",
  greenLight: "#D1FAE5",
  blue: "#2563EB",
  blueLight: "#DBEAFE",
  gold: "#D97706",
  goldLight: "#FEF3C7",
  red: "#DC2626",
  redLight: "#FEE2E2",
};

// ─── COMPOSANTS DE BASE ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${G.border}`, borderTop: `3px solid ${G.purple}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Alert({ type, msg }) {
  if (!msg) return null;
  const colors = {
    error:   { bg: G.redLight,   text: G.red,   border: "#FECACA" },
    success: { bg: G.greenLight, text: G.green,  border: "#6EE7B7" },
    info:    { bg: G.purpleLight, text: G.purple, border: "#C4B5FD" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 10, padding: "11px 16px", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <span>{type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️"}</span>
      {msg}
    </div>
  );
}

function Badge({ children, color, bg }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>
      {children}
    </span>
  );
}

function ActiveBadge({ statut }) {
  const active = statut === "actif" || statut === "ACTIVE";
  const suspended = statut === "suspendu" || statut === "SUSPENDED";
  return (
    <Badge color={active ? G.green : suspended ? G.red : G.muted} bg={active ? G.greenLight : suspended ? G.redLight : "#F3F4F6"}>
      {active ? "● Actif" : suspended ? "● Suspendu" : "● Inactif"}
    </Badge>
  );
}

function TypeBadge({ type }) {
  const map = {
    adhesion:   { color: G.green,  bg: G.greenLight,  label: "Adhésion" },
    cotisation: { color: G.blue,   bg: G.blueLight,   label: "Cotisation" },
    bonus:      { color: G.gold,   bg: G.goldLight,   label: "Bonus" },
  };
  const c = map[type] || { color: G.muted, bg: "#F3F4F6", label: type };
  return <Badge color={c.color} bg={c.bg}>{c.label}</Badge>;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon, trend }) {
  return (
    <div style={{
      background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16,
      padding: "20px 22px", position: "relative", overflow: "hidden",
      transition: "transform .15s, box-shadow .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".7px" }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent + "1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: G.text, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: trend >= 0 ? G.green : G.red, fontWeight: 600 }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% ce mois
          </span>
        </div>
      )}
    </div>
  );
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function BarChart({ values }) {
  const data = values?.length ? values : BAR_VALUES_STATIC;
  const max = Math.max(...data);
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
        {data.map((v, i) => {
          const isLast = i === data.length - 1;
          const isHov = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end", cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <span style={{ fontSize: 10, fontWeight: 700, color: isHov ? G.purple : "#aaa", opacity: isHov || isLast ? 1 : 0.7, transition: "all .15s" }}>
                {Math.round(v / 1000)}k
              </span>
              <div style={{
                width: "100%",
                height: Math.round(v / max * 90),
                background: isLast ? `linear-gradient(180deg, ${G.purple}, #5B21B6)` : isHov ? `linear-gradient(180deg, #A78BFA, #7C3AED)` : "#DDD6FE",
                borderRadius: "6px 6px 0 0",
                transition: "all .2s",
                boxShadow: isHov ? `0 4px 12px ${G.purple}44` : "none",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", borderTop: `1px solid ${G.border}`, paddingTop: 6, marginTop: 2 }}>
        {MONTHS.map((m, i) => (
          <span key={m} style={{ flex: 1, fontSize: 10, color: hovered === i ? G.purple : "#aaa", textAlign: "center", fontWeight: hovered === i ? 700 : 400, transition: "all .15s" }}>{m}</span>
        ))}
      </div>
    </div>
  );
}

// ─── MINI DONUT ───────────────────────────────────────────────────────────────
function DonutChart({ segments, label }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return <div style={{ textAlign: "center", padding: 24, color: G.muted, fontSize: 12 }}>Aucune donnée</div>;

  let offset = 0;
  const r = 40, cx = 50, cy = 50, stroke = 14;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ}
              style={{ transition: "all .3s" }}
            />
          );
          offset += pct;
          return el;
        })}
        <text x="50" y="46" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: G.text }}>{label}</text>
        <text x="50" y="56" textAnchor="middle" style={{ fontSize: 8, fill: G.muted }}>total</text>
      </svg>
      <div style={{ flex: 1 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
              <span style={{ fontSize: 12, color: G.muted }}>{seg.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: seg.color }}>{fmtShort(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TREE NODE ────────────────────────────────────────────────────────────────
function TreeNode({ node }) {
  const [open, setOpen] = useState(false);
  const role = ROLES[node.role] || ROLES.SOUSCRIPTEUR;
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, marginBottom: 8, overflow: "hidden", transition: "box-shadow .15s" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: role.color + "18", color: role.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {node.nom?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{node.nom}</div>
          <div style={{ fontSize: 11, color: G.muted }}>{role.label} · {node.email}</div>
        </div>
        <ActiveBadge statut={node.statut} />
        <span style={{ fontSize: 14, color: "#ccc", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s", marginLeft: 4 }}>›</span>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${G.border}`, background: "#FAFBFE", padding: "12px 16px 12px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><span style={{ fontSize: 11, color: G.muted }}>Téléphone</span><div style={{ fontSize: 13, color: G.text, marginTop: 2 }}>{node.phone || "—"}</div></div>
            <div><span style={{ fontSize: 11, color: G.muted }}>Inscription</span><div style={{ fontSize: 13, color: G.text, marginTop: 2 }}>{new Date(node.created_at).toLocaleDateString("fr-FR")}</div></div>
            {node.code_invitation && <div><span style={{ fontSize: 11, color: G.muted }}>Code</span><div style={{ fontSize: 13, fontFamily: "monospace", color: G.purple, marginTop: 2 }}>{node.code_invitation}</div></div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE AUTH
// ══════════════════════════════════════════════════════════════════════════════
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nom: "", email: "", phone: "", password: "", code_invitation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(""); setSuccessMsg("");
    if (!form.email || !form.password) { setError("Email et mot de passe requis."); return; }
    if (mode === "register" && !form.nom) { setError("Nom requis."); return; }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/login" : "/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { nom: form.nom, email: form.email, phone: form.phone, password: form.password, code_invitation: form.code_invitation || undefined };
      const data = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      if (!data) { setError("Erreur réseau. Réessayez."); return; }
      if (!data.success) { setError(data.message || "Erreur inconnue"); return; }
      if (mode === "login") {
        const token = data.token || data.data?.token;
        const membre = data.membre || data.data?.membre;
        localStorage.setItem("cnepeci_token", token);
        localStorage.setItem("cnepeci_membre", JSON.stringify(membre));
        onAuth(membre);
      } else {
        setSuccessMsg("Inscription réussie ! Vous pouvez vous connecter.");
        setMode("login");
        setForm(f => ({ ...f, nom: "", phone: "", password: "", code_invitation: "" }));
      }
    } catch { setError("Erreur réseau. Vérifiez votre connexion."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #0F0E17 0%, #1E1B4B 50%, #0F0E17 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: "15%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${G.purple}22, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, #059669 22, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "44px 44px", width: 400, maxWidth: "90vw", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${G.purple}, #5B21B6)`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, boxShadow: `0 8px 32px ${G.purple}44` }}>
            ⛪
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-.3px" }}>CNEPECI Business</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{mode === "login" ? "Connexion à votre espace" : "Créer un compte"}</div>
        </div>

        {error && <div style={{ background: "rgba(220,38,38,.15)", color: "#FCA5A5", border: "1px solid rgba(220,38,38,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
        {successMsg && <div style={{ background: "rgba(5,150,105,.15)", color: "#6EE7B7", border: "1px solid rgba(5,150,105,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>✅ {successMsg}</div>}

        {(mode === "register" ? [
          { label: "Nom complet", key: "nom", type: "text" },
          { label: "Email", key: "email", type: "email" },
          { label: "Téléphone", key: "phone", type: "tel" },
          { label: "Mot de passe", key: "password", type: showPwd ? "text" : "password" },
          { label: "Code d'invitation (optionnel)", key: "code_invitation", type: "text" },
        ] : [
          { label: "Email", key: "email", type: "email" },
          { label: "Mot de passe", key: "password", type: showPwd ? "text" : "password" },
        ]).map(f => (
          <div key={f.key} style={{ marginBottom: 14, position: "relative" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>{f.label}</label>
            <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontSize: 13, color: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border .15s" }}
              onFocus={e => e.target.style.borderColor = G.purple}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
            />
            {f.key === "password" && (
              <span onClick={() => setShowPwd(s => !s)} style={{ position: "absolute", right: 12, bottom: 11, fontSize: 14, cursor: "pointer", color: "rgba(255,255,255,.3)" }}>{showPwd ? "🙈" : "👁"}</span>
            )}
          </div>
        ))}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "13px 20px", background: `linear-gradient(135deg, ${G.purple}, #5B21B6)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 8, boxShadow: `0 4px 20px ${G.purple}44`, opacity: loading ? 0.7 : 1, transition: "all .15s" }}>
          {loading ? "Chargement…" : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,.4)" }}>
          {mode === "login" ? (
            <>Pas encore membre ?{" "}<span onClick={() => { setMode("register"); setError(""); }} style={{ color: "#A78BFA", cursor: "pointer", fontWeight: 600 }}>S'inscrire</span></>
          ) : (
            <>Déjà inscrit ?{" "}<span onClick={() => { setMode("login"); setError(""); }} style={{ color: "#A78BFA", cursor: "pointer", fontWeight: 600 }}>Se connecter</span></>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function DashboardPage({ membre }) {
  const [stats, setStats] = useState(null);
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const role = membre?.role;

  useEffect(() => {
    Promise.all([apiFetch("/reseau/stats"), apiFetch("/profile")]).then(([statsRes, profilRes]) => {
      if (statsRes?.success) setStats(extractData(statsRes) || statsRes);
      if (profilRes?.success) setProfil(profilRes.profil || extractData(profilRes));
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const roleInfo = ROLES[role] || ROLES.SOUSCRIPTEUR;
  const showGains = role !== "SOUSCRIPTEUR" && role !== "BUREAU_CENTRALE";

  const kpis = stats ? [
    { label: "Membres directs",    value: stats.membres_directs ?? "0",      sub: "dans mon réseau",     accent: G.green,  icon: "👥", trend: 12 },
    { label: "CA réseau (mois)",    value: fmtShort(stats.ca_reseau_mois),    sub: "paiements validés",   accent: G.blue,   icon: "💳", trend: 5 },
    { label: "Commissions perçues", value: fmtShort(stats.commissions_total), sub: "total cumulé",        accent: G.purple, icon: "🏆" },
    { label: "Bonus ce mois",       value: fmtShort(stats.bonus_mois),        sub: "1,5% du CA réseau",   accent: G.gold,   icon: "🎁" },
  ] : [];

  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background: `linear-gradient(135deg, ${G.purple} 0%, #5B21B6 100%)`, borderRadius: 20, padding: "24px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 6 }}>Bienvenue,</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-.3px" }}>{membre?.nom || "Membre"}</div>
          <div style={{ marginTop: 10 }}>
            <span style={{ background: "rgba(255,255,255,.18)", color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600 }}>{roleInfo.label}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>Statut du compte</div>
          <div style={{ background: "rgba(5,150,105,.3)", color: "#6EE7B7", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, display: "inline-block" }}>● Actif</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {kpis.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Profil + Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Profil */}
        {profil && (
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: roleInfo.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800 }}>
                {profil.nom?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: G.text }}>{profil.nom}</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{roleInfo.label}</div>
              </div>
              <ActiveBadge statut={profil.statut} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "Email", value: profil.email, icon: "✉️" },
                { label: "Téléphone", value: profil.phone || "—", icon: "📞" },
                { label: "Code invitation", value: profil.code_invitation ? <span style={{ fontFamily: "monospace", color: G.purple, fontWeight: 700 }}>{profil.code_invitation}</span> : "—", icon: "🔑" },
                { label: "Inscrit le", value: profil.created_at ? new Date(profil.created_at).toLocaleDateString("fr-FR") : "—", icon: "📅" },
              ].map((f, i) => (
                <div key={i} style={{ background: "#FAFBFE", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: G.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{f.icon} {f.label}</div>
                  <div style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bar chart */}
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>Commissions (6 mois)</div>
            <span style={{ background: G.purpleLight, color: G.purple, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>📈 Tendance</span>
          </div>
          <BarChart />
        </div>
      </div>

      {/* Gains breakdown */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 16 }}>Répartition des gains</div>
        {!showGains ? (
          <div style={{ textAlign: "center", padding: 24, color: G.muted, fontSize: 13, background: "#FAFBFE", borderRadius: 10 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💡</div>
            {role === "BUREAU_CENTRALE" ? "Le Bureau Centrale perçoit uniquement le bonus réseau global." : "Aucune commission directe pour ce rôle."}
          </div>
        ) : (
          <DonutChart
            label={fmtShort((stats?.commissions_total || 0))}
            segments={[
              { label: "Adhésion (10%)",    value: stats?.commissions_adhesion || 0,   color: G.green },
              { label: "Cotisation (5%)",   value: stats?.commissions_cotisation || 0, color: G.blue },
              { label: "Bonus réseau (1,5%)", value: stats?.bonus_mois || 0,           color: G.gold },
            ]}
          />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE RÉSEAU
// ══════════════════════════════════════════════════════════════════════════════
function NetworkPage() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/reseau").then(data => {
      if (data?.success) setMembres(data.membres || extractData(data)?.membres || []);
      setLoading(false);
    });
  }, []);

  const filtered = membres.filter(m => !search || m.nom?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${G.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: G.text }}>Mon réseau direct</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{membres.length} membre(s) direct(s)</div>
          </div>
          <input placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: "8px 14px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", width: 220, background: "#FAFBFE" }} />
        </div>
        <div style={{ padding: 20 }}>
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: G.muted, fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
              {search ? "Aucun membre correspondant" : "Aucun membre direct pour l'instant"}
            </div>
          ) : filtered.map((n, i) => <TreeNode key={i} node={n} />)}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE COMMISSIONS
// ══════════════════════════════════════════════════════════════════════════════
function CommissionsPage() {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({ adhesion: 0, cotisation: 0, bonus: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback((p = 1) => {
    setLoading(true);
    apiFetch(`/commissions?page=${p}&limit=20`).then(data => {
      if (data?.success) {
        const rows = data.commissions || [];
        setCommissions(rows);
        setTotal(data.total || 0);
        setStats({
          adhesion:   rows.filter(c => c.type === "adhesion").reduce((s, c) => s + parseFloat(c.montant), 0),
          cotisation: rows.filter(c => c.type === "cotisation").reduce((s, c) => s + parseFloat(c.montant), 0),
          bonus:      rows.filter(c => c.type === "bonus").reduce((s, c) => s + parseFloat(c.montant), 0),
        });
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Adhésion (10%)"   value={fmtShort(stats.adhesion)}   sub="commission directe"  accent={G.green}  icon="🤝" />
        <StatCard label="Cotisation (5%)"  value={fmtShort(stats.cotisation)} sub="mensuelle"           accent={G.blue}   icon="💳" />
        <StatCard label="Bonus réseau"     value={fmtShort(stats.bonus)}      sub="1,5% CA mensuel"    accent={G.gold}   icon="⭐" />
      </div>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>Détail des commissions</div>
        </div>
        {loading ? <Spinner /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFBFE" }}>
                  {["Date", "Type", "Source", "Rôle", "Montant"].map(h => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".5px", padding: "10px 20px", textAlign: "left", borderBottom: `1px solid ${G.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 36, color: G.muted, fontSize: 13 }}>Aucune commission pour le moment</td></tr>
                ) : commissions.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFBFE"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: G.muted }}>{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                    <td style={{ padding: "12px 20px" }}><TypeBadge type={c.type} /></td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: G.text, fontWeight: 500 }}>{c.source_nom || "—"}</td>
                    <td style={{ padding: "12px 20px", fontSize: 12, color: G.muted }}>{ROLES[c.source_role]?.label || c.source_role || "—"}</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, fontWeight: 700, color: G.text }}>{fmt(c.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16, borderTop: `1px solid ${G.border}` }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${G.border}`, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: G.muted, fontFamily: "inherit" }}>← Préc.</button>
            <span style={{ padding: "7px 16px", fontSize: 13, color: G.muted }}>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
              style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${G.border}`, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: G.muted, fontFamily: "inherit" }}>Suiv. →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE BONUS
// ══════════════════════════════════════════════════════════════════════════════
function BonusPage() {
  const [historique, setHistorique] = useState([]);
  const [statsReseau, setStatsReseau] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch("/bonus/historique"), apiFetch("/reseau/stats")]).then(([bonusRes, statsRes]) => {
      if (bonusRes?.success) setHistorique(bonusRes.historique || []);
      if (statsRes?.success) setStatsReseau(statsRes);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <StatCard label="CA réseau (ce mois)" value={fmtShort(statsReseau?.ca_reseau_mois)} sub="chiffre d'affaires réseau" accent={G.gold}   icon="📊" />
        <StatCard label="Bonus ce mois"        value={fmtShort(statsReseau?.bonus_mois)}    sub="= CA × 1,5%"              accent={G.purple} icon="🎁" />
      </div>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>Historique bonus mensuel</div>
        </div>
        {historique.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: G.muted, fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>Aucun historique disponible
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFBFE" }}>
                {["Période", "CA réseau", "Taux", "Bonus versé"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".5px", padding: "10px 20px", textAlign: "left", borderBottom: `1px solid ${G.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historique.map((b, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFBFE"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, color: G.text }}>{moisNoms[(b.mois || 1) - 1]} {b.annee}</td>
                  <td style={{ padding: "12px 20px", fontSize: 13, color: G.muted }}>{fmt(b.chiffre_affaire)}</td>
                  <td style={{ padding: "12px 20px" }}><Badge color={G.gold} bg={G.goldLight}>1,5%</Badge></td>
                  <td style={{ padding: "12px 20px", fontSize: 14, fontWeight: 700, color: G.gold }}>{fmt(b.bonus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PAIEMENT
// ══════════════════════════════════════════════════════════════════════════════
function PaiementPage({ membre }) {
  const [type, setType] = useState("adhesion");
  const [montant, setMontant] = useState(15000);
  const [methode, setMethode] = useState("cinetpay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePayer = async () => {
    setError(""); setSuccess("");
    if (!montant || montant < 100) { setError("Montant minimum : 100 FCFA"); return; }
    setLoading(true);
    try {
      const endpoint = methode === "cinetpay" ? "/paiement/cinetpay/init" : "/paiement/paydunya/init";
      const data = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ montant, type, success_url: `${window.location.origin}/cnepeci/paiement/success`, failed_url: `${window.location.origin}/cnepeci/paiement/echec` }),
      });
      if (!data) { setError("Erreur réseau."); return; }
      if (!data.success) { setError(data.message || "Erreur paiement"); return; }
      const payUrl = data.payment_url || data.data?.payment_url;
      if (payUrl) {
        setSuccess("Redirection vers la page de paiement…");
        setTimeout(() => { window.location.href = payUrl; }, 1000);
      } else { setError("URL de paiement non reçue. Réessayez."); }
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  };

  const commEstimee = type === "adhesion" ? Math.round(montant * 0.10) : Math.round(montant * 0.05);

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${G.border}`, background: `linear-gradient(135deg, ${G.green}0D, transparent)` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.text }}>💳 Effectuer un paiement</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>CinetPay & PayDunya acceptés</div>
        </div>
        <div style={{ padding: 28 }}>
          <Alert type="error" msg={error} />
          <Alert type="success" msg={success} />

          {/* Type */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Type de paiement</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ val: "adhesion", label: "🤝 Adhésion", sub: "Frais d'entrée" }, { val: "cotisation", label: "📆 Cotisation", sub: "Mensuelle" }].map(t => (
                <div key={t.val} onClick={() => setType(t.val)} style={{ flex: 1, border: `2px solid ${type === t.val ? G.green : G.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", background: type === t.val ? G.greenLight : "#FAFBFE", transition: "all .15s" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: type === t.val ? G.green : G.text }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 3 }}>{t.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Montant */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>Montant (FCFA)</label>
            <input type="number" value={montant} onChange={e => setMontant(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", padding: "12px 16px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 16, fontWeight: 700, color: G.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#FAFBFE" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {[5000, 10000, 15000, 25000].map(v => (
                <button key={v} onClick={() => setMontant(v)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${montant === v ? G.purple : G.border}`, background: montant === v ? G.purpleLight : "#fff", color: montant === v ? G.purple : G.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{(v / 1000)}k</button>
              ))}
            </div>
          </div>

          {/* Méthode */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Méthode de paiement</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ val: "cinetpay", label: "CinetPay", sub: "Orange, Wave, MTN…" }, { val: "paydunya", label: "PayDunya", sub: "Orange, Wave, MTN…" }].map(m => (
                <div key={m.val} onClick={() => setMethode(m.val)} style={{ flex: 1, border: `2px solid ${methode === m.val ? G.purple : G.border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", background: methode === m.val ? G.purpleLight : "#FAFBFE", transition: "all .15s" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: methode === m.val ? G.purple : G.text }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Récap */}
          <div style={{ background: "#FAFBFE", border: `1px solid ${G.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
            {[
              { label: "Type", value: <TypeBadge type={type} /> },
              { label: "Montant", value: <span style={{ fontWeight: 700, fontSize: 14 }}>{fmt(montant)}</span> },
              { label: "Commission parrain", value: <span style={{ color: G.green, fontWeight: 700 }}>{fmt(commEstimee)} ({type === "adhesion" ? "10%" : "5%"})</span> },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${G.border}` : "none" }}>
                <span style={{ fontSize: 13, color: G.muted }}>{row.label}</span>
                {row.value}
              </div>
            ))}
          </div>

          <button onClick={handlePayer} disabled={loading || !!success}
            style={{ width: "100%", padding: "14px 20px", background: `linear-gradient(135deg, ${G.green}, #047857)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading || success ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: `0 4px 20px ${G.green}44`, opacity: loading || success ? 0.7 : 1, transition: "all .15s" }}>
            {loading ? "⏳ Traitement…" : `Payer ${fmt(montant)} via ${methode === "cinetpay" ? "CinetPay" : "PayDunya"} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE INVITATION — CORRIGÉE + AMÉLIORÉE
// ══════════════════════════════════════════════════════════════════════════════
function InvitePage({ membre }) {
  const [copied, setCopied] = useState(null);
  const [qrVisible, setQrVisible] = useState(false);
  const code = membre?.code_invitation || null;
  const canRecruit = !!CREATION_MAP[membre?.role];
  const frontUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const url = `${frontUrl}/join?ref=${code}`;

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`Rejoignez mon réseau CNEPECI ! 🌐\n\nLien : ${url}\nCode : ${code}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header card */}
      <div style={{ background: `linear-gradient(135deg, ${G.purple} 0%, #5B21B6 100%)`, borderRadius: 20, padding: "28px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Lien d'invitation personnel</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>
          Partagez votre lien pour recruter et générer des commissions automatiques
        </div>
      </div>

      {!canRecruit ? (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 8 }}>Recrutement non disponible</div>
          <div style={{ fontSize: 13, color: G.muted, maxWidth: 360, margin: "0 auto" }}>
            {membre?.role === "SOUSCRIPTEUR"
              ? "Les souscripteurs finaux ne peuvent pas recruter directement. Parlez à votre parrain pour évoluer dans le réseau."
              : "Votre rôle actuel ne permet pas le recrutement direct."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Code bloc */}
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 14 }}>Votre code d'invitation</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, background: G.purpleLight, borderRadius: 12, padding: "16px 20px", fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: G.purple, textAlign: "center", letterSpacing: 4 }}>
                {code}
              </div>
              <button onClick={() => copy(code, "code")}
                style={{ padding: "16px 20px", background: copied === "code" ? G.green : G.purple, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .2s", whiteSpace: "nowrap" }}>
                {copied === "code" ? "✅ Copié !" : "Copier"}
              </button>
            </div>
          </div>

          {/* URL bloc */}
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 14 }}>Lien d'inscription direct</div>
            <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 14 }}>
              <div style={{ flex: 1, background: "#FAFBFE", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 12, color: G.purple, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url}
              </div>
              <button onClick={() => copy(url, "url")}
                style={{ padding: "11px 18px", background: copied === "url" ? G.green : G.purple, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .2s" }}>
                {copied === "url" ? "✅" : "Copier"}
              </button>
            </div>

            {/* Share buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={shareWhatsApp}
                style={{ flex: 1, padding: "11px 16px", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                📱 Partager WhatsApp
              </button>
              <button onClick={() => copy(`Code: ${code}\nLien: ${url}`, "all")}
                style={{ flex: 1, padding: "11px 16px", background: "#FAFBFE", color: G.text, border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {copied === "all" ? "✅ Copié !" : "📋 Tout copier"}
              </button>
            </div>
          </div>

          {/* Info card */}
          <div style={{ background: G.greenLight, border: `1px solid ${G.green}33`, borderRadius: 16, padding: "18px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G.green, marginBottom: 10 }}>💡 Comment ça marche ?</div>
            {[
              "Partagez votre lien ou code à vos contacts",
              "Chaque inscription via votre lien vous crédite automatiquement",
              "Vous percevez 10% sur chaque adhésion de votre filleul",
              "Vous percevez 5% sur ses cotisations mensuelles",
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 13, color: "#065F46" }}>
                <span style={{ color: G.green, fontWeight: 700, flexShrink: 0 }}>→</span> {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE HISTORIQUE
// ══════════════════════════════════════════════════════════════════════════════
function HistoryPage() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    apiFetch("/paiements?page=1&limit=50").then(data => {
      if (data?.success) setPaiements(data.paiements || []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? paiements : paiements.filter(p => p.type === filter || p.statut === filter);

  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${G.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>📋 Historique de mes paiements</div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: "7px 12px", border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12, fontFamily: "inherit", background: "#fff", color: G.text, outline: "none" }}>
          {[["all","Tous"], ["adhesion","Adhésion"], ["cotisation","Cotisation"], ["paid","Payés"], ["pending","En attente"], ["failed","Échoués"]].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFBFE" }}>
                {["Date", "Type", "Méthode", "Référence", "Montant", "Statut"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".5px", padding: "10px 20px", textAlign: "left", borderBottom: `1px solid ${G.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 36, color: G.muted }}>Aucun résultat</td></tr>
              ) : filtered.map((p, i) => {
                const isPaid = p.statut === "paid" || p.statut === "success";
                const isPending = p.statut === "pending";
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFBFE"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: G.muted }}>{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                    <td style={{ padding: "12px 20px" }}><TypeBadge type={p.type} /></td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: G.muted, textTransform: "capitalize" }}>{p.payment_method || "—"}</td>
                    <td style={{ padding: "12px 20px", fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>{(p.transaction_reference || "—").substring(0, 16)}{p.transaction_reference?.length > 16 ? "…" : ""}</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, fontWeight: 700, color: G.text }}>{fmt(p.montant)}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <Badge color={isPaid ? G.green : isPending ? G.gold : G.red} bg={isPaid ? G.greenLight : isPending ? G.goldLight : G.redLight}>
                        {isPaid ? "● Payé" : isPending ? "● En attente" : "● Échoué"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE CRÉER MEMBRE
// ══════════════════════════════════════════════════════════════════════════════
function CreerMembrePage({ membre }) {
  const [form, setForm] = useState({ nom: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [membresCreés, setMembresCreés] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const roleACreer = CREATION_MAP[membre?.role];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    apiFetch("/reseau/membres-crees").then(data => {
      if (data?.success) setMembresCreés(data.membres || []);
      setListLoading(false);
    });
  }, []);

  const handleCreer = async () => {
    setError(""); setSuccess(null);
    if (!form.nom || !form.email) { setError("Nom et email requis."); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/reseau/creer-membre", { method: "POST", body: JSON.stringify(form) });
      if (!data) { setError("Erreur réseau."); return; }
      if (!data.success) { setError(data.message || "Erreur création"); return; }
      setSuccess(data.credentials || data);
      setForm({ nom: "", email: "", phone: "" });
      apiFetch("/reseau/membres-crees").then(d => { if (d?.success) setMembresCreés(d.membres || []); });
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  };

  if (!roleACreer) return (
    <div style={{ textAlign: "center", padding: 48, color: G.muted, fontSize: 13 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
      Votre rôle ne permet pas de créer des membres.
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${G.border}`, background: `linear-gradient(135deg, ${G.blue}0D, transparent)` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>➕ Créer un {ROLES[roleACreer]?.label}</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Votre rôle : {ROLES[membre?.role]?.label}</div>
          </div>
          <div style={{ padding: 24 }}>
            <Alert type="error" msg={error} />
            {success && (
              <div style={{ background: G.greenLight, border: `1px solid ${G.green}44`, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: G.green, marginBottom: 10 }}>✅ Membre créé avec succès !</div>
                <div style={{ background: "#fff", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12, color: G.text }}>
                  <div>Email : <strong>{success.email}</strong></div>
                  <div style={{ marginTop: 4 }}>Mot de passe : <strong>{success.password}</strong></div>
                  {success.code_invitation && <div style={{ marginTop: 4 }}>Code : <strong style={{ color: G.purple }}>{success.code_invitation}</strong></div>}
                </div>
                <div style={{ fontSize: 11, color: G.muted, marginTop: 8 }}>⚠️ Communiquez ces identifiants au membre. Ils ne seront plus affichés.</div>
              </div>
            )}
            {[{ label: "Nom complet *", key: "nom", type: "text" }, { label: "Email *", key: "email", type: "email" }, { label: "Téléphone", key: "phone", type: "tel" }].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border .15s" }}
                  onFocus={e => e.target.style.borderColor = G.blue}
                  onBlur={e => e.target.style.borderColor = G.border} />
              </div>
            ))}
            <button onClick={handleCreer} disabled={loading}
              style={{ width: "100%", padding: "13px 20px", background: `linear-gradient(135deg, ${G.blue}, #1D4ED8)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Création…" : `Créer le ${ROLES[roleACreer]?.label}`}
            </button>
          </div>
        </div>
      </div>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>Membres créés</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{membresCreés.length} au total</div>
        </div>
        <div style={{ padding: 16, maxHeight: 400, overflowY: "auto" }}>
          {listLoading ? <Spinner /> : membresCreés.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: G.muted, fontSize: 13 }}>Aucun membre créé</div>
          ) : membresCreés.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, marginBottom: 6, background: "#FAFBFE" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: G.purpleLight, color: G.purple, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
                {m.nom?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{m.nom}</div>
                <div style={{ fontSize: 11, color: G.muted }}>{m.email}</div>
              </div>
              <ActiveBadge statut={m.statut} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE SIMULATEUR
// ══════════════════════════════════════════════════════════════════════════════
function SimulatePage({ currentRole, onRoleChange }) {
  const [adhesion, setAdhesion] = useState(15000);
  const [cotisation, setCotisation] = useState(5000);
  const [members, setMembers] = useState(10);
  const [ca, setCa] = useState(500000);

  const ga = members * adhesion * 0.10;
  const gc = members * cotisation * 0.05;
  const gb = ca * 0.015;
  const total = ga + gc + gb;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {Object.entries(ROLES).map(([k, r]) => (
          <button key={k} onClick={() => onRoleChange(k)} style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${currentRole === k ? r.color : G.border}`, background: currentRole === k ? r.color : "#fff", color: currentRole === k ? "#fff" : G.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
            {r.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 20 }}>⚙️ Paramètres de simulation</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "Adhésion (FCFA)", val: adhesion, set: setAdhesion },
              { label: "Cotisation mensuelle", val: cotisation, set: setCotisation },
              { label: "Nombre de membres", val: members, set: setMembers },
              { label: "CA mensuel réseau", val: ca, set: setCa },
            ].map((f, i) => (
              <div key={i}>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input type="number" value={f.val} onChange={e => f.set(parseFloat(e.target.value) || 0)}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 6 }}>📊 Gains estimés — {ROLES[currentRole]?.label}</div>
          <div style={{ fontSize: 12, color: G.muted, marginBottom: 20 }}>Projection mensuelle</div>
          {[
            { label: `Adhésion × ${members} membres × 10%`, val: ga, color: G.green },
            { label: `Cotisation × ${members} membres × 5%`, val: gc, color: G.blue },
            { label: `Bonus réseau (CA ${fmtShort(ca)} × 1,5%)`, val: gb, color: G.gold },
          ].map((item, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${G.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: G.muted }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{fmtShort(item.val)}</span>
              </div>
              <div style={{ marginTop: 6, height: 4, background: G.border, borderRadius: 4 }}>
                <div style={{ height: 4, background: item.color, borderRadius: 4, width: total ? `${Math.round(item.val / total * 100)}%` : "0%", transition: "width .3s" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, background: G.purpleLight, borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: G.purple }}>Total mensuel estimé</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: G.purple }}>{fmtShort(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",    label: "Tableau de bord",   icon: "◉" },
  { id: "network",      label: "Mon réseau",         icon: "◈" },
  { id: "creer",        label: "Créer un membre",    icon: "＋" },
  { id: "commissions",  label: "Commissions",        icon: "◎" },
  { id: "bonus",        label: "Bonus mensuel",      icon: "◆" },
  { id: "paiement",     label: "Payer",              icon: "◑" },
  { id: "invite",       label: "Lien d'invitation",  icon: "◇" },
  { id: "history",      label: "Historique",         icon: "○" },
  { id: "simulate",     label: "Simuler rôle",       icon: "◐" },
];

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [membre, setMembre] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [simRole, setSimRole] = useState(null);
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cnepeci_token");
    const membreStored = localStorage.getItem("cnepeci_membre");
    if (!token || !membreStored) { setChecking(false); return; }
    apiFetch("/profile").then(data => {
      if (data?.success) { try { setMembre(JSON.parse(membreStored)); } catch {} }
      else { localStorage.removeItem("cnepeci_token"); localStorage.removeItem("cnepeci_membre"); }
    }).catch(() => {
      localStorage.removeItem("cnepeci_token"); localStorage.removeItem("cnepeci_membre");
    }).finally(() => setChecking(false));
  }, []);

  const role = simRole || membre?.role || "SOUSCRIPTEUR";
  const roleInfo = ROLES[role] || ROLES.SOUSCRIPTEUR;
  const pageTitle = NAV_ITEMS.find(n => n.id === page)?.label || "Tableau de bord";

  const handleLogout = () => {
    localStorage.removeItem("cnepeci_token");
    localStorage.removeItem("cnepeci_membre");
    setMembre(null);
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <Spinner />
    </div>
  );

  if (!membre) return <AuthPage onAuth={m => setMembre(m)} />;

  const navVisible = NAV_ITEMS.filter(item => item.id !== "creer" || !!CREATION_MAP[membre.role]);

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return <DashboardPage membre={membre} />;
      case "network":     return <NetworkPage />;
      case "creer":       return <CreerMembrePage membre={membre} />;
      case "commissions": return <CommissionsPage />;
      case "bonus":       return <BonusPage />;
      case "paiement":    return <PaiementPage membre={membre} />;
      case "invite":      return <InvitePage membre={membre} />;
      case "history":     return <HistoryPage />;
      case "simulate":    return <SimulatePage currentRole={role} onRoleChange={r => setSimRole(r)} />;
      default:            return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: G.bg }}>
      <style>{`
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 230, background: G.sidebar, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${G.sidebarBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${G.purple}, #5B21B6)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⛪</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-.2px" }}>CNEPECI</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1, letterSpacing: ".3px" }}>BUSINESS NETWORK</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ margin: "12px 16px 4px", padding: "8px 12px", background: roleInfo.color + "22", borderRadius: 10, border: `1px solid ${roleInfo.color}44` }}>
          <div style={{ fontSize: 10, color: roleInfo.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Rôle actif</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 2 }}>{roleInfo.label}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {navVisible.map(item => {
            const isActive = page === item.id;
            return (
              <div key={item.id} onClick={() => { setPage(item.id); if (item.id !== "simulate") setSimRole(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", cursor: "pointer", fontSize: 13, color: isActive ? "#fff" : "rgba(255,255,255,.5)", background: isActive ? `${G.purple}22` : "transparent", borderLeft: `3px solid ${isActive ? G.purple : "transparent"}`, transition: "all .15s", userSelect: "none" }}>
                <span style={{ width: 16, textAlign: "center", fontSize: 13, color: isActive ? G.purple : "rgba(255,255,255,.3)" }}>{item.icon}</span>
                <span style={{ fontWeight: isActive ? 700 : 400 }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div onClick={handleLogout} style={{ padding: "14px 20px", borderTop: `1px solid ${G.sidebarBorder}`, fontSize: 12, color: "rgba(255,255,255,.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "color .15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#FCA5A5"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.3)"}>
          <span>⎋</span> Déconnexion
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 230, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: G.text }}>{pageTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {simRole && (
              <div style={{ background: G.goldLight, color: G.gold, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
                👁 Simulation : {ROLES[simRole]?.label}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{membre.nom}</div>
                <div style={{ fontSize: 10, color: G.muted }}>{ROLES[membre.role]?.label}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${roleInfo.color}, ${roleInfo.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>
                {roleInfo.abbr}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: "28px 28px", flex: 1, animation: "fadeIn .2s ease" }} key={page}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
