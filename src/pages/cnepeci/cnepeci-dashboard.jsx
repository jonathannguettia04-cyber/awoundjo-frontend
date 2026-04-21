import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api/cnepeci";

function apiHeaders() {
  const token = localStorage.getItem("cnepeci_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Adapté : gère success/data selon la réponse réelle du contrôleur
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
    const json = await res.json();
    // Le contrôleur retourne { success, data, message } ou { success, ...fields }
    return json;
  } catch (e) {
    console.error("[apiFetch]", path, e.message);
    return null;
  }
}

// Helper : extrait les données utiles peu importe la structure de réponse
function extractData(json) {
  if (!json) return null;
  if (json.data !== undefined) return json.data;
  const { success, message, ...rest } = json;
  return Object.keys(rest).length ? rest : null;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ROLES = {
  BUREAU_CENTRALE:       { label: "Bureau Centrale",       abbr: "BC", color: "#7F77DD", level: 1 },
  COORDONNATEUR_GENERAL: { label: "Coordonnateur Général", abbr: "CG", color: "#1D9E75", level: 2 },
  BUREAU_LOCAL:          { label: "Bureau Local",          abbr: "BL", color: "#378ADD", level: 3 },
  COORDONNATEUR_LOCAL:   { label: "Coordonnateur Local",   abbr: "CL", color: "#BA7517", level: 4 },
  PASTEUR:               { label: "Pasteur d'Église",      abbr: "PA", color: "#D85A30", level: 5 },
  SOUSCRIPTEUR:          { label: "Souscripteur Final",    abbr: "SF", color: "#888780", level: 6 },
};

// Qui peut créer qui (issu du contrôleur CREATION_MAP)
const CREATION_MAP = {
  BUREAU_CENTRALE:       "COORDONNATEUR_GENERAL",
  COORDONNATEUR_GENERAL: "BUREAU_LOCAL",
  BUREAU_LOCAL:          "COORDONNATEUR_LOCAL",
  COORDONNATEUR_LOCAL:   "PASTEUR",
  PASTEUR:               "SOUSCRIPTEUR",
};

const TYPE_COLORS = {
  adhesion:   { bg: "#E1F5EE", text: "#0F6E56", label: "Adhésion" },
  cotisation: { bg: "#E6F1FB", text: "#185FA5", label: "Cotisation" },
  bonus:      { bg: "#FAEEDA", text: "#854F0B", label: "Bonus" },
};

const MONTHS = ["Nov", "Déc", "Jan", "Fév", "Mar", "Avr"];
const BAR_VALUES_STATIC = [32000, 45000, 28000, 61000, 55000, 82500];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  sidebar: {
    width: 220,
    background: "#1a1917",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "fixed",
    top: 0, left: 0,
    zIndex: 100,
    fontFamily: "'DM Sans', sans-serif",
  },
  main: {
    marginLeft: 220,
    flex: 1,
    minHeight: "100vh",
    background: "#f5f4f0",
    fontFamily: "'DM Sans', sans-serif",
  },
  topbar: {
    background: "#fff",
    borderBottom: "1px solid #e8e7e2",
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  card: {
    background: "#fff",
    border: "1px solid #e8e7e2",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  cardHeader: {
    padding: "14px 20px",
    borderBottom: "1px solid #f0efe9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    padding: "10px 14px",
    border: "1px solid #e8e7e2",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 13,
    background: "#fff",
    color: "#1a1917",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  btn: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = n => (parseFloat(n) || 0).toLocaleString("fr-FR") + " F";

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e8e7e2", borderTop: "3px solid #7F77DD", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Alert({ type, msg }) {
  if (!msg) return null;
  const colors = {
    error:   { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
    success: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
  };
  const c = colors[type] || colors.error;
  return (
    <div style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
      {msg}
    </div>
  );
}

// ─── SOUS-COMPOSANTS ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e7e2", borderRadius: 12, padding: "16px 20px", borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.4px", color: "#1a1917" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || { bg: "#f0efe9", text: "#555", label: type };
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 500 }}>
      {c.label}
    </span>
  );
}

function ActiveBadge({ statut }) {
  const active = statut === "actif";
  return (
    <span style={{ background: active ? "#E1F5EE" : statut === "suspendu" ? "#FEE2E2" : "#f0efe9", color: active ? "#0F6E56" : statut === "suspendu" ? "#991B1B" : "#888", borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 500 }}>
      {active ? "Actif" : statut === "suspendu" ? "Suspendu" : "Inactif"}
    </span>
  );
}

