// src/pages/provider/ProviderDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { providerDashAPI, getProviderData } from "../../providerApi";

const TYPE_LABELS = { pharmacy: "Pharmacie", clinic: "Clinique", hospital: "Hôpital", lab: "Laboratoire" };
const TYPE_ICONS  = { pharmacy: "💊", clinic: "🏥", hospital: "🏨", lab: "🔬" };
const fmt = (n) => Number(n||0).toLocaleString("fr-FR") + " FCFA";

const MENU = [
  { path: "/etablissement/scan",     icon: "📷", label: "Scanner un patient",    color: "#00BCD4", bg: "linear-gradient(135deg,#E0F7FA,#B2EBF2)" },
  { path: "/etablissement/search",   icon: "🔍", label: "Rechercher un patient", color: "#0097A7", bg: "linear-gradient(135deg,#E0F2F1,#B2DFDB)" },
  { path: "/etablissement/services", icon: "📝", label: "Enregistrer un acte",   color: "#00897B", bg: "linear-gradient(135deg,#E8F5E9,#C8E6C9)" },
  { path: "/etablissement/medical",  icon: "📋", label: "Dossiers médicaux",     color: "#1565C0", bg: "linear-gradient(135deg,#E3F2FD,#BBDEFB)" },
  { path: "/etablissement/billing",  icon: "💰", label: "Facturation",           color: "#F57F17", bg: "linear-gradient(135deg,#FFFDE7,#FFF9C4)" },
  { path: "/etablissement/history",  icon: "📅", label: "Historique",            color: "#6A1B9A", bg: "linear-gradient(135deg,#F3E5F5,#E1BEE7)" },
];

export default function ProviderDashboard() {
  const navigate  = useNavigate();
  const provider  = getProviderData();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    providerDashAPI.stats()
      .then(r => { setStats(r.data); setTimeout(() => setVisible(true), 80); })
      .catch(() => setVisible(true))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div style={{ paddingBottom: 20, fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#0f2942,#0a3d62)",
        borderRadius: 20, padding: "22px 20px", marginBottom: 18,
        boxShadow: "0 8px 32px rgba(15,41,66,.3)",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, margin: "0 0 4px" }}>{greet} 👋</p>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 3px", letterSpacing: -.3 }}>
              {provider?.name}
            </h2>
            <span style={{ fontSize: 12, background: "rgba(0,188,212,.2)", color: "#00BCD4", border: "1px solid rgba(0,188,212,.3)", borderRadius: 8, padding: "2px 8px" }}>
              {TYPE_ICONS[provider?.type]} {TYPE_LABELS[provider?.type]}
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 14, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ color: "#00BCD4", fontSize: 22, fontWeight: 800 }}>
              {loading ? "…" : (stats?.patients_today || 0)}
            </div>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: .8 }}>
              aujourd'hui
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden", marginTop: 16 }}>
          {[
            { label: "Actes enregistrés", value: loading ? "…" : stats?.total_services || 0 },
            { label: "Montant du jour",   value: loading ? "…" : fmt(stats?.amount_today) },
            { label: "À facturer",        value: loading ? "…" : fmt(stats?.pending_billing) },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "12px 8px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,.1)" : "none" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,.45)", fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action rapide */}
      <button onClick={() => navigate("/etablissement/scan")} style={{
        width: "100%", background: "linear-gradient(135deg,#00BCD4,#0097A7)",
        color: "#fff", border: "none", borderRadius: 16, padding: "16px",
        fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 20,
        boxShadow: "0 6px 20px rgba(0,188,212,.35)", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "inherit",
        opacity: visible ? 1 : 0, transition: "opacity .4s .15s",
      }}>
        <span style={{ fontSize: 22 }}>📷</span>
        Scanner un patient maintenant
      </button>

      {/* Menu services */}
      <p style={{ fontSize: 14, fontWeight: 800, color: "#0f2942", marginBottom: 12, letterSpacing: -.2 }}>Services</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {MENU.map((item, i) => (
          <button key={item.path} onClick={() => navigate(item.path)} style={{
            background: item.bg, borderRadius: 16, padding: "16px 14px",
            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
            border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(.95)",
            transition: `all .4s ${.2 + i * .06}s cubic-bezier(.34,1.56,.64,1)`,
          }}>
            <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.8)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: item.color, lineHeight: 1.3 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
