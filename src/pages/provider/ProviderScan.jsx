// src/pages/provider/ProviderScan.jsx
// Flux principal de prise en charge — 6 étapes :
//   1. Identifier le patient
//   2. Vérifier l'éligibilité + choisir l'acte du catalogue
//   3. Saisir le montant + valider
//   4. (Consultation uniquement) Soumettre les examens complémentaires
//   5. (Clinique uniquement) Saisir l'ordonnance
//   6. Confirmation finale

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  providerClientAPI, providerServiceAPI,
  providerCatalogAPI, providerPrescriptionAPI,
  providerExamAPI,
  getProviderData,
} from "../../providerApi";

// ─── Constantes ──────────────────────────────────────────────
const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const PLAN_ORDER = { BASIQUE: 0, ESSENTIELLE: 1, IVOIRIENNE: 2, TURQUOISE: 3 };

const PLAN_CONFIG = {
  BASIQUE:     { color: "#64748B", bg: "#F8FAFC", border: "#CBD5E1", label: "Basique" },
  ESSENTIELLE: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Essentielle" },
  IVOIRIENNE:  { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "Ivoirienne" },
  TURQUOISE:   { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", label: "Turquoise" },
};

// ProviderScan.jsx — CATEGORY_LABELS à corriger
const CATEGORY_LABELS = {
  consultation_generaliste:    { icon: "🩺",  label: "Consultation générale" },
  consultation_specialiste:    { icon: "👨‍⚕️", label: "Consultation spécialiste" },
  consultation_urgence:        { icon: "🚨",  label: "Urgence" },
  hospitalisation_hebergement: { icon: "🏥",  label: "Hospitalisation" },
  hospitalisation_chirurgie:   { icon: "🔪",  label: "Chirurgie" },
  pharmacie:                   { icon: "💊",  label: "Pharmacie" },
  radiologie_imagerie:         { icon: "🩻",  label: "Radiologie / Imagerie" },
  analyses_biologiques:        { icon: "🔬",  label: "Analyses biologiques" },
  optique:                     { icon: "👓",  label: "Optique" },
  dentisterie:                 { icon: "🦷",  label: "Dentaire" },
  maternite_simple:            { icon: "🤱",  label: "Maternité — Accouchement simple" },
  maternite_multiple:          { icon: "🤱",  label: "Maternité — Gémellaire" },
  maternite_chirurgicale:      { icon: "🤱",  label: "Maternité — Césarienne" },
  transport_ambulance:         { icon: "🚑",  label: "Transport sanitaire" },
};

// Et PRESCRIPTION_REQUIRED_CATEGORIES :
const PRESCRIPTION_REQUIRED_CATEGORIES = [
  "consultation_generaliste",
  "consultation_specialiste",
  "consultation_urgence",
  "hospitalisation_hebergement",
  "hospitalisation_chirurgie",
  "maternite_simple",
  "maternite_multiple",
  "maternite_chirurgicale",
];

const STEPS = [
  { n: 1, label: "Identification",  sub: "Trouver l'assuré" },
  { n: 2, label: "Acte",           sub: "Choisir dans le catalogue" },
  { n: 3, label: "Validation",     sub: "Montant & confirmation" },
  { n: 4, label: "Examens",        sub: "Accord préalable" },
  { n: 5, label: "Ordonnance",     sub: "Saisie obligatoire" },
  { n: 6, label: "Confirmation",   sub: "Prise en charge validée" },
];

// Catégories qui déclenchent l'étape examens
const EXAM_REQUIRED_CATEGORIES = [
  "consultation_generaliste",
  "consultation_specialiste",
  "consultation_urgence",
];

// Catégories d'actes lourds : ne passent PAS par la validation directe (étape 3).
// Elles sont déviées vers l'écran séparé "Accord préalable" (table prior_authorization_requests).
// Doit rester synchronisé avec REQUIRES_PREAUTH_CATEGORIES côté providerController.js
// (moins analyses_biologiques/radiologie_imagerie, déjà gérées par le circuit exam_requests existant).
const PRIOR_AUTH_REQUIRED_CATEGORIES = [
  "hospitalisation_hebergement",
  "hospitalisation_chirurgie",
  "maternite_chirurgicale",
];

function needsPriorAuth(entry) {
  if (!entry) return false;
  return entry.requires_preauth || PRIOR_AUTH_REQUIRED_CATEGORIES.includes(entry.category);
}

// ─── Composant principal ─────────────────────────────────────
export default function ProviderScan() {
  const navigate  = useNavigate();
  const provider  = getProviderData();

  const [step,        setStep]       = useState(1);
  const [query,       setQuery]      = useState("");
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState("");

  // Patient
  const [client,      setClient]     = useState(null);
  const [eligibility, setEligibility]= useState(null);

  // Catalogue
  const [catalog,     setCatalog]    = useState([]);
  const [catLoading,  setCatLoading] = useState(false);
  const [selectedCat, setSelectedCat]= useState(null); // entrée catalogue choisie

  // Acte
  const [description, setDescription]= useState("");
  const [doctorName,  setDoctorName]  = useState("");
  const [totalAmount, setTotalAmount]= useState("");
  const [saving,      setSaving]     = useState(false);
  const [service,     setService]    = useState(null);

  // Ordonnance
  const [prescription,    setPrescription]    = useState("");
  const [prescSaving,     setPrescSaving]     = useState(false);
  const [prescDone,       setPrescDone]       = useState(false);
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);

  // Solde annuel global (retourné après chaque acte enregistré)
  const [soldeAnnuel,     setSoldeAnnuel]     = useState(null);

  // Examens
  const [examRequired,    setExamRequired]    = useState(false);
  const [examCatalog,     setExamCatalog]     = useState([]);
  const [examSelected,    setExamSelected]    = useState([]);
  const [examPrices,      setExamPrices]      = useState({}); // { catalog_code: montant_string }
  const [examAutre,       setExamAutre]       = useState({ active: false, nom: "", prix: "" }); // examen "Autre"
  const [examSaving,      setExamSaving]      = useState(false);
  const [examDone,        setExamDone]        = useState(false);
  const [examResults,     setExamResults]     = useState([]);
  const [examSoldes,      setExamSoldes]      = useState({});
  const [examTotals,      setExamTotals]      = useState({ consultation_amount: 0, estimated_exams_total: 0, estimated_grand_total: 0 });

  // ── Chargement catalogue quand client connu ───────────────
  useEffect(() => {
    if (!client) return;
    setCatLoading(true);
    providerCatalogAPI.getAll(client.plan)
      .then(r => setCatalog(r.data.catalog || []))
      .catch(() => setError("Impossible de charger le catalogue des actes"))
      .finally(() => setCatLoading(false));
  }, [client]);

  // ── Chargement catalogue examens quand service créé ─────
  useEffect(() => {
    if (!service || !examRequired) return;
    const examEntries = catalog.filter(e =>
      ["analyses_biologiques", "radiologie_imagerie"].includes(e.category)
    );
    setExamCatalog(examEntries);
  }, [service, examRequired, catalog]);

  // ── Chargement des soldes examens à l'entrée de l'étape 4 ─
  useEffect(() => {
    if (!client || examCatalog.length === 0) return;
    const cats = ["analyses_biologiques", "radiologie_imagerie"];
    cats.forEach(cat => {
      const firstEntry = examCatalog.find(e => e.category === cat);
      if (!firstEntry) return;
      providerClientAPI.eligibility(client.id, firstEntry.code, client.dependent_id)
        .then(r => setExamSoldes(prev => ({ ...prev, [cat]: r.data })))
        .catch(() => {});
    });
  }, [examCatalog, client]);
  useEffect(() => {
    if (!client || !selectedCat) return;
    providerClientAPI.eligibility(client.id, selectedCat.code, client.dependent_id)
      .then(r => setEligibility(r.data))
      .catch(() => {});
  }, [selectedCat, client]);

  // ── Recherche patient ─────────────────────────────────────
  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError("");
    try {
      const q = query.trim().toUpperCase();
      // Essai scan direct par numéro mutualiste
      try {
        const { data } = await providerClientAPI.scan(q);
        setClient(data.client);
        setStep(2); return;
      } catch {}
      // Sinon recherche full-text
      const { data } = await providerClientAPI.search(query);
      if (!data.clients?.length) { setError("Aucun assuré trouvé avec cette recherche."); return; }
      setClient(data.clients[0]);
      setStep(2);
    } catch { setError("Assuré introuvable. Vérifiez le numéro mutualiste ou le téléphone."); }
    finally { setLoading(false); }
  }

  // ── Sélection d'un acte dans le catalogue ────────────────
  function handleSelectAct(entry) {
    setSelectedCat(entry);
    setEligibility(null); // reset éligibilité, se rechargera via useEffect
  }

  // ── Validation de l'acte ─────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!client || !selectedCat || !totalAmount) return;
    if (!doctorName.trim()) { setError("Le nom du praticien est obligatoire"); return; }
    setSaving(true); setError("");
    try {
      const { data } = await providerServiceAPI.create({
        client_id:    client.id,
        dependent_id: client.dependent_id,
        catalog_code: selectedCat.code,
        description,
        doctor_name:  doctorName.trim(),
        total_amount: Number(totalAmount),
      });
      setService(data.service);
      if (data.solde_annuel) setSoldeAnnuel(data.solde_annuel);
      const needsPresc = PRESCRIPTION_REQUIRED_CATEGORIES.includes(selectedCat.category);
      const needsExam  = EXAM_REQUIRED_CATEGORIES.includes(selectedCat.category);
      setPrescriptionRequired(needsPresc);
      setExamRequired(needsExam);
      // Après validation : examens d'abord (si consultation), puis ordonnance, puis confirmation
      if (needsExam) setStep(4);
      else if (needsPresc) setStep(5);
      else setStep(6);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally { setSaving(false); }
  }

  // ── Saisie ordonnance ─────────────────────────────────────
  async function handlePrescription(e) {
    e.preventDefault();
    if (!prescription.trim()) return;
    setPrescSaving(true); setError("");
    try {
      await providerPrescriptionAPI.create({
        service_id: service.id,
        content:    prescription.trim(),
        catalog_codes: [],
      });
      setPrescDone(true);
      setStep(6);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la sauvegarde de l'ordonnance");
    } finally { setPrescSaving(false); }
  }

  // ── Toggle sélection d'un examen du catalogue ────────────
  function toggleExam(code) {
    setExamSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  // ── Soumettre les examens (appel batch unique) ────────────
  async function handleExams(e) {
    e.preventDefault();
    const hasAutre = examAutre.active && examAutre.nom.trim();
    if (!examSelected.length && !hasAutre) {
      setStep(prescriptionRequired ? 5 : 6);
      return;
    }
    setExamSaving(true); setError("");
    try {
      // Construire le tableau batch
      const exams = [];

      for (const catalog_code of examSelected) {
        const entry = examCatalog.find(e => e.code === catalog_code);
        exams.push({
          catalog_code,
          description:      entry?.label || catalog_code,
          estimated_amount: Number(examPrices[catalog_code]) || null,
          is_autre:         false,
        });
      }

      if (hasAutre) {
        const proxyCode = examCatalog.find(e => e.category === "analyses_biologiques")?.code
          || examCatalog[0]?.code;
        if (proxyCode) {
          exams.push({
            catalog_code:     proxyCode,
            is_autre:         true,
            autre_label:      examAutre.nom.trim(),
            estimated_amount: Number(examAutre.prix) || null,
          });
        }
      }

      const { data } = await providerExamAPI.create({
        service_id: service.id,
        exams,
      });

      setExamTotals({
        consultation_amount:   data.consultation_amount   ?? Number(service.total_amount),
        estimated_exams_total: data.estimated_exams_total ?? 0,
        estimated_grand_total: data.estimated_grand_total ?? Number(service.total_amount),
      });
      if (data.solde_annuel) setSoldeAnnuel(data.solde_annuel);
      setExamResults(data.exam_requests || []);
      setExamDone(true);
      setStep(prescriptionRequired ? 5 : 6);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la soumission des examens");
    } finally { setExamSaving(false); }
  }

  // ── Passer les examens ────────────────────────────────────
  function skipExams() {
    setStep(prescriptionRequired ? 5 : 6);
  }

  // ── Passer l'ordonnance (non bloquant) ───────────────────
  function skipPrescription() {
    setStep(6);
  }

  // ── Reset complet ─────────────────────────────────────────
  function reset() {
    setStep(1); setQuery(""); setClient(null); setEligibility(null);
    setCatalog([]); setSelectedCat(null); setError("");
    setDescription(""); setDoctorName(""); setTotalAmount(""); setService(null);
    setPrescription(""); setPrescDone(false); setPrescriptionRequired(false);
    setExamRequired(false); setExamCatalog([]); setExamSelected([]); setExamPrices({});
    setExamAutre({ active: false, nom: "", prix: "" });
    setExamDone(false); setExamResults([]); setExamSoldes({});
    setExamTotals({ consultation_amount: 0, estimated_exams_total: 0, estimated_grand_total: 0 });
    setSoldeAnnuel(null);
  }

  // ── Calculs financiers ────────────────────────────────────
  const amount      = Number(totalAmount) || 0;
  const coveragePct = eligibility?.coverage_pct ?? 50;
  const mutualPart  = Math.round(amount * coveragePct / 100);
  const clientPart  = amount - mutualPart;
  const planConfig  = client ? (PLAN_CONFIG[client.plan] || PLAN_CONFIG.ESSENTIELLE) : null;

  // ── Grouper le catalogue par catégorie ───────────────────
  const catalogByCategory = catalog.reduce((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {});

  // ── Étapes visibles selon le type d'acte ────────────────
  const visibleSteps = STEPS.filter(s => {
    if (s.n === 4) return examRequired;
    if (s.n === 5) return prescriptionRequired;
    return true;
  });

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 32 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ps-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .ps-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        @media (max-width: 640px) {
          .ps-grid2 { grid-template-columns: 1fr !important; }
          .ps-grid3 { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ── Progress bar ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, alignItems: "center" }}>
        {visibleSteps.map((s, i) => {
          const active = step === s.n;
          const done   = step > s.n;
          return (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < visibleSteps.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: done ? "#22C55E" : active ? "#185FA5" : "#E2E8F0",
                  color: done || active ? "#fff" : "#94A3B8",
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ display: window.innerWidth < 480 ? "none" : "block" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: active ? "#185FA5" : done ? "#22C55E" : "#94A3B8", margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: 10, color: "#CBD5E1", margin: 0 }}>{s.sub}</p>
                </div>
              </div>
              {i < visibleSteps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? "#22C55E" : "#E2E8F0", borderRadius: 2, minWidth: 16 }} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ══ ÉTAPE 1 — Identification ══ */}
      {step === 1 && (
        <div style={s.card}>
          <h2 style={s.stepTitle}>🔍 Identifier l'assuré</h2>
          <p style={s.stepDesc}>Numéro mutualiste, téléphone ou nom</p>
          <form onSubmit={handleSearch} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Ex : AWJ-2024-001234 ou 0707080910"
                style={s.input}
              />
              <button type="submit" disabled={loading} style={s.btnPrimary}>
                {loading ? <Spinner /> : "🔍"}
              </button>
            </div>
          </form>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 12, color: "#64748B" }}>
            💡 Vous pouvez aussi scanner la carte de l'assuré via{" "}
            <span style={{ color: "#185FA5", fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/etablissement/scan")}>
              le lecteur QR
            </span>
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 2 — Catalogue + éligibilité ══ */}
      {step === 2 && client && (
        <div>
          {/* Fiche assuré */}
          <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: planConfig?.bg, border: `2px solid ${planConfig?.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: planConfig?.color, flexShrink: 0 }}>
              {client.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, color: "#0F172A", margin: "0 0 4px", fontSize: 15 }}>{client.name}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>{client.mutual_number}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: planConfig?.bg, color: planConfig?.color }}>
                  {PLAN_CONFIG[client.plan]?.label || client.plan}
                </span>
              </div>
            </div>
            <button onClick={() => { setClient(null); setStep(1); setSelectedCat(null); setEligibility(null); }}
              style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>

          {/* Message restriction BASIQUE */}
          {client.plan === "BASIQUE" && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#92400E" }}>
              ⚠️ <strong>Formule BASIQUE</strong> — Accès uniquement à la consultation générale dans les cliniques partenaires Awoundjô.
            </div>
          )}

          {/* Catalogue des actes */}
          {catLoading ? (
            <div style={{ textAlign: "center", padding: 32 }}><Spinner /> Chargement du catalogue…</div>
          ) : Object.keys(catalogByCategory).length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", color: "#94A3B8" }}>
              <p style={{ fontSize: 32 }}>📋</p>
              <p>Aucun acte disponible pour ce profil</p>
            </div>
          ) : (
            Object.entries(catalogByCategory).map(([category, entries]) => {
              const catInfo = CATEGORY_LABELS[category] || { icon: "📋", label: category };
              return (
                <div key={category} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
                    {catInfo.icon} {catInfo.label}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {entries.map(entry => {
                      const isSelected = selectedCat?.code === entry.code;
                      return (
                        <button key={entry.code} onClick={() => handleSelectAct(entry)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px", borderRadius: 12, border: "2px solid",
                            borderColor: isSelected ? (needsPriorAuth(entry) ? "#B45309" : "#185FA5") : "#E2E8F0",
                            background: isSelected ? (needsPriorAuth(entry) ? "#FFF7ED" : "#EFF6FF") : "#fff",
                            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                            transition: "all .15s",
                          }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isSelected ? (needsPriorAuth(entry) ? "#B45309" : "#185FA5") : "#1E293B" }}>
                              {entry.label}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>
                              {entry.code}
                              {entry.requires_prescription && " · 📄 Ordonnance requise"}
                              {needsPriorAuth(entry) && " · ⏳ Accord préalable"}
                            </p>
                          </div>
                          {entry.cap_per_act && (
                            <span style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap", marginLeft: 8 }}>
                              max {fmt(entry.cap_per_act)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Éligibilité pour l'acte sélectionné */}
          {selectedCat && eligibility && (
            <div style={{
              marginTop: 12, padding: "14px 16px", borderRadius: 14,
              background: eligibility.eligible ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${eligibility.eligible ? "#BBF7D0" : "#FECACA"}`,
            }}>
              {eligibility.eligible ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <p style={{ fontWeight: 700, color: "#15803D", margin: 0, fontSize: 13 }}>
                      Éligible — Couverture {eligibility.coverage_pct}%
                    </p>
                  </div>
                  {/* Plafonds et soldes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {eligibility.cap_per_act && (
                      <div style={s.capRow}>
                        <span>Plafond par acte</span>
                        <span style={{ fontWeight: 700 }}>{fmt(eligibility.cap_per_act)}</span>
                      </div>
                    )}
                    {eligibility.consults_remaining !== null && eligibility.cap_monthly_acts && (
                      <div style={s.capRow}>
                        <span>Actes ce mois</span>
                        <span style={{ fontWeight: 700, color: eligibility.consults_remaining === 0 ? "#DC2626" : "#15803D" }}>
                          {eligibility.consults_remaining} restant(s) / {eligibility.cap_monthly_acts}
                        </span>
                      </div>
                    )}
                    {eligibility.cap_monthly_acts && eligibility.consults_remaining === null && (
                      <div style={s.capRow}>
                        <span>Max / mois</span>
                        <span style={{ fontWeight: 700 }}>{eligibility.cap_monthly_acts} acte(s)</span>
                      </div>
                    )}
                    {eligibility.solde_person !== null && (
                      <div style={s.capRow}>
                        <span>Solde annuel (personne)</span>
                        <span style={{ fontWeight: 700, color: eligibility.solde_person < 10000 ? "#DC2626" : "#15803D" }}>
                          {fmt(eligibility.solde_person)} / {fmt(eligibility.cap_per_person)}
                        </span>
                      </div>
                    )}
                    {eligibility.solde_family !== null && (
                      <div style={s.capRow}>
                        <span>Solde annuel (famille)</span>
                        <span style={{ fontWeight: 700, color: eligibility.solde_family < 10000 ? "#DC2626" : "#15803D" }}>
                          {fmt(eligibility.solde_family)} / {fmt(eligibility.cap_annual)}
                        </span>
                      </div>
                    )}
                    {eligibility.solde_group !== null && (
                      <div style={s.capRow}>
                        <span>Solde annuel consultations ({eligibility.group_scope === "family" ? "famille" : "personne"})</span>
                        <span style={{ fontWeight: 700, color: eligibility.solde_group < 10000 ? "#DC2626" : "#15803D" }}>
                          {fmt(eligibility.solde_group)} / {fmt(eligibility.cap_group)}
                        </span>
                      </div>
                    )}
                    {eligibility.solde_global !== null && (
                      <div style={s.capRow}>
                        <span>Solde global / an</span>
                        <span style={{ fontWeight: 700, color: eligibility.solde_global < 20000 ? "#DC2626" : "#15803D" }}>
                          {fmt(eligibility.solde_global)} / {fmt(eligibility.cap_global_person)}
                        </span>
                      </div>
                    )}
                    {eligibility.warning && (
                      <p style={{ fontSize: 11, color: "#D97706", margin: "6px 0 0" }}>{eligibility.warning}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 700, color: "#DC2626", margin: "0 0 4px", fontSize: 13 }}>❌ Non éligible</p>
                  <p style={{ color: "#B91C1C", fontSize: 12, margin: 0 }}>{eligibility.block_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Acte lourd — accord préalable requis, pas de validation directe */}
          {selectedCat && needsPriorAuth(selectedCat) && (
            <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 14, background: "#FFF7ED", border: "1px solid #FDE1C1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>⏳</span>
                <p style={{ fontWeight: 700, color: "#B45309", margin: 0, fontSize: 13 }}>Accord préalable requis</p>
              </div>
              <p style={{ color: "#92400E", fontSize: 12, margin: 0 }}>
                Cet acte (hospitalisation, césarienne, chirurgie…) ne peut pas être enregistré directement. Il doit d'abord faire l'objet d'une demande d'accord préalable validée par la mutuelle.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => setStep(1)} style={s.btnSecondary}>← Retour</button>
            {selectedCat && needsPriorAuth(selectedCat) ? (
              <button
                onClick={() => navigate("/etablissement/accord-prealable", {
                  state: { client, dependent_id: client.dependent_id, catalog_code: selectedCat.code, act_label: selectedCat.label },
                })}
                disabled={!eligibility?.eligible}
                style={{ ...s.btnPrimary, flex: 1, background: "linear-gradient(135deg,#B45309,#92400E)", opacity: !eligibility?.eligible ? 0.5 : 1 }}>
                ⏳ Faire une demande d'accord préalable →
              </button>
            ) : (
              <button
                onClick={() => setStep(3)}
                disabled={!selectedCat || !eligibility?.eligible}
                style={{ ...s.btnPrimary, flex: 1, opacity: (!selectedCat || !eligibility?.eligible) ? 0.5 : 1 }}>
                Continuer →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 3 — Montant & validation ══ */}
      {step === 3 && client && selectedCat && (
        <form onSubmit={handleSubmit}>
          {/* Résumé acte */}
          <div style={{ ...s.card, marginBottom: 14, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, margin: "0 0 6px" }}>Acte sélectionné</p>
            <p style={{ fontWeight: 800, color: "#0C447C", margin: 0, fontSize: 14 }}>{selectedCat.label}</p>
            <p style={{ color: "#185FA5", fontSize: 11, margin: "2px 0 0", fontFamily: "monospace" }}>{selectedCat.code}</p>
          </div>

          <div style={s.card}>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Nom du praticien *</label>
              <input
                required
                value={doctorName} onChange={e => setDoctorName(e.target.value)}
                placeholder="Dr. Konan Aya, Infirmier Bamba…"
                style={{ ...s.input }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Description / détail de l'acte</label>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Détail clinique, médicaments, examens réalisés…"
                style={{ ...s.input, resize: "vertical", minHeight: 80 }}
              />
            </div>
            <div>
              <label style={s.label}>Montant total (FCFA) *</label>
              <input
                required type="number" min="0"
                value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
                placeholder="Ex : 3000"
                style={{ ...s.input, fontSize: 20, fontWeight: 800 }}
              />
              {eligibility?.cap_per_act && (
                <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0" }}>
                  Plafond par acte : {fmt(eligibility.cap_per_act)}
                </p>
              )}
            </div>
          </div>

          {/* Répartition */}
          {amount > 0 && (
            <div style={{ ...s.card, marginTop: 14, background: "#E0F7FA", border: "none" }}>
              <p style={{ fontWeight: 700, color: "#042C53", fontSize: 13, margin: "0 0 10px" }}>Répartition</p>
              {[
                { label: "Coût total",                                   value: fmt(amount),      color: "#042C53" },
                { label: `Prise en charge mutuelle (${coveragePct}%)`,   value: fmt(mutualPart),  color: "#185FA5" },
                { label: "Reste à charge patient",                       value: fmt(clientPart),  color: "#DC2626" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,.06)" : "none" }}>
                  <span style={{ color: "#64748B", fontSize: 13 }}>{row.label}</span>
                  <span style={{ fontWeight: 800, color: row.color, fontSize: 13 }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Avertissement examens */}
          {EXAM_REQUIRED_CATEGORIES.includes(selectedCat.category) && (
            <div style={{ marginTop: 14, padding: "12px 16px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, fontSize: 13, color: "#0C447C" }}>
              🔬 Vous pourrez prescrire des examens complémentaires après validation de cet acte.
            </div>
          )}

          {/* Avertissement ordonnance */}
          {PRESCRIPTION_REQUIRED_CATEGORIES.includes(selectedCat.category) && (
            <div style={{ marginTop: 14, padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, fontSize: 13, color: "#92400E" }}>
              📋 Une ordonnance devra être saisie après validation de cet acte.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={() => setStep(2)} style={s.btnSecondary}>← Retour</button>
            <button type="submit" disabled={saving || !totalAmount}
              style={{ ...s.btnPrimary, flex: 1, opacity: !totalAmount ? 0.5 : 1 }}>
              {saving ? <><Spinner /> Enregistrement…</> : "✅ Valider l'acte"}
            </button>
          </div>
        </form>
      )}

      {/* ══ ÉTAPE 4 — Examens complémentaires ══ */}
      {step === 4 && service && (
        <div>
          <div style={{ ...s.card, background: "#EFF6FF", border: "1px solid #BFDBFE", marginBottom: 16 }}>
            <p style={{ fontWeight: 800, color: "#0C447C", margin: "0 0 4px" }}>🔬 Examens complémentaires</p>
            <p style={{ color: "#185FA5", fontSize: 13, margin: 0 }}>
              Sélectionnez les examens à prescrire. Chaque examen sera soumis comme demande d'accord préalable à la mutuelle.
            </p>
          </div>

          <div style={s.card}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, margin: "0 0 6px" }}>Patient</p>
            <p style={{ fontWeight: 700, color: "#0F172A", margin: "0 0 16px" }}>{client?.name} — {client?.mutual_number}</p>

            <form onSubmit={handleExams}>
              {examCatalog.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#94A3B8", fontSize: 13 }}>
                  Aucun examen disponible dans le catalogue pour ce profil.
                </div>
              ) : (
                <>
                  {/* Grouper par catégorie */}
                  {["analyses_biologiques", "radiologie_imagerie"].map(cat => {
                    const entries = examCatalog.filter(e => e.category === cat);
                    if (!entries.length) return null;
                    const catInfo = { analyses_biologiques: { icon: "🔬", label: "Analyses biologiques" }, radiologie_imagerie: { icon: "🩻", label: "Radiologie / Imagerie" } }[cat];
                    const solde = examSoldes[cat];
                    return (
                      <div key={cat} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                            {catInfo.icon} {catInfo.label}
                          </p>
                          {solde && solde.eligible && (
                            <div style={{ display: "flex", gap: 8 }}>
                              {solde.solde_person !== null && (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                                  background: solde.solde_person < 10000 ? "#FEF2F2" : "#F0FDF4",
                                  color: solde.solde_person < 10000 ? "#DC2626" : "#15803D" }}>
                                  Solde : {fmt(solde.solde_person)}
                                </span>
                              )}
                              {solde.solde_family !== null && solde.solde_person === null && (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                                  background: solde.solde_family < 10000 ? "#FEF2F2" : "#F0FDF4",
                                  color: solde.solde_family < 10000 ? "#DC2626" : "#15803D" }}>
                                  Solde : {fmt(solde.solde_family)}
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: "#64748B", padding: "2px 8px", background: "#F1F5F9", borderRadius: 6 }}>
                                {solde.coverage_pct}% pris en charge
                              </span>
                            </div>
                          )}
                          {solde && !solde.eligible && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", padding: "2px 8px", background: "#FEF2F2", borderRadius: 6 }}>
                              ❌ Plafond atteint
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {entries.map(entry => {
                            const checked = examSelected.includes(entry.code);
                            const soldeData = examSoldes[entry.category];
                            const plafond = entry.cap_per_person_annual || entry.cap_annual || null;
                            return (
                              <div key={entry.code}>
                                <button type="button" onClick={() => toggleExam(entry.code)}
                                  style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                                    padding: "12px 14px", borderRadius: checked ? "12px 12px 0 0" : 12,
                                    border: "2px solid",
                                    borderColor: checked ? "#185FA5" : "#E2E8F0",
                                    borderBottom: checked ? "1px solid #BFDBFE" : "2px solid #E2E8F0",
                                    background: checked ? "#EFF6FF" : "#fff",
                                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                                    transition: "all .15s",
                                  }}>
                                  <div style={{
                                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                                    border: `2px solid ${checked ? "#185FA5" : "#CBD5E1"}`,
                                    background: checked ? "#185FA5" : "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 12, color: "#fff",
                                  }}>
                                    {checked && "✓"}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: checked ? "#0C447C" : "#1E293B" }}>{entry.label}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>
                                      {entry.code} · ⏳ Accord préalable mutuelle
                                    </p>
                                  </div>
                                  {plafond && (
                                    <span style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>
                                      plafond {fmt(plafond)}
                                    </span>
                                  )}
                                </button>
                                {/* Champ prix — visible si sélectionné */}
                                {checked && (
                                  <div style={{
                                    padding: "10px 14px", background: "#EFF6FF",
                                    border: "2px solid #185FA5", borderTop: "none",
                                    borderRadius: "0 0 12px 12px",
                                  }}>
                                    <label style={{ ...s.label, color: "#185FA5" }}>Montant estimé (FCFA)</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <input
                                        type="number" min="0"
                                        value={examPrices[entry.code] || ""}
                                        onChange={ev => setExamPrices(prev => ({ ...prev, [entry.code]: ev.target.value }))}
                                        placeholder="Ex : 8 000"
                                        style={{ ...s.input, fontSize: 15, fontWeight: 700, flex: 1 }}
                                      />
                                      {plafond && examPrices[entry.code] && Number(examPrices[entry.code]) > plafond && (
                                        <span style={{ fontSize: 11, color: "#DC2626", whiteSpace: "nowrap" }}>
                                          ⚠️ Dépasse le plafond
                                        </span>
                                      )}
                                    </div>
                                    {plafond && (
                                      <p style={{ fontSize: 11, color: "#185FA5", margin: "4px 0 0" }}>
                                        Plafond prise en charge : {fmt(plafond)} · {soldeData?.coverage_pct ?? "—"}% couvert
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {examSelected.length > 0 && (
                    <div style={{ padding: "10px 14px", background: "#EFF6FF", borderRadius: 10, fontSize: 12, color: "#1E40ED", marginBottom: 12 }}>
                      ✅ {examSelected.length} examen(s) sélectionné(s) — soumis en accord préalable à la mutuelle
                    </div>
                  )}

                  {/* Carte "Autre examen" */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
                      📝 Autre examen
                    </p>
                    <button type="button" onClick={() => setExamAutre(prev => ({ ...prev, active: !prev.active }))}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px",
                        borderRadius: examAutre.active ? "12px 12px 0 0" : 12,
                        border: "2px solid", borderColor: examAutre.active ? "#7C3AED" : "#E2E8F0",
                        borderBottom: examAutre.active ? "1px solid #DDD6FE" : "2px solid #E2E8F0",
                        background: examAutre.active ? "#F5F3FF" : "#fff",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        transition: "all .15s",
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${examAutre.active ? "#7C3AED" : "#CBD5E1"}`,
                        background: examAutre.active ? "#7C3AED" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#fff",
                      }}>
                        {examAutre.active && "✓"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: examAutre.active ? "#5B21B6" : "#1E293B" }}>
                          Autre examen (hors catalogue)
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                          ⏳ Accord préalable · Plafond 35 000 FCFA
                        </p>
                      </div>
                    </button>
                    {examAutre.active && (
                      <div style={{
                        padding: "12px 14px", background: "#F5F3FF",
                        border: "2px solid #7C3AED", borderTop: "none",
                        borderRadius: "0 0 12px 12px",
                        display: "flex", flexDirection: "column", gap: 10,
                      }}>
                        <div>
                          <label style={{ ...s.label, color: "#7C3AED" }}>Nom de l'examen *</label>
                          <input
                            value={examAutre.nom}
                            onChange={e => setExamAutre(prev => ({ ...prev, nom: e.target.value }))}
                            placeholder="Ex : PCR COVID, Biopsie, IRM cérébrale…"
                            style={{ ...s.input, borderColor: "#DDD6FE" }}
                          />
                        </div>
                        <div>
                          <label style={{ ...s.label, color: "#7C3AED" }}>Montant estimé (FCFA)</label>
                          <input
                            type="number" min="0"
                            value={examAutre.prix}
                            onChange={e => setExamAutre(prev => ({ ...prev, prix: e.target.value }))}
                            placeholder="Ex : 25 000"
                            style={{ ...s.input, fontSize: 15, fontWeight: 700, borderColor: "#DDD6FE" }}
                          />
                          {examAutre.prix && Number(examAutre.prix) > 35000 && (
                            <p style={{ fontSize: 11, color: "#DC2626", margin: "4px 0 0" }}>
                              ⚠️ Dépasse le plafond de 35 000 FCFA pour les examens hors catalogue
                            </p>
                          )}
                          <p style={{ fontSize: 11, color: "#7C3AED", margin: "4px 0 0" }}>
                            Plafond prise en charge : 35 000 FCFA
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div style={{ padding: "10px 14px", background: "#FFFBEB", borderRadius: 10, fontSize: 12, color: "#92400E", marginBottom: 16 }}>
                ⏳ Les examens sélectionnés seront soumis à validation par la mutuelle avant toute prise en charge.
              </div>

              {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 10 }}>⚠️ {error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={skipExams} style={s.btnSecondary}>
                  Passer →
                </button>
                <button type="submit" disabled={examSaving}
                  style={{ ...s.btnPrimary, flex: 1 }}>
                  {examSaving
                    ? <><Spinner /> Soumission…</>
                    : (() => {
                        const total = examSelected.length + (examAutre.active && examAutre.nom.trim() ? 1 : 0);
                        return total ? `🔬 Soumettre ${total} examen(s)` : "Continuer sans examen →";
                      })()
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 5 — Ordonnance ══ */}
      {step === 5 && service && (
        <div>
          <div style={{ ...s.card, background: "#FFFBEB", border: "1px solid #FCD34D", marginBottom: 16 }}>
            <p style={{ fontWeight: 800, color: "#92400E", margin: "0 0 4px" }}>📋 Ordonnance obligatoire</p>
            <p style={{ color: "#B45309", fontSize: 13, margin: 0 }}>
              Cet acte ({selectedCat?.label}) nécessite la saisie d'une ordonnance pour finaliser la prise en charge dans le système Awoundjô.
            </p>
          </div>

          <div style={s.card}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, margin: "0 0 6px" }}>Patient</p>
            <p style={{ fontWeight: 700, color: "#0F172A", margin: "0 0 16px" }}>{client?.name} — {client?.mutual_number}</p>

            <form onSubmit={handlePrescription}>
              <label style={s.label}>Contenu de l'ordonnance *</label>
              <textarea
                required
                value={prescription} onChange={e => setPrescription(e.target.value)}
                placeholder={`Exemple :\nAmoxicilline 500mg — 3x/jour pendant 7 jours\nParacétamol 1g — si douleur\nContrôle dans 1 semaine`}
                style={{ ...s.input, resize: "vertical", minHeight: 160, fontFamily: "monospace", fontSize: 13 }}
              />
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "6px 0 16px" }}>
                Saisissez les médicaments, posologies, examens complémentaires et recommandations.
              </p>

              {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 10 }}>⚠️ {error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={prescSaving || !prescription.trim()}
                  style={{ ...s.btnPrimary, flex: 1, opacity: !prescription.trim() ? 0.5 : 1 }}>
                  {prescSaving ? <><Spinner /> Enregistrement…</> : "📋 Enregistrer l'ordonnance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 6 — Confirmation ══ */}
      {step === 6 && service && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
          <h2 style={{ color: "#042C53", fontWeight: 800, margin: "0 0 6px" }}>Prise en charge validée</h2>
          <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 24px" }}>
            L'acte a été enregistré avec succès dans le système Awoundjô.
          </p>

          <div style={{ ...s.card, textAlign: "left", maxWidth: 480, margin: "0 auto 20px" }}>
            {[
              { label: "Assuré",          value: client?.name },
              { label: "N° mutualiste",   value: client?.mutual_number },
              { label: "Acte",            value: selectedCat?.label },
              { label: "Code",            value: selectedCat?.code },
              { label: "Consultation",    value: fmt(service.total_amount) },
              { label: "Part mutuelle",   value: fmt(service.mutual_part),  color: "#185FA5" },
              { label: "Reste patient",   value: fmt(service.client_part),  color: "#DC2626" },
              { label: "Couverture",      value: `${service.coverage_pct}%` },
              ...(examDone ? [{ label: "Examens soumis", value: `🔬 ${examResults.length} demande(s) en accord préalable` }] : []),
              ...(prescDone ? [{ label: "Ordonnance", value: "✅ Saisie dans le système" }] : []),
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#64748B" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.color || "#1E293B" }}>{row.value}</span>
              </div>
            ))}

            {/* ── Notification solde annuel global ── */}
            {soldeAnnuel && (() => {
              const pct   = soldeAnnuel.cap_global_person > 0
                ? Math.round((soldeAnnuel.solde_global / soldeAnnuel.cap_global_person) * 100)
                : 0;
              const isLow  = pct <= 20;
              const isMid  = pct > 20 && pct <= 50;
              const color  = isLow ? "#DC2626" : isMid ? "#D97706" : "#15803D";
              const bg     = isLow ? "#FEF2F2" : isMid ? "#FFFBEB" : "#F0FDF4";
              const border = isLow ? "#FECACA" : isMid ? "#FCD34D" : "#BBF7D0";
              const icon   = isLow ? "🔴" : isMid ? "🟡" : "🟢";
              return (
                <div style={{ marginTop: 14, padding: "14px 16px", background: bg, border: `1px solid ${border}`, borderRadius: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: .8, margin: "0 0 10px" }}>
                    {icon} Solde annuel — information mutualiste
                  </p>
                  {/* Barre de progression */}
                  <div style={{ height: 6, background: "rgba(0,0,0,.08)", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .4s" }} />
                  </div>
                  {[
                    { label: "Plafond annuel",      value: fmt(soldeAnnuel.cap_global_person) },
                    { label: "Consommé cette année", value: fmt(soldeAnnuel.consumed_global),   color: "#64748B" },
                    { label: "Solde restant",        value: fmt(soldeAnnuel.solde_global),       color, bold: true },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,.05)" : "none" }}>
                      <span style={{ fontSize: 12, color: "#64748B" }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: row.bold ? 800 : 600, color: row.color || "#1E293B" }}>{row.value}</span>
                    </div>
                  ))}
                  {isLow && (
                    <p style={{ fontSize: 11, color: "#B91C1C", margin: "8px 0 0", fontWeight: 600 }}>
                      ⚠️ Plafond annuel presque épuisé — informer le mutualiste de contacter Awoundjô.
                    </p>
                  )}
                </div>
              );
            })()}
            {/* Bloc total estimé — affiché uniquement si des examens ont été soumis avec un montant */}
            {examDone && examTotals.estimated_exams_total > 0 && (
              <div style={{ marginTop: 12, padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: .8, margin: "0 0 8px" }}>
                  💰 Estimation financière
                </p>
                {[
                  { label: "Consultation (validé)",             value: fmt(examTotals.consultation_amount),   color: "#1E293B" },
                  { label: "Examens complémentaires (estimé)",  value: fmt(examTotals.estimated_exams_total), color: "#D97706" },
                  { label: "Total estimé",                      value: fmt(examTotals.estimated_grand_total), color: "#0F172A", bold: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,.06)" : "none" }}>
                    <span style={{ fontSize: 12, color: "#92400E" }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: row.bold ? 800 : 700, color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <p style={{ fontSize: 10, color: "#B45309", margin: "6px 0 0" }}>
                  ⚠️ Le montant des examens est une estimation — la prise en charge définitive est soumise à l'accord préalable de la mutuelle.
                </p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, maxWidth: 480, margin: "0 auto" }}>
            <button onClick={reset} style={{ ...s.btnPrimary, flex: 1 }}>
              + Nouvelle prise en charge
            </button>
            <button onClick={() => navigate("/etablissement/billing")} style={s.btnSecondary}>
              Facturation →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sous-composants ─────────────────────────────────────────
function Spinner() {
  return (
    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = {
  card:       { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "18px 20px", marginBottom: 0 },
  stepTitle:  { fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" },
  stepDesc:   { fontSize: 14, color: "#64748B", margin: 0 },
  label:      { display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 },
  input:      { width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: "#1E293B" },
  btnPrimary: { background: "linear-gradient(135deg,#185FA5,#0C447C)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSecondary:{ background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "13px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  capRow:      { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,.04)" },
};
