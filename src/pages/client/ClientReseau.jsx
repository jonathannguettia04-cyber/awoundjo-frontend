// src/pages/client/ClientReseau.jsx
export default function ClientReseau() {
  const [filter, setFilter] = import("react").then ? null : null;
  const { useState } = require("react");
  const [f, setF] = useState("all");

  const NETWORK = [
    { name: "Clinique Avicenne",    type: "clinic",   address: "Rue des Jardins, Cocody",    city: "Abidjan", phone: "+225 27 22 41 00 00", plans: ["ESSENTIELLE","IVOIRIENNE","TURQUOISE"], icon: "🏥" },
    { name: "Pharmacie du Plateau", type: "pharmacy", address: "Avenue Général de Gaulle",   city: "Abidjan", phone: "+225 27 20 21 00 00", plans: ["ESSENTIELLE","IVOIRIENNE","TURQUOISE"], icon: "💊" },
    { name: "CHU de Cocody",        type: "hospital", address: "Boulevard de l'Université",  city: "Abidjan", phone: "+225 27 22 44 00 00", plans: ["IVOIRIENNE","TURQUOISE"],               icon: "🏨" },
    { name: "Laboratoire Bio Plus", type: "lab",      address: "Marcory Zone 4",             city: "Abidjan", phone: "+225 27 21 75 00 00", plans: ["TURQUOISE"],                            icon: "🔬" },
  ];
  const TYPES = [{ id: "all", label: "Tous" }, { id: "clinic", label: "Cliniques" }, { id: "pharmacy", label: "Pharmacies" }, { id: "hospital", label: "Hôpitaux" }, { id: "lab", label: "Labos" }];
  const filtered = f === "all" ? NETWORK : NETWORK.filter(n => n.type === f);

  return (
    <div style={{ padding: 16, fontFamily: "'Poppins',sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Réseau de Soins</h1>
      <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 16px" }}>Établissements partenaires Awoundjô</p>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }}>
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setF(t.id)}
            style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: f === t.id ? "#1a56db" : "#F3F4F6", color: f === t.id ? "#fff" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Poppins',sans-serif" }}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.map((n, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
          <div style={{ width: 48, height: 48, background: "#F0F7FF", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{n.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>{n.name}</p>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 6px" }}>📍 {n.address}, {n.city}</p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {n.plans.map(p => (
                <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: "#EFF6FF", color: "#1a56db" }}>{p}</span>
              ))}
            </div>
          </div>
          <a href={`tel:${n.phone}`} style={{ background: "#EFF6FF", color: "#1a56db", borderRadius: 10, padding: "10px 12px", fontSize: 20, textDecoration: "none", flexShrink: 0 }}>📞</a>
        </div>
      ))}
    </div>
  );
}
