// src/pages/provider/ProviderMedical.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { providerMedicalAPI, providerClientAPI } from "../../providerApi";

const TYPES = [
  { id: "consultation",    icon: "🩺", label: "Consultation" },
  { id: "analysis",        icon: "🔬", label: "Analyse" },
  { id: "prescription",    icon: "💊", label: "Prescription" },
  { id: "hospitalization", icon: "🏨", label: "Hospitalisation" },
];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export default function ProviderMedical() {
  const { clientId } = useParams();
  const navigate     = useNavigate();
  const [records, setRecords] = useState([]);
  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState({ type: "consultation", diagnosis: "", observations: "", treatment: "" });

  async function load() {
    setLoading(true);
    try {
      const { data } = await providerMedicalAPI.getRecords(clientId);
      setRecords(data.records || []);
      setClient(data.client);
    } catch { setError("Impossible de charger le dossier"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [clientId]);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await providerMedicalAPI.addRecord(clientId, form);
      setShowAdd(false);
      setForm({ type: "consultation", diagnosis: "", observations: "", treatment: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur ajout");
    } finally { setSaving(false); }
  }

  const typeMap = Object.fromEntries(TYPES.map(t => [t.id, t]));

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f2942", margin: "0 0 2px" }}>Dossier Médical</h2>
          {client && <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{client.name} · {client.mutual_number}</p>}
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ background: "#0f2942", color: "#fff", border: "none", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Ajouter
        </button>
      </div>

      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>Chargement…</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 20, color: "#94A3B8" }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>📋</p>
          <p>Aucune entrée dans le dossier</p>
          <button onClick={() => setShowAdd(true)} style={{ background: "#00BCD4", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
            + Ajouter la première entrée
          </button>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 24 }}>
          {/* Timeline line */}
          <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 2, background: "#E2E8F0" }} />
          {records.map((r, i) => {
            const t = typeMap[r.type] || TYPES[0];
            return (
              <div key={r.id} style={{ position: "relative", marginBottom: 16 }}>
                {/* Dot */}
                <div style={{ position: "absolute", left: -20, top: 16, width: 16, height: 16, borderRadius: "50%", background: "#00BCD4", border: "3px solid #fff", boxShadow: "0 0 0 2px #00BCD4" }} />
                <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, background: "#E0F7FA", color: "#0097A7", borderRadius: 8, padding: "3px 8px" }}>
                      {t.icon} {t.label}
                    </span>
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>{fmtDate(r.created_at)}</span>
                  </div>
                  {r.provider_name && <p style={{ color: "#64748B", fontSize: 11, margin: "0 0 8px" }}>👨‍⚕️ {r.provider_name}</p>}
                  {r.diagnosis && (
                    <div style={{ marginBottom: 6 }}>
                      <p style={{ fontWeight: 700, color: "#0f2942", fontSize: 12, margin: "0 0 2px" }}>Diagnostic</p>
                      <p style={{ color: "#374151", fontSize: 13, margin: 0 }}>{r.diagnosis}</p>
                    </div>
                  )}
                  {r.observations && (
                    <div style={{ marginBottom: 6 }}>
                      <p style={{ fontWeight: 700, color: "#0f2942", fontSize: 12, margin: "0 0 2px" }}>Observations</p>
                      <p style={{ color: "#374151", fontSize: 13, margin: 0 }}>{r.observations}</p>
                    </div>
                  )}
                  {r.treatment && (
                    <div>
                      <p style={{ fontWeight: 700, color: "#0f2942", fontSize: 12, margin: "0 0 2px" }}>Traitement</p>
                      <p style={{ color: "#374151", fontSize: 13, margin: 0 }}>{r.treatment}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ajout */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxWidth: 768, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, color: "#0f2942", margin: 0 }}>Nouvelle entrée</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              {/* Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => setForm({ ...form, type: t.id })}
                    style={{ padding: "10px", borderRadius: 12, border: "2px solid", cursor: "pointer", fontFamily: "inherit",
                      borderColor: form.type === t.id ? "#00BCD4" : "#E2E8F0",
                      background: form.type === t.id ? "#E0F7FA" : "#fff",
                      fontWeight: 600, fontSize: 12, color: "#0f2942",
                    }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {[
                { key: "diagnosis",    label: "Diagnostic",    placeholder: "Ex : Paludisme simple" },
                { key: "observations", label: "Observations",  placeholder: "Symptômes, examens…" },
                { key: "treatment",    label: "Traitement",    placeholder: "Médicaments, posologie…" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <textarea value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 70, boxSizing: "border-box" }}
                  />
                </div>
              ))}
              {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button type="button" onClick={() => setShowAdd(false)}
                  style={{ padding: "14px", borderRadius: 14, border: "1.5px solid #CBD5E1", background: "#fff", color: "#64748B", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#0f2942,#0a3d62)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {saving ? "Enregistrement…" : "✅ Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
