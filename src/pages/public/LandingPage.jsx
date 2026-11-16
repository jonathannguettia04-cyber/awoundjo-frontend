import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FontLoader from '../../components/shared/FontLoader';
import Nav from '../../components/shared/Nav';
import Footer from '../../components/shared/Footer';
import WhatsAppFloat from '../../components/shared/WhatsAppFloat';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  HeartPulse,
  LampDesk,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  PhoneCall,
  Pill,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';

const WA_NUMBER = '2250171721668';
const APK_DOWNLOAD_URL = 'https://vkrnqoajmyyyatfdlmbk.supabase.co/storage/v1/object/public/app-releases/app-release.apk';
const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
const reservationLink = (slug) => slug ? `/adhesion?type=reservation&formule=${slug.toLowerCase()}` : '/adhesion?type=reservation';

const rooms = [
  { id: 'hall', number: '01', label: 'Hall d’accueil', title: 'Entrez dans une mutuelle qui vous connaît.', short: 'Accueil' },
  { id: 'advice', number: '02', label: 'Bureau conseil', title: 'La bonne couverture commence par une bonne conversation.', short: 'Conseil' },
  { id: 'plans', number: '03', label: 'Salle des formules', title: 'Votre protection, posée clairement sur la table.', short: 'Formules' },
  { id: 'care', number: '04', label: 'Espace soins', title: 'Tout un réseau autour de votre santé.', short: 'Soins' },
  { id: 'desk', number: '05', label: 'Bureau adhésion', title: 'Votre place est prête. Il ne reste qu’à entrer.', short: 'Adhésion' },
];

const plans = [
  { name: 'Classic', cover: '80 %', slug: 'classic', color: 'blue' },
  { name: 'Aisance', cover: '85 %', slug: 'aisance', color: 'cyan' },
  { name: 'Harmony', cover: '90 %', slug: 'harmony', color: 'gold' },
  { name: 'Premium', cover: '100 %', slug: 'premium', color: 'green' },
];

const faqs = [
  ['Pourquoi réserver dès maintenant ?', 'Les quatre formules entrent en vigueur en 2027. Pour 15 000 F, vous réservez votre place dès aujourd’hui.'],
  ['Comment se règle la prime annuelle ?', 'Par Wave, Orange Money, MTN MoMo ou Moov, en trois versements.'],
  ['Qu’est-ce que la Formule Basique ?', '50 % de réduction en pharmacie et 50 % de remise en clinique et à l’hôpital sur le réseau Awoundjô.'],
  ['Est-ce que tout le monde peut adhérer ?', 'Oui. Aucune sélection médicale à l’adhésion : personne n’est refusé.'],
];

function Cta({ children, to, href, light = false, onClick }) {
  const content = <><span>{children}</span><span className="office-cta__arrow"><ArrowUpRight size={16} /></span></>;
  return to ? <Link className={`office-cta ${light ? 'office-cta--light' : ''}`} to={to} onClick={onClick}>{content}</Link> : <a className={`office-cta ${light ? 'office-cta--light' : ''}`} href={href} onClick={onClick}>{content}</a>;
}

function FloatingCard({ children, className = '' }) {
  return <div className={`floating-card ${className}`}>{children}</div>;
}

