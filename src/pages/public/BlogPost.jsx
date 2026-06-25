// src/pages/public/BlogPost.jsx
import { useParams, Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, BLOG_POSTS, CONTACT } from "../../data/constants";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const CATEGORY_COLOR = {
  Conseils:   { bg: `${C.green}14`,  color: C.green },
  Pratique:   { bg: `${C.gold}14`,   color: C.gold },
  Actualités: { bg: "#0E749014",     color: "#0E7490" },
};

// Contenu enrichi par slug
const POST_CONTENT = {
  "bien-choisir-sa-formule-sante": {
    intro: "Choisir une mutuelle santé n'est pas une décision anodine. C'est un engagement financier mensuel qui doit correspondre à votre situation familiale, votre état de santé et votre budget. Voici les critères essentiels pour faire le bon choix.",
    sections: [
      {
        title: "1. Évaluez vos besoins réels",
        body: "Avant de choisir une formule, listez vos besoins médicaux habituels. Consultez-vous souvent un médecin généraliste ? Avez-vous des maladies chroniques nécessitant un suivi régulier ? Portez-vous des lunettes ou des lentilles ? Prévoyez-vous une grossesse ? Pour une famille jeune et en bonne santé, la formule Essentielle peut suffire. Pour une famille avec des enfants ou des besoins en optique et maternité, la formule Ivoirienne est plus adaptée.",
      },
      {
        title: "2. Calculez votre budget réel",
        body: "Ne regardez pas seulement la mensualité, mais le coût total annuel : mensualité × 12 + frais d'adhésion. Pour la formule Essentielle : 10 000 × 12 + 15 000 = 135 000 F/an, soit 375 F par jour. Rapporté à une hospitalisation qui peut coûter 200 000 à 500 000 F, la mutuelle est rapidement rentabilisée.",
      },
      {
        title: "3. Tenez compte de toute la famille",
        body: "Chez Awoundjô, votre cotisation couvre votre foyer entier (conjoint + enfants à charge). Le nombre de personnes couvertes ne change pas le tarif mensuel. Plus votre famille est grande, plus le rapport qualité/prix de la mutuelle est avantageux.",
      },
      {
        title: "4. Utilisez le simulateur",
        body: "En cas de doute, notre simulateur en ligne vous pose 4 questions ciblées et vous recommande la formule idéale en moins d'une minute. C'est gratuit et sans engagement.",
      },
    ],
    conclusion: "Le meilleur choix est celui qui correspond à vos besoins actuels, avec une marge pour les imprévus. Vous pouvez toujours changer de formule à votre date anniversaire d'adhésion.",
    cta_text: "Faire le simulateur →",
    cta_link: "/simulateur",
  },
};

