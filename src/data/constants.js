// src/data/constants.js
// Tokens de design + données statiques partagées entre toutes les pages Awoundjô

export const C = {
  green:      "#1B6B3A",
  greenLight: "#2D8A52",
  greenPale:  "#E8F5EE",
  gold:       "#D4A017",
  goldLight:  "#F5E6B0",
  cream:      "#F9F6F0",
  slate:      "#2D3748",
  gray:       "#718096",
  white:      "#FFFFFF",
};

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
    color: "#0E7490",
    badge: "Premium",
    adhesion: "15 000",
    mensualite: "35 000",
    couverture: "80%",
    avantages: ["Tout Ivoirienne inclus", "Hospitalisation étendue", "Chirurgie couverte", "Ambulance incluse", "Dentisterie couverte"],
  },
];

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
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
  },
  {
    slug: "mobile-money-cotisations",
    title: "Payer ses cotisations par Mobile Money : le guide complet",
    excerpt: "Wave, Orange Money, MTN MoMo : découvrez comment régler vos cotisations mensuelles en quelques clics, sans vous déplacer.",
    date: "2026-04-28",
    category: "Pratique",
    image: "https://images.unsplash.com/photo-1556742049-0a6cd6c8d27e?w=800&q=80",
  },
  {
    slug: "reseau-soins-extension-2026",
    title: "Notre réseau de soins s'agrandit en 2026",
    excerpt: "12 nouvelles villes couvertes, 30 établissements partenaires supplémentaires : le point sur l'extension de notre réseau cette année.",
    date: "2026-03-15",
    category: "Actualités",
    image: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80",
  },
  {
    slug: "prevention-sante-famille",
    title: "5 gestes de prévention santé pour toute la famille",
    excerpt: "La prévention reste le meilleur moyen de rester en bonne santé. Voici nos conseils pratiques applicables au quotidien.",
    date: "2026-02-20",
    category: "Conseils",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80",
  },
];
