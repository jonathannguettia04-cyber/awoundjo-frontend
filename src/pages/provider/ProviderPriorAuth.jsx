// src/pages/provider/ProviderPriorAuth.jsx
import { useEffect, useState } from "react";
import { providerPriorAuthAPI, providerDoctorsAPI } from "../../providerApi";

const BLUE       = "#185FA5";
const BLUE_DARK  = "#0C447C";
const BLUE_DEEP  = "#042C53";
const BLUE_SOFT  = "rgba(24,95,165,.18)";
const GREEN      = "#22C55E";
const AMBER      = "#F59E0B";
const RED        = "#EF4444";

const S = {
  page:       { fontFamily: "'DM Sans',system-ui,sans-serif", padding: "24px 20px", maxWidth: 960, margin: "0 auto" },
  header:     { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  title:      { fontSize: 22, fontWeight: 800, color: BLUE_DEEP, margin: 0 },
  sub:        { fontSize: 13, color: "#64748B", marginTop: 4 },
  headerRight:{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  tabs:       { display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 4, gap: 4 },
  tab:        { padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all .2s" },
  tabActive:  { background: BLUE, color: "#fff", boxShadow: `0 4px 12px ${BLUE_SOFT}` },
  tabInactive:{ background: "transparent", color: "#64748B" },
  newBtn:     { padding: "10px 18px", background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  card:       { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  cardLeft:   { flex: 1, minWidth: 220 },
  clientName: { fontSize: 15, fontWeight: 700, color: "#0F172A" },
  actLabel:   { fontSize: 13, color: BLUE, fontWeight: 600, marginTop: 2 },
  meta:       { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  badge:      { display: "inline-block", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 },
  btn:        { padding: "10px 18px", background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  btnDisabled:{ opacity: .5, cursor: "not-allowed" },
  empty:      { textAlign: "center", padding: "60px 20px", color: "#94A3B8", fontSize: 14 },
  overlay:    { position: "fixed", inset: 0, background: "rgba(4,44,83,.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modal:      { background: "#fff", borderRadius: 20, padding: 26, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 18, fontWeight: 800, color: BLUE_DEEP, marginBottom: 2 },
  modalSub:   { fontSize: 13, color: "#64748B", marginBottom: 20 },
  field:      { marginBottom: 14 },
  label:      { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 },
  input:      { width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#0F172A" },
  select:     { width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#0F172A" },
  textarea:   { width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 13px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#0F172A", minHeight: 70, resize: "vertical" },
  err:        { background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: "10px 14px", color: "#B91C1C", fontSize: 13, marginBottom: 14 },
  modalBtns:  { display: "flex", gap: 10, marginTop: 6 },
  btnGhost:   { flex: 1, padding: "11px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  btnSubmit:  { flex: 2, padding: "11px", background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};

const STATUS_META = {
  PENDING:  { label: "En attente accord",   color: AMBER, bg: "rgba(245,158,11,.12)" },
  APPROVED: { label: "Accordé — à réaliser", color: GREEN, bg: "rgba(34,197,94,.12)" },
  REJECTED: { label: "Refusé",               color: RED,   bg: "rgba(239,68,68,.12)" },
  DONE:     { label: "Réalisé",              color: "#64748B", bg: "#F1F5F9" },
};

const TABS = ["APPROVED", "PENDING", "DONE", "REJECTED"];

export default function ProviderPriorAuth() {
  const [tab, setTab]           = useState("APPROVED");
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [active, setActive]     = useState(null);

  useEffect(() => { loadRequests(); }, [tab]);
  useEffect(() => { loadDoctors(); }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const { data } = await providerPriorAuthAPI.getAll({ status: tab });
      setRequests(data.prior_auth_requests || data.requests || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function loadDoctors() {
    try {
      const { data } = await providerDoctorsAPI.getAll(true);
      setDoctors(data.doctors || []);
    } catch (e) { console.error(e); }
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Accords préalables</h1>
          <div style={S.sub}>Actes lourds — hospitalisation, chirurgie, césarienne</div>
        </div>
        <div style={S.headerRight}>
          <div style={S.tabs}>
            {TABS.map(t => (
              <button key={t} style={{ ...S.tab, ...(tab === t ? S.tabActive : S.tabInactive) }}
                onClick={() => setTab(t)}>
                {STATUS_META[t].label}
              </button>
            ))}
          </div>
          <button style={S.newBtn} onClick={() => setShowNew(true)}>+ Nouvelle demande</button>
        </div>
      </div>

      {loading && <div style={S.empty}>Chargement…</div>}
      {!loading && requests.length === 0 && <div style={S.empty}>Aucune demande dans cette catégorie</div>}

      {!loading && requests.map(r => (
        <div key={r.id} style={S.card}>
          <div style={S.cardLeft}>
            <div style={S.clientName}>{r.client_name || "Assuré"} {r.mutual_number ? `· ${r.mutual_number}` : ""}</div>
            <div style={S.actLabel}>{r.catalog_label || r.description || r.catalog_code}</div>
            <div style={S.meta}>
              {r.client_plan && `Formule ${r.client_plan} · `}
              Demandé le {new Date(r.created_at).toLocaleDateString("fr-FR")}
              {r.estimated_amount && ` · Estimé : ${Number(r.estimated_amount).toLocaleString("fr-FR")} FCFA`}
              {r.preauth_code && ` · Code : ${r.preauth_code}`}
            </div>
          </div>
          <span style={{ ...S.badge, color: STATUS_META[r.status]?.color, background: STATUS_META[r.status]?.bg }}>
            {STATUS_META[r.status]?.label || r.status}
          </span>
          {r.status === "APPROVED" && (
            <button style={S.btn} onClick={() => setActive(r)}>Exécuter →</button>
          )}
        </div>
      ))}

      {showNew && (
        <NewRequestModal
          onClose={() => setShowNew(false)}
          onDone={() => { setShowNew(false); loadRequests(); }}
        />
      )}

      {active && (
        <ExecuteModal
          request={active}
          doctors={doctors}
          onClose={() => setActive(null)}
          onDone={() => { setActive(null); loadRequests(); }}
        />
      )}
    </div>
  );
}

function NewRequestModal({ onClose, onDone }) {
  const [form, setForm] = useState({
    client_id: "", dependent_id: "", catalog_code: "",
    description: "", estimated_amount: "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.client_id || !form.catalog_code) {
      setError("Client et code acte sont obligatoires");
      return;
    }
    setLoading(true);
    try {
      await providerPriorAuthAPI.create({
        client_id: form.client_id,
        dependent_id: form.dependent_id || undefined,
        catalog_code: form.catalog_code,
        description: form.description || undefined,
        estimated_amount: form.estimated_amount ? Number(form.estimated_amount) : undefined,
      });
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally { setLoading(false); }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>Nouvelle demande d'accord préalable</div>
        <div style={S.modalSub}>Pour un acte lourd nécessitant validation Awoundjô avant exécution</div>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>ID Client *</label>
            <input style={S.input} required placeholder="Scanner ou saisir l'ID du client"
              value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} />
          </div>
          <div style={S.field}>
            <label style={S.label}>ID Ayant droit (si applicable)</label>
            <input style={S.input} placeholder="Optionnel"
              value={form.dependent_id} onChange={e => setForm({ ...form, dependent_id: e.target.value })} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Code acte (catalogue) *</label>
            <input style={S.input} required placeholder="Ex : HOSP-CHIR-01"
              value={form.catalog_code} onChange={e => setForm({ ...form, catalog_code: e.target.value })} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Description</label>
            <textarea style={S.textarea} placeholder="Précisions sur l'acte…"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Montant estimé (FCFA)</label>
            <input style={S.input} type="number" min="0" placeholder="Optionnel"
              value={form.estimated_amount} onChange={e => setForm({ ...form, estimated_amount: e.target.value })} />
          </div>

          <div style={S.modalBtns}>
            <button type="button" style={S.btnGhost} onClick={onClose}>Annuler</button>
            <button type="submit" style={{ ...S.btnSubmit, ...(loading ? S.btnDisabled : {}) }} disabled={loading}>
              {loading ? "Envoi…" : "Soumettre la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExecuteModal({ request, doctors, onClose, onDone }) {
  const [totalAmount, setTotalAmount] = useState(request.estimated_amount || "");
  const [doctorId, setDoctorId]       = useState("");
  const [notes, setNotes]             = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!totalAmount || Number(totalAmount) <= 0) {
      setError("Le montant total est obligatoire");
      return;
    }
    setLoading(true);
    try {
      await providerPriorAuthAPI.perform(request.id, {
        total_amount: Number(totalAmount),
        doctor_id: doctorId || undefined,
        result_notes: notes || undefined,
      });
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'exécution");
    } finally { setLoading(false); }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>Exécuter l'acte</div>
        <div style={S.modalSub}>{request.catalog_label || request.description} — {request.client_name}</div>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Montant total (FCFA) *</label>
            <input style={S.input} type="number" min="1" required
              value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
          </div>

          <div style={S.field}>
            <label style={S.label}>Médecin / prescripteur</label>
            <select style={S.select} value={doctorId} onChange={e => setDoctorId(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.full_name}{d.specialty ? ` · ${d.specialty}` : ""}</option>
              ))}
            </select>
          </div>

          <div style={S.field}>
            <label style={S.label}>Observations / résultats</label>
            <textarea style={S.textarea} placeholder="Notes optionnelles…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div style={S.modalBtns}>
            <button type="button" style={S.btnGhost} onClick={onClose}>Annuler</button>
            <button type="submit" style={{ ...S.btnSubmit, ...(loading ? S.btnDisabled : {}) }} disabled={loading}>
              {loading ? "Enregistrement…" : "Confirmer l'exécution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