export default function BlogPost() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find(p => p.slug === slug);
  const content = POST_CONTENT[slug];
  const related = BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 2);

  if (!post) {
    return (
      <>
        <FontLoader /><Nav /><ResponsiveStyles />
        <section style={{ background: C.white, padding: "140px 24px 96px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, color: C.slate, marginBottom: 16 }}>Article introuvable</div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, marginBottom: 24 }}>Cet article n'existe pas ou a été supprimé.</p>
          <Link to="/blog" style={{ color: C.green, fontFamily: "Inter, sans-serif", fontWeight: 600, textDecoration: "none" }}>← Retour au blog</Link>
        </section>
        <Footer /><WhatsAppFloat />
      </>
    );
  }

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ARTICLE ─────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, #0A2E18 0%, ${C.green} 100%)`,
        padding: "140px 24px 56px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: `radial-gradient(circle at 60% 30%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Link to="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", marginBottom: 20 }}>
            ← Retour au blog
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11,
              color: CATEGORY_COLOR[post.category]?.color || C.gold,
              background: "rgba(255,255,255,0.12)",
              padding: "5px 12px", borderRadius: 20, letterSpacing: 0.5,
            }}>{post.category.toUpperCase()}</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{formatDate(post.date)}</span>
          </div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#A8CDB8", lineHeight: 1.7, maxWidth: 680 }}>
            {post.excerpt}
          </p>
        </div>
      </section>

      {/* ── CORPS ARTICLE ────────────────────────────────────── */}
      <section style={{ background: C.white, padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="awj-grid-blog" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 56, alignItems: "start" }}>

            {/* Article */}
            <article>
              {/* Image principale */}
              <div style={{ borderRadius: "0 0 20px 20px", overflow: "hidden", marginBottom: 48, boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
                <img src={post.image} alt={post.title} style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }} />
              </div>

              {/* Contenu */}
              {content ? (
                <div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, color: C.slate, lineHeight: 1.85, marginBottom: 36, fontWeight: 500 }}>
                    {content.intro}
                  </p>
                  {content.sections.map((s, i) => (
                    <div key={i} style={{ marginBottom: 36 }}>
                      <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.2rem, 2vw, 1.5rem)", color: C.slate, margin: "0 0 14px", lineHeight: 1.3 }}>
                        {s.title}
                      </h2>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.gray, lineHeight: 1.85, margin: 0 }}>
                        {s.body}
                      </p>
                    </div>
                  ))}
                  <div style={{ background: C.cream, borderRadius: 16, padding: "24px 28px", borderLeft: `4px solid ${C.green}`, margin: "36px 0" }}>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.slate, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                      {content.conclusion}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, color: C.slate, lineHeight: 1.85, marginBottom: 28 }}>
                    {post.excerpt}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.gray, lineHeight: 1.85, marginBottom: 28 }}>
                    Chez Awoundjô, nous croyons que l'accès à l'information est la première étape vers une meilleure santé. Notre équipe travaille chaque jour à rendre nos services plus accessibles, plus transparents et plus adaptés aux réalités des familles ivoiriennes.
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.gray, lineHeight: 1.85 }}>
                    La mutualisation est un principe simple mais puissant : chacun cotise selon ses moyens et bénéficie selon ses besoins. En Côte d'Ivoire, où l'accès aux soins reste un défi pour de nombreuses familles, ce modèle peut transformer des vies.
                  </p>
                </div>
              )}

              {/* CTA article */}
              <div style={{
                marginTop: 48, background: C.greenPale,
                borderRadius: 18, padding: "28px 28px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 20, flexWrap: "wrap",
                border: "1.5px solid #DCF0E5",
              }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.green, marginBottom: 4 }}>
                    Envie de rejoindre la mutuelle ?
                  </div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, margin: 0 }}>
                    Adhésion en ligne en 5 minutes. Couverture activée sous 24h.
                  </p>
                </div>
                <Link to={content?.cta_link || "/adhesion"} style={{
                  background: C.green, color: "#FFFFFF",
                  fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
                  padding: "13px 24px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap",
                }}>{content?.cta_text || "Adhérer maintenant →"}</Link>
              </div>

              {/* Partager */}
              <div style={{ marginTop: 36, paddingTop: 28, borderTop: "1.5px solid #EBF5F0" }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Partager cet article</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <a href={`https://wa.me/?text=${encodeURIComponent(post.title + " — " + window.location.href)}`} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "#25D366", color: "#FFFFFF",
                    fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13,
                    padding: "9px 16px", borderRadius: 8, textDecoration: "none",
                  }}>💬 WhatsApp</a>
                  <button onClick={() => navigator.clipboard?.writeText(window.location.href)} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: C.cream, color: C.slate,
                    fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13,
                    padding: "9px 16px", borderRadius: 8, border: "1.5px solid #E2E8F0", cursor: "pointer",
                  }}>🔗 Copier le lien</button>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside style={{ position: "sticky", top: 84 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* À propos */}
                <div style={{ background: C.cream, borderRadius: 16, padding: "22px 20px", border: "1.5px solid #EBF5F0" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>À propos d'Awoundjô</div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray, lineHeight: 1.7, marginBottom: 16 }}>
                    La première mutuelle de santé digitale de Côte d'Ivoire. 2 400+ adhérents, 120+ établissements partenaires.
                  </p>
                  <Link to="/adhesion" style={{
                    display: "block", textAlign: "center",
                    background: C.green, color: "#FFFFFF",
                    fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13,
                    padding: "11px", borderRadius: 9, textDecoration: "none",
                  }}>Adhérer maintenant →</Link>
                </div>

                {/* Contact rapide */}
                <div style={{ background: C.white, borderRadius: 16, padding: "22px 20px", border: "1.5px solid #EBF5F0" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Une question ?</div>
                  <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
                    background: "#E8F9EF", padding: "12px 14px", borderRadius: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>💬</span>
                    <div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.slate }}>WhatsApp</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray }}>Réponse en quelques minutes</div>
                    </div>
                  </a>
                </div>

                {/* Articles liés */}
                {related.length > 0 && (
                  <div style={{ background: C.white, borderRadius: 16, padding: "22px 20px", border: "1.5px solid #EBF5F0" }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Lire aussi</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {related.map(r => (
                        <Link key={r.slug} to={`/blog/${r.slug}`} style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                            <img src={r.image} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                          <div>
                            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: C.slate, lineHeight: 1.35, marginBottom: 4 }}>{r.title}</div>
                            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray }}>{formatDate(r.date)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .awj-grid-blog { grid-template-columns: 1fr !important; }
          aside { position: static !important; }
        }
      `}</style>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
