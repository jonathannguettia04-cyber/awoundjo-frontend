// src/pages/public/FormuleBasique.jsx
// Page dédiée à la Formule Basique (offre Awoundjô, réseau de soins existant).
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { FORMULE_BASIQUE, CONTACT } from "../../data/constants";

const waLink = (offre) =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    `Bonjour, je souhaite souscrire à la Formule Basique (${offre}) d'Awoundjô.`
  )}`;

// Total de la première année = adhésion + montant (chaînes "6 000" → nombres)
const num = (s) => Number(String(s).replace(/\s/g, ""));
const fmt = (n) => n.toLocaleString("fr-FR").replace(/ /g, " ");

export default function FormuleBasique() {
  const B = FORMULE_BASIQUE;

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      <div className="awj-fb">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap');
          .awj-fb { --ink:#06223F; --navy:#01417E; --cyan:#00ADF1; --paper:#F3F7FB; --line:#D8E3EE; --grey:#46607A; --gold:#D4A843; --green:#009E60;
            font-family:'Figtree',system-ui,sans-serif; color:var(--ink); background:var(--paper); line-height:1.55; -webkit-font-smoothing:antialiased; }
          .awj-fb * { box-sizing:border-box; }
          .awj-fb h1,.awj-fb h2,.awj-fb h3 { font-family:'Bricolage Grotesque','Figtree',sans-serif; margin:0; letter-spacing:-.02em; }
          .awj-fb p { margin:0; }
          .awj-fb .wrap { max-width:1000px; margin:0 auto; padding:0 24px; }
          .awj-fb a:focus-visible { outline:3px solid var(--cyan); outline-offset:3px; }

          .awj-fb .btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; font-weight:700; font-size:16px; text-decoration:none; padding:15px 28px; border-radius:12px; border:2px solid transparent; transition:transform .15s; }
          .awj-fb .btn:hover { transform:translateY(-2px); }
          .awj-fb .btn-gold { background:var(--gold); color:var(--ink); }
          .awj-fb .btn-navy { background:var(--navy); color:#fff; }
          .awj-fb .btn-line { border-color:var(--navy); color:var(--navy); }
          .awj-fb .btn-line:hover { background:var(--navy); color:#fff; }

          .awj-fb .hero { background:var(--ink); color:#fff; padding:128px 0 80px; background-image:radial-gradient(800px 600px at 100% 0%, rgba(0,173,241,.35), transparent 60%); }
          .awj-fb .pill { display:inline-block; font-size:14px; font-weight:700; padding:7px 16px; border-radius:99px; background:rgba(0,173,241,.18); color:#8FD6F7; border:1px solid rgba(0,173,241,.5); margin-bottom:22px; }
          .awj-fb .hero h1 { font-size:clamp(36px,6vw,64px); line-height:1.04; font-weight:800; max-width:16ch; }
          .awj-fb .hero .sub { margin-top:22px; font-size:19px; color:#BFD3E6; max-width:52ch; }
          .awj-fb .big { display:flex; flex-wrap:wrap; gap:14px 40px; margin-top:36px; }
          .awj-fb .big div { font-family:'Bricolage Grotesque',sans-serif; font-weight:800; font-size:clamp(40px,7vw,72px); line-height:1; color:var(--gold); }
          .awj-fb .big span { display:block; font-family:'Figtree',sans-serif; font-weight:600; font-size:16px; color:#B7D3EC; margin-top:8px; }

          .awj-fb .sec { padding:80px 0; }
          .awj-fb .sec-white { background:#fff; }
          .awj-fb h2 { font-size:clamp(28px,4.2vw,40px); line-height:1.1; font-weight:800; }
          .awj-fb .lede { color:var(--grey); font-size:18px; max-width:56ch; margin-top:14px; }

          .awj-fb .offers { margin-top:40px; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
          .awj-fb .offer { background:#fff; border:1px solid var(--line); border-radius:24px; padding:36px 32px; display:flex; flex-direction:column; }
          .awj-fb .offer h3 { font-size:26px; font-weight:800; }
          .awj-fb .offer .amount { font-family:'Bricolage Grotesque',sans-serif; font-weight:800; font-size:52px; line-height:1; margin:22px 0 4px; color:var(--navy); }
          .awj-fb .offer .amount small { font-size:20px; font-weight:700; margin-left:6px; }
          .awj-fb .offer .detail { color:var(--grey); }
          .awj-fb .offer dl { margin:22px 0 28px; display:grid; gap:0; border-top:1px solid var(--line); }
          .awj-fb .offer dl div { display:flex; justify-content:space-between; gap:16px; padding:12px 0; border-bottom:1px solid var(--line); font-size:16px; }
          .awj-fb .offer dt { color:var(--grey); }
          .awj-fb .offer dd { margin:0; font-weight:700; text-align:right; }
          .awj-fb .offer .btn { margin-top:auto; }
          .awj-fb .offer.alt { background:var(--ink); color:#fff; border-color:var(--ink); }
          .awj-fb .offer.alt .amount { color:var(--gold); }
          .awj-fb .offer.alt .detail, .awj-fb .offer.alt dt { color:#B7D3EC; }
          .awj-fb .offer.alt dl, .awj-fb .offer.alt dl div { border-color:rgba(255,255,255,.18); }
          .awj-fb .offer.alt .btn-gold { width:100%; }
          .awj-fb .offer .btn-navy { width:100%; }

          .awj-fb .avantages { list-style:none; margin:36px 0 0; padding:0; display:grid; grid-template-columns:1fr 1fr; gap:0 48px; }
          .awj-fb .avantages li { padding:20px 0 20px 34px; border-top:1px solid var(--line); position:relative; font-size:17px; font-weight:600; }
          .awj-fb .avantages li::before { content:""; position:absolute; left:0; top:27px; width:14px; height:14px; border-radius:4px; background:var(--green); }

          .awj-fb .next { background:var(--navy); color:#fff; padding:72px 0; }
          .awj-fb .next h2 { max-width:20ch; }
          .awj-fb .next p { color:#C6DBEE; font-size:18px; max-width:56ch; margin-top:14px; }
          .awj-fb .next .acts { display:flex; flex-wrap:wrap; gap:14px; margin-top:28px; }
          .awj-fb .next .btn-line { border-color:rgba(255,255,255,.5); color:#fff; }
          .awj-fb .next .btn-line:hover { background:#fff; color:var(--navy); }

          @media (max-width:760px) {
            .awj-fb .hero { padding:104px 0 64px; }
            .awj-fb .sec { padding:60px 0; }
            .awj-fb .offers, .awj-fb .avantages { grid-template-columns:1fr; }
            .awj-fb .offer { padding:30px 24px; }
          }
        `}</style>

        {/* ── Haut de page ── */}
        <header className="hero">
          <div className="wrap">
            <span className="pill">Nouveau, dès le 1er décembre</span>
            <h1>La Formule Basique</h1>
            <p className="sub">
              Payez moins vos soins sur le réseau existant Awoundjô : pharmacies, cliniques et hôpitaux partenaires.
            </p>
            <div className="big">
              <div>{B.reduction_pharmacie}<span>de réduction en pharmacie</span></div>
              <div>{B.remise_clinique_hopital}<span>de remise en clinique et à l'hôpital</span></div>
            </div>
          </div>
        </header>

        {/* ── Les deux offres ── */}
        <section className="sec" id="offres">
          <div className="wrap">
            <h2>Choisissez votre offre</h2>
            <p className="lede">Une adhésion de {B.frais_adhesion} F, puis un paiement en 3 versements. Pas de mensualité récurrente.</p>

            <div className="offers">
              {B.offres.map((o, i) => {
                const total = num(o.adhesion) + num(o.montant);
                const alt = i === 1;
                return (
                  <article className={`offer ${alt ? "alt" : ""}`} key={o.id}>
                    <h3>{o.label}</h3>
                    <div className="amount">{o.montant}<small>F</small></div>
                    <p className="detail">en {o.versements} {o.frequence}</p>
                    <dl>
                      <div><dt>Adhésion</dt><dd>{o.adhesion} F</dd></div>
                      <div><dt>Versement</dt><dd>{o.versements} x {o.versement_unitaire} F</dd></div>
                      <div><dt>Total</dt><dd>{fmt(total)} F</dd></div>
                    </dl>
                    <a
                      href={waLink(o.label)}
                      target="_blank" rel="noopener noreferrer"
                      className={`btn ${alt ? "btn-gold" : "btn-navy"}`}
                    >
                      Souscrire sur WhatsApp
                    </a>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Ce que vous obtenez ── */}
        <section className="sec sec-white">
          <div className="wrap">
            <h2>Ce qui est inclus</h2>
            <ul className="avantages">
              {B.avantages.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </section>

        {/* ── Suite ── */}
        <section className="next">
          <div className="wrap">
            <h2>Besoin d'une couverture plus large ?</h2>
            <p>
              Les formules Classic, Aisance, Harmony et Premium couvrent de 80 % à 100 % de vos soins en 2027.
              La réservation de votre place est ouverte dès maintenant pour 15 000 F.
            </p>
            <div className="acts">
              <Link to="/adhesion?type=reservation" className="btn btn-gold">Réserver ma place 2027</Link>
              <Link to="/formules" className="btn btn-line">Comparer les 4 formules</Link>
              <Link to="/reseau" className="btn btn-line">Voir le réseau de soins</Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