function TreeNode({ node }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e7e2", borderRadius: 10, marginBottom: 8 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", cursor: "pointer" }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1917" }}>{node.nom}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{ROLES[node.role]?.label || node.role} · {node.email}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ActiveBadge statut={node.statut} />
          <span style={{ fontSize: 14, color: "#aaa", transform: open ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform .2s" }}>›</span>
        </div>
      </div>
      {open && (
        <div style={{ borderLeft: "2px solid #EEEDFE", marginLeft: 28, marginBottom: 10, paddingLeft: 16, paddingTop: 6, paddingBottom: 6 }}>
          <div style={{ fontSize: 12, color: "#555" }}>📞 {node.phone || "—"}</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Inscrit le {new Date(node.created_at).toLocaleDateString("fr-FR")}</div>
          {node.code_invitation && (
            <div style={{ fontSize: 12, color: "#7F77DD", marginTop: 4, fontFamily: "monospace" }}>Code : {node.code_invitation}</div>
          )}
        </div>
      )}
    </div>
  );
}

function BarChart({ values }) {
  const data = values || BAR_VALUES_STATIC;
  const max = Math.max(...data);
  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: "#555" }}>{Math.round(v / 1000)}k</span>
            <div style={{ width: "100%", height: Math.round(v / max * 80), background: i === data.length - 1 ? "#7F77DD" : "#CECBF6", borderRadius: "4px 4px 0 0" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {MONTHS.map(m => <span key={m} style={{ fontSize: 10, color: "#aaa", flex: 1, textAlign: "center" }}>{m}</span>)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE AUTH — Login / Inscription
// ══════════════════════════════════════════════════════════════════════════════
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nom: "", email: "", phone: "", password: "", code_invitation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

      if (!data.success) {
        setError(data.message || "Erreur inconnue");
        return;
      }

      if (mode === "login") {
        // Contrôleur retourne { success, token, membre }
        const token  = data.token  || data.data?.token;
        const membre = data.membre || data.data?.membre;
        localStorage.setItem("cnepeci_token", token);
        localStorage.setItem("cnepeci_membre", JSON.stringify(membre));
        onAuth(membre);
      } else {
        setSuccessMsg("Inscription réussie ! Connectez-vous.");
        setMode("login");
        setForm(f => ({ ...f, nom: "", phone: "", password: "", code_invitation: "" }));
      }
    } catch (e) {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const fields = mode === "login"
    ? [
        { label: "Email", key: "email", type: "email" },
        { label: "Mot de passe", key: "password", type: "password" },
      ]
    : [
        { label: "Nom complet", key: "nom", type: "text" },
        { label: "Email", key: "email", type: "email" },
        { label: "Téléphone", key: "phone", type: "tel" },
        { label: "Mot de passe", key: "password", type: "password" },
        { label: "Code d'invitation (optionnel)", key: "code_invitation", type: "text" },
      ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", border: "1px solid #e8e7e2", borderRadius: 16, padding: "36px 40px", width: 380, maxWidth: "90vw" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: "#7F77DD", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#fff", fontSize: 18, fontWeight: 700 }}>C</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1917" }}>CNEPECI Business</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{mode === "login" ? "Connexion à votre espace" : "Créer un compte"}</div>
        </div>

        <Alert type="error" msg={error} />
        <Alert type="success" msg={successMsg} />

        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>{f.label}</label>
            <input
              type={f.type}
              value={form[f.key]}
              onChange={e => set(f.key, e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={styles.input}
              placeholder={f.label}
            />
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...styles.btn, background: "#7F77DD", color: "#fff", width: "100%", marginTop: 6, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "S'inscrire"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#888" }}>
          {mode === "login" ? (
            <>Pas encore membre ?{" "}
              <span onClick={() => { setMode("register"); setError(""); }} style={{ color: "#7F77DD", cursor: "pointer", fontWeight: 500 }}>S'inscrire</span>
            </>
          ) : (
            <>Déjà inscrit ?{" "}
              <span onClick={() => { setMode("login"); setError(""); }} style={{ color: "#7F77DD", cursor: "pointer", fontWeight: 500 }}>Se connecter</span>
            </>
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

  useEffect(() => {
    Promise.all([
      apiFetch("/reseau/stats"),
      apiFetch("/profile"),
    ]).then(([statsRes, profilRes]) => {
      // GET /reseau/stats → retourne les champs directement ou dans data
      if (statsRes?.success) setStats(extractData(statsRes) || statsRes);
      // GET /profile → { success, profil }
      if (profilRes?.success) setProfil(profilRes.profil || extractData(profilRes));
      setLoading(false);
    });
  }, []);

  const role = membre?.role;
  const showGains = role !== "SOUSCRIPTEUR" && role !== "BUREAU_CENTRALE";

  if (loading) return <Spinner />;

  const cards = stats ? [
    { label: "Membres directs",   value: stats.membres_directs ?? "—",    sub: "dans mon réseau",    accent: "#1D9E75" },
    { label: "CA réseau (mois)",   value: fmt(stats.ca_reseau_mois),        sub: "paiements validés", accent: "#378ADD" },
    { label: "Commissions perçues",value: fmt(stats.commissions_total),     sub: "total cumulé",      accent: "#7F77DD" },
    { label: "Bonus ce mois",      value: fmt(stats.bonus_mois),            sub: "1,5% du CA réseau", accent: "#BA7517" },
  ] : [];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 22 }}>
        {cards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Infos profil */}
      {profil && (
        <div style={{ ...styles.card, marginBottom: 20 }}>
          <div style={styles.cardHeader}><span style={{ fontSize: 13, fontWeight: 600 }}>Mon profil</span></div>
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Nom", value: profil.nom },
              { label: "Email", value: profil.email },
              { label: "Téléphone", value: profil.phone || "—" },
              { label: "Rôle", value: ROLES[profil.role]?.label || profil.role },
              { label: "Statut", value: <ActiveBadge statut={profil.statut} /> },
              { label: "Code invitation", value: profil.code_invitation ? <span style={{ fontFamily: "monospace", color: "#7F77DD" }}>{profil.code_invitation}</span> : "—" },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: "#1a1917" }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={styles.card}>
          <div style={styles.cardHeader}><span style={{ fontSize: 13, fontWeight: 600 }}>Commissions (6 mois)</span></div>
          <div style={{ padding: "18px 20px" }}><BarChart /></div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardHeader}><span style={{ fontSize: 13, fontWeight: 600 }}>Répartition des gains</span></div>
          <div style={{ padding: "16px 20px" }}>
            {!showGains ? (
              <div style={{ textAlign: "center", padding: 24, color: "#aaa", fontSize: 13 }}>Aucune commission pour ce rôle</div>
            ) : (
              [
                { label: "Adhésion (10%)", color: "#1D9E75" },
                { label: "Cotisation (5%)", color: "#378ADD" },
                { label: "Bonus réseau (1,5%)", color: "#BA7517" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? "1px solid #f5f4f0" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                    <span style={{ fontSize: 13, color: "#333" }}>{item.label}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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

  useEffect(() => {
    // GET /reseau → { success, membres, total }
    apiFetch("/reseau").then(data => {
      if (data?.success) setMembres(data.membres || extractData(data)?.membres || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Arbre de mon réseau direct</span>
        <span style={{ fontSize: 12, color: "#888" }}>{membres.length} membre(s) direct(s)</span>
      </div>
      <div style={{ padding: 20 }}>
        {membres.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#aaa", fontSize: 13 }}>Aucun membre direct pour l'instant</div>
        ) : membres.map((n, i) => <TreeNode key={i} node={n} />)}
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
    // GET /commissions?page=&limit= → { success, commissions, total, page }
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard label="Commissions adhésion"   value={fmt(stats.adhesion)}   sub="10% / adhésion directe"    accent="#1D9E75" />
        <StatCard label="Commissions cotisation" value={fmt(stats.cotisation)} sub="5% / cotisation mensuelle" accent="#378ADD" />
        <StatCard label="Bonus réseau"           value={fmt(stats.bonus)}      sub="1,5% CA mensuel réseau"    accent="#BA7517" />
      </div>
      <div style={styles.card}>
        <div style={styles.cardHeader}><span style={{ fontSize: 13, fontWeight: 600 }}>Détail des commissions</span></div>
        {loading ? <Spinner /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Type", "Source", "Rôle source", "Montant"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: ".5px", padding: "9px 20px", textAlign: "left", background: "#faf9f6", borderBottom: "1px solid #e8e7e2" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 28, color: "#aaa", fontSize: 13 }}>Aucune commission</td></tr>
              ) : commissions.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f5f4f0" }}>
                  <td style={{ padding: "11px 20px", fontSize: 13, color: "#555" }}>{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                  <td style={{ padding: "11px 20px" }}><TypeBadge type={c.type} /></td>
                  <td style={{ padding: "11px 20px", fontSize: 13, color: "#333" }}>{c.source_nom || "—"}</td>
                  <td style={{ padding: "11px 20px", fontSize: 12, color: "#888" }}>{ROLES[c.source_role]?.label || c.source_role || "—"}</td>
                  <td style={{ padding: "11px 20px", fontSize: 13, fontWeight: 600, color: "#1a1917" }}>{fmt(c.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 20 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...styles.btn, background: "#f0efe9", color: "#555", padding: "6px 14px" }}>← Préc.</button>
            <span style={{ fontSize: 13, color: "#888", lineHeight: "32px" }}>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} style={{ ...styles.btn, background: "#f0efe9", color: "#555", padding: "6px 14px" }}>Suiv. →</button>
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
    Promise.all([
      apiFetch("/bonus/historique"),
      apiFetch("/reseau/stats"),
    ]).then(([bonusRes, statsRes]) => {
      // GET /bonus/historique → { success, historique }
      if (bonusRes?.success) setHistorique(bonusRes.historique || []);
      if (statsRes?.success) setStatsReseau(statsRes);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <StatCard label="CA réseau (mois courant)" value={fmt(statsReseau?.ca_reseau_mois)}  sub="" accent="#BA7517" />
        <StatCard label="Bonus ce mois"            value={fmt(statsReseau?.bonus_mois)}       sub="= CA × 1,5%"     accent="#7F77DD" />
      </div>
      <div style={styles.card}>
        <div style={styles.cardHeader}><span style={{ fontSize: 13, fontWeight: 600 }}>Historique bonus mensuel</span></div>
        {historique.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#aaa", fontSize: 13 }}>Aucun historique disponible</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Période", "CA réseau", "Taux", "Bonus versé"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: ".5px", padding: "9px 20px", textAlign: "left", background: "#faf9f6", borderBottom: "1px solid #e8e7e2" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historique.map((b, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f5f4f0" }}>
                  <td style={{ padding: "11px 20px", fontSize: 13 }}>{moisNoms[(b.mois || 1) - 1]} {b.annee}</td>
                  <td style={{ padding: "11px 20px", fontSize: 13, color: "#555" }}>{fmt(b.chiffre_affaire)}</td>
                  <td style={{ padding: "11px 20px" }}>
                    <span style={{ background: "#FAEEDA", color: "#854F0B", borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 500 }}>1,5%</span>
                  </td>
                  <td style={{ padding: "11px 20px", fontSize: 13, fontWeight: 600, color: "#BA7517" }}>{fmt(b.bonus)}</td>
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
  const [type, setType]       = useState("adhesion");
  const [montant, setMontant] = useState(15000);
  const [methode, setMethode] = useState("cinetpay");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const handlePayer = async () => {
    setError(""); setSuccess("");
    if (!montant || montant < 100) { setError("Montant minimum : 100 FCFA"); return; }

    setLoading(true);
    try {
      const endpoint = methode === "cinetpay"
        ? "/paiement/cinetpay/init"
        : "/paiement/paydunya/init";

      const body = {
        montant,
        type,
        success_url: `${window.location.origin}/cnepeci/paiement/success`,
        failed_url:  `${window.location.origin}/cnepeci/paiement/echec`,
      };

      const data = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });

      if (!data) { setError("Erreur réseau. Réessayez."); return; }
      if (!data.success) { setError(data.message || "Erreur paiement"); return; }

      // Contrôleur retourne { success, payment_url, transaction_id }
      const payUrl = data.payment_url || data.data?.payment_url;
      if (payUrl) {
        setSuccess("Redirection vers la page de paiement…");
        setTimeout(() => { window.location.href = payUrl; }, 1000);
      } else {
        setError("URL de paiement non reçue. Réessayez.");
      }
    } catch (e) {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const commEstimee = type === "adhesion"
    ? Math.round(montant * 0.10)
    : Math.round(montant * 0.05);

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={styles.card}>
        <div style={styles.cardHeader}><span style={{ fontSize: 13, fontWeight: 600 }}>Effectuer un paiement</span></div>
        <div style={{ padding: 24 }}>
          <Alert type="error" msg={error} />
          <Alert type="success" msg={success} />

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 8 }}>Type de paiement</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ val: "adhesion", label: "Adhésion" }, { val: "cotisation", label: "Cotisation" }].map(t => (
                <button key={t.val} onClick={() => setType(t.val)} style={{ ...styles.btn, flex: 1, background: type === t.val ? "#7F77DD" : "#f5f4f0", color: type === t.val ? "#fff" : "#555", border: `1px solid ${type === t.val ? "#7F77DD" : "#e8e7e2"}` }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>Montant (FCFA)</label>
            <input type="number" value={montant} onChange={e => setMontant(parseFloat(e.target.value) || 0)} style={styles.input} min={100} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 8 }}>Méthode de paiement</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: "cinetpay", label: "CinetPay",  sub: "Orange, Wave, MTN…" },
                { val: "paydunya", label: "PayDunya",   sub: "Orange, Wave, MTN…" },
              ].map(m => (
                <div key={m.val} onClick={() => setMethode(m.val)} style={{ flex: 1, border: `2px solid ${methode === m.val ? "#7F77DD" : "#e8e7e2"}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", background: methode === m.val ? "#EEEDFE" : "#fff" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: methode === m.val ? "#3C3489" : "#1a1917" }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#faf9f6", border: "1px solid #f0efe9", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#555" }}>Montant</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(montant)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#555" }}>Type</span>
              <TypeBadge type={type} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #e8e7e2" }}>
              <span style={{ fontSize: 13, color: "#1D9E75", fontWeight: 500 }}>Commission générée pour votre parrain</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>{fmt(commEstimee)}</span>
            </div>
          </div>

          <button
            onClick={handlePayer}
            disabled={loading || !!success}
            style={{ ...styles.btn, background: "#1D9E75", color: "#fff", width: "100%", fontSize: 14, padding: "13px 20px", opacity: loading || success ? 0.7 : 1 }}
          >
            {loading ? "Traitement…" : `Payer ${fmt(montant)} via ${methode === "cinetpay" ? "CinetPay" : "PayDunya"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE INVITATION
// ══════════════════════════════════════════════════════════════════════════════
function InvitePage({ membre }) {
  const [copied, setCopied] = useState(false);
  const code = membre?.code_invitation || null;
  const frontUrl = process.env.REACT_APP_FRONTEND_URL || "https://cnepeci.mutuelleawoundjo.org";
  const url  = `${frontUrl}/join?ref=${code}`;

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ background: "#EEEDFE", border: "1px solid #CECBF6", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#3C3489", marginBottom: 10 }}>Votre lien d'invitation personnel</div>
        {!code ? (
          <div style={{ fontSize: 13, color: "#888" }}>
            Les souscripteurs finaux n'ont pas de code d'invitation.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "monospace", fontSize: 12, background: "#fff", border: "1px solid #CECBF6", borderRadius: 8, padding: "8px 14px", flex: 1, color: "#534AB7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {url}
              </span>
              <button onClick={() => copy(url)} style={{ ...styles.btn, background: "#7F77DD", color: "#fff", whiteSpace: "nowrap", padding: "8px 14px" }}>
                {copied ? "Copié !" : "Copier lien"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#3C3489" }}>Code seul :</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#534AB7", fontSize: 14 }}>{code}</span>
              <button onClick={() => copy(code)} style={{ ...styles.btn, background: "transparent", border: "1px solid #CECBF6", color: "#534AB7", padding: "4px 10px", fontSize: 12 }}>
                Copier code
              </button>
            </div>
          </>
        )}
        <div style={{ fontSize: 12, color: "#888", marginTop: 10 }}>
          {code
            ? "Partagez ce lien pour recruter directement. Chaque inscription génère automatiquement une commission d'adhésion."
            : "Votre rôle ne permet pas de recruter directement."}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE HISTORIQUE PAIEMENTS
// ══════════════════════════════════════════════════════════════════════════════
function HistoryPage() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // GET /paiements → { success, paiements, total, page }
    apiFetch("/paiements?page=1&limit=50").then(data => {
      if (data?.success) setPaiements(data.paiements || []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? paiements : paiements.filter(p => p.type === filter || p.statut === filter);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Historique de mes paiements</span>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #e8e7e2", borderRadius: 6, fontFamily: "inherit", background: "#fff", color: "#333" }}>
          <option value="all">Tous</option>
          <option value="adhesion">Adhésion</option>
          <option value="cotisation">Cotisation</option>
          <option value="paid">Payés</option>
          <option value="pending">En attente</option>
          <option value="failed">Échoués</option>
        </select>
      </div>
      {loading ? <Spinner /> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date", "Type", "Méthode", "Référence", "Montant", "Statut"].map(h => (
                <th key={h} style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: ".5px", padding: "9px 20px", textAlign: "left", background: "#faf9f6", borderBottom: "1px solid #e8e7e2" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 28, color: "#aaa", fontSize: 13 }}>Aucun résultat</td></tr>
            ) : filtered.map((p, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f5f4f0" }}>
                <td style={{ padding: "11px 20px", fontSize: 13, color: "#555" }}>{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                <td style={{ padding: "11px 20px" }}><TypeBadge type={p.type} /></td>
                <td style={{ padding: "11px 20px", fontSize: 13, color: "#555", textTransform: "capitalize" }}>{p.payment_method}</td>
                <td style={{ padding: "11px 20px", fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>{(p.transaction_reference || "").substring(0, 16)}…</td>
                <td style={{ padding: "11px 20px", fontSize: 13, fontWeight: 600, color: "#1a1917" }}>{fmt(p.montant)}</td>
                <td style={{ padding: "11px 20px" }}>
                  <span style={{
                    background: p.statut === "paid" ? "#E1F5EE" : p.statut === "pending" ? "#FAEEDA" : "#FEE2E2",
                    color: p.statut === "paid" ? "#0F6E56" : p.statut === "pending" ? "#854F0B" : "#991B1B",
                    borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 500
                  }}>
                    {p.statut === "paid" ? "Payé" : p.statut === "pending" ? "En attente" : "Échoué"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE CRÉER MEMBRE — nouvelle page, issu de CREATION_MAP du contrôleur
// ══════════════════════════════════════════════════════════════════════════════
function CreerMembrePage({ membre }) {
  const [form, setForm] = useState({ nom: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // credentials du nouveau membre
  const [membresCreés, setMembresCreés] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const roleACreer = CREATION_MAP[membre?.role];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    // GET /reseau/membres-crees → { success, membres, total }
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
      // POST /reseau/creer-membre → { success, message, membre, credentials }
      const data = await apiFetch("/reseau/creer-membre", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (!data) { setError("Erreur réseau."); return; }
      if (!data.success) { setError(data.message || "Erreur création"); return; }

      setSuccess(data.credentials || data);
      setForm({ nom: "", email: "", phone: "" });
      // Recharger la liste
      apiFetch("/reseau/membres-crees").then(d => {
        if (d?.success) setMembresCreés(d.membres || []);
      });
    } catch (e) {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  if (!roleACreer) {
    return (
      <div style={styles.card}>
        <div style={{ padding: 32, textAlign: "center", color: "#aaa", fontSize: 13 }}>
          Votre rôle ({ROLES[membre?.role]?.label}) ne permet pas de créer des membres.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Formulaire de création */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Créer un {ROLES[roleACreer]?.label}</span>
            <span style={{ background: ROLES[roleACreer]?.color, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500 }}>{ROLES[roleACreer]?.abbr}</span>
          </div>
          <div style={{ padding: 20 }}>
            <Alert type="error" msg={error} />

            {success && (
              <div style={{ background: "#D1FAE5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#065F46", marginBottom: 10 }}>✓ Membre créé avec succès</div>
                {[
                  { label: "Email",       value: success.email },
                  { label: "Mot de passe",value: success.mot_de_passe, mono: true },
                  { label: "Lien connexion", value: success.lien_connexion, mono: true },
                  { label: "Rôle",        value: ROLES[success.role]?.label || success.role },
                ].map((f, i) => f.value && (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#065F46", fontWeight: 500 }}>{f.label} : </span>
                    <span style={{ fontSize: 12, color: "#065F46", fontFamily: f.mono ? "monospace" : "inherit" }}>{f.value}</span>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const text = `Email: ${success.email}\nMot de passe: ${success.mot_de_passe}\nLien: ${success.lien_connexion}`;
                    navigator.clipboard?.writeText(text);
                  }}
                  style={{ ...styles.btn, background: "#1D9E75", color: "#fff", padding: "6px 14px", fontSize: 12, marginTop: 8 }}
                >
                  Copier les identifiants
                </button>
              </div>
            )}

            {[
              { label: "Nom complet", key: "nom", type: "text", required: true },
              { label: "Email", key: "email", type: "email", required: true },
              { label: "Téléphone (optionnel)", key: "phone", type: "tel", required: false },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>
                  {f.label} {f.required && <span style={{ color: "#D85A30" }}>*</span>}
                </label>
                <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} style={styles.input} placeholder={f.label} />
              </div>
            ))}

            <button
              onClick={handleCreer}
              disabled={loading}
              style={{ ...styles.btn, background: ROLES[roleACreer]?.color, color: "#fff", width: "100%", marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Création…" : `Créer ce ${ROLES[roleACreer]?.label}`}
            </button>

            <div style={{ fontSize: 12, color: "#888", marginTop: 12 }}>
              Le mot de passe est généré automatiquement et doit être transmis au nouveau membre.
            </div>
          </div>
        </div>

        {/* Liste des membres créés */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Membres créés par moi</span>
            <span style={{ fontSize: 12, color: "#888" }}>{membresCreés.length}</span>
          </div>
          <div style={{ padding: 16, maxHeight: 400, overflowY: "auto" }}>
            {listLoading ? <Spinner /> : membresCreés.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "#aaa", fontSize: 13 }}>Aucun membre créé</div>
            ) : membresCreés.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < membresCreés.length - 1 ? "1px solid #f5f4f0" : "none" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1917" }}>{m.nom}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{m.email} · {ROLES[m.role]?.label || m.role}</div>
                </div>
                <ActiveBadge statut={m.statut} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE SIMULATEUR
// ══════════════════════════════════════════════════════════════════════════════
function SimulatePage({ currentRole, onRoleChange }) {
  const [adhesion, setAdhesion]     = useState(15000);
  const [cotisation, setCotisation] = useState(5000);
  const [members, setMembers]       = useState(10);
  const [ca, setCa]                 = useState(500000);

  const renderResult = () => {
    if (currentRole === "BUREAU_CENTRALE") {
      const total = members * 2000;
      return (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#1a1917" }}>Bureau Centrale — gains estimés</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0efe9" }}>
            <span style={{ fontSize: 13 }}>Frais adhésion ({members} × 2 000 F)</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
            <span style={{ fontWeight: 600 }}>Total estimé</span>
            <span style={{ fontWeight: 700, color: "#7F77DD" }}>{fmt(total)}</span>
          </div>
        </div>
      );
    }
    if (currentRole === "SOUSCRIPTEUR") {
      return <div style={{ textAlign: "center", padding: 24, color: "#aaa", fontSize: 13 }}>Le souscripteur ne perçoit aucune commission.</div>;
    }
    const ga = members * adhesion * 0.10;
    const gc = members * cotisation * 0.05;
    const gb = ca * 0.015;
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#1a1917" }}>Gains estimés — {ROLES[currentRole]?.label}</div>
        {[
          { label: `Adhésion (${members} × ${fmt(adhesion)} × 10%)`,       val: fmt(ga), color: "#1D9E75" },
          { label: `Cotisation (${members} × ${fmt(cotisation)} × 5%)`,    val: fmt(gc), color: "#378ADD" },
          { label: `Bonus réseau (CA ${fmt(ca)} × 1,5%)`,                  val: fmt(gb), color: "#BA7517" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0efe9" }}>
            <span style={{ fontSize: 13, color: "#555" }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.val}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
          <span style={{ fontWeight: 600 }}>Total mensuel estimé</span>
          <span style={{ fontWeight: 700, color: "#7F77DD" }}>{fmt(ga + gc + gb)}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#1a1917" }}>Simuler un autre rôle</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(ROLES).map(([k, r]) => (
            <button key={k} onClick={() => onRoleChange(k)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", borderColor: currentRole === k ? "#7F77DD" : "#e8e7e2", background: currentRole === k ? "#7F77DD" : "#fff", color: currentRole === k ? "#fff" : "#555", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardHeader}><span style={{ fontSize: 13, fontWeight: 600 }}>Simulateur de commissions</span></div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Montant d'adhésion (FCFA)",    val: adhesion,   set: setAdhesion },
              { label: "Cotisation mensuelle (FCFA)",  val: cotisation, set: setCotisation },
              { label: "Nombre de membres directs",    val: members,    set: setMembers },
              { label: "CA mensuel réseau (FCFA)",     val: ca,         set: setCa },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#888" }}>{f.label}</label>
                <input type="number" value={f.val} onChange={e => f.set(parseFloat(e.target.value) || 0)} style={styles.input} />
              </div>
            ))}
          </div>
          <div style={{ background: "#faf9f6", borderRadius: 10, padding: 20 }}>
            {renderResult()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",    label: "Tableau de bord",  icon: "◉" },
  { id: "network",      label: "Mon réseau",        icon: "◈" },
  { id: "creer",        label: "Créer un membre",   icon: "+" },
  { id: "commissions",  label: "Commissions",       icon: "◎" },
  { id: "bonus",        label: "Bonus mensuel",     icon: "◆" },
  { id: "paiement",     label: "Payer",             icon: "◑" },
  { id: "invite",       label: "Lien d'invitation", icon: "◇" },
  { id: "history",      label: "Historique",        icon: "○" },
  { id: "simulate",     label: "Simuler rôle",      icon: "◐" },
];

// ══════════════════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [membre, setMembre] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage]   = useState("dashboard");
  const [simRole, setSimRole] = useState(null);

  useEffect(() => {
    const token        = localStorage.getItem("cnepeci_token");
    const membreStored = localStorage.getItem("cnepeci_membre");

    if (!token || !membreStored) { setChecking(false); return; }

    // Vérifier le token via /profile (endpoint authentifié)
    apiFetch("/profile")
      .then(data => {
        if (data?.success) {
          try { setMembre(JSON.parse(membreStored)); } catch { /* ignore */ }
        } else {
          localStorage.removeItem("cnepeci_token");
          localStorage.removeItem("cnepeci_membre");
        }
      })
      .catch(() => {
        localStorage.removeItem("cnepeci_token");
        localStorage.removeItem("cnepeci_membre");
      })
      .finally(() => setChecking(false));
  }, []);

  const role     = simRole || membre?.role || "SOUSCRIPTEUR";
  const roleInfo = ROLES[role] || ROLES.SOUSCRIPTEUR;
  const pageTitle = NAV_ITEMS.find(n => n.id === page)?.label || "Tableau de bord";

  const handleLogout = () => {
    localStorage.removeItem("cnepeci_token");
    localStorage.removeItem("cnepeci_membre");
    setMembre(null);
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <Spinner />
    </div>
  );

  if (!membre) return <AuthPage onAuth={m => setMembre(m)} />;

  // Masquer "Créer un membre" si le rôle ne peut pas créer
  const navVisible = NAV_ITEMS.filter(item =>
    item.id !== "creer" || !!CREATION_MAP[membre.role]
  );

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
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-.2px" }}>CNEPECI Business</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>Réseau indépendant</div>
        </div>

        <div style={{ margin: "12px 14px", padding: "6px 10px", background: roleInfo.color, borderRadius: 6, fontSize: 11, fontWeight: 500, textAlign: "center", color: "#fff" }}>
          {roleInfo.label.toUpperCase()}
        </div>

        <nav style={{ flex: 1, padding: "6px 0", overflowY: "auto" }}>
          {navVisible.map(item => (
            <div
              key={item.id}
              onClick={() => { setPage(item.id); if (item.id !== "simulate") setSimRole(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 20px", cursor: "pointer", fontSize: 13,
                color: page === item.id ? "#c8b8ff" : "rgba(255,255,255,.6)",
                background: page === item.id ? "rgba(127,119,221,.15)" : "transparent",
                borderLeft: `2px solid ${page === item.id ? "#7F77DD" : "transparent"}`,
                transition: "all .15s",
              }}
            >
              <span style={{ width: 16, textAlign: "center", fontSize: 13 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div
          onClick={handleLogout}
          style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 12, color: "rgba(255,255,255,.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          <span>⎋</span> Déconnexion
        </div>
      </aside>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1917" }}>{pageTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#888" }}>{membre.nom}</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: roleInfo.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600 }}>
              {roleInfo.abbr}
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
