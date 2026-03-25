// src/pages/diaspora/DiasporaPages.jsx
// ─────────────────────────────────────────────────────────────
//  Toutes les pages du module Diaspora Awoundjô
//  Exports nommés utilisés dans App.jsx via diasporaPage()
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  diasporaBeneAPI,
  diasporaPayAPI,
  diasporaCommAPI,
  diasporaRefAPI,
  diasporaNetAPI,
  diasporaLeaderAPI,
  diasporaNotifAPI,
  getDiasporaData,
} from "../../diasporaApi";

// ── Palette couleurs Awoundjô ─────────────────────────────────
// Bleu principal + vert santé + or accent
const C = {
  blue:    "#1B4FD8",
  blueL:   "#EEF2FF",
  green:   "#059669",
  greenL:  "#ECFDF5",
  gold:    "#D97706",
  goldL:   "#FFFBEB",
  red:     "#DC2626",
  redL:    "#FEF2F2",
  slate:   "#64748B",
  dark:    "#0F172A",
  border:  "#E2E8F0",
  bg:      "#F8FAFC",
};

// ── Helpers UI ────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const roleLabel = {
  DIRIGEANTE: { label: "Dirigeante", color: "#7C3AED", bg: "#F5F3FF" },
  DIASPORA:   { label: "Diaspora",   color: "#1B4FD8", bg: "#EEF2FF" },
  PAYS:       { label: "Pays",       color: "#059669", bg: "#ECFDF5" },
  VILLE:      { label: "Ville",      color: "#D97706", bg: "#FFFBEB" },
  RECRUTEUR:  { label: "Recruteur",  color: "#64748B", bg: "#F1F5F9" },
};

function RoleBadge({ role }) {
  const r = roleLabel[role] || roleLabel.RECRUTEUR;
  return (
    <span style={{
      background: r.bg, color: r.color,
      padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
    }}>
      {r.label}
    </span>
  );
}

