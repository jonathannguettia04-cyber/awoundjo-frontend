// src/components/shared/Footer.jsx
import { Link } from "react-router-dom";
import { C, CONTACT } from "../../data/constants";

export default function Footer() {
  return (
    <footer style={{ background: "#0F2D1A", padding: "60px 20px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="awj-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.green}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: C.white, fontWeight: 900, fontSize: 16, fontFamily: "Playfair Display, serif" }}>A</span>
              </div>
              <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 20, color: C.white }}>Awoundjô</span>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", lineHeight: 1.7, maxWidth: 280 }}>
              La première mutuelle de santé digitale de Côte d'Ivoire. Solidarité, accessibilité, innovation.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {["Facebook", "Instagram", "LinkedIn", "WhatsApp"].map(s => (
                <div key={s} style={{ width: 36, height: 36, borderRadius: 8, background: "#1B3D26", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <span style={{ color: C.gold, fontSize: 14 }}>{s[0]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.gold, letterSpacing: 1, marginBottom: 16 }}>NAVIGATION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", textDecoration: "none" }}>Accueil</Link>
              <Link to="/about" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", textDecoration: "none" }}>À propos</Link>
              <Link to="/formules" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", textDecoration: "none" }}>Formules</Link>
              <Link to="/reseau" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", textDecoration: "none" }}>Réseau de soins</Link>
              <Link to="/blog" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", textDecoration: "none" }}>Blog</Link>
              <Link to="/contact" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", textDecoration: "none" }}>Contact</Link>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.gold, letterSpacing: 1, marginBottom: 16 }}>PORTAILS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Espace Adhérent","Espace Commercial","Espace Établissement","Espace Ambassadeur"].map(l => (
                <span key={l} style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", cursor: "pointer" }}>{l}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.gold, letterSpacing: 1, marginBottom: 16 }}>INFORMATIONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80" }}>{CONTACT.phone}</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", wordBreak: "break-word" }}>{CONTACT.email}</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80" }}>{CONTACT.address}</span>
            </div>
          </div>
        </div>
        <div className="awj-footer-bottom" style={{ borderTop: "1px solid #1B3D26", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#4A7A5A" }}>© 2026 Awoundjô — Tous droits réservés</span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#4A7A5A" }}>Mutuelle de Santé — Côte d'Ivoire</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .awj-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .awj-footer-bottom { flex-direction: column; align-items: flex-start !important; text-align: left; }
        }
        @media (max-width: 480px) {
          .awj-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
