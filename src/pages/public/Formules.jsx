// src/pages/public/Formules.jsx
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, PLANS } from "../../data/constants";

export default function Formules() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.white, padding: "140px 24px 96px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>NOS FORMULES</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: C.slate, margin: 0 }}>
              Choisissez la couverture<br />qui vous correspond
            </h2>
          </div>
          <div className="awj-grid-3" style={{ gap: 24 }}>
            {PLANS.map((plan, i) => (
              <div key={plan.name} style={{
                borderRadius: 20, overflow: "hidden",
                boxShadow: i === 1 ? `0 8px 40px ${C.gold}22` : "0 2px 16px rgba(0,0,0,.06)",
                border: i === 1 ? `2px solid ${C.gold}` : `1px solid #E2E8F0`,
                background: C.white,
              }}>
                <div style={{ background: plan.color, padding: "28px 28px 24px", position: "relative" }}>
                  {plan.badge && (
                    <div style={{
                      position: "absolute", top: 16, right: 16,
                      background: C.white, color: plan.color,
                      fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11,
                      padding: "4px 10px", borderRadius: 20,
                    }}>{plan.badge}</div>
                  )}
                  <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 22, color: C.white, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 42, color: C.white }}>{plan.couverture}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: `${C.white}99` }}>couverture</span>
                  </div>
                </div>
                <div style={{ padding: "24px 28px 28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    <div style={{ background: C.cream, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray, letterSpacing: 1, marginBottom: 2 }}>ADHÉSION</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate }}>{plan.adhesion} F</div>
                    </div>
                    <div style={{ background: C.cream, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray, letterSpacing: 1, marginBottom: 2 }}>MENSUALITÉ</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate }}>{plan.mensualite} F</div>
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                    {plan.avantages.map(a => (
                      <li key={a} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Inter, sans-serif", fontSize: 14, color: C.slate, marginBottom: 10 }}>
                        <span style={{ color: plan.color, fontWeight: 700, fontSize: 16 }}>✓</span> {a}
                      </li>
                    ))}
                  </ul>
                  <Link to={`/adhesion?formule=${plan.name.toLowerCase()}`} style={{
                    display: "block", textAlign: "center",
                    background: i === 1 ? C.gold : plan.color,
                    color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
                    padding: "13px", borderRadius: 10, textDecoration: "none",
                  }}>Souscrire maintenant</Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bandeau CTA */}
          <div style={{
            marginTop: 56, background: C.greenPale, borderRadius: 20, padding: "32px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 19, color: C.green, marginBottom: 4 }}>Pas sûr de votre choix ?</div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, margin: 0 }}>Notre simulateur vous recommande la formule adaptée à votre budget.</p>
            </div>
            <Link to="/simulateur" style={{
              background: C.green, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "12px 24px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap",
            }}>Faire le test →</Link>
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