function OfficeFurniture({ room }) {
  if (room === 'hall') return <><div className="office-wall office-wall--hall"><div className="wall-logo">AW<span>J</span></div><span className="wall-caption">MUTUELLE SANTÉ · DEPUIS 2018</span></div><div className="office-plant office-plant--left"><span /><i /><b /></div><div className="office-bench"><span /><span /><span /></div></>;
  if (room === 'advice') return <><div className="office-window"><span /><span /><span /></div><div className="office-desk"><div className="desk-top" /><div className="desk-leg desk-leg--left" /><div className="desk-leg desk-leg--right" /><div className="desk-laptop"><span /><b>AWJ</b></div><div className="desk-card" /></div><div className="office-chair" /></>;
  if (room === 'plans') return <><div className="plan-wall"><span className="plan-wall__title">PROTECTION<br /><em>sur mesure</em></span><i /><i /><i /></div><div className="plans-counter"><span>AWJ / 2027</span><b>Choisissez votre niveau de sérénité.</b><div className="counter-line" /></div></>;
  if (room === 'care') return <><div className="care-wall"><div className="care-cross"><span /><span /></div><span>CARE NETWORK</span></div><div className="care-table"><div /><div /><div /></div><div className="care-screen"><HeartPulse size={22} /><b>Suivi santé</b><span>Connecté</span></div></>;
  return <><div className="desk-wall"><span>VOTRE DOSSIER</span><b>EST ENTRE<br />DE BONNES MAINS.</b></div><div className="reception-desk"><div className="desk-top" /><div className="desk-front">AWOUNDJÔ <span>ADHÉSION</span></div><div className="desk-pen" /><div className="desk-folder" /></div><div className="desk-lamp"><i /><b /></div></>;
}

