// src/pages/public/Simulateur.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, PLANS } from "../../data/constants";

const QUESTIONS = [
  {
    key: "type",
    label: "Pour qui souscrivez-vous ?",
    sub: "Choisissez la situation qui correspond le mieux à votre besoin.",
    options: [
      { val: "Individuel", icon: "👤", desc: "Je souscris pour moi seul" },
      { val: "Couple",     icon: "👫", desc: "Moi et mon conjoint" },
      { val: "Famille",    icon: "👨‍👩‍👧‍👦", desc: "Ma famille avec enfants" },
    ],
  },
  {
    key: "nb",
    label: "Combien de personnes à couvrir ?",
    sub: "Comptez-vous et tous vos bénéficiaires.",
    options: [
      { val: "1",       icon: "1️⃣", desc: "Juste moi" },
      { val: "2-3",     icon: "2️⃣", desc: "2 à 3 personnes" },
      { val: "4+",      icon: "👨‍👩‍👧‍👦", desc: "4 personnes ou plus" },
    ],
  },
  {
    key: "besoin",
    label: "Quels soins sont prioritaires pour vous ?",
    sub: "Cela nous aide à trouver la formule la mieux adaptée.",
    options: [
      { val: "courant",   icon: "🏥", desc: "Consultations et médicaments courants" },
      { val: "famille",   icon: "🤰", desc: "Maternité, optique, famille élargie" },
      { val: "complet",   icon: "🦷", desc: "Tout inclus : dentaire, chirurgie, urgences" },
    ],
  },
  {
    key: "budget",
    label: "Quel est votre budget mensuel par personne ?",
    sub: "Hors frais d'adhésion uniques de 15 000 F.",
    options: [
      { val: "< 12 000 F",      icon: "💚", desc: "Moins de 12 000 F/mois" },
      { val: "12–20 000 F",     icon: "💛", desc: "Entre 12 000 et 20 000 F/mois" },
      { val: "> 20 000 F",      icon: "💎", desc: "Plus de 20 000 F/mois" },
    ],
  },
];

function recommend(ans) {
  if (ans.budget === "> 20 000 F" || ans.besoin === "complet") return "Turquoise";
  if (ans.budget === "< 12 000 F" && ans.besoin === "courant")  return "Essentielle";
  return "Ivoirienne";
}

export default function Simulateur() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  function choose(key, val) {
    const next = { ...answers, [key]: val };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setResult(recommend(next));
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setResult(null);
  }

  const plan = result ? PLANS.find(p => p.name === result) : null;

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
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: `radial-gradient(circle at 50% 30%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 660, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Simulateur</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.15 }}>
            Quelle formule<br /><span style={{ color: C.gold }}>vous correspond ?</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#A8CDB8", lineHeight: 1.75 }}>
            4 questions. 1 minute. La formule idéale pour votre budget et vos besoins.
          </p>
        </div>
      </section>

      {/* ── SIMULATEUR ───────────────────────────────────────── */}
      <section style={{ background: C.cream, padding: "72px 24px 96px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {!result ? (
            <div style={{ background: C.white, borderRadius: 24, padding: "40px 36px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1.5px solid #EBF5F0" }}>
              {/* Progress */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.gray }}>Étape {step + 1} / {QUESTIONS.length}</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.green }}>{Math.round(((step + 1) / QUESTIONS.length) * 100)}%</span>
                </div>
                <div style={{ height: 6, background: "#EBF5F0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: `${((step + 1) / QUESTIONS.length) * 100}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${C.green}, ${C.greenLight})`,
                    borderRadius: 4,
                    transition: "width .3s ease",
                  }} />
                </div>
              </div>

              {/* Question */}
              <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", color: C.slate, margin: "0 0 8px" }}>
                {QUESTIONS[step].label}
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, marginBottom: 28, lineHeight: 1.6 }}>
                {QUESTIONS[step].sub}
              </p>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {QUESTIONS[step].options.map(opt => (
                  <button key={opt.val} onClick={() => choose(QUESTIONS[step].key, opt.val)} style={{
                    textAlign: "left", padding: "16px 20px", borderRadius: 14, cursor: "pointer",
                    background: C.white, border: `1.5px solid #E2E8F0`,
                    display: "flex", alignItems: "center", gap: 16,
                    transition: "all .15s",
                    boxShadow: "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = C.greenPale; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = C.white; }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.slate, marginBottom: 2 }}>{opt.val}</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray }}>{opt.desc}</div>
                    </div>
                    <span style={{ marginLeft: "auto", color: C.gray, fontSize: 18 }}>›</span>
                  </button>
                ))}
              </div>

              {/* Back */}
              {step > 0 && (
                <button onClick={back} style={{
                  marginTop: 20, background: "none", border: "none", cursor: "pointer",
                  fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, padding: 0,
                }}>← Retour</button>
              )}
            </div>
          ) : (
            /* Résultat */
            <div>
              <div style={{ background: C.white, borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.10)", border: "1.5px solid #EBF5F0", marginBottom: 24 }}>
                {/* Header résultat */}
                <div style={{ background: plan.color, padding: "36px 32px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", right: -30, top: -30, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>Notre recommandation</div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", marginBottom: 6 }}>
                    Formule {result}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 40, color: "#FFFFFF" }}>{plan.couverture}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>de couverture</span>
                  </div>
                </div>

                {/* Détail */}
                <div style={{ padding: "28px 32px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    <div style={{ background: C.cream, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Adhésion (unique)</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 17, color: C.slate }}>{plan.adhesion} F</div>
                    </div>
                    <div style={{ background: C.cream, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Mensualité</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 17, color: C.slate }}>{plan.mensualite} F</div>
                    </div>
                  </div>

                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Inclus</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
                    {plan.avantages.map(a => (
                      <li key={a} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Inter, sans-serif", fontSize: 14, color: C.slate, marginBottom: 10 }}>
                        <span style={{ color: plan.color, fontWeight: 700, fontSize: 16 }}>✓</span> {a}
                      </li>
                    ))}
                  </ul>

                  {/* Récap réponses */}
                  <div style={{ background: C.cream, borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Basé sur vos réponses</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(answers).map(([k, v]) => (
                        <span key={k} style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.green, background: `${C.green}12`, padding: "4px 10px", borderRadius: 20 }}>{v}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to={`/adhesion?formule=${result.toLowerCase()}`} style={{
                      flex: 1, textAlign: "center",
                      background: plan.color, color: "#FFFFFF",
                      fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15,
                      padding: "15px", borderRadius: 12, textDecoration: "none",
                    }}>Souscrire à {result} →</Link>
                    <button onClick={reset} style={{
                      background: "transparent", color: C.slate,
                      fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
                      padding: "15px 20px", borderRadius: 12,
                      border: "1.5px solid #E2E8F0", cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}>↺ Recommencer</button>
                  </div>
                </div>
              </div>

              {/* Voir toutes les formules */}
              <div style={{ textAlign: "center" }}>
                <Link to="/formules" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.green, fontWeight: 600, textDecoration: "none", borderBottom: `1px dashed ${C.green}` }}>
                  Comparer toutes les formules →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
