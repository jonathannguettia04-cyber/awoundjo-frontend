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
import WavePayButton from "../components/WavePayButton";
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

// Lien Wave marchand Awoundjô
const WAVE_MERCHANT_BASE = "https://pay.wave.com/m/M_Sh7TOpfh6ALd/c/ci/";

function buildWaveLink(amount, description) {
  return `${WAVE_MERCHANT_BASE}?amount=${amount}&message=${encodeURIComponent(description)}`;
}

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
  RUM:              { title:"Adhésion RUM",              icon:"👑", color:C.purple, bg:C.purpleL, art:"le RUM"              },
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

  // Étapes : "form" → "wave_pending" | "payment" → "processing" → "done"
  const [step, setStep]           = useState("form");
  const [error, setError]         = useState("");
  const [waveConfirmed, setWaveConfirmed] = useState(false); // Wave : l'user confirme manuellement

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
  const isWave       = form.paymentMethod === "wave";

  // Lien Wave généré dynamiquement avec nom + montant
  const waveLink = buildWaveLink(
    MEMBERSHIP_FEE,
    `Adhesion Awoundjo - ${form.name || "Nouveau membre"} - ${rc.title}`
  );

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

  // ── Créer le compte après paiement confirmé ───────────────
  async function createAccount(txId) {
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
        transaction_id: txId,
        membership_fee: MEMBERSHIP_FEE,
      });
      setStep("done");
      onSuccess?.(data.credentials, rc.art);
    } catch (err) {
      setError(err.response?.data?.error || "Paiement reçu mais erreur lors de la création du compte. Contactez le support.");
      setStep("form");
    }
  }

  // ── Soumission principale ─────────────────────────────────
  function handlePay(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");

    if (isWave) {
      // Wave : montrer le bloc de confirmation, l'user ouvre Wave et revient confirmer
      setStep("wave_pending");
      return;
    }

    // CinetPay : popup direct
    setStep("payment");
    const txId = `AWJ-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

    payWithCinetPay({
      user: { name: form.name, email: form.email, phone: form.phone },
      amount:        MEMBERSHIP_FEE,
      description:   `${rc.title} — Awoundjô`,
      transactionId: txId,
      onSuccess: async (_data, finalTxId) => { await createAccount(finalTxId); },
      onError: ({ message }) => {
        setError(message || "Paiement échoué ou annulé.");
        setStep("form");
      },
    });
  }

  // ── Confirmation Wave par l'utilisateur ───────────────────
  async function handleWaveConfirm() {
    const txId = `AWJ-WAVE-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
    await createAccount(txId);
  }

  // ── Écran "Traitement en cours" ───────────────────────────
  if (step === "processing") {
    return (
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"48px 24px", textAlign:"center" }}>
        <div style={{ width:52, height:52, border:`4px solid ${C.blueL}`, borderTop:`4px solid ${rc.color}`, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        <p style={{ margin:0, fontWeight:800, fontSize:16, color:C.dark }}>Création du compte en cours…</p>
        <p style={{ margin:"6px 0 0", fontSize:13, color:C.slate }}>Paiement confirmé. Génération des identifiants…</p>
      </div>
    );
  }

  // ── Écran Wave : attente confirmation utilisateur ─────────
  if (step === "wave_pending") {
    return (
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden" }}>
        {/* En-tête */}
        <div style={{ background:`linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`, padding:"18px 22px", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:28 }}>{rc.icon}</span>
          <div>
            <p style={{ margin:0, color:"#fff", fontWeight:900, fontSize:17 }}>{rc.title}</p>
            <p style={{ margin:"2px 0 0", color:"rgba(255,255,255,.75)", fontSize:12 }}>Paiement Wave</p>
          </div>
        </div>

        <div style={{ padding:"28px 24px", display:"flex", flexDirection:"column", gap:20 }}>
          {error && (
            <div style={{ background:C.redL, border:`1px solid ${C.red}44`, borderRadius:10, padding:"11px 14px", fontSize:13, color:C.red, fontWeight:600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Récap */}
          <div style={{ background:C.bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}` }}>
            <p style={{ margin:"0 0 8px", fontWeight:800, fontSize:13, color:C.dark }}>Récapitulatif :</p>
            <p style={{ margin:"0 0 4px", fontSize:13, color:C.slate }}>
              👤 <strong>{form.name}</strong> — {form.email}
            </p>
            <p style={{ margin:"0 0 4px", fontSize:13, color:C.slate }}>
              📋 Rôle : <strong>{rc.title}</strong>
            </p>
            <p style={{ margin:0, fontSize:15, fontWeight:900, color:rc.color }}>
              💰 Montant à payer : {fmt(MEMBERSHIP_FEE)}
            </p>
          </div>

          {/* Étapes Wave */}
          <div>
            <p style={{ margin:"0 0 14px", fontWeight:800, fontSize:14, color:C.dark }}>
              🌊 Comment payer avec Wave :
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { n:"1", text:"Cliquez sur le bouton ci-dessous pour ouvrir Wave" },
                { n:"2", text:`Payez exactement ${fmt(MEMBERSHIP_FEE)} à Awoundjô` },
                { n:"3", text:"Revenez ici et cliquez sur \"J'ai payé, créer mon compte\"" },
              ].map(s => (
                <div key={s.n} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 14px", background:"#F0FDFA", borderRadius:10 }}>
                  <div style={{ width:26, height:26, borderRadius:99, background:C.teal, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, flexShrink:0 }}>
                    {s.n}
                  </div>
                  <p style={{ margin:0, fontSize:13, color:C.dark }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bouton Wave + fallback copier-coller */}
          <WavePayButton
            amount={MEMBERSHIP_FEE}
            message={`Adhesion Awoundjo - ${form.name || "Nouveau membre"} - ${rc.title}`}
            label={`Payer ${fmt(MEMBERSHIP_FEE)} avec Wave`}
            size="lg"
          />

          {/* Séparateur */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <p style={{ margin:0, fontSize:12, color:C.slate, whiteSpace:"nowrap" }}>Après le paiement Wave</p>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          {/* Bouton confirmation */}
          <button
            onClick={handleWaveConfirm}
            style={{
              width:"100%", padding:"14px 20px", borderRadius:12, border:`2px solid ${rc.color}`,
              background:rc.bg, color:rc.color, fontWeight:900, fontSize:14,
              cursor:"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}
          >
            ✅ J'ai payé — Créer mon compte
          </button>

          {/* Retour */}
          <button
            onClick={() => { setStep("form"); setError(""); }}
            style={{ background:"none", border:"none", color:C.slate, fontSize:13, cursor:"pointer", textDecoration:"underline" }}
          >
            ← Changer de méthode de paiement
          </button>
        </div>
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
                    border:`2px solid ${selected ? (m.value === "wave" ? "#1DC9A4" : rc.color) : C.border}`,
                    background: selected ? (m.value === "wave" ? "#F0FDF9" : rc.bg) : "#fff",
                    cursor:"pointer", textAlign:"center",
                    transition:"all .15s",
                  }}
                >
                  <p style={{ margin:"0 0 4px", fontSize:20 }}>{m.label.split(" ")[0]}</p>
                  <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color: selected ? (m.value === "wave" ? "#1DC9A4" : rc.color) : C.dark }}>
                    {m.label.split(" ").slice(1).join(" ")}
                  </p>
                  <p style={{ margin:0, fontSize:10, color:C.slate }}>{m.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Aperçu lien Wave quand sélectionné */}
          {isWave && (
            <div style={{ marginTop:14, background:"#F0FDF9", border:"1.5px solid #1DC9A4", borderRadius:12, padding:"14px 16px" }}>
              <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:700, color:"#0D9488" }}>
                🌊 Lien de paiement Wave prêt
              </p>
              <p style={{ margin:"0 0 10px", fontSize:12, color:C.slate }}>
                Cliquez sur le bouton ci-dessous → Wave s'ouvre → payez {fmt(MEMBERSHIP_FEE)} → revenez confirmer.
              </p>
              {form.name ? (
                <WavePayButton
                  amount={MEMBERSHIP_FEE}
                  message={`Adhesion Awoundjo - ${form.name} - ${rc.title}`}
                  label={`Ouvrir Wave — ${fmt(MEMBERSHIP_FEE)}`}
                  size="sm"
                />
              ) : (
                <p style={{ margin:0, fontSize:11, color:C.red }}>
                  ⚠️ Renseignez d'abord votre nom complet pour activer le lien.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Bouton de soumission ──────────────────────────── */}
        <button
          type="submit"
          disabled={step === "payment"}
          style={{
            width:"100%", padding:"15px 20px", borderRadius:12, border:"none",
            fontSize:15, fontWeight:900, cursor: step === "payment" ? "not-allowed" : "pointer",
            opacity: step === "payment" ? 0.7 : 1,
            background: isWave
              ? "linear-gradient(135deg,#1DC9A4,#15A882)"
              : `linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`,
            color:"#fff",
            boxShadow: isWave ? "0 6px 20px rgba(29,201,164,.4)" : `0 6px 20px ${rc.color}44`,
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            transition:"all .2s",
            fontFamily:"inherit",
          }}
        >
          {step === "payment" ? (
            <>
              <div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              Redirection vers CinetPay…
            </>
          ) : isWave ? (
            <>🌊 Continuer avec Wave — {fmt(MEMBERSHIP_FEE)}</>
          ) : (
            <>💳 Payer {fmt(MEMBERSHIP_FEE)} et créer {rc.art}</>
          )}
        </button>

        {/* Note sécurité */}
        <p style={{ margin:"-12px 0 0", fontSize:11, color:C.slate, textAlign:"center" }}>
          {isWave
            ? "🌊 Paiement Wave · Vous serez redirigé vers Wave puis reviendrez confirmer"
            : "🔒 Paiement sécurisé via CinetPay · Aucun compte créé avant confirmation du paiement"
          }
        </p>

      </form>
    </div>
  );
}
