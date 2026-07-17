// src/pages/provider/ProviderPharmacyPrescriptions.jsx
// Page dédiée aux PHARMACIES
// Onglet A : Vendre sur ordonnance existante (cherche patient → ordonnance → bon)
// Onglet B : Créer une ordonnance pharmacie + vendre directement

import { useState } from "react";
import { providerPharmacyAPI } from "../../providerApi";

/* ─── Utilitaires ─────────────────────────────────────────────── */
const fmt      = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtExpiry = (d) => {
  if (!d) return "Pas d'expiration";
  const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "⛔ Expirée";
  if (diff <= 5) return `⚠️ Expire dans ${diff} jour${diff > 1 ? "s" : ""}`;
  return `✅ Valide jusqu'au ${fmtDate(d)}`;
};

/* ─── Composants partagés ─────────────────────────────────────── */
function Spin() {
  return (
    <span style={{
      display: "inline-block", width: 14, height: 14,
      border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff",
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}

function SpinDark() {
  return (
    <span style={{
      display: "inline-block", width: 14, height: 14,
      border: "2px solid #CBD5E1", borderTopColor: "#185FA5",
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return <div style={s.errorBox}>⚠️ {msg}</div>;
}

function SuccessBox({ children, onReset, resetLabel = "Nouveau bon" }) {
  return (
    <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 16, padding: 20, marginBottom: 20 }}>
      {children}
      <button onClick={onReset} style={{ ...s.btnSecondary, marginTop: 12, width: "100%" }}>
        {resetLabel}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ONGLET A — Ordonnance existante                                */
/* ═══════════════════════════════════════════════════════════════ */
function TabExisting() {
  const [query,      setQuery]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [result,     setResult]     = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [bonAmount,  setBonAmount]  = useState("");
  const [bonItems,   setBonItems]   = useState("");
  const [dispensing, setDispensing] = useState(false);
  const [bonResult,  setBonResult]  = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null); setSelected(null); setBonResult(null);
    try {
      const q = query.trim();
      const params = q.toUpperCase().startsWith("AWJ") || /^\d{10,}$/.test(q) === false
        ? { mutual_number: q.toUpperCase() }
        : { phone: q };
      const { data } = await providerPharmacyAPI.getPatientPrescriptions(params);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Patient introuvable");
    } finally { setLoading(false); }
  }

  async function handleDispense(e) {
    e.preventDefault();
    if (!selected || !bonAmount) return;
    setDispensing(true); setError("");
    try {
      const items = bonItems.trim()
        ? bonItems.split("\n").filter(Boolean).map(line => ({ label: line.trim() }))
        : [];
      const { data } = await providerPharmacyAPI.dispense({
        prescription_id: selected.id,
        items,
        total_amount: Number(bonAmount),
      });
      setBonResult(data);
      setResult(prev => ({
        ...prev,
        prescriptions: prev.prescriptions.map(p =>
          p.id === selected.id
            ? { ...p, status: data.prescription_status, bons_used: p.bons_used + 1 }
            : p
        ),
        pharmacy_eligibility: {
          ...prev.pharmacy_eligibility,
          bons_used_this_month: prev.pharmacy_eligibility.bons_used_this_month + 1,
          bons_remaining_this_month: prev.pharmacy_eligibility.bons_remaining_this_month != null
            ? prev.pharmacy_eligibility.bons_remaining_this_month - 1
            : null,
        },
      }));
      setSelected(null);
      setBonAmount(""); setBonItems("");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'exécution du bon");
    } finally { setDispensing(false); }
  }

  const elig = result?.pharmacy_eligibility;

  return (
    <div>
      {/* Résultat bon exécuté */}
      {bonResult && (
        <SuccessBox onReset={() => setBonResult(null)}>
          <p style={{ fontWeight: 800, color: "#15803D", fontSize: 15, margin: "0 0 12px" }}>✅ Bon enregistré avec succès</p>
          {[
            { label: "Montant total",  value: fmt(bonResult.bon.amount) },
            { label: "Part mutuelle",  value: fmt(bonResult.mutual_part), color: "#0C447C" },
            { label: "Reste patient",  value: fmt(bonResult.client_part), color: "#DC2626" },
            { label: "Couverture",     value: `${bonResult.coverage_pct}%` },
            ...(bonResult.bons_remaining != null
              ? [{ label: "Bons restants (ordonnance)", value: `${bonResult.bons_remaining} bon${bonResult.bons_remaining > 1 ? "s" : ""}` }]
              : []),
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #DCFCE7" }}>
              <span style={{ fontSize: 13, color: "#166534" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: row.color || "#15803D" }}>{row.value}</span>
            </div>
          ))}
        </SuccessBox>
      )}

      {/* Recherche patient */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="N° mutualiste (AWJ-…) ou téléphone (0707…)"
          style={s.input}
        />
        <button type="submit" disabled={loading} style={{ ...s.btnPrimary, width: "auto", paddingLeft: 20, paddingRight: 20 }}>
          {loading ? <Spin /> : "🔍"}
        </button>
      </form>

      <ErrorBox msg={error} />

      {/* Résultat patient */}
      {result && (
        <div>
          {/* Fiche patient */}
          <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#185FA5", flexShrink: 0 }}>
              {result.client.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, color: "#0F172A", margin: 0, fontSize: 15 }}>{result.client.name}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {result.client.mutual_number && (
                  <span style={{ fontSize: 11, fontFamily: "monospace", background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>
                    {result.client.mutual_number}
                  </span>
                )}
                {result.client.phone && (
                  <span style={{ fontSize: 11, color: "#64748B" }}>{result.client.phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Éligibilité pharmacie */}
          {elig && (
            <div style={{
              ...s.card, marginBottom: 16,
              background: elig.eligible ? "#FFFBEB" : "#FEF2F2",
              border: `1px solid ${elig.eligible ? "#FDE68A" : "#FECACA"}`,
            }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: elig.eligible ? "#92400E" : "#DC2626", margin: "0 0 4px" }}>
                {elig.eligible ? "💛 Couverture pharmacie active" : "⛔ Pas de couverture pharmacie"}
              </p>
              {elig.eligible && (
                <p style={{ fontSize: 12, color: "#78350F", margin: "8px 0 0" }}>
                  Plafond par bon : <strong>{fmt(elig.cap_per_bon)}</strong>
                  {elig.cap_annual && <> · Plafond annuel : <strong>{fmt(elig.cap_annual)}</strong></>}
                  {" · "}Couverture : <strong>{elig.coverage_pct}%</strong>
                  {elig.bons_remaining_this_month != null && (
                    <> · Bons restants ce mois : <strong>{elig.bons_remaining_this_month}</strong></>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Ordonnances actives */}
          {result.prescriptions.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", color: "#94A3B8", padding: 32 }}>
              <p style={{ fontSize: 36 }}>📋</p>
              <p>Aucune ordonnance active pour ce patient</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>
                {result.prescriptions.length} ordonnance{result.prescriptions.length > 1 ? "s" : ""} active{result.prescriptions.length > 1 ? "s" : ""}
              </p>
              {result.prescriptions.map(presc => {
                const isSelected = selected?.id === presc.id;
                const canDispense = elig?.eligible && elig?.bons_remaining_this_month !== 0;
                return (
                  <div key={presc.id} style={{ ...s.card, marginBottom: 12, border: `2px solid ${isSelected ? "#185FA5" : "#E2E8F0"}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontWeight: 700, color: "#042C53", margin: "0 0 4px", fontSize: 14 }}>
                          📋 {presc.service_label || "Ordonnance médicale"}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                          Émise par <strong>{presc.emitter_name}</strong> ({presc.emitter_type}) · {fmtDate(presc.created_at)}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap",
                        background: presc.status === "ACTIVE" ? "#F0FDF4" : presc.status === "PARTIALLY_USED" ? "#FFFBEB" : "#FEF2F2",
                        color:      presc.status === "ACTIVE" ? "#15803D" : presc.status === "PARTIALLY_USED" ? "#92400E" : "#DC2626",
                      }}>
                        {presc.status === "ACTIVE" ? "Active" : presc.status === "PARTIALLY_USED" ? "Partiellement utilisée" : "Consommée"}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 10px" }}>{fmtExpiry(presc.expires_at)}</p>

                    <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .6, margin: "0 0 4px" }}>Contenu</p>
                      <p style={{ fontSize: 13, color: "#374151", margin: 0, whiteSpace: "pre-line", fontFamily: "monospace" }}>
                        {presc.content}
                      </p>
                    </div>

                    {presc.total_bons_allowed && (
                      <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 10px" }}>
                        Bons utilisés : {presc.bons_used} / {presc.total_bons_allowed}
                      </p>
                    )}

                    {!isSelected && canDispense && presc.status !== "CONSUMED" && (
                      <button onClick={() => { setSelected(presc); setBonAmount(""); setBonItems(""); setBonResult(null); }}
                        style={s.btnPrimary}>
                        💊 Exécuter un bon sur cette ordonnance
                      </button>
                    )}

                    {!canDispense && (
                      <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#DC2626" }}>
                        ⛔ Quota mensuel de bons atteint — impossible d'exécuter un bon ce mois-ci
                      </div>
                    )}

                    {isSelected && (
                      <form onSubmit={handleDispense} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E2E8F0" }}>
                        <p style={{ fontWeight: 700, color: "#042C53", fontSize: 13, margin: "0 0 12px" }}>💊 Saisir le bon pharmacie</p>
                        <div style={{ marginBottom: 12 }}>
                          <label style={s.label}>Médicaments dispensés (un par ligne)</label>
                          <textarea
                            value={bonItems} onChange={e => setBonItems(e.target.value)}
                            placeholder={"Amoxicilline 500mg — 2 boîtes\nParacétamol 1g — 1 boîte"}
                            style={{ ...s.input, resize: "vertical", minHeight: 80, fontFamily: "monospace", fontSize: 13 }}
                          />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={s.label}>
                            Montant total du bon (FCFA) *
                            {elig?.cap_per_bon && (
                              <span style={{ color: "#DC2626", fontWeight: 400, marginLeft: 8 }}>max {fmt(elig.cap_per_bon)}</span>
                            )}
                          </label>
                          <input
                            required type="number" min="0"
                            max={elig?.cap_per_bon || undefined}
                            value={bonAmount} onChange={e => setBonAmount(e.target.value)}
                            placeholder="Ex : 8500"
                            style={{ ...s.input, fontSize: 20, fontWeight: 800 }}
                          />
                          {bonAmount && elig && (
                            <div style={{ marginTop: 8, padding: "8px 12px", background: "#E6F1FB", borderRadius: 8 }}>
                              <p style={{ fontSize: 12, color: "#0C447C", margin: 0 }}>
                                Part mutuelle ({elig.coverage_pct}%) : <strong>{fmt(Math.round(Number(bonAmount) * elig.coverage_pct / 100))}</strong>
                                {" · "}Reste patient : <strong>{fmt(Number(bonAmount) - Math.round(Number(bonAmount) * elig.coverage_pct / 100))}</strong>
                              </p>
                            </div>
                          )}
                        </div>
                        <ErrorBox msg={error} />
                        <div style={{ display: "flex", gap: 10 }}>
                          <button type="button" onClick={() => setSelected(null)} style={s.btnSecondary}>Annuler</button>
                          <button type="submit" disabled={dispensing || !bonAmount} style={{ ...s.btnPrimary, flex: 1, opacity: !bonAmount ? 0.5 : 1 }}>
                            {dispensing ? <><Spin /> Enregistrement…</> : "✅ Valider le bon"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ONGLET B — Ordonnance directe pharmacie                        */
/* ═══════════════════════════════════════════════════════════════ */

// Durées de validité standard
const VALIDITY_OPTIONS = [
  { label: "3 jours",  days: 3 },
  { label: "7 jours",  days: 7 },
  { label: "15 jours", days: 15 },
  { label: "1 mois",   days: 30 },
  { label: "3 mois",   days: 90 },
];

function TabDirect() {
  /* — Recherche patient — */
  const [query,      setQuery]      = useState("");
  const [searching,  setSearching]  = useState(false);
  const [searchErr,  setSearchErr]  = useState("");
  const [patient,    setPatient]    = useState(null); // { client, pharmacy_eligibility }

  /* — Formulaire ordonnance — */
  const [content,    setContent]    = useState("");         // médicaments (texte libre)
  const [validDays,  setValidDays]  = useState(7);          // durée de validité
  const [totalBons,  setTotalBons]  = useState(1);          // nb de bons autorisés
  const [amount,     setAmount]     = useState("");          // montant de la vente directe

  /* — Soumission — */
  const [submitting,       setSubmitting]       = useState(false);
  const [formErr,          setFormErr]          = useState("");
  const [result,           setResult]           = useState(null);       // résultat après création
  const [practitionerName, setPractitionerName] = useState("");         // nom praticien/pharmacie

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setSearchErr(""); setPatient(null); setResult(null);
    try {
      const q = query.trim();
      const params = q.toUpperCase().startsWith("AWJ") || /^\d{10,}$/.test(q) === false
        ? { mutual_number: q.toUpperCase() }
        : { phone: q };
      const { data } = await providerPharmacyAPI.getPatientPrescriptions(params);
      setPatient(data);
    } catch (err) {
      setSearchErr(err.response?.data?.error || "Patient introuvable");
    } finally { setSearching(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!patient || !content.trim() || !amount) return;
    setSubmitting(true); setFormErr("");

    try {
      // Calcul de la date d'expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(validDays));

      // Créer l'ordonnance + service pharmacie en une seule opération
      const { data } = await providerPharmacyAPI.createDirectPrescription({
        client_id:         patient.client.id,
        content:           content.trim(),
        expires_at:        expiresAt.toISOString(),
        total_bons:        Number(totalBons),
        total_amount:      Number(amount),
        practitioner_name: practitionerName.trim(),
      });

      setResult(data);
    } catch (err) {
      setFormErr(err.response?.data?.error || "Erreur lors de la création");
    } finally { setSubmitting(false); }
  }

  function reset() {
    setResult(null); setPatient(null); setQuery("");
    setContent(""); setValidDays(7); setTotalBons(1); setAmount("");
    setFormErr(""); setSearchErr(""); setPractitionerName("");
  }

  const elig = patient?.pharmacy_eligibility;

  /* — Résultat succès — */
  if (result) {
    const bon = result.bon || result;
    return (
      <SuccessBox onReset={reset} resetLabel="Nouvelle ordonnance">
        <p style={{ fontWeight: 800, color: "#15803D", fontSize: 15, margin: "0 0 12px" }}>
          ✅ Ordonnance créée et vente enregistrée
        </p>
        {[
          { label: "Patient",        value: patient.client.name },
          ...(practitionerName ? [{ label: "Praticien", value: practitionerName }] : []),
          { label: "Montant total",  value: fmt(bon.amount || amount) },
          ...(bon.mutual_part != null
            ? [
                { label: "Part mutuelle", value: fmt(bon.mutual_part), color: "#0C447C" },
                { label: "Reste patient", value: fmt(bon.client_part), color: "#DC2626" },
                { label: "Couverture",    value: `${bon.coverage_pct}%` },
              ]
            : [{ label: "Couverture", value: "Aucune (paiement direct)", color: "#64748B" }]),
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #DCFCE7" }}>
            <span style={{ fontSize: 13, color: "#166534" }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: row.color || "#15803D" }}>{row.value}</span>
          </div>
        ))}
      </SuccessBox>
    );
  }

  return (
    <div>
      {/* Step 1 — Recherche patient */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <p style={{ fontWeight: 700, color: "#042C53", fontSize: 13, margin: "0 0 12px" }}>
          <span style={s.stepBadge}>1</span> Identifier le patient
        </p>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="N° mutualiste (AWJ-…) ou téléphone"
            style={s.input}
          />
          <button type="submit" disabled={searching} style={{ ...s.btnPrimary, width: "auto", paddingLeft: 20, paddingRight: 20 }}>
            {searching ? <SpinDark /> : "🔍"}
          </button>
        </form>
        <ErrorBox msg={searchErr} />

        {patient && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "10px 12px", background: "#F0FDF4", borderRadius: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "#16A34A", flexShrink: 0 }}>
              {patient.client.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "#15803D", margin: 0, fontSize: 14 }}>{patient.client.name}</p>
              {patient.client.mutual_number && (
                <p style={{ fontSize: 11, color: "#166534", margin: 0, fontFamily: "monospace" }}>{patient.client.mutual_number}</p>
              )}
            </div>
            {elig?.eligible ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "#BBF7D0", padding: "3px 8px", borderRadius: 6 }}>
                💛 {elig.coverage_pct}% couvert
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "3px 8px", borderRadius: 6 }}>
                Paiement direct
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bloc éligibilité pharmacie — affiché dès que le patient est trouvé */}
      {patient && elig && (
        <div style={{
          ...s.card, marginBottom: 16,
          background: elig.eligible ? "#FFFBEB" : "#FEF2F2",
          border: `1px solid ${elig.eligible ? "#FDE68A" : "#FECACA"}`,
        }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: elig.eligible ? "#92400E" : "#DC2626", margin: "0 0 4px" }}>
            {elig.eligible ? "💛 Couverture pharmacie active" : "⛔ Pas de couverture pharmacie"}
          </p>
          {elig.eligible ? (
            <p style={{ fontSize: 12, color: "#78350F", margin: "8px 0 0" }}>
              Plafond par bon : <strong>{fmt(elig.cap_per_bon)}</strong>
              {elig.cap_annual && <> · Plafond annuel : <strong>{fmt(elig.cap_annual)}</strong></>}
              {" · "}Couverture : <strong>{elig.coverage_pct}%</strong>
              {elig.bons_remaining_this_month != null && (
                <> · Bons restants ce mois : <strong>{elig.bons_remaining_this_month}</strong></>
              )}
            </p>
          ) : (
            <p style={{ fontSize: 12, color: "#DC2626", margin: "8px 0 0" }}>
              Ce patient ne bénéficie pas de couverture pharmacie — la vente sera enregistrée sans remboursement mutuelle.
            </p>
          )}
        </div>
      )}

      {/* Step 2 — Rédiger l'ordonnance */}
      {patient && (
        <form onSubmit={handleSubmit}>
          <div style={{ ...s.card, marginBottom: 16 }}>
            <p style={{ fontWeight: 700, color: "#042C53", fontSize: 13, margin: "0 0 12px" }}>
              <span style={s.stepBadge}>2</span> Rédiger l'ordonnance
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Nom du praticien prescripteur *</label>
              <input
                required
                value={practitionerName} onChange={e => setPractitionerName(e.target.value)}
                placeholder="Dr. Kouassi Jean-Baptiste"
                style={s.input}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Médicaments prescrits *</label>
              <textarea
                required
                value={content} onChange={e => setContent(e.target.value)}
                placeholder={"Amoxicilline 500mg — 1 boîte — 1 cp × 3/jour pendant 7 jours\nParacétamol 1g — 2 boîtes — 2 cp × 3/jour si douleur\nIbuprofène 400mg — 1 boîte"}
                style={{ ...s.input, resize: "vertical", minHeight: 100, fontFamily: "monospace", fontSize: 13 }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={s.label}>Validité de l'ordonnance</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {VALIDITY_OPTIONS.map(opt => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setValidDays(opt.days)}
                      style={{
                        padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        border: `1.5px solid ${validDays === opt.days ? "#185FA5" : "#E2E8F0"}`,
                        background: validDays === opt.days ? "#EFF6FF" : "#fff",
                        color: validDays === opt.days ? "#185FA5" : "#64748B",
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ minWidth: 140 }}>
                <label style={s.label}>Nb de bons autorisés</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setTotalBons(v => Math.max(1, v - 1))}
                    style={{ ...s.stepper }}>−</button>
                  <span style={{ fontWeight: 800, fontSize: 18, color: "#042C53", width: 28, textAlign: "center" }}>{totalBons}</span>
                  <button
                    type="button"
                    onClick={() => setTotalBons(v => Math.min(12, v + 1))}
                    style={{ ...s.stepper }}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 — Saisir la vente */}
          <div style={{ ...s.card, marginBottom: 16 }}>
            <p style={{ fontWeight: 700, color: "#042C53", fontSize: 13, margin: "0 0 12px" }}>
              <span style={s.stepBadge}>3</span> Enregistrer la vente
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>
                Montant total (FCFA) *
                {elig?.cap_per_bon && (
                  <span style={{ color: "#DC2626", fontWeight: 400, marginLeft: 8 }}>
                    plafond par bon : {fmt(elig.cap_per_bon)}
                  </span>
                )}
              </label>
              <input
                required type="number" min="0"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Ex : 12 500"
                style={{ ...s.input, fontSize: 22, fontWeight: 800 }}
              />
              {amount && elig?.eligible && (
                <div style={{ marginTop: 8, padding: "10px 14px", background: "#E6F1FB", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#0C447C" }}>Part mutuelle ({elig.coverage_pct}%)</span>
                    <strong style={{ fontSize: 13, color: "#0C447C" }}>{fmt(Math.round(Number(amount) * elig.coverage_pct / 100))}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: "#DC2626" }}>Reste à payer (patient)</span>
                    <strong style={{ fontSize: 13, color: "#DC2626" }}>{fmt(Number(amount) - Math.round(Number(amount) * elig.coverage_pct / 100))}</strong>
                  </div>
                </div>
              )}
              {amount && !elig?.eligible && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                    ℹ️ Pas de couverture mutuelle — paiement intégral par le patient
                  </p>
                </div>
              )}
            </div>

            <ErrorBox msg={formErr} />

            <button
              type="submit"
              disabled={submitting || !practitionerName.trim() || !content.trim() || !amount}
              style={{ ...s.btnPrimary, opacity: (!practitionerName.trim() || !content.trim() || !amount) ? 0.5 : 1 }}
            >
              {submitting
                ? <><Spin /> Création en cours…</>
                : "📝 Créer l'ordonnance et enregistrer la vente"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  COMPOSANT PRINCIPAL                                            */
/* ═══════════════════════════════════════════════════════════════ */
export default function ProviderPharmacyPrescriptions() {
  const [tab, setTab] = useState("existing"); // "existing" | "direct"

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 32 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* En-tête */}
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#042C53", margin: "0 0 4px" }}>
        💊 Pharmacie — Gestion des ventes
      </h2>
      <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 20px" }}>
        Exécutez un bon sur ordonnance existante ou créez une ordonnance directe
      </p>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#F1F5F9", borderRadius: 14, padding: 4 }}>
        {[
          { key: "existing", icon: "🔍", label: "Ordonnance existante" },
          { key: "direct",   icon: "✏️",  label: "Ordonnance directe" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, border: "none", borderRadius: 11,
              padding: "10px 12px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
              background: tab === t.key ? "#fff" : "transparent",
              color:      tab === t.key ? "#185FA5" : "#64748B",
              boxShadow:  tab === t.key ? "0 1px 4px rgba(0,0,0,.08)" : "none",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Contenu actif */}
      {tab === "existing" ? <TabExisting /> : <TabDirect />}
    </div>
  );
}

/* ─── Styles partagés ─────────────────────────────────────────── */
const s = {
  card:       { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "16px 18px" },
  input:      { width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: "#1E293B" },
  label:      { display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 },
  btnPrimary: { background: "linear-gradient(135deg,#185FA5,#0C447C)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" },
  btnSecondary:{ background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  errorBox:   { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 },
  stepBadge:  { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 7, background: "#185FA5", color: "#fff", fontSize: 12, fontWeight: 800, marginRight: 8 },
  stepper:    { width: 34, height: 34, borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#F8FAFC", fontSize: 18, fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
};
