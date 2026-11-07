// src/pages/public/LandingPage.jsx
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { GESTIONNAIRE_PLANS, FORMULE_BASIQUE } from "../../data/constants";

const WA_NUMBER = "2250171721668";
const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
const APK_DOWNLOAD_URL = "https://vkrnqoajmyyyatfdlmbk.supabase.co/storage/v1/object/public/app-releases/app-release.apk";

const RESERVATION_FEE = "15 000";
// Photo d'arrière-plan du haut de page : déposer le fichier dans public/images/hero.jpg
// (sans fichier, le dégradé bleu nuit s'affiche seul).
const HERO_IMAGE = "/images/hero.jpg";
const reservationLink = (slug) =>
  slug ? `/adhesion?type=reservation&formule=${slug.toLowerCase()}` : "/adhesion?type=reservation";

// ── Tracking conversion (Meta Pixel + Google Analytics) ─────────
function trackCTA(fbEvent, gaEvent, params = {}) {
  if (typeof window.fbq === "function") window.fbq("track", fbEvent, params);
  if (typeof window.gtag === "function") window.gtag("event", gaEvent, params);
}

const RESERVATION_STEPS = [
  { title: "Choisissez votre formule", text: "Classic, Aisance, Harmony ou Premium, en solo ou en famille." },
  { title: `Réglez ${RESERVATION_FEE} F par Mobile Money`, text: "Wave, Orange Money, MTN MoMo ou Moov. Votre place est enregistrée dès la confirmation du paiement." },
  { title: "Payez la prime en 4 versements", text: "En 2027, la prime annuelle se règle par versements trimestriels. Le premier correspond à un quart de la prime." },
];

const BENEFITS = [
  { title: "Un large réseau de soins", text: "Cliniques, hôpitaux, pharmacies, laboratoires et cabinets dentaires partout en Côte d'Ivoire." },
  { title: "Téléconsultation médicale", text: "Un médecin à distance, directement depuis votre téléphone, où que vous soyez." },
  { title: "Dossier médical sur mobile", text: "Votre historique de soins toujours accessible. Fini les ordonnances perdues." },
  { title: "Carte mutualiste numérique", text: "Votre carte sur votre téléphone, à présenter pour accéder aux soins." },
];

const PARTNERS = ["Giepharm", "Mansa-Bank", "CNEPECI", "CEL-CI", "Meditrans", "Sonam-Assurances"];

const FAQS = [
  {
    q: "Pourquoi réserver dès maintenant ?",
    a: `Les quatre formules Classic, Aisance, Harmony et Premium entrent en vigueur en 2027. Pour ${RESERVATION_FEE} F, vous réservez votre place dès aujourd'hui. Ce montant est une adhésion de réservation : il ne remplace pas la prime annuelle.`,
  },
  {
    q: "Comment se règle la prime annuelle ?",
    a: "Par Mobile Money (Wave, Orange Money, MTN MoMo ou Moov), en 4 versements trimestriels. Le premier versement correspond à un quart de la prime annuelle.",
  },
  {
    q: "Qu'est-ce que la Formule Basique ?",
    a: "Une formule proposée par la mutuelle dès le 1er décembre : 50 % de réduction en pharmacie et 50 % de remise en clinique et à l'hôpital, sur le réseau de soins Awoundjô. Paiement unique de 35 000 F + 6 000 F d'adhésion, pour une personne. Les réductions s'activent dès que 3 personnes que vous avez parrainées ont payé leurs 35 000 F.",
  },
  {
    q: "Quelle est la différence avec la CMU ?",
    a: "La CMU est le régime public de base. Awoundjô est complémentaire : prise en charge jusqu'à 100 % selon la formule, sur un large réseau de soins partenaire. Les deux se complètent.",
  },
  {
    q: "Est-ce que mes antécédents médicaux comptent ?",
    a: "Aucune sélection médicale à l'adhésion : tout le monde est accepté. Une surprime s'applique en cas de pathologie déclarée ou à partir de 55 ans, mais personne n'est refusé.",
  },
  {
    q: "Combien de personnes puis-je couvrir ?",
    a: "Chaque formule existe en version Solo et en version Famille. Vous pouvez ajouter des enfants supplémentaires ou à charge, aux tarifs indiqués dans le tableau des formules.",
  },
  {
    q: "Je dirige une entreprise, quel tarif s'applique ?",
    a: "Une grille entreprise s'applique à partir de 10 familles ou 30 solos. Faites une demande de devis et nous revenons vers vous.",
  },
];

function WaIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Vidéo de présentation : format vertical, chargée seulement quand elle approche de l'écran
const VIDEO_SRC = "/videos/awoundjo-presentation.mp4";
const VIDEO_POSTER = "/videos/awoundjo-presentation.jpg";

function VideoPitch() {
  const boxRef = useRef(null);
  const vidRef = useRef(null);
  const [load, setLoad] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    if (!("IntersectionObserver" in window)) { setLoad(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      const v = vidRef.current;
      if (e.isIntersecting) { setLoad(true); if (v && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {}); }
      else if (v) v.pause();
    }, { rootMargin: "200px 0px", threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (failed) return null;
  return (
    <section className="sec sec-white vp" id="presentation">
      <div className="wrap vp-grid">
        <div className="vp-frame" ref={boxRef}>
          <video
            ref={vidRef}
            src={load ? VIDEO_SRC : undefined}
            poster={VIDEO_POSTER}
            muted={muted}
            loop playsInline preload="none"
            controls={false}
            aria-label="Présentation de la mutuelle Awoundjô"
            onError={() => setFailed(true)}
          />
          <button type="button" className="vp-sound" onClick={() => { setMuted(m => !m); vidRef.current?.play().catch(() => {}); }}>
            {muted ? "Activer le son" : "Couper le son"}
          </button>
        </div>
        <div className="vp-text">
          <h2>Une facture de consultation ne devrait pas décider de vos soins</h2>
          <p className="lede">Avec Awoundjô, vous cotisez à l'avance et la mutuelle prend en charge une part de vos soins. 14 secondes pour comprendre.</p>
          <div className="vp-acts">
            <Link to="/adhesion?type=reservation" className="btn btn-gold">Réserver ma place 2027</Link>
            <Link to="/fonctionnement" className="btn btn-line">Comment ça marche</Link>
          </div>
        </div>
      </div>
      <style>{`
        .awj-lp .vp-grid { display: grid; grid-template-columns: minmax(240px, 300px) 1fr; gap: 56px; align-items: center; }
        .awj-lp .vp-frame { position: relative; aspect-ratio: 9 / 16; border-radius: 28px; overflow: hidden; background: var(--ink); box-shadow: 0 0 0 8px #0B2A4A, 0 24px 48px rgba(6,34,63,.28); }
        .awj-lp .vp-frame video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .awj-lp .vp-sound { position: absolute; left: 12px; right: 12px; bottom: 12px; border: 0; border-radius: 10px; padding: 10px; font: 700 14px 'Figtree', sans-serif; background: rgba(6,34,63,.82); color: #fff; cursor: pointer; }
        .awj-lp .vp-sound:focus-visible { outline: 3px solid var(--cyan); outline-offset: 2px; }
        .awj-lp .vp-text h2 { max-width: 20ch; }
        .awj-lp .vp-acts { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; }
        @media (max-width: 720px) {
          .awj-lp .vp-grid { grid-template-columns: 1fr; gap: 32px; justify-items: center; }
          .awj-lp .vp-frame { width: min(280px, 100%); }
          .awj-lp .vp-text { justify-self: stretch; }
        }
      `}</style>
    </section>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const rootRef = useRef(null);
  const heroRef = useRef(null);

  // ── Mouvement au défilement ─────────────────────────────────
  // 1) apparition progressive des blocs (IntersectionObserver)
  // 2) parallaxe douce du haut de page  3) barre de progression
  // Désactivé si l'utilisateur demande moins d'animations.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    root.classList.add("js-motion");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    root.querySelectorAll(".rv, .rv-line").forEach((el) => io.observe(el));

    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty("--p", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
      if (heroRef.current && y < window.innerHeight * 1.3) {
        heroRef.current.style.setProperty("--hy", `${(y * 0.22).toFixed(1)}px`);
      }
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      root.classList.remove("js-motion");
    };
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const premium = GESTIONNAIRE_PLANS.find((p) => p.slug === "PREMIUM");

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      <div className="awj-lp" ref={rootRef}>
        <div className="progress" aria-hidden="true" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap');

          .awj-lp {
            --ink: #06223F; --navy: #01417E; --royal: #0A5DB0; --cyan: #00ADF1;
            --paper: #F3F7FB; --white: #FFFFFF; --line: #D8E3EE; --grey: #46607A;
            --gold: #D4A843; --orange: #F77F00; --green: #009E60;
            font-family: 'Figtree', system-ui, sans-serif; color: var(--ink); background: var(--paper);
            -webkit-font-smoothing: antialiased; line-height: 1.55; overflow-x: clip;
          }
          .awj-lp * { box-sizing: border-box; }
          .awj-lp h1, .awj-lp h2, .awj-lp h3, .awj-lp h4 { font-family: 'Bricolage Grotesque', 'Figtree', sans-serif; margin: 0; letter-spacing: -0.02em; }
          .awj-lp p { margin: 0; }
          .awj-lp a:focus-visible, .awj-lp button:focus-visible { outline: 3px solid var(--cyan); outline-offset: 3px; }
          .awj-lp .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
          .awj-lp .sec { padding: 88px 0; }
          .awj-lp .sec-white { background: var(--white); }
          .awj-lp .h2 { font-size: clamp(28px, 4.4vw, 44px); line-height: 1.1; font-weight: 800; max-width: 22ch; }
          .awj-lp .lede { font-size: 18px; color: var(--grey); max-width: 58ch; margin-top: 16px; }

          /* Boutons */
          .awj-lp .btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 10px;
            font-family: 'Figtree', sans-serif; font-weight: 700; font-size: 16px; text-decoration: none; cursor: pointer;
            padding: 15px 28px; border-radius: 12px; border: 2px solid transparent; transition: transform .15s, box-shadow .15s, background .15s;
          }
          .awj-lp .btn:hover { transform: translateY(-2px); }
          .awj-lp .btn-gold { background: var(--gold); color: var(--ink); box-shadow: 0 6px 20px rgba(212,168,67,.35); }
          .awj-lp .btn-gold:hover { box-shadow: 0 10px 28px rgba(212,168,67,.5); }
          .awj-lp .btn-ghost { background: transparent; color: var(--white); border-color: rgba(255,255,255,.35); }
          .awj-lp .btn-ghost:hover { border-color: var(--white); }
          .awj-lp .btn-navy { background: var(--navy); color: var(--white); }
          .awj-lp .btn-navy:hover { background: var(--royal); }
          .awj-lp .btn-line { background: transparent; color: var(--navy); border-color: var(--navy); }
          .awj-lp .btn-line:hover { background: var(--navy); color: var(--white); }
          .awj-lp .btn-sm { padding: 11px 20px; font-size: 14px; }

          /* HERO */
          .awj-lp .hero {
            background-color: var(--ink); color: var(--white); padding: 128px 0 96px; overflow: hidden;
            background-image: linear-gradient(105deg, rgba(6,34,63,.95) 0%, rgba(6,34,63,.84) 45%, rgba(6,34,63,.5) 100%), url(${HERO_IMAGE});
            background-size: cover; background-position: center calc(50% + var(--hy, 0px)); background-repeat: no-repeat;
          }
          .awj-lp .hero-pill { display: inline-block; margin-bottom: 22px; font-size: 14px; font-weight: 700; padding: 7px 16px; border-radius: 99px; background: rgba(212,168,67,.18); color: #F0D58A; border: 1px solid rgba(212,168,67,.45); }
          .awj-lp .hero-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 56px; align-items: center; }
          .awj-lp .hero h1 { font-size: clamp(38px, 6.2vw, 68px); line-height: 1.02; font-weight: 800; }
          .awj-lp .hero .sub { margin-top: 24px; font-size: 19px; color: #BFD3E6; max-width: 46ch; }
          .awj-lp .hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 36px; }
          .awj-lp .hero-note { margin-top: 24px; font-size: 14px; color: #8FB0CE; }
          .awj-lp .hero-note a { color: var(--white); text-underline-offset: 3px; }

          /* La carte (élément signature) */
          .awj-lp .cards { position: relative; height: 340px; transform: translateY(calc(var(--hy, 0px) * -0.4)); }
          .awj-lp .mcard {
            position: absolute; width: min(360px, 88%); aspect-ratio: 1.586; border-radius: 22px; padding: 22px 24px;
            display: flex; flex-direction: column; justify-content: space-between; color: var(--white);
            box-shadow: 0 30px 60px rgba(0,0,0,.45);
          }
          .awj-lp .mcard-back { background: linear-gradient(140deg, #14395E, #0B2A49); right: 0; top: 0; transform: rotate(7deg); opacity: .9; }
          .awj-lp .mcard-front {
            background: linear-gradient(140deg, var(--navy) 0%, var(--royal) 55%, var(--cyan) 130%);
            left: 0; bottom: 0; transform: rotate(-5deg); overflow: hidden;
            animation: awj-card-in .9s cubic-bezier(.2,.8,.2,1) both;
          }
          @keyframes awj-card-in { from { opacity: 0; transform: translateY(28px) rotate(-9deg); } to { opacity: 1; transform: translateY(0) rotate(-5deg); } }
          .awj-lp .mcard-top { display: flex; justify-content: space-between; align-items: flex-start; }
          .awj-lp .mcard-brand { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 20px; line-height: 1; }
          .awj-lp .mcard-brand small { display: block; font-family: 'Figtree', sans-serif; font-weight: 500; font-size: 11px; opacity: .8; margin-top: 4px; letter-spacing: 0; }
          .awj-lp .mcard-chip { width: 42px; height: 32px; border-radius: 7px; background: linear-gradient(135deg, #F0D58A, var(--gold)); }
          .awj-lp .mcard-name { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 18px; letter-spacing: 1px; }
          .awj-lp .mcard-meta { font-size: 11px; opacity: .8; margin-top: 2px; }
          .awj-lp .mcard-flag { position: absolute; left: 0; right: 0; bottom: 0; height: 7px; display: flex; }
          .awj-lp .mcard-flag i { flex: 1; display: block; }
          .awj-lp .cards-caption { position: absolute; left: 0; bottom: -34px; font-size: 12px; color: #6F93B5; }

          /* Bandeau chiffres */
          .awj-lp .facts { background: var(--navy); color: var(--white); padding: 28px 0; }
          .awj-lp .facts-row { display: flex; flex-wrap: wrap; gap: 20px 56px; align-items: baseline; }
          .awj-lp .fact b { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: 800; margin-right: 10px; }
          .awj-lp .fact span { color: #B7D3EC; font-size: 15px; }

          /* Deux parcours */
          .awj-lp .paths { display: grid; grid-template-columns: 1.25fr 1fr; gap: 20px; margin-top: 44px; }
          .awj-lp .path { border-radius: 24px; padding: 40px 36px; display: flex; flex-direction: column; }
          .awj-lp .path-main { background: var(--navy); color: var(--white); }
          .awj-lp .path-main h3 { font-size: 30px; font-weight: 800; line-height: 1.1; }
          .awj-lp .path-main .price { font-family: 'Bricolage Grotesque', sans-serif; font-size: 56px; font-weight: 800; color: var(--gold); line-height: 1; margin: 22px 0 6px; }
          .awj-lp .path-main .price small { font-size: 20px; font-weight: 700; color: #F0D58A; }
          .awj-lp .path-main p { color: #C6DBEE; }
          .awj-lp .path-side { background: var(--white); border: 1px solid var(--line); }
          .awj-lp .path-side h3 { font-size: 26px; font-weight: 800; }
          .awj-lp .path-side ul { list-style: none; padding: 0; margin: 18px 0 26px; display: grid; gap: 10px; }
          .awj-lp .path-side li { padding-left: 22px; position: relative; color: var(--grey); }
          .awj-lp .path-side li::before { content: ""; position: absolute; left: 0; top: .55em; width: 10px; height: 10px; border-radius: 3px; background: var(--green); }
          .awj-lp .path-tag { align-self: flex-start; font-size: 13px; font-weight: 700; padding: 5px 12px; border-radius: 99px; margin-bottom: 18px; }
          .awj-lp .path-main .path-tag { background: rgba(212,168,67,.18); color: #F0D58A; }
          .awj-lp .path-side .path-tag { background: #E5F6EE; color: #00693F; }
          .awj-lp .path .btn { margin-top: auto; align-self: flex-start; }

          /* Étapes de réservation (vraie séquence) */
          .awj-lp .rsteps { position: relative; margin-top: 44px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 2px solid var(--line); }
          .awj-lp .rsteps::before { content: ""; position: absolute; top: -2px; left: 0; width: 100%; height: 2px; background: var(--ink); transform-origin: 0 50%; transition: transform 1.3s cubic-bezier(.2,.7,.2,1); }
          .awj-lp.js-motion .rsteps:not(.is-in)::before { transform: scaleX(0); }
          .awj-lp .rstep { padding: 26px 28px 0 0; }
          .awj-lp .rstep + .rstep { padding-left: 28px; border-left: 1px solid var(--line); }
          .awj-lp .rstep-n { font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 800; color: var(--navy); }
          .awj-lp .rstep h3 { font-size: 21px; font-weight: 700; margin: 8px 0 8px; }
          .awj-lp .rstep p { color: var(--grey); font-size: 15px; }

          /* Tableau des formules */
          .awj-lp .ftable { margin-top: 44px; border-radius: 22px; overflow: hidden; border: 1px solid var(--line); background: var(--white); }
          .awj-lp .frow { display: grid; grid-template-columns: 1.4fr 1fr 1fr auto; gap: 16px 24px; align-items: center; padding: 24px 28px; border-bottom: 1px solid var(--line); }
          .awj-lp .frow:last-child { border-bottom: none; }
          .awj-lp .frow-head { background: var(--paper); padding-top: 14px; padding-bottom: 14px; font-size: 13px; font-weight: 700; color: var(--grey); }
          .awj-lp .fname { font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; font-weight: 800; line-height: 1; }
          .awj-lp .fcov { display: inline-block; margin-top: 8px; font-size: 13px; font-weight: 700; padding: 3px 10px; border-radius: 99px; background: #E4F2FC; color: var(--navy); }
          .awj-lp .fchild { display: block; margin-top: 6px; font-size: 13px; color: var(--grey); }
          .awj-lp .fprice { font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; font-weight: 700; }
          .awj-lp .fprice small { font-family: 'Figtree', sans-serif; font-size: 13px; font-weight: 500; color: var(--grey); margin-left: 4px; }
          .awj-lp .frow-top { background: var(--ink); color: var(--white); }
          .awj-lp .frow-top .fcov { background: var(--gold); color: var(--ink); }
          .awj-lp .frow-top .fchild, .awj-lp .frow-top .fprice small { color: #A9C3DC; }
          .awj-lp .frow-top .btn-line { color: var(--white); border-color: rgba(255,255,255,.5); }
          .awj-lp .frow-top .btn-line:hover { background: var(--white); color: var(--ink); }
          .awj-lp .fnote { margin-top: 18px; font-size: 14px; color: var(--grey); max-width: 80ch; }

          /* Avantages */
          .awj-lp .benefits { margin-top: 44px; display: grid; grid-template-columns: 1fr 1fr; gap: 0 56px; }
          .awj-lp .benefit { padding: 24px 0; border-top: 1px solid var(--line); }
          .awj-lp .benefit h3 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
          .awj-lp .benefit p { color: var(--grey); font-size: 15px; }

          /* Confiance */
          .awj-lp .trust { background: var(--white); padding: 56px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
          .awj-lp .trust-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px 48px; }
          .awj-lp .trust-agree { font-size: 15px; color: var(--grey); max-width: 38ch; }
          .awj-lp .trust-agree b { color: var(--ink); }
          .awj-lp .partners { display: flex; flex-wrap: wrap; gap: 10px 28px; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 18px; color: var(--navy); }

          /* FAQ */
          .awj-lp .faq-list { margin-top: 36px; max-width: 760px; }
          .awj-lp .faq-item { border-bottom: 1px solid var(--line); }
          .awj-lp .faq-q { display: flex; justify-content: space-between; align-items: center; gap: 16px; width: 100%; text-align: left; background: none; border: none; padding: 22px 0; font-family: 'Figtree', sans-serif; font-size: 18px; font-weight: 600; color: var(--ink); cursor: pointer; }
          .awj-lp .faq-mark { font-size: 26px; color: var(--navy); line-height: 1; flex-shrink: 0; }
          .awj-lp .faq-a { max-height: 0; overflow: hidden; transition: max-height .3s ease; color: var(--grey); font-size: 16px; }
          .awj-lp .faq-item.open .faq-a { max-height: 360px; padding-bottom: 22px; }

          /* CTA final */
          .awj-lp .final { background: var(--navy); color: var(--white); padding: 96px 0; }
          .awj-lp .final h2 { font-size: clamp(30px, 5vw, 52px); font-weight: 800; line-height: 1.05; max-width: 20ch; }
          .awj-lp .final p.lede { color: #C6DBEE; }
          .awj-lp .final-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 32px; }
          .awj-lp .btn-wa { background: #25D366; color: #06331A; }
          .awj-lp .contact-row { display: flex; flex-wrap: wrap; gap: 14px 40px; margin-top: 48px; padding-top: 28px; border-top: 1px solid rgba(255,255,255,.18); font-size: 15px; color: #B7D3EC; }
          .awj-lp .contact-row a { color: var(--white); text-underline-offset: 3px; }
          .awj-lp .final-corp { margin-top: 22px; font-size: 14px; }
          .awj-lp .final-corp a { color: #8FD6F7; }

          /* Mouvement */
          .awj-lp .progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 1000; background: var(--gold); transform-origin: 0 50%; transform: scaleX(var(--p, 0)); pointer-events: none; }
          .awj-lp.js-motion .rv { opacity: 0; transform: translateY(34px); transition: opacity .85s cubic-bezier(.2,.7,.2,1) var(--d, 0s), transform .85s cubic-bezier(.2,.7,.2,1) var(--d, 0s); will-change: opacity, transform; }
          .awj-lp.js-motion .rv.rv-l { transform: translateX(-56px); }
          .awj-lp.js-motion .rv.rv-r { transform: translateX(56px); }
          .awj-lp.js-motion .rv.is-in { opacity: 1; transform: none; }
          @keyframes awj-rise { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: no-preference) {
            .awj-lp .hero-seq > * { animation: awj-rise .9s cubic-bezier(.2,.7,.2,1) both; }
            .awj-lp .hero-seq > :nth-child(1) { animation-delay: .05s; }
            .awj-lp .hero-seq > :nth-child(2) { animation-delay: .17s; }
            .awj-lp .hero-seq > :nth-child(3) { animation-delay: .3s; }
            .awj-lp .hero-seq > :nth-child(4) { animation-delay: .42s; }
            .awj-lp .hero-seq > :nth-child(5) { animation-delay: .54s; }
          }

          /* Responsive */
          @media (max-width: 900px) {
            .awj-lp .hero-grid { grid-template-columns: 1fr; gap: 64px; }
            .awj-lp .cards { height: 300px; max-width: 420px; }
            .awj-lp .paths { grid-template-columns: 1fr; }
            .awj-lp .benefits { grid-template-columns: 1fr; }
          }
          @media (max-width: 720px) {
            .awj-lp .sec { padding: 64px 0; }
            .awj-lp .hero { padding: 104px 0 72px; }
            .awj-lp .rsteps { grid-template-columns: 1fr; }
            .awj-lp .rstep, .awj-lp .rstep + .rstep { padding: 22px 0; border-left: none; border-bottom: 1px solid var(--line); }
            .awj-lp .frow { grid-template-columns: 1fr 1fr; padding: 22px 20px; }
            .awj-lp .frow > :first-child, .awj-lp .frow > .btn { grid-column: 1 / -1; }
            .awj-lp .frow > .btn { width: 100%; }
            .awj-lp .frow-head { display: none; }
            .awj-lp .path { padding: 32px 24px; }
            .awj-lp .hero-actions .btn { width: 100%; }
          }
          @media (prefers-reduced-motion: reduce) {
            .awj-lp .mcard-front { animation: none; }
            .awj-lp .btn, .awj-lp .faq-a { transition: none; }
            .awj-lp .progress { display: none; }
          }
        `}</style>

        {/* ===== HERO ===== */}
        <header className="hero" id="hero" ref={heroRef}>
          <div className="wrap hero-grid">
            <div className="hero-seq">
              <span className="hero-pill">Réservations 2027 ouvertes</span>
              <h1>La santé ne doit pas ruiner votre budget.</h1>
              <p className="sub">
                Protégez-vous et votre famille sur un large réseau de soins, avec jusqu'à 100 % de prise en charge.
                Réservez votre formule 2027 dès aujourd'hui pour {RESERVATION_FEE} F, par Mobile Money.
              </p>
              <div className="hero-actions">
                <Link
                  to={reservationLink()}
                  className="btn btn-gold"
                  onClick={() => trackCTA("InitiateCheckout", "begin_checkout", { content_name: "Réservation 2027 — hero" })}
                >
                  Réserver ma place pour {RESERVATION_FEE} F
                </Link>
                <a href="#formulas" className="btn btn-ghost" onClick={scrollTo("formulas")}>
                  Comparer les formules
                </a>
              </div>
              <p className="hero-note">
                La Formule Basique ouvre dès le 1er décembre.{" "}
                <a href="#paths" onClick={scrollTo("paths")}>Voir les deux parcours</a>
              </p>
            </div>

            <div className="cards" aria-hidden="true">
              <div className="mcard mcard-back">
                <div className="mcard-top">
                  <div className="mcard-brand">Awoundjô<small>Formule Basique</small></div>
                </div>
                <div className="mcard-meta">Réduction 50 % pharmacies, cliniques, hôpitaux</div>
              </div>
              <div className="mcard mcard-front">
                <div className="mcard-top">
                  <div className="mcard-brand">Awoundjô<small>Mutuelle santé</small></div>
                  <div className="mcard-chip" />
                </div>
                <div>
                  <div className="mcard-name">NOM PRÉNOM</div>
                  <div className="mcard-meta">Carte mutualiste numérique</div>
                </div>
                <div className="mcard-flag"><i style={{ background: "var(--orange)" }} /><i style={{ background: "#fff" }} /><i style={{ background: "var(--green)" }} /></div>
              </div>
              <div className="cards-caption">Illustration de la carte mutualiste</div>
            </div>
          </div>
        </header>

        {/* ===== CHIFFRES ===== */}
        <div className="facts">
          <div className="wrap facts-row">
            <div className="fact rv"><b>1 500+</b><span>prestataires de santé partenaires</span></div>
            <div className="fact rv" style={{ "--d": ".12s" }}><b>Jusqu'à 100 %</b><span>de prise en charge, formule Premium</span></div>
            <div className="fact rv" style={{ "--d": ".24s" }}><b>4 opérateurs</b><span>Wave, Orange Money, MTN MoMo, Moov</span></div>
          </div>
        </div>

        <VideoPitch />

        {/* ===== DEUX PARCOURS ===== */}
        <section className="sec" id="paths">
          <div className="wrap">
            <h2 className="h2 rv">Deux façons de vous protéger</h2>
            <p className="lede rv" style={{ "--d": ".1s" }}>
              Moins de 20 % des Ivoiriens disposent d'une couverture santé. Choisissez le parcours qui vous convient.
            </p>

            <div className="paths">
              <article className="path path-main rv rv-l">
                <span className="path-tag">Réservation ouverte</span>
                <h3>Les 4 formules 2027</h3>
                <p>Classic, Aisance, Harmony et Premium, de 80 % à 100 % de couverture en Côte d'Ivoire.</p>
                <div className="price">{RESERVATION_FEE} <small>F</small></div>
                <p style={{ marginBottom: 28 }}>
                  d'adhésion de réservation, payables maintenant. Ce montant ne constitue pas le paiement de la prime annuelle.
                </p>
                <Link
                  to={reservationLink()}
                  className="btn btn-gold"
                  onClick={() => trackCTA("InitiateCheckout", "begin_checkout", { content_name: "Réservation 2027 — parcours" })}
                >
                  Réserver ma place
                </Link>
              </article>

              <article className="path path-side rv rv-r" style={{ "--d": ".15s" }}>
                <span className="path-tag">Dès le 1er décembre</span>
                <h3>Formule Basique</h3>
                <ul>
                  <li>{FORMULE_BASIQUE.reduction_pharmacie} de réduction en pharmacie</li>
                  <li>{FORMULE_BASIQUE.remise_clinique_hopital} de remise en clinique et à l'hôpital</li>
                  <li>Adhésion de {FORMULE_BASIQUE.frais_adhesion} F</li>
                  <li>{FORMULE_BASIQUE.prix_unique} F en paiement unique, pour une personne</li>
                  <li>Réductions activées après {FORMULE_BASIQUE.parrainages_requis} parrainages payants</li>
                </ul>
                <Link
                  to="/formule-basique"
                  className="btn btn-line"
                  onClick={() => trackCTA("ViewContent", "select_item", { content_name: "Basique", content_category: "formule" })}
                >
                  Découvrir la Formule Basique
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* ===== COMMENT RÉSERVER ===== */}
        <section className="sec sec-white" id="reserver">
          <div className="wrap">
            <h2 className="h2 rv">Réserver sa formule, en trois temps</h2>
            <p className="lede rv" style={{ "--d": ".1s" }}>Tout se fait depuis votre téléphone, sans déplacement.</p>

            <div className="rsteps rv-line">
              {RESERVATION_STEPS.map((s, i) => (
                <div className="rstep rv" key={s.title} style={{ "--d": `${0.25 + i * 0.22}s` }}>
                  <div className="rstep-n">Étape {i + 1}</div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40 }}>
              <Link
                to={reservationLink()}
                className="btn btn-navy"
                onClick={() => trackCTA("InitiateCheckout", "begin_checkout", { content_name: "Réservation 2027 — étapes" })}
              >
                Commencer ma réservation
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FORMULES ===== */}
        <section className="sec" id="formulas">
          <div className="wrap">
            <h2 className="h2 rv">Les quatre formules, prime annuelle</h2>
            <p className="lede rv" style={{ "--d": ".1s" }}>
              Tarifs particuliers, par an. Couverture en Côte d'Ivoire, sur le réseau de soins Awoundjô.
              Chaque réservation coûte {RESERVATION_FEE} F, quelle que soit la formule.
            </p>

            <div className="ftable" role="table" aria-label="Formules et primes annuelles">
              <div className="frow frow-head" role="row">
                <span>Formule</span><span>Solo</span><span>Famille</span><span />
              </div>
              {GESTIONNAIRE_PLANS.map((p, i) => {
                const top = p.slug === "PREMIUM";
                return (
                  <div className={`frow rv ${top ? "frow-top" : ""}`} role="row" key={p.slug} style={{ "--d": `${i * 0.12}s` }}>
                    <div>
                      <div className="fname">{p.name}</div>
                      <span className="fcov">Couverture {p.couverture}</span>
                      <span className="fchild">Enfant à charge : {p.particulier.pna_enfant_charge} F</span>
                    </div>
                    <div className="fprice">{p.particulier.solo} F<small>/ an</small></div>
                    <div className="fprice">{p.particulier.famille} F<small>/ an</small></div>
                    <Link
                      to={reservationLink(p.slug)}
                      className="btn btn-line btn-sm"
                      onClick={() => trackCTA("InitiateCheckout", "begin_checkout", { content_name: `Réservation ${p.name}` })}
                    >
                      Réserver {p.name}
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="fnote rv">
              Ces tarifs concernent les personnes sans pathologie déclarée. Une surprime s'applique en cas de pathologie
              déclarée et à partir de 55 ans. Grille entreprise à partir de 10 familles ou 30 solos : sur demande.
              {premium ? ` La formule ${premium.name} offre la couverture ${premium.couverture}.` : ""}
            </p>
          </div>
        </section>

        {/* ===== AVANTAGES ===== */}
        <section className="sec sec-white" id="benefits">
          <div className="wrap">
            <h2 className="h2 rv">Ce que votre carte vous donne</h2>
            <div className="benefits">
              {BENEFITS.map((b, i) => (
                <div className="benefit rv" key={b.title} style={{ "--d": `${(i % 2) * 0.12}s` }}>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CONFIANCE ===== */}
        <div className="trust" id="proof">
          <div className="wrap trust-row rv">
            <p className="trust-agree"><b>Mutuelle agréée</b><br />n° 019-072/MEPS/CAB du 27/08/2019</p>
            <div className="partners">
              {PARTNERS.map((p) => <span key={p}>{p}</span>)}
            </div>
          </div>
        </div>

        {/* ===== FAQ ===== */}
        <section className="sec" id="faq">
          <div className="wrap">
            <h2 className="h2 rv">Vos questions</h2>
            <div className="faq-list">
              {FAQS.map((f, i) => (
                <div className={`faq-item rv ${openFaq === i ? "open" : ""}`} key={f.q} style={{ "--d": `${i * 0.06}s` }}>
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                    {f.q}
                    <span className="faq-mark" aria-hidden="true">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  <div className="faq-a">{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section className="final" id="cta">
          <div className="wrap">
            <h2 className="rv">Gardez votre place pour 2027</h2>
            <p className="lede rv" style={{ "--d": ".1s" }}>{RESERVATION_FEE} F par Mobile Money, et votre formule est réservée.</p>

            <div className="final-actions rv" style={{ "--d": ".2s" }}>
              <Link
                to={reservationLink()}
                className="btn btn-gold"
                onClick={() => trackCTA("InitiateCheckout", "begin_checkout", { content_name: "Réservation 2027 — final" })}
              >
                Réserver ma place
              </Link>
              <a
                href={waLink("Bonjour, je veux des informations sur les formules Awoundjô 2027.")}
                className="btn btn-wa"
                target="_blank" rel="noopener noreferrer"
                onClick={() => trackCTA("Contact", "contact", { content_name: "WhatsApp — final" })}
              >
                <WaIcon /> Poser une question sur WhatsApp
              </a>
            </div>

            <div className="contact-row">
              <span>Tél. <a href="tel:+2250171721668">01 71 72 16 68</a></span>
              <span><a href="mailto:mutuelleawoundjo2018@gmail.com">mutuelleawoundjo2018@gmail.com</a></span>
              <span>
                <a href={APK_DOWNLOAD_URL} download
                  onClick={() => trackCTA("ViewContent", "select_item", { content_name: "App Android", content_category: "download" })}>
                  Télécharger l'app Android
                </a>
              </span>
            </div>

            <p className="final-corp">
              <Link to="/adhesion?type=entreprise"
                onClick={() => trackCTA("ViewContent", "select_item", { content_name: "Entreprise", content_category: "segment" })}>
                Vous dirigez une entreprise ? Demandez un devis pour vos salariés
              </Link>
            </p>
          </div>
        </section>
      </div>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
