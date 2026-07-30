// src/pages/public/About.jsx
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, STATS } from "../../data/constants";

const TEAM_PHOTO = "/images/equipe-awoundjo.jpg";
const OFFICE_PHOTO = "/images/bureaux-awoundjo.jpg";

const VALEURS = [
  { icon: "🤝", label: "Solidarité", desc: "Chaque cotisation aide une famille dans le besoin. La force du collectif au service de chacun." },
  { icon: "🏥", label: "Accessibilité", desc: "Des formules adaptées à tous les budgets, dès 10 000 F/mois. La santé n'est pas un luxe." },
  { icon: "🔍", label: "Transparence", desc: "Tarifs clairs, remboursements traçables, aucun frais caché. Vous savez toujours où en est votre dossier." },
  { icon: "💡", label: "Innovation", desc: "Adhésion digitale, téléconsultation, carte NFC : nous modernisons l'accès aux soins pour tous." },
  { icon: "🌱", label: "Prévention", desc: "Bilan de santé offert à l'adhésion. Nous agissons avant la maladie, pas seulement après." },
  { icon: "🇨🇮", label: "Ancrage local", desc: "Né en Côte d'Ivoire, pour les Ivoiriens. Notre réseau, notre équipe et nos valeurs sont 100% locaux." },
];

const TIMELINE = [
  { year: "2018", title: "Fondation", desc: "Awoundjô est créée à Abidjan avec la conviction que la santé doit être accessible à tous." },
  { year: "2019", title: "Premiers adhérents", desc: "Les 100 premiers adhérents rejoignent la mutuelle. Le réseau compte déjà 12 établissements partenaires." },
  { year: "2021", title: "Digitalisation", desc: "Lancement de la carte Mansa numérique et du portail adhérent en ligne. Fin des paperasses." },
  { year: "2022", title: "Expansion", desc: "Ouverture dans 8 nouvelles villes. 500+ adhérents actifs. Partenariats entreprises et associations." },
  { year: "2024", title: "Téléconsultation", desc: "Intégration de la téléconsultation médicale. Les adhérents consultent un médecin sans se déplacer." },
  { year: "2026", title: "Aujourd'hui", desc: "2 400+ adhérents, 120+ établissements partenaires, 12 villes. La croissance continue chaque mois.", current: true },
];

export default function About() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, #08172B 0%, ${C.green} 100%)`,
        padding: "140px 24px 96px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: `radial-gradient(circle at 70% 40%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>
            Qui sommes-nous
          </div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "#FFFFFF", margin: "0 0 24px", lineHeight: 1.15 }}>
            Une mutuelle née en Côte d'Ivoire,<br /><span style={{ color: C.gold }}>pour les Ivoiriens</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, color: "#A9C6E0", lineHeight: 1.75, maxWidth: 640, margin: "0 auto" }}>
            Fondée en 2018, Awoundjô a une mission simple : rendre les soins de santé accessibles à chaque famille ivoirienne, quelle que soit sa situation économique.
          </p>
        </div>
      </section>

      {/* ── STATS BANDE ──────────────────────────────────────── */}
      <div style={{ background: C.white, borderBottom: "1px solid #E0EEF9" }}>
        <div className="awj-grid-4" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", gap: 32 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 34, color: C.green, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, marginTop: 6, letterSpacing: 0.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MISSION / VISION ─────────────────────────────────── */}
      <section style={{ background: C.cream, padding: "96px 24px" }}>
        <div className="awj-grid-2" style={{ maxWidth: 1200, margin: "0 auto", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Notre raison d'être</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.slate, margin: "0 0 32px", lineHeight: 1.2 }}>
              Mission et vision
            </h2>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>🎯</div>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.green, marginBottom: 6 }}>Notre mission</div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.75, margin: 0 }}>
                    Rendre les soins de santé accessibles à chaque famille ivoirienne grâce à un système de mutualisation solidaire, digital et transparent — sans bureaucratie, sans avance de frais.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.gold}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>🔭</div>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.gold, marginBottom: 6 }}>Notre vision</div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.75, margin: 0 }}>
                    Être la première mutuelle de santé digitale de Côte d'Ivoire, couvrant 100 000 adhérents d'ici 2027, avec un réseau de soins présent dans chaque commune du pays.
                  </p>
                </div>
              </div>
            </div>
            <Link to="/adhesion" style={{
              display: "inline-block", background: C.green, color: "#FFFFFF",
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            }}>Rejoindre la mutuelle →</Link>
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.1)" }}>
            <img src={TEAM_PHOTO} alt="Équipe Awoundjô" style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }} />
          </div>
        </div>
      </section>

      {/* ── VALEURS ──────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Ce qui nous guide</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.slate, margin: 0 }}>
              Nos valeurs fondatrices
            </h2>
          </div>
          <div className="awj-grid-3" style={{ gap: 24 }}>
            {VALEURS.map(v => (
              <div key={v.label} style={{
                background: C.cream, borderRadius: 16, padding: "28px 24px",
                border: "1.5px solid #E0EEF9",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ fontSize: 30 }}>{v.icon}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate }}>{v.label}</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────── */}
      <section style={{ background: C.cream, padding: "96px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Notre parcours</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.slate, margin: 0 }}>
              De l'idée à la réalité
            </h2>
          </div>
          <div style={{ position: "relative" }}>
            {/* Ligne verticale */}
            <div style={{ position: "absolute", left: 31, top: 0, bottom: 0, width: 2, background: "#D6E6F5" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
              {TIMELINE.map((item) => (
                <div key={item.year} style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                    background: item.current ? C.green : C.white,
                    border: `2px solid ${item.current ? C.green : "#D6E6F5"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: item.current ? `0 4px 20px ${C.green}40` : "none",
                    position: "relative", zIndex: 1,
                  }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 11, color: item.current ? "#FFFFFF" : C.green }}>{item.year}</span>
                  </div>
                  <div style={{ paddingTop: 14 }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: item.current ? C.green : C.slate, marginBottom: 6 }}>
                      {item.title} {item.current && <span style={{ fontSize: 11, color: C.gold, marginLeft: 6 }}>● EN COURS</span>}
                    </div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LOCAUX + CTA ────────────────────────────────────── */}
      <section style={{ background: C.green, padding: "96px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: `radial-gradient(circle at 20% 50%, ${C.gold} 0%, transparent 60%)` }} />
        <div className="awj-grid-2" style={{ maxWidth: 1200, margin: "0 auto", gap: 64, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <img src={OFFICE_PHOTO} alt="Bureaux Awoundjô Abidjan" style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Nous rencontrer</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.25 }}>
              Notre équipe vous accueille<br />à Abidjan
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#A9C6E0", lineHeight: 1.75, marginBottom: 32 }}>
              Jules Verne, derrière l'école Akenji, Abidjan. Du lundi au vendredi de 8h à 17h, le samedi de 8h à 13h. Venez rencontrer notre équipe ou adhérez directement en ligne.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/contact" style={{
                background: C.gold, color: "#0A1628",
                fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 14,
                padding: "13px 28px", borderRadius: 10, textDecoration: "none",
              }}>Nous contacter →</Link>
              <Link to="/adhesion" style={{
                background: "rgba(255,255,255,0.12)", color: "#FFFFFF",
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
                padding: "13px 28px", borderRadius: 10, textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,0.3)",
              }}>Adhérer en ligne</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