export default function LandingPage() {
  const [activeRoom, setActiveRoom] = useState('hall');
  const [openFaq, setOpenFaq] = useState(null);
  const tourRef = useRef(null);

  useEffect(() => {
    const root = tourRef.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveRoom(entry.target.dataset.room);
          entry.target.classList.add('room-is-visible');
        }
      });
    }, { threshold: 0.55 });
    root.querySelectorAll('[data-room]').forEach((room) => observer.observe(room));
    return () => observer.disconnect();
  }, []);

  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const track = () => { if (typeof window.gtag === 'function') window.gtag('event', 'begin_checkout'); };

  return (
    <div className="office-experience">
      <FontLoader />
      <Nav />
      <div className="office-progress"><span style={{ width: `${((rooms.findIndex((room) => room.id === activeRoom) + 1) / rooms.length) * 100}%` }} /></div>

      <aside className="tour-nav" aria-label="Visite des bureaux Awoundjô">
        <div className="tour-nav__brand">AWJ <span>VISITE PRIVÉE</span></div>
        <div className="tour-nav__rooms">{rooms.map((room) => <button key={room.id} className={activeRoom === room.id ? 'is-active' : ''} type="button" onClick={() => goTo(room.id)}><span>{room.number}</span><i />{room.short}</button>)}</div>
        <span className="tour-nav__hint"><ArrowDown size={14} /> Faites défiler pour marcher</span>
      </aside>

      <main className="office-tour" ref={tourRef}>
        <section className="office-room office-room--hall" id="hall" data-room="hall">
          <div className="office-grid" /><OfficeFurniture room="hall" />
          <div className="room-copy room-copy--hall"><span className="room-kicker"><i /> Hall d’accueil · 01</span><h1>La santé,<br /><em>en confiance.</em></h1><p>Bienvenue chez Awoundjô. Avancez, prenez le temps de découvrir une mutuelle qui place votre famille au centre.</p><div className="room-actions"><Cta to={reservationLink()} onClick={track}>Commencer la visite</Cta><button className="walk-link" type="button" onClick={() => goTo('advice')}><span /> Entrer dans le bureau conseil</button></div></div>
          <FloatingCard className="floating-card--welcome"><Sparkles size={16} /><span>Bonjour.<b>Votre santé est entre de bonnes mains.</b></span></FloatingCard>
          <div className="room-floor-label">AWOUNDJÔ / MAISON DE PROTECTION / ABIDJAN</div>
        </section>

        <section className="office-room office-room--advice" id="advice" data-room="advice">
          <div className="office-grid office-grid--light" /><OfficeFurniture room="advice" />
          <div className="room-copy room-copy--advice"><span className="room-kicker"><i /> Bureau conseil · 02</span><h2>On commence<br /><em>par vous écouter.</em></h2><p>Moins de jargon. Plus de clarté. Un conseiller vous aide à trouver l’équilibre entre vos besoins, votre famille et votre budget.</p><div className="advice-notes"><span><Users size={15} /> Solo ou famille</span><span><LockKeyhole size={15} /> Sans sélection médicale</span></div><Cta href="#plans">Voir les formules</Cta></div>
          <FloatingCard className="floating-card--note"><span className="floating-card__number">02</span><span>Une protection qui<br /><b>s’adapte à votre vie.</b></span></FloatingCard>
          <div className="room-floor-label">SALON CONSEIL / ESPACE CONFIDENTIEL / 09:42</div>
        </section>

        <section className="office-room office-room--plans" id="plans" data-room="plans">
          <div className="office-grid" /><OfficeFurniture room="plans" />
          <div className="room-copy room-copy--plans"><span className="room-kicker"><i /> Salle des formules · 03</span><h2>Posez votre<br /><em>protection sur table.</em></h2><p>Quatre niveaux de couverture, un seul objectif : vous permettre de choisir avec confiance.</p><div className="plan-list">{plans.map((plan) => <Link to={reservationLink(plan.slug)} className={`plan-list__row plan-list__row--${plan.color}`} key={plan.slug} onClick={track}><span>{plan.name}</span><b>{plan.cover}</b><small>Réserver <ArrowUpRight size={13} /></small></Link>)}</div></div>
          <FloatingCard className="floating-card--coverage"><ShieldCheck size={18} /><span>Jusqu’à <b>100 %</b><small>de prise en charge</small></span></FloatingCard>
          <div className="room-floor-label">TABLE DES PROTECTIONS / CLASSIC — PREMIUM / 2027</div>
        </section>

        <section className="office-room office-room--care" id="care" data-room="care">
          <div className="office-grid office-grid--light" /><OfficeFurniture room="care" />
          <div className="room-copy room-copy--care"><span className="room-kicker"><i /> Espace soins · 04</span><h2>Votre carte ouvre<br /><em>plus qu’une porte.</em></h2><p>Un large réseau de soins, la téléconsultation, votre dossier médical et une carte numérique toujours avec vous.</p><div className="care-stats"><div><strong>1 500<sup>+</sup></strong><span>partenaires de soins</span></div><div><strong>100<sup>%</sup></strong><span>avec la formule Premium</span></div></div><Cta href="#desk">Continuer la visite</Cta></div>
          <FloatingCard className="floating-card--network"><MapPin size={16} /><span>Réseau Awoundjô<br /><b>partout en Côte d’Ivoire</b></span></FloatingCard>
          <div className="room-floor-label">RÉSEAU DE SOINS / TÉLÉCONSULTATION / MOBILE</div>
        </section>

        <section className="office-room office-room--desk" id="desk" data-room="desk">
          <div className="office-grid" /><OfficeFurniture room="desk" />
          <div className="room-copy room-copy--desk"><span className="room-kicker"><i /> Bureau adhésion · 05</span><h2>Votre tranquillité<br /><em>commence ici.</em></h2><p>Réservez votre place 2027 pour 15 000 F par Mobile Money. Votre conseiller reste disponible à chaque étape.</p><div className="desk-actions"><Cta to={reservationLink()} light onClick={track}>Réserver ma place</Cta><a className="whatsapp-link" href={waLink('Bonjour, je veux des informations sur les formules Awoundjô 2027.')} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Poser une question</a></div><div className="desk-contact"><a href="tel:+2250171721668"><PhoneCall size={13} /> 01 71 72 16 68</a><a href={APK_DOWNLOAD_URL} download>Télécharger l’application</a></div></div>
          <FloatingCard className="floating-card--confirmation"><Check size={16} /><span>Réservation possible<br /><b>en 3 versements</b></span></FloatingCard>
          <div className="room-floor-label">BUREAU ADHÉSION / PORTE OUVERTE / AWJ 2027</div>
        </section>

        <section className="office-aftercare" id="faq">
          <div className="aftercare-inner"><div><span className="room-kicker"><i /> Salon de lecture</span><h2>Avant de partir,<br /><em>une dernière question ?</em></h2><p>Notre équipe vous répond avec plaisir.</p></div><div className="faq-cards">{faqs.map(([question, answer], index) => <div className={`faq-card ${openFaq === index ? 'is-open' : ''}`} key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><ChevronRight size={17} /></button><p>{answer}</p></div>)}</div></div>
        </section>
      </main>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
