// src/pages/provider/ProviderScan.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { providerClientAPI, providerServiceAPI } from "../../providerApi";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PLAN_CONFIG = {
  ESSENTIELLE: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", coverage: "50%" },
  IVOIRIENNE:  { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", coverage: "70%" },
  TURQUOISE:   { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", coverage: "80%" },
};

const SERVICE_TYPES = [
  { id: "consultation",    icon: "🩺", label: "Consultation",    desc: "Examen médical général" },
  { id: "pharmacy",        icon: "💊", label: "Pharmacie",       desc: "Médicaments et produits" },
  { id: "laboratory",      icon: "🔬", label: "Laboratoire",     desc: "Analyses et examens" },
  { id: "hospitalization", icon: "🏥", label: "Hospitalisation", desc: "Séjour hospitalier" },
];

const STEPS = [
  { n: 1, label: "Identification", sub: "Numéro mutualiste" },
  { n: 2, label: "Vérification",   sub: "Contrôles" },
  { n: 3, label: "Enregistrement", sub: "Saisie de l'acte" },
  { n: 4, label: "Confirmation",   sub: "Récapitulatif" },
];

export default function ProviderScan() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [error, setError] = useState("");
  const [serviceType, setServiceType] = useState("consultation");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!client || !serviceType) return;
    providerClientAPI.eligibility(client.id, serviceType).then(r => setEligibility(r.data)).catch(() => {});
  }, [serviceType, client]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError("");
    try {
      const q = query.trim().toUpperCase();
      try {
        const { data } = await providerClientAPI.scan(q);
        setClient(data.client);
        const elig = await providerClientAPI.eligibility(data.client.id, serviceType);
        setEligibility(elig.data); setStep(2); return;
      } catch {}
      const { data } = await providerClientAPI.search(query);
      if (!data.clients?.length) { setError("Aucun assuré trouvé."); return; }
      const { data: d } = await providerClientAPI.scan(data.clients[0].mutual_number);
      setClient(d.client);
      const elig = await providerClientAPI.eligibility(d.client.id, serviceType);
      setEligibility(elig.data); setStep(2);
    } catch { setError("Assuré introuvable. Vérifiez le numéro mutualiste ou le téléphone."); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!client || !totalAmount) return;
    setSaving(true); setError("");
    try {
      const { data } = await providerServiceAPI.create({ client_id: client.id, service_type: serviceType, description, total_amount: Number(totalAmount) });
      setSuccess(data.service); setStep(4);
    } catch (err) { setError(err.response?.data?.error || "Erreur lors de l'enregistrement"); }
    finally { setSaving(false); }
  }

  function reset() {
    setStep(1); setQuery(""); setClient(null); setEligibility(null);
    setError(""); setDescription(""); setTotalAmount(""); setSuccess(null); setServiceType("consultation");
  }

  const amount = Number(totalAmount) || 0;
  const coveragePct = eligibility?.coverage_pct || 0;
  const mutualPart = Math.round(amount * coveragePct / 100);
  const clientPart = amount - mutualPart;
  const plan = client ? (PLAN_CONFIG[client.plan] || PLAN_CONFIG.ESSENTIELLE) : null;

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ps-layout { display: flex; min-height: 100vh; }
        .ps-sidebar { display: flex !important; }
        .ps-mobile-steps { display: none !important; }
        .ps-main { padding: 40px 48px !important; }
        .ps-checks { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .ps-services { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .ps-form-row { display: flex; gap: 16px; }
        .ps-action-row { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .ps-hints { display: flex; gap: 20px; }
        .ps-search-box { display: flex; align-items: center; }
        @media (max-width: 768px) {
          .ps-sidebar { display: none !important; }
          .ps-mobile-steps { display: flex !important; }
          .ps-main { padding: 16px !important; }
          .ps-checks { grid-template-columns: 1fr 1fr !important; }
          .ps-services { grid-template-columns: 1fr 1fr !important; }
          .ps-form-row { flex-direction: column !important; }
          .ps-action-row { flex-direction: column !important; }
          .ps-action-row button { width: 100%; justify-content: center; }
          .ps-hints { flex-direction: column; gap: 10px !important; }
          .ps-search-box { flex-wrap: wrap; gap: 8px; padding: 10px 12px !important; }
          .ps-search-btn { width: 100% !important; justify-content: center; }
        }
        @media (max-width: 420px) {
          .ps-checks { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="ps-layout">

        {/* ── Sidebar desktop ── */}
        <aside className="ps-sidebar" style={s.sidebar}>
          <div style={s.sideHeader}>
            <div style={s.sideIcon}>🏥</div>
            <div>
              <p style={s.sideTitle}>Prise en charge</p>
              <p style={s.sideSub}>Vérification & Acte médical</p>
            </div>
          </div>
          <div style={s.steps}>
            {STEPS.map(st => (
              <div key={st.n} style={s.stepItem}>
                <div style={{ ...s.stepBullet, background: step > st.n ? "#10B981" : step === st.n ? "#2563EB" : "#E2E8F0", color: step >= st.n ? "#fff" : "#94A3B8" }}>
                  {step > st.n ? "✓" : st.n}
                </div>
                {st.n < 4 && <div style={{ ...s.stepLine, background: step > st.n ? "#10B981" : "#E2E8F0" }} />}
                <div style={s.stepText}>
                  <p style={{ ...s.stepLabel, color: step === st.n ? "#1E293B" : step > st.n ? "#10B981" : "#94A3B8" }}>{st.label}</p>
                  <p style={s.stepSub}>{st.sub}</p>
                </div>
              </div>
            ))}
          </div>
          {client && step >= 2 && (
            <div style={s.clientMini}>
              <div style={{ ...s.clientAvatar, background: plan.bg, color: plan.color }}>{client.name?.charAt(0).toUpperCase()}</div>
              <div>
                <p style={s.clientMiniName}>{client.name}</p>
                <p style={s.clientMiniNum}>{client.mutual_number}</p>
              </div>
            </div>
          )}
        </aside>

        {/* ── Contenu principal ── */}
        <main className="ps-main" style={s.main}>

          {/* Stepper horizontal mobile */}
          <div className="ps-mobile-steps" style={{ alignItems: "center", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {STEPS.map((st, i) => (
              <div key={st.n} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, background: step > st.n ? "#10B981" : step === st.n ? "#2563EB" : "#E2E8F0", color: step >= st.n ? "#fff" : "#94A3B8" }}>
                    {step > st.n ? "✓" : st.n}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: step === st.n ? 700 : 500, color: step === st.n ? "#1E293B" : "#94A3B8", whiteSpace: "nowrap" }}>{st.label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 20, height: 2, background: step > st.n ? "#10B981" : "#E2E8F0", flexShrink: 0 }} />}
              </div>
            ))}
          </div>

          {/* ══ ÉTAPE 1 ══ */}
          {step === 1 && (
            <div style={s.stepContent}>
              <div style={s.stepHeader}>
                <h1 style={s.stepTitle}>Identification de l'assuré</h1>
                <p style={s.stepDesc}>Entrez le numéro mutualiste ou le téléphone de l'assuré pour démarrer la prise en charge.</p>
              </div>
              <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="ps-search-box" style={s.searchBox}>
                  <span style={s.searchIcon}>🔍</span>
                  <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="AWJ-2026-00001 ou numéro de téléphone…" style={{ ...s.searchInput, minWidth: 0 }} />
                  <button type="submit" disabled={loading} className="ps-search-btn" style={s.searchBtn}>
                    {loading ? <Spinner /> : "Rechercher →"}
                  </button>
                </div>
                {error && <div style={s.errorBox}><span>⚠️</span><span>{error}</span></div>}
                <div style={s.searchHints}>
                  <p style={s.hintsTitle}>Formats acceptés</p>
                  <div className="ps-hints" style={s.hintsList}>
                    {[{ icon: "🪪", label: "Numéro mutualiste", ex: "AWJ-2026-00001" }, { icon: "📱", label: "Téléphone", ex: "0707080910" }].map(h => (
                      <div key={h.label} style={s.hintItem}>
                        <span style={{ fontSize: 22 }}>{h.icon}</span>
                        <div><p style={s.hintLabel}>{h.label}</p><p style={s.hintEx}>{h.ex}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ══ ÉTAPE 2 ══ */}
          {step === 2 && client && (
            <div style={s.stepContent}>
              <div style={s.stepHeader}>
                <h1 style={s.stepTitle}>Vérification des droits</h1>
                <p style={s.stepDesc}>Contrôle complet des droits et éligibilité de l'assuré.</p>
              </div>
              <div style={{ ...s.card, borderLeft: `4px solid ${plan.color}`, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ ...s.bigAvatar, background: plan.bg, color: plan.color }}>{client.name?.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: "clamp(16px,4vw,20px)", fontWeight: 800, color: "#0F172A", margin: 0 }}>{client.name}</h2>
                      <StatusBadge status={client.status} />
                    </div>
                    <p style={{ fontSize: 13, color: "#94A3B8", fontFamily: "monospace", marginBottom: 8 }}>{client.mutual_number}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "#64748B" }}>📱 {client.phone}</span>
                      {client.city && <span style={{ fontSize: 13, color: "#64748B" }}>📍 {client.city}</span>}
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>{client.plan} · {plan.coverage}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ps-checks">
                <CheckCard icon="🪪" title="Adhésion" status={client.status === "active" ? "ok" : "error"} value={client.status === "active" ? "Active" : "Suspendue"} detail={`Expire : ${fmtDate(client.expiration_date)}`} />
                <CheckCard icon="💰" title="Cotisations" status={client.contribution_ok ? "ok" : "error"} value={client.contribution_ok ? "À jour" : `${client.late_months} mois en retard`} detail={client.contribution_ok ? "Toutes les cotisations réglées" : "Des mensualités sont impayées"} />
                <CheckCard icon="✅" title="Éligibilité" status={eligibility?.eligible ? "ok" : "error"} value={eligibility?.eligible ? `Couvert à ${eligibility.coverage_pct}%` : "Non éligible"} detail={!eligibility?.eligible ? (!eligibility?.is_active ? "Adhésion inactive" : `${eligibility?.late_months || 0} mois de retard`) : "Prise en charge applicable"} />
                <CheckCard icon="👨‍👩‍👧‍👦" title="Bénéficiaires" status="info" value={`${1 + (client.dependents_summary?.spouse || 0) + (client.dependents_summary?.children || 0)} personne(s)`} detail={`Titulaire + ${client.dependents_summary?.spouse || 0} conjoint + ${client.dependents_summary?.children || 0} enfant(s)`} />
              </div>

              {!eligibility?.eligible && (
                <div style={s.alertBox}>
                  <span style={{ fontSize: 22 }}>⛔</span>
                  <div>
                    <p style={s.alertTitle}>Prise en charge non applicable</p>
                    <p style={s.alertDesc}>{!client.contribution_ok ? `L'assuré a ${client.late_months} mois de cotisations impayées.` : "L'adhésion de cet assuré n'est pas active."}</p>
                  </div>
                </div>
              )}
              <div className="ps-action-row">
                <button onClick={reset} style={s.btnSecondary}>← Nouvelle recherche</button>
                <button onClick={() => setStep(3)} style={{ ...s.btnPrimary, opacity: !eligibility?.eligible ? 0.6 : 1 }}>Enregistrer un acte →</button>
              </div>
            </div>
          )}

          {/* ══ ÉTAPE 3 ══ */}
          {step === 3 && client && (
            <div style={s.stepContent}>
              <div style={s.stepHeader}>
                <h1 style={s.stepTitle}>Enregistrement de l'acte</h1>
                <p style={s.stepDesc}>Sélectionnez le type de soin et saisissez le montant total.</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={s.card}>
                  <p style={s.cardLabel}>Type de soin *</p>
                  <div className="ps-services">
                    {SERVICE_TYPES.map(t => (
                      <button key={t.id} type="button" onClick={() => setServiceType(t.id)}
                        style={{ ...s.serviceCard, border: `2px solid ${serviceType === t.id ? "#2563EB" : "#E2E8F0"}`, background: serviceType === t.id ? "#EFF6FF" : "#fff" }}>
                        <span style={{ fontSize: 26 }}>{t.icon}</span>
                        <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: serviceType === t.id ? "#2563EB" : "#1E293B" }}>{t.label}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", margin: 0 }}>{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ ...s.card, marginTop: 14 }}>
                  <div className="ps-form-row">
                    <div style={{ flex: 2 }}>
                      <p style={s.cardLabel}>Description de l'acte</p>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Détaillez l'acte médical, les médicaments ou les analyses…" style={s.textarea} rows={3} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={s.cardLabel}>Montant total (FCFA) *</p>
                      <input required type="number" min="0" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Ex : 15 000" style={s.amountInput} />
                    </div>
                  </div>
                </div>

                {amount > 0 && (
                  <div style={{ ...s.card, marginTop: 14, background: "#F8FAFC" }}>
                    <p style={s.cardLabel}>Répartition des coûts</p>
                    {[{ label: "Montant total", value: fmt(amount), color: "#1E293B" }, { label: `Part mutuelle (${coveragePct}%)`, value: fmt(mutualPart), color: "#2563EB" }, { label: "Part patient", value: fmt(clientPart), color: "#DC2626" }].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 2 ? "1px solid #F1F5F9" : "none" }}>
                        <span style={{ fontSize: 13, color: "#64748B" }}>{row.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden", marginTop: 12 }}>
                      <div style={{ height: "100%", width: `${coveragePct}%`, background: "linear-gradient(90deg,#2563EB,#60A5FA)", borderRadius: 4, transition: "width .5s" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ color: "#2563EB", fontSize: 12, fontWeight: 600 }}>Mutuelle {coveragePct}%</span>
                      <span style={{ color: "#DC2626", fontSize: 12, fontWeight: 600 }}>Patient {100 - coveragePct}%</span>
                    </div>
                  </div>
                )}

                {error && <div style={{ ...s.errorBox, marginTop: 12 }}><span>⚠️</span><span>{error}</span></div>}
                <div className="ps-action-row">
                  <button type="button" onClick={() => setStep(2)} style={s.btnSecondary}>← Retour</button>
                  <button type="submit" disabled={saving || !totalAmount} style={{ ...s.btnPrimary, opacity: !totalAmount ? 0.5 : 1 }}>
                    {saving ? <><Spinner /> Enregistrement…</> : "✅ Valider l'acte"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══ ÉTAPE 4 ══ */}
          {step === 4 && success && (
            <div style={{ ...s.stepContent, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
              <h1 style={{ ...s.stepTitle, marginBottom: 8 }}>Acte enregistré avec succès</h1>
              <p style={{ ...s.stepDesc, marginBottom: 24 }}>La prise en charge a été validée et enregistrée dans le système.</p>
              <div style={{ ...s.card, textAlign: "left", maxWidth: 480, margin: "0 auto 20px" }}>
                <p style={s.cardLabel}>Récapitulatif</p>
                {[
                  { label: "Assuré",        value: client.name },
                  { label: "N° Mutualiste", value: client.mutual_number },
                  { label: "Type de soin",  value: SERVICE_TYPES.find(t => t.id === serviceType)?.label },
                  { label: "Montant total", value: fmt(success.total_amount) },
                  { label: "Part mutuelle", value: fmt(success.mutual_part), color: "#2563EB" },
                  { label: "Part patient",  value: fmt(success.client_part), color: "#DC2626" },
                  { label: "Couverture",    value: `${success.coverage_pct}%` },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                    <span style={{ fontSize: 13, color: "#64748B" }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.color || "#1E293B" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="ps-action-row" style={{ justifyContent: "center" }}>
                <button onClick={reset} style={s.btnPrimary}>+ Nouvelle prise en charge</button>
                <button onClick={() => navigate("/etablissement/billing")} style={s.btnSecondary}>Voir la facturation →</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = { active: { label: "Actif", bg: "#ECFDF5", color: "#059669" }, suspended: { label: "Suspendu", bg: "#FEF2F2", color: "#DC2626" }, renewal_required: { label: "Renouvellement", bg: "#FFFBEB", color: "#D97706" } }[status] || { label: status, bg: "#F1F5F9", color: "#64748B" };
  return <span style={{ background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>{cfg.label}</span>;
}

function CheckCard({ icon, title, status, value, detail, progress }) {
  const c = { ok: { bg: "#F0FDF4", border: "#BBF7D0", ic: "#10B981" }, error: { bg: "#FEF2F2", border: "#FECACA", ic: "#EF4444" }, warning: { bg: "#FFFBEB", border: "#FCD34D", ic: "#F59E0B" }, info: { bg: "#F8FAFC", border: "#E2E8F0", ic: "#64748B" } }[status];
  const si = { ok: "✓", error: "✗", warning: "!", info: "i" }[status];
  return (
    <div style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{title}</span>
        </div>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: c.ic, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{si}</div>
      </div>
      <p style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: "0 0 3px" }}>{value}</p>
      <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>{detail}</p>
      {progress !== undefined && (
        <div style={{ marginTop: 8, background: "#E2E8F0", borderRadius: 4, height: 5, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, background: progress > 80 ? "#EF4444" : progress > 50 ? "#F59E0B" : "#10B981", borderRadius: 4 }} />
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

const s = {
  sidebar:    { width: 260, background: "#fff", borderRight: "1px solid #E2E8F0", padding: "24px 20px", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" },
  sideHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 32 },
  sideIcon:   { width: 42, height: 42, background: "linear-gradient(135deg,#2563EB,#1D4ED8)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  sideTitle:  { fontSize: 14, fontWeight: 800, color: "#1E293B" },
  sideSub:    { fontSize: 11, color: "#94A3B8" },
  steps:      { display: "flex", flexDirection: "column", flex: 1 },
  stepItem:   { display: "flex", alignItems: "flex-start", gap: 10, position: "relative" },
  stepBullet: { width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, zIndex: 1 },
  stepLine:   { position: "absolute", left: 12, top: 26, width: 2, height: 30, zIndex: 0 },
  stepText:   { paddingBottom: 30 },
  stepLabel:  { fontSize: 13, fontWeight: 700, margin: "3px 0 2px" },
  stepSub:    { fontSize: 11, color: "#94A3B8" },
  clientMini: { display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC", borderRadius: 12, padding: "12px", border: "1px solid #E2E8F0", marginTop: "auto" },
  clientAvatar: { width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 },
  clientMiniName: { fontSize: 13, fontWeight: 700, color: "#1E293B" },
  clientMiniNum:  { fontSize: 11, color: "#94A3B8", fontFamily: "monospace" },
  main:       { flex: 1, padding: "40px 48px", overflowY: "auto", minWidth: 0 },
  stepContent:{ maxWidth: 760, margin: "0 auto" },
  stepHeader: { marginBottom: 24 },
  stepTitle:  { fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", letterSpacing: -.5 },
  stepDesc:   { fontSize: 14, color: "#64748B", margin: 0 },
  searchBox:  { display: "flex", alignItems: "center", background: "#fff", border: "2px solid #E2E8F0", borderRadius: 14, padding: "6px 6px 6px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.06)" },
  searchIcon: { fontSize: 20, marginRight: 10, flexShrink: 0 },
  searchInput:{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#1E293B", background: "transparent", fontFamily: "inherit" },
  searchBtn:  { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  searchHints:{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "16px 20px" },
  hintsTitle: { fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  hintsList:  { display: "flex", gap: 20 },
  hintItem:   { display: "flex", alignItems: "center", gap: 10 },
  hintLabel:  { fontSize: 13, fontWeight: 600, color: "#374151" },
  hintEx:     { fontSize: 12, color: "#94A3B8", fontFamily: "monospace" },
  card:       { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "18px 20px" },
  cardLabel:  { fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  bigAvatar:  { width: 52, height: 52, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, flexShrink: 0 },
  alertBox:   { display: "flex", alignItems: "flex-start", gap: 12, background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 14, padding: "14px 18px", marginBottom: 16 },
  alertTitle: { fontSize: 14, fontWeight: 700, color: "#DC2626", margin: "0 0 4px" },
  alertDesc:  { fontSize: 13, color: "#B91C1C", margin: 0 },
  btnPrimary: { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 },
  btnSecondary:{ background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "13px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  errorBox:   { display: "flex", alignItems: "center", gap: 10, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13 },
  serviceCard:{ borderRadius: 12, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", background: "#fff", fontFamily: "inherit" },
  textarea:   { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", color: "#1E293B", boxSizing: "border-box" },
  amountInput:{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", fontSize: 20, fontWeight: 800, fontFamily: "inherit", outline: "none", color: "#1E293B", boxSizing: "border-box" },
};
