// src/pages/public/BlogPost.jsx
import { useParams, Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, BLOG_POSTS } from "../../data/constants";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <>
        <FontLoader />
        <Nav />
        <ResponsiveStyles />
        <section className="awj-page-pad awj-section" style={{ background: C.white, padding: "140px 24px 96px", textAlign: "center" }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.slate, marginBottom: 16 }}>Article introuvable</div>
          <Link to="/blog" style={{ color: C.green, fontFamily: "Inter, sans-serif", fontWeight: 600, textDecoration: "none" }}>← Retour au blog</Link>
        </section>
        <Footer />
        <WhatsAppFloat />
      </>
    );
  }

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.white, padding: "140px 24px 96px" }}>
        <article style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link to="/blog" style={{ color: C.green, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
            ← Retour au blog
          </Link>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11, color: C.gold, letterSpacing: 1, marginBottom: 12 }}>
            {post.category.toUpperCase()} — {formatDate(post.date)}
          </div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.slate, margin: "0 0 24px", lineHeight: 1.25 }}>
            {post.title}
          </h1>
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32, aspectRatio: "16/9" }}>
            <img src={post.image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.slate, lineHeight: 1.8, marginBottom: 20 }}>
            {post.excerpt}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.gray, lineHeight: 1.8 }}>
            Chez Awoundjô, nous croyons que l'accès à l'information est la première étape vers une meilleure santé.
            Notre équipe travaille chaque jour à rendre nos services plus accessibles, plus transparents et plus
            adaptés aux réalités des familles ivoiriennes.
          </p>

          <div style={{ background: C.greenPale, borderRadius: 16, padding: "24px 28px", marginTop: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: C.green }}>
              Envie de rejoindre la mutuelle ?
            </div>
            <Link to="/adhesion" style={{
              background: C.green, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "11px 22px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap",
            }}>Adhérer maintenant →</Link>
          </div>
        </article>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
