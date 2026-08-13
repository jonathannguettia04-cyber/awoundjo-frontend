// src/pages/public/PoliciesPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";

const LEGAL = {
  nom: "MUTUELLE SANTE AWOUNDJÔ",
  forme: "Mutuelle de santé",
  arrete: "Arrêté Ministériel N°019-072/MEPS/CAB du 27/08/2019",
  immatriculation: "N° 1D0342019/CI",
  agrement: "Agrément du GEPHARM (Groupement d'intérêts Economique des Pharmaciens de Côte d'Ivoire) N° 0291/OKH/BAJ du 06/11/2019",
  siege: "Cocody Riviera – Faya, Route d'Abatta, à 100 mètres du feu du Nouveau Goudron, Abidjan",
  adressePostale: "21 BP 1107 Abidjan 21",
  directrice: "Madame Leogniny Alice Goué, Directrice Générale",
  tel: "27 21 37 35 98 / 01 71 72 16 68",
  email: "infos@mutuelleawoundjo.com",
  emailContact: "contact@mutuelleawoundjo.com",
  siteWeb: "www.mutuelleawoundjo.com",
  whatsapp: "225 01 71 72 16 68",
  maj: "12 août 2026",
};

const SECTIONS = [
  { id: "mentions", label: "Mentions légales" },
  { id: "cgu", label: "Conditions d'utilisation" },
  { id: "confidentialite", label: "Politique de confidentialité" },
];