function StatusDot({ active }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8,
      borderRadius: "50%", marginRight: 6,
      background: active ? C.green : C.slate,
    }} />
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.dark }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", color: C.slate, fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
      <div style={{
        width: 36, height: 36, border: `3px solid ${C.blueL}`,
        borderTop: `3px solid ${C.blue}`, borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: C.slate }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 15 }}>{title}</p>
      {desc && <p style={{ margin: "6px 0 0", fontSize: 13 }}>{desc}</p>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", style = {}, disabled = false }) {
  const styles = {
    primary: { background: C.blue, color: "#fff", border: "none" },
    outline: { background: "#fff", color: C.blue, border: `1.5px solid ${C.blue}` },
    ghost:   { background: "transparent", color: C.slate, border: "none" },
    danger:  { background: C.red, color: "#fff", border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 0.15s",
        ...styles[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : BÉNÉFICIAIRES
// ═════════════════════════════════════════════════════════════
export function DiasporaBeneficiaries() {
  const navigate = useNavigate();
  const [benes, setBenes]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diasporaBeneAPI.getAll().then(r => setBenes(r.data.beneficiaries || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        title="Mes bénéficiaires"
        subtitle={`${benes.length} bénéficiaire(s) enregistré(s)`}
        action={<Btn onClick={() => navigate("/diaspora/beneficiaries/new")}>➕ Nouveau</Btn>}
      />
      {loading ? <Loader /> : benes.length === 0 ? (
        <EmptyState icon="👤" title="Aucun bénéficiaire" desc="Ajoutez votre premier bénéficiaire" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {benes.map(b => (
            <Card key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{b.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{b.phone} • {b.city}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, background: C.blueL, padding: "3px 10px", borderRadius: 999 }}>{b.plan}</span>
                <span style={{ fontSize: 12 }}>
                  <StatusDot active={b.status === "active"} />
                  {b.status === "active" ? "Actif" : "En attente"}
                </span>
                <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(b.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : NOUVEAU BÉNÉFICIAIRE
// ═════════════════════════════════════════════════════════════
export function DiasporaNewBeneficiary() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: "", phone: "", city: "", plan: "ESSENTIELLE" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const plans = [
    { value: "ESSENTIELLE", label: "🌿 Essentielle", desc: "Couverture de base" },
    { value: "IVOIRIENNE",  label: "🌍 Ivoirienne",  desc: "Couverture élargie" },
    { value: "TURQUOISE",   label: "💎 Turquoise",   desc: "Couverture premium" },
  ];

  const submit = async () => {
    if (!form.name) return setError("Le nom est requis");
    setLoading(true); setError("");
    try {
      await diasporaBeneAPI.create(form);
      navigate("/diaspora/beneficiaries");
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de la création");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <PageHeader title="Nouveau bénéficiaire" subtitle="Enregistrez un client sous votre parrainage" />
      <Card>
        {error && (
          <div style={{ background: C.redL, color: C.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}
        {[
          { key: "name", label: "Nom complet *", placeholder: "Jean Dupont" },
          { key: "phone", label: "Téléphone WhatsApp", placeholder: "+225 07 00 00 00 00" },
          { key: "city", label: "Ville", placeholder: "Abidjan" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>{f.label}</label>
            <input
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
                border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Offre choisie *</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {plans.map(p => (
              <div
                key={p.value}
                onClick={() => setForm(prev => ({ ...prev, plan: p.value }))}
                style={{
                  flex: 1, minWidth: 140, padding: "12px 14px", borderRadius: 10,
                  border: `2px solid ${form.plan === p.value ? C.blue : C.border}`,
                  background: form.plan === p.value ? C.blueL : "#fff",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 13 }}>{p.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={() => navigate(-1)}>Annuler</Btn>
          <Btn onClick={submit} disabled={loading}>{loading ? "Enregistrement…" : "✅ Enregistrer"}</Btn>
        </div>
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : PAIEMENTS
// ═════════════════════════════════════════════════════════════
export function DiasporaPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    diasporaPayAPI.getAll().then(r => setPayments(r.data.payments || [])).finally(() => setLoading(false));
  }, []);

  const statusStyle = {
    COMPLETED: { color: C.green,  bg: C.greenL, label: "✅ Complété" },
    PENDING:   { color: C.gold,   bg: C.goldL,  label: "⏳ En attente" },
    FAILED:    { color: C.red,    bg: C.redL,   label: "❌ Échoué" },
    REFUNDED:  { color: C.slate,  bg: C.bg,     label: "↩️ Remboursé" },
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        title="Mes paiements"
        subtitle={`${payments.length} paiement(s) enregistré(s)`}
        action={<Btn onClick={() => navigate("/diaspora/payments/new")}>💳 Nouveau paiement</Btn>}
      />
      {loading ? <Loader /> : payments.length === 0 ? (
        <EmptyState icon="💳" title="Aucun paiement" desc="Initiez votre premier paiement" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {payments.map(p => {
            const s = statusStyle[p.status] || statusStyle.PENDING;
            return (
              <Card key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{p.beneficiary_name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{p.plan} • {fmtDate(p.created_at)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontWeight: 800, color: C.dark, fontSize: 15 }}>{fmt(p.amount)} {p.currency}</p>
                    {p.amount_xof && <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{fmt(p.amount_xof)} FCFA</p>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 999 }}>
                    {s.label}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : NOUVEAU PAIEMENT
// ═════════════════════════════════════════════════════════════
export function DiasporaNewPayment() {
  const navigate = useNavigate();
  const [benes, setBenes]     = useState([]);
  const [form, setForm]       = useState({ beneficiary_id: "", amount: "", currency: "EUR", payment_type: "cotisation", payment_method: "stripe" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    diasporaBeneAPI.getAll().then(r => setBenes(r.data.beneficiaries || []));
  }, []);

  const methods = [
    { value: "stripe",       label: "💳 Carte bancaire",  desc: "Visa / Mastercard" },
    { value: "wave",         label: "🌊 Wave",            desc: "Mobile Money" },
    { value: "orange_money", label: "🟠 Orange Money",    desc: "Mobile Money" },
    { value: "mtn_money",    label: "🟡 MTN Money",       desc: "Mobile Money" },
  ];

  const submit = async () => {
    if (!form.beneficiary_id || !form.amount) return setError("Bénéficiaire et montant requis");
    setLoading(true); setError("");
    try {
      await diasporaPayAPI.initiate(form);
      navigate("/diaspora/payments");
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors du paiement");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <PageHeader title="Nouveau paiement" subtitle="Enregistrez une cotisation ou adhésion" />
      <Card>
        {error && (
          <div style={{ background: C.redL, color: C.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Bénéficiaire *</label>
          <select
            value={form.beneficiary_id}
            onChange={e => setForm(p => ({ ...p, beneficiary_id: e.target.value }))}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, background: "#fff", boxSizing: "border-box" }}
          >
            <option value="">— Sélectionner —</option>
            {benes.map(b => <option key={b.id} value={b.id}>{b.name} ({b.plan})</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Montant *</label>
            <input
              type="number" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Devise</label>
            <select
              value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, background: "#fff", boxSizing: "border-box" }}
            >
              {["EUR","USD","XOF","GBP","CHF"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Méthode de paiement</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {methods.map(m => (
              <div
                key={m.value}
                onClick={() => setForm(p => ({ ...p, payment_method: m.value }))}
                style={{
                  padding: "10px 12px", borderRadius: 10,
                  border: `2px solid ${form.payment_method === m.value ? C.blue : C.border}`,
                  background: form.payment_method === m.value ? C.blueL : "#fff",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: C.dark }}>{m.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={() => navigate(-1)}>Annuler</Btn>
          <Btn onClick={submit} disabled={loading}>{loading ? "Traitement…" : "✅ Valider le paiement"}</Btn>
        </div>
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : COMMISSIONS / GAINS
// ═════════════════════════════════════════════════════════════
export function DiasporaEarnings() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState("overview");

  useEffect(() => {
    diasporaCommAPI.getAll().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}><Loader /></div>;

  const t = data?.totals || {};
  const commissions = data?.commissions || [];

  const statCards = [
    { label: "Aujourd'hui",    value: t.today,      color: C.blue,  bg: C.blueL,  icon: "📅" },
    { label: "Cette semaine",  value: t.this_week,  color: C.green, bg: C.greenL, icon: "📆" },
    { label: "Ce mois",        value: t.this_month, color: C.gold,  bg: C.goldL,  icon: "🗓️" },
    { label: "Total gagné",    value: t.total_earned, color: "#7C3AED", bg: "#F5F3FF", icon: "💰" },
  ];

  const rules = [
    { cas: "Cas 1", desc: "DIASPORA recrute PAYS",      recruteur: "0%", ville: "0%", pays: "0%",   diaspora: "12%", dirigeante: "5%" },
    { cas: "Cas 2", desc: "PAYS recrute VILLE",         recruteur: "0%", ville: "0%", pays: "12%",  diaspora: "10%", dirigeante: "5%" },
    { cas: "Cas 3", desc: "RECRUTEUR recrute CLIENT",   recruteur: "12%",ville: "10%",pays: "10%",  diaspora: "10%", dirigeante: "5%" },
  ];

  return (
    <div style={{ padding: "24px 20px", maxWidth: 960, margin: "0 auto" }}>
      <PageHeader title="Mes gains" subtitle="Commissions et bonus réseau" />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#F1F5F9", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          { key: "overview", label: "Vue d'ensemble" },
          { key: "history",  label: "Historique" },
          { key: "rules",    label: "Règles MLM" },
        ].map(t2 => (
          <button key={t2.key} onClick={() => setTab(t2.key)} style={{
            padding: "6px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
            background: tab === t2.key ? "#fff" : "transparent",
            color: tab === t2.key ? C.dark : C.slate,
            boxShadow: tab === t2.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          }}>
            {t2.label}
          </button>
        ))}
      </div>

      {/* Vue d'ensemble */}
      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            {statCards.map(s => (
              <Card key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
                <p style={{ margin: 0, fontSize: 20 }}>{s.icon}</p>
                <p style={{ margin: "8px 0 4px", fontSize: 22, fontWeight: 800, color: s.color }}>{fmt(s.value)} €</p>
                <p style={{ margin: 0, fontSize: 12, color: C.slate, fontWeight: 600 }}>{s.label}</p>
              </Card>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card>
              <p style={{ margin: "0 0 12px", fontWeight: 700, color: C.dark }}>Statut des commissions</p>
              {[
                { label: "En attente",  value: t.pending,   color: C.gold  },
                { label: "Validées",    value: t.validated, color: C.blue  },
                { label: "Payées",      value: t.paid,      color: C.green },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.slate }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{fmt(s.value)} €</span>
                </div>
              ))}
            </Card>
            <Card>
              <p style={{ margin: "0 0 12px", fontWeight: 700, color: C.dark }}>Type de commissions</p>
              {[
                { label: "Ventes directes", value: t.direct_count,  icon: "🎯" },
                { label: "Réseau",          value: t.network_count, icon: "🌐" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.slate }}>{s.icon} {s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{s.value || 0}</span>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      {/* Historique */}
      {tab === "history" && (
        commissions.length === 0 ? <EmptyState icon="📊" title="Aucune commission" desc="Vos commissions apparaîtront ici après vos ventes" /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {commissions.map(c => (
            <Card key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 13 }}>{c.beneficiary_name || "—"}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>{c.plan} • {fmtDate(c.created_at)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: 800, color: C.green, fontSize: 15 }}>+{fmt(c.amount)} €</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{c.rate_pct}% • {c.source === "direct" ? "Direct" : "Réseau"}</p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                  background: c.status === "PAID" ? C.greenL : c.status === "VALIDATED" ? C.blueL : C.goldL,
                  color: c.status === "PAID" ? C.green : c.status === "VALIDATED" ? C.blue : C.gold,
                }}>
                  {c.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Règles MLM */}
      {tab === "rules" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rules.map(r => (
            <Card key={r.cas}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ background: C.blueL, color: C.blue, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{r.cas}</span>
                <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{r.desc}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {[
                  { role: "Recruteur", value: r.recruteur },
                  { role: "Ville",     value: r.ville },
                  { role: "Pays",      value: r.pays },
                  { role: "Diaspora",  value: r.diaspora },
                  { role: "Dirigeante",value: r.dirigeante },
                ].map(item => (
                  <div key={item.role} style={{ textAlign: "center", padding: "10px 6px", background: C.bg, borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: item.value === "0%" ? C.slate : C.green }}>{item.value}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: C.slate, fontWeight: 600 }}>{item.role}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : PARRAINAGE
// ═════════════════════════════════════════════════════════════
export function DiasporaReferral() {
  const [link, setLink]       = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    Promise.all([
      diasporaRefAPI.getLink(),
      diasporaRefAPI.getReferrals(),
    ]).then(([l, r]) => {
      setLink(l.data);
      setReferrals(r.data.referrals || []);
    }).finally(() => setLoading(false));
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(link?.link || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 860, margin: "0 auto" }}>
      <PageHeader title="Mon parrainage" subtitle="Recrutez et développez votre réseau" />

      {loading ? <Loader /> : (
        <>
          <Card style={{ marginBottom: 20, background: "linear-gradient(135deg, #1B4FD8 0%, #3B82F6 100%)", border: "none" }}>
            <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600 }}>MON CODE AMBASSADEUR</p>
            <p style={{ margin: "0 0 12px", color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: "0.08em" }}>{link?.code}</p>
            <RoleBadge role={link?.role} />
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={copy} style={{
                padding: "8px 18px", borderRadius: 8, border: "2px solid rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                {copied ? "✅ Copié !" : "📋 Copier le lien"}
              </button>
              {link?.whatsapp_message && (
                <a href={link.whatsapp_message} target="_blank" rel="noreferrer" style={{
                  padding: "8px 18px", borderRadius: 8, border: "none",
                  background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13,
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  📲 Partager sur WhatsApp
                </a>
              )}
            </div>
          </Card>

          <p style={{ fontWeight: 700, color: C.dark, marginBottom: 12 }}>
            Mes filleuls directs ({referrals.length})
          </p>
          {referrals.length === 0 ? (
            <EmptyState icon="👥" title="Aucun filleul" desc="Partagez votre lien pour recruter" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {referrals.map(r => (
                <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{r.referred_name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{r.country} • Rejoint le {fmtDate(r.joined_at)}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <RoleBadge role={r.referred_role} />
                    <span style={{ fontSize: 12 }}>
                      <StatusDot active={r.referred_status === "ACTIVE"} />
                      {r.referred_status === "ACTIVE" ? "Actif" : "Inactif"}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{fmt(r.commission_earned)} €</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : RÉSEAU MLM  ← NOUVELLE
// Données : network.level1 / level2 / level3 + totals
// ═════════════════════════════════════════════════════════════
export function DiasporaNetwork() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState(1);

  useEffect(() => {
    diasporaNetAPI.getNetwork().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}><Loader /></div>;

  const { network = {}, totals = {} } = data || {};
  const levels = { 1: network.level1 || [], 2: network.level2 || [], 3: network.level3 || [] };
  const currentList = levels[activeLevel];

  return (
    <div style={{ padding: "24px 20px", maxWidth: 960, margin: "0 auto" }}>
      <PageHeader
        title="Mon réseau"
        subtitle={`${totals.total || 0} membre(s) au total dans votre équipe`}
      />

      {/* Résumé total */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total réseau", value: totals.total || 0,   icon: "🌐", color: C.blue,  bg: C.blueL },
          { label: "Niveau 1",     value: totals.level1 || 0,  icon: "👤", color: C.green, bg: C.greenL },
          { label: "Niveau 2",     value: totals.level2 || 0,  icon: "👥", color: C.gold,  bg: C.goldL },
          { label: "Niveau 3",     value: totals.level3 || 0,  icon: "🫂", color: "#7C3AED", bg: "#F5F3FF" },
        ].map(s => (
          <Card key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 22 }}>{s.icon}</p>
            <p style={{ margin: "6px 0 2px", fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.slate, fontWeight: 600 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Sélecteur de niveau */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[1, 2, 3].map(lvl => (
          <button key={lvl} onClick={() => setActiveLevel(lvl)} style={{
            padding: "8px 20px", borderRadius: 8, border: `2px solid ${activeLevel === lvl ? C.blue : C.border}`,
            background: activeLevel === lvl ? C.blue : "#fff",
            color: activeLevel === lvl ? "#fff" : C.slate,
            fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
          }}>
            Niveau {lvl} ({levels[lvl].length})
          </button>
        ))}
      </div>

      {/* Liste des membres */}
      {currentList.length === 0 ? (
        <EmptyState
          icon="👥"
          title={`Aucun membre au niveau ${activeLevel}`}
          desc={activeLevel === 1 ? "Recrutez votre premier ambassadeur" : "Ce niveau se remplira au fur et à mesure"}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {currentList.map(member => (
            <Card key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Avatar initiale */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.blue}, #3B82F6)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 900, fontSize: 16,
                }}>
                  {(member.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{member.name}</p>
                    <RoleBadge role={member.role} />
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
                    🌍 {member.country}{member.city ? ` • ${member.city}` : ""} • Inscrit le {fmtDate(member.created_at)}
                  </p>
                  {/* Niveau 2 : afficher le parrain direct */}
                  {member.parent_name && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.blue }}>↳ Via {member.parent_name}</p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontWeight: 800, color: C.dark, fontSize: 15 }}>{member.beneficiary_count || 0}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.slate }}>Bénéficiaires</p>
                </div>
                {member.recruited_count !== undefined && (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 800, color: C.dark, fontSize: 15 }}>{member.recruited_count || 0}</p>
                    <p style={{ margin: 0, fontSize: 10, color: C.slate }}>Recrutés</p>
                  </div>
                )}
                {member.total_earned !== undefined && (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 800, color: C.green, fontSize: 15 }}>{fmt(member.total_earned)} €</p>
                    <p style={{ margin: 0, fontSize: 10, color: C.slate }}>Gains</p>
                  </div>
                )}
                <span style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 700,
                  background: member.status === "ACTIVE" ? C.greenL : C.bg,
                  color: member.status === "ACTIVE" ? C.green : C.slate,
                }}>
                  <StatusDot active={member.status === "ACTIVE"} />
                  {member.status === "ACTIVE" ? "Actif" : "Inactif"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : CLASSEMENT  ← NOUVELLE
// Données : top_earners, top_recruiters, my_rank, period
// ═════════════════════════════════════════════════════════════
export function DiasporaLeaderboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState("month");
  const [tab, setTab]         = useState("earners");
  const me = getDiasporaData();

  const load = useCallback((p) => {
    setLoading(true);
    diasporaLeaderAPI.getLeaderboard(p).then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const periodLabels = { month: "Ce mois", week: "Cette semaine", all: "Tout temps" };
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ padding: "24px 20px", maxWidth: 860, margin: "0 auto" }}>
      <PageHeader
        title="🏆 Classement"
        subtitle="Compétition saine entre ambassadeurs"
      />

      {/* Mon rang */}
      {data?.my_rank && (
        <Card style={{ marginBottom: 20, background: "linear-gradient(135deg, #D97706, #F59E0B)", border: "none" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>VOTRE POSITION</p>
              <p style={{ margin: "4px 0 0", color: "#fff", fontSize: 36, fontWeight: 900 }}>#{data.my_rank}</p>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{periodLabels[period]}</p>
            </div>
            <div style={{ fontSize: 64, opacity: 0.4 }}>🏆</div>
          </div>
        </Card>
      )}

      {/* Filtres période */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(periodLabels).map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)} style={{
            padding: "7px 18px", borderRadius: 8, border: `2px solid ${period === key ? C.gold : C.border}`,
            background: period === key ? C.goldL : "#fff",
            color: period === key ? C.gold : C.slate,
            fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabs gains / recruteurs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F1F5F9", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          { key: "earners",    label: "💰 Top Gains" },
          { key: "recruiters", label: "👥 Top Recruteurs" },
        ].map(t2 => (
          <button key={t2.key} onClick={() => setTab(t2.key)} style={{
            padding: "6px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
            background: tab === t2.key ? "#fff" : "transparent",
            color: tab === t2.key ? C.dark : C.slate,
            boxShadow: tab === t2.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          }}>
            {t2.label}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(tab === "earners" ? data?.top_earners : data?.top_recruiters || []).map((amb, i) => {
            const isMe = amb.id === me?.id;
            return (
              <Card key={amb.id} style={{
                display: "flex", alignItems: "center", gap: 16,
                border: isMe ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                background: isMe ? C.goldL : "#fff",
              }}>
                {/* Rang */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: i < 3 ? "linear-gradient(135deg, #D97706, #F59E0B)" : C.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: i < 3 ? 20 : 15, fontWeight: 900,
                  color: i < 3 ? "#fff" : C.slate,
                }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>
                      {amb.name} {isMe && <span style={{ color: C.gold, fontSize: 11 }}>← vous</span>}
                    </p>
                    <RoleBadge role={amb.role} />
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>🌍 {amb.country}</p>
                </div>

                {/* Score */}
                <div style={{ textAlign: "right" }}>
                  {tab === "earners" ? (
                    <>
                      <p style={{ margin: 0, fontWeight: 900, color: C.green, fontSize: 18 }}>{fmt(amb.earnings)} €</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{amb.beneficiary_count} bénéficiaires</p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontWeight: 900, color: C.blue, fontSize: 18 }}>{amb.recruits}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.slate }}>recrutés</p>
                    </>
                  )}
                </div>
              </Card>
            );
          })}

          {(tab === "earners" ? data?.top_earners : data?.top_recruiters || []).length === 0 && (
            <EmptyState icon="🏆" title="Pas encore de classement" desc="Les données apparaîtront après les premières ventes" />
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PAGE : NOTIFICATIONS  ← NOUVELLE
// Données : notifications[], unread_count
// ═════════════════════════════════════════════════════════════
export function DiasporaNotifications() {
  const [notifs, setNotifs]   = useState([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(() => {
    diasporaNotifAPI.getAll().then(r => {
      setNotifs(r.data.notifications || []);
      setUnread(r.data.unread_count || 0);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await diasporaNotifAPI.markRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } finally { setMarking(false); }
  };

  const typeConfig = {
    NEW_SALE:          { icon: "🎉", color: C.green,    bg: C.greenL,  label: "Vente confirmée" },
    NEW_REFERRAL:      { icon: "👥", color: C.blue,     bg: C.blueL,   label: "Nouveau filleul" },
    COMMISSION_EARNED: { icon: "💰", color: C.gold,     bg: C.goldL,   label: "Commission" },
    COMMISSION_PAID:   { icon: "✅", color: C.green,    bg: C.greenL,  label: "Paiement reçu" },
    CHALLENGE_REACHED: { icon: "🏆", color: "#7C3AED",  bg: "#F5F3FF", label: "Challenge atteint" },
    NETWORK_ACTIVITY:  { icon: "🌐", color: C.blue,     bg: C.blueL,   label: "Réseau" },
    SYSTEM:            { icon: "⚙️", color: C.slate,    bg: C.bg,      label: "Système" },
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 760, margin: "0 auto" }}>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} non lue(s)` : "Tout est à jour"}
        action={
          unread > 0 && (
            <Btn variant="outline" onClick={markAllRead} disabled={marking}>
              {marking ? "…" : "✓ Tout marquer comme lu"}
            </Btn>
          )
        }
      />

      {loading ? <Loader /> : notifs.length === 0 ? (
        <EmptyState icon="🔔" title="Aucune notification" desc="Vous serez notifié de vos ventes, commissions et filleuls ici" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifs.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.SYSTEM;
            return (
              <div key={n.id} style={{
                display: "flex", gap: 14, padding: "14px 16px",
                borderRadius: 12, background: n.read ? "#fff" : cfg.bg,
                border: `1px solid ${n.read ? C.border : cfg.color + "33"}`,
                transition: "background 0.3s",
              }}>
                {/* Icône */}
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: cfg.bg, border: `2px solid ${cfg.color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {cfg.icon}
                </div>

                {/* Contenu */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <p style={{ margin: 0, fontWeight: n.read ? 600 : 800, color: C.dark, fontSize: 14 }}>{n.title}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "1px 7px", borderRadius: 999 }}>
                      {cfg.label}
                    </span>
                    {!n.read && (
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, display: "inline-block", flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{ margin: "2px 0 4px", fontSize: 13, color: C.slate, lineHeight: 1.4 }}>{n.body}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{fmtDate(n.created_at)}</p>
                    {n.amount && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.green }}>+{fmt(n.amount)} €</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
