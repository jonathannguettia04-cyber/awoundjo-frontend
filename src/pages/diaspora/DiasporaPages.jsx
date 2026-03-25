// src/pages/diaspora/DiasporaPages.jsx
// Contient : Beneficiaries, NewBeneficiary, Payments, NewPayment, Earnings, Referral,
//            Network, Leaderboard, Notifications

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { diasporaBeneAPI, diasporaPayAPI, diasporaCommAPI, diasporaRefAPI, diasporaNetAPI, diasporaLeaderAPI, diasporaNotifAPI } from "../../diasporaApi";

const fmt      = (n, c="€") => `${Number(n||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} ${c}`;
const fmtXof   = (n) => `${Number(n||0).toLocaleString("fr-FR")} FCFA`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "—";

const PLAN_CFG = {
  ESSENTIELLE:{ color:"#2563EB", bg:"#EFF6FF", label:"Essentielle", price:"~15€/mois", coverage:"50%" },
  IVOIRIENNE: { color:"#059669", bg:"#ECFDF5", label:"Ivoirienne",  price:"~25€/mois", coverage:"70%" },
  TURQUOISE:  { color:"#0891B2", bg:"#ECFEFF", label:"Turquoise",   price:"~40€/mois", coverage:"90%" },
};

const STATUS_CFG = {
  active:    { label:"Actif",      bg:"#ECFDF5", color:"#059669" },
  pending:   { label:"En attente", bg:"#FFFBEB", color:"#D97706" },
  suspended: { label:"Suspendu",   bg:"#FEF2F2", color:"#DC2626" },
  expired:   { label:"Expiré",     bg:"#F1F5F9", color:"#64748B" },
};

