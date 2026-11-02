// src/components/shared/Footer.jsx
import { Link } from "react-router-dom";
import { C, CONTACT } from "../../data/constants";

const NAV = [
  { to: "/",               label: "Accueil" },
  { to: "/about",          label: "À propos" },
  { to: "/formules",       label: "Nos formules" },
  { to: "/fonctionnement", label: "Comment ça marche" },
  { to: "/reseau",         label: "Réseau de soins" },
  { to: "/simulateur",     label: "Simulateur de budget" },
  { to: "/avis",           label: "Témoignages" },
  { to: "/blog",           label: "Blog santé" },
  { to: "/faq",            label: "FAQ" },
  { to: "/contact",        label: "Contact" },
];

// Espaces connectés, regroupés par public
const ESPACES = [
  {
    titre: "Adhérents et établissements",
    liens: [
      { label: "Espace adhérent",      href: "/client/login" },
      { label: "Espace établissement", href: "/etablissement/login" },
    ],
  },
  {
    titre: "Réseaux de partenaires",
    liens: [
      { label: "Ambassadeurs diaspora", href: "/diaspora/login" },
      { label: "Parrainage",            href: "/referral" },
      { label: "Affiliés",              href: "/affilie" },
      { label: "Commerciaux",           href: "/business/login" },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook",  href: "https://facebook.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "LinkedIn",  href: "https://linkedin.com" },
  { label: "WhatsApp",  href: `https://wa.me/${CONTACT.whatsapp}` },
];

const LEGAL = [
  { label: "Mentions légales",              to: "/politiques#mentions" },
  { label: "Politique de confidentialité", to: "/politiques#confidentialite" },
  { label: "CGU",                           to: "/politiques#cgu" },
];

const FONT = "Inter, sans-serif";

export default function Footer() {
  return (
    <footer className="awj-footer" style={{ background: "#08172B", borderTop: `3px solid ${C.greenLight}`, fontFamily: FONT }}>

      {/* ── Bandeau d'appel ──────────────────────────────────── */}
      <div className="awj-footer-cta">
        <div className="awj-footer-cta-inner">
          <div>
            <h3 className="awj-footer-cta-title">Réservez votre formule 2027</h3>
            <p className="awj-footer-cta-sub">15 000 F par Mobile Money pour garder votre place.</p>
          </div>
          <div className="awj-footer-cta-actions">
            <Link to="/adhesion?type=reservation" className="awj-footer-btn awj-footer-btn-main">Réserver ma place</Link>
            <Link to="/simulateur" className="awj-footer-btn awj-footer-btn-ghost">Tester mon budget</Link>
          </div>
        </div>
      </div>

      {/* ── Corps ───────────────────────────────────────────── */}
      <div className="awj-footer-body">
        <div className="awj-footer-grid">

          {/* Marque */}
          <div className="awj-footer-brand">
            <div className="awj-footer-logo">
              <img src="/logo-icon.png" alt="Awoundjô" width="40" height="40" />
              <div>
                <strong>Awoundjô</strong>
                <span>Mutuelle de santé</span>
              </div>
            </div>
            <p className="awj-footer-about">
              La mutuelle de santé digitale de Côte d'Ivoire. Solidarité, accessibilité et innovation pour chaque famille.
            </p>
            <p className="awj-footer-agree">Mutuelle agréée n° 019-072/MEPS/CAB du 27/08/2019</p>
            <div className="awj-footer-social">
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation du site">
            <h4 className="awj-footer-h">Découvrir</h4>
            <ul className="awj-footer-list">
              {NAV.map((l) => (
                <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Espaces connectés */}
          <div>
            <h4 className="awj-footer-h">Espaces connectés</h4>
            {ESPACES.map((g) => (
              <div key={g.titre} className="awj-footer-group">
                <p className="awj-footer-group-t">{g.titre}</p>
                <ul className="awj-footer-list">
                  {g.liens.map((l) => (
                    <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 className="awj-footer-h">Nous joindre</h4>
            <ul className="awj-footer-list awj-footer-contact">
              <li>
                <span>Téléphone</span>
                <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>{CONTACT.phone}</a>
              </li>
              <li>
                <span>Email</span>
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li>
                <span>Adresse</span>
                <address>{CONTACT.address}</address>
              </li>
              <li>
                <span>Horaires</span>
                <p>Lun – Ven : 8h00 – 17h00<br />Sam : 8h00 – 13h00</p>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bas de page ──────────────────────────────────── */}
        <div className="awj-footer-bottom">
          <span>© 2026 Awoundjô. Tous droits réservés.</span>
          <div className="awj-footer-legal">
            {LEGAL.map((l) => (
              <Link key={l.to} to={l.to}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .awj-footer a { text-decoration: none; }
        .awj-footer a:focus-visible { outline: 2px solid ${C.greenLight}; outline-offset: 3px; border-radius: 4px; }

        /* Bandeau */
        .awj-footer-cta { background: linear-gradient(135deg, ${C.green}, #0F2A4A); border-bottom: 1px solid #16324F; padding: 36px 24px; }
        .awj-footer-cta-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .awj-footer-cta-title { font-family: "Playfair Display", serif; font-weight: 700; font-size: clamp(1.3rem, 2.4vw, 1.8rem); color: #fff; margin: 0 0 4px; }
        .awj-footer-cta-sub { color: #B7D3EC; font-size: 14px; margin: 0; }
        .awj-footer-cta-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .awj-footer-btn { font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; transition: transform .15s, background .15s; }
        .awj-footer-btn:hover { transform: translateY(-1px); }
        .awj-footer-btn-main { background: ${C.greenLight}; color: #08172B; }
        .awj-footer-btn-ghost { color: #fff; border: 1.5px solid rgba(255,255,255,.35); }
        .awj-footer-btn-ghost:hover { border-color: #fff; }

        /* Corps */
        .awj-footer-body { max-width: 1200px; margin: 0 auto; padding: 56px 24px 28px; }
        .awj-footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1.1fr 1.3fr; gap: 48px; padding-bottom: 44px; }
        .awj-footer-h { font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 16px; letter-spacing: .2px; }
        .awj-footer-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .awj-footer-list a { font-size: 14px; color: #8FADC9; transition: color .15s; }
        .awj-footer-list a:hover { color: #fff; }

        /* Marque */
        .awj-footer-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .awj-footer-logo img { border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .awj-footer-logo strong { display: block; font-family: "Playfair Display", serif; font-size: 20px; color: #fff; line-height: 1.1; }
        .awj-footer-logo span { font-size: 12px; color: ${C.greenLight}; }
        .awj-footer-about { font-size: 14px; color: #8FADC9; line-height: 1.7; max-width: 32ch; margin: 0 0 14px; }
        .awj-footer-agree { font-size: 12.5px; color: #6F93B5; margin: 0 0 18px; }
        .awj-footer-social { display: flex; flex-wrap: wrap; gap: 8px 18px; }
        .awj-footer-social a { font-size: 13.5px; color: #C8DCEE; transition: color .15s; }
        .awj-footer-social a:hover { color: ${C.greenLight}; }

        /* Espaces connectés */
        .awj-footer-group + .awj-footer-group { margin-top: 22px; }
        .awj-footer-group-t { font-size: 12px; color: #5F86A8; margin: 0 0 10px; }

        /* Contact */
        .awj-footer-contact li span { display: block; font-size: 12px; color: #5F86A8; margin-bottom: 2px; }
        .awj-footer-contact a, .awj-footer-contact address, .awj-footer-contact p { font-size: 14px; color: #C8DCEE; font-style: normal; line-height: 1.55; margin: 0; word-break: break-word; }
        .awj-footer-contact a:hover { color: #fff; }

        /* Bas de page */
        .awj-footer-bottom { border-top: 1px solid #16324F; padding-top: 22px; display: flex; justify-content: space-between; align-items: center; gap: 12px 24px; flex-wrap: wrap; font-size: 13px; color: #6F93B5; }
        .awj-footer-legal { display: flex; flex-wrap: wrap; gap: 8px 22px; }
        .awj-footer-legal a { color: #6F93B5; transition: color .15s; }
        .awj-footer-legal a:hover { color: #fff; }

        @media (max-width: 960px) {
          .awj-footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
          .awj-footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .awj-footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .awj-footer-cta-actions { width: 100%; }
          .awj-footer-btn { flex: 1; text-align: center; }
          .awj-footer-bottom { flex-direction: column; align-items: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) {
          .awj-footer-btn, .awj-footer a { transition: none; }
        }
      `}</style>
    </footer>
  );
}
