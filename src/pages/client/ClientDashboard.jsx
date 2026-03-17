// src/pages/client/ClientDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientProfileAPI, PLANS, STATUS_LABELS } from "../../clientApi";

const MENU = [
  { path: "/client/dossier",          icon: "📋", label: "Dossier Médical",  color: "#8B5CF6", bg: "#F5F3FF" },
  { path: "/client/teleconsultation", icon: "💬", label: "Téléconsultation", color: "#06B6D4", bg: "#ECFEFF" },
  { path: "/client/cotisations",      icon: "💰", label: "Cotisations",      color: "#10B981", bg: "#ECFDF5" },
  { path: "/client/reseau",           icon: "🏥", label: "Réseau de Soins",  color: "#F59E0B", bg: "#FFFBEB" },
  { path: "/client/famille",          icon: "👨‍👩‍👧‍👦", label: "Ma Famille",      color: "#EC4899", bg: "#FDF2F8" },
  { path: "/client/carte",            icon: "💳", label: "Ma Carte",         color: "#1a56db", bg: "#EFF6FF" },
];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientProfileAPI.get()
      .then(res => setProfile(res.data.data))
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!profile) return null;

  const plan   = PLANS[profile.plan]          || PLANS.ESSENTIELLE;
  const status = STATUS_LABELS[profile.status] || STATUS_LABELS.active;
  const expiry = profile.expiration_date
    ? new Date(profile.expiration_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "N/A";

  const expiringSoon = () => {
    if (!profile.expiration_date) return false;
    return new Date(profile.expiration_date) - new Date() < 30 * 86400000;
  };

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={{ ...s.hero, background: `linear-gradient(135deg, ${plan.color}, #1e3a8a)` }}>
        <div style={s.heroTop}>
          <div>
            <p style={s.greet}>Bonjour 👋</p>
            <h2 style={s.heroName}>{profile.name}</h2>
            <p style={s.heroNum}>{profile.mutual_number}</p>
          </div>
          <div style={s.badge}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{plan.coverage}</span>
            <span style={{ fontSize: 10, opacity: .8 }}>couverture</span>
          </div>
        </div>
        <div style={s.heroBottom}>
          <Info label="Plan"    value={plan.name} />
          <Info label="Statut"  value={
            <span style={{ ...s.pill, background: profile.status === "active" ? "#10B981" : "#EF4444" }}>
              {status.label}
            </span>
          } />
          <Info label="Expire le" value={expiry} />
        </div>
      </div>

      {/* Alerte */}
      {(expiringSoon() || profile.status === "renewal_required") && (
        <div style={s.alert}>
          <span>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={s.alertTitle}>Renouvellement requis</p>
            <p style={s.alertSub}>Votre adhésion expire bientôt.</p>
          </div>
          <button onClick={() => navigate("/client/cotisations")} style={s.alertBtn}>Renouveler</button>
        </div>
      )}

      {/* Stats famille */}
      <div style={s.statsRow}>
        {[
          { icon: "👤", val: "Vous",      label: "Titulaire" },
          { icon: "💑", val: `${profile.dependents_summary?.spouse   || 0}/1`, label: "Conjoint(e)" },
          { icon: "👶", val: `${profile.dependents_summary?.children || 0}/4`, label: "Enfants" },
        ].map((st, i) => (
          <div key={i} style={s.stat}>
            <span style={{ fontSize: 22 }}>{st.icon}</span>
            <span style={s.statVal}>{st.val}</span>
            <span style={s.statLabel}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Menu services */}
      <p style={s.secTitle}>Mes services</p>
      <div style={s.grid}>
        {MENU.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            style={{ ...s.menuCard, background: item.bg }}>
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Agent */}
      {profile.agent_name && (
        <div style={s.agentCard}>
          <span style={{ fontSize: 32 }}>👨‍💼</span>
          <div style={{ flex: 1 }}>
            <p style={s.agentLabel}>Votre agent</p>
            <p style={s.agentName}>{profile.agent_name}</p>
          </div>
          <a href={`tel:${profile.agent_phone}`} style={s.callBtn}>📞 Appeler</a>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, opacity: .7, color: "#fff" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ height: 180, background: "#E5E7EB", borderRadius: 20, marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 80, background: "#E5E7EB", borderRadius: 12 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 100, background: "#E5E7EB", borderRadius: 16 }} />)}
      </div>
    </div>
  );
}

const s = {
  page:       { padding: "16px 16px 0" },
  hero:       { borderRadius: 20, padding: "24px 20px", color: "#fff", boxShadow: "0 8px 30px rgba(26,86,219,.3)", marginBottom: 16 },
  heroTop:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greet:      { fontSize: 14, opacity: .8, margin: "0 0 4px" },
  heroName:   { fontSize: 22, fontWeight: 700, margin: "0 0 4px" },
  heroNum:    { fontSize: 13, opacity: .7, margin: 0, fontFamily: "monospace", letterSpacing: 1 },
  badge:      { display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,.2)", borderRadius: 12, padding: "10px 14px" },
  heroBottom: { display: "flex", gap: 20, flexWrap: "wrap" },
  pill:       { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: "#fff" },
  alert:      { background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontSize: 13 },
  alertTitle: { fontWeight: 600, color: "#92400E", margin: "0 0 2px", fontSize: 13 },
  alertSub:   { color: "#B45309", margin: 0, fontSize: 12 },
  alertBtn:   { background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Poppins',sans-serif" },
  statsRow:   { display: "flex", gap: 12, marginBottom: 20 },
  stat:       { flex: 1, background: "#fff", borderRadius: 14, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,.06)" },
  statVal:    { fontSize: 15, fontWeight: 700, color: "#111827" },
  statLabel:  { fontSize: 11, color: "#6B7280" },
  secTitle:   { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 12 },
  grid:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  menuCard:   { borderRadius: 16, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, border: "none", cursor: "pointer", textAlign: "left" },
  agentCard:  { background: "#fff", borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,.06)", marginBottom: 16 },
  agentLabel: { fontSize: 11, color: "#6B7280", margin: "0 0 2px" },
  agentName:  { fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 },
  callBtn:    { background: "#EFF6FF", color: "#1a56db", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" },
};
