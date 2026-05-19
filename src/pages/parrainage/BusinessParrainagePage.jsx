// src/pages/parrainage/BusinessParrainagePage.jsx
// ─────────────────────────────────────────────────────────────
//  Page publique d'inscription client via lien de parrainage Business
//  Accessible via /parrainage/:token  (sans auth)
//
//  Flux :
//    [1] GET  /api/parrainage/:token
//            → { parrain: { name, phone, role }, plans: [...], expires_at }
//    [2] Client saisit ses infos + choisit sa formule + méthode paiement
//    [3] POST /api/parrainage/:token/inscrire
//            body: { name, phone, city, plan_slug, jeko_method, success_url, failure_url }
//            → { data: { redirect_url } }  → window.location.href (Jeko)
//    [4] Retour Jeko → /parrainage/:token/merci?m=MUTUAL_NUMBER  (succès)
//                    → /parrainage/:token/echec?client=ID         (échec)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";

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

// ── Palette ──────────────────────────────────────────────────
const G = {
  green:  "#00875A",
  greenL: "#E6F6F0",
  greenD: "#006644",
  gold:   "#D4A017",
  red:    "#C0392B",
  redL:   "#FFF0F0",
  text:   "#1A1A2E",
  muted:  "#6B7280",
  border: "#E5E7EB",
  bg:     "#F4F7F5",
  card:   "#FFFFFF",
};

// ── Méthodes de paiement ─────────────────────────────────────
const METHODES = [
  { id: "wave",   label: "Wave",         color: "#0094F0", bg: "#EBF7FF", icon: "〜" },
  { id: "orange", label: "Orange Money", color: "#FF6600", bg: "#FFF3EB", icon: "◉" },
  { id: "mtn",    label: "MTN MoMo",     color: "#FFCC00", bg: "#FFFBEB", icon: "◎" },
  { id: "moov",   label: "Moov Money",   color: "#0066CC", bg: "#EBF2FF", icon: "◍" },
];

const fcfa = (n) => new Intl.NumberFormat("fr-FR").format(Number(n) || 0) + " FCFA";
const PLAN_ICONS = { ESSENTIELLE: "🌿", IVOIRIENNE: "🌍", TURQUOISE: "💎" };
const planIcon = (slug) => PLAN_ICONS[slug?.toUpperCase()] || "📋";

