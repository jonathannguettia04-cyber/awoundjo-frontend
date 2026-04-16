// src/pages/provider/ProviderPharmacyPrescriptions.jsx
// Page dédiée aux PHARMACIES : chercher un patient → voir ses ordonnances actives
// → exécuter un bon sur une ordonnance

import { useState } from "react";
import { providerPharmacyAPI } from "../../providerApi";

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtExpiry = (d) => {
  if (!d) return "Pas d'expiration";
  const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "⛔ Expirée";
  if (diff <= 5) return `⚠️ Expire dans ${diff} jour${diff > 1 ? "s" : ""}`;
  return `✅ Valide jusqu'au ${fmtDate(d)}`;
};

export default function ProviderPharmacyPrescriptions() {
  const [query,       setQuery]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState(null); // { client, prescriptions, pharmacy_eligibility }
  const [selected,    setSelected]    = useState(null); // ordonnance sélectionnée pour exécution
  const [bonAmount,   setBonAmount]   = useState("");
  const [bonItems,    setBonItems]    = useState("");  // texte libre des médicaments dispensés
  const [dispensing,  setDispensing]  = useState(false);
  const [bonResult,   setBonResult]   = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null); setSelected(null); setBonResult(null);
    try {
      const q = query.trim();
      const params = q.startsWith("AWJ") || q.startsWith("awj") || /^\d{10,}/.test(q) === false
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
      // Mettre à jour le statut localement
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
          bons_remaining_this_month: prev.pharmacy_eligibility.bons_remaining_this_month
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
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 32 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f2942", margin: "0 0 4px" }}>
        💊 Ordonnances patients
      </h2>
      <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 24px" }}>
        Saisissez le numéro mutualiste ou le téléphone pour voir les ordonnances actives
      </p>

      {/* Recherche */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="N° mutualiste (AWJ-…) ou téléphone (0707…)"
          style={s.input}
        />
        <button type="submit" disabled={loading} style={s.btnPrimary}>
          {loading ? <Spin /> : "🔍"}
        </button>
      </form>

      {error && (
        <div style={s.errorBox}>⚠️ {error}</div>
      )}

      {/* Résultat bon exécuté */}
      {bonResult && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontWeight: 800, color: "#15803D", fontSize: 15, margin: "0 0 12px" }}>✅ Bon enregistré avec succès</p>
          {[
            { label: "Montant total",   value: fmt(bonResult.bon.amount) },
            { label: "Part mutuelle",   value: fmt(bonResult.mutual_part),  color: "#0097A7" },
            { label: "Reste patient",   value: fmt(bonResult.client_part),  color: "#DC2626" },
            { label: "Couverture",      value: `${bonResult.coverage_pct}%` },
            ...(bonResult.bons_remaining !== null
              ? [{ label: "Bons restants (ordonnance)", value: `${bonResult.bons_remaining} bon${bonResult.bons_remaining > 1 ? "s" : ""}` }]
              : []),
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #DCFCE7" }}>
              <span style={{ fontSize: 13, color: "#166534" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: row.color || "#15803D" }}>{row.value}</span>
            </div>
          ))}
          <button onClick={() => { setBonResult(null); }} style={{ ...s.btnSecondary, marginTop: 12, width: "100%" }}>
            Nouveau bon
          </button>
        </div>
      )}

      {/* Résultat patient */}
      {result && (
        <div>
          {/* Fiche patient */}
          <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#2563EB", flexShrink: 0 }}>
              {result.client.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, color: "#0F172A", margin: 0, fontSize: 15 }}>{result.client.name}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>
                  {result.client.mutual_number}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#EFF6FF", color: "#2563EB" }}>
                  {result.client.plan}
                </span>
              </div>
            </div>
          </div>

          {/* Quota bons pharmacie */}
          {elig && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ fontWeight: 700, color: "#92400E", fontSize: 13, margin: "0 0 8px" }}>📊 Quota bons pharmacie ce mois</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Utilisés", value: elig.bons_used_this_month },
                  { label: "Max/mois", value: elig.bons_allowed_per_month ?? "—" },
                  { label: "Restants", value: elig.bons_remaining_this_month ?? "∞", color: elig.bons_remaining_this_month === 0 ? "#DC2626" : "#15803D" },
                ].map((k, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: k.color || "#0f2942", margin: 0 }}>{k.value}</p>
                    <p style={{ fontSize: 11, color: "#92400E", margin: 0 }}>{k.label}</p>
                  </div>
                ))}
              </div>
              {elig.cap_per_bon && (
                <p style={{ fontSize: 12, color: "#78350F", margin: "8px 0 0" }}>
                  Plafond par bon : <strong>{fmt(elig.cap_per_bon)}</strong>
                  {elig.cap_annual && <> · Plafond annuel : <strong>{fmt(elig.cap_annual)}</strong></>}
                  {" · "}Couverture : <strong>{elig.coverage_pct}%</strong>
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
                  <div key={presc.id} style={{ ...s.card, marginBottom: 12, border: `2px solid ${isSelected ? "#2563EB" : "#E2E8F0"}` }}>
                    {/* En-tête ordonnance */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontWeight: 700, color: "#0f2942", margin: "0 0 4px", fontSize: 14 }}>
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

                    {/* Validité */}
                    <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 10px" }}>{fmtExpiry(presc.expires_at)}</p>

                    {/* Contenu ordonnance */}
                    <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .6, margin: "0 0 4px" }}>Contenu</p>
                      <p style={{ fontSize: 13, color: "#374151", margin: 0, whiteSpace: "pre-line", fontFamily: "monospace" }}>
                        {presc.content}
                      </p>
                    </div>

                    {/* Bons */}
                    {presc.total_bons_allowed && (
                      <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 10px" }}>
                        Bons utilisés : {presc.bons_used} / {presc.total_bons_allowed}
                      </p>
                    )}

                    {/* Bouton exécuter bon */}
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

                    {/* Formulaire bon */}
                    {isSelected && (
                      <form onSubmit={handleDispense} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E2E8F0" }}>
                        <p style={{ fontWeight: 700, color: "#0f2942", fontSize: 13, margin: "0 0 12px" }}>💊 Saisir le bon pharmacie</p>
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
                              <span style={{ color: "#DC2626", fontWeight: 400, marginLeft: 8 }}>
                                max {fmt(elig.cap_per_bon)}
                              </span>
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
                            <div style={{ marginTop: 8, padding: "8px 12px", background: "#E0F7FA", borderRadius: 8 }}>
                              <p style={{ fontSize: 12, color: "#0097A7", margin: 0 }}>
                                Part mutuelle ({elig.coverage_pct}%) : <strong>{fmt(Math.round(Number(bonAmount) * elig.coverage_pct / 100))}</strong>
                                {" · "}Reste patient : <strong>{fmt(Number(bonAmount) - Math.round(Number(bonAmount) * elig.coverage_pct / 100))}</strong>
                              </p>
                            </div>
                          )}
                        </div>
                        {error && <div style={s.errorBox}>{error}</div>}
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

function Spin() {
  return <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

const s = {
  card:        { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "16px 18px" },
  input:       { width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: "#1E293B" },
  label:       { display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 },
  btnPrimary:  { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" },
  btnSecondary:{ background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  errorBox:    { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 },
};
