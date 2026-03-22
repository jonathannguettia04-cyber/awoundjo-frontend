// src/pages/provider/ProviderDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { providerDashAPI, getProviderData } from "../../providerApi";

const TYPE_LABELS = { pharmacy: "Pharmacie", clinic: "Clinique", hospital: "Hôpital", lab: "Laboratoire" };
const TYPE_ICONS  = { pharmacy: "💊", clinic: "🏥", hospital: "🏨", lab: "🔬" };
const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

export default function ProviderDashboard() {
  const navigate  = useNavigate();
  const provider  = getProviderData();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerDashAPI.stats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const kpis = [
    { label: "Patients aujourd'hui", value: loading ? "…" : (stats?.patients_today || 0), icon: "👤", color: "#2563EB", bg: "#EFF6FF" },
    { label: "Actes enregistrés",    value: loading ? "…" : (stats?.total_services || 0), icon: "📝", color: "#059669", bg: "#ECFDF5" },
    { label: "Montant du jour",      value: loading ? "…" : fmt(stats?.amount_today),     icon: "💰", color: "#D97706", bg: "#FFFBEB" },
    { label: "À facturer",           value: loading ? "…" : fmt(stats?.pending_billing),   icon: "📄", color: "#7C3AED", bg: "#F5F3FF" },
  ];

  const quickActions = [
    { icon: "🔍", label: "Nouvelle prise en charge", desc: "Vérifier et enregistrer un acte", path: "/etablissement/scan", primary: true },
    { icon: "📋", label: "Dossiers médicaux",        desc: "Consulter les dossiers patients",  path: "/etablissement/medical" },
    { icon: "💰", label: "Facturation",               desc: "Gérer les factures mutuelles",    path: "/etablissement/billing" },
    { icon: "📝", label: "Historique des actes",      desc: "Tous les actes enregistrés",      path: "/etablissement/services" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Hero */}
      <div style={s.hero}>
        <div>
          <p style={s.heroGreet}>{greet} 👋</p>
          <h1 style={s.heroName}>{provider?.name}</h1>
          <span style={s.heroBadge}>
            {TYPE_ICONS[provider?.type]} {TYPE_LABELS[provider?.type]}
          </span>
        </div>
        <button onClick={() => navigate("/etablissement/scan")} style={s.heroBtn}>
          🔍 Nouvelle prise en charge
        </button>
      </div>

      {/* KPIs */}
      <div style={s.kpiGrid}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...s.kpiCard, borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={s.kpiLabel}>{k.label}</p>
              <div style={{ ...s.kpiIcon, background: k.bg, color: k.color }}>{k.icon}</div>
            </div>
            <p style={{ ...s.kpiValue, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Actions rapides</h2>
        <div style={s.actionGrid}>
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              style={{ ...s.actionCard, ...(a.primary ? s.actionCardPrimary : {}) }}>
              <span style={{ fontSize: 28, marginBottom: 10, display: "block" }}>{a.icon}</span>
              <p style={{ ...s.actionLabel, color: a.primary ? "#fff" : "#1E293B" }}>{a.label}</p>
              <p style={{ ...s.actionDesc, color: a.primary ? "rgba(255,255,255,.7)" : "#94A3B8" }}>{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

const s = {
  hero:        { background: "linear-gradient(135deg,#1E3A8A,#2563EB)", borderRadius: 20, padding: "28px 32px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" },
  heroGreet:   { color: "rgba(255,255,255,.7)", fontSize: 14, margin: "0 0 4px" },
  heroName:    { color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 10px", letterSpacing: -.5 },
  heroBadge:   { background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.2)" },
  heroBtn:     { background: "#fff", color: "#2563EB", border: "none", borderRadius: 12, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(0,0,0,.15)" },

  kpiGrid:     { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 },
  kpiCard:     { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 22px" },
  kpiLabel:    { fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .8, margin: 0 },
  kpiIcon:     { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  kpiValue:    { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -.5 },

  section:     { marginBottom: 28 },
  sectionTitle:{ fontSize: 14, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  actionGrid:  { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 },
  actionCard:  { background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "22px 20px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s" },
  actionCardPrimary: { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", border: "none" },
  actionLabel: { fontSize: 14, fontWeight: 700, margin: "0 0 4px" },
  actionDesc:  { fontSize: 12, margin: 0 },
};
