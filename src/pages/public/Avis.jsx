// src/pages/public/Avis.jsx
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, STATS, TESTIMONIALS } from "../../data/constants";

export default function Avis() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.cream, padding: "140px 24px 96px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="awj-grid-4" style={{ gap: 20, marginBottom: 72 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: "center", background: C.white, borderRadius: 16, padding: "28px 16px", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 34, color: C.green, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>TÉMOIGNAGES</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: C.slate, margin: 0 }}>
              Ils nous font confiance
            </h2>
          </div>
          <div className="awj-grid-3" style={{ gap: 24 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: C.white, borderRadius: 16, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 36, color: C.gold, lineHeight: 1, marginBottom: 12 }}>"</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.slate, lineHeight: 1.7, marginBottom: 20 }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", color: C.white, fontWeight: 700, fontSize: 16 }}>{t.name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate }}>{t.name}</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gold }}>{t.role}</div>
                  </div>
                </div>
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
