// src/pages/public/Adhesion.jsx
// Formulaire public d'adhésion directe (sans code de parrainage).
// Appelle directement POST /api/payments/jeko/init (jekoInitWeb), avec
// role="ADHESION_DIRECTE" — traité par le webhook Jeko via
// businessController.createClientFromAdhesionDirecte (voir /patches).
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, PLANS } from "../../data/constants";

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
  { id: "wave",   label: "Wave",         color: "#0094F0", bg: "#EBF7FF" },
  { id: "orange", label: "Orange Money", color: "#FF6600", bg: "#FFF3EB" },
  { id: "mtn",    label: "MTN MoMo",     color: "#FFCC00", bg: "#FFFBEB" },
  { id: "moov",   label: "Moov Money",   color: "#0066CC", bg: "#EBF2FF" },
];

function Field({ label, required, children, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: C.slate }}>
        {label}{required && <span style={{ color: "#C0392B" }}> *</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: "#C0392B", fontFamily: "Inter, sans-serif" }}>{error}</span>}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
  border: "1.5px solid #E2E8F0", outline: "none", boxSizing: "border-box",
  fontFamily: "Inter, sans-serif", color: C.slate,
};

export default function Adhesion() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("formule");

  const [form, setForm] = useState({ name: "", phone: "", city: "" });
  const [errors, setErrors] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(
    PLANS.find(p => p.name.toLowerCase() === preselected) || PLANS[1]
  );
  const [methode, setMethode] = useState("orange");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function validate() {
    const errs = {};
    if (!form.name.trim())  errs.name  = "Le nom complet est requis.";
    if (!form.phone.trim()) errs.phone = "Le numéro de téléphone est requis.";
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
    const totalAmount = total; // adhésion + 1ère mensualité, payés en un seul versement

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
            city:      form.city.trim() || undefined,
            plan_slug: selectedPlan.name.toUpperCase(),
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
        setFeedback({ type: "err", msg: "Lien de paiement indisponible. Réessayez." });
      }
    } catch (e) {
      setFeedback({ type: "err", msg: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  const total = Number(selectedPlan.adhesion.replace(/\s/g, "")) + Number(selectedPlan.mensualite.replace(/\s/g, ""));
  const fcfa = (n) => new Intl.NumberFormat("fr-FR").format(n) + " F";

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.cream, padding: "140px 24px 96px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>ADHÉSION</div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: C.slate, margin: 0 }}>
              Rejoignez la mutuelle Awoundjô
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, marginTop: 10 }}>
              Adhésion + 1ère mensualité en un seul paiement, sans échelonnement.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="awj-grid-2" style={{ gap: 28, alignItems: "start" }}>
            {/* ── Colonne gauche : infos + formule ────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: C.white, borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.05)" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, color: C.slate, marginBottom: 16 }}>Vos informations</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Nom complet" required error={errors.name}>
                    <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex : Aya Kouassi" />
                  </Field>
                  <Field label="Téléphone" required error={errors.phone}>
                    <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Ex : 07 00 00 00 00" />
                  </Field>
                  <Field label="Ville">
                    <input style={inputStyle} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ex : Abidjan" />
                  </Field>
                </div>
              </div>

              <div style={{ background: C.white, borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.05)" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, color: C.slate, marginBottom: 16 }}>Votre formule</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PLANS.map(plan => {
                    const active = selectedPlan.name === plan.name;
                    return (
                      <button key={plan.name} type="button" onClick={() => setSelectedPlan(plan)} style={{
                        textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                        border: `2px solid ${active ? plan.color : "#E2E8F0"}`,
                        background: active ? `${plan.color}0D` : C.white,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "all .15s",
                      }}>
                        <div>
                          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: C.slate }}>{plan.name}</div>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray }}>{plan.couverture} de couverture</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: plan.color }}>{fcfa(Number(plan.mensualite.replace(/\s/g,"")))}/mois</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Colonne droite : paiement ───────────────── */}
            <div style={{ background: C.white, borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.05)" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, color: C.slate, marginBottom: 16 }}>Paiement</div>

              <div style={{ background: C.cream, borderRadius: 12, padding: 16, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, marginBottom: 6 }}>
                  <span>Frais d'adhésion</span><span>{selectedPlan.adhesion} F</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, marginBottom: 10 }}>
                  <span>1ère mensualité ({selectedPlan.name})</span><span>{selectedPlan.mensualite} F</span>
                </div>
                <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate }}>Total à payer</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 18, color: C.green }}>{fcfa(total)}</span>
                </div>
              </div>

              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: C.slate, marginBottom: 10 }}>Méthode de paiement</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                {METHODES.map(m => {
                  const active = methode === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => setMethode(m.id)} style={{
                      padding: "12px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                      border: `2px solid ${active ? m.color : "#E2E8F0"}`,
                      background: active ? m.bg : C.white,
                      fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: active ? m.color : C.slate,
                      transition: "all .15s",
                    }}>{m.label}</button>
                  );
                })}
              </div>

              {feedback?.type === "err" && (
                <div style={{ background: "#FEF2F2", color: "#C0392B", padding: "10px 14px", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: 13, marginBottom: 14 }}>
                  {feedback.msg}
                </div>
              )}

              <button type="submit" disabled={submitting} style={{
                width: "100%", background: C.green, color: C.white, border: "none",
                fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
                padding: "15px", borderRadius: 10, cursor: submitting ? "wait" : "pointer",
                opacity: submitting ? .7 : 1,
              }}>
                {submitting ? "Traitement..." : `💳 Payer ${fcfa(total)} maintenant`}
              </button>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray, textAlign: "center", marginTop: 12 }}>
                Paiement sécurisé. Aucun échelonnement — adhésion activée immédiatement après paiement.
              </p>
            </div>
          </form>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
