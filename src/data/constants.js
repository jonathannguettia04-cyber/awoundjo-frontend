// src/data/constants.js
// Tokens de design + données statiques partagées entre toutes les pages Awoundjô

export const C = {
  green:      "#1a5fa8",   // bleu principal (charte graphique)
  greenLight: "#00c4b4",   // turquoise accent
  greenPale:  "#E9F1FB",
  gold:       "#D4A017",
  goldLight:  "#F5E6B0",
  cream:      "#F7F9FC",
  slate:      "#2D3748",
  gray:       "#718096",
  white:      "#FFFFFF",
};

// ── LEGACY — retirées du catalogue public au 1er décembre ──────
// Remplacées par GESTIONNAIRE_PLANS ci-dessous. Conservées ici (export PLANS
// inchangé) uniquement pour ne rien casser côté code qui afficherait encore
// la formule d'un adhérent déjà inscrit sur l'une de ces 3 formules. Les
// adhérents existants gardent leur formule jusqu'à leur renouvellement, où
// ils choisiront parmi le nouveau catalogue (GESTIONNAIRE_PLANS).
export const PLANS = [
  {
    name: "Essentielle",
    color: C.green,
    badge: null,
    adhesion: "15 000",
    mensualite: "10 000",
    couverture: "50%",
    avantages: ["Bilan de santé offert", "Réseau de soins national", "Carnet numérique", "Téléconsultation", "Carte Mansa"],
  },
  {
    name: "Ivoirienne",
    color: C.gold,
    badge: "Populaire",
    adhesion: "15 000",
    mensualite: "15 000",
    couverture: "70%",
    avantages: ["Tout Essentielle inclus", "Plafond famille élargi", "Priorité urgences", "Optique couverte", "Maternité couverte"],
  },
  {
    name: "Turquoise",
    color: "#00c4b4",
    badge: "Premium",
    adhesion: "15 000",
    mensualite: "35 000",
    couverture: "80%",
    avantages: ["Tout Ivoirienne inclus", "Hospitalisation étendue", "Chirurgie couverte", "Ambulance incluse", "Dentisterie couverte"],
  },
];

// ── Formule Basique (nouvelle offre, réseau de soins existant) ──
// Structure différente des 3 formules ci-dessus : pas de cotisation mensuelle,
// frais d'adhésion + montant payable en 3 versements/mensualités, et des
// réductions sur le réseau de soins existant (pharmacies, cliniques, hôpitaux)
// plutôt qu'un pourcentage de couverture fixe.
export const FORMULE_BASIQUE = {
  name: "Basique",
  color: "#2D3748",
  badge: "Nouveau",
  reduction_pharmacie: "50%",
  remise_clinique_hopital: "50%",
  reseau: "Réseau de soins existant Awoundjô",
  frais_adhesion: "6 000",
  offres: [
    {
      id: "individuelle",
      label: "Individuelle",
      adhesion: "6 000",
      montant: "60 000",
      versements: 3,
      versement_unitaire: "20 000",
      frequence: "mensualités",
    },
    {
      id: "famille",
      label: "Famille de 5 personnes",
      adhesion: "6 000",
      montant: "120 000",
      versements: 3,
      versement_unitaire: "40 000",
      frequence: "versements",
    },
  ],
  avantages: [
    "50% de réduction en pharmacies partenaires",
    "50% de remise en cliniques et hôpitaux partenaires",
    "Utilise le réseau de soins existant Awoundjô",
    "Paiement en 3 versements, sans mensualité récurrente",
  ],
};

