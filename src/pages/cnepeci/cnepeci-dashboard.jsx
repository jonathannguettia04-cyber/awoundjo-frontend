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
    // FIX : toujours parser le JSON même en erreur (400, 409, 500…)
    //       pour récupérer le message d'erreur backend
    const json = await res.json().catch(() => null);
    if (res.status === 401) {
      localStorage.removeItem("cnepeci_token");
      localStorage.removeItem("cnepeci_membre");
      window.location.reload();
      return null;
    }
    // FIX : si le backend retourne un code HTTP erreur mais un JSON valide,
    //       on retourne ce JSON (avec success:false et message) au lieu de null
    if (!res.ok && json) return { success: false, ...json };
    if (!res.ok) return { success: false, message: `Erreur serveur (${res.status})` };
    return json;
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

// ─── HELPER : appels vers /api/commissions (endpoints retrait) ────────────────
// Distinct de apiFetch (qui préfixe /api/cnepeci).
// Le backend résout l'identité via le rôle dans le JWT "cnepeci_token".
const COMM_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/commissions";
async function commFetch(path, options = {}) {
  try {
    const token = localStorage.getItem("cnepeci_token");
    const res = await fetch(`${COMM_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const json = await res.json().catch(() => null);
    if (res.status === 401) { window.location.reload(); return null; }
    if (!res.ok && json) return { success: false, ...json };
    if (!res.ok) return { success: false, message: `Erreur serveur (${res.status})` };
    return json;
  } catch (e) {
    console.error("[commFetch]", path, e.message);
    return null;
  }
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


const fmt = n => (parseFloat(n) || 0).toLocaleString("fr-FR") + " F";
const fmtShort = n => {
  const v = parseFloat(n) || 0;
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M F";
  if (v >= 1000) return Math.round(v / 1000) + "k F";
  return v + " F";
};

const G = {
  sidebar: "#0F0E17", sidebarBorder: "rgba(255,255,255,0.06)",
  bg: "#F0F2F8", surface: "#FFFFFF", border: "#E4E8F0",
  text: "#111827", muted: "#6B7280",
  purple: "#7C3AED", purpleLight: "#EDE9FE",
  green: "#059669", greenLight: "#D1FAE5",
  blue: "#2563EB", blueLight: "#DBEAFE",
  gold: "#D97706", goldLight: "#FEF3C7",
  red: "#DC2626", redLight: "#FEE2E2",
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
    error:   { bg: G.redLight,    text: G.red,    border: "#FECACA" },
    success: { bg: G.greenLight,  text: G.green,  border: "#6EE7B7" },
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
  const v = (statut || "").toLowerCase();
  const active = v === "actif" || v === "active";
  const suspended = v === "suspendu" || v === "suspended";
  return (
    <Badge color={active ? G.green : suspended ? G.red : G.muted} bg={active ? G.greenLight : suspended ? G.redLight : "#F3F4F6"}>
      {active ? "● Actif" : suspended ? "● Suspendu" : "● Inactif"}
    </Badge>
  );
}

function TypeBadge({ type }) {
  const map = {
    adhesion:   { color: G.green, bg: G.greenLight, label: "Adhésion" },
    cotisation: { color: G.blue,  bg: G.blueLight,  label: "Cotisation" },
    bonus:      { color: G.gold,  bg: G.goldLight,  label: "Bonus" },
  };
  const c = map[type] || { color: G.muted, bg: "#F3F4F6", label: type };
  return <Badge color={c.color} bg={c.bg}>{c.label}</Badge>;
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden", transition: "transform .15s, box-shadow .15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".7px" }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent + "1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: G.text, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ values, labels }) {
  const data = values?.length ? values : [];
  const months = labels?.length ? labels : ["Nov", "Déc", "Jan", "Fév", "Mar", "Avr"];
  const [hovered, setHovered] = useState(null);

  if (!data.length) return (
    <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: G.muted, fontSize: 13, background: "#FAFBFE", borderRadius: 10 }}>
      Aucune donnée disponible
    </div>
  );

  const max = Math.max(...data) || 1;
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
        {data.map((v, i) => {
          const isLast = i === data.length - 1;
          const isHov = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end", cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <span style={{ fontSize: 10, fontWeight: 700, color: isHov ? G.purple : "#aaa", opacity: isHov || isLast ? 1 : 0.7 }}>
                {v >= 1000 ? Math.round(v / 1000) + "k" : v || "0"}
              </span>
              <div style={{ width: "100%", height: Math.max(4, Math.round(v / max * 90)), background: isLast ? `linear-gradient(180deg,${G.purple},#5B21B6)` : isHov ? `linear-gradient(180deg,#A78BFA,${G.purple})` : "#DDD6FE", borderRadius: "6px 6px 0 0", transition: "all .2s" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", borderTop: `1px solid ${G.border}`, paddingTop: 6, marginTop: 2 }}>
        {months.map((m, i) => (
          <span key={i} style={{ flex: 1, fontSize: 10, color: hovered === i ? G.purple : "#aaa", textAlign: "center", fontWeight: hovered === i ? 700 : 400 }}>{m}</span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments, label }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return <div style={{ textAlign: "center", padding: 24, color: G.muted, fontSize: 12 }}>Aucune donnée</div>;
  let offset = 0;
  const r = 40, cx = 50, cy = 50, stroke = 14, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset * circ} style={{ transition: "all .3s" }} />;
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

function TreeNode({ node }) {
  const [open, setOpen] = useState(false);
  const role = ROLES[node.role] || ROLES.SOUSCRIPTEUR;
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
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
  // FIX 1 : code_invitation ajouté au state — nécessaire pour les inscriptions
  // non-Bureau Centrale (tous les autres rôles l'exigent côté backend)
  const [form, setForm] = useState({ nom: "", email: "", phone: "", password: "", code_invitation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  // FIX 2 : isFirstAccount — détecte si c'est la création du Bureau Centrale
  // (pas de code d'invitation requis dans ce cas)
  const [isFirstAccount, setIsFirstAccount] = useState(null); // null = pas encore vérifié
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Vérifie au montage si la table est vide (premier compte = Bureau Centrale)
  useEffect(() => {
    if (mode !== "register") return;
    apiFetch("/check-first").then(data => {
      // Si l'endpoint n'existe pas encore, on assume que le champ est optionnel
      if (data?.success) setIsFirstAccount(!!data.is_first);
      else setIsFirstAccount(false); // par défaut : afficher le champ code
    }).catch(() => setIsFirstAccount(false));
  }, [mode]);

  const handleSubmit = async () => {
    setError(""); setSuccessMsg("");
    if (!form.email || !form.password) { setError("Email et mot de passe requis."); return; }
    if (mode === "register" && !form.nom) { setError("Nom requis."); return; }
    setLoading(true);
    try {
      // FIX 3 : le body inclut code_invitation — sans ça le backend renvoie
      // systématiquement 400 "Un code d'invitation est requis pour s'inscrire"
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : {
            nom:             form.nom,
            email:           form.email,
            phone:           form.phone,
            password:        form.password,
            // On inclut code_invitation seulement si renseigné (vide = ignoré)
            ...(form.code_invitation ? { code_invitation: form.code_invitation } : {}),
          };
      const data = await apiFetch(mode === "login" ? "/login" : "/register", { method: "POST", body: JSON.stringify(body) });
      if (!data) { setError("Erreur réseau. Réessayez."); return; }
      // FIX 4 : affiche le vrai message d'erreur du backend (plus "Erreur inconnue")
      if (!data.success) {
        setError(data.message || data.error || `Erreur serveur (${data.status || "inconnu"})`);
        return;
      }
      if (mode === "login") {
        const token = data.token || data.data?.token;
        const membre = data.membre || data.data?.membre;
        localStorage.setItem("cnepeci_token", token);
        localStorage.setItem("cnepeci_membre", JSON.stringify(membre));
        onAuth(membre);
      } else {
        // Connexion automatique après inscription (Bureau Centrale)
        const loginData = await apiFetch("/login", { method: "POST", body: JSON.stringify({ email: form.email, password: form.password }) });
        if (loginData?.success) {
          const token = loginData.token || loginData.data?.token;
          const membre = loginData.membre || loginData.data?.membre;
          localStorage.setItem("cnepeci_token", token);
          localStorage.setItem("cnepeci_membre", JSON.stringify(membre));
          onAuth(membre);
        } else {
          setSuccessMsg("Compte créé avec succès ! Connectez-vous.");
          setMode("login");
          setForm(f => ({ ...f, nom: "", phone: "", password: "", code_invitation: "" }));
        }
      }
    } catch (e) { setError("Erreur réseau. Vérifiez votre connexion."); console.error(e); }
    finally { setLoading(false); }
  };

  // Champs dynamiques selon le mode et si c'est le premier compte
  const registerFields = [
    { label: "Nom complet",       key: "nom",              type: "text" },
    { label: "Email",             key: "email",            type: "email" },
    { label: "Téléphone",         key: "phone",            type: "tel" },
    // FIX 5 : champ code_invitation affiché uniquement si ce n'est pas le premier compte
    ...(!isFirstAccount ? [{ label: "Code d'invitation", key: "code_invitation", type: "text", placeholder: "Ex: CG1A2B3C4D" }] : []),
    { label: "Mot de passe",      key: "password",         type: showPwd ? "text" : "password" },
  ];
  const loginFields = [
    { label: "Email",         key: "email",    type: "email" },
    { label: "Mot de passe",  key: "password", type: showPwd ? "text" : "password" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg,#0F0E17 0%,#1E1B4B 50%,#0F0E17 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", position: "relative" }}>
      <div style={{ position: "absolute", top: "15%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle,${G.purple}22,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,#05966922,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "44px", width: 420, maxWidth: "90vw" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(135deg,${G.purple},#5B21B6)`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, boxShadow: `0 8px 32px ${G.purple}44` }}>⛪</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>CNEPECI Business</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
            {mode === "login" ? "Connexion à votre espace" : isFirstAccount === null ? "Chargement…" : isFirstAccount ? "Créer le Bureau Centrale" : "Rejoindre le réseau"}
          </div>
        </div>
        {error && <div style={{ background: "rgba(220,38,38,.15)", color: "#FCA5A5", border: "1px solid rgba(220,38,38,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
        {successMsg && <div style={{ background: "rgba(5,150,105,.15)", color: "#6EE7B7", border: "1px solid rgba(5,150,105,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>✅ {successMsg}</div>}
        {(mode === "register" ? registerFields : loginFields).map(f => (
          <div key={f.key} style={{ marginBottom: 14, position: "relative" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>{f.label}</label>
          <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder={f.placeholder || ""}
              style={{ width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontSize: 13, color: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = G.purple} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
            {f.key === "password" && <span onClick={() => setShowPwd(s => !s)} style={{ position: "absolute", right: 12, bottom: 11, fontSize: 14, cursor: "pointer", color: "rgba(255,255,255,.3)" }}>{showPwd ? "🙈" : "👁"}</span>}
          </div>
        ))}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "13px 20px", background: `linear-gradient(135deg,${G.purple},#5B21B6)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Chargement…" : mode === "login" ? "Se connecter →" : "Créer le Bureau Centrale →"}
        </button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,.4)" }}>
          {mode === "login"
            ? <><span>Pas encore membre ? </span><span onClick={() => { setMode("register"); setError(""); }} style={{ color: "#A78BFA", cursor: "pointer", fontWeight: 600 }}>S'inscrire</span></>
            : <><span>Déjà inscrit ? </span><span onClick={() => { setMode("login"); setError(""); }} style={{ color: "#A78BFA", cursor: "pointer", fontWeight: 600 }}>Se connecter</span></>}
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
  const [chartValues, setChartValues] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = membre?.role;

  useEffect(() => {
    const moisNoms = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    Promise.all([apiFetch("/reseau/stats"), apiFetch("/profile"), apiFetch("/commissions?page=1&limit=100")])
      .then(([statsRes, profilRes, commRes]) => {
        if (statsRes?.success) setStats(extractData(statsRes) || statsRes);
        if (profilRes?.success) setProfil(profilRes.profil || extractData(profilRes));
        if (commRes?.success) {
          const rows = commRes.commissions || [];
          const now = new Date();
          const buckets = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return { label: moisNoms[d.getMonth()], key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, total: 0 };
          });
          rows.forEach(c => { const b = buckets.find(x => x.key === c.created_at?.slice(0,7)); if (b) b.total += parseFloat(c.montant)||0; });
          setChartValues(buckets.map(b => b.total));
          setChartLabels(buckets.map(b => b.label));
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;

  const roleInfo = ROLES[role] || ROLES.SOUSCRIPTEUR;
  const showGains = role !== "SOUSCRIPTEUR" && role !== "BUREAU_CENTRALE";
  const kpis = stats ? [
    { label: "Membres directs",   value: stats.membres_directs ?? "0",      sub: "dans mon réseau",   accent: G.green,  icon: "👥" },
    { label: "CA réseau (mois)",  value: fmtShort(stats.ca_reseau_mois),   sub: "paiements validés", accent: G.blue,   icon: "💳" },
    { label: "Commissions",       value: fmtShort(stats.commissions_total), sub: "total cumulé",      accent: G.purple, icon: "🏆" },
    { label: "Bonus ce mois",     value: fmtShort(stats.bonus_mois),       sub: "1,5% du CA réseau", accent: G.gold,   icon: "🎁" },
  ] : [];

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${G.purple} 0%,#5B21B6 100%)`, borderRadius: 20, padding: "24px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 6 }}>Bienvenue,</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{membre?.nom || "Membre"}</div>
          <div style={{ marginTop: 10 }}><span style={{ background: "rgba(255,255,255,.18)", color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600 }}>{roleInfo.label}</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>Statut du compte</div>
          <div style={{ background: "rgba(5,150,105,.3)", color: "#6EE7B7", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, display: "inline-block" }}>● Actif</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {kpis.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
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
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>Commissions (6 mois)</div>
            <span style={{ background: G.purpleLight, color: G.purple, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>📈 Tendance</span>
          </div>
          <BarChart values={chartValues} labels={chartLabels} />
        </div>
      </div>

      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 16 }}>Répartition des gains</div>
        {!showGains ? (
          <div style={{ textAlign: "center", padding: 24, color: G.muted, fontSize: 13, background: "#FAFBFE", borderRadius: 10 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💡</div>
            {role === "BUREAU_CENTRALE" ? "Le Bureau Centrale perçoit uniquement le bonus réseau global." : "Aucune commission directe pour ce rôle."}
          </div>
        ) : (
          <DonutChart label={fmtShort(stats?.commissions_total || 0)} segments={[
            { label: "Adhésion (10%)",     value: stats?.commissions_adhesion || 0,   color: G.green },
            { label: "Cotisation (5%)",    value: stats?.commissions_cotisation || 0, color: G.blue },
            { label: "Bonus réseau (1,5%)",value: stats?.bonus_mois || 0,            color: G.gold },
          ]} />
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Adhésion (10%)"  value={fmtShort(stats.adhesion)}   sub="commission directe" accent={G.green}  icon="🤝" />
        <StatCard label="Cotisation (5%)" value={fmtShort(stats.cotisation)} sub="mensuelle"          accent={G.blue}   icon="💳" />
        <StatCard label="Bonus réseau"    value={fmtShort(stats.bonus)}      sub="1,5% CA mensuel"   accent={G.gold}   icon="⭐" />
      </div>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>Détail des commissions</div>
        </div>
        {loading ? <Spinner /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#FAFBFE" }}>
                {["Date","Type","Source","Rôle","Montant"].map(h => <th key={h} style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".5px", padding: "10px 20px", textAlign: "left", borderBottom: `1px solid ${G.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {commissions.length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 36, color: G.muted, fontSize: 13 }}>Aucune commission pour le moment</td></tr>
                  : commissions.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }} onMouseEnter={e => e.currentTarget.style.background = "#FAFBFE"} onMouseLeave={e => e.currentTarget.style.background = ""}>
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
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${G.border}`, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: G.muted, fontFamily: "inherit" }}>← Préc.</button>
            <span style={{ padding: "7px 16px", fontSize: 13, color: G.muted }}>Page {page}</span>
            <button onClick={() => setPage(p => p+1)} disabled={page*20>=total} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${G.border}`, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: G.muted, fontFamily: "inherit" }}>Suiv. →</button>
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
  const moisNoms = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

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
        {historique.length === 0
          ? <div style={{ textAlign: "center", padding: 48, color: G.muted, fontSize: 13 }}><div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>Aucun historique disponible</div>
          : <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#FAFBFE" }}>
                {["Période","CA réseau","Taux","Bonus versé"].map(h => <th key={h} style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".5px", padding: "10px 20px", textAlign: "left", borderBottom: `1px solid ${G.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {historique.map((b, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }} onMouseEnter={e => e.currentTarget.style.background="#FAFBFE"} onMouseLeave={e => e.currentTarget.style.background=""}>
                    <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, color: G.text }}>{moisNoms[(b.mois||1)-1]} {b.annee}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: G.muted }}>{fmt(b.chiffre_affaire)}</td>
                    <td style={{ padding: "12px 20px" }}><Badge color={G.gold} bg={G.goldLight}>1,5%</Badge></td>
                    <td style={{ padding: "12px 20px", fontSize: 14, fontWeight: 700, color: G.gold }}>{fmt(b.bonus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PAIEMENT — JEKO uniquement
// ══════════════════════════════════════════════════════════════════════════════
function PaiementPage() {
  const [type, setType]           = useState("adhesion");
  const [montant, setMontant]     = useState(15000);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [jekoMethod, setJekoMethod] = useState("orange");

  const handlePayer = async () => {
    setError(""); setSuccess("");
    if (!montant || montant < 100) { setError("Montant minimum : 100 FCFA"); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/paiement/jeko/init", {
        method: "POST",
        body: JSON.stringify({
          montant,
          type,
          jeko_method:  jekoMethod,
          success_url: `${window.location.origin}/cnepeci/paiement/success`,
          failure_url: `${window.location.origin}/cnepeci/paiement/echec`,
        }),
      });
      if (!data) { setError("Erreur réseau."); return; }
      if (!data.success) { setError(data.message || "Erreur paiement"); return; }
      const payUrl = data.data?.redirect_url || data.redirect_url;
      if (payUrl) {
        setSuccess("Redirection vers JEKO…");
        setTimeout(() => { window.location.href = payUrl; }, 1000);
      } else {
        setError("URL de paiement non reçue. Réessayez.");
      }
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  };

  const commEstimee = type === "adhesion" ? Math.round(montant * 0.10) : Math.round(montant * 0.05);

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${G.border}`, background: `linear-gradient(135deg,${G.green}0D,transparent)` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.text }}>💳 Effectuer un paiement</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Paiement sécurisé via JEKO</div>
        </div>
        <div style={{ padding: 28 }}>
          <Alert type="error"   msg={error}   />
          <Alert type="success" msg={success} />

          {/* Type */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Type de paiement</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{val:"adhesion",label:"🤝 Adhésion",sub:"Frais d'entrée"},{val:"cotisation",label:"📆 Cotisation",sub:"Mensuelle"}].map(t => (
                <div key={t.val} onClick={() => setType(t.val)}
                  style={{ flex: 1, border: `2px solid ${type===t.val?G.green:G.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", background: type===t.val?G.greenLight:"#FAFBFE" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: type===t.val?G.green:G.text }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 3 }}>{t.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Montant */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>Montant (FCFA)</label>
            <input type="number" value={montant} onChange={e => setMontant(parseFloat(e.target.value)||0)}
              style={{ width: "100%", padding: "12px 16px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 16, fontWeight: 700, color: G.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#FAFBFE" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {[5000,10000,15000,25000].map(v => (
                <button key={v} onClick={() => setMontant(v)}
                  style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${montant===v?G.purple:G.border}`, background: montant===v?G.purpleLight:"#fff", color: montant===v?G.purple:G.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {v/1000}k
                </button>
              ))}
            </div>
          </div>

          {/* Badge JEKO */}
          <div style={{ background: G.greenLight, border: `1px solid ${G.green}33`, borderRadius: 12, padding: "12px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>💳</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: G.green }}>Paiement via JEKO</div>
              <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>MTN · Orange · Moov · Wave · Carte bancaire</div>
            </div>
          </div>

          {/* Récap */}
          <div style={{ background: "#FAFBFE", border: `1px solid ${G.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
            {[
              { label: "Type",               value: <TypeBadge type={type} /> },
              { label: "Montant",            value: <span style={{ fontWeight:700, fontSize:14 }}>{fmt(montant)}</span> },
              { label: "Commission parrain", value: <span style={{ color:G.green, fontWeight:700 }}>{fmt(commEstimee)} ({type==="adhesion"?"10%":"5%"})</span> },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i<arr.length-1?`1px solid ${G.border}`:"none" }}>
                <span style={{ fontSize: 13, color: G.muted }}>{row.label}</span>{row.value}
              </div>
            ))}
          </div>

          {/* Sélecteur réseau JEKO */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>Réseau de paiement</label>
            <select value={jekoMethod} onChange={e => setJekoMethod(e.target.value)} disabled={loading}
              style={{ width: "100%", padding: "12px 16px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#FAFBFE", color: G.text, outline: "none", boxSizing: "border-box" }}>
              <option value="orange">🟠 Orange Money</option>
              <option value="wave">🔵 Wave</option>
              <option value="mtn">🟡 MTN Mobile Money</option>
              <option value="moov">🟢 Moov Money</option>
              <option value="djamo">💜 Djamo / Carte bancaire</option>
            </select>
          </div>

          <button onClick={handlePayer} disabled={loading||!!success}
            style={{ width: "100%", padding: "14px 20px", background: `linear-gradient(135deg,${G.green},#047857)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading||success?"not-allowed":"pointer", fontFamily: "inherit", opacity: loading||success?0.7:1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                Redirection vers JEKO…
              </>
            ) : `💳 Payer ${fmt(montant)} avec JEKO →`}
          </button>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: G.muted, textAlign: "center" }}>
            Paiement 100% sécurisé via JEKO
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE INVITATION
// ══════════════════════════════════════════════════════════════════════════════
function InvitePage({ membre }) {
  const [copied, setCopied] = useState(null);
  const [profil, setProfil] = useState(null);
  const [canRecruit, setCanRecruit] = useState(false);

  // Chargement frais depuis l'API pour avoir code_invitation à jour
  useEffect(() => {
    apiFetch("/profile").then(data => {
      if (data?.success) setProfil(data.profil || data.data?.profil || null);
    });
    apiFetch("/reseau/roles-creables").then(d => {
      const roles = d?.roles || d?.data?.roles || [];
      setCanRecruit(roles.length > 0);
    }).catch(() => {});
  }, []);

  const code = profil?.code_invitation || membre?.code_invitation || null;
  const frontUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const url = code ? `${frontUrl}/join?ref=${code}` : null;

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => { const el = document.createElement("textarea"); el.value=text; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); });
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  const shareWhatsApp = () => {
    if (!url) return;
    const msg = encodeURIComponent(`Rejoignez mon réseau CNEPECI ! 🌐\n\nLien : ${url}\nCode : ${code}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ background: `linear-gradient(135deg,${G.purple} 0%,#5B21B6 100%)`, borderRadius: 20, padding: "28px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Lien d'invitation personnel</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Partagez votre lien pour recruter et générer des commissions automatiques</div>
      </div>

      {!canRecruit ? (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 8 }}>Recrutement non disponible</div>
          <div style={{ fontSize: 13, color: G.muted }}>{membre?.role === "SOUSCRIPTEUR" ? "Les souscripteurs finaux ne peuvent pas recruter directement." : "Votre rôle actuel ne permet pas le recrutement direct."}</div>
        </div>
      ) : !code ? (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <Spinner /><div style={{ fontSize: 13, color: G.muted, marginTop: 8 }}>Chargement de votre code…</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 14 }}>Votre code d'invitation</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, background: G.purpleLight, borderRadius: 12, padding: "16px 20px", fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: G.purple, textAlign: "center", letterSpacing: 4 }}>{code}</div>
              <button onClick={() => copy(code,"code")} style={{ padding: "16px 20px", background: copied==="code"?G.green:G.purple, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .2s", whiteSpace: "nowrap" }}>
                {copied==="code"?"✅ Copié !":"Copier"}
              </button>
            </div>
          </div>

          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 14 }}>Lien d'inscription direct</div>
            <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 14 }}>
              <div style={{ flex: 1, background: "#FAFBFE", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 12, color: G.purple, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</div>
              <button onClick={() => copy(url,"url")} style={{ padding: "11px 18px", background: copied==="url"?G.green:G.purple, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .2s" }}>
                {copied==="url"?"✅":"Copier"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={shareWhatsApp} style={{ flex: 1, padding: "11px 16px", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                📱 Partager WhatsApp
              </button>
              <button onClick={() => copy(`Code: ${code}\nLien: ${url}`,"all")} style={{ flex: 1, padding: "11px 16px", background: "#FAFBFE", color: G.text, border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {copied==="all"?"✅ Copié !":"📋 Tout copier"}
              </button>
            </div>
          </div>

          <div style={{ background: G.greenLight, border: `1px solid ${G.green}33`, borderRadius: 16, padding: "18px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G.green, marginBottom: 10 }}>💡 Comment ça marche ?</div>
            {["Partagez votre lien ou code à vos contacts","Chaque inscription via votre lien vous crédite automatiquement","Vous percevez 10% sur chaque adhésion de votre filleul","Vous percevez 5% sur ses cotisations mensuelles"].map((s,i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 13, color: "#065F46" }}><span style={{ color: G.green, fontWeight: 700 }}>→</span> {s}</div>
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

  const filtered = filter === "all" ? paiements : paiements.filter(p => p.type===filter||p.statut===filter);

  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${G.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>📋 Historique de mes paiements</div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: "7px 12px", border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12, fontFamily: "inherit", background: "#fff", color: G.text, outline: "none" }}>
          {[["all","Tous"],["adhesion","Adhésion"],["cotisation","Cotisation"],["paid","Payés"],["pending","En attente"],["failed","Échoués"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#FAFBFE" }}>
              {["Date","Type","Méthode","Référence","Montant","Statut"].map(h => <th key={h} style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".5px", padding: "10px 20px", textAlign: "left", borderBottom: `1px solid ${G.border}` }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 36, color: G.muted }}>Aucun résultat</td></tr>
                : filtered.map((p, i) => {
                    const isPaid = p.statut==="paid"||p.statut==="success";
                    const isPending = p.statut==="pending";
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }} onMouseEnter={e=>e.currentTarget.style.background="#FAFBFE"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: G.muted }}>{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                        <td style={{ padding: "12px 20px" }}><TypeBadge type={p.type}/></td>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: G.muted, textTransform: "capitalize" }}>{p.payment_method||"—"}</td>
                        <td style={{ padding: "12px 20px", fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>{(p.transaction_reference||"—").substring(0,16)}{p.transaction_reference?.length>16?"…":""}</td>
                        <td style={{ padding: "12px 20px", fontSize: 14, fontWeight: 700, color: G.text }}>{fmt(p.montant)}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <Badge color={isPaid?G.green:isPending?G.gold:G.red} bg={isPaid?G.greenLight:isPending?G.goldLight:G.redLight}>
                            {isPaid?"● Payé":isPending?"● En attente":"● Échoué"}
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
  const [form, setForm] = useState({ nom: "", email: "", phone: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [membresCreés, setMembresCreés] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  // Rôles créables chargés dynamiquement depuis le backend
  const [rolesCreables, setRolesCreables] = useState(null); // null = chargement en cours
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    // Charger en parallèle les rôles créables et la liste des membres déjà créés
    Promise.all([
      apiFetch("/reseau/roles-creables"),
      apiFetch("/reseau/membres-crees"),
    ]).then(([rolesRes, membresRes]) => {
      const roles = rolesRes?.roles || rolesRes?.data?.roles || [];
      setRolesCreables(roles);
      // Présélectionner le premier rôle disponible
      if (roles.length > 0) setForm(f => ({ ...f, role: roles[0] }));
      if (membresRes?.success) setMembresCreés(membresRes.membres || []);
      setListLoading(false);
    });
  }, []);

  const handleCreer = async () => {
    setError(""); setSuccess(null);
    if (!form.nom || !form.email) { setError("Nom et email requis."); return; }
    if (!form.role) { setError("Veuillez sélectionner un rôle."); return; }
    setLoading(true);
    try {
      const body = { nom: form.nom, email: form.email, phone: form.phone, role_a_creer: form.role };
      const data = await apiFetch("/reseau/creer-membre", { method: "POST", body: JSON.stringify(body) });
      if (!data) { setError("Erreur réseau."); return; }
      if (!data.success) { setError(data.message || "Erreur création"); return; }
      setSuccess(data.credentials || data);
      setForm(f => ({ nom: "", email: "", phone: "", role: f.role }));
      apiFetch("/reseau/membres-crees").then(d => { if (d?.success) setMembresCreés(d.membres || []); });
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  };

  // Tant que les rôles ne sont pas chargés, afficher un spinner
  if (rolesCreables === null) return <Spinner />;

  // Aucun rôle créable pour ce compte
  if (rolesCreables.length === 0) return (
    <div style={{ textAlign: "center", padding: 48, color: G.muted, fontSize: 13 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>Votre rôle ne permet pas de créer des membres.
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${G.border}`, background: `linear-gradient(135deg,${G.blue}0D,transparent)` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>➕ Créer un membre</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Votre rôle : {ROLES[membre?.role]?.label}</div>
          </div>
          <div style={{ padding: 24 }}>
            <Alert type="error" msg={error} />
            {success && (() => {
              const fullText = `Email : ${success.email}\nMot de passe : ${success.mot_de_passe}\nLien : ${success.lien_connexion||""}`;
              const waMsg = encodeURIComponent(`🏛️ Vos identifiants CNEPECI Business\n\n📧 Email : ${success.email}\n🔑 Mot de passe : ${success.mot_de_passe}\n🔗 Connexion : ${success.lien_connexion||""}\n\nBienvenue dans le réseau !`);
              return (
                <div style={{ background: G.greenLight, border: `1px solid ${G.green}44`, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G.green, marginBottom: 10 }}>✅ Membre créé avec succès !</div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12, color: G.text, lineHeight: 1.8 }}>
                    <div>📧 Email : <strong>{success.email}</strong></div>
                    <div>🔑 Mot de passe : <strong style={{ color: G.purple }}>{success.mot_de_passe}</strong></div>
                    {success.lien_connexion && <div style={{ wordBreak: "break-all" }}>🔗 Lien : <strong style={{ color: G.blue }}>{success.lien_connexion}</strong></div>}
                    {success.role && <div>👤 Rôle : <strong>{ROLES[success.role]?.label||success.role}</strong></div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => { navigator.clipboard?.writeText(fullText).catch(() => { const el=document.createElement("textarea"); el.value=fullText; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }); }}
                      style={{ flex: 1, padding: "9px 14px", background: G.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      📋 Copier tout
                    </button>
                    <button onClick={() => window.open(`https://wa.me/?text=${waMsg}`,"_blank")}
                      style={{ flex: 1, padding: "9px 14px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      📱 Envoyer WhatsApp
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 8 }}>⚠️ Communiquez ces identifiants au membre. Ils ne seront plus affichés.</div>
                </div>
              );
            })()}

            {/* Sélecteur de rôle — affiché seulement si plusieurs rôles disponibles */}
            {rolesCreables.length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>Rôle à créer *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {rolesCreables.map(r => {
                    const ri = ROLES[r] || { label: r, color: G.muted };
                    const isSelected = form.role === r;
                    return (
                      <button key={r} onClick={() => set("role", r)}
                        style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${isSelected ? ri.color : G.border}`, background: isSelected ? ri.color : "#fff", color: isSelected ? "#fff" : G.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                        {ri.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {[{label:"Nom complet *",key:"nom",type:"text"},{label:"Email *",key:"email",type:"email"},{label:"Téléphone",key:"phone",type:"tel"}].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => set(f.key,e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  onFocus={e=>e.target.style.borderColor=G.blue} onBlur={e=>e.target.style.borderColor=G.border} />
              </div>
            ))}
            <button onClick={handleCreer} disabled={loading || !form.role}
              style={{ width: "100%", padding: "13px 20px", background: `linear-gradient(135deg,${G.blue},#1D4ED8)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: (loading||!form.role)?"not-allowed":"pointer", fontFamily: "inherit", opacity: (loading||!form.role)?0.7:1 }}>
              {loading ? "Création…" : `Créer le ${ROLES[form.role]?.label || form.role}`}
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
          {listLoading ? <Spinner /> : membresCreés.length === 0
            ? <div style={{ textAlign: "center", padding: 32, color: G.muted, fontSize: 13 }}>Aucun membre créé</div>
            : membresCreés.map((m, i) => {
                const ri = ROLES[m.role];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, marginBottom: 6, background: "#FAFBFE" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: (ri?.color||G.purple)+"22", color: ri?.color||G.purple, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{m.nom?.charAt(0)?.toUpperCase()||"?"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{m.nom}</div>
                      <div style={{ fontSize: 11, color: G.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      {ri && <Badge color={ri.color} bg={ri.color+"18"}>{ri.abbr}</Badge>}
                      <ActiveBadge statut={m.statut} />
                    </div>
                  </div>
                );
              })}
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
  const ga = members*adhesion*0.10, gc = members*cotisation*0.05, gb = ca*0.015, total = ga+gc+gb;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {Object.entries(ROLES).map(([k,r]) => (
          <button key={k} onClick={() => onRoleChange(k)} style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${currentRole===k?r.color:G.border}`, background: currentRole===k?r.color:"#fff", color: currentRole===k?"#fff":G.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{r.label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 20 }}>⚙️ Paramètres de simulation</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[{label:"Adhésion (FCFA)",val:adhesion,set:setAdhesion},{label:"Cotisation mensuelle",val:cotisation,set:setCotisation},{label:"Nombre de membres",val:members,set:setMembers},{label:"CA mensuel réseau",val:ca,set:setCa}].map((f,i) => (
              <div key={i}>
                <label style={{ fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input type="number" value={f.val} onChange={e => f.set(parseFloat(e.target.value)||0)} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 6 }}>📊 Gains estimés — {ROLES[currentRole]?.label}</div>
          <div style={{ fontSize: 12, color: G.muted, marginBottom: 20 }}>Projection mensuelle</div>
          {[{label:`Adhésion × ${members} membres × 10%`,val:ga,color:G.green},{label:`Cotisation × ${members} membres × 5%`,val:gc,color:G.blue},{label:`Bonus réseau (CA ${fmtShort(ca)} × 1,5%)`,val:gb,color:G.gold}].map((item,i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${G.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: G.muted }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{fmtShort(item.val)}</span>
              </div>
              <div style={{ marginTop: 6, height: 4, background: G.border, borderRadius: 4 }}>
                <div style={{ height: 4, background: item.color, borderRadius: 4, width: total?`${Math.round(item.val/total*100)}%`:"0%", transition: "width .3s" }} />
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

// ══════════════════════════════════════════════════════════════════════════════
// PAGE RETRAIT COMMISSION
// ══════════════════════════════════════════════════════════════════════════════
// Appelle /api/commissions/requests  (commissionRequestRoutes.js)
// NOTE BACKEND : ajouter les rôles CNEPECI dans resolveIdentity() :
//   if (["BUREAU_CENTRALE","COORDONNATEUR_GENERAL","BUREAU_LOCAL",
//        "COORDONNATEUR_LOCAL","PASTEUR"].includes(user.role))
//     return { network: "CNEPECI", memberId: user.id, field: "cnepeci_member_id" };
function WithdrawalPage() {
  const [eligibility, setEligibility] = useState(null);
  const [history,     setHistory]     = useState([]);
  const [loadingElig, setLoadingElig] = useState(true);
  const [loadingHist, setLoadingHist] = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [method,      setMethod]      = useState("WAVE");
  const [details,     setDetails]     = useState({ phone: "" });

  const METHODS = [
    { id: "WAVE",         label: "Wave",             icon: "🌊" },
    { id: "ORANGE_MONEY", label: "Orange Money",     icon: "🟠" },
    { id: "MTN_MONEY",    label: "MTN Mobile Money", icon: "🟡" },
    { id: "VIREMENT",     label: "Virement bancaire",icon: "🏦" },
  ];
  const needsPhone = method !== "VIREMENT";

  const STATUS_STYLE = {
    PENDING:   { label: "En attente",  color: G.gold,   bg: G.goldLight  },
    VALIDATED: { label: "Validé",      color: G.green,  bg: G.greenLight },
    PAID:      { label: "Payé",        color: G.blue,   bg: G.blueLight  },
    REJECTED:  { label: "Rejeté",      color: G.red,    bg: G.redLight   },
  };

  const reload = () => {
    setLoadingElig(true);
    commFetch("/requests/eligibility")
      .then(d => setEligibility(d))
      .catch(() => {})
      .finally(() => setLoadingElig(false));

    setLoadingHist(true);
    commFetch("/requests/me")
      .then(d => setHistory(d?.requests || []))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  };
  useEffect(reload, []);

  async function handleSubmit() {
    setFormError(""); setFormSuccess("");
    if (needsPhone && !details.phone.trim()) { setFormError("Numéro de téléphone requis."); return; }
    if (method === "VIREMENT" && !details.rib?.trim()) { setFormError("RIB / IBAN requis."); return; }
    setSubmitting(true);
    try {
      const res = await commFetch("/requests", {
        method: "POST",
        body: JSON.stringify({ payment_method: method, payment_details: details }),
      });
      if (res?.success === false) throw new Error(res.message || "Erreur inconnue");
      const amt = res?.amount_requested || 0;
      setFormSuccess(`Demande soumise — ${parseFloat(amt).toLocaleString("fr-FR")} F. Traitement sous 48h.`);
      reload();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const pct = eligibility
    ? Math.min(100, Math.round((eligibility.adhesions_since_last / eligibility.threshold) * 100))
    : 0;

  return (
    <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${G.purple} 0%,#5B21B6 100%)`, borderRadius: 20, padding: "26px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ fontSize: 28, marginBottom: 8 }}>💸</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Demande de paiement de commission</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 4 }}>
          Seuil requis : <strong style={{ color: "#C4B5FD" }}>25 adhésions actives</strong> depuis la dernière demande approuvée
        </div>
      </div>

      {/* Éligibilité */}
      {loadingElig ? <Spinner /> : eligibility && (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${G.border}`, background: `linear-gradient(135deg,${G.purple}0D,transparent)` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>📊 Votre éligibilité</div>
          </div>
          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Solde */}
            <div style={{ background: G.purpleLight, border: `1px solid #C4B5FD`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: G.purple, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Solde disponible</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: G.purple }}>{parseFloat(eligibility.available_balance_xof || 0).toLocaleString("fr-FR")} F</div>
              </div>
              <div style={{ fontSize: 40 }}>💰</div>
            </div>

            {/* Progression */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: G.muted }}>Adhésions validées depuis la dernière demande</span>
                <span style={{ fontWeight: 800, color: eligibility.eligible ? G.green : G.gold }}>
                  {eligibility.adhesions_since_last} / {eligibility.threshold}
                </span>
              </div>
              <div style={{ background: G.border, borderRadius: 99, height: 10, overflow: "hidden" }}>
                <div style={{ height: 10, borderRadius: 99, transition: "width .5s", width: `${pct}%`, background: eligibility.eligible ? `linear-gradient(90deg,${G.green},#047857)` : `linear-gradient(90deg,${G.gold},#B45309)` }} />
              </div>
              {!eligibility.eligible && !eligibility.pending_request && (
                <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>
                  Il manque <strong style={{ color: G.gold }}>{eligibility.adhesions_missing} adhésion(s)</strong> pour débloquer le retrait.
                </div>
              )}
            </div>

            {/* Demande en cours */}
            {eligibility.pending_request && (
              <div style={{ background: G.goldLight, border: `1px solid #FDE68A`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 20 }}>⏳</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G.gold }}>Une demande est en cours de traitement</div>
                  <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>
                    Soumise le {new Date(eligibility.pending_request.created_at).toLocaleDateString("fr-FR")}. Attendez sa résolution.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulaire — seulement si éligible et pas de demande pending */}
      {eligibility?.eligible && !eligibility?.pending_request && (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${G.border}`, background: `linear-gradient(135deg,${G.purple}0D,transparent)` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>📝 Nouvelle demande</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Le montant total de vos commissions disponibles sera demandé</div>
          </div>
          <div style={{ padding: "22px" }}>
            <Alert type="error"   msg={formError}   />
            <Alert type="success" msg={formSuccess} />

            {/* Méthode */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>
                Méthode de paiement
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {METHODS.map(m => (
                  <div key={m.id} onClick={() => setMethod(m.id)} style={{
                    padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${method === m.id ? G.purple : G.border}`,
                    background: method === m.id ? G.purpleLight : "#FAFBFE",
                    display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
                  }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: method === m.id ? 700 : 500, color: method === m.id ? G.purple : G.text }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Détails */}
            {needsPhone && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>
                  Numéro de téléphone
                </label>
                <input type="tel" placeholder="07 XX XX XX XX" value={details.phone}
                  onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))}
                  style={{ width: "100%", padding: "12px 16px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = G.purple}
                  onBlur={e  => e.target.style.borderColor = G.border}
                />
              </div>
            )}
            {method === "VIREMENT" && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>
                  RIB / IBAN
                </label>
                <input type="text" placeholder="CI XX XXXX XXXX XXXX XXXX XXXX XXX" value={details.rib || ""}
                  onChange={e => setDetails(d => ({ ...d, rib: e.target.value }))}
                  style={{ width: "100%", padding: "12px 16px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = G.purple}
                  onBlur={e  => e.target.style.borderColor = G.border}
                />
              </div>
            )}

            {/* Récap */}
            <div style={{ background: "#FAFBFE", border: `1px solid ${G.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
              {[
                { label: "Montant demandé", value: `${parseFloat(eligibility.available_balance_xof || 0).toLocaleString("fr-FR")} F`, color: G.purple },
                { label: "Méthode",         value: METHODS.find(m => m.id === method)?.label },
                { label: "Adhésions",        value: `${eligibility.adhesions_since_last} validées` },
              ].map((row, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${G.border}` : "none" }}>
                  <span style={{ fontSize: 13, color: G.muted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color || G.text }}>{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={submitting || !!formSuccess}
              style={{ width: "100%", padding: "14px 20px", background: `linear-gradient(135deg,${G.purple},#5B21B6)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: submitting || formSuccess ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting || formSuccess ? 0.7 : 1 }}>
              {submitting ? "⏳ Envoi en cours…" : "💸 Soumettre la demande →"}
            </button>
          </div>
        </div>
      )}

      {/* Historique */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>📋 Historique des demandes</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{history.length} demande(s)</div>
        </div>
        {loadingHist ? <Spinner /> : history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: G.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14, color: G.muted }}>Aucune demande pour l'instant</div>
          </div>
        ) : (
          <div>
            {history.map((req, i) => {
              const s = STATUS_STYLE[req.status] || STATUS_STYLE.PENDING;
              return (
                <div key={req.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: i < history.length - 1 ? `1px solid ${G.border}` : "none", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFBFE"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: G.text }}>
                      {parseFloat(req.amount_requested || 0).toLocaleString("fr-FR")} F
                    </div>
                    <div style={{ fontSize: 11, color: G.muted, marginTop: 3 }}>
                      {req.payment_method}
                      {req.created_at && " · " + new Date(req.created_at).toLocaleDateString("fr-FR")}
                      {req.admin_note && <span style={{ color: G.red }}> · {req.admin_note}</span>}
                    </div>
                  </div>
                  <Badge color={s.color} bg={s.bg}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE CLIENTS FINAUX (MUTUALISTES)
// Endpoints : POST /clients · GET /clients · POST /clients/:id/pay/jeko
// Plans chargés dynamiquement depuis GET /api/plans
// Paiement Jeko inline sur la liste (pattern DiasporaPages)
// ══════════════════════════════════════════════════════════════════════════════

// ── Helper : charge les plans depuis /api/plans ───────────────────────────────
// Utilise /api/cnepeci/plans (authCnepeci) plutôt que /api/plans (authMiddleware générique)
// pour éviter le rejet du JWT CNEPECI par le middleware agent standard.
async function fetchPlans() {
  try {
    const token = localStorage.getItem("cnepeci_token");
    const data  = await apiFetch("/plans");          // → /api/cnepeci/plans
    // apiFetch retourne null ou { success, data/plans/[] }
    if (!data) return [];
    return data?.data || data?.plans || (Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("[fetchPlans]", e.message);
    return [];
  }
}

function ClientsPage() {
  const [tab, setTab]               = useState("list");
  const [clients, setClients]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");

  // Plans dynamiques
  const [plans, setPlans]           = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Formulaire création
  const [form, setForm]             = useState({ name: "", phone: "", city: "", plan_slug: "" });
  const [creating, setCreating]     = useState(false);
  const [createErr, setCreateErr]   = useState("");
  const [createOk, setCreateOk]     = useState(null);

  // Paiement inline (par client id)
  const [payingId, setPayingId]     = useState(null);   // id du client dont le panel est ouvert
  const [paidId, setPaidId]         = useState(null);   // id du client venant d'être payé
  const [jekoMethod, setJekoMethod] = useState("orange");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError]     = useState("");

  // Chargement des plans au montage
  useEffect(() => {
    fetchPlans().then(data => {
      setPlans(data);
      // Pré-sélectionner le premier plan actif
      const first = data.find(p => p.active !== false);
      if (first) setForm(f => ({ ...f, plan_slug: first.slug?.toUpperCase() || first.slug }));
      setPlansLoading(false);
    });
  }, []);

  const loadClients = useCallback(async (page = 1) => {
    setLoading(true);
    const qs = new URLSearchParams({ page, limit: 20, ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
    const data = await apiFetch(`/clients?${qs}`);
    setClients(data?.clients || []);
    setPagination(data?.pagination || { total: 0, page: 1, pages: 1 });
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { loadClients(1); }, [loadClients]);

  // ── Création ─────────────────────────────────────────────────
  async function handleCreate() {
    setCreateErr(""); setCreateOk(null);
    if (!form.name.trim())     { setCreateErr("Nom requis"); return; }
    if (!form.phone.trim())    { setCreateErr("Téléphone requis"); return; }
    if (!form.plan_slug)       { setCreateErr("Choisissez une formule"); return; }
    setCreating(true);
    const data = await apiFetch("/clients", { method: "POST", body: JSON.stringify(form) });
    setCreating(false);
    if (!data || data.success === false) { setCreateErr(data?.message || "Erreur création"); return; }
    setCreateOk(data);
    loadClients(1);
  }

  // ── Paiement inline ──────────────────────────────────────────
  function openPay(clientId) {
    setPayingId(clientId);
    setJekoMethod("orange");
    setPayError("");
  }
  function closePay() {
    setPayingId(null);
    setPayError("");
  }

  async function payJeko(clientId) {
    setPayError(""); setPayLoading(true);
    const data = await apiFetch(`/clients/${clientId}/pay/jeko`, {
      method: "POST",
      body: JSON.stringify({ jeko_method: jekoMethod }),
    });
    setPayLoading(false);
    if (!data || data.success === false) { setPayError(data?.message || "Erreur paiement"); return; }
    const url = data.data?.redirect_url || data.redirect_url;
    if (url) {
      setPayError("");
      window.location.href = url;
    } else {
      setPayError("URL de paiement non reçue. Réessayez.");
    }
  }

  // ── Helpers UI ───────────────────────────────────────────────
  const statusBadge = (s, sp) => {
    if (sp === "paid")    return <Badge color={G.green} bg={G.greenLight}>● Actif</Badge>;
    if (s  === "attente" || s === "PENDING") return <Badge color={G.gold}  bg={G.goldLight}>● En attente</Badge>;
    return <Badge color={G.muted} bg="#F3F4F6">● Inactif</Badge>;
  };

  const inputStyle = { width: "100%", padding: "11px 14px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#FAFBFE" };

  const resetCreate = () => {
    setCreateOk(null);
    const first = plans.find(p => p.active !== false);
    setForm({ name: "", phone: "", city: "", plan_slug: first?.slug?.toUpperCase() || first?.slug || "" });
  };

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${G.blue} 0%,#1D4ED8 100%)`, borderRadius: 20, padding: "22px 28px", marginBottom: 22, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -24, top: -24, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ fontSize: 26, marginBottom: 6 }}>🫂</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Clients finaux (Mutualistes)</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 3 }}>Créez et gérez les mutualistes de votre réseau</div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { id: "list",   label: "📋 Mes clients",   count: pagination.total },
          { id: "create", label: "＋ Nouveau client", count: null },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setCreateErr(""); setCreateOk(null); closePay(); }}
            style={{ padding: "9px 18px", borderRadius: 10, border: `2px solid ${tab===t.id?G.blue:G.border}`, background: tab===t.id?G.blueLight:"#fff", color: tab===t.id?G.blue:G.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            {t.label}{t.count !== null && <span style={{ background: G.blue, color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ─── LISTE ─── */}
      {tab === "list" && (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
          {/* Filtres */}
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${G.border}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input placeholder="🔍 Rechercher nom / tél / numéro…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 200, padding: "9px 12px" }} />
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              style={{ ...inputStyle, width: 160, padding: "9px 12px" }}>
              <option value="">Tous statuts</option>
              <option value="actif">Actif</option>
              <option value="attente">En attente</option>
            </select>
          </div>

          {loading ? <Spinner /> : clients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: G.muted }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>👥</div>
              <div style={{ fontSize: 14 }}>Aucun client trouvé</div>
              <button onClick={() => setTab("create")}
                style={{ marginTop: 14, padding: "9px 20px", background: G.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Créer un client →
              </button>
            </div>
          ) : (
            <div>
              {clients.map((c, i) => {
                const isPaid       = c.status_payment === "paid";
                const isOpen       = payingId === c.id;
                const justPaid     = paidId === c.id;

                return (
                  <div key={c.id} style={{ borderBottom: i < clients.length - 1 ? `1px solid ${G.border}` : "none" }}>
                    {/* Ligne principale */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FAFBFE"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>
                          {c.phone}{c.city ? ` · ${c.city}` : ""} · {c.mutual_number}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: G.blue, background: G.blueLight, padding: "1px 8px", borderRadius: 999 }}>{c.plan}</span>
                          {c.expiration_date && (
                            <span style={{ fontSize: 10, color: G.muted }}>Exp. {new Date(c.expiration_date).toLocaleDateString("fr-FR")}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        {statusBadge(c.status, c.status_payment)}
                        {!isPaid && !justPaid && (
                          <button onClick={() => isOpen ? closePay() : openPay(c.id)}
                            style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${G.green}`, background: isOpen ? G.greenLight : "#fff", color: G.green, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                            {isOpen ? "✕ Annuler" : "💳 Payer l'adhésion"}
                          </button>
                        )}
                        {justPaid && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: G.green }}>✅ Adhésion payée !</span>
                        )}
                      </div>
                    </div>

                    {/* Panel paiement inline */}
                    {isOpen && (
                      <div style={{ margin: "0 18px 14px", borderTop: `1px solid ${G.border}`, paddingTop: 14 }}>
                        {payError && (
                          <div style={{ background: G.redLight, color: G.red, padding: "8px 12px", borderRadius: 8, marginBottom: 10, fontSize: 12, fontWeight: 600 }}>
                            ⚠️ {payError}
                          </div>
                        )}

                        {/* Panel paiement JEKO */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <select value={jekoMethod} onChange={e => setJekoMethod(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${G.border}`, fontSize: 13, fontFamily: "inherit", background: "#fff", color: G.text }}>
                            <option value="orange">🟠 Orange Money</option>
                            <option value="wave">🔵 Wave</option>
                            <option value="mtn">🟡 MTN Mobile Money</option>
                            <option value="moov">🟢 Moov Money</option>
                            <option value="djamo">💜 Djamo / Carte bancaire</option>
                          </select>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => closePay()}
                              style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#fff", color: G.muted, border: `1.5px solid ${G.border}`, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                              ✕ Annuler
                            </button>
                            <button onClick={() => payJeko(c.id)} disabled={payLoading}
                              style={{ flex: 2, padding: "10px 0", borderRadius: 8, background: payLoading ? "#94a3b8" : `linear-gradient(135deg,${G.green},#047857)`, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: payLoading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                              {payLoading
                                ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />Redirection…</>
                                : "💳 Payer via JEKO"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ padding: "14px 18px", display: "flex", justifyContent: "center", gap: 8, borderTop: `1px solid ${G.border}` }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => loadClients(p)}
                      style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${pagination.page===p?G.blue:G.border}`, background: pagination.page===p?G.blueLight:"#fff", color: pagination.page===p?G.blue:G.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── CRÉATION ─── */}
      {tab === "create" && (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${G.border}`, background: `linear-gradient(135deg,${G.blue}0D,transparent)` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>📝 Nouveau client final</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Le numéro mutualiste et le code d'accès seront générés automatiquement</div>
          </div>
          <div style={{ padding: 24 }}>
            <Alert type="error" msg={createErr} />

            {createOk ? (
              /* ── Succès création ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: G.greenLight, border: `1px solid ${G.green}44`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: G.green, marginBottom: 14 }}>✅ Client créé avec succès !</div>
                  {[
                    { label: "Numéro mutualiste",       value: createOk.mutual_number,  mono: true  },
                    { label: "Code d'accès temporaire", value: createOk.access_code,    mono: true  },
                    { label: "Frais d'adhésion",        value: fmt(createOk.adhesion_fee || createOk.data?.adhesion_fee) },
                    { label: "Portail client",          value: createOk.portal_url || createOk.data?.portal_url, link: true },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${G.green}22` : "none" }}>
                      <span style={{ fontSize: 12, color: G.green, fontWeight: 600 }}>{row.label}</span>
                      {row.link
                        ? <a href={row.value} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: G.blue, fontWeight: 700 }}>{row.value}</a>
                        : <span style={{ fontSize: row.mono?14:13, fontWeight: 800, fontFamily: row.mono?"monospace":"inherit", color: G.text, letterSpacing: row.mono?1:0 }}>{row.value}</span>
                      }
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={resetCreate}
                    style={{ flex: 1, padding: "12px 16px", background: G.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    ＋ Créer un autre client
                  </button>
                  <button onClick={() => setTab("list")}
                    style={{ flex: 1, padding: "12px 16px", background: "#fff", color: G.blue, border: `1.5px solid ${G.blue}`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Voir la liste →
                  </button>
                </div>
              </div>
            ) : (
              /* ── Formulaire ── */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Nom complet *", key: "name",  type: "text", ph: "Jean Kouassi" },
                  { label: "Téléphone *",   key: "phone", type: "tel",  ph: "07 XX XX XX XX" },
                  { label: "Ville",         key: "city",  type: "text", ph: "Abidjan" },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.key === "name" ? "span 2" : "auto" }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 7, textTransform: "uppercase", letterSpacing: ".5px" }}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={form[f.key]}
                      onChange={e => setForm(d => ({ ...d, [f.key]: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = G.blue}
                      onBlur={e  => e.target.style.borderColor = G.border} />
                  </div>
                ))}

                {/* Sélecteur de formule — dynamique */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 7, textTransform: "uppercase", letterSpacing: ".5px" }}>Formule *</label>
                  {plansLoading ? (
                    <div style={{ padding: "12px 0", color: G.muted, fontSize: 13 }}>Chargement des formules…</div>
                  ) : plans.length === 0 ? (
                    <div style={{ padding: "12px 0", color: G.red, fontSize: 13 }}>⚠️ Impossible de charger les formules. Rechargez la page.</div>
                  ) : (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {plans.filter(p => p.active !== false).map(p => {
                        const slug     = p.slug?.toUpperCase() || p.slug;
                        const isActive = form.plan_slug === slug || form.plan_slug === p.slug;
                        return (
                          <div key={p.slug} onClick={() => setForm(d => ({ ...d, plan_slug: slug }))}
                            style={{ flex: 1, minWidth: 110, border: `2px solid ${isActive?G.blue:G.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", background: isActive?G.blueLight:"#FAFBFE", textAlign: "center", transition: "all .15s" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: isActive?G.blue:G.text }}>{p.name || slug}</div>
                            {p.adhesion_price != null && (
                              <div style={{ fontSize: 11, color: isActive?G.blue:G.muted, marginTop: 3 }}>
                                Adhésion : {Number(p.adhesion_price).toLocaleString("fr-FR")} F
                              </div>
                            )}
                            {p.monthly_price != null && (
                              <div style={{ fontSize: 10, color: isActive?G.blue:G.muted }}>
                                Cotisation : {Number(p.monthly_price).toLocaleString("fr-FR")} F/mois
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <button onClick={handleCreate} disabled={creating || plansLoading}
                    style={{ width: "100%", padding: "13px 20px", background: `linear-gradient(135deg,${G.blue},#1D4ED8)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: creating?"not-allowed":"pointer", fontFamily: "inherit", opacity: creating?0.7:1 }}>
                    {creating ? "⏳ Création…" : "🫂 Créer le client →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",   label: "Tableau de bord",    icon: "◉" },
  { id: "network",     label: "Mon réseau",          icon: "◈" },
  { id: "creer",       label: "Créer un membre",     icon: "＋" },
  { id: "commissions", label: "Commissions",         icon: "◎" },
  { id: "bonus",       label: "Bonus mensuel",       icon: "◆" },
  { id: "clients",     label: "Clients finaux",      icon: "🫂" },
  { id: "paiement",    label: "Payer",               icon: "◑" },
  { id: "retrait",     label: "Retrait commission",  icon: "💸" },
  { id: "invite",      label: "Lien d'invitation",   icon: "◇" },
  { id: "history",     label: "Historique",          icon: "○" },
  { id: "simulate",    label: "Simuler rôle",        icon: "◐" },
];

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [membre, setMembre] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [simRole, setSimRole] = useState(null);
  const [peutCreer, setPeutCreer] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("cnepeci_token");
    const membreStored = localStorage.getItem("cnepeci_membre");
    if (!token || !membreStored) { setChecking(false); return; }
    // Rechargement du profil frais pour avoir code_invitation à jour
    apiFetch("/profile").then(data => {
      if (data?.success) {
        const profilFrais = data.profil || data.data?.profil;
        if (profilFrais) {
          localStorage.setItem("cnepeci_membre", JSON.stringify(profilFrais));
          setMembre(profilFrais);
        } else {
          try { setMembre(JSON.parse(membreStored)); } catch {}
        }
      } else {
        localStorage.removeItem("cnepeci_token");
        localStorage.removeItem("cnepeci_membre");
      }
    }).catch(() => {
      localStorage.removeItem("cnepeci_token");
      localStorage.removeItem("cnepeci_membre");
    }).finally(() => setChecking(false));
  }, []);

  // ✅ FIX : useEffect déplacé AVANT les returns conditionnels
  // (les Hooks React doivent toujours être appelés avant tout return)
  useEffect(() => {
    if (!membre) return;
    apiFetch("/reseau/roles-creables").then(d => {
      const roles = d?.roles || d?.data?.roles || [];
      setPeutCreer(roles.length > 0);
    }).catch(() => {});
  }, [membre?.id]);

  const role = simRole || membre?.role || "SOUSCRIPTEUR";
  const roleInfo = ROLES[role] || ROLES.SOUSCRIPTEUR;
  const pageTitle = NAV_ITEMS.find(n => n.id === page)?.label || "Tableau de bord";

  const handleLogout = () => {
    localStorage.removeItem("cnepeci_token");
    localStorage.removeItem("cnepeci_membre");
    setMembre(null);
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <Spinner />
    </div>
  );

  if (!membre) return <AuthPage onAuth={m => setMembre(m)} />;

  const navVisible = NAV_ITEMS.filter(item => item.id !== "creer" || peutCreer);

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return <DashboardPage membre={membre} />;
      case "network":     return <NetworkPage />;
      case "creer":       return <CreerMembrePage membre={membre} />;
      case "commissions": return <CommissionsPage />;
      case "bonus":       return <BonusPage />;
      case "clients":     return <ClientsPage />;
      case "paiement":    return <PaiementPage />;
      case "retrait":     return <WithdrawalPage />;
      case "invite":      return <InvitePage membre={membre} />;
      case "history":     return <HistoryPage />;
      case "simulate":    return <SimulatePage currentRole={role} onRoleChange={r => setSimRole(r)} />;
      default:            return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: G.bg }}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        input[type=number]::-webkit-inner-spin-button{opacity:.3}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 230, background: G.sidebar, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${G.sidebarBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${G.purple},#5B21B6)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⛪</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>CNEPECI</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1, letterSpacing: ".3px" }}>BUSINESS NETWORK</div>
            </div>
          </div>
        </div>

        <div style={{ margin: "12px 16px 4px", padding: "8px 12px", background: roleInfo.color+"22", borderRadius: 10, border: `1px solid ${roleInfo.color}44` }}>
          <div style={{ fontSize: 10, color: roleInfo.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Rôle actif</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 2 }}>{roleInfo.label}</div>
        </div>

        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {navVisible.map(item => {
            const isActive = page === item.id;
            return (
              <div key={item.id} onClick={() => { setPage(item.id); if (item.id!=="simulate") setSimRole(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", cursor: "pointer", fontSize: 13, color: isActive?"#fff":"rgba(255,255,255,.5)", background: isActive?`${G.purple}22`:"transparent", borderLeft: `3px solid ${isActive?G.purple:"transparent"}`, transition: "all .15s", userSelect: "none" }}>
                <span style={{ width: 16, textAlign: "center", fontSize: 13, color: isActive?G.purple:"rgba(255,255,255,.3)" }}>{item.icon}</span>
                <span style={{ fontWeight: isActive?700:400 }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div onClick={handleLogout} style={{ padding: "14px 20px", borderTop: `1px solid ${G.sidebarBorder}`, fontSize: 12, color: "rgba(255,255,255,.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          onMouseEnter={e=>e.currentTarget.style.color="#FCA5A5"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.3)"}>
          <span>⎋</span> Déconnexion
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 230, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: G.text }}>{pageTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {simRole && <div style={{ background: G.goldLight, color: G.gold, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>👁 Simulation : {ROLES[simRole]?.label}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{membre.nom}</div>
                <div style={{ fontSize: 10, color: G.muted }}>{ROLES[membre.role]?.label}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${roleInfo.color},${roleInfo.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>
                {roleInfo.abbr}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "28px", flex: 1, animation: "fadeIn .2s ease" }} key={page}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
