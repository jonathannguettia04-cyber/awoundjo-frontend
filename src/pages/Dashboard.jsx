import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { statsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PlanBadge, TypeBadge, MethodBadge } from "../components/Badge";
import PlanModal from "./PlanModal";

const API = import.meta.env.VITE_API_URL || "";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "k";
  return v.toLocaleString("fr-FR");
};
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

/* ─── Sparkline SVG ───────────────────────────────────────────────── */
function Sparkline({ data = [], color = "#10b981", height = 48 }) {
  if (data.length < 2) return null;
  const vals = data.map((d) => Number(d.revenue || 0));
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals);
  const w = 180;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = height - ((v - min) / (max - min || 1)) * (height - 6) - 3;
    return `${x},${y}`;
  });
  const path = `M${pts.join(" L")}`;
  const fill = `M${pts[0]} L${pts.join(" L")} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.replace("#", "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Donut Chart ─────────────────────────────────────────────────── */
function DonutChart({ segments, size = 88 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 34;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx="44" cy="44" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "all 0.8s ease" }}
          />
        );
        offset += dash + 1.5;
        return el;
      })}
      <text x="44" y="40" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="inherit">
        {total.toLocaleString("fr-FR")}
      </text>
      <text x="44" y="54" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="inherit">
        clients
      </text>
    </svg>
  );
}

/* ─── Barre de progression slim ───────────────────────────────────── */
function SlimBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 99, height: 4, marginTop: 6 }}>
      <div style={{ width: `${pct}%`, height: 4, borderRadius: 99, background: color, transition: "width 0.8s ease" }} />
    </div>
  );
}

/* ─── Médaille podium ─────────────────────────────────────────────── */
const MEDALS = [
  { bg: "linear-gradient(135deg,#f59e0b,#d97706)", text: "#fff", label: "1er" },
  { bg: "linear-gradient(135deg,#94a3b8,#64748b)", text: "#fff", label: "2e" },
  { bg: "linear-gradient(135deg,#c77c42,#a25d2c)", text: "#fff", label: "3e" },
  { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.5)", label: "4e" },
  { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.5)", label: "5e" },
];

/* ═══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [plans, setPlans] = useState([]);
  const [showPlans, setShowPlans] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const token = localStorage.getItem("token");
  const authHeader = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  function fetchPlans() {
    fetch(`${API}/api/plans?all=true`, { headers: authHeader })
      .then((r) => r.json())
      .then(({ data }) => setPlans(data || []))
      .catch(console.error);
  }

  useEffect(() => { if (isAdmin) fetchPlans(); }, [isAdmin]);

  async function togglePlanActive(plan) {
    try {
      await fetch(`${API}/api/plans/${plan.id}`, {
        method: "PUT", headers: authHeader,
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      fetchPlans();
    } catch (err) { console.error(err); }
  }

  async function deletePlan(plan) {
    if (!window.confirm(`Supprimer la formule "${plan.name}" ?`)) return;
    try {
      const res = await fetch(`${API}/api/plans/${plan.id}`, { method: "DELETE", headers: authHeader });
      const json = await res.json();
      alert(json.message || "Supprimée");
      fetchPlans();
    } catch (err) { console.error(err); }
  }

  const reload = () => {
    setError(""); setLoading(true);
    statsAPI.getStats()
      .then(({ data }) => setData(data))
      .catch(() => setError("Impossible de charger le tableau de bord"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  /* ── CSS-in-JS global styles ──────────────────────────────────── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    .awj-dash * { box-sizing: border-box; }
    .awj-dash { font-family: 'Outfit', system-ui, sans-serif; background: #0d1117; min-height: 100vh; color: #f0f0f0; }
    .awj-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; transition: border-color 0.2s, transform 0.2s; }
    .awj-card:hover { border-color: rgba(255,255,255,0.13); }
    .awj-card-hover:hover { transform: translateY(-2px); border-color: rgba(16,185,129,0.25) !important; }
    .awj-btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s, transform 0.15s; }
    .awj-btn-primary:hover { opacity: 0.88; }
    .awj-btn-primary:active { transform: scale(0.97); }
    .awj-btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.2s; }
    .awj-btn-ghost:hover { background: rgba(255,255,255,0.10); }
    .awj-link { color: #10b981; text-decoration: none; font-size: 12px; font-weight: 500; }
    .awj-link:hover { text-decoration: underline; }
    .awj-row-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); text-decoration: none; transition: background 0.15s; }
    .awj-row-item:last-child { border-bottom: none; }
    .awj-row-item:hover { background: rgba(255,255,255,0.04); }
    .awj-avatar { width: 38px; height: 38px; border-radius: 10px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.25); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #10b981; flex-shrink: 0; }
    .awj-section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 12px; }
    .awj-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 6px; }
    .awj-pulse { animation: awjPulse 2.5s ease-in-out infinite; }
    @keyframes awjPulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
    .awj-fade-in { animation: awjFadeIn 0.5s ease both; }
    @keyframes awjFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    .awj-number { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
    .awj-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0; }
    .scroll-x { overflow-x: auto; }
    .scroll-x::-webkit-scrollbar { height: 4px; }
    .scroll-x::-webkit-scrollbar-track { background: transparent; }
    .scroll-x::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
    .awj-hero-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .awj-clients-row { display: grid; grid-template-columns: auto 1fr; gap: 16px; margin-bottom: 16px; }
    .awj-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .awj-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .awj-header-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; gap: 16px; flex-wrap: wrap; }
    .awj-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .awj-plan-row { display: flex; gap: 12px; align-items: flex-start; }
    .awj-plan-row-actions { display: flex; gap: 6px; flex-shrink: 0; }
    @media (max-width: 768px) {
      .awj-dash > div { padding: 16px 14px 48px !important; }
      .awj-hero-grid { grid-template-columns: 1fr !important; }
      .awj-clients-row { grid-template-columns: 1fr !important; }
      .awj-stat-grid { grid-template-columns: 1fr 1fr !important; }
      .awj-bottom-grid { grid-template-columns: 1fr !important; }
      .awj-number { font-size: 22px !important; }
      .awj-row-item { padding: 12px 14px !important; gap: 10px !important; }
      .awj-plan-row { flex-wrap: wrap; }
      .awj-plan-row-actions { flex-wrap: wrap; }
      h1 { font-size: 20px !important; }
    }
    @media (max-width: 480px) {
      .awj-dash > div { padding: 12px 10px 48px !important; }
      .awj-stat-grid { grid-template-columns: 1fr 1fr !important; }
      .awj-card { border-radius: 12px !important; }
      .awj-header-actions { width: 100%; }
      .awj-header-actions .awj-btn-primary,
      .awj-header-actions .awj-btn-ghost { width: 100%; justify-content: center; }
      .awj-row-item { padding: 10px 12px !important; }
      .awj-avatar { width: 32px !important; height: 32px !important; font-size: 12px !important; }
      .awj-plan-row-actions { width: 100%; }
    }
  `;

  /* ── Loading ──────────────────────────────────────────────────── */
  if (loading) return (
    <>
      <style>{css}</style>
      <div className="awj-dash" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "3px solid rgba(16,185,129,0.2)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Chargement du tableau de bord…</p>
        </div>
      </div>
    </>
  );

  if (error) return (
    <>
      <style>{css}</style>
      <div className="awj-dash" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="awj-card" style={{ padding: 32, textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 20, fontSize: 14 }}>{error}</p>
          <button className="awj-btn-primary" onClick={reload} style={{ margin: "0 auto" }}>↻ Réessayer</button>
        </div>
      </div>
    </>
  );

  const {
    clients: cs = {},
    payments: ps = {},
    top_agents = [],
    last_clients = [],
    last_payments = [],
    evolution = [],
  } = data ?? {};

  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";

  const planColors = {
    ESSENTIELLE: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "🌱" },
    IVOIRIENNE: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", label: "🌿" },
    TURQUOISE: { color: "#06b6d4", bg: "rgba(6,182,212,0.12)", label: "💎" },
  };

  const donutSegments = [
    { value: Number(cs.plan_essentielle ?? 0), color: "#10b981" },
    { value: Number(cs.plan_ivoirienne ?? 0), color: "#8b5cf6" },
    { value: Number(cs.plan_turquoise ?? 0), color: "#06b6d4" },
  ];

  const totalClients = Number(cs.total_clients ?? 0);

  return (
    <>
      <style>{css}</style>
      <div className="awj-dash awj-fade-in">
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 60px", width: "100%" }}>

          {/* ══ HEADER ══════════════════════════════════════════════ */}
          <div style={{}}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} className="awj-pulse" />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                  {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2 }}>
                {greeting},{" "}
                <span style={{ background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {user?.name?.split(" ")[0]}
                </span>{" "}👋
              </h1>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>
                Votre plateforme Awoundjô — vue d'ensemble
              </p>
            </div>
            <div className="awj-header-actions">
              {isAdmin && (
                <>
                  <button className="awj-btn-ghost" onClick={() => setShowPlans((v) => !v)}>
                    <span>📋</span> Formules
                  </button>
                  <Link to="/agents" style={{ textDecoration: "none" }}>
                    <button className="awj-btn-ghost">
                      <span>👥</span> Agents
                    </button>
                  </Link>
                  <Link to="/admin/broadcasts" style={{ textDecoration: "none" }}>
                    <button className="awj-btn-ghost">
                      <span>📣</span> Broadcasts
                    </button>
                  </Link>
                </>
              )}
              <Link to="/clients/new" style={{ textDecoration: "none" }}>
                <button className="awj-btn-primary">
                  <span style={{ fontSize: 16 }}>+</span> Nouveau client
                </button>
              </Link>
            </div>
          </div>

          {/* ══ FORMULES (admin) ════════════════════════════════════ */}
          {isAdmin && showPlans && (
            <div className="awj-card awj-fade-in" style={{ marginBottom: 24, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Gestion des formules</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{plans.length} formule(s) configurée(s)</p>
                </div>
                <button className="awj-btn-primary" onClick={() => { setEditingPlan(null); setPlanModal(true); }}>+ Nouvelle</button>
              </div>
              {plans.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
                  Aucune formule. Créez la première !
                </div>
              ) : plans.map((plan) => (
                <div key={plan.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: plan.is_active ? 1 : 0.45 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{plan.name}</span>
                      {!plan.is_active && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", padding: "2px 8px", borderRadius: 6 }}>Inactif</span>}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                        Adhésion : <strong style={{ color: plan.adhesion_price === 0 ? "#10b981" : "rgba(255,255,255,0.75)" }}>
                          {plan.adhesion_price === 0 ? "Gratuit" : `${Number(plan.adhesion_price).toLocaleString("fr-FR")} FCFA`}
                        </strong>
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                        Cotisation : <strong style={{ color: "rgba(255,255,255,0.75)" }}>{Number(plan.monthly_price).toLocaleString("fr-FR")} FCFA/mois</strong>
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                        Couverture : <strong style={{ color: "#10b981" }}>{plan.coverage_percent}%</strong>
                      </span>
                    </div>
                    {plan.benefits?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {plan.benefits.map((b) => (
                          <span key={b.category} style={{ fontSize: 11, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 8px", borderRadius: 6 }}>
                            {b.category.replace(/_/g, " ")}
                            {b.coverage_percent != null && ` ${b.coverage_percent}%`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => togglePlanActive(plan)} style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, background: plan.is_active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)", color: plan.is_active ? "#10b981" : "rgba(255,255,255,0.4)" }}>
                      {plan.is_active ? "✓ Actif" : "○ Inactif"}
                    </button>
                    <button onClick={() => { setEditingPlan(plan); setPlanModal(true); }} style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>
                      ✏️ Modifier
                    </button>
                    <button onClick={() => deletePlan(plan)} style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAdmin && planModal && (
            <PlanModal
              plan={editingPlan}
              onClose={() => setPlanModal(false)}
              onSaved={() => { fetchPlans(); setPlanModal(false); }}
            />
          )}

          {/* ══ HERO ROW — Revenu total + sparkline ══════════════════ */}
          <div className="awj-hero-grid">

            {/* Revenu Total — carte hero */}
            <div className="awj-card" style={{ padding: "24px 24px 18px", position: "relative", overflow: "hidden", gridColumn: "span 1" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #10b981, #34d399, transparent)" }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 12px" }}>Revenu total</p>
              <div className="awj-number" style={{ color: "#10b981", marginBottom: 4 }}>
                {fmtShort(ps.total_revenue)}
                <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>FCFA</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 16px" }}>{ps.total_payments ?? 0} paiements au total</p>
              <Sparkline data={evolution} color="#10b981" height={44} />
            </div>

            {/* Aujourd'hui */}
            <div className="awj-card" style={{ padding: "24px 24px 18px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #8b5cf6, #a78bfa, transparent)" }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 12px" }}>Aujourd'hui</p>
              <div className="awj-number" style={{ color: "#a78bfa", marginBottom: 4 }}>
                {fmtShort(ps.today_revenue)}
                <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>FCFA</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>{ps.today_payments ?? 0} paiements aujourd'hui</p>
              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Adhésions</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{fmtShort(ps.adhesions_revenue)}</p>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Mensualités</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{fmtShort(ps.mensualites_revenue)}</p>
                </div>
              </div>
            </div>

            {/* Méthodes de paiement */}
            <div className="awj-card" style={{ padding: "24px 24px 18px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #f59e0b, #fbbf24, transparent)" }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Méthodes de paiement</p>
              {[
                { label: "📱 Wave", value: Number(ps.wave_revenue), color: "#f59e0b" },
                { label: "💵 Cash", value: Number(ps.cash_revenue), color: "#10b981" },
              ].map((m) => (
                <div key={m.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{fmtShort(m.value)} FCFA</span>
                  </div>
                  <SlimBar value={m.value} max={Number(ps.total_revenue)} color={m.color} />
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>
                    {ps.total_revenue > 0 ? Math.round((m.value / Number(ps.total_revenue)) * 100) : 0}% du total
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ══ CLIENTS ROW ══════════════════════════════════════════ */}
          <div className="awj-clients-row">

            {/* Donut + légende */}
            <div className="awj-card" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 200 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 16, alignSelf: "flex-start" }}>Répartition</p>
              <DonutChart segments={donutSegments} />
              <div style={{ marginTop: 16, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Essentielle", value: Number(cs.plan_essentielle ?? 0), color: "#10b981" },
                  { label: "Ivoirienne", value: Number(cs.plan_ivoirienne ?? 0), color: "#8b5cf6" },
                  { label: "Turquoise", value: Number(cs.plan_turquoise ?? 0), color: "#06b6d4" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats clients — grille */}
            <div className="awj-stat-grid">
              {[
                { label: "Total clients", value: cs.total_clients ?? 0, sub: "inscrits", color: "#f0f0f0", icon: "👥", to: "/clients" },
                { label: "Actifs", value: cs.actifs ?? 0, sub: "membres actifs", color: "#10b981", icon: "✅", to: "/clients?status=actif" },
                { label: "En attente", value: cs.attente ?? 0, sub: "à valider", color: "#f59e0b", icon: "⏳", to: "/clients?status=attente" },
              ].map((s) => (
                <Link key={s.label} to={s.to} style={{ textDecoration: "none" }}>
                  <div className="awj-card awj-card-hover" style={{ padding: "18px 20px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: 0 }}>{s.label}</p>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                    </div>
                    <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: s.color, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>{s.sub}</p>
                  </div>
                </Link>
              ))}
              {[
                { label: "Essentielle", value: cs.plan_essentielle ?? 0, color: "#10b981", to: "/clients?plan=ESSENTIELLE" },
                { label: "Ivoirienne", value: cs.plan_ivoirienne ?? 0, color: "#8b5cf6", to: "/clients?plan=IVOIRIENNE" },
                { label: "Turquoise", value: cs.plan_turquoise ?? 0, color: "#06b6d4", to: "/clients?plan=TURQUOISE" },
              ].map((s) => (
                <Link key={s.label} to={s.to} style={{ textDecoration: "none" }}>
                  <div className="awj-card awj-card-hover" style={{ padding: "18px 20px", cursor: "pointer" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>{s.label}</p>
                    <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: s.color, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
                    <SlimBar value={Number(s.value)} max={totalClients} color={s.color} />
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
                      {totalClients > 0 ? Math.round((Number(s.value) / totalClients) * 100) : 0}% des membres
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ══ TOP AGENTS (admin) ══════════════════════════════════ */}
          {isAdmin && top_agents?.length > 0 && (
            <div className="awj-card" style={{ marginBottom: 16, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>🏆 Top Agents</p>
                <Link to="/agents" className="awj-link">Gérer →</Link>
              </div>
              <div>
                {top_agents.slice(0, 5).map((a, i) => {
                  const m = MEDALS[i];
                  const maxRev = Number(top_agents[0]?.total_revenue || 1);
                  const pct = Math.round((Number(a.total_revenue) / maxRev) * 100);
                  return (
                    <Link key={a.id} to="/agents" className="awj-row-item" style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: m.text, flexShrink: 0 }}>
                        {m.label}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</p>
                          <p style={{ fontWeight: 800, fontSize: 13, color: "#10b981", margin: 0, flexShrink: 0, marginLeft: 12 }}>{fmtShort(a.total_revenue)} FCFA</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: 99, height: 3 }}>
                            <div style={{ width: `${pct}%`, height: 3, borderRadius: 99, background: i === 0 ? "#f59e0b" : "#10b981", transition: "width 0.8s ease" }} />
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{a.nb_clients} clients</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ TABLES BASSES ═══════════════════════════════════════ */}
          <div className="awj-bottom-grid">

            {/* Derniers clients */}
            <div className="awj-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Derniers clients</p>
                <Link to="/clients" className="awj-link">Voir tout →</Link>
              </div>
              {!last_clients?.length ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13, padding: "32px 0" }}>Aucun client pour l'instant</p>
              ) : last_clients.map((c) => (
                <Link key={c.id} to={`/clients/${c.id}`} className="awj-row-item" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="awj-avatar">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0", fontFamily: "monospace" }}>{c.mutual_number}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    <PlanBadge plan={c.plan} />
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
              <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Link to="/clients/new" className="awj-link">+ Enregistrer un client</Link>
              </div>
            </div>

            {/* Derniers paiements */}
            <div className="awj-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Derniers paiements</p>
                <Link to="/payments" className="awj-link">Voir tout →</Link>
              </div>
              {!last_payments?.length ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13, padding: "32px 0" }}>Aucun paiement pour l'instant</p>
              ) : last_payments.map((p) => (
                <div key={p.id} className="awj-row-item" style={{ cursor: "default" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, background: p.type === "adhesion" ? "rgba(139,92,246,0.15)" : "rgba(6,182,212,0.15)", border: `1px solid ${p.type === "adhesion" ? "rgba(139,92,246,0.25)" : "rgba(6,182,212,0.25)"}` }}>
                    {p.type === "adhesion" ? "📋" : "🔄"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.client_name}</p>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                      <TypeBadge type={p.type} />
                      <MethodBadge method={p.payment_method} />
                      {isAdmin && p.agent_name && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>· {p.agent_name}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: 13, color: "#10b981", margin: 0 }}>{fmtShort(p.amount)} FCFA</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{fmtDate(p.created_at)}</p>
                  </div>
                </div>
              ))}
              <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Link to="/clients" className="awj-link">+ Enregistrer un paiement</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
