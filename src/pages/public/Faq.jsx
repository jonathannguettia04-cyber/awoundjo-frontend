// src/pages/public/Faq.jsx
import { useState } from "react";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, FAQS } from "../../data/constants";

export default function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.white, padding: "140px 24px 96px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: C.slate, margin: 0 }}>Questions fréquentes</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ borderRadius: 12, border: `1.5px solid ${open === i ? C.green : "#E2E8F0"}`, overflow: "hidden" }}>
                <button onClick={() => setOpen(open === i ? null : i)} style={{
                  width: "100%", textAlign: "left", padding: "16px 18px",
                  background: open === i ? C.greenPale : C.white,
                  border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: C.slate, gap: 12,
                }}>
                  <span>{f.q}</span>
                  <span style={{ color: C.green, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{open === i ? "−" : "+"}</span>
                </button>
                {open === i && (
                  <div style={{ padding: "0 18px 18px", fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, lineHeight: 1.7 }}>
                    {f.r}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
