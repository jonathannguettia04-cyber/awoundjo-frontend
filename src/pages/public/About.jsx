// src/pages/public/About.jsx
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C } from "../../data/constants";

export default function About() {
  const VALEURS = [
    { icon: "🤝", label: "Solidarité" },
    { icon: "🏥", label: "Accessibilité" },
    { icon: "🔍", label: "Transparence" },
    { icon: "💡", label: "Innovation" },
    { icon: "🌱", label: "Prévention" },
  ];

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.cream, padding: "140px 24px 96px" }}>
        <div className="awj-grid-2" style={{ maxWidth: 1200, margin: "0 auto", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>QUI SOMMES-NOUS</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: C.slate, margin: "0 0 24px", lineHeight: 1.2 }}>
              Une mutuelle née<br />pour les Ivoiriens
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.gray, lineHeight: 1.8, marginBottom: 20 }}>
              <strong style={{ color: C.green }}>Notre mission :</strong> Rendre les soins de santé accessibles à chaque famille ivoirienne, quelle que soit sa situation économique, grâce à un système de mutualisation solidaire.
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.gray, lineHeight: 1.8 }}>
              <strong style={{ color: C.green }}>Notre vision :</strong> Être la première mutuelle de santé digitale de Côte d'Ivoire, couvrant 100 000 adhérents d'ici 2027, avec un réseau de soins dans chaque commune.
            </p>
          </div>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 20 }}>NOS VALEURS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {VALEURS.map(v => (
                <div key={v.label} style={{
                  background: C.white, borderRadius: 12, padding: "20px 20px",
                  border: `1px solid ${C.greenPale}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>{v.icon}</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: C.slate }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
