// src/pages/public/Formules.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, GESTIONNAIRE_PLANS, GESTIONNAIRE_NOTE, FORMULE_BASIQUE, CONTACT } from "../../data/constants";

const waBasiqueLink = (offre) =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    `Bonjour, je souhaite souscrire à la Formule Basique (${offre}) d'Awoundjô.`
  )}`;

export default function Formules() {
  const [activeTab, setActiveTab] = useState("cards");
  const [grille, setGrille] = useState("particulier"); // "particulier" | "entreprise"

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, ${C.slate} 0%, ${C.green} 100%)`,
        padding: "140px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, background: `radial-gradient(circle at 60% 40%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Nos formules</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.15 }}>
            Choisissez la couverture<br /><span style={{ color: C.gold }}>qui vous correspond</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 24px" }}>
            Primes annuelles, formules gérées par notre gestionnaire maladie partenaire sur notre réseau de soins. Sans sélection médicale pour les pathologies non déclarées.
          </p>

          {/* Bandeau réservation 2027 */}
          <div style={{
            background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.4)",
            borderRadius: 14, padding: "16px 20px", maxWidth: 560, margin: "0 auto 28px",
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#FFFFFF", lineHeight: 1.6 }}>
              📅 Ces formules entrent en vigueur en <strong>2027</strong>. Réservez votre place dès maintenant pour 15 000 F.
            </span>
            <Link to="/adhesion?type=reservation" style={{
              display: "inline-block", background: C.gold, color: "#08172B",
              fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 13,
              padding: "9px 18px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap",
            }}>Réserver ma place →</Link>
          </div>

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

          {/* Bascule grille tarifaire */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: 4, gap: 4 }}>
              {[{ id: "particulier", label: "Particulier" }, { id: "entreprise", label: "Entreprise (≥10 familles / 30 solos)" }].map(g => (
                <button key={g.id} onClick={() => setGrille(g.id)} style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                  padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: grille === g.id ? C.gold : "transparent",
                  color: grille === g.id ? "#08172B" : "rgba(255,255,255,0.7)",
                  transition: "all .2s",
                }}>{g.label}</button>
              ))}
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "rgba(255,255,255,0.6)", margin: 0 }}>
              {grille === "particulier" ? GESTIONNAIRE_NOTE.seuil_particulier : GESTIONNAIRE_NOTE.seuil_entreprise}
            </p>
          </div>
        </div>
      </section>

      {/* ── CARTES FORMULES ──────────────────────────────────── */}
      {activeTab === "cards" && (
        <section style={{ background: C.cream, padding: "72px 24px 96px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="awj-grid-3" style={{ gap: 28 }}>
              {GESTIONNAIRE_PLANS.map((plan, i) => {
                const prix = plan[grille];
                return (
                <div key={plan.slug} style={{
                  borderRadius: 22, overflow: "hidden",
                  boxShadow: i === 3 ? `0 16px 56px ${C.gold}25` : "0 4px 24px rgba(0,0,0,0.07)",
                  border: i === 3 ? `2.5px solid ${C.gold}` : `1.5px solid ${C.greenPale}`,
                  background: C.white,
                  transform: i === 3 ? "translateY(-8px)" : "none",
                }}>
                  <div style={{ background: plan.color, padding: "34px 30px 28px", position: "relative" }}>
                    {i === 3 && (
                      <div style={{
                        position: "absolute", top: 16, right: 16,
                        background: "#FFFFFF", color: plan.color,
                        fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 10,
                        padding: "5px 12px", borderRadius: 20, letterSpacing: 0.5,
                      }}>Couverture totale</div>
                    )}
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 24, color: "#FFFFFF", marginBottom: 8 }}>{plan.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
                      <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 52, color: "#FFFFFF", lineHeight: 1 }}>{plan.couverture}</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.75)" }}>Côte d'Ivoire</span>
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Solo / an</div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: "#FFFFFF" }}>{prix.solo} F</div>
                      </div>
                      <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
                      <div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Famille / an</div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: "#FFFFFF" }}>{prix.famille} F</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "28px 30px 32px" }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gray, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>Prime à la naissance (PNA)</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
                      <li style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.slate, marginBottom: 11 }}>
                        <span>Enfant supplémentaire</span><strong>{prix.pna_enfant_supplementaire} F</strong>
                      </li>
                      <li style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.slate }}>
                        <span>Enfant à charge</span><strong>{prix.pna_enfant_charge} F</strong>
                      </li>
                    </ul>
                    <Link to={`/adhesion?type=reservation&formule=${plan.slug.toLowerCase()}`} style={{
                      display: "block", textAlign: "center",
                      background: i === 3 ? C.gold : plan.color,
                      color: "#FFFFFF",
                      fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15,
                      padding: "15px", borderRadius: 12, textDecoration: "none",
                      letterSpacing: 0.2,
                    }}>Réserver — {plan.name} →</Link>
                  </div>
                </div>
              );})}
            </div>

            {/* Note légale */}
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, maxWidth: 640, margin: "0 auto" }}>
                Tous les tarifs sont en francs CFA (FCFA), primes annuelles. {GESTIONNAIRE_NOTE.surprime_pathologie} {GESTIONNAIRE_NOTE.surprime_age}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── COMPARATIF ───────────────────────────────────────── */}
      {activeTab === "compare" && (
        <section style={{ background: C.cream, padding: "72px 24px 96px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: `1.5px solid ${C.greenPale}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ background: C.cream, padding: "18px 20px", fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, textAlign: "left", fontWeight: 600, borderBottom: `1.5px solid ${C.greenPale}`, width: "28%" }}>
                      Tarifs ({grille === "particulier" ? "particulier" : "entreprise ≥10 familles/30 solos"})
                    </th>
                    {GESTIONNAIRE_PLANS.map((p, i) => (
                      <th key={p.slug} style={{
                        background: i === 3 ? C.gold : C.cream,
                        padding: "18px 20px",
                        fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 800,
                        color: i === 3 ? "#FFFFFF" : C.slate,
                        textAlign: "center",
                        borderBottom: `1.5px solid ${C.greenPale}`,
                        borderLeft: `1px solid ${C.greenPale}`,
                      }}>
                        {p.name}
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, opacity: 0.85, marginTop: 3 }}>{p.couverture} CI</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Prime annuelle — Solo", key: "solo" },
                    { label: "Prime annuelle — Famille", key: "famille" },
                    { label: "PNA enfant supplémentaire", key: "pna_enfant_supplementaire" },
                    { label: "PNA enfant à charge", key: "pna_enfant_charge" },
                  ].map((row, ri) => (
                    <tr key={row.label} style={{ background: ri % 2 === 0 ? "#FFFFFF" : "#FAFCFA" }}>
                      <td style={{ padding: "14px 20px", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.slate, borderBottom: `1px solid ${C.greenPale}` }}>
                        {row.label}
                      </td>
                      {GESTIONNAIRE_PLANS.map((p) => (
                        <td key={p.slug} style={{
                          padding: "14px 20px", textAlign: "center",
                          fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                          color: C.slate,
                          borderBottom: `1px solid ${C.greenPale}`,
                          borderLeft: `1px solid ${C.greenPale}`,
                        }}>{p[grille][row.key]} F</td>
                      ))}
                    </tr>
                  ))}
                  {/* Ligne CTA */}
                  <tr>
                    <td style={{ padding: "20px", background: C.cream }} />
                    {GESTIONNAIRE_PLANS.map((p, i) => (
                      <td key={p.slug} style={{ padding: "16px 14px", background: C.cream, borderLeft: `1px solid ${C.greenPale}` }}>
                        <Link to={`/adhesion?type=reservation&formule=${p.slug.toLowerCase()}`} style={{
                          display: "block", textAlign: "center",
                          background: i === 3 ? C.gold : p.color,
                          color: "#FFFFFF",
                          fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12,
                          padding: "10px", borderRadius: 8, textDecoration: "none",
                        }}>Réserver →</Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, maxWidth: 640, margin: "20px auto 0", textAlign: "center" }}>
              {GESTIONNAIRE_NOTE.surprime_pathologie} {GESTIONNAIRE_NOTE.surprime_age}
            </p>
          </div>
        </section>
      )}

      {/* ── FORMULE BASIQUE (offre distincte, réseau existant) ── */}
      <section id="basique" style={{ background: C.white, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 12, textTransform: "uppercase" }}>
              {FORMULE_BASIQUE.badge} — à partir du 1er décembre
            </div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: C.slate, margin: "0 0 14px" }}>
              Formule {FORMULE_BASIQUE.name}
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              {FORMULE_BASIQUE.reduction_pharmacie} de réduction en pharmacies et {FORMULE_BASIQUE.remise_clinique_hopital} de remise en cliniques et hôpitaux — sur le {FORMULE_BASIQUE.reseau.toLowerCase()}.
            </p>
          </div>

          <div className="awj-grid-2" style={{ gap: 24, marginBottom: 32 }}>
            {FORMULE_BASIQUE.offres.map(o => (
              <div key={o.id} style={{
                borderRadius: 22, background: C.cream, border: `1.5px solid ${C.greenPale}`,
                padding: "30px 28px", display: "flex", flexDirection: "column",
              }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gray, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
                  {o.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 36, color: C.slate }}>{o.montant} F</span>
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, marginBottom: 18 }}>
                  en {o.frequence}, + {o.adhesion} F de frais d'adhésion, soit {FORMULE_BASIQUE.total} F au total. Couvre uniquement la personne qui paie.
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", flexGrow: 1 }}>
                  {FORMULE_BASIQUE.avantages.map(a => (
                    <li key={a} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.slate, marginBottom: 10 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: `${FORMULE_BASIQUE.color}18`, color: FORMULE_BASIQUE.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800,
                      }}>✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
                <a href={waBasiqueLink(o.label)} target="_blank" rel="noopener noreferrer" style={{
                  display: "block", textAlign: "center",
                  background: FORMULE_BASIQUE.color, color: "#FFFFFF",
                  fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15,
                  padding: "15px", borderRadius: 12, textDecoration: "none",
                }}>Souscrire à la Formule Basique →</a>
              </div>
            ))}

            {/* Condition de consommation */}
            <div style={{
              borderRadius: 22, background: C.slate, color: "#FFFFFF",
              padding: "30px 28px", display: "flex", flexDirection: "column",
            }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
                Pour profiter des réductions
              </div>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 30, lineHeight: 1.2, marginBottom: 12 }}>
                Parrainez {FORMULE_BASIQUE.parrainages_requis} personnes
              </div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#CBD5E0", lineHeight: 1.7, margin: "0 0 18px" }}>
                La consommation est débloquée dès que {FORMULE_BASIQUE.parrainages_requis} personnes que vous avez parrainées ont réglé leurs {FORMULE_BASIQUE.prix_unique} F.
                Un parrainage compte seulement une fois le paiement du filleul confirmé.
              </p>
              <ol style={{ margin: "0 0 24px", paddingLeft: 20, flexGrow: 1, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#E2E8F0", lineHeight: 1.7 }}>
                <li>Vous réglez {FORMULE_BASIQUE.prix_unique} F + {FORMULE_BASIQUE.frais_adhesion} F d'adhésion.</li>
                <li>Vous partagez votre lien de parrainage.</li>
                <li>{FORMULE_BASIQUE.parrainages_requis} filleuls règlent leurs {FORMULE_BASIQUE.prix_unique} F.</li>
                <li>Vos réductions de 50 % s'activent.</li>
              </ol>
              <Link to="/formule-basique" style={{
                display: "block", textAlign: "center", border: "1.5px solid rgba(255,255,255,0.4)",
                color: "#FFFFFF", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
                padding: "13px", borderRadius: 12, textDecoration: "none",
              }}>Tout savoir sur la Formule Basique</Link>
            </div>
          </div>

          <p style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, maxWidth: 600, margin: "0 auto" }}>
            La Formule Basique utilise le réseau de soins existant Awoundjô (pharmacies, cliniques et hôpitaux partenaires). Tarifs en FCFA.
          </p>
        </div>
      </section>

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
              { q: "Puis-je changer de formule ?", r: "Oui, à chaque renouvellement annuel de votre adhésion. Contactez notre équipe pour effectuer la modification." },
              { q: "Qu'est-ce qu'une surprime pathologie ou âge ?", r: "Les tarifs affichés concernent les personnes sans pathologie déclarée. Une surprime s'applique en cas de pathologie déclarée, ainsi qu'à partir de 55 ans." },
              { q: "Qui gère les remboursements et la prise en charge ?", r: "Ces formules sont gérées par notre gestionnaire maladie partenaire sur le réseau de soins Awoundjô. Contactez notre équipe pour le détail des garanties et exclusions." },
              { q: "Quelle est la différence entre la grille particulier et entreprise ?", r: "La grille entreprise s'applique à partir de 10 familles ou 30 solos couverts ; en dessous de ce seuil, la grille particulier s'applique." },
            ].map(f => (
              <div key={f.q} style={{ background: C.cream, borderRadius: 14, padding: "20px 22px", border: `1.5px solid ${C.greenPale}` }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate, marginBottom: 8 }}>{f.q}</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray, lineHeight: 1.7, margin: 0 }}>{f.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SIMULATEUR ───────────────────────────────────── */}
      <section style={{ background: C.greenPale, padding: "72px 24px", textAlign: "center", borderTop: `1.5px solid ${C.greenPale}` }}>
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
