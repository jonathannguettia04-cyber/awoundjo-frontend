// src/components/shared/Footer.jsx
import { Link } from "react-router-dom";
import { C, CONTACT } from "../../data/constants";

const PORTAILS = [
  { label: "Espace Adhérent",       href: "/client/login",        desc: "Gérez votre couverture" },
  { label: "Espace Établissement",  href: "/etablissement/login", desc: "Portail prestataires" },
  { label: "Espace Ambassadeur",    href: "/diaspora/login",      desc: "Réseau Diaspora" },
  { label: "Espace Parrainage",     href: "/referral",            desc: "Réseau Référral" },
  { label: "Espace Affilié",        href: "/affilie",             desc: "Réseau Affilié" },
  { label: "Espace Commercial",     href: "/business/login",      desc: "Réseau Business" },
];

const SOCIAL = [
  { label: "Facebook",  href: "https://facebook.com",  icon: "f" },
  { label: "Instagram", href: "https://instagram.com", icon: "in" },
  { label: "LinkedIn",  href: "https://linkedin.com",  icon: "li" },
  { label: "WhatsApp",  href: `https://wa.me/${CONTACT.whatsapp}`, icon: "wa" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#08172B", borderTop: `3px solid ${C.greenLight}` }}>
      {/* Bandeau CTA */}
      <div style={{
        background: `linear-gradient(135deg, ${C.green}, #0F2A4A)`,
        padding: "48px 24px",
        textAlign: "center",
        borderBottom: "1px solid #16324F",
      }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, letterSpacing: 2, color: C.greenLight, fontWeight: 700, marginBottom: 12 }}>
          PRÊT À PROTÉGER VOTRE FAMILLE ?
        </p>
        <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.3rem, 2.5vw, 2rem)", color: "#FFFFFF", margin: "0 0 20px" }}>
          Rejoignez 2 400 familles ivoiriennes déjà protégées
        </h3>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/adhesion" style={{
            background: C.greenLight, color: "#08172B", fontFamily: "Inter, sans-serif", fontWeight: 800,
            fontSize: 14, padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            letterSpacing: 0.3,
          }}>Adhérer maintenant</Link>
          <Link to="/simulateur" style={{
            background: "transparent", color: "#FFFFFF", fontFamily: "Inter, sans-serif", fontWeight: 600,
            fontSize: 14, padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            border: "1.5px solid rgba(255,255,255,0.3)",
          }}>Tester mon budget →</Link>
        </div>
      </div>

      {/* Corps du footer */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 32px" }}>
        <div className="awj-footer-grid" style={{
          display: "grid",
          gridTemplateColumns: "2.2fr 1fr 1.4fr 1fr",
          gap: 48,
          marginBottom: 48,
        }}>
          {/* Colonne marque */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <img
                src="/logo-icon.png"
                alt="Awoundjô"
                style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
              <div>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, color: "#FFFFFF", lineHeight: 1 }}>Awoundjô</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: C.greenLight, letterSpacing: 1.5, marginTop: 2 }}>MUTUELLE DE SANTÉ</div>
              </div>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#8FADC9", lineHeight: 1.75, maxWidth: 290, margin: "0 0 20px" }}>
              La première mutuelle de santé digitale de Côte d'Ivoire. Solidarité, accessibilité et innovation pour chaque famille ivoirienne.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {SOCIAL.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label} style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: "#0F2440",
                  border: "1px solid #16324F",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}>
                  <span style={{ color: C.greenLight, fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>{s.icon}</span>
                </a>
              ))}
            </div>
            {/* Certifications / badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["CIMA agréé", "Paiement sécurisé", "RGPD conforme"].map(b => (
                <span key={b} style={{
                  fontFamily: "Inter, sans-serif", fontSize: 10, color: "#5A85A8",
                  border: "1px solid #16324F", borderRadius: 4,
                  padding: "3px 8px", letterSpacing: 0.3,
                }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11, color: C.greenLight, letterSpacing: 1.5, marginBottom: 18, textTransform: "uppercase" }}>Navigation</div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {[
                { to: "/",             label: "Accueil" },
                { to: "/about",        label: "À propos" },
                { to: "/formules",     label: "Nos formules" },
                { to: "/fonctionnement", label: "Comment ça marche" },
                { to: "/reseau",       label: "Réseau de soins" },
                { to: "/avis",         label: "Témoignages" },
                { to: "/blog",         label: "Blog santé" },
                { to: "/faq",          label: "FAQ" },
                { to: "/contact",      label: "Contact" },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{
                  fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#8FADC9",
                  textDecoration: "none", transition: "color 0.15s",
                }}>{l.label}</Link>
              ))}
            </nav>
          </div>

          {/* Portails */}
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11, color: C.greenLight, letterSpacing: 1.5, marginBottom: 18, textTransform: "uppercase" }}>Espaces connectés</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PORTAILS.map(p => (
                <Link key={p.href} to={p.href} style={{
                  textDecoration: "none",
                  display: "flex", flexDirection: "column", gap: 1,
                  padding: "9px 12px", borderRadius: 8,
                  background: "#102A47",
                  border: "1px solid #16324F",
                  transition: "border-color 0.15s",
                }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#C8DCEE" }}>{p.label}</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#5A85A8" }}>{p.desc}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11, color: C.greenLight, letterSpacing: 1.5, marginBottom: 18, textTransform: "uppercase" }}>Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "📞", val: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g,"")}` },
                { icon: "✉️", val: CONTACT.email, href: `mailto:${CONTACT.email}` },
                { icon: "📍", val: CONTACT.address, href: null },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, lineHeight: 1.6, flexShrink: 0 }}>{c.icon}</span>
                  {c.href ? (
                    <a href={c.href} style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#8FADC9", textDecoration: "none", lineHeight: 1.55, wordBreak: "break-word" }}>{c.val}</a>
                  ) : (
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#8FADC9", lineHeight: 1.55 }}>{c.val}</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: "14px 16px", background: "#102A47", borderRadius: 10, border: "1px solid #16324F" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.greenLight, fontWeight: 700, marginBottom: 6 }}>HORAIRES D'OUVERTURE</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8FADC9", lineHeight: 1.6 }}>
                Lun – Ven : 8h00 – 17h00<br />
                Sam : 8h00 – 13h00
              </div>
            </div>
          </div>
        </div>

        {/* Bas de page */}
        <div className="awj-footer-bottom" style={{
          borderTop: "1px solid #16324F",
          paddingTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#3A5A78" }}>
            © 2026 Awoundjô — Tous droits réservés. Mutuelle de Santé, Côte d'Ivoire.
          </span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Mentions légales", to: "/politiques#mentions" },
              { label: "Politique de confidentialité", to: "/politiques#confidentialite" },
              { label: "CGU", to: "/politiques#cgu" },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#3A5A78", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .awj-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 560px) {
          .awj-footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .awj-footer-bottom { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>
    </footer>
  );
}
