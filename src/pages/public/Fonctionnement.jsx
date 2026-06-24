// src/pages/public/Fonctionnement.jsx
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, STEPS } from "../../data/constants";

export default function Fonctionnement() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.green, padding: "140px 24px 96px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>LE PARCOURS</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: C.white, margin: 0 }}>
              Adhérez en 5 étapes simples
            </h2>
          </div>
          <div className="awj-grid-5" style={{ gap: 16, position: "relative" }}>
            {STEPS.map((step) => (
              <div key={step.n} style={{ textAlign: "center", position: "relative" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", margin: "0 auto 18px",
                  background: C.gold,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 20px ${C.gold}44`,
                }}>
                  <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 18, color: C.white }}>{step.n}</span>
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.white, marginBottom: 8 }}>{step.label}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8FB8A0", lineHeight: 1.6 }}>{step.desc}</div>
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
