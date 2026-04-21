// src/pages/AdminCnepeci.jsx
// ─────────────────────────────────────────────────────────────
//  Vue admin : réseau CNEPECI
//  Rôles : BUREAU_CENTRALE → COORDONNATEUR_GENERAL → BUREAU_LOCAL
//          → COORDONNATEUR_LOCAL → PASTEUR → SOUSCRIPTEUR
//  + Calcul bonus mensuel / Stats réseau / Paiements cash
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import axios from "axios";

const API         = import.meta.env.VITE_API_URL || "http://localhost:3001";
const agentToken = () =>
  localStorage.getItem("cnepeci_token") ||
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token");

// ── Palette ──────────────────────────────────────────────────
const C = {
  purple:  "#7F77DD", purpleL: "#EEEDFE",
  green:   "#1D9E75", greenL:  "#E6F8F2",
  blue:    "#378ADD", blueL:   "#E6F1FB",
  gold:    "#BA7517", goldL:   "#FEF3CD",
  orange:  "#D85A30", orangeL: "#FEF0EA",
  slate:   "#64748B", dark:    "#0F172A",
  border:  "#E2E8F0", bg:      "#F8FAFC",
  red:     "#DC2626", redL:    "#FEF2F2",
  grey:    "#888780", greyL:   "#F4F4F4",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Config rôles ─────────────────────────────────────────────
const ROLE_CONFIG = {
  BUREAU_CENTRALE:       { label: "Bureau Centrale",       icon: "🏛️",  color: C.purple, bg: C.purpleL },
  COORDONNATEUR_GENERAL: { label: "Coordonnateur Général", icon: "🎯",  color: C.green,  bg: C.greenL  },
  BUREAU_LOCAL:          { label: "Bureau Local",          icon: "🏢",  color: C.blue,   bg: C.blueL   },
  COORDONNATEUR_LOCAL:   { label: "Coordonnateur Local",   icon: "📍",  color: C.gold,   bg: C.goldL   },
  PASTEUR:               { label: "Pasteur d'Église",      icon: "⛪",  color: C.orange, bg: C.orangeL },
  SOUSCRIPTEUR:          { label: "Souscripteur Final",    icon: "👤",  color: C.slate,  bg: C.greyL   },
};

const STATUS_CONFIG = {
  ACTIVE:    { label: "Actif",      color: C.green,  bg: C.greenL },
  SUSPENDED: { label: "Suspendu",   color: C.red,    bg: C.redL   },
  PENDING:   { label: "En attente", color: C.gold,   bg: C.goldL  },
};

const TYPE_CONFIG = {
  adhesion:   { label: "Adhésion",   color: C.green,  bg: C.greenL  },
  cotisation: { label: "Cotisation", color: C.blue,   bg: C.blueL   },
  bonus:      { label: "Bonus",      color: C.gold,   bg: C.goldL   },
  bureau:     { label: "Bureau",     color: C.purple, bg: C.purpleL },
};

// ── Badges ────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = ROLE_CONFIG[role];
  if (!r) return null;
  return (
    <span style={{ background: r.bg, color: r.color, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {r.icon} {r.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = TYPE_CONFIG[type] || { label: type, color: C.slate, bg: C.greyL };
  return (
    <span style={{ background: t.bg, color: t.color, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {t.label}
    </span>
  );
}

// ── Composants UI ────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #E2E8F0", borderTop: `3px solid ${C.purple}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  const colors = {
    error:   { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
    success: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
    info:    { bg: C.purpleL, text: C.purple,  border: "#C4C0F8" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.text, fontSize: 16, lineHeight: 1 }}>×</button>}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, color: C.slate, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: "0 0 2px" }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: C.slate, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, count, color = C.purple, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: C.dark, margin: 0 }}>{title}</h2>
        {count !== undefined && (
          <span style={{ background: color + "22", color, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999 }}>
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Tableau membres ──────────────────────────────────────────
function MembresTable({ membres, onRefresh }) {
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [loading, setLoading]       = useState(null);
  const [alert, setAlert]           = useState(null);

  const filtered = membres.filter(m => {
    const matchSearch = !search ||
      m.nom?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search);
    const matchRole = filterRole === "ALL" || m.role === filterRole;
    return matchSearch && matchRole;
  });

  async function handleAction(id, action) {
    setLoading(id + action);
    try {
      await axios.patch(
        `${API}/api/cnepeci/admin/membres/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      setAlert({ type: "success", msg: `Membre ${action === "suspend" ? "suspendu" : "réactivé"} avec succès.` });
      onRefresh();
    } catch (e) {
      setAlert({ type: "error", msg: e.response?.data?.message || "Erreur lors de l'action." });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} onClose={() => setAlert(null)} />}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Rechercher nom, email, téléphone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: "9px 13px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }}
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          style={{ padding: "9px 13px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none" }}
        >
          <option value="ALL">Tous les rôles</option>
          {Object.entries(ROLE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Membre", "Rôle", "Email / Tél.", "Statut", "Parrain", "Inscription", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40, color: C.slate }}>
                  Aucun membre trouvé
                </td>
              </tr>
            ) : filtered.map((m, i) => (
              <tr key={m.id || i} style={{ borderBottom: `1px solid ${C.border}`, transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: (ROLE_CONFIG[m.role]?.color || C.purple) + "22", color: ROLE_CONFIG[m.role]?.color || C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
                      {m.nom?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <span style={{ fontWeight: 700, color: C.dark }}>{m.nom || "—"}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}><RoleBadge role={m.role} /></td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ color: C.dark, fontSize: 12 }}>{m.email}</div>
                  <div style={{ color: C.slate, fontSize: 11 }}>{m.phone || "—"}</div>
                </td>
                <td style={{ padding: "12px 14px" }}><StatusBadge status={m.statut || m.status} /></td>
                <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12 }}>{m.parrain_nom || "—"}</td>
                <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(m.created_at)}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(m.statut === "ACTIVE" || m.status === "ACTIVE") ? (
                      <button
                        onClick={() => handleAction(m.id, "suspend")}
                        disabled={loading === m.id + "suspend"}
                        style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.red}`, background: "#fff", color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {loading === m.id + "suspend" ? "…" : "Suspendre"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(m.id, "reactivate")}
                        disabled={loading === m.id + "reactivate"}
                        style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.green}`, background: "#fff", color: C.green, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {loading === m.id + "reactivate" ? "…" : "Réactiver"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: C.slate, marginTop: 10 }}>
        {filtered.length} membre{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        {membres.length !== filtered.length && ` sur ${membres.length}`}
      </p>
    </div>
  );
}

// ── Tableau paiements ─────────────────────────────────────────
function PaiementsTable({ paiements }) {
  const [search, setSearch] = useState("");

  const filtered = paiements.filter(p =>
    !search ||
    p.membre_nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.tx_ref?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input
        placeholder="🔍 Rechercher membre, référence…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 14, padding: "9px 13px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Date", "Membre", "Type", "Montant", "Méthode", "Référence", "Statut"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: C.slate }}>Aucun paiement trouvé</td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id || i} style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <td style={{ padding: "11px 14px", color: C.slate, fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(p.created_at)}</td>
                <td style={{ padding: "11px 14px", fontWeight: 700, color: C.dark }}>{p.membre_nom || "—"}</td>
                <td style={{ padding: "11px 14px" }}><TypeBadge type={p.type} /></td>
                <td style={{ padding: "11px 14px", fontWeight: 800, color: C.dark }}>{fmt(p.montant)} F</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ background: C.greyL, color: C.slate, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
                    {p.methode || p.provider || "—"}
                  </span>
                </td>
                <td style={{ padding: "11px 14px", color: C.slate, fontSize: 11, fontFamily: "monospace" }}>{p.tx_ref || "—"}</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{
                    background: p.statut === "success" || p.status === "success" ? C.greenL : C.goldL,
                    color: p.statut === "success" || p.status === "success" ? C.green : C.gold,
                    padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700
                  }}>
                    {p.statut === "success" || p.status === "success" ? "✅ Validé" : "⏳ En attente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: C.slate, marginTop: 10 }}>{filtered.length} paiement{filtered.length > 1 ? "s" : ""}</p>
    </div>
  );
}

// ── Tableau commissions ───────────────────────────────────────
function CommissionsTable({ commissions }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {["Date", "Bénéficiaire", "Rôle", "Type", "Montant", "Source"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {commissions.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: C.slate }}>Aucune commission</td></tr>
          ) : commissions.map((c, i) => (
            <tr key={c.id || i} style={{ borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              <td style={{ padding: "11px 14px", color: C.slate, fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(c.created_at)}</td>
              <td style={{ padding: "11px 14px", fontWeight: 700, color: C.dark }}>{c.beneficiaire_nom || "—"}</td>
              <td style={{ padding: "11px 14px" }}><RoleBadge role={c.beneficiaire_role} /></td>
              <td style={{ padding: "11px 14px" }}><TypeBadge type={c.type} /></td>
              <td style={{ padding: "11px 14px", fontWeight: 800, color: C.green }}>{fmt(c.montant)} F</td>
              <td style={{ padding: "11px 14px", color: C.slate, fontSize: 12 }}>{c.source_nom || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function AdminCnepeci() {
  const [tab, setTab]               = useState("overview");
  const [stats, setStats]           = useState(null);
  const [membres, setMembres]       = useState([]);
  const [paiements, setPaiements]   = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [bureauCentrale, setBureauCentrale] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [alert, setAlert]           = useState(null);

  const headers = { Authorization: `Bearer ${agentToken()}` };

  // ── Chargement données ────────────────────────────────────
  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, membresRes, paiementsRes, commissionsRes, bureauRes] = await Promise.allSettled([
        axios.get(`${API}/api/cnepeci/admin/stats`,        { headers }),
        axios.get(`${API}/api/cnepeci/admin/membres`,      { headers }),
        axios.get(`${API}/api/cnepeci/paiements?limit=100`,{ headers }),
        axios.get(`${API}/api/cnepeci/commissions?limit=100`,{ headers }),
        axios.get(`${API}/api/cnepeci/admin/bureau-centrale`,{ headers }),
      ]);

      if (statsRes.status === "fulfilled")       setStats(statsRes.value.data?.data || statsRes.value.data || null);
      if (membresRes.status === "fulfilled")     setMembres(membresRes.value.data?.membres || membresRes.value.data?.data || []);
      if (paiementsRes.status === "fulfilled")   setPaiements(paiementsRes.value.data?.paiements || paiementsRes.value.data?.data || []);
      if (commissionsRes.status === "fulfilled") setCommissions(commissionsRes.value.data?.commissions || commissionsRes.value.data?.data || []);
      if (bureauRes.status === "fulfilled")      setBureauCentrale(bureauRes.value.data?.data || null);
    } catch (e) {
      setAlert({ type: "error", msg: "Erreur lors du chargement des données." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // ── Calcul bonus mensuel ──────────────────────────────────
  async function handleCalculerBonus() {
    if (!window.confirm("Déclencher le calcul du bonus mensuel CNEPECI (1,5%) pour tous les membres actifs ?")) return;
    setBonusLoading(true);
    try {
      const res = await axios.post(`${API}/api/cnepeci/admin/calcul-bonus`, {}, { headers });
      setAlert({ type: "success", msg: res.data?.message || "Bonus mensuel calculé avec succès !" });
      loadAll();
    } catch (e) {
      setAlert({ type: "error", msg: e.response?.data?.message || "Erreur lors du calcul du bonus." });
    } finally {
      setBonusLoading(false);
    }
  }

  // ── Counts par rôle ───────────────────────────────────────
  const roleCount = membres.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {});

  const totalCA = paiements
    .filter(p => p.statut === "success" || p.status === "success")
    .reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);

  const totalCommissions = commissions.reduce((s, c) => s + (parseFloat(c.montant) || 0), 0);

  // ── Tabs config ───────────────────────────────────────────
  const TABS = [
    { id: "overview",     label: "📊 Vue d'ensemble" },
    { id: "membres",      label: `👥 Membres (${membres.length})` },
    { id: "paiements",    label: `💰 Paiements (${paiements.length})` },
    { id: "commissions",  label: `🏆 Commissions` },
    { id: "bureau",       label: "🏛️ Bureau Centrale" },
  ];

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── En-tête ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              ⛪
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>Réseau CNEPECI</h1>
              <p style={{ fontSize: 13, color: C.slate, margin: 0 }}>
                Coordination Nationale des Églises & Paroisses — Administration
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleCalculerBonus}
          disabled={bonusLoading}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: bonusLoading ? C.greyL : `linear-gradient(135deg, ${C.purple}, #5B54C8)`, color: bonusLoading ? C.slate : "#fff", fontWeight: 700, fontSize: 13, cursor: bonusLoading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
        >
          {bonusLoading ? "⏳ Calcul en cours…" : "🎁 Calculer Bonus Mensuel (1,5%)"}
        </button>
      </div>

      {alert && <Alert type={alert.type} msg={alert.msg} onClose={() => setAlert(null)} />}

      {/* ── Navigation tabs ──────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `2px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: tab === t.id ? `2px solid ${C.purple}` : "2px solid transparent",
              background: "none",
              color: tab === t.id ? C.purple : C.slate,
              fontWeight: tab === t.id ? 800 : 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: -2,
              whiteSpace: "nowrap",
              transition: "color .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ════════════════════════════════════════════════
              TAB : Vue d'ensemble
          ════════════════════════════════════════════════ */}
          {tab === "overview" && (
            <div>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
                <StatCard icon="👥" label="Membres actifs" value={fmt(membres.filter(m => m.statut === "ACTIVE" || m.status === "ACTIVE").length)} sub={`${membres.length} inscrits au total`} color={C.purple} />
                <StatCard icon="💰" label="CA total" value={`${fmt(totalCA)} F`} sub="Paiements validés" color={C.green} />
                <StatCard icon="🏆" label="Commissions versées" value={`${fmt(totalCommissions)} F`} sub="Toutes commissions confondues" color={C.gold} />
                <StatCard icon="📋" label="Paiements enregistrés" value={fmt(paiements.length)} sub={`${paiements.filter(p => p.statut === "success" || p.status === "success").length} validés`} color={C.blue} />
              </div>

              {/* Répartition par rôle */}
              <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                <SectionHeader title="Répartition par rôle" color={C.purple} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                    <div key={role} style={{ background: config.bg, border: `1px solid ${config.color}22`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{config.icon}</span>
                      <div>
                        <p style={{ fontSize: 11, color: config.color, fontWeight: 700, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: ".5px" }}>{config.label}</p>
                        <p style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: 0 }}>{roleCount[role] || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats API si disponibles */}
              {stats && (
                <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
                  <SectionHeader title="Statistiques réseau (ce mois)" color={C.blue} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {Object.entries(stats).map(([key, val]) => (
                      <div key={key} style={{ background: C.bg, borderRadius: 10, padding: "12px 16px" }}>
                        <p style={{ fontSize: 11, color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 4px" }}>
                          {key.replace(/_/g, " ")}
                        </p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>
                          {typeof val === "number" ? fmt(val) : String(val)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB : Membres
          ════════════════════════════════════════════════ */}
          {tab === "membres" && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
              <SectionHeader
                title="Membres du réseau"
                count={membres.length}
                color={C.purple}
                action={
                  <button onClick={loadAll} style={{ padding: "6px 14px", border: `1px solid ${C.border}`, borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: C.slate }}>
                    🔄 Actualiser
                  </button>
                }
              />
              <MembresTable membres={membres} onRefresh={loadAll} />
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB : Paiements
          ════════════════════════════════════════════════ */}
          {tab === "paiements" && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
              <SectionHeader title="Historique des paiements" count={paiements.length} color={C.blue} />
              <PaiementsTable paiements={paiements} />
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB : Commissions
          ════════════════════════════════════════════════ */}
          {tab === "commissions" && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
                <StatCard icon="🏆" label="Total commissions" value={`${fmt(totalCommissions)} F`} sub={`${commissions.length} entrées`} color={C.gold} />
                <StatCard icon="🎁" label="Bonus versés" value={`${fmt(commissions.filter(c => c.type === "bonus").reduce((s, c) => s + (parseFloat(c.montant) || 0), 0))} F`} sub="Bonus 1,5% mensuel" color={C.purple} />
              </div>
              <SectionHeader title="Détail des commissions" color={C.gold} />
              <CommissionsTable commissions={commissions} />
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB : Bureau Centrale
          ════════════════════════════════════════════════ */}
          {tab === "bureau" && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
              <SectionHeader title="Bureau Centrale & Coordonnateurs Généraux" color={C.purple} />
              {!bureauCentrale ? (
                <p style={{ color: C.slate, textAlign: "center", padding: 40 }}>Aucune donnée disponible</p>
              ) : (
                <div>
                  {/* Coordonnateurs généraux */}
                  {bureauCentrale.coordonnateurs_generaux?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>
                        🎯 Coordonnateurs Généraux ({bureauCentrale.coordonnateurs_generaux.length})
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                        {bureauCentrale.coordonnateurs_generaux.map((m, i) => (
                          <div key={i} style={{ background: C.greenL, border: `1px solid ${C.green}33`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.green + "22", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                              {m.nom?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: C.dark, fontSize: 13, margin: "0 0 2px" }}>{m.nom}</p>
                              <p style={{ color: C.slate, fontSize: 11, margin: "0 0 4px" }}>{m.email}</p>
                              <StatusBadge status={m.statut || m.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Membres bureau centrale */}
                  {bureauCentrale.membres_bureau?.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>
                        🏛️ Membres Bureau Centrale ({bureauCentrale.membres_bureau.length})
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                        {bureauCentrale.membres_bureau.map((m, i) => (
                          <div key={i} style={{ background: C.purpleL, border: `1px solid ${C.purple}33`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.purple + "22", color: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                              {m.nom?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: C.dark, fontSize: 13, margin: "0 0 2px" }}>{m.nom}</p>
                              <p style={{ color: C.slate, fontSize: 11, margin: "0 0 4px" }}>{m.email}</p>
                              <StatusBadge status={m.statut || m.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats globales bureau */}
                  {bureauCentrale.stats && (
                    <div style={{ marginTop: 20, background: C.bg, borderRadius: 10, padding: "16px 18px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>Statistiques bureau</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                        {Object.entries(bureauCentrale.stats).map(([key, val]) => (
                          <div key={key} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 10, color: C.slate, fontWeight: 600, textTransform: "uppercase", margin: "0 0 4px" }}>{key.replace(/_/g, " ")}</p>
                            <p style={{ fontSize: 17, fontWeight: 800, color: C.dark, margin: 0 }}>{typeof val === "number" ? fmt(val) : String(val)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
