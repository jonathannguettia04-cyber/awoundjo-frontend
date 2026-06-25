// src/pages/public/Formules.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, PLANS } from "../../data/constants";

const COMPARATIF = [
  { label: "Consultations médicales",   vals: ["50%", "70%", "80%"] },
  { label: "Hospitalisation",           vals: ["50%", "70%", "80%"] },
  { label: "Pharmacie",                 vals: ["50%", "70%", "80%"] },
  { label: "Maternité",                 vals: ["✗", "✓", "✓"] },
  { label: "Optique",                   vals: ["✗", "✓", "✓"] },
  { label: "Dentisterie",               vals: ["✗", "✗", "✓"] },
  { label: "Chirurgie",                 vals: ["✗", "✗", "✓"] },
  { label: "Ambulance",                 vals: ["✗", "✗", "✓"] },
  { label: "Téléconsultation",          vals: ["✓", "✓", "✓"] },
  { label: "Bilan de santé annuel",     vals: ["✓", "✓", "✓"] },
  { label: "Carte Mansa numérique",     vals: ["✓", "✓", "✓"] },
  { label: "Priorité urgences",         vals: ["✗", "✓", "✓"] },
  { label: "Famille élargie couverte",  vals: ["✗", "✓", "✓"] },
];

export default function Formules() {
  const [activeTab, setActiveTab] = useState("cards");

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
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Nos formules</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.15 }}>
            Choisissez la couverture<br /><span style={{ color: C.gold }}>qui vous correspond</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#A8CDB8", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 32px" }}>
            Frais d'adhésion uniques de 15 000 F pour toutes les formules. Mensualités dès 10 000 F. Couverture activée sous 24h après paiement.
          </p>
          {/* Tabs */}
          <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: 4, gap: 4 }}>
            {[{ id: "cards", label: "Fiches formules" }, { id: "compare", label: "Comparatif détaillé" }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700,
                padding: "10px 22px", borderRadius: 9, border: "none", cursor: "pointer",
                background: activeTab === t.id ? "#FFFFFF" : "transparent",
                color: activeTab === t.id ? C.green : "rgba(255,255,255,0.7)",
                transition: "all .2s",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARTES FORMULES ──────────────────────────────────── */}
      {activeTab === "cards" && (
        <section style={{ background: C.cream, padding: "72px 24px 96px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="awj-grid-3" style={{ gap: 28 }}>
              {PLANS.map((plan, i) => (
                <div key={plan.name} style={{
                  borderRadius: 22, overflow: "hidden",
                  boxShadow: i === 1 ? `0 16px 56px ${C.gold}25` : "0 4px 24px rgba(0,0,0,0.07)",
                  border: i === 1 ? `2.5px solid ${C.gold}` : "1.5px solid #E8F5EE",
                  background: C.white,
                  transform: i === 1 ? "translateY(-8px)" : "none",
                }}>
                  <div style={{ background: plan.color, padding: "34px 30px 28px", position: "relative" }}>
                    {plan.badge && (
                      <div style={{
                        position: "absolute", top: 16, right: 16,
                        background: "#FFFFFF", color: plan.color,
                        fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 10,
                        padding: "5px 12px", borderRadius: 20, letterSpacing: 0.5,
                      }}>{plan.badge}</div>
                    )}
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 24, color: "#FFFFFF", marginBottom: 8 }}>{plan.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
                      <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 52, color: "#FFFFFF", lineHeight: 1 }}>{plan.couverture}</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.75)" }}>de couverture</span>
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Adhésion</div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: "#FFFFFF" }}>{plan.adhesion} F</div>
                      </div>
                      <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
                      <div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Mensualité</div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: "#FFFFFF" }}>{plan.mensualite} F</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "28px 30px 32px" }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gray, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>Inclus dans cette formule</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
                      {plan.avantages.map(a => (
                        <li key={a} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Inter, sans-serif", fontSize: 14, color: C.slate, marginBottom: 11 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            background: `${plan.color}18`, color: plan.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 800,
                          }}>✓</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                    <Link to={`/adhesion?formule=${plan.name.toLowerCase()}`} style={{
                      display: "block", textAlign: "center",
                      background: i === 1 ? C.gold : plan.color,
                      color: "#FFFFFF",
                      fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15,
                      padding: "15px", borderRadius: 12, textDecoration: "none",
                      letterSpacing: 0.2,
                    }}>Souscrire à {plan.name} →</Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Note légale */}
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, maxWidth: 600, margin: "0 auto" }}>
                Tous les tarifs sont en francs CFA (FCFA). Les frais d'adhésion de 15 000 F sont à régler une seule fois à l'inscription.
                La couverture prend effet 30 jours après la date d'adhésion (délai de carence).
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── COMPARATIF ───────────────────────────────────────── */}
      {activeTab === "compare" && (
        <section style={{ background: C.cream, padding: "72px 24px 96px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1.5px solid #E8F5EE" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ background: "#F8FBF9", padding: "18px 20px", fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, textAlign: "left", fontWeight: 600, borderBottom: "1.5px solid #E8F5EE", width: "40%" }}>
                      Garanties
                    </th>
                    {PLANS.map((p, i) => (
                      <th key={p.name} style={{
                        background: i === 1 ? C.gold : "#F8FBF9",
                        padding: "18px 20px",
                        fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 800,
                        color: i === 1 ? "#FFFFFF" : C.slate,
                        textAlign: "center",
                        borderBottom: "1.5px solid #E8F5EE",
                        borderLeft: "1px solid #E8F5EE",
                      }}>
                        {p.name}
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, opacity: 0.85, marginTop: 3 }}>{p.mensualite} F/mois</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARATIF.map((row, ri) => (
                    <tr key={row.label} style={{ background: ri % 2 === 0 ? "#FFFFFF" : "#FAFCFA" }}>
                      <td style={{ padding: "14px 20px", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.slate, borderBottom: "1px solid #EBF5F0" }}>
                        {row.label}
                      </td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} style={{
                          padding: "14px 20px", textAlign: "center",
                          fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                          color: v === "✗" ? "#CBD5E0" : v === "✓" ? C.green : C.slate,
                          borderBottom: "1px solid #EBF5F0",
                          borderLeft: "1px solid #EBF5F0",
                        }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                  {/* Ligne CTA */}
                  <tr>
                    <td style={{ padding: "20px", background: "#F8FBF9" }} />
                    {PLANS.map((p, i) => (
                      <td key={p.name} style={{ padding: "16px 14px", background: "#F8FBF9", borderLeft: "1px solid #E8F5EE" }}>
                        <Link to={`/adhesion?formule=${p.name.toLowerCase()}`} style={{
                          display: "block", textAlign: "center",
                          background: i === 1 ? C.gold : p.color,
                          color: "#FFFFFF",
                          fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12,
                          padding: "10px", borderRadius: 8, textDecoration: "none",
                        }}>Choisir →</Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ RAPIDE ───────────────────────────────────────── */}
      <section style={{ background: C.white, padding: "80px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: C.slate, margin: 0 }}>
              Questions sur les formules
            </h2>
          </div>
          <div className="awj-grid-2" style={{ gap: 20 }}>
            {[
              { q: "Puis-je changer de formule ?", r: "Oui, à chaque date anniversaire de votre adhésion. Contactez notre équipe pour effectuer la modification." },
              { q: "Y a-t-il un délai de carence ?", r: "Oui, 30 jours pour les soins courants, 6 mois pour la maternité et la chirurgie programmée. Les urgences sont couvertes immédiatement." },
              { q: "Combien de personnes puis-je couvrir ?", r: "Votre conjoint et vos 3 (trois) enfants, limite d'âge inférieure à 21 ans. Pour les parents, une extension est possible." },
              { q: "Que couvre le bilan de santé offert ?", r: "Consultation générale, glycémie, cholestérol, tension artérielle et bilan rénal. À effectuer dans les 3 mois suivant l'adhésion." },
            ].map(f => (
              <div key={f.q} style={{ background: C.cream, borderRadius: 14, padding: "20px 22px", border: "1.5px solid #EBF5F0" }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate, marginBottom: 8 }}>{f.q}</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray, lineHeight: 1.7, margin: 0 }}>{f.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SIMULATEUR ───────────────────────────────────── */}
      <section style={{ background: C.greenPale, padding: "72px 24px", textAlign: "center", borderTop: "1.5px solid #DCF0E5" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🧮</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: C.slate, margin: "0 0 16px" }}>
            Pas sûr de votre choix ?
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.7, marginBottom: 28 }}>
            Notre simulateur vous recommande la formule idéale en 3 questions selon votre budget, votre famille et vos besoins médicaux.
          </p>
          <Link to="/simulateur" style={{
            display: "inline-block", background: C.green, color: "#FFFFFF",
            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
            padding: "14px 32px", borderRadius: 10, textDecoration: "none",
          }}>Faire le simulateur →</Link>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
