// src/pages/diaspora/DiasporaPages.jsx
// Contient : Beneficiaries, NewBeneficiary, Payments, NewPayment, Earnings, Referral

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { diasporaBeneAPI, diasporaPayAPI, diasporaCommAPI, diasporaRefAPI } from "../../diasporaApi";

const fmt    = (n, c="€") => `${Number(n||0).toLocaleString("fr-FR",{minimumFractionDigits:2})} ${c}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "—";

const PLAN_CFG = {
  ESSENTIELLE:{ color:"#2563EB", bg:"#EFF6FF", label:"Essentielle", price:"~15€/mois", coverage:"50%" },
  IVOIRIENNE: { color:"#059669", bg:"#ECFDF5", label:"Ivoirienne",  price:"~25€/mois", coverage:"70%" },
  TURQUOISE:  { color:"#0891B2", bg:"#ECFEFF", label:"Turquoise",   price:"~40€/mois", coverage:"90%" },
};

const STATUS_CFG = {
  active:    { label:"Actif",    bg:"#ECFDF5", color:"#059669" },
  pending:   { label:"En attente",bg:"#FFFBEB", color:"#D97706" },
  suspended: { label:"Suspendu", bg:"#FEF2F2", color:"#DC2626" },
  expired:   { label:"Expiré",   bg:"#F1F5F9", color:"#64748B" },
};

const S = {
  page:    { paddingBottom:20, fontFamily:"'DM Sans',system-ui,sans-serif" },
  title:   { fontSize:20, fontWeight:800, color:"#0F2942", marginBottom:16 },
  card:    { background:"#fff", borderRadius:16, padding:"16px 18px", boxShadow:"0 2px 8px rgba(0,0,0,.06)", marginBottom:12 },
  label:   { fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, marginBottom:8, display:"block" },
  input:   { width:"100%", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"12px 14px", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
  select:  { width:"100%", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"12px 14px", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:"#fff" },
  btn:     { width:"100%", padding:14, background:"linear-gradient(135deg,#0F2942,#1a3a5c)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  btnGreen:{ width:"100%", padding:14, background:"linear-gradient(135deg,#00BCD4,#0097A7)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  err:     { background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"10px 14px", color:"#DC2626", fontSize:13, marginBottom:14 },
  suc:     { background:"#ECFDF5", border:"1px solid #BBF7D0", borderRadius:12, padding:"10px 14px", color:"#059669", fontSize:13, marginBottom:14 },
  fieldGap:{ marginBottom:14 },
};

// ════════════════════════════════════════════════════════════
// LISTE BÉNÉFICIAIRES
// ════════════════════════════════════════════════════════════
export function DiasporaBeneficiaries() {
  const navigate = useNavigate();
  const [benes,   setBenes]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diasporaBeneAPI.getAll().then(r => setBenes(r.data.beneficiaries)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <h1 style={S.title}>Mes bénéficiaires</h1>
        <button onClick={() => navigate("/diaspora/beneficiaries/new")}
          style={{ background:"#0F2942", color:"#fff", border:"none", borderRadius:12, padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          + Ajouter
        </button>
      </div>

      {loading ? <div style={{ textAlign:"center", padding:40, color:"#94A3B8" }}>Chargement…</div>
      : benes.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:"40px 20px" }}>
          <p style={{ fontSize:40, marginBottom:12 }}>👨‍👩‍👧‍👦</p>
          <p style={{ fontWeight:700, color:"#0F2942", marginBottom:8 }}>Aucun bénéficiaire</p>
          <p style={{ color:"#94A3B8", fontSize:13, marginBottom:16 }}>Commencez par inscrire un proche en Côte d'Ivoire</p>
          <button onClick={() => navigate("/diaspora/beneficiaries/new")} style={{ ...S.btnGreen, width:"auto", padding:"12px 24px", fontSize:13 }}>
            + Ajouter un bénéficiaire
          </button>
        </div>
      ) : benes.map(b => {
        const plan = PLAN_CFG[b.plan] || PLAN_CFG.ESSENTIELLE;
        const stat = STATUS_CFG[b.status] || STATUS_CFG.pending;
        return (
          <div key={b.id} style={{ ...S.card, cursor:"pointer" }} onClick={() => navigate(`/diaspora/beneficiaries/${b.id}`)}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:plan.bg, color:plan.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, flexShrink:0 }}>
                {b.name?.charAt(0)}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:800, color:"#0F2942", margin:"0 0 2px" }}>{b.name}</p>
                <p style={{ fontSize:12, color:"#94A3B8", fontFamily:"monospace", margin:0 }}>{b.mutual_number}</p>
              </div>
              <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:stat.bg, color:stat.color }}>{stat.label}</span>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:plan.bg, color:plan.color, border:`1px solid ${plan.color}30` }}>
                {plan.label} · {plan.coverage}
              </span>
              {b.city && <span style={{ fontSize:11, color:"#64748B" }}>📍 {b.city}</span>}
              <span style={{ fontSize:11, color:"#64748B" }}>Total payé : {fmt(b.total_paid)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// NOUVEAU BÉNÉFICIAIRE
// ════════════════════════════════════════════════════════════
export function DiasporaNewBeneficiary() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", phone:"", city:"", plan:"ESSENTIELLE" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await diasporaBeneAPI.create(form);
      navigate(`/diaspora/beneficiaries/${data.beneficiary.id}`);
    } catch (err) { setError(err.response?.data?.error || "Erreur création"); }
    finally { setLoading(false); }
  }

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>←</button>
        <h1 style={{ ...S.title, marginBottom:0 }}>Nouveau bénéficiaire</h1>
      </div>

      {error && <div style={S.err}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={S.card}>
          <div style={S.fieldGap}>
            <label style={S.label}>Nom complet *</label>
            <input required style={S.input} placeholder="Kouassi Jean" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
          </div>
          <div style={S.fieldGap}>
            <label style={S.label}>Téléphone (en CI)</label>
            <input style={S.input} placeholder="07 07 08 09 10" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
          </div>
          <div style={S.fieldGap}>
            <label style={S.label}>Ville de résidence</label>
            <input style={S.input} placeholder="Abidjan, Yopougon…" value={form.city} onChange={e => setForm({...form, city:e.target.value})} />
          </div>
        </div>

        <div style={S.card}>
          <label style={S.label}>Choisir la formule *</label>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {Object.entries(PLAN_CFG).map(([key, p]) => (
              <button key={key} type="button" onClick={() => setForm({...form, plan:key})}
                style={{ padding:"14px 16px", borderRadius:14, border:`2px solid ${form.plan===key ? p.color : "#E2E8F0"}`, background: form.plan===key ? p.bg : "#fff", cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"all .15s" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <p style={{ fontWeight:800, color: form.plan===key ? p.color : "#0F2942", margin:"0 0 3px", fontSize:15 }}>{p.label}</p>
                    <p style={{ fontSize:12, color:"#64748B", margin:0 }}>Couverture {p.coverage} · {p.price}</p>
                  </div>
                  {form.plan===key && <span style={{ width:22, height:22, borderRadius:"50%", background:p.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800 }}>✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:"#FFFBEB", border:"1px solid #FCD34D", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          <p style={{ color:"#92400E", fontSize:13, margin:0 }}>
            ⚠️ Le bénéficiaire sera en statut <strong>En attente</strong> jusqu'au premier paiement d'adhésion.
          </p>
        </div>

        <button type="submit" disabled={loading} style={S.btn}>
          {loading ? "Création…" : "Créer le bénéficiaire →"}
        </button>
      </form>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAIEMENTS
// ════════════════════════════════════════════════════════════
export function DiasporaPayments() {
  const navigate  = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    diasporaPayAPI.getAll().then(r => setPayments(r.data.payments)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusBg = { COMPLETED:"#ECFDF5", PENDING:"#FFFBEB", FAILED:"#FEF2F2" };
  const statusTx = { COMPLETED:"#059669", PENDING:"#D97706",  FAILED:"#DC2626" };
  const statusLb = { COMPLETED:"Complété", PENDING:"En attente", FAILED:"Échoué" };

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <h1 style={S.title}>Paiements</h1>
        <button onClick={() => navigate("/diaspora/payments/new")}
          style={{ background:"#00BCD4", color:"#fff", border:"none", borderRadius:12, padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          + Payer
        </button>
      </div>
      {loading ? <div style={{ textAlign:"center", padding:40, color:"#94A3B8" }}>Chargement…</div>
      : payments.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:"40px 20px" }}>
          <p style={{ fontSize:36, marginBottom:12 }}>💳</p>
          <p style={{ fontWeight:700, color:"#0F2942" }}>Aucun paiement</p>
        </div>
      ) : payments.map(p => (
        <div key={p.id} style={S.card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <p style={{ fontWeight:800, color:"#0F2942", margin:"0 0 2px", fontSize:14 }}>{p.beneficiary_name}</p>
              <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>{p.payment_type === "adhesion" ? "🎫 Adhésion" : "🔄 Mensualité"} · {fmtDate(p.created_at)}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontWeight:800, color:"#0F2942", margin:"0 0 3px" }}>{fmt(p.amount, p.currency)}</p>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:statusBg[p.status]||"#F1F5F9", color:statusTx[p.status]||"#64748B" }}>
                {statusLb[p.status]||p.status}
              </span>
            </div>
          </div>
          {p.transaction_reference && (
            <p style={{ fontSize:11, color:"#94A3B8", fontFamily:"monospace", margin:0 }}>{p.transaction_reference}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// NOUVEAU PAIEMENT
// ════════════════════════════════════════════════════════════
export function DiasporaNewPayment() {
  const navigate = useNavigate();
  const [benes,  setBenes]  = useState([]);
  const [form,   setForm]   = useState({ beneficiary_id:"", amount:"", currency:"EUR", payment_type:"adhesion", payment_method:"stripe" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    diasporaBeneAPI.getAll().then(r => setBenes(r.data.beneficiaries)).catch(() => {});
  }, []);

  async function handlePay(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await diasporaPayAPI.initiate(form);
      // Simuler confirmation (en prod → Stripe redirect)
      await diasporaPayAPI.confirm({ payment_id: data.payment.id });
      setSuccess(true);
    } catch (err) { setError(err.response?.data?.error || "Erreur paiement"); }
    finally { setLoading(false); }
  }

  if (success) return (
    <div style={{ ...S.page, textAlign:"center", paddingTop:40 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
      <h2 style={{ fontWeight:800, color:"#0F2942", marginBottom:8 }}>Paiement réussi !</h2>
      <p style={{ color:"#64748B", marginBottom:24 }}>Le bénéficiaire a été activé.</p>
      <button onClick={() => navigate("/diaspora/beneficiaries")} style={S.btnGreen}>
        Voir mes bénéficiaires →
      </button>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>←</button>
        <h1 style={{ ...S.title, marginBottom:0 }}>Effectuer un paiement</h1>
      </div>

      {error && <div style={S.err}>{error}</div>}

      <form onSubmit={handlePay}>
        <div style={S.card}>
          <div style={S.fieldGap}>
            <label style={S.label}>Bénéficiaire *</label>
            <select required style={S.select} value={form.beneficiary_id} onChange={e => setForm({...form, beneficiary_id:e.target.value})}>
              <option value="">Sélectionner un bénéficiaire…</option>
              {benes.map(b => <option key={b.id} value={b.id}>{b.name} · {b.plan} · {b.mutual_number}</option>)}
            </select>
          </div>

          <div style={S.fieldGap}>
            <label style={S.label}>Type de paiement *</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{ id:"adhesion", label:"🎫 Adhésion", desc:"Première inscription" },{ id:"mensualite", label:"🔄 Mensualité", desc:"Cotisation mensuelle" }].map(t => (
                <button key={t.id} type="button" onClick={() => setForm({...form, payment_type:t.id})}
                  style={{ padding:"12px 10px", borderRadius:12, border:`2px solid ${form.payment_type===t.id ? "#0F2942" : "#E2E8F0"}`, background: form.payment_type===t.id ? "#EFF6FF" : "#fff", cursor:"pointer", fontFamily:"inherit" }}>
                  <p style={{ fontWeight:700, color: form.payment_type===t.id ? "#0F2942" : "#374151", margin:"0 0 3px", fontSize:13 }}>{t.label}</p>
                  <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:10, marginBottom:14 }}>
            <div>
              <label style={S.label}>Montant *</label>
              <input required type="number" min="1" style={S.input} placeholder="25.00" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
            </div>
            <div>
              <label style={S.label}>Devise</label>
              <select style={S.select} value={form.currency} onChange={e => setForm({...form, currency:e.target.value})}>
                <option value="EUR">€ EUR</option>
                <option value="USD">$ USD</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
          </div>

          <div style={S.fieldGap}>
            <label style={S.label}>Mode de paiement *</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { id:"stripe",  icon:"💳", label:"Carte bancaire",  desc:"Visa, Mastercard via Stripe" },
                { id:"paypal",  icon:"🅿️", label:"PayPal",         desc:"Compte PayPal" },
              ].map(m => (
                <button key={m.id} type="button" onClick={() => setForm({...form, payment_method:m.id})}
                  style={{ padding:"12px 16px", borderRadius:12, border:`2px solid ${form.payment_method===m.id ? "#00BCD4" : "#E2E8F0"}`, background: form.payment_method===m.id ? "#E0F7FA" : "#fff", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
                  <span style={{ fontSize:24 }}>{m.icon}</span>
                  <div>
                    <p style={{ fontWeight:700, color: form.payment_method===m.id ? "#0097A7" : "#0F2942", margin:"0 0 2px", fontSize:13 }}>{m.label}</p>
                    <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>{m.desc}</p>
                  </div>
                  {form.payment_method===m.id && <span style={{ marginLeft:"auto", color:"#00BCD4", fontSize:18 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {form.amount && (
          <div style={{ ...S.card, background:"#F0F7FF", border:"1px solid #BFDBFE", marginBottom:16 }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#1E40AF", margin:"0 0 8px", textTransform:"uppercase", letterSpacing:.8 }}>Récapitulatif</p>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:13, color:"#64748B" }}>Montant</span>
              <span style={{ fontWeight:700, color:"#0F2942" }}>{form.amount} {form.currency}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, color:"#64748B" }}>Équivalent FCFA (≈)</span>
              <span style={{ fontWeight:700, color:"#0F2942" }}>{Math.round(Number(form.amount) * 655.957).toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
        )}

        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
          <p style={{ color:"#166534", fontSize:12, margin:0 }}>🔒 Paiement sécurisé · Données chiffrées SSL · Aucune information bancaire stockée</p>
        </div>

        <button type="submit" disabled={loading || !form.beneficiary_id || !form.amount} style={{ ...S.btnGreen, opacity:(!form.beneficiary_id||!form.amount)?0.6:1 }}>
          {loading ? "Traitement en cours…" : `💳 Payer ${form.amount||""} ${form.currency}`}
        </button>
      </form>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMMISSIONS / GAINS
// ════════════════════════════════════════════════════════════
export function DiasporaEarnings() {
  const [data, setData] = useState({ commissions:[], totals:{} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diasporaCommAPI.getAll().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { commissions, totals } = data;

  const statBg = { PENDING:"#FFFBEB", VALIDATED:"#EFF6FF", PAID:"#ECFDF5", CANCELLED:"#FEF2F2" };
  const statTx = { PENDING:"#D97706", VALIDATED:"#2563EB", PAID:"#059669", CANCELLED:"#DC2626" };
  const statLb = { PENDING:"En attente", VALIDATED:"Validée", PAID:"Payée", CANCELLED:"Annulée" };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Mes commissions 💰</h1>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
        {[
          { label:"Total gagné",      value:fmt(totals.total_earned),  color:"#059669", bg:"#ECFDF5" },
          { label:"En attente",       value:fmt(totals.pending),       color:"#D97706", bg:"#FFFBEB" },
          { label:"Validées",         value:fmt(totals.validated),     color:"#2563EB", bg:"#EFF6FF" },
          { label:"Payées",           value:fmt(totals.paid),          color:"#7C3AED", bg:"#F5F3FF" },
        ].map((k,i) => (
          <div key={i} style={{ background:k.bg, borderRadius:14, padding:"14px 16px", border:`1px solid ${k.color}25` }}>
            <p style={{ fontSize:11, color:"#64748B", fontWeight:600, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 6px" }}>{k.label}</p>
            <p style={{ fontSize:18, fontWeight:800, color:k.color, margin:0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Info taux */}
      <div style={{ ...S.card, marginBottom:18 }}>
        <p style={S.label}>Taux de commission</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { source:"Adhésion directe",      rate:"10%", icon:"🎫" },
            { source:"Mensualité directe",     rate:"5%",  icon:"🔄" },
            { source:"Adhésion parrainage",    rate:"5%",  icon:"👥🎫" },
            { source:"Mensualité parrainage",  rate:"2%",  icon:"👥🔄" },
          ].map((r,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom: i<3?"1px solid #F1F5F9":"none" }}>
              <span style={{ fontSize:13, color:"#374151" }}>{r.icon} {r.source}</span>
              <span style={{ fontWeight:800, color:"#0F2942", fontSize:14 }}>{r.rate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Liste commissions */}
      <p style={{ fontSize:13, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, marginBottom:10 }}>Historique</p>
      {loading ? <div style={{ textAlign:"center", padding:30, color:"#94A3B8" }}>Chargement…</div>
      : commissions.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:"30px 20px" }}>
          <p style={{ fontSize:32, marginBottom:8 }}>💰</p>
          <p style={{ color:"#64748B" }}>Aucune commission pour le moment</p>
        </div>
      ) : commissions.map(c => (
        <div key={c.id} style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ fontWeight:700, color:"#0F2942", margin:"0 0 3px", fontSize:14 }}>
                {c.source === "referral" ? "👥" : "🎫"} {c.source === "referral" ? "Parrainage" : "Direct"} — {c.beneficiary_name}
              </p>
              <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>{fmtDate(c.created_at)} · Taux {c.rate_pct}%</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontWeight:800, color:"#059669", fontSize:16, margin:"0 0 4px" }}>{fmt(c.amount)}</p>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:statBg[c.status]||"#F1F5F9", color:statTx[c.status]||"#64748B" }}>
                {statLb[c.status]||c.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PARRAINAGE
// ════════════════════════════════════════════════════════════
export function DiasporaReferral() {
  const [refData,   setRefData]   = useState({ code:"", link:"" });
  const [referrals, setReferrals] = useState([]);
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([diasporaRefAPI.getLink(), diasporaRefAPI.getReferrals()])
      .then(([r, refs]) => { setRefData(r.data); setReferrals(refs.data.referrals||[]); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  function copy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const totalCommRef = referrals.reduce((s,r) => s + Number(r.commission_earned||0), 0);

  return (
    <div style={S.page}>
      <h1 style={S.title}>Mon parrainage 🔗</h1>

      {/* Code et lien */}
      <div style={{ ...S.card, background:"linear-gradient(135deg,#0F2942,#1a3a5c)", color:"#fff" }}>
        <p style={{ fontSize:12, color:"rgba(255,255,255,.6)", fontWeight:600, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 16px" }}>Mon code ambassadeur</p>
        <div style={{ fontSize:28, fontWeight:900, fontFamily:"monospace", color:"#00BCD4", margin:"0 0 16px", letterSpacing:3 }}>
          {refData.code || "…"}
        </div>
        <div style={{ background:"rgba(255,255,255,.07)", borderRadius:12, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ flex:1, fontSize:12, color:"rgba(255,255,255,.7)", fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {refData.link || "…"}
          </span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button onClick={() => copy(refData.link)}
            style={{ padding:"12px", background: copied ? "#059669" : "rgba(0,188,212,.2)", border:"1px solid rgba(0,188,212,.3)", borderRadius:12, color:"#00BCD4", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}>
            {copied ? "✓ Copié !" : "📋 Copier le lien"}
          </button>
          <button onClick={() => {
            if (navigator.share) navigator.share({ title:"Awoundjô Diaspora", text:"Rejoignez la mutuelle Awoundjô !", url:refData.link });
            else copy(refData.link);
          }} style={{ padding:"12px", background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            📤 Partager
          </button>
        </div>
      </div>

      {/* Stats parrainage */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
        {[
          { label:"Filleuls",    value:referrals.length, icon:"👥" },
          { label:"Actifs",      value:referrals.filter(r=>r.beneficiary_count>0).length, icon:"✅" },
          { label:"Commissions", value:`${Math.round(totalCommRef*100)/100}€`, icon:"💰" },
        ].map((k,i) => (
          <div key={i} style={{ ...S.card, textAlign:"center", padding:"14px 10px", marginBottom:0 }}>
            <p style={{ fontSize:22, marginBottom:4 }}>{k.icon}</p>
            <p style={{ fontWeight:800, color:"#0F2942", margin:"0 0 3px", fontSize:18 }}>{k.value}</p>
            <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Comment ça marche */}
      <div style={S.card}>
        <p style={S.label}>Comment gagner des commissions ?</p>
        {[
          { step:"1", text:"Partagez votre lien unique avec vos contacts" },
          { step:"2", text:"Ils s'inscrivent et créent leurs bénéficiaires" },
          { step:"3", text:"Vous gagnez 5% sur chaque adhésion de vos filleuls" },
          { step:"4", text:"Et 2% sur chaque mensualité payée" },
        ].map((s,i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"8px 0", borderBottom:i<3?"1px solid #F1F5F9":"none" }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"#0F2942", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, flexShrink:0 }}>{s.step}</div>
            <p style={{ fontSize:13, color:"#374151", margin:0, lineHeight:1.5 }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* Liste filleuls */}
      {referrals.length > 0 && (
        <>
          <p style={{ fontSize:13, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, margin:"16px 0 10px" }}>Mes filleuls</p>
          {referrals.map(r => (
            <div key={r.id} style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ fontWeight:700, color:"#0F2942", margin:"0 0 3px" }}>{r.referred_name}</p>
                  <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>🌍 {r.country} · Inscrit le {fmtDate(r.joined_at)}</p>
                  <p style={{ fontSize:12, color:"#64748B", margin:"3px 0 0" }}>{r.beneficiary_count} bénéficiaire(s)</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontWeight:800, color:"#059669", fontSize:14, margin:0 }}>{fmt(r.commission_earned)}</p>
                  <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>commissions</p>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
