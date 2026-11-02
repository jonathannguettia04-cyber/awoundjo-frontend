// src/pages/public/Adhesion.jsx
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, GESTIONNAIRE_PLANS, GESTIONNAIRE_NOTE, CONTACT } from "../../data/constants";

const NB_VERSEMENTS = 4; // échelonnement trimestriel (4 versements/an)

// ── Réservation 2027 ─────────────────────────────────────────────
// Les formules CLASSIC/AISANCE/HARMONY/PREMIUM (gestionnaire maladie)
// entrent en vigueur en 2027. En attendant, on propose une adhésion de
// réservation à prix fixe pour sécuriser sa place / son tarif.
const RESERVATION_FEE = 15000;

const API_BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || "Erreur serveur");
  return data;
}

const METHODES = [
  { id: "wave",   label: "Wave",         color: "#0094F0", bg: "#EBF7FF", logo: "W" },
  { id: "orange", label: "Orange Money", color: "#FF6600", bg: "#FFF3EB", logo: "O" },
  { id: "mtn",    label: "MTN MoMo",    color: "#FFCC00", bg: "#FFFBEB", logo: "M" },
  { id: "moov",   label: "Moov Money",  color: "#0066CC", bg: "#EBF2FF", logo: "Mv" },
];

const GUARANTEES = [
  "Sans avance de frais chez nos partenaires",
  "Couverture activée sous 24h",
  "Paiement 100% sécurisé via Jeko",
  "Résiliation sans frais dans les 7 jours",
];

const PATHOLOGIES = [
  "Diabète",
  "Hypertension artérielle",
  "Maladie cardiaque",
  "Insuffisance rénale",
  "Drépanocytose",
  "VIH / Sida",
  "Cancer",
  "Asthme sévère",
];

// ── Note sur les formules du gestionnaire maladie ───────────────
// Les tarifs CLASSIC/AISANCE/HARMONY/PREMIUM concernent les personnes sans
// pathologie déclarée (cf. GESTIONNAIRE_NOTE). Le montant de la surprime
// pathologie/âge ≥55 ans n'est pas publié par le gestionnaire : ces dossiers
// ne peuvent donc pas être chiffrés en ligne et sont orientés vers WhatsApp
// pour une étude et un tarif ajusté par le gestionnaire.

function Field({ label, required, children, error, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.slate }}>
        {label}{required && <span style={{ color: "#C0392B" }}> *</span>}
        {hint && <span style={{ fontWeight: 400, color: C.gray, marginLeft: 4 }}>({hint})</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#C0392B", fontFamily: "Inter, sans-serif" }}>{error}</span>}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
  border: "1.5px solid #E2E8F0", outline: "none", boxSizing: "border-box",
  fontFamily: "Inter, sans-serif", color: C.slate, background: "#FAFCFB",
};

const fcfa = (n) => new Intl.NumberFormat("fr-FR").format(n) + " F";

