// src/pages/public/Adhesion.jsx
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, PLANS, CONTACT } from "../../data/constants";

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

// Valeurs par défaut (repli) tant que /api/settings/public n'a pas répondu,
// ou si l'appel échoue. Source de vérité normale : table `settings` (backoffice),
// doit rester en sync avec SURPRIME_ENFANT dans routes/clientPortalRoutes.js.
const SURCHARGE_PAR_PATHOLOGIE_DEFAULT = 10000;
const CAUTION_MOIS_DEFAULT = 3;
const SURCHARGE_ENFANT_PAR_FORMULE_DEFAULT = {
  ESSENTIELLE: 2000,
  IVOIRIENNE: 3000,
  TURQUOISE: 5000,
};
const BASE_CHILDREN_CAP_DEFAULT = 3;

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

  const [mode, setMode] = useState(searchParams.get("type") === "entreprise" ? "entreprise" : "particulier");

  // ── Paramètres backoffice (surprimes, cap enfants...) ──────────────
  // Chargés depuis /api/settings/public ; on garde les valeurs par défaut
  // en repli tant que la réponse n'est pas arrivée (ou en cas d'échec réseau).
  const [settings, setSettings] = useState({
    surcharge_pathologie: SURCHARGE_PAR_PATHOLOGIE_DEFAULT,
    caution_mois: CAUTION_MOIS_DEFAULT,
    surprime_enfant: SURCHARGE_ENFANT_PAR_FORMULE_DEFAULT,
    base_children_cap: BASE_CHILDREN_CAP_DEFAULT,
  });

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/settings/public`)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data || res; // selon la forme exacte de la réponse ok()
        setSettings((prev) => ({
          surcharge_pathologie: data?.surcharge_pathologie ?? prev.surcharge_pathologie,
          caution_mois: data?.caution_mois ?? prev.caution_mois,
          surprime_enfant: data?.surprime_enfant ?? prev.surprime_enfant,
          base_children_cap: data?.base_children_cap ?? prev.base_children_cap,
        }));
      })
      .catch((e) => {
        console.warn("[Adhesion] /api/settings/public indisponible, valeurs par défaut utilisées:", e.message);
      });
    return () => { cancelled = true; };
  }, []);

  const SURCHARGE_PAR_PATHOLOGIE = Number(settings.surcharge_pathologie) || SURCHARGE_PAR_PATHOLOGIE_DEFAULT;
  const CAUTION_MOIS = Number(settings.caution_mois) || CAUTION_MOIS_DEFAULT;

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
    setBizSubmitting(false);
    setBizSent(true);
  }

  function handleModeChange(id) {
    setMode(id);
    if (id === "famille") {
      const familyPlan = PLANS.find(p => p.name.toLowerCase() === "ivoirienne");
      if (familyPlan) setSelectedPlan(familyPlan);
      // Défaut d'affichage (2 parents + cap enfants de base) — n'affecte pas le calcul
      // monétaire, qui lui utilise bien settings.base_children_cap / surprime_enfant.
      if (form.nb_beneficiaires === "1") setForm(f => ({ ...f, nb_beneficiaires: "5" }));
    } else {
      // "Pour moi" ou "Pour mon entreprise" : adhésion individuelle, pas de bénéficiaires
      // multiples ni de surprime enfants — on repart sur des valeurs propres.
      setForm(f => ({ ...f, nb_beneficiaires: "1" }));
      setExtraEnfants(0);
    }
  }

  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", nb_beneficiaires: "1" });
  const [errors, setErrors] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(
    PLANS.find(p => p.name.toLowerCase() === preselected?.toLowerCase()) || PLANS[1]
  );
  const [methode, setMethode] = useState("orange");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [pathologies, setPathologies] = useState([]);
  const [autrePathologie, setAutrePathologie] = useState("");
  const [extraEnfants, setExtraEnfants] = useState(0);

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

    setSubmitting(true);
    setFeedback(null);
    const BASE = window.location.origin;
    const totalAmount = total;

    try {
      const res = await apiFetch(`/api/payments/jeko/init`, {
        method: "POST",
        body: JSON.stringify({
          amount:       totalAmount,
          description:  `Adhésion Awoundjô — ${selectedPlan.name}`,
          client_name:  form.name.trim(),
          client_phone: form.phone.trim(),
          type:         "adhesion",
          role:         "ADHESION_DIRECTE",
          form_data: {
            name:      form.name.trim(),
            phone:     form.phone.trim(),
            email:     form.email.trim() || undefined,
            city:      form.city.trim()  || undefined,
            plan_slug: selectedPlan.name.toUpperCase(),
            mode,
            nb_beneficiaires: parseInt(form.nb_beneficiaires) || 1,
            enfants_supplementaires: extraEnfants,
            surcharge_enfants: surchargeEnfants,
            pathologies_declarees: [...pathologies, ...(autrePathologie.trim() ? [autrePathologie.trim()] : [])],
            surcharge_pathologie: surchargePathologie,
            caution_pathologie: caution,
            montant_initial: totalAmount,
          },
          jeko_method:  methode,
          success_url:  `${BASE}/adhesion/merci`,
          failure_url:  `${BASE}/adhesion/echec`,
        }),
      });

      const redirectUrl = res?.data?.redirect_url || res?.redirect_url;
      if (redirectUrl) {
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

  const adhesion   = Number(selectedPlan.adhesion.replace(/\s/g, ""));
  const mensualite = Number(selectedPlan.mensualite.replace(/\s/g, ""));
  const nbPathologies      = pathologies.length + (autrePathologie.trim() ? 1 : 0);
  const surchargePathologie = nbPathologies * SURCHARGE_PAR_PATHOLOGIE;
  const caution             = nbPathologies > 0 ? mensualite * CAUTION_MOIS : 0;
  const surchargeEnfantUnitaire = (settings.surprime_enfant?.[selectedPlan.name.toUpperCase()]) || 0;
  const surchargeEnfants   = mode === "famille" ? extraEnfants * surchargeEnfantUnitaire : 0;
  const total      = adhesion + mensualite + surchargePathologie + caution + surchargeEnfants;

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
          {mode === "entreprise" ? (
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
        </div>
      </section>

      {mode === "entreprise" ? (
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
                    <Field label="Nombre de bénéficiaires" hint="vous inclus">
                      <select style={inputStyle} value={form.nb_beneficiaires} onChange={e => setForm({ ...form, nb_beneficiaires: e.target.value })}>
                        {["1","2","3","4","5","6+"].map(n => <option key={n} value={n}>{n} personne{n !== "1" ? "s" : ""}</option>)}
                      </select>
                    </Field>
                  ) : (
                    <div style={{ background: C.cream, borderRadius: 12, padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray }}>
                      Adhésion individuelle — 1 bénéficiaire (vous). Pour couvrir votre conjoint et vos enfants, choisissez <strong style={{ color: C.slate }}>« Ma famille »</strong> en haut de page.
                    </div>
                  )}

                  {mode === "famille" && (
                    <Field label="Enfants supplémentaires" hint={`au-delà des ${form.nb_beneficiaires} bénéficiaires ci-dessus`}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button type="button" onClick={() => setExtraEnfants(n => Math.max(0, n - 1))} style={{
                          width: 38, height: 38, borderRadius: 10, border: "1.5px solid #E2E8F0", background: C.white,
                          fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 18, color: C.slate, cursor: "pointer", flexShrink: 0,
                        }}>–</button>
                        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: C.slate, minWidth: 24, textAlign: "center" }}>{extraEnfants}</span>
                        <button type="button" onClick={() => setExtraEnfants(n => n + 1)} style={{
                          width: 38, height: 38, borderRadius: 10, border: "1.5px solid #E2E8F0", background: C.white,
                          fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 18, color: C.slate, cursor: "pointer", flexShrink: 0,
                        }}>+</button>
                      </div>
                      {extraEnfants > 0 && (
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: C.gray, margin: "6px 0 0" }}>
                          Surprime de {fcfa(surchargeEnfantUnitaire)} / mois par enfant supplémentaire pour la formule {selectedPlan.name} — soit {fcfa(surchargeEnfants)} ajoutés ce mois-ci.
                        </p>
                      )}
                    </Field>
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
                  {PLANS.map(plan => {
                    const active = selectedPlan.name === plan.name;
                    return (
                      <button key={plan.name} type="button" onClick={() => setSelectedPlan(plan)} style={{
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
                            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: C.gray }}>{plan.couverture} de couverture</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 14, color: active ? plan.color : C.gray }}>
                            {fcfa(Number(plan.mensualite.replace(/\s/g, "")))}
                          </div>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray }}>/ mois</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, padding: "10px 14px", background: C.greenPale, borderRadius: 10, fontFamily: "Inter, sans-serif", fontSize: 12, color: C.green }}>
                  ℹ️ La couverture prend effet 30 jours après l'adhésion (hors urgences).
                </div>
              </div>

              {/* Antécédents médicaux / grosses pathologies */}
              <div style={{ background: C.white, borderRadius: 18, padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1.5px solid #E0EEF9" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: C.slate, marginBottom: 6 }}>
                  Antécédents médicaux
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.gray, lineHeight: 1.6, margin: "0 0 18px" }}>
                  Déclarez ici toute pathologie lourde déjà diagnostiquée. Chaque pathologie déclarée entraîne une surcharge de {fcfa(SURCHARGE_PAR_PATHOLOGIE)} et le paiement d'une caution équivalente à {CAUTION_MOIS} mois de cotisation, réglée en une fois à l'adhésion.
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
                {nbPathologies > 0 && (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#FFF7E6", border: "1.5px solid #F5D48A", borderRadius: 10, fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8A6416", lineHeight: 1.6 }}>
                    ⚠️ {nbPathologies} pathologie{nbPathologies > 1 ? "s" : ""} déclarée{nbPathologies > 1 ? "s" : ""} — surcharge de {fcfa(surchargePathologie)} + caution de {fcfa(caution)} ({CAUTION_MOIS} mois de cotisation) ajoutées au paiement.
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
                      <span>Frais d'adhésion (unique)</span>
                      <span style={{ fontWeight: 600, color: C.slate }}>{selectedPlan.adhesion} F</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray }}>
                      <span>1ère mensualité — {selectedPlan.name}</span>
                      <span style={{ fontWeight: 600, color: C.slate }}>{selectedPlan.mensualite} F</span>
                    </div>
                    {surchargeEnfants > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray }}>
                        <span>Enfants supplémentaires ({extraEnfants} × {fcfa(surchargeEnfantUnitaire)})</span>
                        <span style={{ fontWeight: 600, color: C.slate }}>{fcfa(surchargeEnfants)}</span>
                      </div>
                    )}
                    {nbPathologies > 0 && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray }}>
                          <span>Surcharge pathologie ({nbPathologies} × {fcfa(SURCHARGE_PAR_PATHOLOGIE)})</span>
                          <span style={{ fontWeight: 600, color: C.slate }}>{fcfa(surchargePathologie)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.gray }}>
                          <span>Caution ({CAUTION_MOIS} mois de cotisation)</span>
                          <span style={{ fontWeight: 600, color: C.slate }}>{fcfa(caution)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ borderTop: "1.5px solid #D6E6F5", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate }}>Total à payer aujourd'hui</span>
                    <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 22, color: C.green }}>{fcfa(total)}</span>
                  </div>
                  <div style={{ marginTop: 8, fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray }}>
                    Puis {selectedPlan.mensualite} F / mois à partir du 2ème mois
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
                  {submitting ? "Redirection en cours..." : `💳 Payer ${fcfa(total)} maintenant`}
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
