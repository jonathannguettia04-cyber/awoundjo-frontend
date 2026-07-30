// src/pages/public/Faq.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, CONTACT } from "../../data/constants";

const ALL_FAQS = [
  // Adhésion
  { cat: "Adhésion", q: "Comment adhérer à la mutuelle Awoundjô ?", r: "Remplissez le formulaire en ligne sur notre site, choisissez votre formule, payez via Mobile Money — c'est tout. L'adhésion se fait entièrement en ligne, sans déplacement. Notre équipe valide votre dossier sous 24h ouvrables." },
  { cat: "Adhésion", q: "Quels documents sont requis pour adhérer ?", r: "Aucun document médical n'est exigé à l'inscription. Il suffit d'un numéro de téléphone valide et d'une pièce d'identité pour la vérification d'identité." },
  { cat: "Adhésion", q: "Puis-je adhérer pour toute ma famille ?", r: "Oui. Votre conjoint et tous vos enfants à charge (jusqu'à 21 ans) sont couverts. Vous pouvez également ajouter vos parents à charge moyennant un supplément. Chaque membre reçoit sa propre carte Mansa." },
  { cat: "Adhésion", q: "Y a-t-il un délai de carence ?", r: "Oui. 30 jours pour les consultations et soins courants, 6 mois pour la maternité et la chirurgie programmée. Les urgences médicales (accident, hospitalisation d'urgence) sont couvertes dès le premier jour." },
  { cat: "Adhésion", q: "Puis-je changer de formule après l'adhésion ?", r: "Oui, à chaque date anniversaire de votre adhésion. Contactez notre service client avant l'échéance pour effectuer le changement, qui prendra effet au prochain cycle." },

  // Paiement
  { cat: "Paiement", q: "Comment payer mes cotisations ?", r: "Via Mobile Money uniquement : Wave, Orange Money, MTN MoMo ou Moov Money. Un rappel automatique par SMS vous est envoyé 3 jours avant l'échéance mensuelle. Le prélèvement est automatisé si vous le souhaitez." },
  { cat: "Paiement", q: "Que se passe-t-il si je ne paye pas à temps ?", r: "Votre couverture est suspendue après 15 jours de retard. Vous avez 30 jours pour régulariser sans pénalité. Au-delà, un nouveau dossier d'adhésion sera nécessaire." },
  { cat: "Paiement", q: "Les frais d'adhésion sont-ils remboursables ?", r: "Les frais d'adhésion de 15 000 F sont non remboursables après validation du dossier. La première mensualité est remboursable si vous annulez avant toute utilisation de la carte." },
  { cat: "Paiement", q: "Comment obtenir une facture ou un reçu de paiement ?", r: "Un reçu électronique est envoyé automatiquement par SMS et email après chaque paiement. Vous pouvez également les retrouver dans votre espace adhérent, section Cotisations." },

  // Soins & réseau
  { cat: "Soins & réseau", q: "Comment utiliser ma carte Mansa ?", r: "Rendez-vous dans un établissement partenaire, présentez votre carte numérique (QR code ou numéro de membre) à l'accueil. L'établissement vérifie votre couverture en temps réel et vous prend en charge sans avance de frais." },
  { cat: "Soins & réseau", q: "Puis-je consulter hors du réseau partenaire ?", r: "Oui. Pour les soins hors réseau, vous avancez les frais et soumettez une demande de remboursement via votre espace adhérent dans les 30 jours suivant le soin. Le remboursement est traité sous 48h ouvrables selon votre taux de couverture." },
  { cat: "Soins & réseau", q: "Où trouver un établissement partenaire proche de moi ?", r: "Sur la page Réseau de soins de notre site, filtrez par type d'établissement (clinique, pharmacie, laboratoire…) ou par ville. La carte interactive vous géolocalise." },
  { cat: "Soins & réseau", q: "La téléconsultation est-elle incluse dans toutes les formules ?", r: "Oui, la téléconsultation est incluse dans les trois formules (Essentielle, Ivoirienne, Turquoise) sans frais supplémentaires. Elle est disponible du lundi au samedi, de 7h à 20h." },

  // Compte & carte
  { cat: "Compte & carte", q: "J'ai perdu ma carte Mansa, que faire ?", r: "Connectez-vous à votre espace adhérent et cliquez sur « Signaler une perte ». Votre ancienne carte est désactivée instantanément et une nouvelle est émise sous 2 heures." },
  { cat: "Compte & carte", q: "Comment vérifier mon numéro de membre ?", r: "Votre numéro de membre est disponible dans votre espace adhérent, sur votre carte Mansa numérique et dans le SMS de confirmation d'adhésion. Vous pouvez aussi le vérifier sur awoundjo.ci/verification." },
  { cat: "Compte & carte", q: "Comment ajouter un membre de ma famille à ma mutuelle ?", r: "Depuis votre espace adhérent, section « Ma famille », cliquez sur « Ajouter un bénéficiaire ». Renseignez les informations du membre. La carte est générée sous 24h après validation." },
];

