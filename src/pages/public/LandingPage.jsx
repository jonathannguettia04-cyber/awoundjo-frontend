// src/pages/public/LandingPage.jsx
import { useRef, useState } from "react";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";

const WA_NUMBER = "2250171721668";
const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const STEPS = [
  { n: 1, title: "Vous vous inscrivez depuis votre téléphone.", text: "Vos infos, vos bénéficiaires, votre formule. 5 minutes suffisent." },
  { n: 2, title: "On valide vos dossiers sous 24h maximum.", text: "Vous recevez une confirmation par SMS et WhatsApp." },
  { n: 3, title: "Payez par Mobile Money vos frais d'adhésion.", text: "Wave, Orange Money, MTN MoMo ou Moov. Paiement sécurisé." },
  { n: 4, title: "Vous recevez ensuite votre carte mutualiste.", text: "Carte numérique personnalisée, une par bénéficiaire." },
  { n: 5, title: "Vous la présentez pour avoir accès aux soins.", text: "Aucune avance de frais. Prise en charge immédiate." },
];

const BENEFITS = [
  {
    highlight: true,
    icon: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-1 10h-4v4h-4v-4H6v-4h4V5h4v4h4v4z",
    title: "Jusqu'à 80 % de prise en charge",
    text: "Consultations, médicaments, hospitalisation, maternité, dentaire, optique — selon votre formule.",
  },
  {
    icon: "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
    title: "Téléconsultation médicale",
    text: "Un médecin accessible à distance, sans déplacement. Depuis votre téléphone.",
  },
  {
    icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
    title: "Dossier médical à jour",
    text: "Historique de soins et ordonnances accessibles en permanence depuis votre mobile.",
  },
  {
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    title: "Bilan de santé annuel offert",
    text: "Chaque année, un bilan complet offert à tous les comptes actifs. La prévention en action.",
  },
];

const PROOF_STATS = [
  { num: "120+", label: "Établissements de santé" },
  { num: "80 %", label: "De prise en charge" },
  { num: "24h", label: "Activation de votre carte" },
];

const PARTNERS = ["Giepharm", "Mansa-Bank", "CNEPECI", "CEL-CI", "Meditrans", "Sonam-Assurances"];

const FORMULAS = [
  {
    name: "Essentielle",
    price: "10 000",
    desc: "L'accès aux soins de base — consultations, médicaments, hospitalisation. La porte d'entrée vers la protection santé.",
    popular: false,
  },
  {
    name: "Ivoirienne",
    price: "15 000",
    desc: "La formule de référence des familles. Maternité renforcée, couverture élargie, la plus choisie par nos adhérents.",
    popular: true,
  },
  {
    name: "Turquoise",
    price: "35 000",
    desc: "La couverture la plus complète — dentisterie, optique et prestations étendues pour une protection maximale.",
    popular: false,
  },
];

const FAQS = [
  {
    q: "Et si je ne suis jamais malade, j'ai perdu mon argent ?",
    a: "Non. Votre cotisation finance un bilan de santé annuel offert, la téléconsultation, et la tranquillité de savoir que le jour où un imprévu arrive, vous êtes couvert sans chercher l'argent en urgence. La vraie perte, c'est de ne pas être prêt.",
  },
  {
    q: "Quelle est la différence avec la CMU ?",
    a: "La CMU est le régime public de base. Awoundjô est complémentaire : une activation en 24h au lieu de semaines de démarches, une prise en charge jusqu'à 80 %, la téléconsultation, et aucune sélection médicale. Les deux se complètent.",
  },
  {
    q: "Comment je renouvelle ma cotisation chaque mois ?",
    a: "Par Mobile Money — Wave, Orange Money, MTN MoMo ou Moov. Vous recevez un rappel avant l'échéance. Le paiement prend moins d'une minute.",
  },
  {
    q: "Est-ce que mes antécédents médicaux comptent ?",
    a: "Non. Aucune sélection médicale à l'adhésion. Tout le monde est accepté, quels que soient ses antécédents. C'est un principe fondateur d'Awoundjô.",
  },
  {
    q: "Combien de personnes peuvent être couvertes avec une seule adhésion ?",
    a: "Vous pouvez inscrire vos bénéficiaires (conjoint, enfants) lors de l'adhésion. Chaque personne reçoit sa propre carte Mansa personnalisée.",
  },
];

function WaIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function LandingPage() {
  const videoRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setVideoPlaying(true);
    } else {
      video.pause();
      setVideoPlaying(false);
    }
  };

  const scrollToProblem = (e) => {
    e.preventDefault();
    document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      <div className="awj-lp">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sora:wght@400;500;600;700&display=swap');

          .awj-lp {
            --navy: #01417E; --deep: #042A50; --royal: #005FAF; --cyan: #00ADF1;
            --ice: #E4F2FC; --white: #FFFFFF; --muted: #9DC3E6; --grey: #3B5468; --gold: #D4A843;
            font-family: 'Sora', sans-serif; color: var(--deep); background: var(--white);
            -webkit-font-smoothing: antialiased;
          }
          .awj-lp * { box-sizing: border-box; }
          .awj-lp h1, .awj-lp h2, .awj-lp h3 { font-family: 'Playfair Display', serif; margin: 0; }
          .awj-lp section { padding: 80px 24px; }
          .awj-lp .container { max-width: 960px; margin: 0 auto; }

          .awj-lp .btn-wa {
            display: inline-flex; align-items: center; gap: 10px;
            background: var(--cyan); color: var(--deep); font-weight: 700; font-size: 17px;
            padding: 16px 36px; border-radius: 50px; text-decoration: none; border: none; cursor: pointer;
            transition: transform .2s, box-shadow .2s;
            box-shadow: 0 4px 24px rgba(0,173,241,.35);
          }
          .awj-lp .btn-wa:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,173,241,.45); }
          .awj-lp .btn-scroll {
            display: inline-flex; align-items: center; gap: 8px;
            background: transparent; color: var(--white); font-weight: 600; font-size: 15px;
            padding: 14px 30px; border-radius: 50px; text-decoration: none; border: 2px solid rgba(255,255,255,.4);
            transition: border-color .2s;
          }
          .awj-lp .btn-scroll:hover { border-color: var(--cyan); color: var(--cyan); }

          /* HERO */
          .awj-lp .hero {
            position: relative; min-height: 100vh; display: flex; flex-direction: column;
            justify-content: center; align-items: center; text-align: center;
            background: linear-gradient(160deg, var(--deep) 0%, var(--navy) 60%, var(--royal) 100%);
            overflow: hidden; padding: 40px 24px;
          }
          .awj-lp .hero-video {
            position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
            opacity: 0; transition: opacity .8s ease; z-index: 1;
          }
          .awj-lp .hero-video.playing { opacity: .85; }
          .awj-lp .hero-overlay { position: absolute; inset: 0; background: rgba(4,42,80,.55); z-index: 2; transition: background .8s ease; }
          .awj-lp .hero-video.playing ~ .hero-overlay { background: rgba(4,42,80,.75); }
          .awj-lp .hero-content { position: relative; z-index: 3; max-width: 720px; transition: opacity .6s ease; }
          .awj-lp .hero-content.video-playing { opacity: .05; }
          .awj-lp .hero-content.video-paused { opacity: 1; }
          .awj-lp .hero-brand { color: var(--muted); font-size: 13px; font-weight: 600; letter-spacing: 4px; margin-bottom: 4px; }
          .awj-lp .hero-brand-name { color: var(--white); font-size: 22px; font-weight: 700; letter-spacing: 2px; margin-bottom: 40px; }
          .awj-lp .hero h1 { color: var(--white); font-size: clamp(32px,7vw,58px); line-height: 1.15; margin-bottom: 16px; font-weight: 900; }
          .awj-lp .hero h1 span { color: var(--cyan); }
          .awj-lp .hero .sub { color: var(--muted); font-size: clamp(16px,3vw,20px); margin-bottom: 40px; line-height: 1.5; }
          .awj-lp .hero-actions { display: flex; flex-direction: column; gap: 16px; align-items: center; }
          .awj-lp .hero-play-btn {
            position: relative; z-index: 4; width: 72px; height: 72px; border-radius: 50%;
            background: rgba(0,173,241,.9); border: none; cursor: pointer; margin-bottom: 20px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 0 0 rgba(0,173,241,.5);
            animation: awj-lp-pulse-ring 2s infinite;
            transition: transform .2s;
          }
          .awj-lp .hero-play-btn:hover { transform: scale(1.08); }
          .awj-lp .hero-play-btn svg { width: 28px; height: 28px; fill: var(--white); margin-left: 4px; }
          .awj-lp .hero-play-btn.is-playing svg { margin-left: 0; }
          @keyframes awj-lp-pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(0,173,241,.5); }
            70% { box-shadow: 0 0 0 20px rgba(0,173,241,0); }
            100% { box-shadow: 0 0 0 0 rgba(0,173,241,0); }
          }

          .awj-lp .section-kicker { font-size: 13px; font-weight: 700; letter-spacing: 5px; color: var(--cyan); text-transform: uppercase; margin-bottom: 12px; }
          .awj-lp .section-title { font-size: clamp(28px,5vw,42px); line-height: 1.2; margin-bottom: 20px; font-weight: 900; }
          .awj-lp .section-sub { font-size: 17px; color: var(--grey); line-height: 1.6; margin-bottom: 40px; }

          /* PROBLÈME */
          .awj-lp .problem { background: linear-gradient(160deg, var(--deep), var(--navy)); text-align: center; color: var(--white); }
          .awj-lp .problem .section-title { color: var(--white); }
          .awj-lp .problem .stat { font-family: 'Playfair Display', serif; font-size: clamp(56px,12vw,96px); font-weight: 900; color: var(--cyan); margin: 32px 0 16px; }
          .awj-lp .problem .stat-label { font-size: 19px; color: var(--muted); max-width: 500px; margin: 0 auto 40px; line-height: 1.5; }
          .awj-lp .problem .bridge { background: rgba(0,173,241,.12); border: 1px solid rgba(0,173,241,.25); border-radius: 16px; padding: 28px 32px; display: inline-block; margin-top: 16px; }
          .awj-lp .problem .bridge p { font-size: 18px; font-weight: 600; color: var(--white); }
          .awj-lp .problem .bridge span { color: var(--cyan); }

          /* ÉTAPES */
          .awj-lp .steps { background: var(--white); }
          .awj-lp .steps-grid { display: flex; flex-direction: column; gap: 0; position: relative; }
          .awj-lp .steps-grid::before {
            content: ''; position: absolute; left: 28px; top: 36px; bottom: 36px; width: 3px;
            background: linear-gradient(to bottom, var(--cyan), var(--navy)); border-radius: 2px;
          }
          .awj-lp .step { display: flex; gap: 24px; align-items: flex-start; padding: 24px 0; position: relative; }
          .awj-lp .step-num {
            width: 56px; height: 56px; min-width: 56px; border-radius: 50%;
            background: var(--navy); color: var(--white); font-family: 'Playfair Display', serif;
            font-size: 22px; font-weight: 900; display: flex; align-items: center; justify-content: center;
            position: relative; z-index: 2;
          }
          .awj-lp .step:last-child .step-num { background: var(--cyan); color: var(--deep); }
          .awj-lp .step-text h3 { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; color: var(--deep); margin-bottom: 4px; }
          .awj-lp .step-text p { font-size: 14px; color: var(--grey); line-height: 1.5; margin: 0; }

          /* BÉNÉFICES */
          .awj-lp .benefits { background: var(--ice); }
          .awj-lp .benefits-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
          @media (min-width: 640px) { .awj-lp .benefits-grid { grid-template-columns: 1fr 1fr; } }
          .awj-lp .benefit-card { background: var(--white); border-radius: 16px; padding: 32px 28px; box-shadow: 0 2px 16px rgba(1,65,126,.08); border: 1px solid rgba(0,173,241,.12); }
          .awj-lp .benefit-icon { width: 52px; height: 52px; border-radius: 14px; background: var(--navy); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
          .awj-lp .benefit-icon svg { width: 26px; height: 26px; fill: var(--white); }
          .awj-lp .benefit-card h3 { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 8px; color: var(--deep); }
          .awj-lp .benefit-card p { font-size: 14px; color: var(--grey); line-height: 1.5; margin: 0; }
          .awj-lp .benefit-highlight .benefit-icon { background: var(--cyan); }
          .awj-lp .benefit-highlight .benefit-icon svg { fill: var(--deep); }

          /* PREUVE SOCIALE */
          .awj-lp .proof { background: var(--white); text-align: center; }
          .awj-lp .proof-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 40px; }
          @media (max-width: 500px) { .awj-lp .proof-stats { grid-template-columns: 1fr; } }
          .awj-lp .proof-stat { background: linear-gradient(160deg, var(--deep), var(--navy)); border-radius: 16px; padding: 28px 20px; color: var(--white); }
          .awj-lp .proof-stat .num { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; color: var(--cyan); }
          .awj-lp .proof-stat .label { font-size: 13px; color: var(--muted); margin-top: 6px; }
          .awj-lp .proof-partners { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 32px; }
          .awj-lp .proof-partner { background: var(--ice); border-radius: 10px; padding: 12px 24px; font-size: 14px; font-weight: 600; color: var(--navy); }

          /* FORMULES */
          .awj-lp .formulas { background: var(--ice); }
          .awj-lp .formulas-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
          @media (min-width: 720px) { .awj-lp .formulas-grid { grid-template-columns: 1fr 1fr 1fr; } }
          .awj-lp .formula-card {
            background: var(--white); border-radius: 20px; padding: 36px 28px; text-align: center;
            box-shadow: 0 2px 16px rgba(1,65,126,.08); border: 2px solid transparent;
            position: relative; display: flex; flex-direction: column;
          }
          .awj-lp .formula-card.popular { background: var(--deep); color: var(--white); border-color: var(--cyan); box-shadow: 0 8px 40px rgba(0,173,241,.25); transform: scale(1.03); }
          .awj-lp .formula-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--cyan); color: var(--deep); font-size: 12px; font-weight: 700; padding: 6px 20px; border-radius: 20px; letter-spacing: 2px; }
          .awj-lp .formula-name { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; margin: 20px 0 8px; }
          .awj-lp .formula-price { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 900; color: var(--cyan); }
          .awj-lp .formula-price small { font-size: 14px; font-weight: 400; color: var(--grey); }
          .awj-lp .popular .formula-price small { color: var(--muted); }
          .awj-lp .formula-desc { font-size: 14px; color: var(--grey); margin: 16px 0 24px; line-height: 1.5; flex-grow: 1; }
          .awj-lp .popular .formula-desc { color: var(--muted); }
          .awj-lp .formula-entry { font-size: 13px; color: var(--grey); margin-bottom: 20px; }
          .awj-lp .popular .formula-entry { color: var(--muted); }
          .awj-lp .formula-card .btn-wa { width: 100%; justify-content: center; font-size: 15px; padding: 14px 24px; }
          .awj-lp .popular .btn-wa { background: var(--cyan); }

          /* FAQ */
          .awj-lp .faq { background: var(--white); }
          .awj-lp .faq-item { border-bottom: 1px solid var(--ice); padding: 24px 0; cursor: pointer; }
          .awj-lp .faq-q { display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 17px; font-weight: 600; color: var(--deep); background: none; border: none; width: 100%; text-align: left; padding: 0; font-family: inherit; cursor: pointer; }
          .awj-lp .faq-q-mark { font-size: 28px; font-weight: 300; color: var(--cyan); transition: transform .3s; line-height: 1; }
          .awj-lp .faq-a { max-height: 0; overflow: hidden; transition: max-height .4s ease, padding .4s ease; font-size: 15px; color: var(--grey); line-height: 1.6; }
          .awj-lp .faq-item.open .faq-a { max-height: 300px; padding-top: 16px; }

          /* CTA FINAL */
          .awj-lp .cta-final { background: linear-gradient(160deg, var(--deep), var(--navy)); text-align: center; color: var(--white); padding: 100px 24px; }
          .awj-lp .cta-final .section-title { color: var(--white); margin-bottom: 12px; }
          .awj-lp .cta-final .tagline { color: var(--cyan); font-size: 18px; font-weight: 600; letter-spacing: 3px; margin-bottom: 40px; }
          .awj-lp .cta-final .contact-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 32px; margin-top: 40px; font-size: 15px; color: var(--muted); }
          .awj-lp .cta-final .contact-row a { color: var(--white); text-decoration: none; }
          .awj-lp .cta-final .contact-row a:hover { color: var(--cyan); }

          @media (max-width: 640px) {
            .awj-lp section { padding: 60px 20px; }
            .awj-lp .hero { padding: 32px 20px; }
            .awj-lp .proof-stats { grid-template-columns: 1fr; }
            .awj-lp .formulas-grid { grid-template-columns: 1fr; }
            .awj-lp .formula-card.popular { transform: none; }
          }
        `}</style>

        {/* ===== HERO ===== */}
        <section className="hero" id="hero">
          <video ref={videoRef} className={`hero-video ${videoPlaying ? "playing" : ""}`} playsInline preload="metadata" onEnded={() => setVideoPlaying(false)}>
            {/* <source src="votre-video.mp4" type="video/mp4" /> */}
          </video>
          <div className="hero-overlay" />

          <div className={`hero-content ${videoPlaying ? "video-playing" : "video-paused"}`}>
            <div className="hero-brand">MUTUELLE SANTÉ</div>
            <div className="hero-brand-name">AWOUNDJÔ</div>

            <button className={`hero-play-btn ${videoPlaying ? "is-playing" : ""}`} onClick={togglePlay} aria-label={videoPlaying ? "Mettre en pause" : "Lancer la vidéo"}>
              {videoPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19" /></svg>
              )}
            </button>

            <h1>Votre mutuelle santé<br /><span>activée en 24h.</span></h1>
            <p className="sub">Jusqu'à 80 % de vos soins médicaux pris en charge.<br />Sans sélection médicale. 100% en ligne.</p>

            <div className="hero-actions">
              <a href={waLink("Bonjour, je souhaite souscrire à Awoundjô.")} className="btn-wa" target="_blank" rel="noopener noreferrer">
                <WaIcon />
                Souscrire maintenant
              </a>
              <a href="#problem" className="btn-scroll" onClick={scrollToProblem}>Vous hésitez encore ? ↓</a>
            </div>
          </div>
        </section>

        {/* ===== PROBLÈME ===== */}
        <section className="problem" id="problem">
          <div className="container">
            <p className="section-kicker">Le saviez-vous ?</p>
            <div className="stat">– 20 %</div>
            <p className="stat-label">Moins de 20 % des Ivoiriens disposent d'une couverture santé. Quand l'urgence arrive, il est déjà trop tard.</p>
            <div className="bridge">
              <p>Comment éviter cela ?<br /><span>5 étapes simples et faciles.</span></p>
            </div>
          </div>
        </section>

        {/* ===== 5 ÉTAPES ===== */}
        <section className="steps" id="steps">
          <div className="container">
            <p className="section-kicker">Comment ça marche</p>
            <h2 className="section-title">Votre mutuelle en 5 étapes</h2>
            <p className="section-sub">Aucun déplacement. Aucune paperasse. Tout se fait depuis votre téléphone.</p>

            <div className="steps-grid">
              {STEPS.map((s) => (
                <div className="step" key={s.n}>
                  <div className="step-num">{s.n}</div>
                  <div className="step-text">
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 48 }}>
              <a href={waLink("Bonjour, je souhaite souscrire maintenant.")} className="btn-wa" target="_blank" rel="noopener noreferrer">
                <WaIcon />
                Souscrire maintenant
              </a>
            </div>
          </div>
        </section>

        {/* ===== BÉNÉFICES ===== */}
        <section className="benefits" id="benefits">
          <div className="container">
            <p className="section-kicker">Ce que vous obtenez</p>
            <h2 className="section-title">Bien plus qu'une assurance.</h2>
            <p className="section-sub">Votre carte Awoundjô vous donne accès à un écosystème de soins complet.</p>

            <div className="benefits-grid">
              {BENEFITS.map((b) => (
                <div className={`benefit-card ${b.highlight ? "benefit-highlight" : ""}`} key={b.title}>
                  <div className="benefit-icon"><svg viewBox="0 0 24 24"><path d={b.icon} /></svg></div>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 48 }}>
              <a href={waLink("Bonjour, je veux souscrire à Awoundjô.")} className="btn-wa" target="_blank" rel="noopener noreferrer">
                <WaIcon />
                Souscrire Awoundjô
              </a>
            </div>
          </div>
        </section>

        {/* ===== PREUVE SOCIALE ===== */}
        <section className="proof" id="proof">
          <div className="container">
            <p className="section-kicker">Ils nous font confiance</p>
            <h2 className="section-title">Un réseau solide, une mutuelle agréée.</h2>

            <div className="proof-stats">
              {PROOF_STATS.map((s) => (
                <div className="proof-stat" key={s.label}>
                  <div className="num">{s.num}</div>
                  <div className="label">{s.label}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 14, color: "var(--grey)", marginBottom: 8 }}>Mutuelle agréée n° 019-072/MEPS/CAB du 27/08/2019</p>

            <div className="proof-partners">
              {PARTNERS.map((p) => (
                <div className="proof-partner" key={p}>{p}</div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FORMULES ===== */}
        <section className="formulas" id="formulas">
          <div className="container">
            <p className="section-kicker">Nos formules</p>
            <h2 className="section-title">Une couverture pour chaque besoin.</h2>
            <p className="section-sub">Adhésion unique : 15 000 FCFA. Sans sélection médicale.</p>

            <div className="formulas-grid">
              {FORMULAS.map((f) => (
                <div className={`formula-card ${f.popular ? "popular" : ""}`} key={f.name}>
                  {f.popular && <div className="formula-badge">POPULAIRE</div>}
                  <div className="formula-name">{f.name}</div>
                  <div className="formula-price">{f.price}<small> F/mois</small></div>
                  <p className="formula-desc">{f.desc}</p>
                  <p className="formula-entry"><strong>Adhésion :</strong> 15 000 F</p>
                  <a href={waLink(`Bonjour, je veux souscrire à la formule ${f.name}.`)} className="btn-wa" target="_blank" rel="noopener noreferrer">
                    Choisir {f.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="faq" id="faq">
          <div className="container">
            <p className="section-kicker">Questions fréquentes</p>
            <h2 className="section-title">Vous avez des questions ?</h2>

            {FAQS.map((f, i) => (
              <div className={`faq-item ${openFaq === i ? "open" : ""}`} key={f.q}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                  {f.q}
                  <span className="faq-q-mark">{openFaq === i ? "\u2212" : "+"}</span>
                </button>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section className="cta-final" id="cta">
          <div className="container">
            <h2 className="section-title">Tout le monde a droit à la santé.</h2>
            <div className="tagline">VOTRE CARTE. VOTRE SANTÉ. VOTRE DIGNITÉ.</div>

            <a href={waLink("Bonjour, je veux ma carte Awoundjô.")} className="btn-wa" target="_blank" rel="noopener noreferrer" style={{ fontSize: 20, padding: "20px 48px" }}>
              <WaIcon size={26} />
              Obtenir ma carte maintenant
            </a>

            <div className="contact-row">
              <span>📞 <a href="tel:+2250171721668">01 71 72 16 68</a></span>
              <span>🌐 <a href="https://www.mutuelleawoundjo.com" target="_blank" rel="noopener noreferrer">mutuelleawoundjo.com</a></span>
              <span>📧 <a href="mailto:mutuelleawoundjo2018@gmail.com">mutuelleawoundjo2018@gmail.com</a></span>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
