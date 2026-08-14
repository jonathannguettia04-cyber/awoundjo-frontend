import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { statsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PlanBadge, TypeBadge, MethodBadge } from "../components/Badge";
import PlanModal from "./PlanModal";
import { ADMIN_BASE } from "../config/adminBase";

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

/* ─── COULEURS DE RÉFÉRENCE (mêmes que Sidebar / Agents) ────────────── */
const NAVY   = "#0e2a49";
const BLUE   = "#1a5fa8";
const TEAL   = "#00c4b4";
const AMBER  = "#d97706";
const RED    = "#dc2626";
const VIOLET = "#7c3aed";
const SLATE_TRACK = "#e2e8f0";

/* ─── SPARKLINE DYNAMIQUE ─────────────────────────────────────────── */
function Sparkline({ data = [], color = TEAL, height = 48 }) {
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
  const gradId = `sg-${color.replace("#", "")}-${Math.random().toString(36).substr(2, 4)}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── BAR CHART DYNAMIQUE ─────────────────────────────────────────── */
function BarChart({ data = [], color = TEAL, height = 80 }) {
  if (!data.length) return null;
  const vals = data.map((d) => Number(d.revenue || d.value || 0));
  const max = Math.max(...vals, 1);
  const w = 280;
  const barW = Math.max(6, (w / vals.length) - 4);
  const gradId = `bar-${Math.random().toString(36).substr(2, 4)}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {vals.map((v, i) => {
        const bh = Math.max(4, (v / max) * (height - 8));
        const x = (i / vals.length) * w + 2;
        const y = height - bh;
        return (
          <rect key={i} x={x} y={y} width={barW} height={bh} rx="2" fill={`url(#${gradId})`} opacity={i === vals.length - 1 ? 1 : 0.55} style={{ transition: "all 0.3s" }} />
        );
      })}
    </svg>
  );
}

