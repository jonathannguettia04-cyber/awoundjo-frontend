import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  HeartPulse,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MousePointer2,
  PhoneCall,
  Pill,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Zap,
} from 'lucide-react';

const WA_NUMBER = '2250171721668';
const RESERVATION_FEE = '15 000';
const APK_DOWNLOAD_URL = 'https://vkrnqoajmyyyatfdlmbk.supabase.co/storage/v1/object/public/app-releases/app-release.apk';
const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const plans = [
  { name: 'Classic', slug: 'classic', cover: '80 %', solo: 'Sur devis', family: 'Sur devis', tone: 'ice', note: 'L’essentiel, sans compromis.' },
  { name: 'Aisance', slug: 'aisance', cover: '85 %', solo: 'Sur devis', family: 'Sur devis', tone: 'mint', note: 'Plus de sérénité au quotidien.' },
  { name: 'Harmony', slug: 'harmony', cover: '90 %', solo: 'Sur devis', family: 'Sur devis', tone: 'violet', note: 'Le juste équilibre pour la famille.' },
  { name: 'Premium', slug: 'premium', cover: '100 %', solo: 'Sur devis', family: 'Sur devis', tone: 'gold', note: 'Une protection haute confiance.' },
];

const reservationSteps = [
  { number: '01', title: 'Choisissez votre formule', text: 'Classic, Aisance, Harmony ou Premium, en solo ou en famille.' },
  { number: '02', title: 'Réglez 15 000 F', text: 'Par Wave, Orange Money, MTN MoMo ou Moov. Votre place est enregistrée dès confirmation.' },
  { number: '03', title: 'Payez en 3 versements', text: 'Un tiers de la prime à chaque étape. Votre année est soldée, sans pression.' },
];

const benefits = [
  { icon: MapPin, number: '01', title: 'Un large réseau de soins', text: 'Cliniques, hôpitaux, pharmacies, laboratoires et cabinets dentaires partout en Côte d’Ivoire.' },
  { icon: Stethoscope, number: '02', title: 'Téléconsultation médicale', text: 'Un médecin à distance, directement depuis votre téléphone, où que vous soyez.' },
  { icon: ScanFace, number: '03', title: 'Dossier médical sur mobile', text: 'Votre historique de soins toujours accessible. Fini les ordonnances perdues.' },
  { icon: ShieldCheck, number: '04', title: 'Carte mutualiste numérique', text: 'Votre carte sur votre téléphone, à présenter pour accéder aux soins.' },
];

const faqs = [
  ['Pourquoi réserver dès maintenant ?', 'Les quatre formules Classic, Aisance, Harmony et Premium entrent en vigueur en 2027. Pour 15 000 F, vous réservez votre place dès aujourd’hui. Ces 15 000 F correspondent à l’adhésion, comprise dans votre premier versement.'],
  ['Comment se règle la prime annuelle ?', 'Par Mobile Money (Wave, Orange Money, MTN MoMo ou Moov), en 3 versements. Le premier comprend les 15 000 F d’adhésion et un tiers de la prime.'],
  ['Qu’est-ce que la Formule Basique ?', 'Une formule proposée dès le 1er décembre : 50 % de réduction en pharmacie et 50 % de remise en clinique et à l’hôpital, sur le réseau de soins Awoundjô. 35 000 F en paiement unique ou en 2 mensualités de 17 500 F, plus 6 000 F d’adhésion.'],
  ['Quelle est la différence avec la CMU ?', 'La CMU est le régime public de base. Awoundjô est complémentaire : prise en charge jusqu’à 100 % selon la formule, sur un large réseau de soins partenaire.'],
  ['Est-ce que mes antécédents médicaux comptent ?', 'Aucune sélection médicale à l’adhésion : tout le monde est accepté. Une surprime peut s’appliquer en cas de pathologie déclarée ou à partir de 55 ans, mais personne n’est refusé.'],
  ['Combien de personnes puis-je couvrir ?', 'Chaque formule existe en version Solo et Famille. Vous pouvez ajouter des enfants supplémentaires ou à charge, selon les tarifs de la formule.'],
  ['Je dirige une entreprise, quel tarif s’applique ?', 'Une grille entreprise s’applique à partir de 10 familles ou 30 solos. Faites une demande de devis et nous revenons vers vous.'],
];

