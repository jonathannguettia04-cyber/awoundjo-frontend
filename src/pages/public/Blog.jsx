// src/pages/public/Blog.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C } from "../../data/constants";

const API = import.meta.env.VITE_API_URL || "";

const CATEGORY_COLOR = {
  Conseils:   { bg: `${C.green}14`,   color: C.green },
  Pratique:   { bg: `${C.gold}14`,    color: C.gold },
  Actualités: { bg: "#0E749014",      color: "#0E7490" },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tous");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/blog`)
      .then((r) => r.json())
      .then((data) => setPosts(data.data || data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const cats = ["Tous", ...Array.from(new Set(posts.map((p) => p.category)))];
  const filtered = filter === "Tous" ? posts : posts.filter((p) => p.category === filter);
  const featured = posts[0];
  const rest = filtered.filter((p) => p.slug !== featured?.slug);

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
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: `radial-gradient(circle at 60% 30%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Blog santé</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.15 }}>
            Conseils, actualités<br /><span style={{ color: C.gold }}>et guides santé</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#A8CDB8", lineHeight: 1.75 }}>
            L'équipe Awoundjô vous partage des ressources pratiques pour mieux prendre soin de vous et de votre famille.
          </p>
        </div>
      </section>

      {loading ? (
        <section style={{ background: C.white, padding: "80px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "Inter, sans-serif", color: C.gray }}>Chargement des articles…</p>
        </section>
      ) : !posts.length ? (
        <section style={{ background: C.white, padding: "80px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "Inter, sans-serif", color: C.gray }}>Aucun article publié pour le moment.</p>
        </section>
      ) : (
        <>
          {/* ── ARTICLE FEATURED ─────────────────────────────── */}
          {filter === "Tous" && featured && (
            <section style={{ background: C.white, padding: "64px 24px 0" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 20, textTransform: "uppercase" }}>Article à la une</div>
                <Link to={`/blog/${featured.slug}`} style={{
                  textDecoration: "none", display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  borderRadius: 22, overflow: "hidden",
                  border: "1.5px solid #EBF5F0",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
                  background: C.white,
                }} className="awj-grid-2-featured">
                  <div style={{ aspectRatio: "16/9", overflow: "hidden", background: C.greenPale }}>
                    {featured.image && (
                      <img src={featured.image} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .3s" }} />
                    )}
                  </div>
                  <div style={{ padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{
                      alignSelf: "flex-start", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11,
                      color: CATEGORY_COLOR[featured.category]?.color || C.green,
                      background: CATEGORY_COLOR[featured.category]?.bg || C.greenPale,
                      padding: "5px 12px", borderRadius: 20, marginBottom: 16,
                    }}>{featured.category}</div>
                    <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)", color: C.slate, margin: "0 0 14px", lineHeight: 1.3 }}>{featured.title}</h2>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14.5, color: C.gray, lineHeight: 1.7, marginBottom: 20 }}>{featured.excerpt}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray }}>{formatDate(featured.created_at)}</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: C.green }}>Lire l'article →</span>
                    </div>
                  </div>
                </Link>
              </div>
            </section>
          )}

          {/* ── FILTRES ──────────────────────────────────────── */}
          <section style={{ background: C.white, padding: "48px 24px 0" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 40 }}>
                {cats.map(c => (
                  <button key={c} onClick={() => setFilter(c)} style={{
                    fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                    padding: "9px 20px", borderRadius: 22, cursor: "pointer",
                    background: filter === c ? C.green : C.white,
                    color: filter === c ? "#FFFFFF" : C.slate,
                    border: `1.5px solid ${filter === c ? C.green : "#E2E8F0"}`,
                    transition: "all .15s",
                  }}>{c}</button>
                ))}
              </div>

              {/* Grille articles */}
              <div className="awj-grid-3" style={{ gap: 28, paddingBottom: 80 }}>
                {rest.map(post => (
                  <Link key={post.slug} to={`/blog/${post.slug}`} style={{
                    textDecoration: "none", background: C.white, borderRadius: 18, overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column",
                    border: "1.5px solid #EBF5F0", transition: "box-shadow .2s",
                  }}>
                    <div style={{ aspectRatio: "16/10", overflow: "hidden", background: C.greenPale }}>
                      {post.image && (
                        <img src={post.image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
                    </div>
                    <div style={{ padding: "22px 22px 26px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{
                        alignSelf: "flex-start",
                        fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 10,
                        color: CATEGORY_COLOR[post.category]?.color || C.green,
                        background: CATEGORY_COLOR[post.category]?.bg || C.greenPale,
                        padding: "4px 10px", borderRadius: 20, marginBottom: 12, letterSpacing: 0.3,
                      }}>{post.category}</div>
                      <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate, margin: "0 0 10px", lineHeight: 1.35 }}>{post.title}</h3>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray, lineHeight: 1.65, marginBottom: 16, flex: 1 }}>{post.excerpt}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: C.gray }}>{formatDate(post.created_at)}</span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.green }}>Lire →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── NEWSLETTER ───────────────────────────────────────── */}
      <section style={{ background: C.greenPale, padding: "72px 24px", borderTop: "1.5px solid #DCF0E5" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: C.slate, margin: "0 0 12px" }}>
            Ne manquez aucun article
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, marginBottom: 28 }}>
            Conseils santé, actualités réseau, nouveaux remboursements — directement dans votre boîte.
          </p>
          {subscribed ? (
            <div style={{ background: C.white, borderRadius: 14, padding: "20px", border: "1.5px solid #DCF0E5" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, color: C.green }}>✓ Vous êtes abonné ! Merci.</span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, maxWidth: 440, margin: "0 auto" }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                style={{
                  flex: 1, padding: "13px 16px", borderRadius: 10,
                  border: "1.5px solid #DCF0E5", fontFamily: "Inter, sans-serif",
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
              <button onClick={() => { if (email) setSubscribed(true); }} style={{
                background: C.green, color: "#FFFFFF", border: "none",
                fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
                padding: "13px 20px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap",
              }}>S'abonner</button>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 760px) {
          .awj-grid-2-featured { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
