// src/pages/provider/ProviderDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { providerDashAPI, getProviderData } from "../../providerApi";

const TYPE_LABELS = { pharmacy: "Pharmacie", clinic: "Clinique", hospital: "Hôpital", lab: "Laboratoire" };
const TYPE_ICONS  = { pharmacy: "💊", clinic: "🏥", hospital: "🏨", lab: "🔬" };
const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

// Palette Awoundjô — même bleu que l'écran de connexion, pour une identité cohérente sur tout le portail
const BLUE      = "#185FA5";
const BLUE_DARK = "#0C447C";
const BLUE_DEEP = "#042C53";
const AMBER     = "#B45309"; // réservé aux éléments liés aux accords préalables (statut "en attente")
const AMBER_BG  = "#FFF7ED";

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const provider = getProviderData();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerDashAPI.stats().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const kpis = [
    { label: "Patients aujourd'hui", value: loading ? "…" : (stats?.patients_today || 0),      icon: "👤", color: BLUE,      bg: "#E6F1FB" },
    { label: "Actes enregistrés",    value: loading ? "…" : (stats?.total_services || 0),       icon: "📝", color: "#059669", bg: "#ECFDF5" },
    { label: "Accords en attente",   value: loading ? "…" : (stats?.pending_prior_auth || 0),   icon: "⏳", color: AMBER,     bg: AMBER_BG   },
    { label: "À facturer",           value: loading ? "…" : fmt(stats?.pending_billing),        icon: "💰", color: "#7C3AED", bg: "#F5F3FF" },
  ];

  const quickActions = [
    { icon: "🔍", label: "Nouvelle prise en charge", desc: "Vérifier et enregistrer un acte",       path: "/etablissement/scan",           primary: true },
    { icon: "📋", label: "Accord préalable",         desc: "Hospitalisation, césarienne, chirurgie", path: "/etablissement/accord-prealable", warning: true },
    { icon: "🗂️", label: "Dossiers médicaux",        desc: "Consulter les dossiers patients",        path: "/etablissement/medical" },
    { icon: "💰", label: "Facturation",               desc: "Gérer les factures mutuelles",           path: "/etablissement/billing" },
    { icon: "📝", label: "Historique des actes",      desc: "Tous les actes et demandes",             path: "/etablissement/services" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        .pd-hero { display: flex; align-items: center; justify-content: space-between; }
        .pd-hero-btn { display: block; }
        .pd-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 32px; }
        .pd-action-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; }
        @media (max-width: 900px) {
          .pd-action-grid { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 768px) {
          .pd-hero { flex-direction: column; align-items: flex-start; gap: 16px; }
          .pd-hero-btn { width: 100%; text-align: center; }
          .pd-kpi-grid { grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
          .pd-action-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
        }
        @media (max-width: 420px) {
          .pd-kpi-grid { grid-template-columns: 1fr 1fr; }
          .pd-action-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* Hero */}
      <div className="pd-hero" style={s.hero}>
        <div>
          <p style={s.heroGreet}>{greet} 👋</p>
          <h1 style={s.heroName}>{provider?.name}</h1>
          <span style={s.heroBadge}>{TYPE_ICONS[provider?.type]} {TYPE_LABELS[provider?.type]}</span>
        </div>
        <button className="pd-hero-btn" onClick={() => navigate("/etablissement/scan")} style={s.heroBtn}>
          🔍 Nouvelle prise en charge
        </button>
      </div>

      {/* KPIs */}
      <div className="pd-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} style={{ ...s.kpiCard, borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={s.kpiLabel}>{k.label}</p>
              <div style={{ ...s.kpiIcon, background: k.bg, color: k.color }}>{k.icon}</div>
            </div>
            <p style={{ ...s.kpiValue, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={s.sectionTitle}>Actions rapides</h2>
        <div className="pd-action-grid">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              style={{
                ...s.actionCard,
                ...(a.primary ? s.actionCardPrimary : {}),
                ...(a.warning ? s.actionCardWarning : {}),
              }}>
              <span style={{ fontSize: 26, marginBottom: 8, display: "block" }}>{a.icon}</span>
              <p style={{ ...s.actionLabel, color: a.primary ? "#fff" : a.warning ? AMBER : "#1E293B" }}>{a.label}</p>
              <p style={{ ...s.actionDesc, color: a.primary ? "rgba(255,255,255,.7)" : a.warning ? "#92400E" : "#94A3B8" }}>{a.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  hero:        { background: `linear-gradient(135deg,${BLUE_DEEP},${BLUE})`, borderRadius: 20, padding: "24px 28px", marginBottom: 28, boxShadow: `0 8px 32px rgba(24,95,165,.25)` },
  heroGreet:   { color: "rgba(255,255,255,.7)", fontSize: 14, margin: "0 0 4px" },
  heroName:    { color: "#fff", fontSize: "clamp(18px,4vw,24px)", fontWeight: 800, margin: "0 0 10px", letterSpacing: -.5 },
  heroBadge:   { background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.2)" },
  heroBtn:     { background: "#fff", color: BLUE, border: "none", borderRadius: 12, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(0,0,0,.15)", whiteSpace: "nowrap" },
  kpiCard:     { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "18px 20px" },
  kpiLabel:    { fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .8, margin: 0 },
  kpiIcon:     { width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  kpiValue:    { fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, margin: 0, letterSpacing: -.5 },
  sectionTitle:{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  actionCard:  { background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "20px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s" },
  actionCardPrimary: { background: `linear-gradient(135deg,${BLUE},${BLUE_DARK})`, border: "none" },
  actionCardWarning: { background: AMBER_BG, border: `1.5px solid #FDE1C1` },
  actionLabel: { fontSize: 13, fontWeight: 700, margin: "0 0 4px" },
  actionDesc:  { fontSize: 12, margin: 0 },
};
