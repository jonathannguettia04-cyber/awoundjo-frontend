// src/pages/public/LandingPage.jsx
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, STATS } from "../../data/constants";

// Photo libre de droit (Unsplash) — famille africaine souriante
const FAMILY_PHOTO = "https://images.unsplash.com/photo-1656502439223-46667fff43c7?w=1000&q=80";

export default function LandingPage() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-hero-pad" style={{
        minHeight: "100vh", position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${C.green} 0%, #0F3D22 60%, #1a5c35 100%)`,
        display: "flex", alignItems: "center",
        paddingTop: 64,
      }}>
        {/* Motif kente abstrait */}
        <div style={{ position: "absolute", inset: 0, opacity: .07 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${(i % 4) * 28}%`, top: `${Math.floor(i / 4) * 35}%`,
              width: 200, height: 200,
              background: C.gold,
              transform: `rotate(45deg) scale(${0.3 + (i % 3) * 0.15})`,
              borderRadius: 4,
            }} />
          ))}
        </div>

        <div className="awj-grid-2 awj-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px", position: "relative", zIndex: 2, gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${C.gold}22`, border: `1px solid ${C.gold}44`, borderRadius: 20, padding: "6px 14px", marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
              <span style={{ color: C.gold, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>MUTUELLE DE SANTÉ — CÔTE D'IVOIRE</span>
            </div>

            <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4.5vw, 3.4rem)", color: C.white, lineHeight: 1.15, margin: "0 0 20px" }}>
              La santé accessible<br />
              <span style={{ color: C.gold }}>à tous</span>, partout<br />
              en Côte d'Ivoire.
            </h1>

            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, color: "#B8D4C4", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              Rejoignez la Mutuelle Awoundjô et bénéficiez d'une couverture santé adaptée à votre famille, dès 10 000 F/mois.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/adhesion" style={{
                background: C.gold, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
                padding: "14px 28px", borderRadius: 10, textDecoration: "none",
                boxShadow: `0 4px 20px ${C.gold}55`,
              }}>Devenir adhérent →</a>
              <a href="/reseau" style={{
                background: "transparent", color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
                padding: "14px 28px", borderRadius: 10, textDecoration: "none",
                border: `1.5px solid ${C.white}44`,
              }}>Trouver un établissement</a>
            </div>

            <div style={{ display: "flex", gap: 32, marginTop: 48, flexWrap: "wrap" }}>
              {STATS.slice(0, 2).map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 28, color: C.gold }}>{s.value}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8FB8A0", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo famille + carte mutualiste en overlay */}
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            <div style={{
              width: "100%", maxWidth: 460, aspectRatio: "4/5", borderRadius: 24, overflow: "hidden",
              boxShadow: "0 30px 70px rgba(0,0,0,.45)", position: "relative",
            }}>
              <img
                src={FAMILY_PHOTO}
                alt="Famille ivoirienne souriante, adhérente Awoundjô"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(180deg, transparent 50%, ${C.green}99 100%)`,
              }} />
            </div>

            {/* Carte mutualiste mockup, posée en overlay */}
            <div style={{
              position: "absolute", bottom: -28, left: "50%", transform: "translateX(-50%) rotate(-4deg)",
              width: 280, height: 172, borderRadius: 16,
              background: `linear-gradient(135deg, ${C.green} 0%, #0a2e18 100%)`,
              boxShadow: `0 24px 60px rgba(0,0,0,.5), 0 0 0 1px ${C.gold}33`,
              padding: 22, overflow: "hidden",
            }}>
              <div style={{ position: "absolute", right: -24, top: -24, width: 130, height: 130, borderRadius: "50%", background: `${C.gold}15` }} />
              <div style={{ fontFamily: "Playfair Display, serif", color: C.gold, fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Awoundjô</div>
              <div style={{ fontFamily: "Inter, sans-serif", color: "#8FB8A0", fontSize: 8, letterSpacing: 1, marginBottom: 18 }}>MUTUELLE DE SANTÉ</div>
              <div style={{ fontFamily: "Inter, sans-serif", color: C.white, fontSize: 12, letterSpacing: 2, marginBottom: 12 }}>AWJ-2026-XXXXXX</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", color: "#8FB8A0", fontSize: 7, letterSpacing: 1 }}>ADHÉRENT</div>
                  <div style={{ fontFamily: "Inter, sans-serif", color: C.white, fontSize: 11, fontWeight: 600 }}>FAMILLE KOUASSI</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", color: "#8FB8A0", fontSize: 7, letterSpacing: 1 }}>FORMULE</div>
                  <div style={{ fontFamily: "Inter, sans-serif", color: C.gold, fontSize: 10, fontWeight: 700 }}>IVOIRIENNE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
