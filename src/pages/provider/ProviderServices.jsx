// src/pages/provider/ProviderServices.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { providerClientAPI, providerServiceAPI } from "../../providerApi";

const fmt = (n) => Number(n||0).toLocaleString("fr-FR") + " FCFA";
const SERVICE_TYPES = [
  { id: "consultation",    icon: "🩺", label: "Consultation" },
  { id: "pharmacy",        icon: "💊", label: "Pharmacie" },
  { id: "laboratory",      icon: "🔬", label: "Laboratoire" },
  { id: "hospitalization", icon: "🏨", label: "Hospitalisation" },
];

export default function ProviderServices() {
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const clientId   = params.get("client");

  const [step,          setStep]         = useState(clientId ? 2 : 1);
  const [searchQ,       setSearchQ]      = useState("");
  const [client,        setClient]       = useState(null);
  const [eligibility,   setEligibility]  = useState(null);
  const [serviceType,   setServiceType]  = useState("consultation");
  const [description,   setDescription] = useState("");
  const [totalAmount,   setTotalAmount]  = useState("");
  const [loading,       setLoading]      = useState(false);
  const [saving,        setSaving]       = useState(false);
  const [error,         setError]        = useState("");
  const [success,       setSuccess]      = useState(null);

  // Charger client si passé en param
  useEffect(() => {
    if (clientId) {
      setLoading(true);
      providerClientAPI.eligibility(clientId, "consultation")
        .then(r => { setClient(r.data.client); setEligibility(r.data); })
        .catch(() => setError("Client introuvable"))
        .finally(() => setLoading(false));
    }
  }, [clientId]);

  // Mise à jour éligibilité quand type change
  useEffect(() => {
    if (!client) return;
    providerClientAPI.eligibility(client.id, serviceType)
      .then(r => setEligibility(r.data))
      .catch(() => {});
  }, [serviceType, client]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setLoading(true); setError("");
    try {
      const { data } = await providerClientAPI.search(searchQ);
      if (!data.clients.length) { setError("Client introuvable"); return; }
      const c = data.clients[0];
      const { data: elig } = await providerClientAPI.eligibility(c.id, serviceType);
      setClient(elig.client); setEligibility(elig); setStep(2);
    } catch { setError("Erreur de recherche"); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!client || !totalAmount) return;
    setSaving(true); setError("");
    try {
      const { data } = await providerServiceAPI.create({
        client_id:    client.id,
        service_type: serviceType,
        description,
        total_amount: Number(totalAmount),
      });
      setSuccess(data.service);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur enregistrement");
    } finally { setSaving(false); }
  }

  const amount     = Number(totalAmount) || 0;
  const mutualPart = eligibility ? Math.round(amount * eligibility.coverage_pct / 100) : 0;
  const clientPart = amount - mutualPart;

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f2942", marginBottom: 18 }}>Enregistrer un acte</h2>

      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {/* STEP 1 — Chercher patient */}
      {step === 1 && (
        <form onSubmit={handleSearch}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,.06)", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: "#0f2942", marginBottom: 12 }}>Identifier le patient</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="N° mutuelle ou téléphone…"
                style={{ flex: 1, border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "13px 14px", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
              <button type="submit" disabled={loading} style={{ background: "#0f2942", color: "#fff", border: "none", borderRadius: 12, padding: "13px 18px", fontSize: 18, cursor: "pointer" }}>🔍</button>
            </div>
          </div>
          <button type="button" onClick={() => navigate("/etablissement/scan")}
            style={{ width: "100%", background: "linear-gradient(135deg,#00BCD4,#0097A7)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            📷 Scanner le QR code du patient
          </button>
        </form>
      )}

      {/* STEP 2 — Formulaire acte */}
      {step === 2 && client && (
        <form onSubmit={handleSubmit}>
          {/* Client info */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ width: 44, height: 44, background: "#EFF6FF", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#1565C0", fontSize: 18 }}>
              {client.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "#0f2942", margin: "0 0 2px" }}>{client.name}</p>
              <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{client.mutual_number} · {client.plan}</p>
            </div>
            {eligibility && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                background: eligibility.eligible ? "#F0FDF4" : "#FEF2F2",
                color: eligibility.eligible ? "#22C55E" : "#EF4444",
                border: `1px solid ${eligibility.eligible ? "#BBF7D0" : "#FECACA"}`,
              }}>
                {eligibility.eligible ? `✅ Éligible ${eligibility.coverage_pct}%` : "❌ Non éligible"}
              </span>
            )}
          </div>

          {!eligibility?.eligible && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
              <p style={{ fontWeight: 700, color: "#DC2626", margin: "0 0 4px" }}>⚠️ Attention</p>
              <p style={{ color: "#B91C1C", fontSize: 13, margin: 0 }}>
                {!eligibility?.is_active && "Adhésion inactive. "}
                {!eligibility?.up_to_date && `${eligibility?.late_months} mois de cotisation en retard. `}
                La couverture mutuelle ne s'applique pas.
              </p>
            </div>
          )}

          {/* Type de service */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <p style={{ fontWeight: 700, color: "#0f2942", marginBottom: 12 }}>Type de service</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SERVICE_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => setServiceType(t.id)}
                  style={{ padding: "12px 10px", borderRadius: 12, border: "2px solid", cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                    borderColor: serviceType === t.id ? "#00BCD4" : "#E2E8F0",
                    background:  serviceType === t.id ? "#E0F7FA" : "#fff",
                    color: "#0f2942", fontWeight: 600, fontSize: 13,
                  }}>
                  <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description + montant */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Détail de l'acte ou du médicament…"
                style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 80, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 6 }}>Montant total (FCFA) *</label>
              <input required type="number" min="0" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
                placeholder="Ex : 15000"
                style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 16, fontWeight: 700, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Calcul couverture */}
          {amount > 0 && (
            <div style={{ background: "#E0F7FA", borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <p style={{ fontWeight: 700, color: "#0f2942", marginBottom: 10, fontSize: 13 }}>Répartition des coûts</p>
              {[
                { label: "Coût total",               value: fmt(amount),     color: "#0f2942" },
                { label: `Prise en charge mutuelle (${eligibility?.coverage_pct||0}%)`, value: fmt(mutualPart), color: "#0097A7" },
                { label: "Part patient",              value: fmt(clientPart), color: "#DC2626" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,.06)" : "none" }}>
                  <span style={{ color: "#64748B", fontSize: 13 }}>{row.label}</span>
                  <span style={{ fontWeight: 800, color: row.color, fontSize: 13 }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button type="button" onClick={() => { setStep(1); setClient(null); }}
              style={{ padding: "14px", borderRadius: 14, border: "1.5px solid #CBD5E1", background: "#fff", color: "#64748B", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ← Retour
            </button>
            <button type="submit" disabled={saving || !totalAmount}
              style={{ padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#00BCD4,#0097A7)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14, opacity: (!totalAmount) ? .6 : 1 }}>
              {saving ? "Enregistrement…" : "✅ Valider l'acte"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3 — Succès */}
      {step === 3 && success && (
        <div style={{ textAlign: "center", padding: "30px 20px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h3 style={{ color: "#0f2942", fontWeight: 800, marginBottom: 8 }}>Acte enregistré !</h3>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, textAlign: "left" }}>
            {[
              { label: "Montant total",    value: fmt(success.total_amount) },
              { label: "Part mutuelle",    value: fmt(success.mutual_part) },
              { label: "Part patient",     value: fmt(success.client_part) },
              { label: "Couverture",       value: `${success.coverage_pct}%` },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? "1px solid #F1F5F9" : "none" }}>
                <span style={{ color: "#64748B", fontSize: 13 }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: "#0f2942" }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setStep(1); setClient(null); setTotalAmount(""); setDescription(""); setSuccess(null); }}
            style={{ width: "100%", background: "#0f2942", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + Enregistrer un autre acte
          </button>
        </div>
      )}
    </div>
  );
}
