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

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   Fond sombre d'origine + palette de marque Awoundjô (Sidebar/Agents).
   Une seule échelle de couleur, un seul jeu de rayons/ombres, réutilisés
   partout — pas de valeurs ad hoc dispersées dans le fichier.
   ═══════════════════════════════════════════════════════════════════ */
const BG          = "#070f1e";
const SURFACE     = "rgba(255,255,255,0.035)";
const SURFACE_HI  = "rgba(255,255,255,0.06)";
const BORDER      = "rgba(255,255,255,0.08)";
const BORDER_HI   = "rgba(255,255,255,0.16)";
const TEXT        = "#eef2f8";
const TEXT_MUTED  = "#8ea0bd";
const TEXT_FAINT  = "#4d5b78";

const BRAND   = "#1a5fa8";   // bleu de marque
const BRAND_LT= "#5ba1e6";   // bleu interactif, lisible sur fond sombre
const TEAL    = "#1fd1bd";   // positif / revenu
const AMBER   = "#f5a524";   // vigilance
const RED     = "#f87171";   // alerte
const VIOLET  = "#a78bfa";   // satisfaction / secondaire

const RADIUS = 16;
const RADIUS_SM = 10;

/* ─── TREND — remplace Sparkline + AreaChart (même langage graphique) ─
   Une seule primitive pour toute courbe d'évolution : compacte (sans
   points) dans les cartes hero, ou détaillée (avec points) en pleine
   largeur. Évite d'avoir deux styles de courbe différents à l'écran. */
