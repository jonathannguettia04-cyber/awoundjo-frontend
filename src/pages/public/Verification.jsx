// src/pages/public/Verification.jsx
import { useState } from "react";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C } from "../../data/constants";

export default function Verification() {
  const [num, setNum] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!num.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/client/verify/${num.trim()}`);
      const data = await res.json();
      setStatus(data.found ? "valid" : "invalid");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.green, padding: "140px 24px 96px", minHeight: "70vh" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.3rem, 2.5vw, 2rem)", color: C.white, marginBottom: 12 }}>
            Vérifier un numéro mutualiste
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#8FB8A0", marginBottom: 28 }}>
            Confirmez qu'un adhérent est bien enregistré chez Awoundjô.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={num} onChange={e => { setNum(e.target.value); setStatus(null); }}
              placeholder="Ex: AWJ-2026-001234"
              style={{
                flex: "1 1 200px", fontFamily: "Inter, sans-serif", fontSize: 14,
                padding: "13px 16px", borderRadius: 10, border: "none",
                outline: "none", background: C.white, color: C.slate,
              }}
            />
            <button onClick={check} disabled={loading} style={{
              background: C.gold, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            }}>{loading ? "..." : "Vérifier"}</button>
          </div>
          {status === "valid" && <div style={{ marginTop: 14, color: "#4ADE80", fontFamily: "Inter, sans-serif", fontSize: 14 }}>✅ Numéro valide — adhérent actif</div>}
          {status === "invalid" && <div style={{ marginTop: 14, color: "#F87171", fontFamily: "Inter, sans-serif", fontSize: 14 }}>❌ Numéro introuvable</div>}
          {status === "error" && <div style={{ marginTop: 14, color: "#F87171", fontFamily: "Inter, sans-serif", fontSize: 14 }}>Erreur réseau — réessayez</div>}
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