export default function Adhesion() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("formule");

  const [mode, setMode] = useState(
    searchParams.get("type") === "entreprise"  ? "entreprise"  :
    searchParams.get("type") === "reservation" ? "reservation" :
    "particulier"
  );

  // ── B2B : formulaire de demande de devis (pas de paiement direct) ──
  const [bizForm, setBizForm] = useState({
    entreprise: "", secteur: "", effectif: "1-10",
    contact: "", fonction: "", phone: "", email: "", ville: "", message: "",
  });
  const [bizErrors, setBizErrors] = useState({});
  const [bizSubmitting, setBizSubmitting] = useState(false);
  const [bizSent, setBizSent] = useState(false);

  function validateBiz() {
    const errs = {};
    if (!bizForm.entreprise.trim()) errs.entreprise = "Le nom de l'entreprise est requis.";
    if (!bizForm.contact.trim())    errs.contact    = "Le nom du contact est requis.";
    if (!bizForm.phone.trim())      errs.phone      = "Le numéro de téléphone est requis.";
    return errs;
  }

  function handleBizSubmit(e) {
    e.preventDefault();
    const errs = validateBiz();
    setBizErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBizSubmitting(true);
    const lines = [
      "Nouvelle demande de devis Entreprise — Awoundjô",
      `Entreprise : ${bizForm.entreprise}`,
      bizForm.secteur ? `Secteur : ${bizForm.secteur}` : null,
      `Effectif à couvrir : ${bizForm.effectif}`,
      `Contact : ${bizForm.contact}${bizForm.fonction ? " (" + bizForm.fonction + ")" : ""}`,
      `Téléphone : ${bizForm.phone}`,
      bizForm.email ? `Email : ${bizForm.email}` : null,
      bizForm.ville ? `Ville : ${bizForm.ville}` : null,
      bizForm.message ? `Message : ${bizForm.message}` : null,
    ].filter(Boolean).join("\n");

    const waUrl = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(lines)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // ── Tracking conversion : demande de devis entreprise ──────
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", {
        content_name: "Demande devis entreprise",
        content_category: "adhesion_entreprise",
      });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", {
        event_category: "adhesion",
        event_label: "entreprise",
      });
    }

    setBizSubmitting(false);
    setBizSent(true);
  }

  // ── Réservation 2027 : adhésion à prix fixe (6 000 F) ──────────
  const [resForm, setResForm] = useState({ name: "", phone: "", email: "", city: "" });
  const [resErrors, setResErrors] = useState({});
  const [resPlan, setResPlan] = useState(
    GESTIONNAIRE_PLANS.find(p => p.slug === preselected?.toUpperCase()) || GESTIONNAIRE_PLANS[0]
  );
  const [resComposition, setResComposition] = useState("solo");
  const [resMethode, setResMethode] = useState("orange");
  const [resAgreed, setResAgreed] = useState(false);
  const [resSubmitting, setResSubmitting] = useState(false);
  const [resFeedback, setResFeedback] = useState(null);

  function validateReservation() {
    const errs = {};
    if (!resForm.name.trim())  errs.name  = "Le nom complet est requis.";
    if (!resForm.phone.trim()) errs.phone = "Le numéro de téléphone est requis.";
    if (!resAgreed)            errs.agreed = "Veuillez accepter les conditions.";
    return errs;
  }

  async function handleReservationSubmit(e) {
    e.preventDefault();
    const errs = validateReservation();
    setResErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setResSubmitting(true);
    setResFeedback(null);
    const BASE = window.location.origin;

    try {
      const res = await apiFetch(`/api/payments/jeko/init`, {
        method: "POST",
        body: JSON.stringify({
          amount:       RESERVATION_FEE,
          description:  `Réservation Awoundjô 2027 — ${resPlan.name} (${resComposition === "famille" ? "Famille" : "Solo"})`,
          client_name:  resForm.name.trim(),
          client_phone: resForm.phone.trim(),
          type:         "reservation",
          role:         "RESERVATION_GESTIONNAIRE_2027",
          form_data: {
            name:      resForm.name.trim(),
            phone:     resForm.phone.trim(),
            email:     resForm.email.trim() || undefined,
            city:      resForm.city.trim()  || undefined,
            formule_souhaitee:      resPlan.slug,
            composition_souhaitee:  resComposition,
            montant_reservation:    RESERVATION_FEE,
          },
          jeko_method:  resMethode,
          success_url:  `${BASE}/adhesion/merci?reservation=1`,
          failure_url:  `${BASE}/adhesion/echec`,
        }),
      });

      const redirectUrl = res?.data?.redirect_url || res?.redirect_url;
      if (redirectUrl) {
        if (typeof window.fbq === "function") {
          window.fbq("track", "InitiateCheckout", {
            content_name: `Réservation 2027 — ${resPlan.name}`,
            value: RESERVATION_FEE,
            currency: "XOF",
          });
        }
        window.location.href = redirectUrl;
      } else {
        setResFeedback({ type: "err", msg: "Lien de paiement indisponible. Réessayez ou contactez-nous." });
      }
    } catch (e) {
      setResFeedback({ type: "err", msg: e.message });
    } finally {
      setResSubmitting(false);
    }
  }

  function handleModeChange(id) {
    setMode(id);
    if (id !== "famille") {
      // "Pour moi" ou "Pour mon entreprise" : adhésion individuelle (Solo),
      // pas de PNA enfant.
      setEnfantsSupplementaires(0);
      setEnfantsCharge(0);
    }
  }

  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "" });
  const [errors, setErrors] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(
    GESTIONNAIRE_PLANS.find(p => p.slug === preselected?.toUpperCase()) || GESTIONNAIRE_PLANS[0]
  );
  const [methode, setMethode] = useState("orange");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [pathologies, setPathologies] = useState([]);
  const [autrePathologie, setAutrePathologie] = useState("");
  const [enfantsSupplementaires, setEnfantsSupplementaires] = useState(0);
  const [enfantsCharge, setEnfantsCharge] = useState(0);

  const composition = mode === "famille" ? "famille" : "solo";
  const prixBase = selectedPlan.particulier[composition];
  // Dossier avec pathologie(s) déclarée(s) : le gestionnaire ne publie pas de
  // montant de surprime, donc le paiement en ligne n'est pas chiffrable — on
  // bascule vers une prise de contact WhatsApp pour ces cas (cf. handleSubmit).
  const nbPathologiesDeclarees = pathologies.length + (autrePathologie.trim() ? 1 : 0);

  function togglePathologie(nom) {
    setPathologies(prev =>
      prev.includes(nom) ? prev.filter(p => p !== nom) : [...prev, nom]
    );
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())  errs.name  = "Le nom complet est requis.";
    if (!form.phone.trim()) errs.phone = "Le numéro de téléphone est requis.";
    if (!agreed)            errs.agreed = "Veuillez accepter les conditions.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Pathologie(s) déclarée(s) : le gestionnaire ne publie pas de montant de
    // surprime, donc impossible de chiffrer un paiement en ligne fiable —
    // on oriente vers WhatsApp pour une étude de dossier et un tarif ajusté.
    if (nbPathologiesDeclarees > 0) {
      const lignes = [
        "Nouvelle demande d'adhésion Awoundjô — dossier avec pathologie(s) déclarée(s)",
        `Formule souhaitée : ${selectedPlan.name} (${composition === "famille" ? "Famille" : "Solo"})`,
        `Nom : ${form.name.trim()}`,
        `Téléphone : ${form.phone.trim()}`,
        `Pathologies déclarées : ${[...pathologies, ...(autrePathologie.trim() ? [autrePathologie.trim()] : [])].join(", ")}`,
      ].join("\n");
      window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(lignes)}`, "_blank", "noopener,noreferrer");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    const BASE = window.location.origin;
    const totalAmount = versement; // 1er versement trimestriel (1/4 de la prime annuelle)

    try {
      const res = await apiFetch(`/api/payments/jeko/init`, {
        method: "POST",
        body: JSON.stringify({
          amount:       totalAmount,
          description:  `Adhésion Awoundjô — ${selectedPlan.name} (1/${NB_VERSEMENTS} trimestriel)`,
          client_name:  form.name.trim(),
          client_phone: form.phone.trim(),
          type:         "adhesion",
          role:         "ADHESION_DIRECTE",
          form_data: {
            name:      form.name.trim(),
            phone:     form.phone.trim(),
            email:     form.email.trim() || undefined,
            city:      form.city.trim()  || undefined,
            plan_slug: selectedPlan.slug,
            grille: "particulier",
            composition,
            mode,
            enfants_supplementaires: enfantsSupplementaires,
            enfants_charge: enfantsCharge,
            montant_annuel: montantAnnuel,
            nombre_versements: NB_VERSEMENTS,
            frequence_versement: "trimestriel",
            versement_numero: 1,
            montant_initial: totalAmount,
          },
          jeko_method:  methode,
          success_url:  `${BASE}/adhesion/merci`,
          failure_url:  `${BASE}/adhesion/echec`,
        }),
      });

      const redirectUrl = res?.data?.redirect_url || res?.redirect_url;
      if (redirectUrl) {
        // ── Tracking conversion : paiement lancé (avant redirection Jeko) ──
        if (typeof window.fbq === "function") {
          window.fbq("track", "InitiateCheckout", {
            content_name: `Adhésion ${selectedPlan.name}`,
            content_category: mode,
            value: totalAmount,
            currency: "XOF",
          });
        }
        if (typeof window.gtag === "function") {
          window.gtag("event", "begin_checkout", {
            currency: "XOF",
            value: totalAmount,
            items: [{ item_name: selectedPlan.name, item_category: mode }],
          });
        }

        // ── Sauvegarde pour la page /adhesion/merci (confirmation + Purchase) ──
        // Le paiement direct (nouveau client) n'est pas encore en table `payments`
        // à ce stade (seulement `pending_payments`), donc pas d'endpoint fiable à
        // interroger depuis la page merci : on transmet les infos via sessionStorage.
        const txId = res?.data?.transaction_id || res?.transaction_id || null;
        try {
          sessionStorage.setItem("awj_last_adhesion", JSON.stringify({
            tx: txId,
            amount: totalAmount,
            plan: selectedPlan.name,
            mode,
            savedAt: Date.now(),
          }));
        } catch { /* sessionStorage indisponible (navigation privée) — pas bloquant */ }

        window.location.href = redirectUrl;
      } else {
        setFeedback({ type: "err", msg: "Lien de paiement indisponible. Réessayez ou contactez-nous." });
      }
    } catch (e) {
      setFeedback({ type: "err", msg: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  const prixBaseNum = Number(prixBase.replace(/\s/g, ""));
  const pnaEnfantSupplementaireUnitaire = Number(selectedPlan.particulier.pna_enfant_supplementaire.replace(/\s/g, ""));
  const pnaEnfantChargeUnitaire         = Number(selectedPlan.particulier.pna_enfant_charge.replace(/\s/g, ""));
  const montantPnaSupplementaire = mode === "famille" ? enfantsSupplementaires * pnaEnfantSupplementaireUnitaire : 0;
  const montantPnaCharge         = mode === "famille" ? enfantsCharge * pnaEnfantChargeUnitaire : 0;
  const montantAnnuel = prixBaseNum + montantPnaSupplementaire + montantPnaCharge;
  const versement      = Math.round(montantAnnuel / NB_VERSEMENTS);

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, #08172B 0%, ${C.green} 100%)`,
        padding: "120px 24px 56px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: `radial-gradient(circle at 70% 40%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Adhésion</div>
          {mode === "reservation" ? (
            <>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#FFFFFF", margin: "0 0 16px", lineHeight: 1.15 }}>
                Réservez votre place — <span style={{ color: C.gold }}>nouvelles formules 2027</span>
              </h1>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#A9C6E0", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
                CLASSIC, AISANCE, HARMONY, PREMIUM — nos nouvelles formules entrent en vigueur en 2027. Réservez dès maintenant votre place pour {fcfa(RESERVATION_FEE)}.
              </p>
            </>
          ) : mode === "entreprise" ? (
            <>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#FFFFFF", margin: "0 0 16px", lineHeight: 1.15 }}>
                Protégez vos salariés avec <span style={{ color: C.gold }}>Awoundjô</span>
              </h1>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#A9C6E0", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
                Une couverture santé collective pour réduire le turnover et fidéliser vos équipes. Un conseiller vous recontacte sous 24h avec un devis adapté.
              </p>
            </>
          ) : mode === "famille" ? (
            <>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#FFFFFF", margin: "0 0 16px", lineHeight: 1.15 }}>
                Protégez toute votre famille avec <span style={{ color: C.gold }}>Awoundjô</span>
              </h1>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#A9C6E0", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
                Conjoint, enfants : chaque bénéficiaire reçoit sa propre carte. Couverture activée sous 24h, paiement Mobile Money sécurisé.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#FFFFFF", margin: "0 0 16px", lineHeight: 1.15 }}>
                Rejoignez la mutuelle <span style={{ color: C.gold }}>Awoundjô</span>
              </h1>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#A9C6E0", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
                Adhésion en ligne. Couverture activée sous 24h. Paiement Mobile Money sécurisé.
              </p>
            </>
          )}

          {/* ── Bascule Particulier / Famille / Entreprise ── */}
          {mode !== "reservation" && (
            <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 50, padding: 4, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { id: "particulier", label: "Pour moi" },
                { id: "famille",     label: "Ma famille" },
                { id: "entreprise",  label: "Pour mon entreprise" },
              ].map(o => (
                <button key={o.id} type="button" onClick={() => handleModeChange(o.id)} style={{
                  border: "none", cursor: "pointer", borderRadius: 50, padding: "10px 20px",
                  fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13,
                  background: mode === o.id ? C.gold : "transparent",
                  color: mode === o.id ? "#08172B" : "#FFFFFF",
                  transition: "all .15s",
                }}>{o.label}</button>
              ))}
            </div>
          )}
        </div>
      </section>

      {mode === "reservation" ? (
        <section style={{ background: C.cream, padding: "56px 24px 96px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{ background: C.white, borderRadius: 18, padding: "32px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1.5px solid #E0EEF9" }}>
              <form onSubmit={handleReservationSubmit}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate, marginBottom: 6 }}>
                  Adhésion de réservation — {fcfa(RESERVATION_FEE)}
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray, lineHeight: 1.6, margin: "0 0 22px" }}>
                  Sécurisez votre place sur la formule de votre choix avant son entrée en vigueur en 2027. Ce montant de {fcfa(RESERVATION_FEE)} réserve votre dossier — le détail de l'adhésion complète (prime annuelle, versements trimestriels) vous sera communiqué à l'ouverture.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Formule souhaitée">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {GESTIONNAIRE_PLANS.map(plan => {
                        const active = resPlan.slug === plan.slug;
                        return (
                          <button key={plan.slug} type="button" onClick={() => setResPlan(plan)} style={{
                            padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                            border: `2px solid ${active ? plan.color : "#E2E8F0"}`,
                            background: active ? `${plan.color}0E` : C.white,
                            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13,
                            color: active ? plan.color : C.gray,
                          }}>{plan.name}</button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Composition souhaitée">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[{ id: "solo", label: "Solo" }, { id: "famille", label: "Famille" }].map(c => (
                        <button key={c.id} type="button" onClick={() => setResComposition(c.id)} style={{
                          padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                          border: `2px solid ${resComposition === c.id ? C.green : "#E2E8F0"}`,
                          background: resComposition === c.id ? `${C.green}0E` : C.white,
                          fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13,
                          color: resComposition === c.id ? C.green : C.gray,
                        }}>{c.label}</button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Nom complet" required error={resErrors.name}>
                    <input style={{ ...inputStyle, borderColor: resErrors.name ? "#C0392B" : "#E2E8F0" }}
                      value={resForm.name} onChange={e => setResForm({ ...resForm, name: e.target.value })}
                      placeholder="Ex : Aya Kouassi" />
                  </Field>
                  <Field label="Téléphone Mobile Money" required error={resErrors.phone} hint="pour le paiement">
                    <input style={{ ...inputStyle, borderColor: resErrors.phone ? "#C0392B" : "#E2E8F0" }}
                      value={resForm.phone} onChange={e => setResForm({ ...resForm, phone: e.target.value })}
                      placeholder="Ex : 07 00 00 00 00" />
                  </Field>
                  <div className="awj-grid-2" style={{ gap: 12 }}>
                    <Field label="Email" hint="optionnel">
                      <input style={inputStyle} type="email"
                        value={resForm.email} onChange={e => setResForm({ ...resForm, email: e.target.value })}
                        placeholder="vous@exemple.com" />
                    </Field>
                    <Field label="Ville" hint="optionnel">
                      <input style={inputStyle}
                        value={resForm.city} onChange={e => setResForm({ ...resForm, city: e.target.value })}
                        placeholder="Ex : Abidjan" />
                    </Field>
                  </div>

                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.slate, marginTop: 8 }}>Méthode de paiement</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {METHODES.map(m => {
                      const active = resMethode === m.id;
                      return (
                        <button key={m.id} type="button" onClick={() => setResMethode(m.id)} style={{
                          padding: "12px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                          border: `2px solid ${active ? m.color : "#E2E8F0"}`,
                          background: active ? m.bg : C.white,
                          fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13,
                          color: active ? m.color : C.gray,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}>
                          <span style={{ width: 24, height: 24, borderRadius: "50%", background: active ? m.color : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: active ? "#FFFFFF" : C.gray, flexShrink: 0 }}>{m.logo}</span>
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginTop: 4 }}>
                    <input type="checkbox" checked={resAgreed} onChange={e => setResAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: C.green }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, lineHeight: 1.6 }}>
                      J'accepte les <a href="/cgu" style={{ color: C.green, textDecoration: "none", fontWeight: 600 }}>conditions générales d'utilisation</a> et comprends que ce montant de {fcfa(RESERVATION_FEE)} réserve ma place, sans constituer le paiement de la prime annuelle.
                    </span>
                  </label>
                  {resErrors.agreed && <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#C0392B" }}>{resErrors.agreed}</div>}

                  {resFeedback?.type === "err" && (
                    <div style={{ background: "#FEF2F2", color: "#C0392B", padding: "12px 14px", borderRadius: 10, fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.5 }}>
                      ⚠️ {resFeedback.msg}
                    </div>
                  )}

                  <button type="submit" disabled={resSubmitting} style={{
                    width: "100%", background: resSubmitting ? C.gray : C.green, color: "#FFFFFF", border: "none",
                    fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 16,
                    padding: "17px", borderRadius: 12, cursor: resSubmitting ? "wait" : "pointer",
                    boxShadow: resSubmitting ? "none" : `0 6px 24px ${C.green}40`,
                    transition: "all .2s", letterSpacing: 0.2,
                  }}>
                    {resSubmitting ? "Redirection en cours..." : `💳 Réserver pour ${fcfa(RESERVATION_FEE)}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : mode === "entreprise" ? (
        <>
          {/* ── ÉTAPES ENTREPRISE ───────────────────────────────── */}
          <div style={{ background: C.white, borderBottom: "1.5px solid #E0EEF9", padding: "20px 24px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: 10, gap: 0 }}>
              {[
                { n: "1", label: "Votre entreprise" },
                { n: "2", label: "Vos besoins" },
                { n: "3", label: "Un conseiller vous recontacte" },
              ].map((s, i) => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: C.green, color: "#FFFFFF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 12,
                      flexShrink: 0,
                    }}>{s.n}</div>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: C.slate, whiteSpace: "nowrap" }}>{s.label}</span>
                  </div>
                  {i < 2 && <div style={{ width: 40, height: 1.5, background: "#E2E8F0", margin: "0 12px", flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>

          {/* ── FORMULAIRE ENTREPRISE ───────────────────────────── */}
          <section style={{ background: C.cream, padding: "56px 24px 96px" }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <div style={{ background: C.white, borderRadius: 18, padding: "32px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1.5px solid #E0EEF9" }}>

                {bizSent ? (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 19, color: C.slate, marginBottom: 8 }}>
                      Demande envoyée
                    </div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray, lineHeight: 1.6 }}>
                      Votre demande a été transmise sur WhatsApp à notre équipe commerciale. Un conseiller vous recontacte sous 24h avec un devis adapté à votre entreprise.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleBizSubmit}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate, marginBottom: 6 }}>
                      Demande de devis Entreprise
                    </div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray, lineHeight: 1.6, margin: "0 0 22px" }}>
                      Décrivez votre entreprise, un conseiller vous recontacte avec une formule et un tarif adaptés à votre effectif.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <Field label="Nom de l'entreprise" required error={bizErrors.entreprise}>
                        <input style={{ ...inputStyle, borderColor: bizErrors.entreprise ? "#C0392B" : "#E2E8F0" }}
                          value={bizForm.entreprise} onChange={e => setBizForm({ ...bizForm, entreprise: e.target.value })}
                          placeholder="Ex : Société Ivoire SARL" />
                      </Field>

                      <div className="awj-grid-2" style={{ gap: 12 }}>
                        <Field label="Secteur d'activité" hint="optionnel">
                          <input style={inputStyle}
                            value={bizForm.secteur} onChange={e => setBizForm({ ...bizForm, secteur: e.target.value })}
                            placeholder="Ex : BTP, commerce..." />
                        </Field>
                        <Field label="Effectif à couvrir">
                          <select style={inputStyle} value={bizForm.effectif} onChange={e => setBizForm({ ...bizForm, effectif: e.target.value })}>
                            {["1-10", "11-50", "51-200", "200+"].map(n => <option key={n} value={n}>{n} salariés</option>)}
                          </select>
                        </Field>
                      </div>

                      <div className="awj-grid-2" style={{ gap: 12 }}>
                        <Field label="Nom du contact" required error={bizErrors.contact}>
                          <input style={{ ...inputStyle, borderColor: bizErrors.contact ? "#C0392B" : "#E2E8F0" }}
                            value={bizForm.contact} onChange={e => setBizForm({ ...bizForm, contact: e.target.value })}
                            placeholder="Ex : Aya Kouassi" />
                        </Field>
                        <Field label="Fonction" hint="optionnel">
                          <input style={inputStyle}
                            value={bizForm.fonction} onChange={e => setBizForm({ ...bizForm, fonction: e.target.value })}
                            placeholder="Ex : RH, Directeur..." />
                        </Field>
                      </div>

                      <div className="awj-grid-2" style={{ gap: 12 }}>
                        <Field label="Téléphone" required error={bizErrors.phone}>
                          <input style={{ ...inputStyle, borderColor: bizErrors.phone ? "#C0392B" : "#E2E8F0" }}
                            value={bizForm.phone} onChange={e => setBizForm({ ...bizForm, phone: e.target.value })}
                            placeholder="Ex : 07 00 00 00 00" />
                        </Field>
                        <Field label="Email" hint="optionnel">
                          <input style={inputStyle} type="email"
                            value={bizForm.email} onChange={e => setBizForm({ ...bizForm, email: e.target.value })}
                            placeholder="vous@entreprise.com" />
                        </Field>
                      </div>

                      <Field label="Ville" hint="optionnel">
                        <input style={inputStyle}
                          value={bizForm.ville} onChange={e => setBizForm({ ...bizForm, ville: e.target.value })}
                          placeholder="Ex : Abidjan" />
                      </Field>

                      <Field label="Besoins spécifiques" hint="optionnel">
                        <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical", fontFamily: "Inter, sans-serif" }}
                          value={bizForm.message} onChange={e => setBizForm({ ...bizForm, message: e.target.value })}
                          placeholder="Ex : couverture maternité renforcée, dentaire, etc." />
                      </Field>
                    </div>

                    <button type="submit" disabled={bizSubmitting} style={{
                      width: "100%", marginTop: 24, background: bizSubmitting ? C.gray : C.green, color: "#FFFFFF", border: "none",
                      fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 16,
                      padding: "17px", borderRadius: 12, cursor: bizSubmitting ? "wait" : "pointer",
                      boxShadow: bizSubmitting ? "none" : `0 6px 24px ${C.green}40`,
                      transition: "all .2s", letterSpacing: 0.2,
                    }}>
                      {bizSubmitting ? "Envoi en cours..." : "📩 Demander un devis"}
                    </button>

                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray, textAlign: "center", marginTop: 12 }}>
                      Votre demande sera envoyée sur WhatsApp à notre équipe commerciale.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
      <>
      <div style={{ background: C.white, borderBottom: "1.5px solid #E0EEF9", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: 10, gap: 0 }}>
          {[
            { n: "1", label: "Vos informations" },
            { n: "2", label: "Votre formule" },
            { n: "3", label: "Paiement" },
          ].map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: C.green, color: "#FFFFFF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 12,
                  flexShrink: 0,
                }}>{s.n}</div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: C.slate, whiteSpace: "nowrap" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: 40, height: 1.5, background: "#E2E8F0", margin: "0 12px", flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── FORMULAIRE ───────────────────────────────────────── */}
      <section style={{ background: C.cream, padding: "56px 24px 96px" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <form onSubmit={handleSubmit} className="awj-grid-2" style={{ gap: 28, alignItems: "start" }}>

            {/* ── Colonne gauche ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Infos personnelles */}
              <div style={{ background: C.white, borderRadius: 18, padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1.5px solid #E0EEF9" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate, marginBottom: 20 }}>
                  1. Vos informations
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Nom complet" required error={errors.name}>
                    <input style={{ ...inputStyle, borderColor: errors.name ? "#C0392B" : "#E2E8F0" }}
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex : Aya Kouassi" />
                  </Field>
                  <Field label="Téléphone Mobile Money" required error={errors.phone} hint="pour le paiement">
                    <input style={{ ...inputStyle, borderColor: errors.phone ? "#C0392B" : "#E2E8F0" }}
                      value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="Ex : 07 00 00 00 00" />
                  </Field>
                  <div className="awj-grid-2" style={{ gap: 12 }}>
                    <Field label="Email" hint="optionnel">
                      <input style={inputStyle} type="email"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="vous@exemple.com" />
                    </Field>
                    <Field label="Ville">
                      <input style={inputStyle}
                        value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                        placeholder="Ex : Abidjan" />
                    </Field>
                  </div>
                  {mode === "famille" ? (
                    <div style={{ background: C.cream, borderRadius: 12, padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray }}>
                      Tarif Famille {selectedPlan.name}. Ajoutez des enfants supplémentaires ou à charge ci-dessous si besoin (Prime à la Naissance — PNA).
                    </div>
                  ) : (
                    <div style={{ background: C.cream, borderRadius: 12, padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray }}>
                      Adhésion individuelle (Solo) — 1 bénéficiaire (vous). Pour couvrir votre famille, choisissez <strong style={{ color: C.slate }}>« Ma famille »</strong> en haut de page.
                    </div>
                  )}

                  {mode === "famille" && (
                    <>
                      <Field label="Enfants supplémentaires (PNA)" hint={`+${fcfa(pnaEnfantSupplementaireUnitaire)}/an chacun`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <button type="button" onClick={() => setEnfantsSupplementaires(n => Math.max(0, n - 1))} style={{
                            width: 38, height: 38, borderRadius: 10, border: "1.5px solid #E2E8F0", background: C.white,
                            fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 18, color: C.slate, cursor: "pointer", flexShrink: 0,
                          }}>–</button>
                          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate, minWidth: 24, textAlign: "center" }}>{enfantsSupplementaires}</span>
                          <button type="button" onClick={() => setEnfantsSupplementaires(n => n + 1)} style={{
                            width: 38, height: 38, borderRadius: 10, border: "1.5px solid #E2E8F0", background: C.white,
                            fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 18, color: C.slate, cursor: "pointer", flexShrink: 0,
                          }}>+</button>
                        </div>
                      </Field>
                      <Field label="Enfants à charge (PNA)" hint={`+${fcfa(pnaEnfantChargeUnitaire)}/an chacun`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <button type="button" onClick={() => setEnfantsCharge(n => Math.max(0, n - 1))} style={{
                            width: 38, height: 38, borderRadius: 10, border: "1.5px solid #E2E8F0", background: C.white,
                            fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 18, color: C.slate, cursor: "pointer", flexShrink: 0,
                          }}>–</button>
                          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate, minWidth: 24, textAlign: "center" }}>{enfantsCharge}</span>
                          <button type="button" onClick={() => setEnfantsCharge(n => n + 1)} style={{
                            width: 38, height: 38, borderRadius: 10, border: "1.5px solid #E2E8F0", background: C.white,
                            fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 18, color: C.slate, cursor: "pointer", flexShrink: 0,
                          }}>+</button>
                        </div>
                      </Field>
                      {(enfantsSupplementaires > 0 || enfantsCharge > 0) && (
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: C.gray, margin: 0 }}>
                          Soit {fcfa(montantPnaSupplementaire + montantPnaCharge)} ajoutés à la prime annuelle (réparti sur les {NB_VERSEMENTS} versements trimestriels).
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Choix formule */}
              <div style={{ background: C.white, borderRadius: 18, padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1.5px solid #E0EEF9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate }}>2. Votre formule</div>
                  <Link to="/formules" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.green, textDecoration: "none", fontWeight: 600 }}>Comparer →</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {GESTIONNAIRE_PLANS.map(plan => {
                    const active = selectedPlan.slug === plan.slug;
                    const prixPlan = Number(plan.particulier[composition].replace(/\s/g, ""));
                    return (
                      <button key={plan.slug} type="button" onClick={() => setSelectedPlan(plan)} style={{
                        textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                        border: `2px solid ${active ? plan.color : "#E2E8F0"}`,
                        background: active ? `${plan.color}0E` : C.white,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "all .15s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: active ? plan.color : "#E2E8F0", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate }}>{plan.name}</div>
                            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: C.gray }}>{plan.couverture} Côte d'Ivoire — {composition === "famille" ? "Famille" : "Solo"}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 14, color: active ? plan.color : C.gray }}>
                            {fcfa(Math.round(prixPlan / NB_VERSEMENTS))}
                          </div>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray }}>/ trimestre</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, padding: "10px 14px", background: C.greenPale, borderRadius: 10, fontFamily: "Inter, sans-serif", fontSize: 12, color: C.green }}>
                  ℹ️ Prime annuelle payable en {NB_VERSEMENTS} versements trimestriels. {GESTIONNAIRE_NOTE.surprime_age}
                </div>
              </div>

              {/* Antécédents médicaux / grosses pathologies */}
              <div style={{ background: C.white, borderRadius: 18, padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1.5px solid #E0EEF9" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate, marginBottom: 6 }}>
                  Antécédents médicaux
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray, lineHeight: 1.6, margin: "0 0 18px" }}>
                  {GESTIONNAIRE_NOTE.surprime_pathologie} Le montant exact de la surprime est déterminé par le gestionnaire après étude du dossier — déclarez ici toute pathologie déjà diagnostiquée, notre équipe vous recontacte avec le tarif ajusté.
                </p>
                <div className="awj-grid-2" style={{ gap: 10, marginBottom: 16 }}>
                  {PATHOLOGIES.map(p => {
                    const checked = pathologies.includes(p);
                    return (
                      <label key={p} style={{
                        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                        padding: "10px 12px", borderRadius: 10,
                        border: `1.5px solid ${checked ? C.green : "#E2E8F0"}`,
                        background: checked ? `${C.green}0E` : C.white,
                        transition: "all .15s",
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => togglePathologie(p)}
                          style={{ flexShrink: 0, accentColor: C.green }} />
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.slate }}>{p}</span>
                      </label>
                    );
                  })}
                </div>
                <Field label="Autre pathologie" hint="optionnel, si non listée ci-dessus">
                  <input style={inputStyle}
                    value={autrePathologie} onChange={e => setAutrePathologie(e.target.value)}
                    placeholder="Précisez la pathologie" />
                </Field>
                {nbPathologiesDeclarees > 0 && (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#FFF7E6", border: "1.5px solid #F5D48A", borderRadius: 10, fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8A6416", lineHeight: 1.6 }}>
                    ⚠️ {nbPathologiesDeclarees} pathologie{nbPathologiesDeclarees > 1 ? "s" : ""} déclarée{nbPathologiesDeclarees > 1 ? "s" : ""} — le paiement en ligne est désactivé pour ce dossier. En validant, vous serez redirigé vers WhatsApp pour finaliser votre adhésion avec un conseiller.
                  </div>
                )}
              </div>
            </div>

            {/* ── Colonne droite : paiement ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: C.white, borderRadius: 18, padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1.5px solid #E0EEF9" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate, marginBottom: 20 }}>3. Paiement</div>

                {/* Récapitulatif */}
                <div style={{ background: C.cream, borderRadius: 14, padding: "18px 16px", marginBottom: 22 }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: C.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Récapitulatif</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray }}>
                      <span>Prime annuelle — {selectedPlan.name} ({composition === "famille" ? "Famille" : "Solo"})</span>
                      <span style={{ fontWeight: 600, color: C.slate }}>{fcfa(prixBaseNum)}</span>
                    </div>
                    {montantPnaSupplementaire > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray }}>
                        <span>Enfants supplémentaires ({enfantsSupplementaires} × {fcfa(pnaEnfantSupplementaireUnitaire)})</span>
                        <span style={{ fontWeight: 600, color: C.slate }}>{fcfa(montantPnaSupplementaire)}</span>
                      </div>
                    )}
                    {montantPnaCharge > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray }}>
                        <span>Enfants à charge ({enfantsCharge} × {fcfa(pnaEnfantChargeUnitaire)})</span>
                        <span style={{ fontWeight: 600, color: C.slate }}>{fcfa(montantPnaCharge)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray, fontWeight: 700 }}>
                      <span>Prime annuelle totale</span>
                      <span style={{ fontWeight: 700, color: C.slate }}>{fcfa(montantAnnuel)}</span>
                    </div>
                  </div>
                  <div style={{ borderTop: "1.5px solid #D6E6F5", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate }}>1er versement à payer aujourd'hui (1/{NB_VERSEMENTS})</span>
                    <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 22, color: C.green }}>{fcfa(versement)}</span>
                  </div>
                  <div style={{ marginTop: 8, fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray }}>
                    Puis {NB_VERSEMENTS - 1} versements trimestriels de {fcfa(versement)}
                  </div>
                </div>

                {/* Méthodes */}
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 12, letterSpacing: 0.3 }}>Méthode de paiement</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                  {METHODES.map(m => {
                    const active = methode === m.id;
                    return (
                      <button key={m.id} type="button" onClick={() => setMethode(m.id)} style={{
                        padding: "12px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                        border: `2px solid ${active ? m.color : "#E2E8F0"}`,
                        background: active ? m.bg : C.white,
                        fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13,
                        color: active ? m.color : C.gray,
                        transition: "all .15s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}>
                        <span style={{ width: 24, height: 24, borderRadius: "50%", background: active ? m.color : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: active ? "#FFFFFF" : C.gray, flexShrink: 0 }}>{m.logo}</span>
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                {/* Consentement */}
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginBottom: 18 }}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: C.green }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, lineHeight: 1.6 }}>
                    J'accepte les <a href="/cgu" style={{ color: C.green, textDecoration: "none", fontWeight: 600 }}>conditions générales d'utilisation</a> et la <a href="/confidentialite" style={{ color: C.green, textDecoration: "none", fontWeight: 600 }}>politique de confidentialité</a> d'Awoundjô.
                  </span>
                </label>
                {errors.agreed && <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#C0392B", marginBottom: 12 }}>{errors.agreed}</div>}

                {feedback?.type === "err" && (
                  <div style={{ background: "#FEF2F2", color: "#C0392B", padding: "12px 14px", borderRadius: 10, fontFamily: "Inter, sans-serif", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                    ⚠️ {feedback.msg}
                  </div>
                )}

                <button type="submit" disabled={submitting} style={{
                  width: "100%", background: submitting ? C.gray : C.green, color: "#FFFFFF", border: "none",
                  fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 16,
                  padding: "17px", borderRadius: 12, cursor: submitting ? "wait" : "pointer",
                  boxShadow: submitting ? "none" : `0 6px 24px ${C.green}40`,
                  transition: "all .2s", letterSpacing: 0.2,
                }}>
                  {submitting
                    ? "Redirection en cours..."
                    : nbPathologiesDeclarees > 0
                      ? "📲 Finaliser via WhatsApp"
                      : `💳 Payer ${fcfa(versement)} maintenant`}
                </button>

                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                  {GUARANTEES.map(g => (
                    <div key={g} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray }}>
                      <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>✓</span> {g}
                    </div>
                  ))}
                </div>
              </div>

              {/* Aide */}
              <div style={{ background: C.white, borderRadius: 16, padding: "18px 20px", border: "1.5px solid #E0EEF9", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>💬</div>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.slate, marginBottom: 4 }}>Besoin d'aide ?</div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray, margin: 0, lineHeight: 1.55 }}>
                    Notre équipe est disponible sur{" "}
                    <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ color: C.green, fontWeight: 600, textDecoration: "none" }}>WhatsApp</a>
                    {" "}ou au <a href={`tel:${CONTACT.phone.replace(/\s/g,"")}`} style={{ color: C.green, fontWeight: 600, textDecoration: "none" }}>{CONTACT.phone}</a>.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
      </>
      )}

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