function Trend({ data = [], color = TEAL, height = 48, dots = false }) {
  if (data.length < 2) return null;
  const vals = data.map((d) => Number(d.revenue ?? d.value ?? 0));
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals);
  const w = 280;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = height - ((v - min) / (max - min || 1)) * (height - 10) - 5;
    return [x, y];
  });
  const pathD = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const fillD = `${pathD} L${w},${height} L0,${height} Z`;
  const gradId = `trend-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {dots && pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3.5 : 2.5} fill={i === pts.length - 1 ? color : BG} stroke={color} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* ─── RADIAL — remplace GaugeArc, réutilisée pour tout ratio/pourcentage */
function Radial({ value, max = 100, color = TEAL, size = 76, label }) {
  const pct = Math.min(1, (value || 0) / (max || 1));
  const r = 30;
  const circ = Math.PI * r;
  const dash = pct * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size * 0.62} viewBox="0 0 80 48">
        <path d="M8,44 A32,32 0 0,1 72,44" fill="none" stroke={BORDER} strokeWidth="7" strokeLinecap="round" />
        <path
          d="M8,44 A32,32 0 0,1 72,44"
          fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text x="40" y="38" textAnchor="middle" fill={TEXT} fontSize="14" fontWeight="800" fontFamily="inherit">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && <span style={{ fontSize: 10, color: TEXT_MUTED, textAlign: "center", fontWeight: 500, maxWidth: size + 20 }}>{label}</span>}
    </div>
  );
}

/* ─── DONUT — composition du portefeuille (job distinct : part-du-tout) */
function Donut({ segments, size = 100 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 36;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke={BORDER} strokeWidth="8" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle key={i} cx="44" cy="44" r={r} fill="none" stroke={seg.color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "all 1s cubic-bezier(0.4,0,0.2,1)" }} />
        );
        offset += dash;
        return el;
      })}
      <text x="44" y="42" textAnchor="middle" fill={TEXT} fontSize="13" fontWeight="800">{total.toLocaleString("fr-FR")}</text>
      <text x="44" y="55" textAnchor="middle" fill={TEXT_MUTED} fontSize="9" fontWeight="500">adhérents</text>
    </svg>
  );
}

function SlimBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: BORDER, borderRadius: 99, height: 5, marginTop: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: color, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

const MEDALS = [
  { bg: "linear-gradient(135deg,#f5a524,#b3730a)", text: "#0b1120", label: "1" },
  { bg: "linear-gradient(135deg,#c7d2e0,#7c8aa3)", text: "#0b1120", label: "2" },
  { bg: "linear-gradient(135deg,#d69a5e,#8a5a2a)", text: "#0b1120", label: "3" },
  { bg: SURFACE_HI, text: TEXT_MUTED, label: "4" },
  { bg: SURFACE_HI, text: TEXT_MUTED, label: "5" },
];

/* ─── EYEBROW — libellé standard de chaque bloc, une seule échelle ──── */
function Eyebrow({ icon, children, style }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: TEXT_MUTED, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6, ...style }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 12 }} />} {children}
    </p>
  );
}

/* ─── KPI CARD — carte de métrique clé, réutilisée pour la bande de tête */
function KpiCard({ icon, label, value, sub, color, trend, chart, radial, radialLabel }) {
  const trendUp = trend > 0;
  const trendNeutral = trend === 0 || trend == null;
  return (
    <div className="awj-card" style={{ padding: 22, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <Eyebrow style={{ margin: "0 0 6px" }}>{label}</Eyebrow>
          <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: TEXT, margin: 0 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: TEXT_MUTED, margin: "4px 0 0" }}>{sub}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}1f`, borderRadius: 10 }}>
            <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 16, color }} />
          </span>
          {!trendNeutral && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: trendUp ? "rgba(31,209,189,0.14)" : "rgba(248,113,113,0.14)", color: trendUp ? TEAL : RED, display: "flex", alignItems: "center", gap: 2 }}>
              <i className={`ti ${trendUp ? "ti-trending-up" : "ti-trending-down"}`} style={{ fontSize: 11 }} /> {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      {chart && <div style={{ marginTop: "auto" }}><Trend data={chart} color={color} height={44} /></div>}
      {radial && (
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
          <Radial value={Number(String(value).replace("%", ""))} max={100} color={color} size={76} label={radialLabel} />
        </div>
      )}
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
    .awj-dash { font-family: inherit; background: ${BG}; min-height: 100vh; color: ${TEXT}; }
    .awj-card { background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: ${RADIUS}px; backdrop-filter: blur(20px); transition: border-color 0.2s ease, transform 0.2s ease; }
    .awj-card:hover { border-color: ${BORDER_HI}; }
    .awj-card-hover:hover { transform: translateY(-2px); border-color: rgba(31,209,189,0.4) !important; }
    .awj-btn-primary { background: linear-gradient(135deg, ${BRAND}, ${TEAL}); color: #06111f; border: none; border-radius: ${RADIUS_SM}px; padding: 10px 18px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; }
    .awj-btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
    .awj-btn-primary:active { transform: scale(0.98); }
    .awj-btn-ghost { background: ${SURFACE}; color: ${TEXT}; border: 1px solid ${BORDER}; border-radius: ${RADIUS_SM}px; padding: 10px 16px; font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .awj-btn-ghost:hover { background: ${SURFACE_HI}; border-color: ${BORDER_HI}; }
    .awj-link { color: ${BRAND_LT}; text-decoration: none; font-size: 12px; font-weight: 600; transition: color 0.15s; display: inline-flex; align-items: center; gap: 4px; }
    .awj-link:hover { color: ${TEAL}; }
    .awj-row-item { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid ${BORDER}; text-decoration: none; transition: background 0.15s; color: inherit; }
    .awj-row-item:last-child { border-bottom: none; }
    .awj-row-item:hover { background: ${SURFACE_HI}; }
    .awj-avatar { width: 38px; height: 38px; border-radius: 12px; background: rgba(31,209,189,0.12); border: 1px solid rgba(31,209,189,0.28); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: ${TEAL}; flex-shrink: 0; }
    .awj-pulse { animation: awjPulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
    @keyframes awjPulse { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:0.4; transform: scale(0.92); } }
    .awj-fade-in { animation: awjFadeIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
    @keyframes awjFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    .awj-number { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
    .awj-hero-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
    .awj-clients-row { display: grid; grid-template-columns: 260px 1fr; gap: 16px; margin-bottom: 32px; }
    .awj-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .awj-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .awj-header-flex { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; gap: 20px; flex-wrap: wrap; }
    .awj-header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .awj-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
    .awj-kpi-full { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-bottom: 16px; }
    .awj-period-btn { background: ${SURFACE}; border: 1px solid ${BORDER}; color: ${TEXT_MUTED}; border-radius: 8px; padding: 6px 14px; font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; }
    .awj-period-btn.active { background: rgba(31,209,189,0.12); border-color: rgba(31,209,189,0.4); color: ${TEAL}; }
    .awj-period-btn:hover:not(.active) { background: ${SURFACE_HI}; color: ${TEXT}; }
    .awj-section-divider { display: flex; align-items: center; gap: 16px; margin: 36px 0 20px; }
    .awj-section-divider-line { flex: 1; height: 1px; background: ${BORDER}; }
    .awj-section-divider-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${TEXT_MUTED}; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
    @media (max-width: 1024px) {
      .awj-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
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
          <div style={{ width: 36, height: 36, border: `3px solid ${BORDER}`, borderTopColor: TEAL, borderRadius: "50%", animation: "spin 0.8s cubic-bezier(0.4,0,0.2,1) infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: TEXT_MUTED, fontSize: 13, fontWeight: 500 }}>Chargement du tableau de bord…</p>
        </div>
      </div>
    </>
  );

  if (error) return (
    <>
      <style>{css}</style>
      <div className="awj-dash" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="awj-card" style={{ padding: 32, textAlign: "center", maxWidth: 400, margin: 20 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 30, color: RED, marginBottom: 16, display: "block" }} />
          <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>{error}</p>
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
    { value: Number(cs.plan_ivoirienne ?? 0), color: BRAND_LT },
    { value: Number(cs.plan_turquoise ?? 0), color: "#7fe8db" },
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
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL }} className="awj-pulse" />
                <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: TEXT }}>
                {greeting}, {user?.name?.split(" ")[0]}
              </h1>
              <p style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 4, margin: 0 }}>
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
              <Eyebrow icon="ti-apps">Portails applicatifs</Eyebrow>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
                {[
                  { key: "admin", icon: "ti-shield-check", label: "Administration", desc: "Configuration centrale", color: BRAND_LT, link: "/dashboard", stat: `${totalClients} membres` },
                  { key: "agent", icon: "ti-id-badge", label: "Réseau Agents", desc: "Outils de collecte terrain", color: TEAL, link: "/agents", stat: `${top_agents?.length ?? 0} actifs` },
                  { key: "client", icon: "ti-user", label: "Espace Adhérent", desc: "Suivi des garanties", color: BRAND_LT, link: "/clients", stat: `${totalActifs} actifs` },
                  { key: "diaspora", icon: "ti-world", label: "Guichet Diaspora", desc: "Souscriptions internationales", color: AMBER, link: "/diaspora", stat: "Canal actif" },
                  { key: "business", icon: "ti-building", label: "Espace Corporate", desc: "Grands comptes CNEPECI", color: VIOLET, link: "/business", stat: "B2B actif" },
                  { key: "parrainage", icon: "ti-link", label: "Affiliation", desc: "Programme de référents", color: "#ea8a4d", link: "/referral", stat: "10% intéressement" },
                ].map((portal) => (
                  <Link key={portal.key} to={portal.link} style={{ textDecoration: "none" }}>
                    <div className="awj-card awj-card-hover" style={{ padding: 16, cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `${portal.color}1f`, borderRadius: 9 }}>
                          <i className={`ti ${portal.icon}`} style={{ fontSize: 16, color: portal.color }} />
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(31,209,189,0.14)", padding: "2px 6px", borderRadius: 4, color: TEAL }}>ACTIF</span>
                      </div>
                      <h4 style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px", color: TEXT }}>{portal.label}</h4>
                      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: "0 0 12px", lineHeight: 1.3 }}>{portal.desc}</p>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0, color: TEXT }}>Grille de cotisation & offres</h3>
                  <p style={{ fontSize: 12, color: TEXT_MUTED, margin: "2px 0 0" }}>{plans.length} formules actives sur le système</p>
                </div>
                <button className="awj-btn-primary" onClick={() => { setEditingPlan(null); setPlanModal(true); }}>
                  <i className="ti ti-plus" style={{ fontSize: 14 }} /> Créer une formule
                </button>
              </div>
              {plans.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: TEXT_MUTED }}>
                  <i className="ti ti-clipboard-off" style={{ fontSize: 28, marginBottom: 8, display: "block" }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Aucune offre pré-paramétrée.</p>
                </div>
              ) : plans.map((plan) => (
                <div key={plan.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, opacity: plan.is_active ? 1 : 0.5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{plan.name}</span>
                      {!plan.is_active && <span style={{ fontSize: 10, background: SURFACE_HI, color: TEXT_MUTED, padding: "2px 6px", borderRadius: 4 }}>Désactivé</span>}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: TEXT_MUTED }}>Adhésion : <strong style={{ color: TEXT }}>{plan.adhesion_price === 0 ? "Gratuit" : `${Number(plan.adhesion_price).toLocaleString("fr-FR")} FCFA`}</strong></span>
                      <span style={{ fontSize: 12, color: TEXT_MUTED }}>Cotisation : <strong style={{ color: TEAL }}>{Number(plan.monthly_price).toLocaleString("fr-FR")} FCFA/mois</strong></span>
                      <span style={{ fontSize: 12, color: TEXT_MUTED }}>Prise en charge : <strong style={{ color: BRAND_LT }}>{plan.coverage_percent}%</strong></span>
                    </div>
                    {plan.benefits?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {plan.benefits.map((b) => (
                          <span key={b.category} style={{ fontSize: 11, background: "rgba(31,209,189,0.10)", color: TEAL, border: "1px solid rgba(31,209,189,0.24)", padding: "2px 8px", borderRadius: 6 }}>
                            {b.category.replace(/_/g, " ")}{b.coverage_percent != null && ` ${b.coverage_percent}%`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => togglePlanActive(plan)} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, background: plan.is_active ? "rgba(31,209,189,0.14)" : SURFACE_HI, color: plan.is_active ? TEAL : TEXT_MUTED }}>
                      {plan.is_active ? "Actif" : "Suspendu"}
                    </button>
                    <button onClick={() => { setEditingPlan(plan); setPlanModal(true); }} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, background: "rgba(91,161,230,0.14)", color: BRAND_LT }}>Modifier</button>
                    <button onClick={() => deletePlan(plan)} style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", background: "rgba(248,113,113,0.12)", color: RED, display: "flex", alignItems: "center" }}>
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

          {/* ══ HERO FINANCIER — les 3 chiffres qui comptent le plus ═ */}
          <div className="awj-hero-grid">
            <div className="awj-card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: TEAL }} />
              <Eyebrow>Chiffre d'affaires total</Eyebrow>
              <div className="awj-number" style={{ color: TEAL }}>
                {fmtShort(ps.total_revenue)}
                <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED, marginLeft: 6 }}>FCFA</span>
              </div>
              <p style={{ fontSize: 11, color: TEXT_MUTED, margin: "4px 0 16px" }}>Cumul sur {ps.total_payments ?? 0} transactions approuvées</p>
              <Trend data={evolution} color={TEAL} height={42} />
            </div>

            <div className="awj-card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: BRAND_LT }} />
              <Eyebrow>Encaissements du jour</Eyebrow>
              <div className="awj-number" style={{ color: BRAND_LT }}>
                {fmtShort(ps.today_revenue)}
                <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED, marginLeft: 6 }}>FCFA</span>
              </div>
              <p style={{ fontSize: 11, color: TEXT_MUTED, margin: "4px 0 16px" }}>{ps.today_payments ?? 0} écritures enregistrées ce jour</p>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <span style={{ fontSize: 10, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Frais d'adhésion</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{fmtShort(ps.adhesions_revenue)}</span>
                </div>
                <div style={{ width: 1, background: BORDER }} />
                <div>
                  <span style={{ fontSize: 10, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Cotisations</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{fmtShort(ps.mensualites_revenue)}</span>
                </div>
              </div>
            </div>

            <div className="awj-card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: AMBER }} />
              <Eyebrow>Canaux de règlement</Eyebrow>
              {[
                { label: "Mobile Money (Jeko)", icon: "ti-device-mobile", value: Number(ps.wave_revenue), color: AMBER },
                { label: "Dépôts espèces (Guichet)", icon: "ti-cash", value: Number(ps.cash_revenue), color: TEAL },
              ].map((m) => (
                <div key={m.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                      <i className={`ti ${m.icon}`} style={{ fontSize: 12, color: m.color }} /> {m.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{fmtShort(m.value)} FCFA</span>
                  </div>
                  <SlimBar value={m.value} max={Number(ps.total_revenue)} color={m.color} />
                  <p style={{ fontSize: 10, color: TEXT_FAINT, marginTop: 2 }}>
                    {ps.total_revenue > 0 ? Math.round((m.value / Number(ps.total_revenue)) * 100) : 0}% du total
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ══ SEGMENTATION ADHÉRENTS ══════════════════════════════ */}
          <div className="awj-clients-row">
            <div className="awj-card" style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Eyebrow style={{ alignSelf: "flex-start", marginBottom: 16 }}>Portefeuille offres</Eyebrow>
              <Donut segments={donutSegments} size={100} />
              <div style={{ marginTop: 16, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Essentielle", value: Number(cs.plan_essentielle ?? 0), color: TEAL },
                  { label: "Ivoirienne", value: Number(cs.plan_ivoirienne ?? 0), color: BRAND_LT },
                  { label: "Turquoise", value: Number(cs.plan_turquoise ?? 0), color: "#7fe8db" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                      <span style={{ fontSize: 11, color: TEXT_MUTED }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="awj-stat-grid">
              {[
                { label: "Total adhérents", value: totalClients, sub: "Dossiers enregistrés", color: TEXT, icon: "ti-users", to: "/clients" },
                { label: "Garanties actives", value: totalActifs, sub: "À jour de cotisation", color: TEAL, icon: "ti-shield-check", to: "/clients?status=actif" },
                { label: "En attente d'affiliation", value: totalAttente, sub: "Pièces à vérifier", color: AMBER, icon: "ti-hourglass", to: "/clients?status=attente" },
                { label: "Niveau Essentielle", value: cs.plan_essentielle ?? 0, color: TEAL, to: "/clients?plan=ESSENTIELLE" },
                { label: "Niveau Ivoirienne", value: cs.plan_ivoirienne ?? 0, color: BRAND_LT, to: "/clients?plan=IVOIRIENNE" },
                { label: "Niveau Turquoise", value: cs.plan_turquoise ?? 0, color: "#7fe8db", to: "/clients?plan=TURQUOISE" },
              ].map((s) => (
                <Link key={s.label} to={s.to} style={{ textDecoration: "none" }}>
                  <div className="awj-card awj-card-hover" style={{ padding: "18px 20px", height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <Eyebrow style={{ margin: 0, fontSize: 10 }}>{s.label}</Eyebrow>
                      {s.icon && <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: s.color }} />}
                    </div>
                    <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: s.color, margin: "0 0 4px" }}>{s.value}</p>
                    {s.sub ? (
                      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>{s.sub}</p>
                    ) : (
                      <>
                        <SlimBar value={Number(s.value)} max={totalClients} color={s.color} />
                        <span style={{ fontSize: 10, color: TEXT_FAINT, display: "block", marginTop: 4 }}>
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

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0 }}>Indicateurs consolidés</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ k: "month", l: "Mois en cours" }, { k: "quarter", l: "Trimestre" }, { k: "year", l: "Vue annuelle" }].map(({ k, l }) => (
                    <button key={k} className={`awj-period-btn${kpiPeriod === k ? " active" : ""}`} onClick={() => setKpiPeriod(k)}>{l}</button>
                  ))}
                </div>
              </div>

              {/* 4 métriques clés — un seul jeu de cartes, un seul langage graphique */}
              <div className="awj-kpi-grid">
                <KpiCard icon="ti-chart-bar" label="Chiffre d'affaires brut" value={fmtShort(ps.total_revenue)} sub="Total encaissements" color={TEAL} trend={14} chart={evolutionBar} />
                <KpiCard icon="ti-refresh" label="Taux de fidélisation" value={`${tauxFidelisation}%`} sub="Seuil critique : 80%" color={BRAND_LT} trend={2.4} radial radialLabel="Taux d'activité récurrent" />
                <KpiCard icon="ti-trending-up" label="Taux de conversion" value={`${tauxConversion}%`} sub="Objectif trim. : 70%" color={VIOLET} trend={-1.2} radial radialLabel="Prospects devenus actifs" />
                <KpiCard icon="ti-scale" label="Cotisation moyenne (ARPU)" value={fmtShort(revenuMoyen)} sub="Valeur par bénéficiaire actif" color={AMBER} trend={5.8} chart={evolutionBar} />
              </div>

              {/* Santé financière — recouvrement / sinistralité / NPS regroupés dans une seule carte à 3 lignes, plutôt que 3 cartes séparées */}
              <div className="awj-card" style={{ padding: "22px 22px 6px", marginBottom: 16 }}>
                <Eyebrow icon="ti-activity-heartbeat" style={{ marginBottom: 20 }}>Santé financière</Eyebrow>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 22, borderBottom: `1px solid ${BORDER}` }}>
                    <Radial value={tauxRecouvrement} max={100} color={TEAL} size={72} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: "0 0 2px" }}>Recouvrement</p>
                      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>Appels de fonds honorés</p>
                      <span style={{ fontSize: 10, fontWeight: 700, marginTop: 4, display: "inline-block", padding: "2px 7px", borderRadius: 6, background: tauxRecouvrement >= 85 ? "rgba(31,209,189,0.14)" : "rgba(248,113,113,0.14)", color: tauxRecouvrement >= 85 ? TEAL : RED }}>
                        {tauxRecouvrement >= 85 ? "Stable" : "Risque d'impayés"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 22, borderBottom: `1px solid ${BORDER}` }}>
                    <Radial value={sinistralite} max={100} color={RED} size={72} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: "0 0 2px" }}>Sinistralité</p>
                      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>Prestations vs cotisations</p>
                      <span style={{ fontSize: 10, color: TEXT_FAINT, marginTop: 4, display: "block" }}>{100 - sinistralite}% de marge de réserve</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 22, borderBottom: `1px solid ${BORDER}` }}>
                    <Radial value={nps} max={100} color={VIOLET} size={72} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: TEXT, margin: "0 0 2px" }}>Satisfaction (NPS)</p>
                      <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>Objectif annuel : +80</p>
                      <span style={{ fontSize: 10, color: TEXT_FAINT, marginTop: 4, display: "block" }}>Excellent niveau d'engagement</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Évolution CA + Alertes */}
              <div className="awj-kpi-full">
                <div className="awj-card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <Eyebrow icon="ti-chart-line" style={{ margin: "0 0 4px" }}>Évolution mensuelle du chiffre d'affaires</Eyebrow>
                      <p style={{ fontSize: 12, color: TEXT_MUTED, margin: 0 }}>Historique glissant des souscriptions</p>
                    </div>
                    <span style={{ fontSize: 10, background: "rgba(31,209,189,0.14)", color: TEAL, padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>Tendance saine</span>
                  </div>
                  {evolution.length >= 2 ? (
                    <div>
                      <Trend data={evolution} color={TEAL} height={110} dots />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        {evolution.map((e, i) => (
                          <span key={i} style={{ fontSize: 9, color: TEXT_FAINT }}>{e.period || e.month || `M${i + 1}`}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_FAINT, fontSize: 12 }}>Données d'historique insuffisantes.</div>
                  )}
                  <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
                    {[
                      { label: "Adhésions", value: ps.adhesions_revenue, color: BRAND_LT },
                      { label: "Cotisations", value: ps.mensualites_revenue, color: TEAL },
                    ].map((s) => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                        <span style={{ fontSize: 11, color: TEXT_MUTED }}>{s.label} </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{fmtShort(s.value)} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="awj-card" style={{ padding: 20 }}>
                  <Eyebrow icon="ti-alert-triangle" style={{ marginBottom: 14 }}>Alertes opérationnelles</Eyebrow>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {totalAttente > 0 && (
                      <Link to={`${ADMIN_BASE}/clients?status=attente`} style={{ textDecoration: "none" }}>
                        <div style={{ background: "rgba(245,165,36,0.08)", border: "1px solid rgba(245,165,36,0.22)", borderRadius: 10, padding: "10px 14px", transition: "all 0.2s" }}>
                          <span style={{ color: AMBER, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                            <i className="ti ti-alert-triangle" style={{ fontSize: 13 }} /> Validation bloquée
                          </span>
                          <span style={{ color: TEXT_MUTED, fontSize: 11 }}>{totalAttente} dossiers en attente d'approbation administrative.</span>
                        </div>
                      </Link>
                    )}
                    {tauxFidelisation < 80 && (
                      <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                        <span style={{ color: RED, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-trending-down" style={{ fontSize: 13 }} /> Seuil d'alerte résiliations
                        </span>
                        <span style={{ color: TEXT_MUTED, fontSize: 11 }}>Le taux d'activité récurrent est sous l'objectif fixé (80%).</span>
                      </div>
                    )}
                    {tauxConversion < 70 && (
                      <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                        <span style={{ color: VIOLET, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-target-arrow" style={{ fontSize: 13 }} /> Conversion sous objectif
                        </span>
                        <span style={{ color: TEXT_MUTED, fontSize: 11 }}>Taux actuel {tauxConversion}% — objectif trimestriel : 70%.</span>
                      </div>
                    )}
                    {totalAttente === 0 && tauxFidelisation >= 80 && tauxConversion >= 70 && (
                      <div style={{ background: "rgba(31,209,189,0.08)", border: "1px solid rgba(31,209,189,0.22)", borderRadius: 10, padding: 12, textAlign: "center", color: TEAL, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: TEXT, display: "flex", alignItems: "center", gap: 6 }}>
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
                          <span style={{ fontWeight: 600, fontSize: 13, color: TEXT }}>{agent.name}</span>
                          <strong style={{ color: TEAL, fontSize: 13 }}>{fmtShort(agent.total_revenue)} FCFA</strong>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, background: BORDER, height: 4, borderRadius: 99 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: idx === 0 ? AMBER : BRAND_LT, borderRadius: 99, transition: "width 0.8s ease" }} />
                          </div>
                          <span style={{ fontSize: 11, color: TEXT_FAINT }}>{agent.nb_clients} portefeuilles</span>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: TEXT }}>Dernières inscriptions</p>
                <Link to={`${ADMIN_BASE}/clients`} className="awj-link">Consulter le registre <i className="ti ti-arrow-right" style={{ fontSize: 12 }} /></Link>
              </div>
              {!last_clients?.length ? (
                <p style={{ textAlign: "center", color: TEXT_FAINT, fontSize: 12, padding: "40px 0" }}>Aucune donnée sociétaire disponible.</p>
              ) : last_clients.map((c) => (
                <Link key={c.id} to={`${ADMIN_BASE}/clients/${c.id}`} className="awj-row-item">
                  <div className="awj-avatar">{c.name?.charAt(0)?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: TEXT, display: "block" }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: TEXT_FAINT, fontFamily: "monospace", marginTop: 2, display: "block" }}>{c.mutual_number}</span>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    <PlanBadge plan={c.plan} />
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}` }}>
                <Link to={`${ADMIN_BASE}/clients/new`} className="awj-link"><i className="ti ti-plus" style={{ fontSize: 12 }} /> Enregistrer un mutualiste</Link>
              </div>
            </div>

            <div className="awj-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: TEXT }}>Journal des opérations financières</p>
                <Link to={`${ADMIN_BASE}/payments`} className="awj-link">Grand livre de caisse <i className="ti ti-arrow-right" style={{ fontSize: 12 }} /></Link>
              </div>
              {!last_payments?.length ? (
                <p style={{ textAlign: "center", color: TEXT_FAINT, fontSize: 12, padding: "40px 0" }}>Aucun flux monétaire enregistré.</p>
              ) : last_payments.map((p) => (
                <div key={p.id} className="awj-row-item">
                  <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: p.type === "adhesion" ? "rgba(91,161,230,0.12)" : "rgba(31,209,189,0.12)", border: `1px solid ${p.type === "adhesion" ? "rgba(91,161,230,0.26)" : "rgba(31,209,189,0.26)"}` }}>
                    <i className={`ti ${p.type === "adhesion" ? "ti-file-text" : "ti-refresh"}`} style={{ fontSize: 15, color: p.type === "adhesion" ? BRAND_LT : TEAL }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: TEXT, display: "block" }}>{p.client_name}</span>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                      <TypeBadge type={p.type} />
                      <MethodBadge method={p.payment_method} />
                      {isAdmin && p.agent_name && <span style={{ fontSize: 11, color: TEXT_FAINT }}>• {p.agent_name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <strong style={{ color: TEAL, fontSize: 13, display: "block" }}>{fmtShort(p.amount)} FCFA</strong>
                    <span style={{ fontSize: 11, color: TEXT_FAINT, marginTop: 2, display: "block" }}>{fmtDate(p.created_at)}</span>
                  </div>
                </div>
              ))}
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}` }}>
                <Link to={`${ADMIN_BASE}/clients`} className="awj-link"><i className="ti ti-plus" style={{ fontSize: 12 }} /> Enregistrer un paiement</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
