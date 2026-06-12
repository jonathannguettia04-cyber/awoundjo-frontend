// src/pages/provider/ProviderBilling.jsx
// Facturation prestataire :
//   - Générer une facture (actes non facturés → PENDING)
//   - Demander le paiement (PENDING → SUBMITTED)
//   - Suivre le statut (SUBMITTED → PAID)

import React, { useState, useEffect } from "react";
import { providerBillingAPI } from "../../providerApi";

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Regroupe les actes liés (consultation + examen via linked_service_id)
// pour afficher deux lignes distinctes + un sous-total combiné.
// Les services sont déjà triés côté backend pour que parent et enfants
// soient adjacents (parent en premier).
function groupServices(services = []) {
  const groups = new Map();
  for (const svc of services) {
    const key = svc.linked_service_id || svc.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(svc);
  }
  return Array.from(groups.values());
}

const STATUS_CONFIG = {
  PENDING:   { label: "Brouillon",      icon: "📝", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  SUBMITTED: { label: "Soumise",        icon: "📤", color: "#2563EB", bg: "#EFF6FF", border: "#93C5FD" },
  PAID:      { label: "Payée ✅",       icon: "💳", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
  REJECTED:  { label: "Rejetée",        icon: "❌", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

export default function ProviderBilling() {
  const [invoices,  setInvoices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [showGen,   setShowGen]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [detail,    setDetail]    = useState(null);  // { invoice, services }
  const [detailLoading, setDetailLoading] = useState(false);

  // Formulaire génération
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [form, setForm]     = useState({ period_start: firstOfMonth, period_end: today });
  const [genLoading, setGenLoading] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const { data } = await providerBillingAPI.getInvoices();
      setInvoices(data.invoices || []);
    } catch { setError("Impossible de charger les factures"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenLoading(true); setError(""); setSuccess("");
    try {
      await providerBillingAPI.generate(form);
      setSuccess("✅ Facture générée avec succès !");
      setShowGen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur génération facture");
    } finally { setGenLoading(false); }
  }

  async function handleRequestPayment(invoice) {
    if (!window.confirm(`Soumettre la facture ${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)} pour paiement ?`)) return;
    setError(""); setSuccess("");
    try {
      await providerBillingAPI.requestPayment(invoice.id);
      setSuccess("✅ Demande de paiement envoyée à Awoundjô !");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la soumission");
    }
  }

  async function handleViewDetail(invoice) {
    if (selected?.id === invoice.id) { setSelected(null); setDetail(null); return; }
    setSelected(invoice); setDetail(null); setDetailLoading(true);
    try {
      const { data } = await providerBillingAPI.getById(invoice.id);
      setDetail(data);
    } catch { setDetail({ error: "Impossible de charger le détail" }); }
    finally { setDetailLoading(false); }
  }

  // KPIs
  const kpis = [
    { label: "Total facturé",   value: fmt(invoices.reduce((s, i) => s + Number(i.mutual_amount), 0)), icon: "💰", color: "#2563EB" },
    { label: "En attente",      value: invoices.filter(i => i.status === "PENDING").length,             icon: "📝", color: "#D97706" },
    { label: "Soumises",        value: invoices.filter(i => i.status === "SUBMITTED").length,           icon: "📤", color: "#7C3AED" },
    { label: "Payées",          value: invoices.filter(i => i.status === "PAID").length,                icon: "✅", color: "#059669" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f2942", margin: 0 }}>Facturation</h2>
          <p style={{ color: "#64748B", fontSize: 13, margin: "2px 0 0" }}>{invoices.length} facture{invoices.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setShowGen(true); setError(""); setSuccess(""); }}
          style={s.btnPrimary}>
          + Générer une facture
        </button>
      </div>

      {/* Alertes */}
      {error   && <div style={s.alertError}>{error}</div>}
      {success && <div style={s.alertSuccess}>{success}</div>}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: "1px solid #E2E8F0", borderTop: `3px solid ${k.color}` }}>
            <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, margin: "0 0 6px" }}>{k.icon} {k.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Explication du flux */}
      <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 14, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#0369A1" }}>
        <strong>Comment ça marche :</strong> Générez une facture regroupant vos actes non facturés →
        Cliquez <strong>"Demander le paiement"</strong> pour la soumettre à Awoundjô →
        L'équipe valide et procède au virement.
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>Chargement…</div>
      ) : invoices.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 20, color: "#94A3B8", border: "1px solid #E2E8F0" }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>🧾</p>
          <p style={{ fontWeight: 600 }}>Aucune facture générée</p>
          <p style={{ fontSize: 13, marginBottom: 16 }}>Générez votre première facture pour demander un remboursement à Awoundjô.</p>
          <button onClick={() => setShowGen(true)} style={s.btnPrimary}>
            + Générer ma première facture
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {invoices.map(inv => {
            const st   = STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDING;
            const open = selected?.id === inv.id;
            return (
              <div key={inv.id} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${open ? "#2563EB" : "#E2E8F0"}`, overflow: "hidden", transition: "border-color .15s" }}>

                {/* Ligne principale */}
                <div onClick={() => handleViewDetail(inv)}
                  style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>

                  {/* Statut */}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: `1px solid ${st.border}` }}>
                    {st.icon}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: "#0f2942", fontSize: 14, margin: 0 }}>
                      Période du {fmtDate(inv.period_start)} au {fmtDate(inv.period_end)}
                    </p>
                    <p style={{ color: "#64748B", fontSize: 12, margin: "2px 0 0" }}>
                      Générée le {fmtDate(inv.created_at)}
                      {inv.submitted_at ? ` · Soumise le ${fmtDate(inv.submitted_at)}` : ""}
                      {inv.paid_at      ? ` · Payée le ${fmtDate(inv.paid_at)}`      : ""}
                    </p>
                  </div>

                  {/* Montants */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontWeight: 800, color: "#0f2942", fontSize: 15, margin: 0 }}>{fmt(inv.mutual_amount)}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>part mutuelle</p>
                  </div>

                  {/* Badge statut */}
                  <div style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {st.label}
                  </div>
                </div>

                {/* Actions */}
                {inv.status === "PENDING" && (
                  <div style={{ padding: "0 16px 14px", display: "flex", gap: 10 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRequestPayment(inv); }}
                      style={{ ...s.btnPrimary, fontSize: 13 }}>
                      📤 Demander le paiement
                    </button>
                  </div>
                )}

                {/* Détail actes */}
                {open && (
                  <div style={{ borderTop: "1px solid #F1F5F9", padding: "14px 16px", background: "#F8FAFC" }}>
                    {detailLoading ? (
                      <p style={{ color: "#94A3B8", fontSize: 13, textAlign: "center" }}>Chargement du détail…</p>
                    ) : detail?.error ? (
                      <p style={{ color: "#DC2626", fontSize: 13 }}>{detail.error}</p>
                    ) : detail ? (
                      <>
                        {/* Récap financier */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                          {[
                            { label: "Total actes",    value: fmt(inv.total_amount),  color: "#0f2942" },
                            { label: "Part mutuelle",  value: fmt(inv.mutual_amount), color: "#059669" },
                            { label: "Part patient",   value: fmt(inv.client_amount), color: "#DC2626" },
                          ].map((r, i) => (
                            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid #E2E8F0" }}>
                              <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 4px" }}>{r.label}</p>
                              <p style={{ fontSize: 14, fontWeight: 800, color: r.color, margin: 0 }}>{r.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Tableau actes */}
                        {detail.services?.length > 0 ? (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                              <thead>
                                <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                                  {["Date", "Patient", "Acte", "Montant", "Part mutuelle"].map(h => (
                                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, whiteSpace: "nowrap" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {groupServices(detail.services).map((group) => {
                                  const isGroup = group.length > 1;
                                  const groupKey = group[0].linked_service_id || group[0].id;
                                  const subtotalAmount = group.reduce((s, x) => s + Number(x.total_amount), 0);
                                  const subtotalMutual = group.reduce((s, x) => s + Number(x.mutual_part), 0);
                                  return (
                                    <React.Fragment key={groupKey}>
                                      {group.map((svc, i) => (
                                        <tr key={svc.id} style={{
                                          borderBottom: "1px solid #F1F5F9",
                                          background: isGroup ? "#F0F9FF" : (i % 2 === 0 ? "#fff" : "#FAFAFA"),
                                        }}>
                                          <td style={{ padding: "7px 8px", color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(svc.created_at)}</td>
                                          <td style={{ padding: "7px 8px", color: "#1E293B", fontWeight: 600 }}>{svc.client_name || "—"}</td>
                                          <td style={{ padding: "7px 8px", color: "#475569" }}>
                                            {svc.linked_service_id && (
                                              <span style={{ color: "#0284C7", marginRight: 4 }}>↳</span>
                                            )}
                                            {svc.catalog_label || svc.catalog_code}
                                            {isGroup && !svc.linked_service_id && (
                                              <span style={{
                                                marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#0284C7",
                                                background: "#E0F2FE", borderRadius: 8, padding: "2px 6px",
                                              }}>
                                                + examen lié
                                              </span>
                                            )}
                                          </td>
                                          <td style={{ padding: "7px 8px", color: "#0f2942", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(svc.total_amount)}</td>
                                          <td style={{ padding: "7px 8px", color: "#059669", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(svc.mutual_part)}</td>
                                        </tr>
                                      ))}
                                      {isGroup && (
                                        <tr style={{ borderBottom: "2px solid #E2E8F0", background: "#E0F2FE" }}>
                                          <td colSpan={3} style={{ padding: "7px 8px", color: "#0369A1", fontWeight: 800, textAlign: "right" }}>
                                            Sous-total combiné (consultation + examen)
                                          </td>
                                          <td style={{ padding: "7px 8px", color: "#0f2942", fontWeight: 800, whiteSpace: "nowrap" }}>{fmt(subtotalAmount)}</td>
                                          <td style={{ padding: "7px 8px", color: "#059669", fontWeight: 800, whiteSpace: "nowrap" }}>{fmt(subtotalMutual)}</td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: 12 }}>Aucun acte associé</p>
                        )}
                      </>
                    ) : null}
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
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, color: "#0f2942", margin: 0 }}>Générer une facture</h3>
              <button onClick={() => setShowGen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>✕</button>
            </div>

            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>
              Sélectionnez la période. Tous les actes non encore facturés dans cette période seront regroupés.
            </p>

            <form onSubmit={handleGenerate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={s.label}>Début de période</label>
                  <input type="date" value={form.period_start}
                    onChange={e => setForm({ ...form, period_start: e.target.value })}
                    style={s.input} required />
                </div>
                <div>
                  <label style={s.label}>Fin de période</label>
                  <input type="date" value={form.period_end}
                    onChange={e => setForm({ ...form, period_end: e.target.value })}
                    style={s.input} required />
                </div>
              </div>

              {error && <div style={s.alertError}>{error}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button type="button" onClick={() => setShowGen(false)} style={s.btnSecondary}>Annuler</button>
                <button type="submit" disabled={genLoading} style={s.btnPrimary}>
                  {genLoading ? "Génération…" : "🧾 Générer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  btnPrimary:   { background: "linear-gradient(135deg,#0f2942,#1a4a7a)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  btnSecondary: { background: "#fff", color: "#64748B", border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  alertError:   { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 },
  alertSuccess: { background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "10px 14px", color: "#059669", fontSize: 13, marginBottom: 14 },
  label:        { display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 },
  input:        { width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
};
