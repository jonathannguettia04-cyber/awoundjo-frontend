// src/pages/public/LandingPage.jsx
// Vitrine publique Awoundjô — React + Tailwind + Leaflet

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

/* ── Google Fonts ─────────────────────────────────────────── */
const FontLoader = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
);

/* ── Tokens ───────────────────────────────────────────────── */
const C = {
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

/* ── Données ──────────────────────────────────────────────── */
const PLANS = [
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

const STEPS = [
  { n: "01", label: "Inscription", desc: "Remplissez le formulaire en ligne en quelques minutes." },
  { n: "02", label: "Validation", desc: "Notre équipe vérifie et valide votre dossier." },
  { n: "03", label: "Paiement", desc: "Réglez votre adhésion et première mensualité." },
  { n: "04", label: "Votre carte", desc: "Recevez votre carte mutualiste numérique." },
  { n: "05", label: "Accès aux soins", desc: "Consultez dans tout notre réseau partenaire." },
];

const STATS = [
  { value: "2 400+", label: "Adhérents actifs" },
  { value: "120+",   label: "Établissements partenaires" },
  { value: "12",     label: "Villes couvertes" },
  { value: "96%",    label: "Taux de satisfaction" },
];

const TESTIMONIALS = [
  { name: "Adjoua K.", role: "Famille", text: "Grâce à Awoundjô, j'ai pu hospitaliser mon mari sans avancer les frais. La carte a tout changé." },
  { name: "Pasteur Kouassi", role: "Église", text: "Nous avons souscrit pour 80 membres. Le service est exemplaire et les remboursements rapides." },
  { name: "SARL Palmor", role: "Entreprise", text: "Une solution sérieuse pour la santé de nos employés. Awoundjô est notre partenaire santé depuis 2022." },
];

const FAQS = [
  { q: "Comment adhérer ?", r: "Remplissez le formulaire sur notre site ou contactez un agent. L'adhésion se fait en ligne, sans déplacement." },
  { q: "Comment payer mes cotisations ?", r: "Via Mobile Money (MTN, Moov), carte bancaire ou virement. Un rappel automatique vous est envoyé chaque mois." },
  { q: "Comment ajouter ma famille ?", r: "Depuis votre espace adhérent, section « Ma famille ». Chaque membre reçoit sa propre carte." },
  { q: "Où utiliser ma carte ?", r: "Dans tous nos établissements partenaires : cliniques, hôpitaux, pharmacies, laboratoires et cabinets dentaires." },
  { q: "Comment renouveler mon adhésion ?", r: "Le renouvellement est automatique si vos cotisations sont à jour. Vous recevez une notification 30 jours avant l'échéance." },
];

const PROVIDERS = [
  { name: "Clinique Sainte Marie",    lat: 5.345, lng: -4.008, type: "Clinique" },
  { name: "Pharmacie du Plateau",     lat: 5.321, lng: -4.015, type: "Pharmacie" },
  { name: "Hôpital Général d'Abobo",  lat: 5.423, lng: -4.052, type: "Hôpital" },
  { name: "Laboratoire BioSanté",     lat: 5.360, lng: -3.990, type: "Laboratoire" },
  { name: "Clinique Ste Thérèse",     lat: 5.290, lng: -3.960, type: "Clinique" },
];

/* ── Nav ──────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? C.white : "transparent",
      boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,.08)" : "none",
      transition: "background .3s, box-shadow .3s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 64, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.green}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: C.white, fontWeight: 900, fontSize: 16, fontFamily: "Playfair Display, serif" }}>A</span>
          </div>
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 20, color: scrolled ? C.green : C.white }}>Awoundjô</span>
        </div>

        <div style={{ display: "flex", gap: 28, alignItems: "center" }} className="nav-links">
          {[["#about","À propos"],["#formules","Formules"],["#fonctionnement","Comment ça marche"],["#reseau","Réseau"],["#faq","FAQ"]].map(([href, label]) => (
            <a key={href} href={href} style={{ color: scrolled ? C.slate : C.white, fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, textDecoration: "none", opacity: .9 }}>{label}</a>
          ))}
          <a href="/client/login" style={{
            background: C.gold, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
            padding: "8px 18px", borderRadius: 8, textDecoration: "none",
          }}>Mon espace</a>
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ─────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      background: `linear-gradient(135deg, ${C.green} 0%, #0F3D22 60%, #1a5c35 100%)`,
      display: "flex", alignItems: "center",
    }}>
      {/* Motif kente abstrait */}
      <div style={{ position: "absolute", inset: 0, opacity: .07 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i % 4) * 28}%`, top: `${Math.floor(i / 4) * 35}%`,
            width: 200, height: 200,
            background: C.gold,
            transform: `rotate(45deg) scale(${0.3 + (i % 3) * 0.15})`,
            borderRadius: 4,
          }} />
        ))}
      </div>

      {/* Bande dorée diagonale — signature */}
      <div style={{
        position: "absolute", right: -80, top: "10%", bottom: "-10%",
        width: "55%",
        background: `linear-gradient(135deg, ${C.gold}22 0%, ${C.gold}08 100%)`,
        transform: "skewX(-6deg)",
        borderLeft: `3px solid ${C.gold}44`,
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${C.gold}22`, border: `1px solid ${C.gold}44`, borderRadius: 20, padding: "6px 14px", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
            <span style={{ color: C.gold, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>MUTUELLE DE SANTÉ — CÔTE D'IVOIRE</span>
          </div>

          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2.2rem, 4vw, 3.4rem)", color: C.white, lineHeight: 1.15, margin: "0 0 20px" }}>
            La santé accessible<br />
            <span style={{ color: C.gold }}>à tous</span>, partout<br />
            en Côte d'Ivoire.
          </h1>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, color: "#B8D4C4", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            Rejoignez la Mutuelle Awoundjô et bénéficiez d'une couverture santé adaptée à votre famille, dès 10 000 F/mois.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/adhesion" style={{
              background: C.gold, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
              padding: "14px 28px", borderRadius: 10, textDecoration: "none",
              boxShadow: `0 4px 20px ${C.gold}55`,
            }}>Devenir adhérent →</a>
            <a href="#reseau" style={{
              background: "transparent", color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15,
              padding: "14px 28px", borderRadius: 10, textDecoration: "none",
              border: `1.5px solid ${C.white}44`,
            }}>Trouver un établissement</a>
          </div>

          <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
            {STATS.slice(0, 2).map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 28, color: C.gold }}>{s.value}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8FB8A0", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Carte mutualiste mockup */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            width: 340, height: 210, borderRadius: 20,
            background: `linear-gradient(135deg, ${C.green} 0%, #0a2e18 100%)`,
            boxShadow: `0 30px 80px rgba(0,0,0,.5), 0 0 0 1px ${C.gold}33`,
            padding: 28, position: "relative", overflow: "hidden",
            transform: "rotate(-3deg)",
          }}>
            <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: `${C.gold}15` }} />
            <div style={{ position: "absolute", right: 20, top: 20, opacity: .3 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: C.gold, marginLeft: -12 }} />
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#D4A01788", marginTop: -40 }} />
            </div>
            <div style={{ fontFamily: "Playfair Display, serif", color: C.gold, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Awoundjô</div>
            <div style={{ fontFamily: "Inter, sans-serif", color: "#8FB8A0", fontSize: 10, letterSpacing: 1, marginBottom: 24 }}>MUTUELLE DE SANTÉ</div>
            <div style={{ fontFamily: "Inter, sans-serif", color: C.white, fontSize: 14, letterSpacing: 3, marginBottom: 16 }}>AWJ-2025-XXXXXX</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", color: "#8FB8A0", fontSize: 9, letterSpacing: 1 }}>ADHÉRENT</div>
                <div style={{ fontFamily: "Inter, sans-serif", color: C.white, fontSize: 13, fontWeight: 600 }}>NOM PRÉNOM</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Inter, sans-serif", color: "#8FB8A0", fontSize: 9, letterSpacing: 1 }}>FORMULE</div>
                <div style={{ fontFamily: "Inter, sans-serif", color: C.gold, fontSize: 12, fontWeight: 700 }}>IVOIRIENNE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── About ────────────────────────────────────────────────── */
function About() {
  const VALEURS = [
    { icon: "🤝", label: "Solidarité" },
    { icon: "🏥", label: "Accessibilité" },
    { icon: "🔍", label: "Transparence" },
    { icon: "💡", label: "Innovation" },
    { icon: "🌱", label: "Prévention" },
  ];

  return (
    <section id="about" style={{ background: C.cream, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>QUI SOMMES-NOUS</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: C.slate, margin: "0 0 24px", lineHeight: 1.2 }}>
            Une mutuelle née<br />pour les Ivoiriens
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.gray, lineHeight: 1.8, marginBottom: 20 }}>
            <strong style={{ color: C.green }}>Notre mission :</strong> Rendre les soins de santé accessibles à chaque famille ivoirienne, quelle que soit sa situation économique, grâce à un système de mutualisation solidaire.
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.gray, lineHeight: 1.8 }}>
            <strong style={{ color: C.green }}>Notre vision :</strong> Être la première mutuelle de santé digitale de Côte d'Ivoire, couvrant 100 000 adhérents d'ici 2027, avec un réseau de soins dans chaque commune.
          </p>
        </div>
        <div>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 20 }}>NOS VALEURS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {VALEURS.map(v => (
              <div key={v.label} style={{
                background: C.white, borderRadius: 12, padding: "20px 20px",
                border: `1px solid ${C.greenPale}`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>{v.icon}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: C.slate }}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Plans ────────────────────────────────────────────────── */
function Plans() {
  return (
    <section id="formules" style={{ background: C.white, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>NOS FORMULES</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: C.slate, margin: 0 }}>
            Choisissez la couverture<br />qui vous correspond
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {PLANS.map((plan, i) => (
            <div key={plan.name} style={{
              borderRadius: 20, overflow: "hidden",
              boxShadow: i === 1 ? `0 8px 40px ${C.gold}22` : "0 2px 16px rgba(0,0,0,.06)",
              border: i === 1 ? `2px solid ${C.gold}` : `1px solid #E2E8F0`,
              transform: i === 1 ? "translateY(-8px)" : "none",
              transition: "transform .2s",
              background: C.white,
            }}>
              <div style={{ background: plan.color, padding: "28px 28px 24px", position: "relative" }}>
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: 16, right: 16,
                    background: C.white, color: plan.color,
                    fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11,
                    padding: "4px 10px", borderRadius: 20,
                  }}>{plan.badge}</div>
                )}
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 22, color: C.white, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 42, color: C.white }}>{plan.couverture}</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: `${C.white}99` }}>couverture</span>
                </div>
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  <div style={{ background: C.cream, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray, letterSpacing: 1, marginBottom: 2 }}>ADHÉSION</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate }}>{plan.adhesion} F</div>
                  </div>
                  <div style={{ background: C.cream, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray, letterSpacing: 1, marginBottom: 2 }}>MENSUALITÉ</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate }}>{plan.mensualite} F</div>
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                  {plan.avantages.map(a => (
                    <li key={a} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Inter, sans-serif", fontSize: 14, color: C.slate, marginBottom: 10 }}>
                      <span style={{ color: plan.color, fontWeight: 700, fontSize: 16 }}>✓</span> {a}
                    </li>
                  ))}
                </ul>
                <a href="/adhesion" style={{
                  display: "block", textAlign: "center",
                  background: i === 1 ? C.gold : plan.color,
                  color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
                  padding: "13px", borderRadius: 10, textDecoration: "none",
                }}>Souscrire maintenant</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section id="fonctionnement" style={{ background: C.green, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>LE PARCOURS</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: C.white, margin: 0 }}>
            Adhérez en 5 étapes simples
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, position: "relative" }}>
          {/* Ligne connectrice */}
          <div style={{ position: "absolute", top: 36, left: "10%", right: "10%", height: 2, background: `${C.gold}44`, zIndex: 0 }} />
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
                background: C.gold,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 20px ${C.gold}44`,
              }}>
                <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 20, color: C.white }}>{step.n}</span>
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.white, marginBottom: 8 }}>{step.label}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8FB8A0", lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Map ──────────────────────────────────────────────────── */
function NetworkMap() {
  const [filter, setFilter] = useState("Tous");
  const types = ["Tous", "Clinique", "Hôpital", "Pharmacie", "Laboratoire"];
  const filtered = filter === "Tous" ? PROVIDERS : PROVIDERS.filter(p => p.type === filter);

  return (
    <section id="reseau" style={{ background: C.cream, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>RÉSEAU DE SOINS</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: C.slate, margin: 0 }}>
            Nos établissements partenaires
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
              padding: "8px 18px", borderRadius: 20, cursor: "pointer",
              background: filter === t ? C.green : C.white,
              color: filter === t ? C.white : C.slate,
              border: `1.5px solid ${filter === t ? C.green : "#E2E8F0"}`,
              transition: "all .2s",
            }}>{t}</button>
          ))}
        </div>
        <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.10)", height: 480 }}>
          <MapContainer center={[5.345, -4.008]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map(p => (
              <Marker key={p.name} position={[p.lat, p.lng]}>
                <Popup>
                  <strong>{p.name}</strong><br />
                  <span style={{ color: C.green }}>{p.type}</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}

/* ── Simulator ────────────────────────────────────────────── */
function Simulator() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = [
    { key: "type", label: "Pour qui souscrivez-vous ?", options: ["Individuel", "Famille"] },
    { key: "nb", label: "Combien de personnes à couvrir ?", options: ["1", "2-3", "4 et plus"] },
    { key: "budget", label: "Quel est votre budget mensuel ?", options: ["Moins de 12 000 F", "12 000 – 20 000 F", "Plus de 20 000 F"] },
  ];

  const recommend = (ans) => {
    if (ans.budget === "Moins de 12 000 F") return "Essentielle";
    if (ans.budget === "Plus de 20 000 F") return "Turquoise";
    return "Ivoirienne";
  };

  const choose = (key, val) => {
    const next = { ...answers, [key]: val };
    setAnswers(next);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setResult(recommend(next));
    }
  };

  const reset = () => { setStep(0); setAnswers({}); setResult(null); };

  return (
    <section style={{ background: C.white, padding: "96px 24px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>SIMULATEUR</div>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.slate, margin: "0 0 40px" }}>
          Quelle formule vous correspond ?
        </h2>
        <div style={{ background: C.cream, borderRadius: 20, padding: 40 }}>
          {!result ? (
            <>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
                {questions.map((_, i) => (
                  <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i <= step ? C.green : "#E2E8F0" }} />
                ))}
              </div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 600, color: C.slate, marginBottom: 24 }}>
                {questions[step].label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {questions[step].options.map(opt => (
                  <button key={opt} onClick={() => choose(questions[step].key, opt)} style={{
                    fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600,
                    padding: "14px 20px", borderRadius: 10, cursor: "pointer",
                    background: C.white, color: C.slate, border: `1.5px solid #E2E8F0`,
                    transition: "all .15s", textAlign: "left",
                  }}
                  onMouseEnter={e => { e.target.style.background = C.greenPale; e.target.style.borderColor = C.green; }}
                  onMouseLeave={e => { e.target.style.background = C.white; e.target.style.borderColor = "#E2E8F0"; }}
                  >{opt}</button>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, marginBottom: 8 }}>Nous vous recommandons</p>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 36, color: C.green, marginBottom: 20 }}>
                Formule {result}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <a href="/adhesion" style={{
                  background: C.green, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
                  padding: "12px 24px", borderRadius: 10, textDecoration: "none",
                }}>Souscrire maintenant</a>
                <button onClick={reset} style={{
                  background: "transparent", color: C.green, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
                  padding: "12px 24px", borderRadius: 10, border: `1.5px solid ${C.green}`, cursor: "pointer",
                }}>Recommencer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Stats + Testimonials ─────────────────────────────────── */
