// src/pages/public/Fonctionnement.jsx
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, STEPS } from "../../data/constants";

const STEPS_DETAIL = [
  {
    n: "01", label: "Inscription en ligne",
    icon: "📝",
    desc: "Remplissez le formulaire d'adhésion en 5 minutes depuis votre téléphone ou ordinateur. Indiquez vos informations personnelles, le nombre de bénéficiaires et choisissez votre formule.",
    detail: ["Aucun document médical requis à l'inscription", "Inscription 100% en ligne, sans déplacement", "Formulaire disponible 24h/24, 7j/7"],
  },
  {
    n: "02", label: "Validation du dossier",
    icon: "✅",
    desc: "Notre équipe examine et valide votre dossier sous 24h ouvrables. Vous recevez une confirmation par SMS et WhatsApp avec les prochaines étapes.",
    detail: ["Validation sous 24h ouvrables", "Notification SMS + WhatsApp", "Assistance téléphonique disponible"],
  },
  {
    n: "03", label: "Paiement Mobile Money",
    icon: "💳",
    desc: "Réglez vos frais d'adhésion (15 000 F) et votre première mensualité via Wave, Orange Money, MTN MoMo ou Moov Money. Paiement 100% sécurisé.",
    detail: ["Wave, Orange Money, MTN, Moov acceptés", "Paiement sécurisé par Jeko", "Reçu électronique immédiat"],
  },
  {
    n: "04", label: "Réception de la carte Mansa",
    icon: "🪪",
    desc: "Après paiement confirmé, votre carte mutualiste numérique est générée instantanément. Chaque bénéficiaire reçoit sa propre carte personnalisée.",
    detail: ["Carte numérique disponible immédiatement", "Une carte par bénéficiaire", "QR code et numéro de membre uniques"],
  },
  {
    n: "05", label: "Accès aux soins",
    icon: "🏥",
    desc: "Présentez votre carte Mansa à l'accueil de n'importe quel établissement partenaire. Aucune avance de frais. La prise en charge est immédiate.",
    detail: ["120+ établissements partenaires", "Aucune avance de frais", "Couverture active 30 jours après adhésion"],
  },
];

const PAYMENT_METHODS = [
  { name: "Wave",         color: "#0094F0", bg: "#EBF7FF" },
  { name: "Orange Money", color: "#FF6600", bg: "#FFF3EB" },
  { name: "MTN MoMo",    color: "#FFCC00", bg: "#FFFBEB" },
  { name: "Moov Money",  color: "#0066CC", bg: "#EBF2FF" },
];

export default function Fonctionnement() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, #0A2E18 0%, ${C.green} 100%)`,
        padding: "140px 24px 96px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: `radial-gradient(circle at 70% 40%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Comment ça marche</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "#FFFFFF", margin: "0 0 24px", lineHeight: 1.15 }}>
            Adhérez en <span style={{ color: C.gold }}>5 étapes</span>,<br />couvert en 24h
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#A8CDB8", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>
            De l'inscription au premier soin, voici exactement comment fonctionne votre adhésion à la mutuelle Awoundjô.
          </p>
        </div>
      </section>

      {/* ── ÉTAPES DÉTAILLÉES ────────────────────────────────── */}
      <section style={{ background: C.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS_DETAIL.map((step, i) => (
              <div key={step.n} style={{ display: "flex", gap: 0, position: "relative" }}>
                {/* Ligne gauche */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 80 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: i % 2 === 0 ? C.green : C.gold,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 6px 24px ${i % 2 === 0 ? C.green : C.gold}40`,
                    zIndex: 1, flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 22, color: "#FFFFFF" }}>{step.n}</span>
                  </div>
                  {i < STEPS_DETAIL.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: "#EBF5F0", minHeight: 40, margin: "8px 0" }} />
                  )}
                </div>

                {/* Contenu */}
                <div style={{ paddingLeft: 32, paddingBottom: i < STEPS_DETAIL.length - 1 ? 56 : 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{step.icon}</span>
                    <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 22, color: C.slate, margin: 0 }}>{step.label}</h3>
                  </div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.75, marginBottom: 16, maxWidth: 680 }}>
                    {step.desc}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {step.detail.map(d => (
                      <span key={d} style={{
                        fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.green,
                        background: C.greenPale, padding: "5px 12px", borderRadius: 20,
                        border: `1px solid ${C.green}20`,
                      }}>✓ {d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÉTHODES DE PAIEMENT ─────────────────────────────── */}
      <section style={{ background: C.cream, padding: "80px 24px", borderTop: "1.5px solid #EBF5F0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Paiement</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: C.slate, margin: "0 0 16px" }}>
            Payez comme vous voulez
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, marginBottom: 36 }}>
            Toutes les plateformes Mobile Money ivoiriennes acceptées. Paiement 100% sécurisé via Jeko.
          </p>
          <div className="awj-grid-4" style={{ gap: 16, marginBottom: 32 }}>
            {PAYMENT_METHODS.map(m => (
              <div key={m.name} style={{
                background: m.bg, borderRadius: 14, padding: "20px 16px",
                border: `1.5px solid ${m.color}30`,
                textAlign: "center",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${m.color}20`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 11, color: m.color }}>Pay</span>
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: m.color }}>{m.name}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray }}>
            Vos cotisations mensuelles sont prélevées automatiquement. Un rappel SMS vous est envoyé 3 jours avant.
          </p>
        </div>
      </section>

      {/* ── COMMENT UTILISER MA CARTE ────────────────────────── */}
      <section style={{ background: C.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Chez le médecin</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", color: C.slate, margin: 0 }}>
              Comment utiliser ma carte Mansa ?
            </h2>
          </div>
          <div className="awj-grid-3" style={{ gap: 24 }}>
            {[
              { icon: "🏥", step: "1", title: "Choisissez un établissement", desc: "Rendez-vous dans l'un des 120+ établissements partenaires de notre réseau. Consultez la carte sur awoundjo.ci/reseau." },
              { icon: "🪪", step: "2", title: "Présentez votre carte Mansa", desc: "Montrez votre carte numérique à l'accueil (QR code ou numéro de membre). L'établissement vérifie votre couverture en temps réel." },
              { icon: "✅", step: "3", title: "Soins sans avance de frais", desc: "Vous êtes pris en charge immédiatement. L'établissement facture directement Awoundjô. Vous ne payez rien de votre poche." },
            ].map(s => (
              <div key={s.title} style={{ background: C.cream, borderRadius: 18, padding: "30px 26px", border: "1.5px solid #EBF5F0" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${C.green}15`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 26, marginBottom: 18,
                }}>{s.icon}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 11, color: C.gold, letterSpacing: 1 }}>ÉTAPE {s.step}</span>
                </div>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: C.green, padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, background: `radial-gradient(circle at 30% 60%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", color: "#FFFFFF", margin: "0 0 16px" }}>
            Prêt à commencer ?
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#A8CDB8", lineHeight: 1.7, marginBottom: 32 }}>
            Adhérez maintenant en ligne. Couverture activée sous 24h.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/adhesion" style={{
              background: C.gold, color: "#0A1F12",
              fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15,
              padding: "15px 32px", borderRadius: 10, textDecoration: "none",
            }}>Adhérer maintenant →</Link>
            <Link to="/formules" style={{
              background: "rgba(255,255,255,0.12)", color: "#FFFFFF",
              fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
              padding: "15px 28px", borderRadius: 10, textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.3)",
            }}>Voir les formules</Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