// ── Icônes SVG ────────────────────────────────────────────────
const IconCheck = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconArrow = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>;
const IconStar  = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// ── Stepper ───────────────────────────────────────────────────
function Stepper({ current }) {
  const steps = ["Mes informations", "Ma formule", "Paiement"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 24 }}>
      {steps.map((label, i) => {
        const idx    = i + 1;
        const done   = idx < current;
        const active = idx === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: done || active ? G.green : G.border,
                color: done || active ? "#fff" : G.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900, transition: "all .3s",
                boxShadow: active ? `0 0 0 4px ${G.greenL}` : "none",
              }}>
                {done ? <IconCheck /> : idx}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 400,
                color: active ? G.green : done ? G.greenD : G.muted,
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 40, height: 2, marginBottom: 14,
                background: done ? G.green : G.border,
                transition: "background .3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field + Input ─────────────────────────────────────────────
function Field({ label, required, hint, children, error: fieldErr }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: G.text }}>
        {label}{required && <span style={{ color: G.red }}> *</span>}
        {hint && <span style={{ fontSize: 11, fontWeight: 400, color: G.muted, marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
      {fieldErr && <span style={{ fontSize: 11, color: G.red }}>{fieldErr}</span>}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, disabled }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14,
        border: `1.5px solid ${focus ? G.green : G.border}`,
        outline: "none", background: disabled ? "#F9FAFB" : "#fff",
        fontFamily: "'DM Sans', sans-serif", color: G.text, boxSizing: "border-box",
        transition: "border-color .15s",
      }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

// ══════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function BusinessParrainagePage() {
  const { token }      = useParams();
  const [searchParams] = useSearchParams();
  const mutualNumber   = searchParams.get("m");       // retour succès Jeko
  const paymentFailed  = searchParams.get("client");  // retour échec Jeko

  // ── Données initiales ─────────────────────────────────────
  const [pageData,  setPageData]  = useState(null); // { parrain, plans, expires_at }
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // ── Étapes : "infos" | "formule" | "success" | "echec"
  const [step, setStep] = useState("infos");

  // ── Formulaire ────────────────────────────────────────────
  const [form,       setForm]       = useState({ name: "", phone: "", city: "" });
  const [formErrors, setFormErrors] = useState({});

  // ── Plan + méthode ────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [methode,      setMethode]      = useState("orange");

  // ── Paiement échelonné ───────────────────────────────────
  const [echelonne,     setEchelonne]     = useState(false);
  const [montantInitial, setMontantInitial] = useState("");
  const [montantError,   setMontantError]   = useState(null);

  // ── Soumission ────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [feedback,   setFeedback]   = useState(null);

  // ── Chargement page ───────────────────────────────────────
  const fetchPage = useCallback(async () => {
    try {
      setError(null);
      const res = await apiFetch(`/api/business/parrainage/${token}`);
      const d   = res.data ?? res;
      setPageData(d);
      if (d.plans?.length) setSelectedPlan(d.plans[0]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  // ── Retour Jeko ───────────────────────────────────────────
  useEffect(() => {
    if (mutualNumber)  setStep("success");
    if (paymentFailed) setStep("echec");
  }, [mutualNumber, paymentFailed]);

  // ── Validation ────────────────────────────────────────────
  function validateForm() {
    const errs = {};
    if (!form.name.trim())  errs.name  = "Le nom est requis.";
    if (!form.phone.trim()) errs.phone = "Le téléphone est requis.";
    return errs;
  }

  function handleInfosNext() {
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length === 0) setStep("formule");
  }

  // ── Inscription + redirection Jeko en une seule requête ──
  async function handleInscrireEtPayer() {
    if (!selectedPlan || !methode) return;

    // Validation montant échelonné
    if (echelonne) {
      const mi = Number(montantInitial);
      if (!montantInitial || isNaN(mi) || mi < 500) {
        setMontantError("Montant minimum : 500 FCFA");
        return;
      }
      const adhesion = Number(selectedPlan.adhesion_price) || 0;
      if (mi > adhesion) {
        setMontantError(`Maximum : ${fcfa(adhesion)} (prix d'adhésion)`);
        return;
      }
      setMontantError(null);
    }

    setSubmitting(true);
    setFeedback(null);

    const BASE = window.location.origin;

    try {
      const res = await apiFetch(`/api/business/parrainage/${token}/inscrire`, {
        method: "POST",
        body: JSON.stringify({
          name:               form.name.trim(),
          phone:              form.phone.trim(),
          city:               form.city.trim() || undefined,
          plan_slug:          selectedPlan.slug,
          jeko_method:        methode,
          paiement_echelonne: echelonne,
          montant_initial:    echelonne ? Number(montantInitial) : undefined,
          success_url: `${BASE}/parrainage/${token}/merci`,
          failure_url: `${BASE}/parrainage/${token}/echec`,
        }),
      });

      const payload     = res.data ?? res;
      const redirectUrl =
        payload?.data?.redirect_url ||
        payload?.redirect_url       ||
        payload?.payment_url;

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

  // ── Rendu états globaux ───────────────────────────────────
  if (loading) return <LoaderScreen />;
  if (error)   return <ErrorScreen message={error} />;
  if (!pageData) return null;

  const { parrain, plans } = pageData;
  const stepNum = { infos: 1, formule: 2, success: 3, echec: 3 }[step] || 1;

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-wrap">

        {/* ── En-tête ─────────────────────────────────── */}
        <header className="cp-header">
          <div className="cp-logo">
            <span className="cp-logo-icon">✦</span>
            <span>Awoundjô</span>
          </div>
          <p className="cp-header-sub">Adhésion en ligne · Espace sécurisé</p>
        </header>

        {/* ── Bannière parrain ─────────────────────────── */}
        <div className="cp-agent-banner">
          <div className="cp-agent-avatar">
            {(parrain?.name || "A")[0].toUpperCase()}
          </div>
          <div className="cp-agent-info">
            <p className="cp-agent-label">Parrainé par</p>
            <p className="cp-agent-name">{parrain?.name || "Établissement Awoundjô"}</p>
            {parrain?.role && (
              <p className="cp-agent-code">Réseau <strong>{parrain.role}</strong></p>
            )}
          </div>
          <div className="cp-agent-shield">🏢</div>
        </div>

        {/* ── Card principale ──────────────────────────── */}
        <div className="cp-card">

          {step !== "success" && step !== "echec" && <Stepper current={stepNum} />}

          {/* ═══════════════════════════════════════════
              ÉTAPE 1 — Informations personnelles
          ═══════════════════════════════════════════ */}
          {step === "infos" && (
            <div className="cp-section">
              <div className="cp-section-title">
                <span className="cp-step-badge">1</span>
                Vos informations personnelles
              </div>
              <p className="cp-section-sub">
                Ces informations serviront à créer votre dossier d'adhésion.
              </p>

              <div className="cp-form-grid">
                <Field label="Nom complet" required error={formErrors.name}>
                  <Input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex : Kouadio Amoin Marie"
                  />
                </Field>

                <Field label="Téléphone" required hint="(WhatsApp de préférence)" error={formErrors.phone}>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+225 07 00 00 00 00"
                  />
                </Field>

                <Field label="Ville de résidence">
                  <Input
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Ex : Abidjan"
                  />
                </Field>
              </div>

              <button className="cp-btn-primary" onClick={handleInfosNext}>
                Continuer → Choisir ma formule
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              ÉTAPE 2 — Formule + méthode de paiement
          ═══════════════════════════════════════════ */}
          {step === "formule" && (
            <div className="cp-section">
              <button className="cp-btn-back" onClick={() => setStep("infos")}>
                <IconArrow /> Retour
              </button>
              <div className="cp-section-title">
                <span className="cp-step-badge">2</span>
                Choisissez votre formule
              </div>
              <p className="cp-section-sub">
                Sélectionnez la formule qui correspond le mieux à vos besoins.
              </p>

              {/* Plans */}
              <div className="cp-plans-list">
                {plans.map((plan) => {
                  const slug       = plan.slug?.toUpperCase();
                  const isSelected = selectedPlan?.id === plan.id;
                  const adhesion   = Number(plan.adhesion_price) || 0;
                  return (
                    <div
                      key={plan.id}
                      className={`cp-plan-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="cp-plan-radio">
                        <div className={`cp-radio-dot ${isSelected ? "active" : ""}`} />
                      </div>
                      <div className="cp-plan-body">
                        <div className="cp-plan-name">{planIcon(slug)} {plan.name}</div>
                        <div className="cp-plan-meta">
                          {plan.coverage_percent}% de couverture
                          {adhesion === 0
                            ? " · Adhésion gratuite 🎉"
                            : ` · Adhésion ${fcfa(adhesion)}`}
                        </div>
                      </div>
                      <div className="cp-plan-price">
                        <span className="cp-plan-amount">{fcfa(plan.monthly_price)}</span>
                        <span className="cp-plan-period">/ mois</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Récap */}
              {selectedPlan && (
                <div className="cp-recap">
                  <p className="cp-recap-title">📋 Récapitulatif</p>
                  {[
                    { label: "Formule",              value: `${planIcon(selectedPlan.slug?.toUpperCase())} ${selectedPlan.name}` },
                    { label: "Cotisation mensuelle", value: fcfa(selectedPlan.monthly_price) },
                    { label: "Frais d'adhésion",     value: Number(selectedPlan.adhesion_price) === 0 ? "Gratuit 🎉" : fcfa(selectedPlan.adhesion_price), highlight: true },
                  ].map((row, i) => (
                    <div key={i} className={`cp-recap-row ${row.highlight ? "highlight" : ""}`}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Toggle paiement échelonné ─────────────── */}
              {selectedPlan && Number(selectedPlan.adhesion_price) > 0 && (
                <div style={{
                  border: `1.5px solid ${echelonne ? "var(--green)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  transition: "border-color .2s",
                }}>
                  {/* Header toggle */}
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", cursor: "pointer",
                      background: echelonne ? "var(--green-light)" : "#FAFAFA",
                      transition: "background .2s",
                    }}
                    onClick={() => { setEchelonne(e => !e); setMontantError(null); }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                        💰 Paiement échelonné
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        Commencez à partir de 500 FCFA, payez le reste à votre rythme
                      </span>
                    </div>
                    {/* Switch */}
                    <div style={{
                      width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                      background: echelonne ? "var(--green)" : "var(--border)",
                      position: "relative", transition: "background .2s",
                    }}>
                      <div style={{
                        position: "absolute", top: 3,
                        left: echelonne ? 23 : 3,
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#fff", transition: "left .2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                      }} />
                    </div>
                  </div>

                  {/* Champ montant initial */}
                  {echelonne && (
                    <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                        Montant à payer aujourd'hui <span style={{ color: "var(--red)" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          min="500"
                          max={Number(selectedPlan.adhesion_price) || 99999}
                          value={montantInitial}
                          onChange={e => { setMontantInitial(e.target.value); setMontantError(null); }}
                          placeholder="Ex : 5000"
                          style={{
                            width: "100%", padding: "10px 60px 10px 14px",
                            border: `1.5px solid ${montantError ? "var(--red)" : "var(--green)"}`,
                            borderRadius: 8, fontSize: 14, outline: "none",
                            fontFamily: "'DM Sans', sans-serif", color: "var(--text)",
                            boxSizing: "border-box",
                          }}
                        />
                        <span style={{
                          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          fontSize: 12, color: "var(--muted)", fontWeight: 600,
                        }}>FCFA</span>
                      </div>
                      {montantError && (
                        <span style={{ fontSize: 11, color: "var(--red)" }}>⚠ {montantError}</span>
                      )}
                      {/* Aperçu reste à payer */}
                      {montantInitial && !isNaN(Number(montantInitial)) && Number(montantInitial) >= 500 && (
                        <div style={{
                          background: "#F0FDF4", border: "1px solid #BBF7D0",
                          borderRadius: 8, padding: "8px 12px",
                          display: "flex", justifyContent: "space-between", fontSize: 12,
                        }}>
                          <span style={{ color: "var(--muted)" }}>Reste à payer après :</span>
                          <strong style={{ color: "var(--green-dark)" }}>
                            {fcfa(Math.max(0, (Number(selectedPlan.adhesion_price) || 0) - Number(montantInitial)))}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Méthode de paiement */}
              <p className="cp-step-title">Choisissez votre moyen de paiement</p>
              <div className="cp-methodes-grid">
                {METHODES.map((m) => (
                  <button
                    key={m.id}
                    className={`cp-methode-card ${methode === m.id ? "selected" : ""}`}
                    style={{ "--m-color": m.color, "--m-bg": m.bg }}
                    onClick={() => setMethode(m.id)}
                  >
                    <span className="cp-methode-icon">{m.icon}</span>
                    <span className="cp-methode-label">{m.label}</span>
                  </button>
                ))}
              </div>

              {feedback && (
                <div className={`cp-feedback cp-feedback-${feedback.type}`}>
                  {feedback.type === "ok" ? <IconCheck /> : "⚠"} {feedback.msg}
                </div>
              )}

              <button
                className="cp-btn-primary"
                disabled={!selectedPlan || !methode || submitting}
                onClick={handleInscrireEtPayer}
              >
                {submitting
                  ? <><span className="cp-spinner" /> Création du dossier…</>
                  : echelonne
                    ? <>💰 S'inscrire et payer {montantInitial ? fcfa(montantInitial) : "un premier versement"}</>
                    : <>💳 S'inscrire et payer maintenant</>}
              </button>

              <p className="cp-legal">
                🔒 Vous serez redirigé vers la plateforme sécurisée Jeko · Orange · Wave · MTN · Moov
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              SUCCÈS
          ═══════════════════════════════════════════ */}
          {step === "success" && (
            <div className="cp-section cp-success-section">
              <div className="cp-success-icon">
                <span style={{ display: "flex", gap: 2, color: G.gold }}>
                  <IconStar /><IconStar /><IconStar />
                </span>
              </div>
              <p className="cp-success-title">Bienvenue dans la mutuelle Awoundjô ! 🎉</p>
              <p className="cp-success-body">
                {searchParams.get("mode") === "collecte"
                  ? "Votre premier versement a bien été reçu. Vous pourrez compléter le reste via votre parrain ou depuis l'espace client."
                  : "Votre paiement a bien été reçu. Votre adhésion est en cours de traitement."}
              </p>
              {mutualNumber && (
                <div className="cp-success-num">
                  <p className="cp-success-num-label">Votre numéro mutualiste</p>
                  <p className="cp-success-num-value">{mutualNumber}</p>
                </div>
              )}
              <div className="cp-success-steps">
                {[
                  { icon: "✅", label: "Dossier créé",    done: true },
                  { icon: "💳", label: "Paiement reçu",   done: true },
                  { icon: "⏳", label: "Validation admin", done: false },
                  { icon: "🎉", label: "Activation",       done: false },
                ].map((s, i) => (
                  <div key={i} className={`cp-success-step ${s.done ? "done" : ""}`}>
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="cp-success-agent">
                Parrainé par <strong>{parrain?.name}</strong> — vous serez contacté prochainement.
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              ÉCHEC
          ═══════════════════════════════════════════ */}
          {step === "echec" && (
            <div className="cp-section cp-success-section">
              <div className="cp-success-icon" style={{ background: G.redL, color: G.red, fontSize: 28 }}>
                ❌
              </div>
              <p className="cp-success-title" style={{ color: G.red }}>Paiement échoué</p>
              <p className="cp-success-body">
                Votre dossier a été créé mais le paiement n'a pas abouti.
                Contactez votre parrain pour régulariser votre adhésion.
              </p>
              <p className="cp-success-agent">
                Parrain : <strong>{parrain?.name}</strong>
                {parrain?.phone && <> · 📞 {parrain.phone}</>}
              </p>
            </div>
          )}

        </div>

        <footer className="cp-footer">
          🔒 Lien sécurisé · Awoundjô Mutuelle
        </footer>
      </div>
    </>
  );
}

// ── Loader ────────────────────────────────────────────────────
function LoaderScreen() {
  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-wrap cp-centered">
        <div className="cp-logo">
          <span className="cp-logo-icon">✦</span>
          <span>Awoundjô</span>
        </div>
        <div className="cp-spinner-lg" />
        <p style={{ color: G.muted, fontSize: 13, marginTop: 12 }}>Chargement de votre espace…</p>
      </div>
    </>
  );
}

// ── Erreur ────────────────────────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-wrap cp-centered">
        <div style={{ textAlign: "center", maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 40 }}>⚠️</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: G.text }}>
            Lien invalide ou expiré
          </p>
          <p style={{ fontSize: 14, color: G.red }}>{message}</p>
          <p style={{ fontSize: 13, color: G.muted }}>
            Contactez votre parrain Awoundjô pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  :root {
    --green:       #00875A;
    --green-light: #E6F6F0;
    --green-dark:  #006644;
    --red:         #C0392B;
    --red-light:   #FFF0F0;
    --text:        #1A1A2E;
    --muted:       #6B7280;
    --border:      #E5E7EB;
    --bg:          #F4F7F5;
    --card:        #FFFFFF;
    --radius:      14px;
    --radius-sm:   10px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cp-wrap {
    min-height: 100vh; background: var(--bg);
    font-family: 'DM Sans', sans-serif; color: var(--text);
    padding: 20px 16px 48px; display: flex; flex-direction: column;
    align-items: center; gap: 16px;
  }
  .cp-centered { justify-content: center; }

  .cp-header { text-align: center; }
  .cp-logo {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Sora', sans-serif; font-weight: 800; font-size: 20px; color: var(--green);
  }
  .cp-logo-icon { font-size: 22px; }
  .cp-header-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

  .cp-agent-banner {
    width: 100%; max-width: 480px;
    background: linear-gradient(135deg, #f0faf5, #e6f6f0);
    border: 1px solid #b3deca; border-radius: var(--radius);
    padding: 14px 16px; display: flex; align-items: center; gap: 12px;
  }
  .cp-agent-avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: var(--green); color: #fff;
    font-family: 'Sora', sans-serif; font-weight: 700; font-size: 20px;
    display: flex; align-items: center; justify-content: center;
  }
  .cp-agent-info  { flex: 1; min-width: 0; }
  .cp-agent-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
  .cp-agent-name  { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15px; color: var(--text); }
  .cp-agent-code  { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .cp-agent-shield { font-size: 22px; flex-shrink: 0; }

  .cp-card {
    width: 100%; max-width: 480px;
    background: var(--card); border-radius: var(--radius);
    box-shadow: 0 4px 24px rgba(0,0,0,.07); padding: 24px 20px;
  }

  .cp-section       { display: flex; flex-direction: column; gap: 16px; }
  .cp-section-title {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Sora', sans-serif; font-weight: 700; font-size: 16px;
  }
  .cp-step-badge {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    background: var(--green); color: #fff;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .cp-section-sub { font-size: 13px; color: var(--muted); line-height: 1.5; }
  .cp-step-title  { font-size: 13px; font-weight: 700; color: var(--text); }
  .cp-form-grid   { display: flex; flex-direction: column; gap: 12px; }

  .cp-plans-list { display: flex; flex-direction: column; gap: 8px; }
  .cp-plan-card {
    display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px;
    border: 2px solid var(--border); border-radius: var(--radius-sm);
    cursor: pointer; transition: border-color .15s, background .15s;
  }
  .cp-plan-card:hover    { border-color: var(--green); background: var(--green-light); }
  .cp-plan-card.selected { border-color: var(--green); background: var(--green-light); }
  .cp-plan-radio { padding-top: 2px; flex-shrink: 0; }
  .cp-radio-dot {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    transition: border-color .15s;
  }
  .cp-radio-dot.active { border-color: var(--green); }
  .cp-radio-dot.active::after {
    content: ''; width: 9px; height: 9px; border-radius: 50%;
    background: var(--green); display: block;
  }
  .cp-plan-body   { flex: 1; min-width: 0; }
  .cp-plan-name   { font-weight: 700; font-size: 14px; color: var(--text); }
  .cp-plan-meta   { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .cp-plan-price  { text-align: right; flex-shrink: 0; }
  .cp-plan-amount { display: block; font-family: 'Sora', sans-serif; font-weight: 800; font-size: 15px; color: var(--text); }
  .cp-plan-period { font-size: 11px; color: var(--muted); }

  .cp-recap { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
  .cp-recap-title {
    padding: 10px 14px; font-size: 12px; font-weight: 700;
    color: var(--muted); text-transform: uppercase; letter-spacing: .5px;
    border-bottom: 1px solid var(--border); background: #FAFAFA;
  }
  .cp-recap-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; font-size: 13px; border-bottom: 1px solid var(--border);
  }
  .cp-recap-row:last-child  { border-bottom: none; }
  .cp-recap-row.highlight   { background: var(--green-light); color: var(--green-dark); }
  .cp-recap-row.highlight strong { color: var(--green-dark); }
  .cp-recap-row strong      { color: var(--text); }

  .cp-methodes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .cp-methode-card {
    border: 2px solid var(--border); border-radius: var(--radius-sm);
    background: var(--card); padding: 12px 10px; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    transition: border-color .15s, background .15s, transform .1s;
    font-family: 'DM Sans', sans-serif;
  }
  .cp-methode-card:hover    { border-color: var(--m-color, var(--green)); background: var(--m-bg, var(--green-light)); }
  .cp-methode-card.selected { border-color: var(--m-color, var(--green)); background: var(--m-bg, var(--green-light)); transform: scale(1.02); }
  .cp-methode-icon  { font-size: 22px; color: var(--m-color, var(--green)); }
  .cp-methode-label { font-size: 12px; font-weight: 600; color: var(--text); text-align: center; }

  .cp-feedback {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 11px 14px; border-radius: var(--radius-sm); font-size: 13px;
  }
  .cp-feedback-ok  { background: var(--green-light); color: var(--green-dark); }
  .cp-feedback-err { background: var(--red-light);   color: var(--red); }

  .cp-btn-primary {
    width: 100%; padding: 14px; border: none; border-radius: var(--radius-sm);
    background: var(--green); color: #fff;
    font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .2s, transform .1s;
    box-shadow: 0 2px 12px rgba(0,135,90,.25);
  }
  .cp-btn-primary:hover:not(:disabled)  { background: var(--green-dark); }
  .cp-btn-primary:active:not(:disabled) { transform: scale(.98); }
  .cp-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
  .cp-btn-back {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; color: var(--muted);
    font-size: 13px; cursor: pointer; padding: 0;
    font-family: 'DM Sans', sans-serif; align-self: flex-start;
  }
  .cp-btn-back:hover { color: var(--text); }

  .cp-success-section { align-items: center; text-align: center; padding: 32px 24px; }
  .cp-success-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--green-light); color: var(--green);
    display: flex; align-items: center; justify-content: center; font-size: 28px;
    margin-bottom: 4px;
  }
  .cp-success-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; }
  .cp-success-body  { font-size: 14px; color: var(--muted); line-height: 1.5; }
  .cp-success-num {
    background: var(--green-light); border: 1px solid #b3deca;
    border-radius: 10px; padding: 14px 20px; width: 100%; text-align: center;
  }
  .cp-success-num-label { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); margin-bottom: 4px; }
  .cp-success-num-value { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 900; color: var(--green-dark); }
  .cp-success-steps {
    display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; width: 100%;
  }
  .cp-success-step {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 8px 12px; border-radius: 8px;
    background: #F9FAFB; border: 1px solid var(--border);
    font-size: 11px; font-weight: 600; color: var(--muted);
    flex: 1; min-width: 70px;
  }
  .cp-success-step.done { background: var(--green-light); color: var(--green-dark); border-color: #b3deca; }
  .cp-success-step span:first-child { font-size: 16px; }
  .cp-success-agent { font-size: 12px; color: var(--muted); line-height: 1.5; }

  .cp-legal  { font-size: 11px; color: var(--muted); text-align: center; line-height: 1.5; }
  .cp-footer { margin-top: 20px; font-size: 12px; color: var(--muted); text-align: center; }

  .cp-spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
    border-radius: 50%; animation: cp-spin .7s linear infinite;
  }
  .cp-spinner-lg {
    display: block; width: 40px; height: 40px;
    border: 3px solid var(--border); border-top-color: var(--green);
    border-radius: 50%; animation: cp-spin .8s linear infinite; margin: 0 auto;
  }
  @keyframes cp-spin { to { transform: rotate(360deg); } }

  @media (max-width: 480px) {
    .cp-wrap { padding: 16px 12px 36px; }
    .cp-methodes-grid { grid-template-columns: 1fr 1fr; }
    .cp-success-steps { gap: 4px; }
    .cp-success-step  { min-width: 60px; padding: 6px 8px; }
  }
`;
