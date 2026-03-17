// src/pages/client/ClientCarte.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientCardAPI, PLANS } from "../../clientApi";

export default function ClientCarte() {
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientCardAPI.get()
      .then(res => setData(res.data.data))
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 16 }}><div style={{ height: 200, background: "#E5E7EB", borderRadius: 20 }} /></div>;
  if (!data) return null;

  const { card, dependents } = data;
  const plan     = PLANS[card.plan] || PLANS.ESSENTIELLE;
  const isActive = card.status === "active";

  return (
    <div style={{ padding: 16 }}>
      <h1 style={s.title}>Ma Carte Mutualiste</h1>
      <p style={s.sub}>Présentez cette carte dans les établissements partenaires</p>

      {/* Carte recto */}
      <div style={{ ...s.card, background: `linear-gradient(135deg, ${plan.color}, #1e3a8a)` }}>
        <div style={s.cardTop}>
          <div style={s.cardLogo}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#fff" }}>AWOUNDJÔ</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)" }}>Mutuelle Santé · CI</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 22, opacity: .5 }}>💳</span>
        </div>

        <div style={{ ...s.statusPill, borderColor: isActive ? "rgba(16,185,129,.5)" : "rgba(239,68,68,.5)", background: isActive ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.2)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? "#10B981" : "#EF4444", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{isActive ? "CARTE ACTIVE" : "CARTE INACTIVE"}</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, opacity: .6, letterSpacing: 1, color: "#fff", marginBottom: 4 }}>ADHÉRENT(E)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{card.name}</div>
          <div style={{ fontSize: 13, opacity: .8, color: "#fff", fontFamily: "monospace", letterSpacing: 2 }}>{card.mutual_number}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, opacity: .6, color: "#fff", letterSpacing: 1 }}>PLAN</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{plan.name.toUpperCase()}</div>
            <div style={{ fontSize: 11, opacity: .7, color: "#fff" }}>{plan.coverage} couverture</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, opacity: .6, color: "#fff", letterSpacing: 1 }}>EXPIRE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              {card.expiration_date ? new Date(card.expiration_date).toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" }) : "12/2026"}
            </div>
          </div>
        </div>
        <div style={s.circle1} /><div style={s.circle2} />
      </div>

      {/* QR + dépendants */}
      <div style={s.back}>
        <div style={s.qrRow}>
          <div style={s.qrBox}>
            {card.qr_code
              ? <img src={card.qr_code} alt="QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <span style={{ fontSize: 40 }}>⬛</span>}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Scanner pour vérifier</p>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px" }}>Présentez ce code à l'accueil</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1a56db", fontFamily: "monospace", letterSpacing: 1, margin: 0 }}>{card.mutual_number}</p>
          </div>
        </div>

        {dependents.length > 0 && (
          <div style={{ padding: "0 20px 16px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 10px" }}>Bénéficiaires couverts</p>
            {dependents.map((dep, i) => (
              <div key={i} style={s.depRow}>
                <span style={{ fontSize: 18 }}>{dep.type === "spouse" ? "💑" : "👶"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", flex: 1 }}>{dep.name} {dep.firstname}</span>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={() => navigator.share?.({ title: "Ma carte Awoundjô", text: card.mutual_number })}
          style={s.shareBtn}>📤 Partager</button>
        <button onClick={() => window.print()} style={s.printBtn}>🖨️ Imprimer</button>
      </div>
    </div>
  );
}

const s = {
  title:     { fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" },
  sub:       { fontSize: 13, color: "#6B7280", margin: "0 0 20px" },
  card:      { borderRadius: 20, padding: 20, color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 12px 40px rgba(26,86,219,.35)", marginBottom: 12, minHeight: 200 },
  cardTop:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  cardLogo:  { width: 40, height: 40, background: "rgba(255,255,255,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#fff" },
  statusPill:{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, border: "1px solid", marginBottom: 16 },
  circle1:   { position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.08)", pointerEvents: "none" },
  circle2:   { position: "absolute", bottom: -60, right: 60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" },
  back:      { background: "#fff", borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,.08)", overflow: "hidden" },
  qrRow:     { display: "flex", alignItems: "center", gap: 16, padding: 20, borderBottom: "1px solid #F3F4F6" },
  qrBox:     { width: 100, height: 100, background: "#F9FAFB", border: "2px solid #E5E7EB", borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  depRow:    { display: "flex", alignItems: "center", gap: 10, background: "#F9FAFB", borderRadius: 10, padding: "10px 12px", marginBottom: 8 },
  shareBtn:  { flex: 1, background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
  printBtn:  { flex: 1, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
};
