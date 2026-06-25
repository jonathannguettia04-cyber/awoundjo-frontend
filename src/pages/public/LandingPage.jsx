// src/pages/public/LandingPage.jsx
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, STATS, PLANS, TESTIMONIALS, STEPS } from "../../data/constants";

const FAMILY_PHOTO = "/images/hero-famille.jpg";
const DOCTOR_PHOTO = "/images/medecin-partenaire.jpg";
const CITY_PHOTO   = "/images/abidjan-ville.jpg";

const PARTENAIRES = ["Cliniques privées", "Hôpitaux publics", "Pharmacies", "Laboratoires", "Dentistes", "Opticiens"];

export default function LandingPage() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ═══ HERO ══════════════════════════════════════════════════════ */}
      <section className="awj-hero-pad" style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(150deg, #0A2E18 0%, ${C.green} 45%, #1a5c35 100%)`,
        display: "flex",
        alignItems: "center",
        paddingTop: 64,
      }}>
        {/* Motif décoratif kente */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${(i % 5) * 22}%`,
              top: `${Math.floor(i / 5) * 40 - 10}%`,
              width: 180, height: 180,
              background: i % 2 === 0 ? C.gold : C.greenLight,
              opacity: 0.05,
              transform: `rotate(45deg) scale(${0.4 + (i % 3) * 0.2})`,
              borderRadius: 6,
            }} />
          ))}
          {/* Cercle lumineux */}
          <div style={{
            position: "absolute", right: "5%", top: "10%",
            width: 500, height: 500, borderRadius: "50%",
            background: `radial-gradient(circle, ${C.gold}18 0%, transparent 70%)`,
          }} />
        </div>

        <div className="awj-grid-2 awj-section" style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "72px 24px 80px",
          position: "relative", zIndex: 2,
          gap: 56, alignItems: "center",
        }}>
          {/* Texte gauche */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: `${C.gold}20`, border: `1px solid ${C.gold}40`,
              borderRadius: 20, padding: "7px 16px", marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
              <span style={{ color: C.gold, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>MUTUELLE DE SANTÉ — CÔTE D'IVOIRE</span>
            </div>

            <h1 style={{
              fontFamily: "Playfair Display, serif",
              fontWeight: 900,
              fontSize: "clamp(2.2rem, 4.8vw, 3.8rem)",
              color: "#FFFFFF",
              lineHeight: 1.12,
              margin: "0 0 24px",
              letterSpacing: -0.5,
            }}>
              La santé de votre<br />
              famille, <span style={{ color: C.gold }}>couverte</span><br />
              dès 10 000 F/mois.
            </h1>

            <p style={{
              fontFamily: "Inter, sans-serif", fontSize: 17,
              color: "#A8CDB8", lineHeight: 1.75,
              marginBottom: 40, maxWidth: 500,
            }}>
              Awoundjô vous donne accès à plus de 120 établissements partenaires en Côte d'Ivoire. Soins, hospitalisation, maternité, optique — sans avancer les frais.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 52 }}>
              <Link to="/adhesion" style={{
                background: C.gold,
                color: "#0A1F12",
                fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15,
                padding: "15px 30px", borderRadius: 10, textDecoration: "none",
                boxShadow: `0 6px 24px ${C.gold}50`,
                letterSpacing: 0.2,
              }}>Devenir adhérent →</Link>
              <Link to="/simulateur" style={{
                background: "rgba(255,255,255,0.08)",
                color: "#FFFFFF",
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
                padding: "15px 30px", borderRadius: 10, textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(4px)",
              }}>Tester mon budget</Link>
            </div>

            {/* Stats inline */}
            <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 30, color: C.gold, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "#7AA88C", marginTop: 4, letterSpacing: 0.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual droite */}
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            <div style={{
              width: "100%", maxWidth: 460,
              aspectRatio: "4/5",
              borderRadius: 24, overflow: "hidden",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
              position: "relative",
            }}>
              <img
                src={FAMILY_PHOTO}
                alt="Famille ivoirienne adhérente Awoundjô"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(180deg, transparent 55%, ${C.green}AA 100%)`,
              }} />
              <div style={{
                position: "absolute", bottom: 20, left: 20, right: 20,
                fontFamily: "Inter, sans-serif", fontSize: 13, color: "#FFFFFF",
                fontWeight: 600,
              }}>
                ✓ Sans avance de frais dans tout le réseau
              </div>
            </div>

            {/* Carte mutualiste overlay */}
            <div style={{
              position: "absolute", bottom: -32, left: "50%",
              transform: "translateX(-50%) rotate(-3deg)",
              width: 290, height: 176, borderRadius: 16,
              background: `linear-gradient(135deg, #0D2B18 0%, #1B6B3A 100%)`,
              boxShadow: `0 28px 64px rgba(0,0,0,0.55), 0 0 0 1px ${C.gold}30`,
              padding: 22, overflow: "hidden",
            }}>
              <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: "50%", background: `${C.gold}12` }} />
              <div style={{ position: "absolute", right: 20, bottom: 20, width: 90, height: 90, borderRadius: "50%", background: `${C.greenLight}15` }} />
              <div style={{ fontFamily: "Playfair Display, serif", color: C.gold, fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Awoundjô</div>
              <div style={{ fontFamily: "Inter, sans-serif", color: "#6B9E80", fontSize: 8, letterSpacing: 1.5, marginBottom: 20 }}>MUTUELLE DE SANTÉ — CÔTE D'IVOIRE</div>
              <div style={{ fontFamily: "Inter, sans-serif", color: "#FFFFFF", fontSize: 13, letterSpacing: 2.5, marginBottom: 14 }}>AWJ-2026-XXXXXX</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", color: "#6B9E80", fontSize: 8, letterSpacing: 1 }}>ADHÉRENT</div>
                  <div style={{ fontFamily: "Inter, sans-serif", color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}>FAMILLE KOUASSI</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", color: "#6B9E80", fontSize: 8, letterSpacing: 1 }}>FORMULE</div>
                  <div style={{ fontFamily: "Inter, sans-serif", color: C.gold, fontSize: 11, fontWeight: 800 }}>IVOIRIENNE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PARTENAIRES TYPES ═════════════════════════════════════════ */}
      <div style={{ background: "#F0F7F3", borderBottom: "1px solid #DCF0E5", padding: "18px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray, letterSpacing: 1, marginRight: 8, textTransform: "uppercase", fontWeight: 600 }}>Réseau acceptant la carte Mansa :</span>
          {PARTENAIRES.map((p, i) => (
            <span key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.green, fontWeight: 600 }}>{p}</span>
              {i < PARTENAIRES.length - 1 && <span style={{ color: "#CBD5E0", fontSize: 12 }}>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ POURQUOI AWOUNDJÔ ════════════════════════════════════════ */}
      <section style={{ background: C.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Pourquoi nous choisir</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.7rem, 3vw, 2.8rem)", color: C.slate, margin: 0, lineHeight: 1.2 }}>
              Une mutuelle conçue<br />pour la réalité ivoirienne
            </h2>
          </div>
          <div className="awj-grid-3" style={{ gap: 28 }}>
            {[
              {
                icon: "💳",
                title: "Sans avance de frais",
                desc: "Présentez simplement votre carte Mansa à l'accueil. L'établissement facture directement Awoundjô. Aucun débours de votre poche.",
                accent: C.green,
              },
              {
                icon: "📱",
                title: "100% digital",
                desc: "Adhésion en ligne, paiement Mobile Money (Wave, Orange, MTN, Moov), carnet numérique et téléconsultation — tout depuis votre téléphone.",
                accent: C.gold,
              },
              {
                icon: "👨‍👩‍👧",
                title: "Toute la famille couverte",
                desc: "Un seul contrat couvre votre foyer entier. Conjoint, enfants et parents à charge reçoivent chacun leur carte personnalisée.",
                accent: "#0E7490",
              },
              {
                icon: "🏥",
                title: "120+ établissements",
                desc: "Cliniques, hôpitaux, pharmacies, labo et dentistes dans 12 villes de Côte d'Ivoire. Le réseau s'agrandit chaque trimestre.",
                accent: C.green,
              },
              {
                icon: "⚡",
                title: "Remboursements rapides",
                desc: "Pour les soins hors réseau, vos remboursements sont traités sous 48h ouvrables. Suivez chaque demande depuis votre espace.",
                accent: C.gold,
              },
              {
                icon: "🩺",
                title: "Téléconsultation incluse",
                desc: "Consultez un médecin en ligne depuis chez vous, sans frais supplémentaires. Disponible 6 jours sur 7, ordonnance électronique incluse.",
                accent: "#0E7490",
              },
            ].map(f => (
              <div key={f.title} style={{
                background: C.white, borderRadius: 16, padding: "28px 26px",
                border: "1.5px solid #EBF5F0",
                boxShadow: "0 2px 16px rgba(27,107,58,0.05)",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${f.accent}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: 18,
                }}>{f.icon}</div>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate, margin: "0 0 10px" }}>{f.title}</h3>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FORMULES APERÇU ══════════════════════════════════════════ */}
      <section style={{ background: C.cream, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Nos formules</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.7rem, 3vw, 2.6rem)", color: C.slate, margin: "0 0 14px" }}>
              Une couverture adaptée<br />à chaque budget
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, maxWidth: 480, margin: "0 auto" }}>
              Frais d'adhésion uniques de 15 000 F. Mensualité dès 10 000 F. Activez votre couverture en 24h.
            </p>
          </div>

          <div className="awj-grid-3" style={{ gap: 24 }}>
            {PLANS.map((plan, i) => (
              <div key={plan.name} style={{
                borderRadius: 20, overflow: "hidden",
                boxShadow: i === 1 ? `0 12px 48px ${C.gold}25` : "0 2px 20px rgba(0,0,0,0.06)",
                border: i === 1 ? `2.5px solid ${C.gold}` : "1.5px solid #E8F5EE",
                background: C.white,
                transform: i === 1 ? "scale(1.03)" : "scale(1)",
              }}>
                <div style={{ background: plan.color, padding: "30px 28px 26px", position: "relative" }}>
                  {plan.badge && (
                    <div style={{
                      position: "absolute", top: 14, right: 14,
                      background: "#FFFFFF", color: plan.color,
                      fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 10,
                      padding: "4px 10px", borderRadius: 20, letterSpacing: 0.5,
                    }}>{plan.badge}</div>
                  )}
                  <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 22, color: "#FFFFFF", marginBottom: 6 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 44, color: "#FFFFFF" }}>{plan.couverture}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>de couverture</span>
                  </div>
                </div>
                <div style={{ padding: "24px 28px 28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                    <div style={{ background: C.cream, borderRadius: 10, padding: "11px 14px" }}>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: C.gray, letterSpacing: 1.2, marginBottom: 3, textTransform: "uppercase" }}>Adhésion</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.slate }}>{plan.adhesion} F</div>
                    </div>
                    <div style={{ background: C.cream, borderRadius: 10, padding: "11px 14px" }}>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: C.gray, letterSpacing: 1.2, marginBottom: 3, textTransform: "uppercase" }}>Mensualité</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.slate }}>{plan.mensualite} F</div>
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px" }}>
                    {plan.avantages.map(a => (
                      <li key={a} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.slate, marginBottom: 9 }}>
                        <span style={{ color: plan.color, fontWeight: 700, fontSize: 15 }}>✓</span> {a}
                      </li>
                    ))}
                  </ul>
                  <Link to={`/adhesion?formule=${plan.name.toLowerCase()}`} style={{
                    display: "block", textAlign: "center",
                    background: i === 1 ? C.gold : plan.color,
                    color: "#FFFFFF",
                    fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
                    padding: "13px", borderRadius: 10, textDecoration: "none",
                  }}>Souscrire →</Link>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Link to="/simulateur" style={{
              fontFamily: "Inter, sans-serif", fontSize: 14, color: C.green, fontWeight: 600,
              textDecoration: "none", borderBottom: `1px dashed ${C.green}`,
            }}>Pas sûr ? Faites le simulateur →</Link>
          </div>
        </div>
      </section>

      {/* ═══ PROCESSUS 5 ÉTAPES ═══════════════════════════════════════ */}
      <section style={{ background: C.green, padding: "96px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${i * 14}%`, top: "20%", width: 200, height: 200, borderRadius: "50%", background: "#FFFFFF" }} />
          ))}
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Le parcours</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: "#FFFFFF", margin: 0 }}>
              Adhérez en 5 étapes simples
            </h2>
          </div>
          <div className="awj-grid-5" style={{ gap: 16 }}>
            {STEPS.map((step, i) => (
              <div key={step.n} style={{ textAlign: "center", position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", top: 32, left: "60%", width: "80%", height: 2,
                    background: `${C.gold}40`, zIndex: 0,
                    display: "none",
                  }} className="awj-step-line" />
                )}
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  margin: "0 auto 18px",
                  background: C.gold,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 6px 24px ${C.gold}55`,
                  position: "relative", zIndex: 1,
                }}>
                  <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 20, color: "#0A1F12" }}>{step.n}</span>
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: "#FFFFFF", marginBottom: 8 }}>{step.label}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#8FB8A0", lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 56 }}>
            <Link to="/adhesion" style={{
              background: "#FFFFFF", color: C.green,
              fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15,
              padding: "15px 36px", borderRadius: 10, textDecoration: "none",
              boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
            }}>Commencer mon adhésion →</Link>
          </div>
        </div>
      </section>

      {/* ═══ IMAGE VILLE + CHIFFRES ════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 320 }}>
        <img src={CITY_PHOTO} alt="Abidjan" style={{ width: "100%", height: 320, objectFit: "cover", display: "block", filter: "brightness(0.35)" }} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div className="awj-grid-4" style={{ maxWidth: 1000, width: "100%", padding: "0 24px", gap: 40 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: C.gold, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 8, letterSpacing: 0.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TÉMOIGNAGES ══════════════════════════════════════════════ */}
      <section style={{ background: C.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Témoignages</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: C.slate, margin: 0 }}>
              Ils nous font confiance
            </h2>
          </div>
          <div className="awj-grid-3" style={{ gap: 24 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{
                background: C.cream, borderRadius: 20, padding: "32px 28px",
                border: "1.5px solid #E8F5EE",
              }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 52, color: `${C.gold}60`, lineHeight: 0.8, marginBottom: 18 }}>"</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.slate, lineHeight: 1.75, marginBottom: 24, fontStyle: "italic" }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
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
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link to="/avis" style={{
              fontFamily: "Inter, sans-serif", fontSize: 14, color: C.green, fontWeight: 600,
              textDecoration: "none", borderBottom: `1px dashed ${C.green}`,
            }}>Voir tous les témoignages →</Link>
          </div>
        </div>
      </section>

      {/* ═══ MÉDECIN SECTION ══════════════════════════════════════════ */}
      <section style={{ background: C.cream, padding: "96px 24px" }}>
        <div className="awj-grid-2" style={{ maxWidth: 1200, margin: "0 auto", gap: 64, alignItems: "center" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }}>
            <img src={DOCTOR_PHOTO} alt="Médecin partenaire Awoundjô" style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Vous êtes professionnel de santé ?</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.slate, margin: "0 0 20px", lineHeight: 1.25 }}>
              Rejoignez notre réseau<br />de soins partenaire
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.75, marginBottom: 28 }}>
              Cliniques, hôpitaux, pharmacies, laboratoires : intégrez le réseau Awoundjô et accueillez 2 400+ adhérents actifs. Facturation directe, paiements sécurisés, tableau de bord dédié.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
              {["Aucun frais d'entrée", "Interface de gestion en ligne", "Remboursements sous 5 jours ouvrables", "Visibilité dans l'annuaire Awoundjô"].map(b => (
                <li key={b} style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: "Inter, sans-serif", fontSize: 14, color: C.slate, marginBottom: 10 }}>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 16 }}>✓</span> {b}
                </li>
              ))}
            </ul>
            <Link to="/etablissement/login" style={{
              display: "inline-block",
              background: C.green, color: "#FFFFFF",
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            }}>Accéder à l'espace établissement →</Link>
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ════════════════════════════════════════════════ */}
      <section style={{
        background: `linear-gradient(135deg, #0A2E18 0%, ${C.green} 100%)`,
        padding: "96px 24px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, background: `radial-gradient(circle at 30% 50%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>
            Prêt à protéger votre famille ?
          </div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(1.8rem, 3.5vw, 3rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.2 }}>
            Commencez dès aujourd'hui,<br />couverture activée en 24h.
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#A8CDB8", lineHeight: 1.7, marginBottom: 40 }}>
            Adhésion en ligne en 5 minutes. Paiement Mobile Money. Aucun déplacement requis.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/adhesion" style={{
              background: C.gold, color: "#0A1F12",
              fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15,
              padding: "16px 36px", borderRadius: 10, textDecoration: "none",
              boxShadow: `0 8px 32px ${C.gold}50`,
            }}>Adhérer maintenant →</Link>
            <Link to="/contact" style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
              padding: "16px 32px", borderRadius: 10, textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.3)",
            }}>Être rappelé</Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
