// src/pages/provider/ProviderBilling.jsx
import { useState, useEffect } from "react";
import { providerBillingAPI } from "../../providerApi";

const fmt     = (n) => Number(n||0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const STATUS_MAP = {
  PENDING:   { label: "En attente",  color: "#F59E0B", bg: "#FFFBEB" },
  SUBMITTED: { label: "Soumise",     color: "#3B82F6", bg: "#EFF6FF" },
  PAID:      { label: "Payée ✅",    color: "#22C55E", bg: "#F0FDF4" },
  REJECTED:  { label: "Rejetée",     color: "#EF4444", bg: "#FEF2F2" },
};

export default function ProviderBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showGen,  setShowGen]  = useState(false);
  const [period,   setPeriod]   = useState({ start: "", end: "" });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await providerBillingAPI.getInvoices();
      setInvoices(data.invoices || []);
    } catch { setError("Erreur chargement factures"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await providerBillingAPI.generateInvoice({ period_start: period.start, period_end: period.end });
      setShowGen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur génération facture");
    } finally { setSaving(false); }
  }

  // Totaux
  const totalPending = invoices.filter(i => ["PENDING","SUBMITTED"].includes(i.status)).reduce((s, i) => s + Number(i.mutual_amount), 0);
  const totalPaid    = invoices.filter(i => i.status === "PAID").reduce((s, i) => s + Number(i.mutual_amount), 0);

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f2942", margin: 0 }}>Facturation</h2>
        <button onClick={() => setShowGen(true)}
          style={{ background: "#0f2942", color: "#fff", border: "none", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Générer facture
        </button>
      </div>

      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[
          { label: "À recevoir",    value: fmt(totalPending), color: "#F59E0B", bg: "#FFFBEB", icon: "⏳" },
          { label: "Total reçu",   value: fmt(totalPaid),    color: "#22C55E", bg: "#F0FDF4", icon: "✅" },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 16, padding: "16px", border: `1px solid ${k.color}30` }}>
            <p style={{ fontSize: 10, color: "#64748B", margin: "0 0 6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: .8 }}>{k.icon} {k.label}</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Liste factures */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>Chargement…</div>
      ) : invoices.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 20, color: "#94A3B8" }}>
          <p style={{ fontSize: 36 }}>📄</p>
          <p>Aucune facture générée</p>
          <button onClick={() => setShowGen(true)} style={{ background: "#00BCD4", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
            Générer ma première facture
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {invoices.map(inv => {
            const s = STATUS_MAP[inv.status] || STATUS_MAP.PENDING;
            return (
              <div key={inv.id} onClick={() => setSelected(selected?.id === inv.id ? null : inv)}
                style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)", cursor: "pointer", border: `1.5px solid ${selected?.id === inv.id ? "#00BCD4" : "#F1F5F9"}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ fontWeight: 700, color: "#0f2942", margin: 0, fontSize: 14 }}>
                    📄 Facture du {fmtDate(inv.created_at)}
                  </p>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: s.bg, color: s.color }}>{s.label}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: 13 }}>
                  <span>Période : {fmtDate(inv.period_start)} → {fmtDate(inv.period_end)}</span>
                  <span style={{ fontWeight: 800, color: "#0f2942" }}>{fmt(inv.mutual_amount)}</span>
                </div>
                {selected?.id === inv.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                    {[
                      { label: "Total actes",    value: fmt(inv.total_amount) },
                      { label: "Part mutuelle",  value: fmt(inv.mutual_amount) },
                      { label: "Part patients",  value: fmt(inv.client_amount) },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                        <span style={{ color: "#64748B" }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: "#0f2942" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal génération */}
      {showGen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxWidth: 768 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, color: "#0f2942", margin: 0 }}>Générer une facture</h3>
              <button onClick={() => setShowGen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleGenerate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 6 }}>Début de période *</label>
                  <input required type="date" value={period.start} onChange={e => setPeriod({ ...period, start: e.target.value })}
                    style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 6 }}>Fin de période *</label>
                  <input required type="date" value={period.end} onChange={e => setPeriod({ ...period, end: e.target.value })}
                    style={{ width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ background: "#F0F7FF", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <p style={{ color: "#1565C0", fontSize: 13, margin: 0 }}>
                  ℹ️ Tous les actes enregistrés sur cette période et non encore facturés seront inclus.
                </p>
              </div>
              {error && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button type="button" onClick={() => setShowGen(false)}
                  style={{ padding: "14px", borderRadius: 14, border: "1.5px solid #CBD5E1", background: "#fff", color: "#64748B", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#00BCD4,#0097A7)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {saving ? "Génération…" : "📄 Générer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
