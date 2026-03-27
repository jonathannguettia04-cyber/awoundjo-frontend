// src/components/AdhesionForm.jsx
// ─────────────────────────────────────────────────────────────
//  Formulaire d'adhésion universel — Awoundjô
//  Réutilisé pour tous les rôles intermédiaires des 2 réseaux :
//    AMBASSADEUR_PAYS | RECRUTEUR (réseau Diaspora)
//    LEADER | PASTEUR | RESPONSABLE (réseau Parrainage)
//
//  Flux complet :
//    [1] Infos personnelles
//    [2] Choix du plan mensuel
//    [3] Récapitulatif adhésion
//    [4] Mode de paiement
//    [5] → CinetPay popup (15 000 FCFA frais d'adhésion)
//    [6] → Paiement ACCEPTED → création compte + credentials
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { payWithCinetPay } from "../services/cinetpay";
import { diasporaBeneAPI } from "../diasporaApi";

// ── Palette identique au reste de l'app ───────────────────────
const C = {
  blue:    "#1B4FD8", blueL:  "#EEF2FF",
  green:   "#059669", greenL: "#ECFDF5",
  gold:    "#D97706", goldL:  "#FFFBEB",
  red:     "#DC2626", redL:   "#FEF2F2",
  purple:  "#7C3AED", purpleL:"#F5F3FF",
  teal:    "#0D9488", tealL:  "#F0FDFA",
  slate:   "#64748B", dark:   "#0F172A",
  border:  "#E2E8F0", bg:     "#F8FAFC",
};

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

// ── Constantes ────────────────────────────────────────────────
const MEMBERSHIP_FEE = 15000;

const PLANS = [
  { value:"ESSENTIELLE", label:"🌿 Essentielle", desc:"Couverture de base",  monthly:10000 },
  { value:"IVOIRIENNE",  label:"🌍 Ivoirienne",  desc:"Couverture élargie", monthly:15000 },
  { value:"TURQUOISE",   label:"💎 Turquoise",   desc:"Couverture premium", monthly:35000 },
];

const PAYMENT_METHODS = [
  { value:"mobile_money", label:"📱 Mobile Money",     desc:"MTN, Orange, Moov" },
  { value:"wave",         label:"🌊 Wave",              desc:"Paiement Wave CI"  },
  { value:"bank",         label:"🏦 Virement bancaire", desc:"SGBCI / BICICI"   },
];

// Config dynamique par rôle
const ROLE_CONFIG = {
  AMBASSADEUR_PAYS: { title:"Adhésion Ambassadeur Pays", icon:"🗺️", color:C.green,  bg:C.greenL,  art:"l'Ambassadeur Pays"  },
  RECRUTEUR:        { title:"Adhésion Recruteur",        icon:"🤝", color:C.gold,   bg:C.goldL,   art:"le Recruteur"        },
  LEADER:           { title:"Adhésion Leader",           icon:"⭐", color:C.blue,   bg:C.blueL,   art:"le Leader"           },
  PASTEUR:          { title:"Adhésion Pasteur",          icon:"⛪", color:C.teal,   bg:C.tealL,   art:"le Pasteur"          },
  RESPONSABLE:      { title:"Adhésion Responsable",      icon:"🤝", color:C.purple, bg:C.purpleL, art:"le Responsable"      },
};

const COUNTRIES = [
  "Côte d'Ivoire","France","Belgique","Suisse","Canada","États-Unis","Royaume-Uni",
  "Italie","Espagne","Allemagne","Pays-Bas","Portugal","Sénégal","Ghana","Cameroun",
  "Togo","Bénin","Burkina Faso","Mali","Guinée","Gabon","Congo","Maroc","Autre",
];

// ── Sous-composants UI ────────────────────────────────────────
function SectionTitle({ step, label, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <div style={{
        width:28, height:28, borderRadius:99,
        background:color, color:"#fff",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:13, fontWeight:900, flexShrink:0,
      }}>{step}</div>
      <p style={{ margin:0, fontSize:14, fontWeight:800, color:C.dark }}>{label}</p>
    </div>
  );
}

