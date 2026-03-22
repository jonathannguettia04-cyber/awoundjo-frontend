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

export default function ProviderScan() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: recherche, 2: vérification, 3: acte, 4: succès
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
    providerClientAPI.eligibility(client.id, serviceType)
      .then(r => setEligibility(r.data))
      .catch(() => {});
  }, [serviceType, client]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError("");
    try {
      const q = query.trim().toUpperCase();
      // Essayer scan direct d'abord
      try {
        const { data } = await providerClientAPI.scan(q);
        setClient(data.client);
        const elig = await providerClientAPI.eligibility(data.client.id, serviceType);
        setEligibility(elig.data);
        setStep(2);
        return;
      } catch {}
      // Sinon recherche
      const { data } = await providerClientAPI.search(query);
      if (!data.clients?.length) { setError("Aucun assuré trouvé pour ce numéro ou téléphone."); return; }
      const { data: d } = await providerClientAPI.scan(data.clients[0].mutual_number);
      setClient(d.client);
      const elig = await providerClientAPI.eligibility(d.client.id, serviceType);
      setEligibility(elig.data);
      setStep(2);
    } catch {
      setError("Assuré introuvable. Vérifiez le numéro mutualiste ou le téléphone.");
    } finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!client || !totalAmount) return;
    setSaving(true); setError("");
    try {
      const { data } = await providerServiceAPI.create({
        client_id: client.id,
        service_type: serviceType,
        description,
        total_amount: Number(totalAmount),
      });
      setSuccess(data.service);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally { setSaving(false); }
  }

  function reset() {
    setStep(1); setQuery(""); setClient(null); setEligibility(null);
    setError(""); setDescription(""); setTotalAmount(""); setSuccess(null);
    setServiceType("consultation");
  }

  const amount = Number(totalAmount) || 0;
  const coveragePct = eligibility?.coverage_pct || 0;
  const mutualPart = Math.round(amount * coveragePct / 100);
  const clientPart = amount - mutualPart;
  const plan = client ? (PLAN_CONFIG[client.plan] || PLAN_CONFIG.ESSENTIELLE) : null;

  return (
    <div style={s.page}>
      {/* ── Sidebar gauche ── */}
      <aside style={s.sidebar}>
        <div style={s.sideHeader}>
          <div style={s.sideIcon}>🏥</div>
          <div>
            <p style={s.sideTitle}>Prise en charge</p>
            <p style={s.sideSub}>Vérification & Acte médical</p>
          </div>
        </div>

        {/* Étapes */}
        <div style={s.steps}>
          {[
            { n: 1, label: "Identification", sub: "Numéro mutualiste" },
            { n: 2, label: "Vérification",   sub: "Contrôles de sécurité" },
            { n: 3, label: "Enregistrement", sub: "Saisie de l'acte" },
            { n: 4, label: "Confirmation",   sub: "Récapitulatif" },
          ].map(st => (
            <div key={st.n} style={s.stepItem}>
              <div style={{
                ...s.stepBullet,
                background: step > st.n ? "#10B981" : step === st.n ? "#2563EB" : "#E2E8F0",
                color: step >= st.n ? "#fff" : "#94A3B8",
              }}>
                {step > st.n ? "✓" : st.n}
              </div>
              {st.n < 4 && <div style={{ ...s.stepLine, background: step > st.n ? "#10B981" : "#E2E8F0" }} />}
              <div style={s.stepText}>
                <p style={{ ...s.stepLabel, color: step === st.n ? "#1E293B" : step > st.n ? "#10B981" : "#94A3B8" }}>
                  {st.label}
                </p>
                <p style={s.stepSub}>{st.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info établissement */}
        {client && step >= 2 && (
          <div style={s.clientMini}>
            <div style={{ ...s.clientAvatar, background: plan.bg, color: plan.color }}>
              {client.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={s.clientMiniName}>{client.name}</p>
              <p style={s.clientMiniNum}>{client.mutual_number}</p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Contenu principal ── */}
      <main style={s.main}>

        {/* ══ ÉTAPE 1 : RECHERCHE ══ */}
        {step === 1 && (
          <div style={s.stepContent}>
            <div style={s.stepHeader}>
              <h1 style={s.stepTitle}>Identification de l'assuré</h1>
              <p style={s.stepDesc}>Entrez le numéro mutualiste ou le téléphone de l'assuré pour démarrer la prise en charge.</p>
            </div>

            <form onSubmit={handleSearch} style={s.searchForm}>
              <div style={s.searchBox}>
                <span style={s.searchIcon}>🔍</span>
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="AWJ-2026-00001 ou numéro de téléphone…"
                  style={s.searchInput}
                />
                <button type="submit" disabled={loading} style={s.searchBtn}>
                  {loading ? <Spinner /> : "Rechercher →"}
                </button>
              </div>

              {error && (
                <div style={s.errorBox}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div style={s.searchHints}>
                <p style={s.hintsTitle}>Formats acceptés</p>
                <div style={s.hintsList}>
                  {[
                    { icon: "🪪", label: "Numéro mutualiste", ex: "AWJ-2026-00001" },
                    { icon: "📱", label: "Téléphone", ex: "0707080910" },
                  ].map(h => (
                    <div key={h.label} style={s.hintItem}>
                      <span style={s.hintIcon}>{h.icon}</span>
                      <div>
                        <p style={s.hintLabel}>{h.label}</p>
                        <p style={s.hintEx}>{h.ex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ══ ÉTAPE 2 : VÉRIFICATION ══ */}
        {step === 2 && client && (
          <div style={s.stepContent}>
            <div style={s.stepHeader}>
              <h1 style={s.stepTitle}>Vérification des droits</h1>
              <p style={s.stepDesc}>Contrôle complet des droits et éligibilité de l'assuré.</p>
            </div>

            {/* Carte identité assuré */}
            <div style={{ ...s.card, borderLeft: `4px solid ${plan.color}`, marginBottom: 20 }}>
              <div style={s.clientRow}>
                <div style={{ ...s.bigAvatar, background: plan.bg, color: plan.color }}>
                  {client.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={s.clientTopRow}>
                    <h2 style={s.clientName}>{client.name}</h2>
                    <StatusBadge status={client.status} />
                  </div>
                  <p style={s.clientNum}>{client.mutual_number}</p>
                  <div style={s.clientMeta}>
                    <span>📱 {client.phone}</span>
                    {client.city && <span>📍 {client.city}</span>}
                    <span style={{ ...s.planBadge, background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>
                      {client.plan} · {plan.coverage} couverts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grille de vérifications */}
            <div style={s.checksGrid}>

              {/* Adhésion */}
              <CheckCard
                icon="🪪"
                title="Adhésion"
                status={client.status === "active" ? "ok" : "error"}
                value={client.status === "active" ? "Active" : client.status === "suspended" ? "Suspendue" : "Renouvellement requis"}
                detail={`Expire : ${fmtDate(client.expiration_date)}`}
              />

              {/* Cotisations */}
              <CheckCard
                icon="💰"
                title="Cotisations"
                status={client.contribution_ok ? "ok" : "error"}
                value={client.contribution_ok ? "À jour" : `${client.late_months} mois en retard`}
                detail={client.contribution_ok ? "Toutes les cotisations sont réglées" : "Des mensualités sont impayées"}
              />

              {/* Plafond annuel */}
              <CheckCard
                icon="📊"
                title="Plafond annuel"
                status={client.ceiling_ok !== false ? "ok" : "warning"}
                value={client.ceiling_ok !== false ? "Non atteint" : "Atteint"}
                detail={`Utilisé : ${fmt(client.used_ceiling || 0)} / ${fmt(client.annual_ceiling || 0)}`}
                progress={client.annual_ceiling ? (client.used_ceiling / client.annual_ceiling) * 100 : 0}
              />

              {/* Éligibilité type de soin */}
              <CheckCard
                icon="✅"
                title="Éligibilité au soin"
                status={eligibility?.eligible ? "ok" : "error"}
                value={eligibility?.eligible ? `Couvert à ${eligibility.coverage_pct}%` : "Non éligible"}
                detail={!eligibility?.eligible
                  ? (!eligibility?.is_active ? "Adhésion inactive" : `${eligibility?.late_months || 0} mois de retard`)
                  : "Prise en charge mutuelle applicable"
                }
              />

              {/* Dépendants */}
              <CheckCard
                icon="👨‍👩‍👧‍👦"
                title="Bénéficiaires couverts"
                status="info"
                value={`${1 + (client.dependents_summary?.spouse || 0) + (client.dependents_summary?.children || 0)} personne(s)`}
                detail={`Titulaire + ${client.dependents_summary?.spouse || 0} conjoint(e) + ${client.dependents_summary?.children || 0} enfant(s)`}
              />

              {/* Soins récents */}
              <CheckCard
                icon="📋"
                title="Soins récents (30j)"
                status="info"
                value={`${client.recent_services || 0} acte(s)`}
                detail="Consultations et actes des 30 derniers jours"
              />
            </div>

            {/* Alerte si non éligible */}
            {!eligibility?.eligible && (
              <div style={s.alertBox}>
                <span style={{ fontSize: 24 }}>⛔</span>
                <div>
                  <p style={s.alertTitle}>Prise en charge non applicable</p>
                  <p style={s.alertDesc}>
                    {!client.contribution_ok
                      ? `L'assuré a ${client.late_months} mois de cotisations impayées. La mutuelle ne peut pas intervenir.`
                      : client.status !== "active"
                      ? "L'adhésion de cet assuré n'est pas active."
                      : "Cet assuré n'est pas éligible à ce type de soin."}
                  </p>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div style={s.actionRow}>
              <button onClick={reset} style={s.btnSecondary}>← Nouvelle recherche</button>
              <button onClick={() => setStep(3)} style={{
                ...s.btnPrimary,
                opacity: !eligibility?.eligible ? 0.6 : 1,
              }}>
                Enregistrer un acte →
              </button>
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 3 : ENREGISTREMENT ══ */}
        {step === 3 && client && (
          <div style={s.stepContent}>
            <div style={s.stepHeader}>
              <h1 style={s.stepTitle}>Enregistrement de l'acte</h1>
              <p style={s.stepDesc}>Sélectionnez le type de soin et saisissez le montant total.</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Type de service */}
              <div style={s.card}>
                <p style={s.cardLabel}>Type de soin *</p>
                <div style={s.serviceGrid}>
                  {SERVICE_TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setServiceType(t.id)}
                      style={{
                        ...s.serviceCard,
                        border: `2px solid ${serviceType === t.id ? "#2563EB" : "#E2E8F0"}`,
                        background: serviceType === t.id ? "#EFF6FF" : "#fff",
                      }}>
                      <span style={{ fontSize: 28 }}>{t.icon}</span>
                      <p style={{ ...s.serviceLabel, color: serviceType === t.id ? "#2563EB" : "#1E293B" }}>{t.label}</p>
                      <p style={s.serviceDesc}>{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description + montant */}
              <div style={{ ...s.card, marginTop: 16 }}>
                <div style={s.formRow}>
                  <div style={{ flex: 2 }}>
                    <p style={s.cardLabel}>Description de l'acte</p>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Détaillez l'acte médical, les médicaments ou les analyses…"
                      style={s.textarea}
                      rows={3}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.cardLabel}>Montant total (FCFA) *</p>
                    <input
                      required
                      type="number"
                      min="0"
                      value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)}
                      placeholder="Ex : 15 000"
                      style={s.amountInput}
                    />
                  </div>
                </div>
              </div>

              {/* Calcul répartition */}
              {amount > 0 && (
                <div style={{ ...s.card, marginTop: 16, background: "#F8FAFC" }}>
                  <p style={s.cardLabel}>Répartition des coûts</p>
                  <div style={s.repartition}>
                    <RepartRow label="Montant total" value={fmt(amount)} color="#1E293B" bold />
                    <div style={s.repartDivider} />
                    <RepartRow label={`Part mutuelle (${coveragePct}%)`} value={fmt(mutualPart)} color="#2563EB" bold />
                    <RepartRow label="Part patient" value={fmt(clientPart)} color="#DC2626" bold />
                  </div>
                  {/* Barre visuelle */}
                  <div style={s.coverageBar}>
                    <div style={{ ...s.coverageFill, width: `${coveragePct}%` }} />
                  </div>
                  <div style={s.coverageLabels}>
                    <span style={{ color: "#2563EB", fontSize: 12, fontWeight: 600 }}>Mutuelle {coveragePct}%</span>
                    <span style={{ color: "#DC2626", fontSize: 12, fontWeight: 600 }}>Patient {100 - coveragePct}%</span>
                  </div>
                </div>
              )}

              {error && <div style={{ ...s.errorBox, marginTop: 12 }}><span>⚠️</span><span>{error}</span></div>}

              <div style={{ ...s.actionRow, marginTop: 20 }}>
                <button type="button" onClick={() => setStep(2)} style={s.btnSecondary}>← Retour</button>
                <button type="submit" disabled={saving || !totalAmount} style={{ ...s.btnPrimary, opacity: !totalAmount ? 0.5 : 1 }}>
                  {saving ? <><Spinner /> Enregistrement…</> : "✅ Valider l'acte"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══ ÉTAPE 4 : SUCCÈS ══ */}
        {step === 4 && success && (
          <div style={{ ...s.stepContent, textAlign: "center" }}>
            <div style={s.successIcon}>✅</div>
            <h1 style={{ ...s.stepTitle, marginBottom: 8 }}>Acte enregistré avec succès</h1>
            <p style={{ ...s.stepDesc, marginBottom: 32 }}>La prise en charge a été validée et enregistrée dans le système.</p>

            <div style={{ ...s.card, textAlign: "left", maxWidth: 480, margin: "0 auto 24px" }}>
              <p style={s.cardLabel}>Récapitulatif de la prise en charge</p>
              {[
                { label: "Assuré",         value: client.name },
                { label: "N° Mutualiste",  value: client.mutual_number },
                { label: "Type de soin",   value: SERVICE_TYPES.find(t => t.id === serviceType)?.label },
                { label: "Montant total",  value: fmt(success.total_amount) },
                { label: "Part mutuelle",  value: fmt(success.mutual_part), color: "#2563EB" },
                { label: "Part patient",   value: fmt(success.client_part), color: "#DC2626" },
                { label: "Couverture",     value: `${success.coverage_pct}%` },
              ].map((row, i) => (
                <div key={i} style={s.successRow}>
                  <span style={s.successLabel}>{row.label}</span>
                  <span style={{ ...s.successValue, color: row.color || "#1E293B" }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={s.actionRow}>
              <button onClick={reset} style={s.btnPrimary}>+ Nouvelle prise en charge</button>
              <button onClick={() => navigate("/etablissement/billing")} style={s.btnSecondary}>Voir la facturation →</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Composants utilitaires ─────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    active:           { label: "Actif",      bg: "#ECFDF5", color: "#059669" },
    suspended:        { label: "Suspendu",   bg: "#FEF2F2", color: "#DC2626" },
    renewal_required: { label: "Renouvellement", bg: "#FFFBEB", color: "#D97706" },
  }[status] || { label: status, bg: "#F1F5F9", color: "#64748B" };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
      {cfg.label}
    </span>
  );
}

function CheckCard({ icon, title, status, value, detail, progress }) {
  const colors = {
    ok:      { bg: "#F0FDF4", border: "#BBF7D0", icon: "#10B981", badge: "#ECFDF5", badgeText: "#059669" },
    error:   { bg: "#FEF2F2", border: "#FECACA", icon: "#EF4444", badge: "#FEF2F2", badgeText: "#DC2626" },
    warning: { bg: "#FFFBEB", border: "#FCD34D", icon: "#F59E0B", badge: "#FFFBEB", badgeText: "#D97706" },
    info:    { bg: "#F8FAFC", border: "#E2E8F0", icon: "#64748B", badge: "#F1F5F9", badgeText: "#475569" },
  }[status];

  const statusIcon = { ok: "✓", error: "✗", warning: "!", info: "i" }[status];

  return (
    <div style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{title}</span>
        </div>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: colors.icon, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
          {statusIcon}
        </div>
      </div>
      <p style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: "0 0 4px" }}>{value}</p>
      <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{detail}</p>
      {progress !== undefined && (
        <div style={{ marginTop: 8, background: "#E2E8F0", borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, background: progress > 80 ? "#EF4444" : progress > 50 ? "#F59E0B" : "#10B981", borderRadius: 4, transition: "width .5s" }} />
        </div>
      )}
    </div>
  );
}

function RepartRow({ label, value, color, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
      <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 500, color: color || "#1E293B" }}>{value}</span>
    </div>
  );
}

function Spinner() {
  return <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

// ── Styles ────────────────────────────────────────────────────────
const s = {
  page:         { display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans',system-ui,sans-serif" },
  sidebar:      { width: 280, background: "#fff", borderRight: "1px solid #E2E8F0", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 0, flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" },
  sideHeader:   { display: "flex", alignItems: "center", gap: 12, marginBottom: 36 },
  sideIcon:     { width: 44, height: 44, background: "linear-gradient(135deg,#2563EB,#1D4ED8)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  sideTitle:    { fontSize: 15, fontWeight: 800, color: "#1E293B" },
  sideSub:      { fontSize: 11, color: "#94A3B8", marginTop: 1 },
  steps:        { display: "flex", flexDirection: "column", gap: 0, marginBottom: 32 },
  stepItem:     { display: "flex", alignItems: "flex-start", gap: 12, position: "relative" },
  stepBullet:   { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, zIndex: 1 },
  stepLine:     { position: "absolute", left: 13, top: 28, width: 2, height: 32, zIndex: 0 },
  stepText:     { paddingBottom: 32 },
  stepLabel:    { fontSize: 13, fontWeight: 700, margin: "4px 0 2px" },
  stepSub:      { fontSize: 11, color: "#94A3B8" },
  clientMini:   { display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC", borderRadius: 12, padding: "12px 14px", marginTop: "auto", border: "1px solid #E2E8F0" },
  clientAvatar: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 },
  clientMiniName: { fontSize: 13, fontWeight: 700, color: "#1E293B" },
  clientMiniNum:  { fontSize: 11, color: "#94A3B8", fontFamily: "monospace" },

  main:         { flex: 1, padding: "40px 48px", overflowY: "auto" },
  stepContent:  { maxWidth: 780, margin: "0 auto" },
  stepHeader:   { marginBottom: 32 },
  stepTitle:    { fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 8px", letterSpacing: -.5 },
  stepDesc:     { fontSize: 15, color: "#64748B", margin: 0 },

  searchForm:   { display: "flex", flexDirection: "column", gap: 20 },
  searchBox:    { display: "flex", alignItems: "center", background: "#fff", border: "2px solid #E2E8F0", borderRadius: 16, padding: "6px 6px 6px 20px", boxShadow: "0 4px 20px rgba(0,0,0,.06)", transition: "border-color .2s" },
  searchIcon:   { fontSize: 20, marginRight: 12, flexShrink: 0 },
  searchInput:  { flex: 1, border: "none", outline: "none", fontSize: 16, color: "#1E293B", background: "transparent", fontFamily: "inherit" },
  searchBtn:    { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  searchHints:  { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 24px" },
  hintsTitle:   { fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  hintsList:    { display: "flex", gap: 20 },
  hintItem:     { display: "flex", alignItems: "center", gap: 10 },
  hintIcon:     { fontSize: 22 },
  hintLabel:    { fontSize: 13, fontWeight: 600, color: "#374151" },
  hintEx:       { fontSize: 12, color: "#94A3B8", fontFamily: "monospace" },

  card:         { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px" },
  cardLabel:    { fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },

  clientRow:    { display: "flex", alignItems: "flex-start", gap: 16 },
  bigAvatar:    { width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 24, flexShrink: 0 },
  clientTopRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  clientName:   { fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 },
  clientNum:    { fontSize: 13, color: "#94A3B8", fontFamily: "monospace", marginBottom: 8 },
  clientMeta:   { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  planBadge:    { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },

  checksGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 },

  alertBox:     { display: "flex", alignItems: "flex-start", gap: 14, background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 14, padding: "16px 20px", marginBottom: 20 },
  alertTitle:   { fontSize: 14, fontWeight: 700, color: "#DC2626", margin: "0 0 4px" },
  alertDesc:    { fontSize: 13, color: "#B91C1C", margin: 0 },

  actionRow:    { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 24 },
  btnPrimary:   { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 },
  btnSecondary: { background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "13px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  errorBox:     { display: "flex", alignItems: "center", gap: 10, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13, fontWeight: 500 },

  serviceGrid:  { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 },
  serviceCard:  { borderRadius: 12, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", background: "#fff", transition: "all .15s", fontFamily: "inherit" },
  serviceLabel: { fontSize: 13, fontWeight: 700, margin: 0 },
  serviceDesc:  { fontSize: 11, color: "#94A3B8", textAlign: "center", margin: 0 },

  formRow:      { display: "flex", gap: 20 },
  textarea:     { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", color: "#1E293B", boxSizing: "border-box" },
  amountInput:  { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", fontSize: 20, fontWeight: 800, fontFamily: "inherit", outline: "none", color: "#1E293B", boxSizing: "border-box" },

  repartition:  { background: "#fff", borderRadius: 10, padding: "4px 0" },
  repartDivider:{ height: 1, background: "#F1F5F9", margin: "4px 0" },
  coverageBar:  { height: 10, background: "#E2E8F0", borderRadius: 5, overflow: "hidden", marginTop: 14 },
  coverageFill: { height: "100%", background: "linear-gradient(90deg,#2563EB,#60A5FA)", borderRadius: 5, transition: "width .5s" },
  coverageLabels: { display: "flex", justifyContent: "space-between", marginTop: 6 },

  successIcon:  { fontSize: 64, marginBottom: 16 },
  successRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5F9" },
  successLabel: { fontSize: 13, color: "#64748B" },
  successValue: { fontSize: 14, fontWeight: 700 },
};