/* ─── AREA CHART DYNAMIQUE ────────────────────────────────────────── */
function AreaChart({ data = [], color = BLUE, height = 70 }) {
  if (data.length < 2) return null;
  const vals = data.map((d) => Number(d.revenue || d.value || 0));
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals);
  const w = 260;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = height - ((v - min) / (max - min || 1)) * (height - 8) - 4;
    return [x, y];
  });
  const pathD = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const fillD = `${pathD} L${w},${height} L0,${height} Z`;
  const gradId = `area-${Math.random().toString(36).substr(2, 4)}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="#ffffff" strokeWidth="1.5" opacity={i === pts.length - 1 ? 1 : 0.7} />
      ))}
    </svg>
  );
}

/* ─── GAUGE / ARC KPI ─────────────────────────────────────────────── */
function GaugeArc({ value, max = 100, color = TEAL, size = 80, label }) {
  const pct = Math.min(1, value / (max || 1));
  const r = 30;
  const circ = Math.PI * r;
  const dash = pct * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size * 0.6} viewBox="0 0 80 48">
        <path d="M8,44 A32,32 0 0,1 72,44" fill="none" stroke={SLATE_TRACK} strokeWidth="7" strokeLinecap="round" />
        <path
          d="M8,44 A32,32 0 0,1 72,44"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <text x="40" y="38" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="800" fontFamily="inherit">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", fontWeight: 500 }}>{label}</span>}
    </div>
  );
}

/* ─── DONUT CHART ─────────────────────────────────────────────────── */
function DonutChart({ segments, size = 96 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 36;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke={SLATE_TRACK} strokeWidth="8" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx="44" cy="44" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x="44" y="42" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="800">
        {total.toLocaleString("fr-FR")}
      </text>
      <text x="44" y="55" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="500">
        adhérents
      </text>
    </svg>
  );
}

function SlimBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: SLATE_TRACK, borderRadius: 99, height: 5, marginTop: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: color, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </div>
  );
}

const MEDALS = [
  { bg: "linear-gradient(135deg,#f59e0b,#b45309)", text: "#fff", label: "1" },
  { bg: "linear-gradient(135deg,#94a3b8,#64748b)", text: "#fff", label: "2" },
  { bg: "linear-gradient(135deg,#cd7f32,#874e1d)", text: "#fff", label: "3" },
  { bg: "#f1f5f9", text: "#64748b", label: "4" },
  { bg: "#f1f5f9", text: "#64748b", label: "5" },
];

/* ─── KPI CARD RÉUTILISABLE ───────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color, trend, trendLabel, chart, chartType, children }) {
  const trendUp = trend > 0;
  const trendNeutral = trend === 0 || trend == null;
  return (
    <div className="awj-card" style={{ padding: "22px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 6px" }}>{label}</p>
          <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", margin: 0 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, margin: 0 }}>{sub}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}14`, borderRadius: 10 }}>
            <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 16, color }} />
          </span>
          {!trendNeutral && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
              background: trendUp ? "rgba(0,196,180,0.10)" : "rgba(220,38,38,0.10)",
              color: trendUp ? "#0d9488" : "#dc2626",
              display: "flex", alignItems: "center", gap: 2,
            }}>
              <i className={`ti ${trendUp ? "ti-trending-up" : "ti-trending-down"}`} style={{ fontSize: 11 }} /> {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      {chart && chartType === "bar" && <div style={{ marginTop: "auto" }}><BarChart data={chart} color={color} height={44} /></div>}
      {chart && chartType === "area" && <div style={{ marginTop: "auto" }}><AreaChart data={chart} color={color} height={44} /></div>}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpiPeriod, setKpiPeriod] = useState("month");

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

  const css = `
    .awj-dash * { box-sizing: border-box; }
    .awj-dash { font-family: inherit; background: #f8fafc; min-height: 100vh; color: #0f172a; }
    .awj-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; transition: all 0.2s ease; }
    .awj-card:hover { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(15,23,42,0.04); }
    .awj-card-hover:hover { transform: translateY(-2px); border-color: rgba(0,196,180,0.5) !important; box-shadow: 0 10px 20px -12px rgba(0,196,180,0.25); }
    .awj-btn-primary { background: linear-gradient(135deg, #1a5fa8, #00c4b4); color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; box-shadow: 0 2px 8px rgba(26,95,168,0.18); }
    .awj-btn-primary:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(26,95,168,0.25); }
    .awj-btn-primary:active { transform: scale(0.98); }
    .awj-btn-ghost { background: #ffffff; color: #334155; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .awj-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
    .awj-link { color: #1a5fa8; text-decoration: none; font-size: 12px; font-weight: 600; transition: color 0.15s; display: inline-flex; align-items: center; gap: 4px; }
    .awj-link:hover { color: #00c4b4; }
    .awj-row-item { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; text-decoration: none; transition: background 0.15s; color: inherit; }
    .awj-row-item:last-child { border-bottom: none; }
    .awj-row-item:hover { background: #f8fafc; }
    .awj-avatar { width: 38px; height: 38px; border-radius: 12px; background: rgba(0,196,180,0.10); border: 1px solid rgba(0,196,180,0.25); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #0d9488; flex-shrink: 0; }
    .awj-section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
    .awj-pulse { animation: awjPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes awjPulse { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:0.4; transform: scale(0.92); } }
    .awj-fade-in { animation: awjFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes awjFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    .awj-number { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
    .awj-hero-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
    .awj-clients-row { display: grid; grid-template-columns: 260px 1fr; gap: 20px; margin-bottom: 20px; }
    .awj-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .awj-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .awj-header-flex { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; gap: 20px; flex-wrap: wrap; }
    .awj-header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .awj-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .awj-kpi-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .awj-kpi-full { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 20px; }
    .awj-period-btn { background: #ffffff; border: 1px solid #e2e8f0; color: #64748b; border-radius: 8px; padding: 6px 14px; font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; }
    .awj-period-btn.active { background: rgba(0,196,180,0.10); border-color: rgba(0,196,180,0.35); color: #0d9488; }
    .awj-period-btn:hover:not(.active) { background: #f8fafc; color: #0f172a; }
    .awj-section-divider { display: flex; align-items: center; gap: 16px; margin: 36px 0 20px; }
    .awj-section-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
    .awj-section-divider-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
    @media (max-width: 1024px) {
      .awj-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .awj-kpi-grid-3 { grid-template-columns: 1fr !important; }
      .awj-hero-grid { grid-template-columns: 1fr !important; }
      .awj-clients-row { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 768px) {
      .awj-dash > div { padding: 16px 14px 60px !important; }
      .awj-bottom-grid { grid-template-columns: 1fr !important; }
      .awj-kpi-full { grid-template-columns: 1fr !important; }
      .awj-stat-grid { grid-template-columns: 1fr 1fr !important; }
      .awj-header-actions { width: 100%; }
      .awj-header-actions * { flex: 1; justify-content: center; }
    }
    @media (max-width: 480px) {
      .awj-kpi-grid { grid-template-columns: 1fr 1fr !important; }
      .awj-stat-grid { grid-template-columns: 1fr 1fr !important; }
    }
  `;

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="awj-dash" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#00c4b4", borderRadius: "50%", animation: "spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Chargement du tableau de bord…</p>
        </div>
      </div>
    </>
  );

  if (error) return (
    <>
      <style>{css}</style>
      <div className="awj-dash" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="awj-card" style={{ padding: 32, textAlign: "center", maxWidth: 400, margin: 20 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 30, color: "#dc2626", marginBottom: 16, display: "block" }} />
          <p style={{ color: "#475569", marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>{error}</p>
          <button className="awj-btn-primary" onClick={reload} style={{ margin: "0 auto" }}>
            <i className="ti ti-refresh" style={{ fontSize: 14 }} /> Réessayer
          </button>
        </div>
      </div>
    </>
  );

  const { clients: cs = {}, payments: ps = {}, top_agents = [], last_clients = [], last_payments = [], evolution = [] } = data ?? {};
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bonjour" : now.getHours() < 18 ? "Bon après-midi" : "Bonsoir";

  const donutSegments = [
    { value: Number(cs.plan_essentielle ?? 0), color: TEAL },
    { value: Number(cs.plan_ivoirienne ?? 0), color: BLUE },
    { value: Number(cs.plan_turquoise ?? 0), color: "#5eead4" },
  ];

  const totalClients = Number(cs.total_clients ?? 0);
  const totalActifs = Number(cs.actifs ?? 0);
  const totalAttente = Number(cs.attente ?? 0);

  const tauxFidelisation = totalClients > 0 ? Math.round((totalActifs / totalClients) * 100) : 0;
  const tauxConversion = (totalActifs + totalAttente) > 0 ? Math.round((totalActifs / (totalActifs + totalAttente)) * 100) : 0;
  const revenuMoyen = totalActifs > 0 ? Math.round(Number(ps.total_revenue || 0) / totalActifs) : 0;
  const tauxRecouvrement = ps.total_payments > 0 && ps.total_revenue > 0 ? Math.min(100, Math.round((Number(ps.mensualites_revenue || 0) / Number(ps.total_revenue)) * 100)) : 0;

  const sinistralite = data?.sinistralite ?? 42;
  const nps = data?.nps ?? 78;
  const evolutionBar = evolution.length ? evolution : Array.from({ length: 7 }, () => ({ revenue: 0 }));

  return (
    <>
      <style>{css}</style>
      <div className="awj-dash awj-fade-in">
        <div style={{ maxWidth: 1340, margin: "0 auto", padding: "32px 24px 80px", width: "100%" }}>

          {/* ══ HEADER ══════════════════════════════════════════════ */}
          <div className="awj-header-flex">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00c4b4" }} className="awj-pulse" />
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: "#0f172a" }}>
                {greeting}, {user?.name?.split(" ")[0]}
              </h1>
              <p style={{ color: "#64748b", fontSize: 13, marginTop: 4, margin: 0 }}>
                Vue d'ensemble de la Mutuelle Santé Awoundjô.
              </p>
            </div>
            <div className="awj-header-actions">
              {isAdmin && (
                <>
                  <button className="awj-btn-ghost" onClick={() => setShowPlans((v) => !v)}>
                    <i className="ti ti-clipboard-list" style={{ fontSize: 14 }} /> Formules
                  </button>
                  <Link to={`${ADMIN_BASE}/agents`} style={{ textDecoration: "none" }}>
                    <button className="awj-btn-ghost"><i className="ti ti-id-badge" style={{ fontSize: 14 }} /> Agents</button>
                  </Link>
                  <Link to={`${ADMIN_BASE}/broadcasts`} style={{ textDecoration: "none" }}>
                    <button className="awj-btn-ghost"><i className="ti ti-speakerphone" style={{ fontSize: 14 }} /> Broadcasts</button>
                  </Link>
                </>
              )}
              <Link to={`${ADMIN_BASE}/clients/new`} style={{ textDecoration: "none" }}>
                <button className="awj-btn-primary"><i className="ti ti-plus" style={{ fontSize: 14 }} /> Nouveau mutualiste</button>
              </Link>
            </div>
          </div>

          {/* ══ MULTI-PORTAILS ══════════════════════════════════════ */}
          {isAdmin && (
            <div style={{ marginBottom: 32 }}>
              <p className="awj-section-label"><i className="ti ti-apps" style={{ fontSize: 12 }} /> Portails applicatifs</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
                {[
                  { key: "admin", icon: "ti-shield-check", label: "Administration", desc: "Configuration centrale", color: BLUE, link: "/dashboard", stat: `${totalClients} membres` },
                  { key: "agent", icon: "ti-id-badge", label: "Réseau Agents", desc: "Outils de collecte terrain", color: TEAL, link: "/agents", stat: `${top_agents?.length ?? 0} actifs` },
                  { key: "client", icon: "ti-user", label: "Espace Adhérent", desc: "Suivi des garanties", color: "#2563eb", link: "/clients", stat: `${totalActifs} actifs` },
                  { key: "diaspora", icon: "ti-world", label: "Guichet Diaspora", desc: "Souscriptions internationales", color: AMBER, link: "/diaspora", stat: "Canal actif" },
                  { key: "business", icon: "ti-building", label: "Espace Corporate", desc: "Grands comptes CNEPECI", color: VIOLET, link: "/business", stat: "B2B actif" },
                  { key: "parrainage", icon: "ti-link", label: "Affiliation", desc: "Programme de référents", color: "#ea580c", link: "/referral", stat: "10% intéressement" },
                ].map((portal) => (
                  <Link key={portal.key} to={portal.link} style={{ textDecoration: "none" }}>
                    <div className="awj-card awj-card-hover" style={{ padding: "16px", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `${portal.color}14`, borderRadius: 9 }}>
                          <i className={`ti ${portal.icon}`} style={{ fontSize: 16, color: portal.color }} />
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(0,196,180,0.10)", padding: "2px 6px", borderRadius: 4, color: "#0d9488" }}>ACTIF</span>
                      </div>
                      <h4 style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px", color: "#0f172a" }}>{portal.label}</h4>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 12px", lineHeight: 1.3 }}>{portal.desc}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: portal.color, margin: "auto 0 0" }}>{portal.stat}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ══ FORMULES ════════════════════════════════════════════ */}
          {isAdmin && showPlans && (
            <div className="awj-card awj-fade-in" style={{ marginBottom: 32, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0, color: "#0f172a" }}>Grille de cotisation & offres</h3>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{plans.length} formules actives sur le système</p>
                </div>
                <button className="awj-btn-primary" onClick={() => { setEditingPlan(null); setPlanModal(true); }}>
                  <i className="ti ti-plus" style={{ fontSize: 14 }} /> Créer une formule
                </button>
              </div>
              {plans.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
                  <i className="ti ti-clipboard-off" style={{ fontSize: 28, marginBottom: 8, display: "block" }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Aucune offre pré-paramétrée.</p>
                </div>
              ) : plans.map((plan) => (
                <div key={plan.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", borderBottom: "1px solid #f1f5f9", opacity: plan.is_active ? 1 : 0.55 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{plan.name}</span>
                      {!plan.is_active && <span style={{ fontSize: 10, background: "#f1f5f9", color: "#94a3b8", padding: "2px 6px", borderRadius: 4 }}>Désactivé</span>}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Adhésion : <strong style={{ color: "#0f172a" }}>{plan.adhesion_price === 0 ? "Gratuit" : `${Number(plan.adhesion_price).toLocaleString("fr-FR")} FCFA`}</strong></span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Cotisation : <strong style={{ color: "#0d9488" }}>{Number(plan.monthly_price).toLocaleString("fr-FR")} FCFA/mois</strong></span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Prise en charge : <strong style={{ color: "#2563eb" }}>{plan.coverage_percent}%</strong></span>
                    </div>
                    {plan.benefits?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {plan.benefits.map((b) => (
                          <span key={b.category} style={{ fontSize: 11, background: "rgba(0,196,180,0.08)", color: "#0d9488", border: "1px solid rgba(0,196,180,0.20)", padding: "2px 8px", borderRadius: 6 }}>
                            {b.category.replace(/_/g, " ")}{b.coverage_percent != null && ` ${b.coverage_percent}%`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => togglePlanActive(plan)} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, background: plan.is_active ? "rgba(0,196,180,0.10)" : "#f1f5f9", color: plan.is_active ? "#0d9488" : "#94a3b8" }}>
                      {plan.is_active ? "Actif" : "Suspendu"}
                    </button>
                    <button onClick={() => { setEditingPlan(plan); setPlanModal(true); }} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, background: "rgba(37,99,235,0.08)", color: "#2563eb" }}>Modifier</button>
                    <button onClick={() => deletePlan(plan)} style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", background: "rgba(220,38,38,0.08)", color: "#dc2626", display: "flex", alignItems: "center" }}>
                      <i className="ti ti-trash" style={{ fontSize: 13 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAdmin && planModal && (
            <PlanModal plan={editingPlan} onClose={() => setPlanModal(false)} onSaved={() => { fetchPlans(); setPlanModal(false); }} />
          )}

          {/* ══ HERO FINANCIER ══════════════════════════════════════ */}
          <div className="awj-hero-grid">
            <div className="awj-card" style={{ padding: "22px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: TEAL }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 10px" }}>Chiffre d'affaires total</p>
              <div className="awj-number" style={{ color: "#0d9488" }}>
                {fmtShort(ps.total_revenue)}
                <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", marginLeft: 6 }}>FCFA</span>
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 16px" }}>Cumul sur {ps.total_payments ?? 0} transactions approuvées</p>
              <Sparkline data={evolution} color={TEAL} height={42} />
            </div>

            <div className="awj-card" style={{ padding: "22px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: BLUE }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 10px" }}>Encaissements du jour</p>
              <div className="awj-number" style={{ color: "#2563eb" }}>
                {fmtShort(ps.today_revenue)}
                <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", marginLeft: 6 }}>FCFA</span>
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 16px" }}>{ps.today_payments ?? 0} écritures enregistrées ce jour</p>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <span style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 2 }}>Frais d'adhésion</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{fmtShort(ps.adhesions_revenue)}</span>
                </div>
                <div style={{ width: 1, background: "#e2e8f0" }} />
                <div>
                  <span style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 2 }}>Cotisations</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{fmtShort(ps.mensualites_revenue)}</span>
                </div>
              </div>
            </div>

            <div className="awj-card" style={{ padding: "22px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: AMBER }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 16px" }}>Canaux de règlement</p>
              {[
                { label: "Mobile Money (Jeko)", icon: "ti-device-mobile", value: Number(ps.wave_revenue), color: AMBER },
                { label: "Dépôts espèces (Guichet)", icon: "ti-cash", value: Number(ps.cash_revenue), color: TEAL },
              ].map((m) => (
                <div key={m.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#475569", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                      <i className={`ti ${m.icon}`} style={{ fontSize: 12, color: m.color }} /> {m.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{fmtShort(m.value)} FCFA</span>
                  </div>
                  <SlimBar value={m.value} max={Number(ps.total_revenue)} color={m.color} />
                  <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                    {ps.total_revenue > 0 ? Math.round((m.value / Number(ps.total_revenue)) * 100) : 0}% du total
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ══ SEGMENTATION ADHÉRENTS ══════════════════════════════ */}
          <div className="awj-clients-row">
            <div className="awj-card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 16, alignSelf: "flex-start" }}>Portefeuille offres</p>
              <DonutChart segments={donutSegments} size={100} />
              <div style={{ marginTop: 16, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Essentielle", value: Number(cs.plan_essentielle ?? 0), color: TEAL },
                  { label: "Ivoirienne", value: Number(cs.plan_ivoirienne ?? 0), color: BLUE },
                  { label: "Turquoise", value: Number(cs.plan_turquoise ?? 0), color: "#5eead4" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                      <span style={{ fontSize: 11, color: "#64748b" }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="awj-stat-grid">
              {[
                { label: "Total adhérents", value: totalClients, sub: "Dossiers enregistrés", color: "#0f172a", icon: "ti-users", to: "/clients" },
                { label: "Garanties actives", value: totalActifs, sub: "À jour de cotisation", color: "#0d9488", icon: "ti-shield-check", to: "/clients?status=actif" },
                { label: "En attente d'affiliation", value: totalAttente, sub: "Pièces à vérifier", color: AMBER, icon: "ti-hourglass", to: "/clients?status=attente" },
                { label: "Niveau Essentielle", value: cs.plan_essentielle ?? 0, color: TEAL, to: "/clients?plan=ESSENTIELLE" },
                { label: "Niveau Ivoirienne", value: cs.plan_ivoirienne ?? 0, color: BLUE, to: "/clients?plan=IVOIRIENNE" },
                { label: "Niveau Turquoise", value: cs.plan_turquoise ?? 0, color: "#5eead4", to: "/clients?plan=TURQUOISE" },
              ].map((s) => (
                <Link key={s.label} to={s.to} style={{ textDecoration: "none" }}>
                  <div className="awj-card awj-card-hover" style={{ padding: "18px 20px", height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>{s.label}</p>
                      {s.icon && <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: s.color }} />}
                    </div>
                    <p style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: s.color, margin: "0 0 4px" }}>{s.value}</p>
                    {s.sub ? (
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{s.sub}</p>
                    ) : (
                      <>
                        <SlimBar value={Number(s.value)} max={totalClients} color={s.color} />
                        <span style={{ fontSize: 10, color: "#94a3b8", display: "block", marginTop: 4 }}>
                          {totalClients > 0 ? Math.round((Number(s.value) / totalClients) * 100) : 0}% du portefeuille
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ══ ANALYTICS & KPI ═════════════════════════════════════ */}
          {isAdmin && (
            <>
              <div className="awj-section-divider">
                <div className="awj-section-divider-line" />
                <div className="awj-section-divider-label"><i className="ti ti-chart-infographic" style={{ fontSize: 12 }} /> Performance & indicateurs clés</div>
                <div className="awj-section-divider-line" />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Indicateurs consolidés</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ k: "month", l: "Mois en cours" }, { k: "quarter", l: "Trimestre" }, { k: "year", l: "Vue annuelle" }].map(({ k, l }) => (
                    <button key={k} className={`awj-period-btn${kpiPeriod === k ? " active" : ""}`} onClick={() => setKpiPeriod(k)}>{l}</button>
                  ))}
                </div>
              </div>

              {/* KPIs principaux */}
              <div className="awj-kpi-grid">
                <KpiCard icon="ti-chart-bar" label="Chiffre d'affaires brut" value={fmtShort(ps.total_revenue)} sub="Total encaissements" color={TEAL} trend={14} chart={evolutionBar} chartType="bar" />
                <KpiCard icon="ti-refresh" label="Taux de fidélisation" value={`${tauxFidelisation}%`} sub="Taux d'activité récurrent" color="#2563eb" trend={2.4}>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}><GaugeArc value={tauxFidelisation} max={100} color="#2563eb" size={72} label="Seuil critique : 80%" /></div>
                </KpiCard>
                <KpiCard icon="ti-trending-up" label="Taux de conversion" value={`${tauxConversion}%`} sub="Prospects devenus actifs" color={VIOLET} trend={-1.2}>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}><GaugeArc value={tauxConversion} max={100} color={VIOLET} size={72} label="Objectif trim. : 70%" /></div>
                </KpiCard>
                <KpiCard icon="ti-scale" label="Cotisation moyenne (ARPU)" value={fmtShort(revenuMoyen)} sub="Valeur par bénéficiaire actif" color={AMBER} trend={5.8} chart={evolutionBar} chartType="area" />
              </div>

              {/* Recouvrement + Sinistralité + NPS */}
              <div className="awj-kpi-grid-3">
                <div className="awj-card" style={{ padding: "22px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-credit-card" style={{ fontSize: 12 }} /> Taux de recouvrement
                  </p>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 26, fontWeight: 800, color: "#0d9488", margin: 0 }}>{tauxRecouvrement}%</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>Des appels de fonds honorés</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: tauxRecouvrement >= 85 ? "rgba(0,196,180,0.10)" : "rgba(220,38,38,0.10)", color: tauxRecouvrement >= 85 ? "#0d9488" : "#dc2626" }}>
                      {tauxRecouvrement >= 85 ? "Stable" : "Risque d'impayés"}
                    </span>
                  </div>
                  <SlimBar value={tauxRecouvrement} max={100} color={TEAL} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ color: "#64748b" }}>Mobile Money (Jeko)</span>
                      <strong style={{ color: AMBER }}>{Math.round((Number(ps.wave_revenue) / Number(ps.total_revenue || 1)) * 100)}%</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ color: "#64748b" }}>Dépôts guichet physique</span>
                      <strong style={{ color: "#0d9488" }}>{Math.round((Number(ps.cash_revenue) / Number(ps.total_revenue || 1)) * 100)}%</strong>
                    </div>
                  </div>
                </div>

                <div className="awj-card" style={{ padding: "22px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-building-hospital" style={{ fontSize: 12 }} /> Ratio sinistres / cotisations
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 14 }}>
                    <GaugeArc value={sinistralite} max={100} color="#dc2626" size={72} label="Prestations versées" />
                    <GaugeArc value={100 - sinistralite} max={100} color={TEAL} size={72} label="Marge de réserve" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { l: "Pharmacie", p: 40, c: AMBER },
                      { l: "Consultation / Clinique", p: 35, c: "#2563eb" },
                      { l: "Hospitalisations", p: 25, c: "#dc2626" },
                    ].map((item) => (
                      <div key={item.l}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                          <span style={{ color: "#94a3b8" }}>{item.l}</span>
                          <span style={{ color: "#0f172a", fontWeight: 600 }}>{item.p}%</span>
                        </div>
                        <SlimBar value={item.p} max={100} color={item.c} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="awj-card" style={{ padding: "22px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-star" style={{ fontSize: 12 }} /> Satisfaction adhérents (NPS)
                  </p>
                  <div style={{ textAlign: "center", margin: "12px 0" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "rgba(124,58,237,0.06)", border: `2px dashed ${VIOLET}`, marginBottom: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: VIOLET }}>+{nps}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0, fontWeight: 500 }}>Excellent niveau d'engagement</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                      <span style={{ color: "#94a3b8" }}>Objectif annuel</span>
                      <span style={{ color: "#94a3b8" }}>+80 NPS</span>
                    </div>
                    <SlimBar value={nps} max={100} color={VIOLET} />
                  </div>
                </div>
              </div>

              {/* Évolution CA + Alertes */}
              <div className="awj-kpi-full">
                <div className="awj-card" style={{ padding: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                        <i className="ti ti-chart-line" style={{ fontSize: 12 }} /> Évolution mensuelle du chiffre d'affaires
                      </p>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Historique glissant des souscriptions</p>
                    </div>
                    <span style={{ fontSize: 10, background: "rgba(0,196,180,0.10)", color: "#0d9488", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>Tendance saine</span>
                  </div>
                  {evolution.length >= 2 ? (
                    <div>
                      <AreaChart data={evolution} color={TEAL} height={110} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        {evolution.map((e, i) => (
                          <span key={i} style={{ fontSize: 9, color: "#94a3b8" }}>{e.period || e.month || `M${i + 1}`}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 12 }}>Données d'historique insuffisantes.</div>
                  )}
                  <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
                    {[
                      { label: "Adhésions", value: ps.adhesions_revenue, color: BLUE },
                      { label: "Cotisations", value: ps.mensualites_revenue, color: TEAL },
                    ].map((s) => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                        <span style={{ fontSize: 11, color: "#64748b" }}>{s.label} </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{fmtShort(s.value)} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="awj-card" style={{ padding: "20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: 12 }} /> Alertes opérationnelles
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {totalAttente > 0 && (
                      <Link to={`${ADMIN_BASE}/clients?status=attente`} style={{ textDecoration: "none" }}>
                        <div style={{ background: "rgba(217,119,6,0.05)", border: "1px solid rgba(217,119,6,0.18)", borderRadius: 10, padding: "10px 14px", transition: "all 0.2s" }}>
                          <span style={{ color: "#b45309", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                            <i className="ti ti-alert-triangle" style={{ fontSize: 13 }} /> Validation bloquée
                          </span>
                          <span style={{ color: "#78716c", fontSize: 11 }}>{totalAttente} dossiers en attente d'approbation administrative.</span>
                        </div>
                      </Link>
                    )}
                    {tauxFidelisation < 80 && (
                      <div style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 10, padding: "10px 14px" }}>
                        <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-trending-down" style={{ fontSize: 13 }} /> Seuil d'alerte résiliations
                        </span>
                        <span style={{ color: "#78716c", fontSize: 11 }}>Le taux d'activité récurrent est sous l'objectif fixé (80%).</span>
                      </div>
                    )}
                    {tauxConversion < 70 && (
                      <div style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 10, padding: "10px 14px" }}>
                        <span style={{ color: VIOLET, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-target-arrow" style={{ fontSize: 13 }} /> Conversion sous objectif
                        </span>
                        <span style={{ color: "#78716c", fontSize: 11 }}>Taux actuel {tauxConversion}% — objectif trimestriel : 70%.</span>
                      </div>
                    )}
                    {totalAttente === 0 && tauxFidelisation >= 80 && tauxConversion >= 70 && (
                      <div style={{ background: "rgba(0,196,180,0.05)", border: "1px solid rgba(0,196,180,0.18)", borderRadius: 10, padding: "12px", textAlign: "center", color: "#0d9488", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <i className="ti ti-circle-check" style={{ fontSize: 14 }} /> Santé du système optimale. Aucune anomalie détectée.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ TOP AGENTS ══════════════════════════════════════════ */}
          {isAdmin && top_agents?.length > 0 && (
            <div className="awj-card" style={{ marginBottom: 32, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-trophy" style={{ fontSize: 15, color: AMBER }} /> Classement performance commerciale
                </p>
                <Link to={`${ADMIN_BASE}/agents`} className="awj-link">Performance réseau <i className="ti ti-arrow-right" style={{ fontSize: 12 }} /></Link>
              </div>
              <div>
                {top_agents.slice(0, 5).map((agent, idx) => {
                  const medal = MEDALS[idx];
                  const maxRevenue = Math.max(...top_agents.map(a => Number(a.total_revenue || 0)), 1);
                  const pct = Math.round((Number(agent.total_revenue) / maxRevenue) * 100);
                  return (
                    <Link key={agent.id} to={`${ADMIN_BASE}/agents`} className="awj-row-item">
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: medal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: medal.text, flexShrink: 0 }}>
                        {medal.label}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{agent.name}</span>
                          <strong style={{ color: "#0d9488", fontSize: 13 }}>{fmtShort(agent.total_revenue)} FCFA</strong>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, background: SLATE_TRACK, height: 4, borderRadius: 99 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: idx === 0 ? AMBER : BLUE, borderRadius: 99, transition: "width 0.8s ease" }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{agent.nb_clients} portefeuilles</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ FLUX BAS ════════════════════════════════════════════ */}
          <div className="awj-bottom-grid">
            <div className="awj-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0f172a" }}>Dernières inscriptions</p>
                <Link to={`${ADMIN_BASE}/clients`} className="awj-link">Consulter le registre <i className="ti ti-arrow-right" style={{ fontSize: 12 }} /></Link>
              </div>
              {!last_clients?.length ? (
                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "40px 0" }}>Aucune donnée sociétaire disponible.</p>
              ) : last_clients.map((c) => (
                <Link key={c.id} to={`${ADMIN_BASE}/clients/${c.id}`} className="awj-row-item">
                  <div className="awj-avatar">{c.name?.charAt(0)?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", display: "block" }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginTop: 2, display: "block" }}>{c.mutual_number}</span>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    <PlanBadge plan={c.plan} />
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9" }}>
                <Link to={`${ADMIN_BASE}/clients/new`} className="awj-link"><i className="ti ti-plus" style={{ fontSize: 12 }} /> Enregistrer un mutualiste</Link>
              </div>
            </div>

            <div className="awj-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0f172a" }}>Journal des opérations financières</p>
                <Link to={`${ADMIN_BASE}/payments`} className="awj-link">Grand livre de caisse <i className="ti ti-arrow-right" style={{ fontSize: 12 }} /></Link>
              </div>
              {!last_payments?.length ? (
                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "40px 0" }}>Aucun flux monétaire enregistré.</p>
              ) : last_payments.map((p) => (
                <div key={p.id} className="awj-row-item">
                  <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: p.type === "adhesion" ? "rgba(26,95,168,0.08)" : "rgba(0,196,180,0.08)", border: `1px solid ${p.type === "adhesion" ? "rgba(26,95,168,0.18)" : "rgba(0,196,180,0.18)"}` }}>
                    <i className={`ti ${p.type === "adhesion" ? "ti-file-text" : "ti-refresh"}`} style={{ fontSize: 15, color: p.type === "adhesion" ? BLUE : TEAL }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", display: "block" }}>{p.client_name}</span>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                      <TypeBadge type={p.type} />
                      <MethodBadge method={p.payment_method} />
                      {isAdmin && p.agent_name && <span style={{ fontSize: 11, color: "#94a3b8" }}>• {p.agent_name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <strong style={{ color: "#0d9488", fontSize: 13, display: "block" }}>{fmtShort(p.amount)} FCFA</strong>
                    <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "block" }}>{fmtDate(p.created_at)}</span>
                  </div>
                </div>
              ))}
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9" }}>
                <Link to={`${ADMIN_BASE}/clients`} className="awj-link"><i className="ti ti-plus" style={{ fontSize: 12 }} /> Enregistrer un paiement</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
