// src/pages/public/BlogPost.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, CONTACT } from "../../data/constants";

const API = import.meta.env.VITE_API_URL || "";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const CATEGORY_COLOR = {
  Conseils:   { bg: `${C.green}14`,  color: C.green },
  Pratique:   { bg: `${C.gold}14`,   color: C.gold },
  Actualités: { bg: "#0E749014",     color: "#0E7490" },
};

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    fetch(`${API}/api/blog/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setPost(data.data || data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    fetch(`${API}/api/blog`)
      .then((r) => r.json())
      .then((data) => {
        const all = data.data || data || [];
        setRelated(all.filter((p) => p.slug !== slug).slice(0, 2));
      })
      .catch(() => setRelated([]));
  }, [slug]);

  if (loading) {
    return (
      <>
        <FontLoader /><Nav /><ResponsiveStyles />
        <section style={{ background: C.white, padding: "140px 24px 96px", textAlign: "center" }}>
          <p style={{ fontFamily: "Inter, sans-serif", color: C.gray }}>Chargement…</p>
        </section>
        <Footer /><WhatsAppFloat />
      </>
    );
  }

  if (notFound || !post) {
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

  // Paragraphes du contenu (séparés par ligne vide), ou texte par défaut si vide
  const paragraphs = (post.content || "").trim()
    ? post.content.trim().split(/\n\s*\n/).filter(Boolean)
    : [
        "Chez Awoundjô, nous croyons que l'accès à l'information est la première étape vers une meilleure santé. Notre équipe travaille chaque jour à rendre nos services plus accessibles, plus transparents et plus adaptés aux réalités des familles ivoiriennes.",
        "La mutualisation est un principe simple mais puissant : chacun cotise selon ses moyens et bénéficie selon ses besoins. En Côte d'Ivoire, où l'accès aux soins reste un défi pour de nombreuses familles, ce modèle peut transformer des vies.",
      ];

  const gallery = Array.isArray(post.gallery) ? post.gallery : [];

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ARTICLE ─────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, ${C.slate} 0%, ${C.green} 100%)`,
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
            }}>{post.category?.toUpperCase()}</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{formatDate(post.created_at)}</span>
          </div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: 680 }}>
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
              {post.image && (
                <div style={{ borderRadius: "0 0 20px 20px", overflow: "hidden", marginBottom: gallery.length ? 20 : 48, boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
                  <img src={post.image} alt={post.title} style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }} />
                </div>
              )}

              {/* Galerie photo */}
              {gallery.length > 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(gallery.length, 3)}, 1fr)`,
                  gap: 10,
                  marginBottom: 48,
                }}>
                  {gallery.map((url, i) => (
                    <div key={i} style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "1/1" }}>
                      <img src={url} alt={`${post.title} — photo ${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Contenu */}
              <div>
                {paragraphs.map((p, i) => (
                  <p key={i} style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: i === 0 ? 17 : 16,
                    fontWeight: i === 0 ? 500 : 400,
                    color: i === 0 ? C.slate : C.gray,
                    lineHeight: 1.85,
                    marginBottom: 28,
                  }}>
                    {p}
                  </p>
                ))}
              </div>

              {/* CTA article */}
              <div style={{
                marginTop: 48, background: C.greenPale,
                borderRadius: 18, padding: "28px 28px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 20, flexWrap: "wrap",
                border: `1.5px solid ${C.greenPale}`,
              }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.green, marginBottom: 4 }}>
                    Envie de rejoindre la mutuelle ?
                  </div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, margin: 0 }}>
                    Adhésion en ligne en 5 minutes. Couverture activée sous 24h.
                  </p>
                </div>
                <Link to="/adhesion" style={{
                  background: C.green, color: "#FFFFFF",
                  fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
                  padding: "13px 24px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap",
                }}>Adhérer maintenant →</Link>
              </div>

              {/* Partager */}
              <div style={{ marginTop: 36, paddingTop: 28, borderTop: `1.5px solid ${C.greenPale}` }}>
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
                <div style={{ background: C.cream, borderRadius: 16, padding: "22px 20px", border: `1.5px solid ${C.greenPale}` }}>
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
                <div style={{ background: C.white, borderRadius: 16, padding: "22px 20px", border: `1.5px solid ${C.greenPale}` }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Une question ?</div>
                  <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
                    background: C.greenPale, padding: "12px 14px", borderRadius: 10,
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
                  <div style={{ background: C.white, borderRadius: 16, padding: "22px 20px", border: `1.5px solid ${C.greenPale}` }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Lire aussi</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {related.map(r => (
                        <Link key={r.slug} to={`/blog/${r.slug}`} style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: C.greenPale }}>
                            {r.image && <img src={r.image} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                          </div>
                          <div>
                            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: C.slate, lineHeight: 1.35, marginBottom: 4 }}>{r.title}</div>
                            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray }}>{formatDate(r.created_at)}</div>
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