export default function PoliciesPage() {
  const [active, setActive] = useState("mentions");

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <FontLoader />
      <ResponsiveStyles />
      <Nav />

      <div className="awj-pol">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sora:wght@400;500;600;700&display=swap');

          .awj-pol {
            --navy: #01417E; --deep: #042A50; --royal: #005FAF; --cyan: #00ADF1;
            --ice: #E4F2FC; --white: #FFFFFF; --muted: #9DC3E6; --grey: #3B5468; --gold: #D4A843;
            font-family: 'Sora', sans-serif; color: var(--deep); background: var(--white);
            -webkit-font-smoothing: antialiased;
          }
          .awj-pol * { box-sizing: border-box; }
          .awj-pol h1, .awj-pol h2, .awj-pol h3 { font-family: 'Playfair Display', serif; margin: 0; }
          .awj-pol .container { max-width: 860px; margin: 0 auto; padding: 0 24px; }

          .awj-pol .pol-hero {
            background: linear-gradient(160deg, var(--deep) 0%, var(--navy) 60%, var(--royal) 100%);
            padding: 120px 24px 60px; text-align: center;
          }
          .awj-pol .pol-kicker {
            color: var(--muted); font-size: 13px; font-weight: 700; letter-spacing: 3px;
            text-transform: uppercase; margin-bottom: 12px;
          }
          .awj-pol .pol-hero h1 { color: var(--white); font-size: clamp(28px,5vw,42px); font-weight: 900; }
          .awj-pol .pol-hero p { color: var(--muted); margin-top: 14px; font-size: 15px; }

          .awj-pol .pol-tabs {
            position: sticky; top: 0; z-index: 10; background: var(--white);
            border-bottom: 1px solid #E6EEF6; padding: 0 24px;
          }
          .awj-pol .pol-tabs-inner {
            max-width: 860px; margin: 0 auto; display: flex; gap: 8px; overflow-x: auto;
          }
          .awj-pol .pol-tab {
            flex: 0 0 auto; padding: 18px 20px; font-weight: 600; font-size: 14px;
            color: var(--grey); text-decoration: none; border-bottom: 3px solid transparent;
            white-space: nowrap; transition: color .2s, border-color .2s;
          }
          .awj-pol .pol-tab:hover { color: var(--royal); }
          .awj-pol .pol-tab.active { color: var(--royal); border-bottom-color: var(--cyan); }

          .awj-pol .pol-body { padding: 56px 24px 100px; }
          .awj-pol .pol-block { margin-bottom: 64px; }
          .awj-pol .pol-block:last-child { margin-bottom: 0; }
          .awj-pol .pol-block h2 {
            font-size: clamp(24px,4vw,32px); color: var(--deep); margin-bottom: 24px;
            padding-bottom: 16px; border-bottom: 2px solid var(--ice);
          }
          .awj-pol .pol-block h3 {
            font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700;
            color: var(--royal); margin: 32px 0 10px;
          }
          .awj-pol .pol-block p { line-height: 1.75; color: var(--grey); margin: 0 0 14px; font-size: 15px; }
          .awj-pol .pol-block ul { margin: 0 0 14px; padding-left: 20px; }
          .awj-pol .pol-block li { line-height: 1.75; color: var(--grey); font-size: 15px; margin-bottom: 6px; }
          .awj-pol .pol-block strong { color: var(--deep); }
          .awj-pol .pol-note {
            background: var(--ice); border-left: 3px solid var(--cyan); border-radius: 8px;
            padding: 16px 20px; font-size: 14px; color: var(--grey); margin: 20px 0;
          }
          .awj-pol .pol-contact {
            background: var(--deep); border-radius: 16px; padding: 36px; text-align: center; color: var(--white);
          }
          .awj-pol .pol-contact h3 { color: var(--white); font-family: 'Playfair Display', serif; font-size: 22px; margin-bottom: 10px; }
          .awj-pol .pol-contact p { color: var(--muted); margin-bottom: 20px; }
          .awj-pol .pol-contact a {
            display: inline-flex; align-items: center; gap: 8px; background: var(--cyan);
            color: var(--deep); font-weight: 700; padding: 14px 32px; border-radius: 50px;
            text-decoration: none; font-size: 15px;
          }
        `}</style>

        <section className="pol-hero">
          <p className="pol-kicker">Awoundjô — Mutuelle santé</p>
          <h1>Politiques & conditions</h1>
          <p>Conditions d'utilisation et politique de confidentialité — dernière mise à jour le {LEGAL.maj}</p>
        </section>

        <nav className="pol-tabs">
          <div className="pol-tabs-inner">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`pol-tab${active === s.id ? " active" : ""}`}
                onClick={scrollTo(s.id)}
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="pol-body container">
          {/* ===================== MENTIONS LÉGALES ===================== */}
          <div className="pol-block" id="mentions">
            <h2>Mentions légales</h2>

            <p>
              Le site et l'application Awoundjô sont édités par <strong>{LEGAL.nom}</strong>, {LEGAL.forme}.
            </p>

            <h3>Éditeur</h3>
            <ul>
              <li><strong>Dénomination :</strong> {LEGAL.nom}</li>
              <li><strong>Siège social :</strong> {LEGAL.siege}</li>
              <li><strong>Adresse postale :</strong> {LEGAL.adressePostale}</li>
              <li><strong>{LEGAL.arrete}</strong></li>
              <li><strong>Immatriculation :</strong> {LEGAL.immatriculation}</li>
              <li>{LEGAL.agrement}</li>
              <li><strong>Représentée par :</strong> {LEGAL.directrice}</li>
            </ul>

            <h3>Contact</h3>
            <ul>
              <li><strong>Téléphone :</strong> {LEGAL.tel}</li>
              <li><strong>E-mail :</strong> {LEGAL.email} / {LEGAL.emailContact}</li>
              <li><strong>Site web :</strong> {LEGAL.siteWeb}</li>
            </ul>

            <h3>Activité</h3>
            <p>
              {LEGAL.nom} est une mutuelle de santé agréée, proposant à ses adhérents des formules de
              couverture santé et un réseau d'établissements de soins partenaires, dans le cadre du
              tiers payant.
            </p>

            <h3>Hébergement</h3>
            <p>
              Le site (partie front-end) est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133,
              Covina, California 91723, États-Unis.
            </p>
            <p>
              Les services applicatifs (back-end) sont hébergés par <strong>Railway Corporation</strong>,
              548 Market St, PMB 68956, San Francisco, California 94104, États-Unis.
            </p>
            <p>
              La base de données est hébergée par <strong>Supabase</strong> (Supabase Pte Ltd), 65 Chulia
              Street #38-02/03, OCBC Centre, Singapour 049513.
            </p>
          </div>

          {/* ===================== CGU ===================== */}
          <div className="pol-block" id="cgu">
            <h2>Conditions générales d'utilisation</h2>

            <p>
              Les présentes conditions générales d'utilisation (les « CGU ») régissent l'accès et l'utilisation
              des services proposés par {LEGAL.nom} ({LEGAL.forme}), ci-après « Awoundjô », « nous »,
              accessibles via le site internet et l'application mobile Awoundjô (ci-après le « Service »).
              En créant un compte ou en utilisant le Service, vous acceptez sans réserve les présentes CGU.
            </p>

            <h3>1. Objet du service</h3>
            <p>
              Awoundjô est une plateforme numérique permettant à ses adhérents de souscrire à une couverture
              santé mutualiste, de gérer leur adhésion et celle de leurs bénéficiaires, de régler leurs
              cotisations par Mobile Money et d'accéder à des services de soins auprès du réseau de
              partenaires agréés.
            </p>

            <h3>2. Adhésion et compte utilisateur</h3>
            <ul>
              <li>L'adhésion est ouverte à toute personne physique majeure, sans sélection médicale préalable.</li>
              <li>Les informations fournies lors de l'inscription (identité, bénéficiaires, formule choisie) doivent être exactes et tenues à jour.</li>
              <li>Chaque adhérent est responsable de la confidentialité de ses identifiants de connexion.</li>
              <li>Les dossiers sont validés sous 24h maximum après réception d'un dossier complet.</li>
            </ul>

            <h3>3. Cotisations et paiement</h3>
            <ul>
              <li>Les cotisations sont réglées par Mobile Money (Wave, Orange Money, MTN MoMo, Moov Money) ou tout autre moyen indiqué sur le Service.</li>
              <li>La cotisation couvre le mois suivant son paiement. Le renouvellement mensuel est à la charge de l'adhérent, un rappel étant envoyé avant chaque échéance.</li>
              <li>Le défaut de paiement à l'échéance peut entraîner la suspension temporaire de la prise en charge, jusqu'à régularisation.</li>
              <li>Les tarifs des différentes formules sont ceux affichés sur le Service au moment de la souscription et peuvent être révisés, avec information préalable des adhérents.</li>
            </ul>

            <h3>4. Prise en charge des soins</h3>
            <p>
              La prise en charge (jusqu'à 80 % selon la formule souscrite) s'applique aux actes et prestations
              couverts par la formule de l'adhérent, réalisés auprès des établissements et professionnels de
              santé partenaires. Le détail des garanties, exclusions et plafonds de chaque formule est
              communiqué à l'adhérent lors de la souscription.
            </p>

            <h3>5. Bénéficiaires</h3>
            <p>
              Un adhérent peut inscrire des bénéficiaires (conjoint, enfants) à son adhésion. Chaque
              bénéficiaire reçoit sa propre carte mutualiste et bénéficie des mêmes garanties, dans les
              conditions prévues par la formule souscrite.
            </p>

            <h3>6. Obligations de l'adhérent</h3>
            <ul>
              <li>Utiliser le Service de bonne foi et conformément à sa destination.</li>
              <li>Ne pas transmettre sa carte mutualiste à un tiers non déclaré comme bénéficiaire.</li>
              <li>Signaler sans délai toute perte, vol ou usage frauduleux de son compte ou de sa carte.</li>
            </ul>

            <h3>7. Résiliation</h3>
            <p>
              L'adhérent peut résilier son adhésion à tout moment depuis son espace personnel ou en
              contactant le service client. La résiliation prend effet à la fin de la période déjà payée,
              sans remboursement de la cotisation en cours.
            </p>

            <h3>8. Limitation de responsabilité</h3>
            <p>
              Awoundjô met tout en œuvre pour assurer la disponibilité et la fiabilité du Service, sans
              garantir une disponibilité ininterrompue. Awoundjô ne saurait être tenu responsable des
              interruptions liées à des causes extérieures (réseau, opérateurs Mobile Money, cas de force
              majeure).
            </p>

            <h3>9. Modification des CGU</h3>
            <p>
              Awoundjô peut modifier les présentes CGU à tout moment. Les adhérents seront informés de
              toute modification substantielle par notification sur le Service ou par tout autre moyen
              approprié. La poursuite de l'utilisation du Service après modification vaut acceptation des
              nouvelles CGU.
            </p>

            <h3>10. Droit applicable</h3>
            <p>
              Les présentes CGU sont soumises au droit ivoirien. Tout litige relatif à leur interprétation
              ou leur exécution relève de la compétence des juridictions ivoiriennes.
            </p>
          </div>

          {/* ============ POLITIQUE DE CONFIDENTIALITÉ ============ */}
          <div className="pol-block" id="confidentialite">
            <h2>Politique de confidentialité</h2>

            <p>
              Awoundjô attache une grande importance à la protection des données personnelles de ses
              adhérents. Cette politique explique quelles données nous collectons, pourquoi, et comment
              elles sont protégées.
            </p>

            <h3>1. Données collectées</h3>
            <ul>
              <li>Identité : nom, prénom, date de naissance, contact (téléphone, e-mail).</li>
              <li>Informations relatives aux bénéficiaires déclarés (conjoint, enfants).</li>
              <li>Informations liées à l'adhésion : formule choisie, historique de cotisations et de paiements.</li>
              <li>Données de santé strictement nécessaires à la prise en charge (actes réalisés, prescriptions), traitées avec un niveau de confidentialité renforcé.</li>
              <li>Données techniques de connexion (identifiants, journaux d'usage de l'application).</li>
            </ul>

            <h3>2. Finalités du traitement</h3>
            <ul>
              <li>Gestion de l'adhésion, des bénéficiaires et des cotisations.</li>
              <li>Traitement des demandes de prise en charge auprès des établissements partenaires.</li>
              <li>Envoi de confirmations et de rappels (SMS, WhatsApp, notifications de l'application).</li>
              <li>Amélioration du Service et prévention des fraudes.</li>
            </ul>

            <h3>3. Partage des données</h3>
            <p>
              Les données nécessaires à la prise en charge des soins sont partagées avec les établissements
              de santé et professionnels partenaires, uniquement dans la limite de ce qui est requis pour la
              prestation. Les données de paiement transitent par les opérateurs de Mobile Money concernés.
              Awoundjô ne vend ni ne loue les données personnelles de ses adhérents à des tiers à des fins
              commerciales.
            </p>

            <h3>4. Conservation des données</h3>
            <p>
              Les données sont conservées pendant la durée de l'adhésion, puis archivées pour la durée
              nécessaire au respect des obligations légales et à la gestion d'éventuels litiges, avant
              suppression ou anonymisation.
            </p>

            <h3>5. Sécurité</h3>
            <p>
              Awoundjô met en œuvre des mesures techniques et organisationnelles raisonnables pour protéger
              les données contre l'accès non autorisé, la perte ou l'altération.
            </p>

            <h3>6. Droits des adhérents</h3>
            <p>
              Tout adhérent peut demander l'accès, la rectification ou la suppression de ses données
              personnelles, dans les limites permises par les obligations légales et contractuelles liées à
              son adhésion, en contactant Awoundjô via les coordonnées ci-dessous.
            </p>

            <div className="pol-note">
              Cette politique sera complétée et précisée au fur et à mesure de l'évolution du Service et des
              obligations réglementaires applicables en Côte d'Ivoire.
            </div>
          </div>

          <div className="pol-contact">
            <h3>Une question sur ces conditions ?</h3>
            <p>Notre équipe vous répond directement sur WhatsApp.</p>
            <a href={`https://wa.me/2250171721668`} target="_blank" rel="noopener noreferrer">
              Nous contacter
            </a>
          </div>
        </div>
      </div>

      <WhatsAppFloat />
      <Footer />
    </>
  );
}