function InputField({ label, type="text", placeholder, value, onChange, required=false, as="input", children }) {
  const baseStyle = {
    width:"100%", padding:"11px 14px", borderRadius:8, fontSize:14,
    border:`1.5px solid ${C.border}`, outline:"none",
    boxSizing:"border-box", background:"#fff", fontFamily:"inherit",
    transition:"border-color .2s",
  };
  return (
    <div>
      <label style={{ display:"block", fontSize:13, fontWeight:700, color:C.dark, marginBottom:6 }}>
        {label}{required && <span style={{ color:C.red }}> *</span>}
      </label>
      {as === "select" ? (
        <select value={value} onChange={onChange} style={{ ...baseStyle, cursor:"pointer" }}>
          {children}
        </select>
      ) : (
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={onChange} required={required}
          style={baseStyle}
          onFocus={e  => e.target.style.borderColor = C.blue}
          onBlur={e   => e.target.style.borderColor = C.border}
        />
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
/**
 * AdhesionForm
 * @param {string}   targetRole   - Rôle à créer (AMBASSADEUR_PAYS, RECRUTEUR, LEADER, PASTEUR, RESPONSABLE)
 * @param {function} onSuccess    - Appelé avec (credentials, roleLabel) après paiement + création
 */
export default function AdhesionForm({ targetRole, onSuccess }) {
  const rc = ROLE_CONFIG[targetRole] || ROLE_CONFIG.RECRUTEUR;

  // Étapes : "form" → "payment" → "processing" → "done"
  const [step, setStep]     = useState("form");
  const [error, setError]   = useState("");

  // Données du formulaire
  const [form, setForm] = useState({
    name:    "",
    email:   "",
    phone:   "",
    country: "Côte d'Ivoire",
    plan:    "ESSENTIELLE",
    paymentMethod: "mobile_money",
  });

  const selectedPlan = PLANS.find(p => p.value === form.plan) || PLANS[0];

  function setField(key) {
    return (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  // ── Validation formulaire ─────────────────────────────────
  function validate() {
    if (!form.name.trim())  return "Le nom complet est requis.";
    if (!form.email.trim()) return "L'email est requis.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Email invalide.";
    if (!form.phone.trim()) return "Le numéro WhatsApp est requis.";
    return null;
  }

  // ── Soumission → CinetPay ─────────────────────────────────
  function handlePay(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");
    setStep("payment");

    const txId = `AWJ-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

    payWithCinetPay({
      user: { name: form.name, email: form.email, phone: form.phone },
      amount:      MEMBERSHIP_FEE,
      description: `${rc.title} — Awoundjô`,
      transactionId: txId,

      // ── Paiement accepté → créer le compte ────────────────
      onSuccess: async (_data, finalTxId) => {
        setStep("processing");
        try {
          const { data } = await diasporaBeneAPI.createAmbassador({
            name:           form.name,
            email:          form.email,
            phone:          form.phone,
            country:        form.country,
            role:           targetRole,
            plan:           form.plan,
            payment_method: form.paymentMethod,
            transaction_id: finalTxId,
            membership_fee: MEMBERSHIP_FEE,
          });
          setStep("done");
          onSuccess?.(data.credentials, rc.art);
        } catch (err) {
          setError(err.response?.data?.error || "Paiement reçu mais erreur lors de la création du compte. Contactez le support.");
          setStep("form");
        }
      },

      // ── Paiement refusé / annulé ──────────────────────────
      onError: ({ message }) => {
        setError(message || "Paiement échoué ou annulé.");
        setStep("form");
      },
    });
  }

  // ── Écran "Traitement en cours" ───────────────────────────
  if (step === "processing") {
    return (
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"48px 24px", textAlign:"center" }}>
        <div style={{
          width:52, height:52, border:`4px solid ${C.blueL}`, borderTop:`4px solid ${rc.color}`,
          borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px",
        }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        <p style={{ margin:0, fontWeight:800, fontSize:16, color:C.dark }}>Création du compte en cours…</p>
        <p style={{ margin:"6px 0 0", fontSize:13, color:C.slate }}>Paiement confirmé. Génération des identifiants…</p>
      </div>
    );
  }

  // ── Formulaire principal ──────────────────────────────────
  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 4px rgba(0,0,0,.06)", overflow:"hidden" }}>

      {/* En-tête coloré dynamique */}
      <div style={{ background:`linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`, padding:"18px 22px", display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:28 }}>{rc.icon}</span>
        <div>
          <p style={{ margin:0, color:"#fff", fontWeight:900, fontSize:17 }}>{rc.title}</p>
          <p style={{ margin:"2px 0 0", color:"rgba(255,255,255,.75)", fontSize:12 }}>
            Frais d'adhésion : {fmt(MEMBERSHIP_FEE)} · Paiement unique
          </p>
        </div>
      </div>

      <form onSubmit={handlePay} style={{ padding:"24px 22px", display:"flex", flexDirection:"column", gap:24 }}>

        {/* Erreur globale */}
        {error && (
          <div style={{ background:C.redL, border:`1px solid ${C.red}44`, borderRadius:10, padding:"11px 14px", fontSize:13, color:C.red, fontWeight:600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Section 1 : Informations personnelles ────────── */}
        <div>
          <SectionTitle step={1} label="Informations personnelles" color={rc.color} />
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <InputField label="Nom complet" placeholder="Jean Kouassi" value={form.name}    onChange={setField("name")}  required />
            <InputField label="Email"       placeholder="jean@email.com" value={form.email}  onChange={setField("email")} required type="email" />
            <InputField label="Téléphone WhatsApp" placeholder="+225 07 00 00 00 00" value={form.phone} onChange={setField("phone")} required type="tel" />
            <InputField label="Pays de résidence" value={form.country} onChange={setField("country")} as="select">
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </InputField>
          </div>
        </div>

        {/* ── Section 2 : Choix du plan mensuel ────────────── */}
        <div>
          <SectionTitle step={2} label="Choisissez votre plan mensuel" color={rc.color} />
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {PLANS.map(p => {
              const selected = form.plan === p.value;
              return (
                <div
                  key={p.value}
                  onClick={() => setForm(prev => ({ ...prev, plan: p.value }))}
                  style={{
                    padding:"14px 16px", borderRadius:10,
                    border:`2px solid ${selected ? rc.color : C.border}`,
                    background: selected ? rc.bg : "#fff",
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"space-between",
                    transition:"all .15s",
                  }}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    {/* Radio visuel */}
                    <div style={{
                      width:18, height:18, borderRadius:"50%",
                      border:`2px solid ${selected ? rc.color : C.border}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      flexShrink:0,
                    }}>
                      {selected && <div style={{ width:9, height:9, borderRadius:"50%", background:rc.color }} />}
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:14, color:selected ? rc.color : C.dark }}>{p.label}</p>
                      <p style={{ margin:0, fontSize:12, color:C.slate }}>{p.desc}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ margin:0, fontWeight:800, fontSize:15, color:selected ? rc.color : C.dark }}>{fmt(p.monthly)}</p>
                    <p style={{ margin:0, fontSize:11, color:C.slate }}>/ mois</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 3 : Récapitulatif adhésion ───────────── */}
        <div>
          <SectionTitle step={3} label="Récapitulatif de votre adhésion" color={rc.color} />
          <div style={{
            background:C.bg, borderRadius:12,
            border:`1px solid ${C.border}`, overflow:"hidden",
          }}>
            {[
              { label:"Frais d'adhésion (unique)",  value:fmt(MEMBERSHIP_FEE),           highlight:false },
              { label:`Plan mensuel — ${selectedPlan.label}`, value:fmt(selectedPlan.monthly) + " / mois", highlight:false },
              { label:"À payer maintenant",         value:fmt(MEMBERSHIP_FEE),           highlight:true  },
            ].map((row, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 16px",
                borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                background: row.highlight ? rc.bg : "transparent",
              }}>
                <p style={{ margin:0, fontSize:13, color:row.highlight ? rc.color : C.slate, fontWeight:row.highlight ? 700 : 400 }}>
                  {row.label}
                </p>
                <p style={{ margin:0, fontSize:row.highlight ? 16 : 14, fontWeight:row.highlight ? 900 : 600, color:row.highlight ? rc.color : C.dark }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>
          <p style={{ margin:"8px 0 0", fontSize:12, color:C.slate }}>
            💡 Le paiement mensuel de {fmt(selectedPlan.monthly)} démarre après activation du compte.
          </p>
        </div>

        {/* ── Section 4 : Mode de paiement ─────────────────── */}
        <div>
          <SectionTitle step={4} label="Mode de paiement" color={rc.color} />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10 }}>
            {PAYMENT_METHODS.map(m => {
              const selected = form.paymentMethod === m.value;
              return (
                <button
                  key={m.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, paymentMethod: m.value }))}
                  style={{
                    padding:"12px 8px", borderRadius:10,
                    border:`2px solid ${selected ? rc.color : C.border}`,
                    background: selected ? rc.bg : "#fff",
                    cursor:"pointer", textAlign:"center",
                    transition:"all .15s",
                  }}
                >
                  <p style={{ margin:"0 0 4px", fontSize:20 }}>{m.label.split(" ")[0]}</p>
                  <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:selected ? rc.color : C.dark }}>
                    {m.label.split(" ").slice(1).join(" ")}
                  </p>
                  <p style={{ margin:0, fontSize:10, color:C.slate }}>{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Bouton de soumission ──────────────────────────── */}
        <button
          type="submit"
          disabled={step === "payment"}
          style={{
            width:"100%", padding:"15px 20px", borderRadius:12, border:"none",
            fontSize:15, fontWeight:900, cursor: step === "payment" ? "not-allowed" : "pointer",
            opacity: step === "payment" ? 0.7 : 1,
            background: `linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`,
            color:"#fff",
            boxShadow:`0 6px 20px ${rc.color}44`,
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            transition:"opacity .2s",
            fontFamily:"inherit",
          }}
        >
          {step === "payment" ? (
            <>
              <div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              Redirection vers CinetPay…
            </>
          ) : (
            <>
              💳 Payer {fmt(MEMBERSHIP_FEE)} et créer {rc.art}
            </>
          )}
        </button>

        {/* Note sécurité */}
        <p style={{ margin:"-12px 0 0", fontSize:11, color:C.slate, textAlign:"center" }}>
          🔒 Paiement sécurisé via CinetPay · Aucun compte créé avant confirmation du paiement
        </p>

      </form>
    </div>
  );
}