// ── Formules du gestionnaire maladie (nouveau catalogue public, dès le 1er décembre) ──
// Remplacent Essentielle/Ivoirienne/Turquoise ci-dessus. Primes ANNUELLES
// (Prime TTC annuelle), gérées entièrement par le gestionnaire maladie
// partenaire (remboursements, prise en charge, sinistres hors plateforme
// Awoundjô — la plateforme ne fait qu'adhésion + collecte du paiement).
// Utilisent le réseau de soins du PDF "RESEAU_GLOBAL" (même réseau que la
// Formule Basique).
// Deux grilles tarifaires :
//  - "particulier" : particuliers et entreprises de MOINS de 10 familles ou 30 solos
//  - "entreprise"  : entreprises à PARTIR de 10 familles ou 30 solos
export const GESTIONNAIRE_PLANS = [
  {
    name: "Classic",
    slug: "CLASSIC",
    color: C.green,
    couverture: "80%",
    couverture_label: "80% Côte d'Ivoire",
    particulier: { solo: "264 600", famille: "470 000", pna_enfant_supplementaire: "65 000", pna_enfant_charge: "115 000" },
    entreprise:  { solo: "116 000", famille: "350 000", pna_enfant_supplementaire: "45 000",  pna_enfant_charge: "80 000" },
  },
  {
    name: "Aisance",
    slug: "AISANCE",
    color: C.gold,
    couverture: "80%",
    couverture_label: "80% Côte d'Ivoire",
    particulier: { solo: "491 750", famille: "875 040", pna_enfant_supplementaire: "117 000", pna_enfant_charge: "201 500" },
    entreprise:  { solo: "226 000", famille: "680 000", pna_enfant_supplementaire: "90 000",  pna_enfant_charge: "155 000" },
  },
  {
    name: "Harmony",
    slug: "HARMONY",
    color: "#00c4b4",
    couverture: "80%",
    couverture_label: "80% Côte d'Ivoire",
    particulier: { solo: "723 031", famille: "1 288 040", pna_enfant_supplementaire: "234 000", pna_enfant_charge: "403 000" },
    entreprise:  { solo: "437 000", famille: "1 000 000", pna_enfant_supplementaire: "180 000", pna_enfant_charge: "310 000" },
  },
  {
    name: "Premium",
    slug: "PREMIUM",
    color: "#2D3748",
    couverture: "100%",
    couverture_label: "100% Côte d'Ivoire",
    particulier: { solo: "985 110", famille: "1 756 040", pna_enfant_supplementaire: "286 000", pna_enfant_charge: "494 000" },
    entreprise:  { solo: "612 000", famille: "1 360 000", pna_enfant_supplementaire: "220 000", pna_enfant_charge: "380 000" },
  },
];

// Seuil de bascule particulier → entreprise, et mentions légales associées
// (reproduites telles qu'indiquées sur la grille tarifaire du gestionnaire).
export const GESTIONNAIRE_NOTE = {
  seuil_entreprise: "Entreprises à partir de 10 familles ou 30 solos",
  seuil_particulier: "Particuliers et entreprises de moins de 10 familles ou 30 solos",
  surprime_pathologie: "Ces tarifs concernent les personnes sans pathologies déclarées. En cas de pathologies déclarées, une surprime s'appliquera.",
  surprime_age: "Une surprime âge est perçue à partir de 55 ans.",
};

export const STEPS = [
  { n: "01", label: "Inscription", desc: "Remplissez le formulaire en ligne en quelques minutes." },
  { n: "02", label: "Validation", desc: "Notre équipe vérifie et valide votre dossier." },
  { n: "03", label: "Paiement", desc: "Réglez votre adhésion et première mensualité." },
  { n: "04", label: "Votre carte", desc: "Recevez votre carte mutualiste numérique." },
  { n: "05", label: "Accès aux soins", desc: "Consultez dans tout notre réseau partenaire." },
];

export const STATS = [
  { value: "2 400+", label: "Adhérents actifs" },
  { value: "120+",   label: "Établissements partenaires" },
  { value: "12",     label: "Villes couvertes" },
  { value: "96%",    label: "Taux de satisfaction" },
];