const CATS = ["Toutes", "Adhésion", "Paiement", "Soins & réseau", "Compte & carte"];

export default function Faq() {
  const [open, setOpen] = useState(null);
  const [cat, setCat] = useState("Toutes");
  const [search, setSearch] = useState("");

  const filtered = ALL_FAQS.filter(f => {
    const catOk = cat === "Toutes" || f.cat === cat;
    const searchOk = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.r.toLowerCase().includes(search.toLowerCase());
    return catOk && searchOk;
  });

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, ${C.slate} 0%, ${C.green} 100%)`,
        padding: "140px 24px 72px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, background: `radial-gradient(circle at 50% 30%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>FAQ</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", margin: "0 0 24px", lineHeight: 1.15 }}>
            Questions <span style={{ color: C.gold }}>fréquentes</span>
          </h1>
          {/* Barre de recherche */}
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setOpen(null); }}
              placeholder="Rechercher une question..."
              style={{
                width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
                fontFamily: "Inter, sans-serif", fontSize: 15, color: C.slate,
                boxSizing: "border-box", outline: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ───────────────────────────────────────── */}
      <div style={{ background: C.white, padding: "20px 24px", borderBottom: `1.5px solid ${C.greenPale}`, position: "sticky", top: 64, zIndex: 10 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => { setCat(c); setOpen(null); }} style={{
              fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
              padding: "8px 18px", borderRadius: 22, cursor: "pointer",
              background: cat === c ? C.green : C.white,
              color: cat === c ? "#FFFFFF" : C.slate,
              border: `1.5px solid ${cat === c ? C.green : "#E2E8F0"}`,
              transition: "all .15s",
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── ACCORDÉON ────────────────────────────────────────── */}
      <section style={{ background: C.cream, padding: "64px 24px 96px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray }}>
                Aucun résultat. <Link to="/contact" style={{ color: C.green, fontWeight: 600, textDecoration: "none" }}>Posez-nous votre question directement →</Link>
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Grouper par catégorie si pas de filtre */}
              {cat === "Toutes" && !search
                ? CATS.filter(c => c !== "Toutes").map(c => {
                    const items = filtered.filter(f => f.cat === c);
                    if (items.length === 0) return null;
                    return (
                      <div key={c} style={{ marginBottom: 8 }}>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 2, color: C.gold, textTransform: "uppercase", marginBottom: 12, marginTop: 24 }}>
                          {c}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {items.map((f, i) => <FaqItem key={i} f={f} open={open} setOpen={setOpen} idx={c + i} />)}
                        </div>
                      </div>
                    );
                  })
                : filtered.map((f, i) => <FaqItem key={i} f={f} open={open} setOpen={setOpen} idx={i} />)
              }
            </div>
          )}
        </div>
      </section>

      {/* ── CTA CONTACT ──────────────────────────────────────── */}
      <section style={{ background: C.green, padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>💬</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: "#FFFFFF", margin: "0 0 14px" }}>
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 28 }}>
            Notre équipe répond dans les 24h par email, ou immédiatement sur WhatsApp.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{
              background: "#25D366", color: "#FFFFFF",
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            }}>💬 WhatsApp</a>
            <Link to="/contact" style={{
              background: C.gold, color: C.slate,
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            }}>Nous écrire →</Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}

function FaqItem({ f, open, setOpen, idx }) {
  const isOpen = open === idx;
  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${isOpen ? C.green : "#E2E8F0"}`, overflow: "hidden", background: C.white, transition: "border-color .15s" }}>
      <button onClick={() => setOpen(isOpen ? null : idx)} style={{
        width: "100%", textAlign: "left", padding: "18px 20px",
        background: isOpen ? C.greenPale : C.white,
        border: "none", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: C.slate, gap: 16,
        transition: "background .15s",
      }}>
        <span>{f.q}</span>
        <span style={{
          color: C.green, fontSize: 20, lineHeight: 1, flexShrink: 0,
          width: 28, height: 28, borderRadius: "50%",
          background: isOpen ? `${C.green}15` : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
        }}>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div style={{ padding: "4px 20px 20px", fontFamily: "Inter, sans-serif", fontSize: 14.5, color: C.gray, lineHeight: 1.75 }}>
          {f.r}
        </div>
      )}
    </div>
  );
}