// Rôles Awoundjô
const ROLE_CFG = {
  DIRIGEANTE: { label:"Dirigeante",  color:"#7C3AED", bg:"#F5F3FF", icon:"👑" },
  DIASPORA:   { label:"Diaspora",    color:"#0891B2", bg:"#ECFEFF", icon:"🌍" },
  PAYS:       { label:"Ambassadeur Pays",  color:"#059669", bg:"#ECFDF5", icon:"🗺️" },
  VILLE:      { label:"Ambassadeur Ville", color:"#2563EB", bg:"#EFF6FF", icon:"🏙️" },
  RECRUTEUR:  { label:"Recruteur",   color:"#D97706", bg:"#FFFBEB", icon:"🚀" },
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
  const statusTx = { COMPLETED:"#059669", PENDING:"#D97706", FAILED:"#DC2626" };
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
  const [benes,   setBenes]   = useState([]);
  const [form,    setForm]    = useState({ beneficiary_id:"", amount:"", currency:"EUR", payment_type:"adhesion", payment_method:"wave" });
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
      await diasporaPayAPI.confirm({ payment_id: data.payment.id });
      setSuccess(true);
    } catch (err) { setError(err.response?.data?.error || "Erreur paiement"); }
    finally { setLoading(false); }
  }

  // Estimation FCFA
  const rateMap = { EUR:655.957, USD:605, GBP:780 };
  const estimXof = form.amount ? Math.round(Number(form.amount) * (rateMap[form.currency]||655.957)) : 0;

  if (success) return (
    <div style={{ ...S.page, textAlign:"center", paddingTop:40 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
      <h2 style={{ fontWeight:800, color:"#0F2942", marginBottom:8 }}>Paiement réussi !</h2>
      <p style={{ color:"#64748B", marginBottom:24 }}>Le bénéficiaire a été activé et les commissions calculées.</p>
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

          <div style={S.fieldGap}>
            <label style={S.label}>Montant *</label>
            <div style={{ display:"flex", gap:8 }}>
              <input required type="number" min="1" step="0.01" style={{ ...S.input, flex:1 }}
                placeholder="25.00" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
              <select style={{ ...S.select, width:100 }} value={form.currency} onChange={e => setForm({...form, currency:e.target.value})}>
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
                { id:"wave",         icon:"🌊", label:"Wave",           desc:"Paiement mobile Wave CI" },
                { id:"orange_money", icon:"🟠", label:"Orange Money",   desc:"Orange Money CI" },
                { id:"mtn",          icon:"🟡", label:"MTN MoMo",       desc:"MTN Mobile Money" },
                { id:"stripe",       icon:"💳", label:"Carte bancaire",  desc:"Visa, Mastercard via Stripe" },
              ].map(m => (
                <button key={m.id} type="button" onClick={() => setForm({...form, payment_method:m.id})}
                  style={{ padding:"12px 16px", borderRadius:12, border:`2px solid ${form.payment_method===m.id ? "#00BCD4" : "#E2E8F0"}`, background: form.payment_method===m.id ? "#E0F7FA" : "#fff", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
                  <span style={{ fontSize:22 }}>{m.icon}</span>
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
              <span style={{ fontWeight:700, color:"#0F2942" }}>{estimXof.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
        )}

        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
          <p style={{ color:"#166534", fontSize:12, margin:0 }}>🔒 Paiement sécurisé · Données chiffrées SSL</p>
        </div>

        <button type="submit" disabled={loading || !form.beneficiary_id || !form.amount}
          style={{ ...S.btnGreen, opacity:(!form.beneficiary_id||!form.amount)?0.6:1 }}>
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
  const [data,    setData]    = useState({ commissions:[], totals:{}, by_source:[] });
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("overview"); // overview | history

  useEffect(() => {
    diasporaCommAPI.getAll().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { commissions, totals, by_source } = data;

  const statBg = { PENDING:"#FFFBEB", VALIDATED:"#EFF6FF", PAID:"#ECFDF5", CANCELLED:"#FEF2F2" };
  const statTx = { PENDING:"#D97706", VALIDATED:"#2563EB", PAID:"#059669", CANCELLED:"#DC2626" };
  const statLb = { PENDING:"En attente", VALIDATED:"Validée", PAID:"Payée", CANCELLED:"Annulée" };

  // Règles commission affichées selon organigramme
  const RULES = [
    { case:"Cas 1", desc:"Diaspora recrute Pays",      rates:{ RECRUTEUR:0, VILLE:0, PAYS:0, DIASPORA:12, DIRIGEANTE:5 } },
    { case:"Cas 2", desc:"Pays recrute Ville",          rates:{ RECRUTEUR:0, VILLE:0, PAYS:12, DIASPORA:10, DIRIGEANTE:5 } },
    { case:"Cas 3", desc:"Recruteur vend une carte",   rates:{ RECRUTEUR:12, VILLE:10, PAYS:10, DIASPORA:10, DIRIGEANTE:5 } },
  ];

  return (
    <div style={S.page}>
      <h1 style={S.title}>Mes commissions 💰</h1>

      {/* KPIs période */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:18 }}>
        {[
          { label:"Aujourd'hui", value:fmt(totals.today),      color:"#2563EB", bg:"#EFF6FF" },
          { label:"Ce mois",     value:fmt(totals.this_month), color:"#059669", bg:"#ECFDF5" },
          { label:"Total gagné", value:fmt(totals.total_earned),color:"#7C3AED", bg:"#F5F3FF" },
        ].map((k,i) => (
          <div key={i} style={{ background:k.bg, borderRadius:14, padding:"12px 10px", border:`1px solid ${k.color}20`, textAlign:"center" }}>
            <p style={{ fontSize:10, color:"#64748B", fontWeight:600, textTransform:"uppercase", letterSpacing:.5, margin:"0 0 5px" }}>{k.label}</p>
            <p style={{ fontSize:15, fontWeight:800, color:k.color, margin:0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* KPIs statuts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {[
          { label:"En attente", value:fmt(totals.pending),   color:"#D97706", bg:"#FFFBEB" },
          { label:"Validées",   value:fmt(totals.validated), color:"#2563EB", bg:"#EFF6FF" },
          { label:"Payées",     value:fmt(totals.paid),      color:"#059669", bg:"#ECFDF5" },
          { label:"Cette semaine", value:fmt(totals.this_week), color:"#0891B2", bg:"#ECFEFF" },
        ].map((k,i) => (
          <div key={i} style={{ background:k.bg, borderRadius:14, padding:"14px 16px", border:`1px solid ${k.color}25` }}>
            <p style={{ fontSize:11, color:"#64748B", fontWeight:600, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 6px" }}>{k.label}</p>
            <p style={{ fontSize:18, fontWeight:800, color:k.color, margin:0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16, background:"#F1F5F9", borderRadius:12, padding:4 }}>
        {[{ id:"overview", label:"Vue d'ensemble" },{ id:"history", label:"Historique" },{ id:"rules", label:"Règles" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:"8px 4px", borderRadius:10, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              background: tab===t.id ? "#0F2942" : "transparent", color: tab===t.id ? "#fff" : "#64748B" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* VUE D'ENSEMBLE */}
      {tab === "overview" && (
        <div>
          {by_source.length > 0 && (
            <>
              <p style={S.label}>Par source</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
                {by_source.map((s,i) => {
                  const r = ROLE_CFG[s.source_role] || ROLE_CFG.RECRUTEUR;
                  return (
                    <div key={i} style={{ background:r.bg, borderRadius:14, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:20 }}>{r.icon}</span>
                        <div>
                          <p style={{ fontWeight:700, color:r.color, margin:"0 0 2px", fontSize:13 }}>{r.label}</p>
                          <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>{s.count} vente(s)</p>
                        </div>
                      </div>
                      <p style={{ fontWeight:800, color:r.color, fontSize:16, margin:0 }}>{fmt(s.total)}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* HISTORIQUE */}
      {tab === "history" && (
        loading ? <div style={{ textAlign:"center", padding:30, color:"#94A3B8" }}>Chargement…</div>
        : commissions.length === 0 ? (
          <div style={{ ...S.card, textAlign:"center", padding:"30px 20px" }}>
            <p style={{ fontSize:32, marginBottom:8 }}>💰</p>
            <p style={{ color:"#64748B" }}>Aucune commission pour le moment</p>
          </div>
        ) : commissions.map(c => (
          <div key={c.id} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ fontWeight:700, color:"#0F2942", margin:"0 0 3px", fontSize:14 }}>{c.beneficiary_name || "—"}</p>
                <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>{fmtDate(c.created_at)} · Taux {c.rate_pct}% · {c.source === "direct" ? "Vente directe" : "Réseau"}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontWeight:800, color:"#059669", fontSize:16, margin:"0 0 4px" }}>{fmt(c.amount)}</p>
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:statBg[c.status]||"#F1F5F9", color:statTx[c.status]||"#64748B" }}>
                  {statLb[c.status]||c.status}
                </span>
              </div>
            </div>
          </div>
        ))
      )}

      {/* RÈGLES */}
      {tab === "rules" && (
        <div>
          {RULES.map((r, i) => (
            <div key={i} style={{ ...S.card, marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <span style={{ background:"#0F2942", color:"#00BCD4", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, fontFamily:"monospace" }}>{r.case}</span>
                <p style={{ fontWeight:700, color:"#0F2942", margin:0, fontSize:13 }}>{r.desc}</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {Object.entries(r.rates).filter(([,v]) => v > 0).map(([role, pct]) => {
                  const cfg = ROLE_CFG[role] || ROLE_CFG.RECRUTEUR;
                  return (
                    <div key={role} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:cfg.bg, borderRadius:10, padding:"8px 12px" }}>
                      <span style={{ fontSize:12, color:cfg.color, fontWeight:700 }}>{cfg.icon} {cfg.label}</span>
                      <span style={{ fontWeight:900, color:cfg.color, fontSize:15 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PARRAINAGE
// ════════════════════════════════════════════════════════════
export function DiasporaReferral() {
  const [refData,   setRefData]   = useState({ code:"", link:"", whatsapp_message:"" });
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

      {/* Code + lien */}
      <div style={{ ...S.card, background:"linear-gradient(135deg,#0F2942,#1a3a5c)", color:"#fff" }}>
        <p style={{ fontSize:12, color:"rgba(255,255,255,.6)", fontWeight:600, textTransform:"uppercase", letterSpacing:.8, margin:"0 0 16px" }}>Mon code ambassadeur</p>
        <div style={{ fontSize:28, fontWeight:900, fontFamily:"monospace", color:"#00BCD4", margin:"0 0 16px", letterSpacing:3 }}>
          {refData.code || "…"}
        </div>
        <div style={{ background:"rgba(255,255,255,.07)", borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.7)", fontFamily:"monospace", overflow:"hidden", display:"block", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {refData.link || "…"}
          </span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <button onClick={() => copy(refData.link)}
            style={{ padding:"11px 8px", background: copied ? "#059669" : "rgba(0,188,212,.2)", border:"1px solid rgba(0,188,212,.3)", borderRadius:12, color:"#00BCD4", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            {copied ? "✓ Copié" : "📋 Copier"}
          </button>
          <button onClick={() => { if (navigator.share) navigator.share({ title:"Awoundjô", url:refData.link }); else copy(refData.link); }}
            style={{ padding:"11px 8px", background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            📤 Partager
          </button>
          <a href={refData.whatsapp_message} target="_blank" rel="noreferrer"
            style={{ padding:"11px 8px", background:"rgba(37,211,102,.2)", border:"1px solid rgba(37,211,102,.3)", borderRadius:12, color:"#25D366", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textDecoration:"none", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
        {[
          { label:"Filleuls",    value:referrals.length, icon:"👥" },
          { label:"Actifs",      value:referrals.filter(r=>Number(r.beneficiary_count)>0).length, icon:"✅" },
          { label:"Commissions", value:`${Math.round(totalCommRef*100)/100}€`, icon:"💰" },
        ].map((k,i) => (
          <div key={i} style={{ ...S.card, textAlign:"center", padding:"14px 10px", marginBottom:0 }}>
            <p style={{ fontSize:22, marginBottom:4 }}>{k.icon}</p>
            <p style={{ fontWeight:800, color:"#0F2942", margin:"0 0 3px", fontSize:18 }}>{k.value}</p>
            <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Liste filleuls */}
      {referrals.length > 0 && (
        <>
          <p style={{ fontSize:13, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, margin:"0 0 10px" }}>Mes filleuls directs</p>
          {referrals.map(r => {
            const roleCfg = ROLE_CFG[r.referred_role] || ROLE_CFG.RECRUTEUR;
            return (
              <div key={r.id} style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <p style={{ fontWeight:700, color:"#0F2942", margin:0 }}>{r.referred_name}</p>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:roleCfg.bg, color:roleCfg.color }}>{roleCfg.icon} {roleCfg.label}</span>
                    </div>
                    <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>🌍 {r.country} · {fmtDate(r.joined_at)}</p>
                    <p style={{ fontSize:12, color:"#64748B", margin:"3px 0 0" }}>{r.beneficiary_count} bénéficiaire(s)</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontWeight:800, color:"#059669", fontSize:14, margin:0 }}>{fmt(r.commission_earned)}</p>
                    <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>commissions</p>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MON RÉSEAU (MLM)
// ════════════════════════════════════════════════════════════
export function DiasporaNetwork() {
  const [data,    setData]    = useState({ network:{ level1:[], level2:[], level3:[] }, totals:{} });
  const [loading, setLoading] = useState(true);
  const [level,   setLevel]   = useState(1);

  useEffect(() => {
    diasporaNetAPI.getNetwork()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { network, totals } = data;
  const levelData = network[`level${level}`] || [];

  const AMB_STATUS = {
    ACTIVE:    { label:"Actif",    bg:"#ECFDF5", color:"#059669" },
    PENDING:   { label:"En attente", bg:"#FFFBEB", color:"#D97706" },
    SUSPENDED: { label:"Suspendu", bg:"#FEF2F2", color:"#DC2626" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Mon réseau 🌳</h1>

      {/* Totaux */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:18 }}>
        {[
          { label:"Total",   value: totals.total || 0,   color:"#0F2942", bg:"#F1F5F9" },
          { label:"Niv. 1",  value: totals.level1 || 0,  color:"#059669", bg:"#ECFDF5" },
          { label:"Niv. 2",  value: totals.level2 || 0,  color:"#2563EB", bg:"#EFF6FF" },
          { label:"Niv. 3",  value: totals.level3 || 0,  color:"#7C3AED", bg:"#F5F3FF" },
        ].map((k,i) => (
          <div key={i} style={{ background:k.bg, borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
            <p style={{ fontSize:10, color:"#64748B", fontWeight:600, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:.5 }}>{k.label}</p>
            <p style={{ fontSize:20, fontWeight:900, color:k.color, margin:0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs niveaux */}
      <div style={{ display:"flex", gap:8, marginBottom:16, background:"#F1F5F9", borderRadius:12, padding:4 }}>
        {[1,2,3].map(l => (
          <button key={l} onClick={() => setLevel(l)}
            style={{ flex:1, padding:"8px 4px", borderRadius:10, border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              background: level===l ? "#0F2942" : "transparent", color: level===l ? "#fff" : "#64748B" }}>
            Niveau {l} ({totals[`level${l}`] || 0})
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:"center", padding:40, color:"#94A3B8" }}>Chargement…</div>
      : levelData.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:"40px 20px" }}>
          <p style={{ fontSize:40, marginBottom:12 }}>🌱</p>
          <p style={{ fontWeight:700, color:"#0F2942", marginBottom:4 }}>Réseau vide à ce niveau</p>
          <p style={{ color:"#94A3B8", fontSize:13 }}>
            {level === 1 ? "Partagez votre lien pour recruter votre premier membre" : "Vos recrues directes doivent à leur tour recruter"}
          </p>
        </div>
      ) : levelData.map(m => {
        const roleCfg = ROLE_CFG[m.role] || ROLE_CFG.RECRUTEUR;
        const stCfg   = AMB_STATUS[m.status] || AMB_STATUS.PENDING;
        return (
          <div key={m.id} style={S.card}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:roleCfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                {roleCfg.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                  <p style={{ fontWeight:800, color:"#0F2942", margin:0, fontSize:14 }}>{m.name}</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:stCfg.bg, color:stCfg.color }}>{stCfg.label}</span>
                </div>
                <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>
                  🌍 {m.country} {m.city ? `· ${m.city}` : ""} · <span style={{ color:roleCfg.color, fontWeight:700 }}>{roleCfg.label}</span>
                </p>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <p style={{ fontSize:13, fontWeight:800, color:"#0F2942", margin:"0 0 2px" }}>{m.beneficiary_count || 0}</p>
                <p style={{ fontSize:10, color:"#94A3B8", margin:0 }}>bénéf.</p>
                {level === 1 && (
                  <>
                    <p style={{ fontSize:13, fontWeight:800, color:"#059669", margin:"4px 0 2px" }}>{m.recruited_count || 0}</p>
                    <p style={{ fontSize:10, color:"#94A3B8", margin:0 }}>recrues</p>
                  </>
                )}
              </div>
            </div>
            {level === 2 && m.parent_name && (
              <p style={{ fontSize:11, color:"#94A3B8", margin:"8px 0 0" }}>↳ Recruté par <strong style={{ color:"#0F2942" }}>{m.parent_name}</strong></p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CLASSEMENT
// ════════════════════════════════════════════════════════════
export function DiasporaLeaderboard() {
  const [data,    setData]    = useState({ top_earners:[], top_recruiters:[], my_rank:null, period:"month" });
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("month");
  const [tab,     setTab]     = useState("earners");

  useEffect(() => {
    setLoading(true);
    diasporaLeaderAPI.getLeaderboard(period)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const medals = ["🥇","🥈","🥉"];
  const list   = tab === "earners" ? data.top_earners : data.top_recruiters;

  return (
    <div style={S.page}>
      <h1 style={S.title}>🏆 Classement</h1>

      {/* Mon rang */}
      {data.my_rank && (
        <div style={{ background:"linear-gradient(135deg,#7C3AED,#6D28D9)", borderRadius:16, padding:"16px 18px", marginBottom:18, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, color:"#fff" }}>
            #{data.my_rank}
          </div>
          <div>
            <p style={{ color:"rgba(255,255,255,.7)", fontSize:12, margin:"0 0 3px" }}>Mon classement ce {period === "month" ? "mois" : "semaine"}</p>
            <p style={{ color:"#fff", fontWeight:800, fontSize:16, margin:0 }}>Position #{data.my_rank} sur le réseau</p>
          </div>
        </div>
      )}

      {/* Filtre période */}
      <div style={{ display:"flex", gap:8, marginBottom:12, background:"#F1F5F9", borderRadius:12, padding:4 }}>
        {[{ id:"week", label:"Cette semaine" },{ id:"month", label:"Ce mois" },{ id:"all", label:"Tout temps" }].map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            style={{ flex:1, padding:"8px 4px", borderRadius:10, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              background: period===p.id ? "#0F2942" : "transparent", color: period===p.id ? "#fff" : "#64748B" }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{ id:"earners", label:"💰 Top commissions" },{ id:"recruiters", label:"👥 Top recruteurs" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:"10px 8px", borderRadius:12, border:`2px solid ${tab===t.id ? "#0F2942" : "#E2E8F0"}`, background: tab===t.id ? "#0F2942" : "#fff", color: tab===t.id ? "#fff" : "#374151", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:"center", padding:40, color:"#94A3B8" }}>Chargement…</div>
      : list.map((a, i) => {
        const roleCfg = ROLE_CFG[a.role] || ROLE_CFG.RECRUTEUR;
        return (
          <div key={a.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background: i < 3 ? "#FFF7ED" : "#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", fontSize: i < 3 ? 22 : 16, fontWeight:900, color: i < 3 ? "#D97706" : "#64748B", flexShrink:0 }}>
              {i < 3 ? medals[i] : `#${i+1}`}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, color:"#0F2942", margin:"0 0 3px", fontSize:14 }}>{a.name}</p>
              <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>🌍 {a.country} · <span style={{ color:roleCfg.color, fontWeight:700 }}>{roleCfg.label}</span></p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontWeight:900, color:"#059669", fontSize:16, margin:"0 0 2px" }}>
                {tab === "earners" ? fmt(a.earnings) : `${a.recruits} recrues`}
              </p>
              <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>{a.beneficiary_count} bénéf.</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════
export function DiasporaNotifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread,  setUnread]  = useState(0);

  useEffect(() => {
    diasporaNotifAPI.getAll()
      .then(r => { setNotifs(r.data.notifications||[]); setUnread(r.data.unread_count||0); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Marquer comme lues après 2s
    const t = setTimeout(() => diasporaNotifAPI.markRead().catch(() => {}), 2000);
    return () => clearTimeout(t);
  }, []);

  const NOTIF_ICONS = {
    new_sale:      { icon:"💳", bg:"#ECFDF5", color:"#059669" },
    new_referral:  { icon:"👥", bg:"#EFF6FF", color:"#2563EB" },
    commission:    { icon:"💰", bg:"#FFFBEB", color:"#D97706" },
    challenge:     { icon:"🏆", bg:"#F5F3FF", color:"#7C3AED" },
    welcome:       { icon:"👋", bg:"#ECFEFF", color:"#0891B2" },
  };

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <h1 style={{ ...S.title, marginBottom:0, flex:1 }}>Notifications 🔔</h1>
        {unread > 0 && (
          <span style={{ background:"#DC2626", color:"#fff", fontSize:11, fontWeight:800, padding:"3px 9px", borderRadius:20 }}>{unread} nouvelles</span>
        )}
      </div>

      {loading ? <div style={{ textAlign:"center", padding:40, color:"#94A3B8" }}>Chargement…</div>
      : notifs.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:"40px 20px" }}>
          <p style={{ fontSize:40, marginBottom:12 }}>🔔</p>
          <p style={{ fontWeight:700, color:"#0F2942" }}>Aucune notification</p>
          <p style={{ color:"#94A3B8", fontSize:13 }}>Elles apparaîtront ici dès qu'il y aura de l'activité</p>
        </div>
      ) : notifs.map(n => {
        const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.welcome;
        return (
          <div key={n.id} style={{ ...S.card, display:"flex", alignItems:"flex-start", gap:12, opacity: n.read ? 0.7 : 1 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
              {cfg.icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight: n.read ? 600 : 800, color:"#0F2942", margin:"0 0 3px", fontSize:14 }}>{n.title || n.type}</p>
              <p style={{ fontSize:13, color:"#64748B", margin:"0 0 4px" }}>{n.message}</p>
              <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>{fmtDate(n.created_at)}</p>
            </div>
            {!n.read && <div style={{ width:8, height:8, borderRadius:"50%", background:"#2563EB", marginTop:6, flexShrink:0 }} />}
          </div>
        );
      })}
    </div>
  );
}
