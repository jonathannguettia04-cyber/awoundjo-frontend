// src/components/shared/Nav.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { C } from "../../data/constants";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Ferme le menu mobile à chaque navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [typeof window !== "undefined" ? window.location.pathname : null]);

  const links = [
    ["/about", "À propos"],
    ["/formules", "Formules"],
    ["/fonctionnement", "Comment ça marche"],
    ["/reseau", "Réseau"],
    ["/blog", "Blog"],
    ["/faq", "FAQ"],
  ];

  const navBg = scrolled || menuOpen ? C.white : "transparent";
  const textColor = scrolled || menuOpen ? C.slate : C.white;

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg,
      boxShadow: scrolled || menuOpen ? "0 1px 16px rgba(0,0,0,.08)" : "none",
      transition: "background .3s, box-shadow .3s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", height: 64, justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img
            src="/logo-icon.png"
            alt="Awoundjô"
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
          />
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 20, color: textColor }}>Awoundjô</span>
        </Link>

        {/* ── Liens desktop ─────────────────────────────── */}
        <div className="awj-nav-desktop" style={{ display: "flex", gap: 26, alignItems: "center" }}>
          {links.map(([href, label]) => (
            <Link key={href} to={href} style={{ color: textColor, fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, textDecoration: "none", opacity: .9, whiteSpace: "nowrap" }}>{label}</Link>
          ))}
          <Link to="/adhesion" style={{
            background: C.gold, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
            padding: "9px 18px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap",
          }}>Adhérer</Link>
          <a href="/client/login" style={{
            background: "transparent", color: textColor, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
            padding: "9px 12px", borderRadius: 8, textDecoration: "none", border: `1.5px solid ${textColor}33`, whiteSpace: "nowrap",
          }}>Mon espace</a>
        </div>

        {/* ── Bouton hamburger mobile ──────────────────── */}
        <button
          className="awj-nav-burger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          style={{
            display: "none", background: "none", border: "none", cursor: "pointer",
            width: 40, height: 40, padding: 0, alignItems: "center", justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>
            )}
          </svg>
        </button>
      </div>

      {/* ── Menu mobile déroulant ─────────────────────── */}
      {menuOpen && (
        <div className="awj-nav-mobile" style={{ background: C.white, borderTop: "1px solid #E2E8F0", padding: "8px 20px 20px", display: "none" }}>
          {links.map(([href, label]) => (
            <Link key={href} to={href} onClick={() => setMenuOpen(false)} style={{
              display: "block", padding: "12px 4px", color: C.slate, fontFamily: "Inter, sans-serif",
              fontSize: 15, fontWeight: 500, textDecoration: "none", borderBottom: "1px solid #F1F5F4",
            }}>{label}</Link>
          ))}
          <Link to="/adhesion" onClick={() => setMenuOpen(false)} style={{
            display: "block", textAlign: "center", marginTop: 14,
            background: C.gold, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
            padding: "12px", borderRadius: 8, textDecoration: "none",
          }}>Adhérer</Link>
          <a href="/client/login" style={{
            display: "block", textAlign: "center", marginTop: 10,
            background: C.greenPale, color: C.green, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
            padding: "12px", borderRadius: 8, textDecoration: "none",
          }}>Mon espace</a>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .awj-nav-desktop { display: none !important; }
          .awj-nav-burger { display: flex !important; }
          .awj-nav-mobile { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