export const TESTIMONIALS = [
  { name: "Adjoua K.", role: "Famille", text: "Grâce à Awoundjô, j'ai pu hospitaliser mon mari sans avancer les frais. La carte a tout changé." },
  { name: "Pasteur Kouassi", role: "Église", text: "Nous avons souscrit pour 80 membres. Le service est exemplaire et les remboursements rapides." },
  { name: "SARL Palmor", role: "Entreprise", text: "Une solution sérieuse pour la santé de nos employés. Awoundjô est notre partenaire santé depuis 2022." },
];

export const FAQS = [
  { q: "Comment adhérer ?", r: "Remplissez le formulaire sur notre site ou contactez un agent. L'adhésion se fait en ligne, sans déplacement." },
  { q: "Comment payer mes cotisations ?", r: "Via Mobile Money (MTN, Moov), carte bancaire ou virement. Un rappel automatique vous est envoyé chaque mois." },
  { q: "Comment ajouter ma famille ?", r: "Depuis votre espace adhérent, section « Ma famille ». Chaque membre reçoit sa propre carte." },
  { q: "Où utiliser ma carte ?", r: "Dans tous nos établissements partenaires : cliniques, hôpitaux, pharmacies, laboratoires et cabinets dentaires." },
  { q: "Comment renouveler mon adhésion ?", r: "Le renouvellement est automatique si vos cotisations sont à jour. Vous recevez une notification 30 jours avant l'échéance." },
];

export const PROVIDERS = [
  { name: "Clinique Sainte Marie",    lat: 5.345, lng: -4.008, type: "Clinique" },
  { name: "Pharmacie du Plateau",     lat: 5.321, lng: -4.015, type: "Pharmacie" },
  { name: "Hôpital Général d'Abobo",  lat: 5.423, lng: -4.052, type: "Hôpital" },
  { name: "Laboratoire BioSanté",     lat: 5.360, lng: -3.990, type: "Laboratoire" },
  { name: "Clinique Ste Thérèse",     lat: 5.290, lng: -3.960, type: "Clinique" },
];

// ── Coordonnées de contact officielles ──────────────────────
export const CONTACT = {
  email: "mutuelleawoundjo2018@gmail.com",
  phone: "01 71 72 16 68",
  whatsapp: "2250171721668",
  address: "Jules Verne, derrière l'école Akenji, Abidjan, Côte d'Ivoire",
};

// ── Articles de blog ─────────────────────────────────────────
export const BLOG_POSTS = [
  {
    slug: "bien-choisir-sa-formule-sante",
    title: "Comment bien choisir sa formule de santé ?",
    excerpt: "Budget, taille de famille, besoins médicaux : les critères essentiels pour choisir la formule Awoundjô adaptée à votre situation.",
    date: "2026-05-12",
    category: "Conseils",
    image: "/images/blog-choisir-formule.jpg",
  },
  {
    slug: "mobile-money-cotisations",
    title: "Payer ses cotisations par Mobile Money : le guide complet",
    excerpt: "Wave, Orange Money, MTN MoMo : découvrez comment régler vos cotisations mensuelles en quelques clics, sans vous déplacer.",
    date: "2026-04-28",
    category: "Pratique",
    image: "/images/blog-mobile-money.jpg",
  },
  {
    slug: "reseau-soins-extension-2026",
    title: "Notre réseau de soins s'agrandit en 2026",
    excerpt: "12 nouvelles villes couvertes, 30 établissements partenaires supplémentaires : le point sur l'extension de notre réseau cette année.",
    date: "2026-03-15",
    category: "Actualités",
    image: "/images/blog-reseau-soins.jpg",
  },
  {
    slug: "prevention-sante-famille",
    title: "5 gestes de prévention santé pour toute la famille",
    excerpt: "La prévention reste le meilleur moyen de rester en bonne santé. Voici nos conseils pratiques applicables au quotidien.",
    date: "2026-02-20",
    category: "Conseils",
    image: "/images/blog-prevention-sante.jpg",
  },
];
