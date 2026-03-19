// src/pages/client/ClientReseau.jsx
import { useState } from "react";

const NETWORK = [
  { name: "Clinique Avicenne",       type: "clinic",   address: "Rue des Jardins, Cocody",   city: "Abidjan", phone: "+225 27 22 41 00 00", plans: ["ESSENTIELLE","IVOIRIENNE","TURQUOISE"], icon: "🏥" },
  { name: "Pharmacie du Plateau",    type: "pharmacy", address: "Avenue Général de Gaulle",  city: "Abidjan", phone: "+225 27 20 21 00 00", plans: ["ESSENTIELLE","IVOIRIENNE","TURQUOISE"], icon: "💊" },
  { name: "CHU de Cocody",           type: "hospital", address: "Boulevard de l'Université", city: "Abidjan", phone: "+225 27 22 44 00 00", plans: ["IVOIRIENNE","TURQUOISE"],               icon: "🏨" },
  { name: "Laboratoire Bio Plus",    type: "lab",      address: "Marcory Zone 4",            city: "Abidjan", phone: "+225 27 21 75 00 00", plans: ["TURQUOISE"],                            icon: "🔬" },
  { name: "Polyclinique Internationale", type: "clinic", address: "Deux Plateaux, Cocody",  city: "Abidjan", phone: "+225 27 22 41 50 00", plans: ["IVOIRIENNE","TURQUOISE"],               icon: "🏥" },
  { name: "Pharmacie Sainte Marie",  type: "pharmacy", address: "Adjamé, Rue 12",           city: "Abidjan", phone: "+225 27 20 37 00 00", plans: ["ESSENTIELLE","IVOIRIENNE","TURQUOISE"], icon: "💊" },
];

const TYPES = [
  { id: "all",      label: "Tous",       icon: "🗂️" },
  { id: "clinic",   label: "Cliniques",  icon: "🏥" },
  { id: "pharmacy", label: "Pharmacies", icon: "💊" },
  { id: "hospital", label: "Hôpitaux",   icon: "🏨" },
  { id: "lab",      label: "Labos",      icon: "🔬" },
];

const TYPE_COLOR = {
  clinic:   { color: "#1D4ED8", bg: "#EFF6FF" },
  pharmacy: { color: "#059669", bg: "#ECFDF5" },
  hospital: { color: "#7C3AED", bg: "#F5F3FF" },
  lab:      { color: "#0891B2", bg: "#ECFEFF" },
};

export default function ClientReseau() {
  const [filter,  setFilter]  = useState("all");
  const [visible, setVisible] = useState(true);

  const filtered = filter === "all" ? NETWORK : NETWORK.filter(n => n.type === filter);

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Réseau de Soins</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Établissements partenaires Awoundjô</p>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding: "9px 16px", borderRadius: 20, border: "none",
            background: filter === t.id ? "linear-gradient(135deg,#1a56db,#1e40af)" : "#fff",
            color: filter === t.id ? "#fff" : "#475569",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            whiteSpace: "nowrap", fontFamily: "'Poppins',sans-serif",
            boxShadow: filter === t.id ? "0 4px 12px rgba(26,86,219,.3)" : "0 2px 8px rgba(0,0,0,.06)",
            transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Compteur */}
      <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14, fontWeight: 500 }}>
        {filtered.length} établissement{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
      </p>

      {/* Liste */}
      {filtered.map((n, i) => {
        const tc = TYPE_COLOR[n.type] || TYPE_COLOR.clinic;
        return (
          <div key={i} style={{
            background: "#fff", borderRadius: 18, padding: "16px",
            marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 14,
            boxShadow: "0 2px 10px rgba(0,0,0,.06)",
            border: "1px solid #F1F5F9",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: `all .4s ${i * .06}s`,
          }}>
            <div style={{ width: 52, height: 52, background: tc.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
              {n.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 3px", letterSpacing: -.2 }}>{n.name}</p>
              <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                📍 {n.address}, {n.city}
              </p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {n.plans.map(p => (
                  <span key={p} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: tc.bg, color: tc.color }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <a href={`tel:${n.phone}`} style={{
              background: "linear-gradient(135deg,#1a56db,#1e40af)",
              color: "#fff", borderRadius: 12, padding: "10px 14px",
              fontSize: 18, textDecoration: "none", flexShrink: 0,
              boxShadow: "0 4px 12px rgba(26,86,219,.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>📞</a>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 20 }}>
          <span style={{ fontSize: 48 }}>🏥</span>
          <p style={{ color: "#64748B", fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>Aucun établissement</p>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>pour ce type de filtre</p>
        </div>
      )}
    </div>
  );
}