function SocialProof() {
  return (
    <section style={{ background: C.cream, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 80 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center", background: C.white, borderRadius: 16, padding: "32px 20px", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 40, color: C.green, marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>TÉMOIGNAGES</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: C.slate, margin: 0 }}>
            Ils nous font confiance
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: C.white, borderRadius: 16, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 36, color: C.gold, lineHeight: 1, marginBottom: 12 }}>"</div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.slate, lineHeight: 1.7, marginBottom: 20 }}>{t.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", color: C.white, fontWeight: 700, fontSize: 16 }}>{t.name[0]}</span>
                </div>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate }}>{t.name}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gold }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" style={{ background: C.white, padding: "96px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>FAQ</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: C.slate, margin: 0 }}>Questions fréquentes</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((f, i) => (
            <div key={i} style={{ borderRadius: 12, border: `1.5px solid ${open === i ? C.green : "#E2E8F0"}`, overflow: "hidden", transition: "border .2s" }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                width: "100%", textAlign: "left", padding: "18px 20px",
                background: open === i ? C.greenPale : C.white,
                border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: C.slate,
              }}>
                {f.q}
                <span style={{ color: C.green, fontSize: 18, lineHeight: 1 }}>{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 20px 18px", fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, lineHeight: 1.7 }}>
                  {f.r}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Vérification numéro mutualiste ──────────────────────── */
function CheckMember() {
  const [num, setNum] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!num.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/client/verify/${num.trim()}`);
      const data = await res.json();
      setStatus(data.found ? "valid" : "invalid");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ background: C.green, padding: "80px 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: C.white, marginBottom: 12 }}>
          Vérifier un numéro mutualiste
        </div>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#8FB8A0", marginBottom: 28 }}>
          Confirmez qu'un adhérent est bien enregistré chez Awoundjô.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={num} onChange={e => { setNum(e.target.value); setStatus(null); }}
            placeholder="Ex: AWJ-2025-001234"
            style={{
              flex: 1, fontFamily: "Inter, sans-serif", fontSize: 14,
              padding: "13px 16px", borderRadius: 10, border: "none",
              outline: "none", background: C.white, color: C.slate,
            }}
          />
          <button onClick={check} disabled={loading} style={{
            background: C.gold, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
            padding: "13px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          }}>{loading ? "..." : "Vérifier"}</button>
        </div>
        {status === "valid" && <div style={{ marginTop: 14, color: "#4ADE80", fontFamily: "Inter, sans-serif", fontSize: 14 }}>✅ Numéro valide — adhérent actif</div>}
        {status === "invalid" && <div style={{ marginTop: 14, color: "#F87171", fontFamily: "Inter, sans-serif", fontSize: 14 }}>❌ Numéro introuvable</div>}
        {status === "error" && <div style={{ marginTop: 14, color: "#F87171", fontFamily: "Inter, sans-serif", fontSize: 14 }}>Erreur réseau — réessayez</div>}
      </div>
    </section>
  );
}

/* ── Contact ──────────────────────────────────────────────── */
function Contact() {
  const [form, setForm] = useState({ nom: "", tel: "", email: "", sujet: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" style={{ background: C.cream, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "start" }}>
        <div>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>CONTACT</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: C.slate, margin: "0 0 24px" }}>
            Nous sommes là pour vous
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.7, marginBottom: 36 }}>
            Une question sur nos formules, votre adhésion ou le réseau de soins ? Notre équipe vous répond dans les 24h.
          </p>
          {[
            { icon: "📞", label: "Téléphone", val: "01 71 72 16 68" },
            { icon: "📧", label: "Email", val: "contact@awoundjo.org" },
            { icon: "📍", label: "Adresse", val: "Abidjan, Côte d'Ivoire" },
          ].map(c => (
            <div key={c.label} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: C.greenPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray, letterSpacing: 1 }}>{c.label.toUpperCase()}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: C.slate }}>{c.val}</div>
              </div>
            </div>
          ))}
          {/* Rappel rapide */}
          <div style={{ background: C.green, borderRadius: 16, padding: 24, marginTop: 32 }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: C.white, marginBottom: 14 }}>Être rappelé rapidement</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Votre prénom" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", fontFamily: "Inter, sans-serif", fontSize: 13 }} />
              <input placeholder="Téléphone" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", fontFamily: "Inter, sans-serif", fontSize: 13 }} />
              <button style={{ background: C.gold, color: C.white, border: "none", padding: "10px 16px", borderRadius: 8, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>OK</button>
            </div>
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 20, padding: 36, boxShadow: "0 4px 24px rgba(0,0,0,.06)" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: C.green }}>Message envoyé !</div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, marginTop: 8 }}>Nous vous répondons sous 24h.</p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[["nom","Nom complet"],["tel","Téléphone"],["email","Email"],["sujet","Sujet"]].map(([key, label]) => (
                <input key={key} required placeholder={label} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 14, padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", outline: "none" }}
                />
              ))}
              <textarea required placeholder="Votre message" value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={4}
                style={{ fontFamily: "Inter, sans-serif", fontSize: 14, padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", outline: "none", resize: "vertical" }}
              />
              <button type="submit" style={{
                background: C.green, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
                padding: "14px", borderRadius: 10, border: "none", cursor: "pointer",
              }}>Envoyer le message</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: "#0F2D1A", padding: "60px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.green}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: C.white, fontWeight: 900, fontSize: 16, fontFamily: "Playfair Display, serif" }}>A</span>
              </div>
              <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 20, color: C.white }}>Awoundjô</span>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", lineHeight: 1.7, maxWidth: 280 }}>
              La première mutuelle de santé digitale de Côte d'Ivoire. Solidarité, accessibilité, innovation.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {["Facebook", "Instagram", "LinkedIn", "WhatsApp"].map(s => (
                <div key={s} style={{ width: 36, height: 36, borderRadius: 8, background: "#1B3D26", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <span style={{ color: C.gold, fontSize: 14 }}>{s[0]}</span>
                </div>
              ))}
            </div>
          </div>
          {[
            { title: "Navigation", links: ["Accueil","À propos","Formules","Réseau de soins","Contact"] },
            { title: "Portails", links: ["Espace Adhérent","Espace Commercial","Espace Établissement","Espace Ambassadeur"] },
            { title: "Informations", links: ["01 71 72 16 68","contact@awoundjo.org","Abidjan, CI"] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.gold, letterSpacing: 1, marginBottom: 16 }}>{col.title.toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <span key={l} style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B9E80", cursor: "pointer" }}>{l}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #1B3D26", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#4A7A5A" }}>© 2025 Awoundjô — Tous droits réservés</span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#4A7A5A" }}>Mutuelle de Santé — Côte d'Ivoire</span>
        </div>
      </div>
    </footer>
  );
}

/* ── WhatsApp Float ───────────────────────────────────────── */
function WhatsAppFloat() {
  return (
    <a href="https://wa.me/2250171721668?text=Bonjour%2C%20je%20souhaite%20des%20informations%20sur%20la%20mutuelle%20Awoundj%C3%B4"
      target="_blank" rel="noreferrer"
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 999,
        background: "#25D366", color: C.white,
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 20px", borderRadius: 50,
        fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
        textDecoration: "none",
        boxShadow: "0 4px 20px rgba(37,211,102,.4)",
      }}>
      <span style={{ fontSize: 20 }}>💬</span>
      Besoin d'aide ?
    </a>
  );
}

/* ── App ──────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <FontLoader />
      <Nav />
      <Hero />
      <About />
      <Plans />
      <HowItWorks />
      <NetworkMap />
      <Simulator />
      <SocialProof />
      <FAQ />
      <CheckMember />
      <Contact />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
