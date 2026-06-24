// src/pages/public/Simulateur.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C } from "../../data/constants";

export default function Simulateur() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = [
    { key: "type", label: "Pour qui souscrivez-vous ?", options: ["Individuel", "Famille"] },
    { key: "nb", label: "Combien de personnes à couvrir ?", options: ["1", "2-3", "4 et plus"] },
    { key: "budget", label: "Quel est votre budget mensuel ?", options: ["Moins de 12 000 F", "12 000 – 20 000 F", "Plus de 20 000 F"] },
  ];

  const recommend = (ans) => {
    if (ans.budget === "Moins de 12 000 F") return "Essentielle";
    if (ans.budget === "Plus de 20 000 F") return "Turquoise";
    return "Ivoirienne";
  };

  const choose = (key, val) => {
    const next = { ...answers, [key]: val };
    setAnswers(next);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setResult(recommend(next));
    }
  };

  const reset = () => { setStep(0); setAnswers({}); setResult(null); };

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.white, padding: "140px 24px 96px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>SIMULATEUR</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.4rem)", color: C.slate, margin: "0 0 40px" }}>
            Quelle formule vous correspond ?
          </h2>
          <div style={{ background: C.cream, borderRadius: 20, padding: "32px 24px" }}>
            {!result ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
                  {questions.map((_, i) => (
                    <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i <= step ? C.green : "#E2E8F0" }} />
                  ))}
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 600, color: C.slate, marginBottom: 24 }}>
                  {questions[step].label}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions[step].options.map(opt => (
                    <button key={opt} onClick={() => choose(questions[step].key, opt)} style={{
                      fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600,
                      padding: "14px 20px", borderRadius: 10, cursor: "pointer",
                      background: C.white, color: C.slate, border: `1.5px solid #E2E8F0`,
                      textAlign: "left",
                    }}>{opt}</button>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: 44, marginBottom: 16 }}>🎉</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, marginBottom: 8 }}>Nous vous recommandons</p>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 32, color: C.green, marginBottom: 20 }}>
                  Formule {result}
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link to={`/adhesion?formule=${result.toLowerCase()}`} style={{
                    background: C.green, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
                    padding: "12px 24px", borderRadius: 10, textDecoration: "none",
                  }}>Souscrire maintenant</Link>
                  <button onClick={reset} style={{
                    background: "transparent", color: C.green, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
                    padding: "12px 24px", borderRadius: 10, border: `1.5px solid ${C.green}`, cursor: "pointer",
                  }}>Recommencer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
