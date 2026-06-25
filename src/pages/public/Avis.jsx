// src/pages/public/Avis.jsx
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, STATS, TESTIMONIALS } from "../../data/constants";

const EXTENDED_TESTIMONIALS = [
  ...TESTIMONIALS,
  {
    name: "Dr. Kouamé A.",
    role: "Médecin partenaire",
    text: "En tant que clinicien partenaire, je constate chaque jour l'impact d'Awoundjô. Mes patients arrivent plus tôt, sont mieux suivis et ne renoncent plus aux soins par manque d'argent.",
    category: "Professionnel",
  },
  {
    name: "Mariam T.",
    role: "Entreprise — 45 salariés",
    text: "Nous avons souscrit la formule Ivoirienne pour tous nos employés. L'absentéisme pour raisons médicales a chuté de 40%. Awoundjô est un vrai investissement RH.",
    category: "Entreprise",
  },
  {
    name: "Yves K.",
    role: "Individuel",
    text: "J'ai eu un accident et j'ai été hospitalisé 5 jours. Je n'ai rien déboursé. La carte Mansa a fonctionné parfaitement dès le premier jour.",
    category: "Famille",
  },
];

const CATEGORIES = ["Tous", "Famille", "Entreprise", "Église", "Professionnel"];

export default function Avis() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, #0A2E18 0%, ${C.green} 100%)`,
        padding: "140px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, background: `radial-gradient(circle at 60% 40%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Témoignages</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.15 }}>
            Ils nous font <span style={{ color: C.gold }}>confiance</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#A8CDB8", lineHeight: 1.75 }}>
            Familles, entreprises, associations, professionnels de santé : découvrez leurs expériences avec Awoundjô.
          </p>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: "56px 24px", borderBottom: "1.5px solid #EBF5F0" }}>
        <div className="awj-grid-4" style={{ maxWidth: 1100, margin: "0 auto", gap: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{
              textAlign: "center", background: C.cream, borderRadius: 16, padding: "28px 16px",
              border: "1.5px solid #EBF5F0",
            }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 38, color: C.green, marginBottom: 8, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NOTE GLOBALE ─────────────────────────────────────── */}
      <section style={{ background: C.cream, padding: "72px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ background: C.white, borderRadius: 20, padding: "40px 32px", border: "1.5px solid #EBF5F0", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 72, color: C.green, lineHeight: 1 }}>4.8</div>
              <div style={{ fontSize: 24, marginTop: 4 }}>⭐⭐⭐⭐⭐</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, marginTop: 6 }}>Note moyenne</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {[
                { label: "Facilité d'adhésion", score: 96 },
                { label: "Qualité du service", score: 94 },
                { label: "Rapidité des remboursements", score: 91 },
                { label: "Étendue du réseau", score: 88 },
                { label: "Rapport qualité/prix", score: 97 },
              ].map(r => (
                <div key={r.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.slate }}>{r.label}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: C.green }}>{r.score}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: "#EBF5F0", overflow: "hidden" }}>
                    <div style={{ width: `${r.score}%`, height: "100%", background: `linear-gradient(90deg, ${C.green}, ${C.greenLight})`, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ──────────────────────────────────────── */}
      <section style={{ background: C.white, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", color: C.slate, margin: 0 }}>
              Ce qu'ils disent de nous
            </h2>
          </div>

          <div className="awj-grid-3" style={{ gap: 24 }}>
            {EXTENDED_TESTIMONIALS.map((t, i) => (
              <div key={t.name + i} style={{
                background: C.cream, borderRadius: 20, padding: "32px 28px",
                border: "1.5px solid #EBF5F0",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ fontSize: 44, color: `${C.gold}50`, fontFamily: "Playfair Display, serif", lineHeight: 0.8 }}>"</div>
                  <div style={{ fontSize: 14 }}>⭐⭐⭐⭐⭐</div>
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14.5, color: C.slate, lineHeight: 1.75, marginBottom: 24, flex: 1, fontStyle: "italic" }}>
                  {t.text}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: "Inter, sans-serif", color: "#FFFFFF", fontWeight: 700, fontSize: 17 }}>{t.name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate }}>{t.name}</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gold, fontWeight: 600 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA PARTAGER ─────────────────────────────────────── */}
      <section style={{ background: C.greenPale, padding: "72px 24px", textAlign: "center", borderTop: "1.5px solid #DCF0E5" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>💬</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: C.slate, margin: "0 0 14px" }}>
            Vous êtes adhérent Awoundjô ?
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.7, marginBottom: 28 }}>
            Partagez votre expérience et aidez d'autres familles ivoiriennes à se décider.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`https://wa.me/${C.whatsapp || "2250171721668"}?text=Bonjour, je souhaite partager mon avis sur Awoundjô`} target="_blank" rel="noopener noreferrer" style={{
              background: "#25D366", color: "#FFFFFF",
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            }}>💬 Partager sur WhatsApp</a>
            <Link to="/adhesion" style={{
              background: C.green, color: "#FFFFFF",
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            }}>Rejoindre la mutuelle →</Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
