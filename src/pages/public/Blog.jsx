// src/pages/public/Blog.jsx
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, BLOG_POSTS } from "../../data/constants";

const CATEGORY_COLOR = {
  Conseils:    C.green,
  Pratique:    C.gold,
  Actualités:  "#0E7490",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Blog() {
  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.white, padding: "140px 24px 96px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>BLOG</div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: C.slate, margin: 0 }}>
              Actualités &amp; conseils santé
            </h1>
          </div>

          <div className="awj-grid-3" style={{ gap: 28 }}>
            {BLOG_POSTS.map(post => (
              <Link key={post.slug} to={`/blog/${post.slug}`} style={{
                textDecoration: "none", background: C.white, borderRadius: 16, overflow: "hidden",
                boxShadow: "0 2px 16px rgba(0,0,0,.06)", display: "flex", flexDirection: "column",
                border: "1px solid #F1F5F4",
              }}>
                <div style={{ aspectRatio: "16/10", overflow: "hidden", background: C.greenPale }}>
                  <img src={post.image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ padding: "20px 22px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{
                    alignSelf: "flex-start", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11,
                    color: CATEGORY_COLOR[post.category] || C.green, background: `${CATEGORY_COLOR[post.category] || C.green}14`,
                    padding: "4px 10px", borderRadius: 20, marginBottom: 12,
                  }}>{post.category}</div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate, lineHeight: 1.35, marginBottom: 10 }}>
                    {post.title}
                  </div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
                    {post.excerpt}
                  </p>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray }}>{formatDate(post.date)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