function trackCTA(name) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag('event', name);
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') window.fbq('track', name);
}

function BrandMark({ compact = false }) {
  return (
    <span className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`}>
      <span className="brand-mark__glyph"><span /><span /><span /></span>
      <span className="brand-mark__name">Awoundjô</span>
    </span>
  );
}

function LogoLockup() {
  return (
    <div className="logo-lockup">
      <BrandMark />
      <span className="logo-lockup__sub">Mutuelle santé</span>
    </div>
  );
}

function ArrowCta({ children, href = '#reserver', light = false, onClick }) {
  return (
    <a className={`arrow-cta ${light ? 'arrow-cta--light' : ''}`} href={href} onClick={onClick}>
      <span>{children}</span>
      <span className="arrow-cta__icon"><ArrowUpRight size={17} strokeWidth={2.4} /></span>
    </a>
  );
}

function InsuranceCard() {
  return (
    <div className="insurance-card">
      <div className="insurance-card__shine" />
      <div className="insurance-card__top">
        <span className="micro-label">CARTE MUTUALISTE</span>
        <span className="card-signal"><span /><span /><span /></span>
      </div>
      <div className="insurance-card__seal"><ShieldCheck size={19} /><span>AWJ</span></div>
      <div className="insurance-card__middle">
        <div className="insurance-card__name">NOM PRÉNOM</div>
        <div className="insurance-card__meta">Membre actif · Famille</div>
      </div>
      <div className="insurance-card__bottom">
        <span>AWOUNDJÔ / 2027</span>
        <span className="card-chip">+100%</span>
      </div>
    </div>
  );
}

function CoverageDial() {
  return (
    <div className="coverage-dial" aria-label="Jusqu’à 100 % de couverture">
      <div className="coverage-dial__ring" />
      <div className="coverage-dial__core"><strong>100</strong><span>%</span></div>
      <span className="coverage-dial__label">couverture<br />Premium</span>
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rootRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onPointerMove = (event) => {
      if (reduceMotion || window.innerWidth < 900) return;
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        root.style.setProperty('--pointer-x', `${x.toFixed(3)}`);
        root.style.setProperty('--pointer-y', `${y.toFixed(3)}`);
      });
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });
    root.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      revealObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const reserve = (event) => {
    trackCTA('begin_checkout');
    if (event) event.currentTarget.blur();
  };

  return (
    <div className="awj-site" ref={rootRef} style={{ '--scroll-progress': scrollProgress }}>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />

      <header className="site-nav">
        <a className="nav-brand" href="#hero" aria-label="Awoundjô, accueil"><LogoLockup /></a>
        <nav className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`} aria-label="Navigation principale">
          <a href="#experience" onClick={() => setMenuOpen(false)}>Notre vision</a>
          <a href="#formulas" onClick={() => setMenuOpen(false)}>Nos formules</a>
          <a href="#benefits" onClick={() => setMenuOpen(false)}>Votre carte</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>Questions</a>
        </nav>
        <a className="nav-action" href="#reserver" onClick={reserve}>Réserver <ArrowUpRight size={15} /></a>
        <button className="menu-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
      </header>

      <main>
        <section className="hero" id="hero">
          <div className="hero__grid-lines" aria-hidden="true" />
          <div className="hero__content container" data-reveal>
            <div className="hero__copy">
              <div className="eyebrow"><span className="eyebrow__dot" />Maison Awoundjô <span className="eyebrow__slash">/</span> Espace santé</div>
              <h1>La santé,<br /><em>en confiance.</em></h1>
              <p className="hero__lead">Une mutuelle pensée autour de vous. Une couverture claire pour vous et ceux qui comptent, partout en Côte d’Ivoire.</p>
              <div className="hero__actions">
                <ArrowCta onClick={reserve}>Réserver ma place pour 15 000 F</ArrowCta>
                <a className="text-link" href="#experience"><span className="text-link__line" />Entrer dans l’expérience</a>
              </div>
              <div className="hero__assurance"><LockKeyhole size={14} /> Sans sélection médicale à l’adhésion <span /> <strong>Réservations 2027 ouvertes</strong></div>
            </div>

            <div className="hero__scene" aria-label="Carte mutualiste Awoundjô en 3D" data-reveal>
              <div className="scene-orbit scene-orbit--outer" />
              <div className="scene-orbit scene-orbit--inner" />
              <div className="scene-axis scene-axis--vertical" />
              <div className="scene-axis scene-axis--horizontal" />
              <div className="scene-corner scene-corner--tl" /><div className="scene-corner scene-corner--br" />
              <div className="scene-caption scene-caption--top"><span>01</span> Carte de membre <i /></div>
              <div className="scene-caption scene-caption--bottom"><span>AWJ / 27</span> Votre accès santé</div>
              <div className="scene-panel scene-panel--back" />
              <div className="scene-panel scene-panel--front"><div className="scene-panel__glow" /><span>VOTRE SANTÉ</span><strong>PROTÉGÉE</strong><small>depuis 2018</small></div>
              <div className="scene-card-wrap"><InsuranceCard /></div>
              <div className="scene-dial-wrap"><CoverageDial /></div>
              <div className="scene-float scene-float--one"><HeartPulse size={15} /><span>Réseau de soins<br /><b>1 500+ partenaires</b></span></div>
              <div className="scene-float scene-float--two"><Sparkles size={15} /><span>Prise en charge<br /><b>jusqu’à 100 %</b></span></div>
              <div className="scene-shadow" />
            </div>
          </div>
          <div className="hero__bottom container"><span>Scroll pour découvrir</span><ArrowDownRight size={16} /><span className="hero__bottom-rule" /></div>
        </section>

        <section className="signal-strip" aria-label="Les chiffres clés">
          <div className="container signal-strip__inner">
            <div className="signal-item"><span className="signal-item__num">1 500<span>+</span></span><span>prestataires<br />partenaires</span></div>
            <div className="signal-item"><span className="signal-item__num">100<span>%</span></span><span>de couverture<br />Premium</span></div>
            <div className="signal-item"><span className="signal-item__num">04</span><span>opérateurs<br />Mobile Money</span></div>
            <div className="signal-item signal-item--last"><span className="live-dot" /> <span>Une présence<br />partout en Côte d’Ivoire</span></div>
          </div>
        </section>

        <section className="experience section-space" id="experience">
          <div className="container experience__grid">
            <div className="section-index" data-reveal><span>02</span><i /></div>
            <div className="experience__intro" data-reveal>
              <p className="kicker">Une nouvelle adresse pour prendre soin de vous</p>
              <h2>Plus qu’une couverture.<br /><em>Un réflexe de confiance.</em></h2>
              <p className="body-copy">Awoundjô rend la protection santé plus simple, plus proche et plus humaine. Ici, tout commence par une écoute, puis se poursuit par des soins accessibles.</p>
              <ArrowCta href="#paths">Découvrir les deux parcours</ArrowCta>
            </div>
            <div className="architecture" data-reveal>
              <div className="architecture__frame"><div className="architecture__cross" /><div className="architecture__beam architecture__beam--one" /><div className="architecture__beam architecture__beam--two" /></div>
              <div className="architecture__quote"><span>“</span><p>La tranquillité de savoir que votre famille est couverte.</p><small>— L’engagement Awoundjô</small></div>
              <div className="architecture__tag architecture__tag--top">COVER / 2027</div>
              <div className="architecture__tag architecture__tag--bottom">ABIDJAN · CÔTE D’IVOIRE</div>
            </div>
          </div>
        </section>

        <section className="paths section-space section-dark" id="paths">
          <div className="container">
            <div className="section-head" data-reveal><div><p className="kicker kicker--light">Choisissez votre entrée</p><h2>Deux parcours.<br /><em>Une même attention.</em></h2></div><span className="section-code">AWJ / 02—04</span></div>
            <div className="path-grid">
              <article className="path-card path-card--main" data-reveal>
                <div className="path-card__top"><span className="status-chip"><span /> Réservations ouvertes</span><span className="path-card__index">01</span></div>
                <div className="path-card__icon"><ShieldCheck size={25} /></div>
                <h3>Les 4 formules<br /><em>2027</em></h3>
                <p>Classic, Aisance, Harmony et Premium. Une couverture de 80 % à 100 %, en solo ou en famille.</p>
                <div className="path-card__price"><strong>15 000</strong><span>F<br /><small>pour réserver</small></span></div>
                <div className="path-card__footer"><span>Prime annuelle réglable en 3 versements</span><ArrowCta light onClick={reserve}>Réserver</ArrowCta></div>
              </article>
              <article className="path-card path-card--basic" data-reveal>
                <div className="path-card__top"><span className="status-chip status-chip--dark"><span /> Dès le 1er décembre</span><span className="path-card__index">02</span></div>
                <div className="path-card__icon path-card__icon--blue"><Pill size={25} /></div>
                <h3>Formule<br /><em>Basique</em></h3>
                <p>Une première porte d’entrée pour bénéficier de réductions immédiates sur un réseau de soins partenaire.</p>
                <ul className="check-list"><li><Check size={15} /> 50 % en pharmacie</li><li><Check size={15} /> 50 % en clinique et hôpital</li><li><Check size={15} /> Dès 35 000 F / personne</li></ul>
                <div className="path-card__footer"><span>Activation après 3 parrainages payants</span><ArrowCta href="#formulas">Découvrir</ArrowCta></div>
              </article>
            </div>
          </div>
        </section>

        <section className="steps section-space" id="reserver">
          <div className="container">
            <div className="section-head section-head--light" data-reveal><div><p className="kicker">Un parcours sans détour</p><h2>Votre place est<br /><em>à portée de mobile.</em></h2></div><div className="step-orb"><span>3</span><small>gestes<br />simples</small></div></div>
            <div className="steps-list">
              {reservationSteps.map((step, index) => <div className="step-row" data-reveal style={{ '--delay': `${index * 0.1}s` }} key={step.number}><span className="step-row__number">{step.number}</span><div className="step-row__line" /><div className="step-row__copy"><h3>{step.title}</h3><p>{step.text}</p></div><ArrowUpRight className="step-row__arrow" size={21} /></div>)}
            </div>
            <div className="steps__cta" data-reveal><ArrowCta onClick={reserve}>Commencer ma réservation</ArrowCta><span><MousePointer2 size={15} /> Tout se fait depuis votre téléphone.</span></div>
          </div>
        </section>

        <section className="formulas section-space section-dark" id="formulas">
          <div className="container">
            <div className="section-head" data-reveal><div><p className="kicker kicker--light">Le coffre des protections</p><h2>Une formule<br /><em>à votre mesure.</em></h2></div><p className="section-head__note">Chaque réservation coûte 15 000 F, quelle que soit la formule. Les primes annuelles se règlent sur le réseau de soins Awoundjô.</p></div>
            <div className="formula-vault" data-reveal>
              <div className="formula-vault__rail"><span>FORMULES</span><span>2027</span></div>
              <div className="formula-table">
                <div className="formula-table__head"><span>Couverture</span><span>Solo</span><span>Famille</span><span /></div>
                {plans.map((plan, index) => <div className={`formula-row formula-row--${plan.tone}`} key={plan.slug}><div className="formula-row__name"><span>{String(index + 1).padStart(2, '0')}</span><strong>{plan.name}</strong><small>{plan.note}</small></div><div><span className="coverage-pill">{plan.cover}</span></div><div className="formula-price">{plan.solo}<small>/ an</small></div><div className="formula-price">{plan.family}<small>/ an</small></div><a href="#reserver" className="table-arrow" onClick={reserve} aria-label={`Réserver ${plan.name}`}><ArrowUpRight size={17} /></a></div>)}
              </div>
            </div>
            <div className="formula-note" data-reveal><span><Zap size={16} /> Une surprime s’applique en cas de pathologie déclarée et à partir de 55 ans.</span><a href={waLink('Bonjour, je veux connaître les tarifs des formules Awoundjô 2027.')} target="_blank" rel="noreferrer">Demander les tarifs sur WhatsApp <ArrowUpRight size={14} /></a></div>
          </div>
        </section>

        <section className="benefits section-space" id="benefits">
          <div className="container">
            <div className="section-head section-head--light" data-reveal><div><p className="kicker">L’espace membre</p><h2>Tout ce que votre carte<br /><em>met à portée de main.</em></h2></div><div className="benefits-stamp"><span>AWJ</span><small>CARE<br />SYSTEM</small></div></div>
            <div className="benefits-grid">{benefits.map((benefit) => { const Icon = benefit.icon; return <article className="benefit-card" data-reveal key={benefit.number}><div className="benefit-card__top"><span>{benefit.number}</span><Icon size={20} /></div><h3>{benefit.title}</h3><p>{benefit.text}</p><div className="benefit-card__rule" /></article>; })}</div>
          </div>
        </section>

        <section className="trust-band" id="proof"><div className="container trust-band__inner" data-reveal><div className="trust-copy"><span className="trust-copy__seal"><ShieldCheck size={16} /></span><div><span className="kicker">Une mutuelle agréée</span><p>N° 019-072/MEPS/CAB<br />du 27/08/2019</p></div></div><div className="partner-list"><span>Giepharm</span><span>Mansa-Bank</span><span>CNEPECI</span><span>CEL-CI</span><span>Meditrans</span><span>Sonam-Assurances</span></div></div></section>

        <section className="faq section-space" id="faq">
          <div className="container faq__grid"><div className="section-index" data-reveal><span>07</span><i /></div><div><div className="section-head section-head--light" data-reveal><div><p className="kicker">La parole est à vous</p><h2>Les réponses<br /><em>sans détour.</em></h2></div><MessageCircle size={35} strokeWidth={1.2} /></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-item ${openFaq === index ? 'faq-item--open' : ''}`} data-reveal key={question}><button type="button" className="faq-question" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span><small>{String(index + 1).padStart(2, '0')}</small>{question}</span><ChevronDown size={19} /></button><div className="faq-answer"><p>{answer}</p></div></div>)}</div></div></div>
        </section>

        <section className="final-cta section-space" id="cta"><div className="final-cta__grid" aria-hidden="true"><span /><span /><span /></div><div className="container final-cta__inner" data-reveal><div className="final-cta__eyebrow"><span className="live-dot" /> Porte ouverte <span>AWJ / 2027</span></div><h2>Votre tranquillité<br /><em>commence ici.</em></h2><p>15 000 F par Mobile Money, et votre formule est réservée.</p><div className="final-cta__actions"><ArrowCta light onClick={reserve}>Réserver ma place</ArrowCta><a className="whatsapp-cta" href={waLink('Bonjour, je veux des informations sur les formules Awoundjô 2027.')} target="_blank" rel="noreferrer" onClick={() => trackCTA('contact')}><MessageCircle size={17} /> Poser une question</a></div><div className="final-cta__contacts"><a href="tel:+2250171721668"><PhoneCall size={14} /> 01 71 72 16 68</a><a href="mailto:mutuelleawoundjo2018@gmail.com">mutuelleawoundjo2018@gmail.com</a><a href={APK_DOWNLOAD_URL} download onClick={() => trackCTA('download_app')}>Télécharger l’app Android <ArrowUpRight size={13} /></a></div></div></section>
      </main>

      <footer className="site-footer"><div className="container site-footer__inner"><LogoLockup /><div className="footer-links"><a href="#experience">Notre vision</a><a href="#formulas">Formules</a><a href="#faq">FAQ</a><a href="#cta">Contact</a></div><span className="footer-copy">© Awoundjô · Mutuelle santé</span></div></footer>
    </div>
  );
}
