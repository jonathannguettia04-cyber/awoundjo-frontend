// src/components/AdhesionForm.jsx
import { useState, useEffect } from "react";
import { diasporaBeneAPI } from "../diasporaApi";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const MEMBERSHIP_FEE = 15000;
const SESSION_KEY = "awoundjo_pending_ambassador";

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

const PLANS = [
  { value:"ESSENTIELLE", label:"🌿 Essentielle", desc:"Couverture de base",  monthly:10000 },
  { value:"IVOIRIENNE",  label:"🌍 Ivoirienne",  desc:"Couverture élargie", monthly:15000 },
  { value:"TURQUOISE",   label:"💎 Turquoise",   desc:"Couverture premium", monthly:35000 },
];

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

// ─────────────────────────────────────────────────────────────
// FONCTION EXPORTÉE — appelée par la page parente au retour CinetPay
// ─────────────────────────────────────────────────────────────
export async function triggerPostPaymentCreation(transactionId, onSuccess, onError) {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return false;

  let pending;
  try {
    pending = JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return false;
  }

  sessionStorage.removeItem(SESSION_KEY);

  try {
    const { data } = await diasporaBeneAPI.createAmbassador({
      name:           pending.name,
      email:          pending.email,
      phone:          pending.phone,
      country:        pending.country,
      role:           pending.role,
      plan:           pending.plan,
      transaction_id: transactionId,
    });

    const rc = ROLE_CONFIG[pending.role] || ROLE_CONFIG.RECRUTEUR;
    onSuccess?.(data.credentials, rc.art, data.ambassador?.id || data.id);
    return true;
  } catch (err) {
    const msg = err?.response?.data?.error
             || err?.response?.data?.message
             || "Erreur lors de la création du compte après paiement.";
    onError?.(msg);
    return true;
  }
}

// ─────────────────────────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────────────────────────
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
          onFocus={e => e.target.style.borderColor = C.blue}
          onBlur={e  => e.target.style.borderColor = C.border}
        />
      )}
    </div>
  );
}

function SuccessScreen({ credentials, roleLabel, rc, onClose }) {
  const [copied, setCopied] = useState(false);

  const text = `Identifiants ${roleLabel} Awoundjô\nNom d'utilisateur : ${credentials.username}\nMot de passe : ${credentials.temp_password}\nURL : https://awoundjo-app.vercel.app/diaspora/login`;

  return (
    <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, flexWrap:"wrap" }}>
        {[
          { label:"Paiement", done:true },
          { label:"Compte créé", done:true },
          { label:"Validation admin", done:false },
        ].map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{
              padding:"4px 12px", borderRadius:99, fontSize:11, fontWeight:700,
              background: s.done ? C.greenL : C.bg,
              color:      s.done ? C.green  : C.slate,
              border:     `1.5px solid ${s.done ? C.green : C.border}`,
            }}>
              {s.done ? "✅ " : ""}{s.label}
            </div>
            {i < 2 && <span style={{ color:C.border, fontSize:14 }}>→</span>}
          </div>
        ))}
      </div>

      <div style={{ background:C.greenL, border:`1.5px solid ${C.green}44`, borderRadius:12, padding:"14px 18px", textAlign:"center" }}>
        <p style={{ margin:"0 0 4px", fontSize:22 }}>🎉</p>
        <p style={{ margin:0, fontWeight:900, fontSize:15, color:C.green }}>Paiement confirmé — compte créé !</p>
        <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>En attente de validation par un administrateur</p>
      </div>

      <div style={{ background:C.bg, borderRadius:12, padding:"16px 18px", border:`1px solid ${C.border}` }}>
        <p style={{ margin:"0 0 12px", fontSize:12, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:.8 }}>
          🔑 Identifiants de connexion générés
        </p>
        {[
          { label:"Nom d'utilisateur",      value: credentials.username      },
          { label:"Mot de passe temporaire", value: credentials.temp_password },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:10 }}>
            <p style={{ margin:"0 0 3px", fontSize:11, fontWeight:700, color:C.slate }}>{f.label}</p>
            <p style={{ margin:0, fontSize:15, fontWeight:800, color:C.dark, fontFamily:"monospace", background:"#fff", padding:"7px 10px", borderRadius:6, border:`1px solid ${C.border}` }}>
              {f.value}
            </p>
          </div>
        ))}
        <p style={{ margin:"8px 0 0", fontSize:11, color:C.red, fontWeight:600 }}>
          ⚠️ Le mot de passe doit être changé à la première connexion
        </p>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button
          onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ flex:1, padding:"9px 0", background:C.blueL, color:C.blue, border:`1.5px solid ${C.blue}`, borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}
        >
          {copied ? "✅ Copié !" : "📋 Copier les identifiants"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank" rel="noreferrer"
          style={{ flex:1, padding:"9px 0", background:"#25D366", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
        >
          📲 WhatsApp
        </a>
      </div>

      <div style={{ background:C.goldL, border:`1.5px solid ${C.gold}44`, borderRadius:10, padding:"12px 16px" }}>
        <p style={{ margin:0, fontSize:12, color:C.gold, fontWeight:700 }}>⏳ Validation admin requise</p>
        <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>
          Un administrateur validera le compte. Le portail sera accessible après activation.
        </p>
      </div>

      <button
        onClick={onClose}
        style={{ width:"100%", padding:"10px 0", background:"#fff", color:C.slate, border:`1.5px solid ${C.border}`, borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}
      >
        Fermer
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
/**
 * @param {string}   targetRole       - Rôle à créer
 * @param {string}   returnPath       - Chemin de retour après CinetPay (ex: "/diaspora/register/pays")
 *                                      Si absent, utilise window.location.pathname au moment du clic
 * @param {object}   postPaymentResult - Si fourni, affiche directement le SuccessScreen
 * @param {function} onSuccess        - Appelé après création réussie
 * @param {function} onReset          - Appelé quand l'utilisateur ferme le SuccessScreen
 */
export default function AdhesionForm({ targetRole, returnPath, postPaymentResult, onSuccess, onReset }) {
  const rc = ROLE_CONFIG[targetRole] || ROLE_CONFIG.RECRUTEUR;

  const [step,        setStep]        = useState("form");
  const [error,       setError]       = useState("");
  const [credentials, setCredentials] = useState(postPaymentResult?.credentials || null);
  const [roleLabel,   setRoleLabel]   = useState(postPaymentResult?.roleLabel   || rc.art);

  const [form, setForm] = useState({
    name:    "",
    email:   "",
    phone:   "",
    country: "Côte d'Ivoire",
    plan:    "ESSENTIELLE",
  });

  useEffect(() => {
    if (postPaymentResult?.credentials) {
      setCredentials(postPaymentResult.credentials);
      setRoleLabel(postPaymentResult.roleLabel || rc.art);
      setStep("done");
    }
  }, [postPaymentResult]);

  const selectedPlan = PLANS.find(p => p.value === form.plan) || PLANS[0];

  function setField(key) {
    return (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  function validate() {
    if (!form.name.trim())  return "Le nom complet est requis.";
    if (!form.email.trim()) return "L'email est requis.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Email invalide.";
    if (!form.phone.trim()) return "Le numéro WhatsApp est requis.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setStep("redirecting");

    // Sauvegarder les données du formulaire avant redirection
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      name:    form.name,
      email:   form.email,
      phone:   form.phone,
      country: form.country,
      role:    targetRole,
      plan:    form.plan,
    }));

    const txId = `AWJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    try {
      const token = localStorage.getItem("diaspora_token")
                 || localStorage.getItem("token")
                 || localStorage.getItem("agent_token");

      const origin = window.location.origin;
      // ✅ FIX : utilise returnPath (prop fournie par la page parente) en priorité
      // Fallback sur pathname courant si prop absente
      const path   = returnPath || window.location.pathname;

      const res = await fetch(`${BASE}/api/payments/cinetpay/init-web`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount:         MEMBERSHIP_FEE,
          description:    `Adhésion Awoundjô — ${rc.art}`,
          transaction_id: txId,
          client_name:    form.name,
          client_email:   form.email,
          client_phone:   form.phone,
          return_url: `${origin}${path}?payment=success&transaction_id=${txId}`,
          cancel_url:  `${origin}${path}?payment=failed`,
          notify_url:  `${BASE}/api/payments/cinetpay/notify`,
        }),
      });

      const data = await res.json();
      const paymentUrl = data?.data?.payment_url || data?.payment_url;

      if (!paymentUrl) {
        throw new Error(data?.message || "URL de paiement non reçue du serveur");
      }

      window.location.href = paymentUrl;

    } catch (err) {
      sessionStorage.removeItem(SESSION_KEY);
      setError(err.message || "Erreur lors de l'initialisation du paiement.");
      setStep("form");
    }
  }

  // ── Écran "done" : afficher les credentials ───────────────
  if (step === "done" && credentials) {
    return (
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <SuccessScreen
          credentials={credentials}
          roleLabel={roleLabel}
          rc={rc}
          onClose={() => { setStep("form"); setCredentials(null); onReset?.(); }}
        />
      </div>
    );
  }

  // ── Écran "redirecting" ───────────────────────────────────
  if (step === "redirecting") {
    return (
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:32, textAlign:"center" }}>
        <div style={{ width:40, height:40, border:`3px solid ${C.blueL}`, borderTop:`3px solid ${C.blue}`, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ margin:0, fontWeight:700, color:C.blue, fontSize:15 }}>Redirection vers CinetPay…</p>
        <p style={{ margin:"6px 0 0", fontSize:12, color:C.slate }}>Ne fermez pas cette fenêtre</p>
      </div>
    );
  }

  // ── Formulaire ────────────────────────────────────────────
  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${rc.color}18, ${rc.color}08)`, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:28 }}>{rc.icon}</span>
        <div>
          <p style={{ margin:0, fontWeight:900, fontSize:16, color:C.dark }}>{rc.title}</p>
          <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>Frais d'adhésion : <strong style={{ color:rc.color }}>15 000 FCFA</strong> (paiement sécurisé CinetPay)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding:20, display:"flex", flexDirection:"column", gap:20 }}>

        {error && (
          <div style={{ background:C.redL, border:`1px solid ${C.red}44`, borderRadius:8, padding:"10px 14px", fontSize:13, color:C.red, fontWeight:600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Section 1 — Identité */}
        <div>
          <SectionTitle step={1} label="Informations personnelles" color={rc.color} />
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <InputField label="Nom complet" placeholder="Jean Kouassi" value={form.name} onChange={setField("name")} required />
            <InputField label="Adresse email" type="email" placeholder="jean@email.com" value={form.email} onChange={setField("email")} required />
            <InputField label="Numéro WhatsApp" type="tel" placeholder="+225 07 00 00 00 00" value={form.phone} onChange={setField("phone")} required />
            <InputField label="Pays de résidence" as="select" value={form.country} onChange={setField("country")}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </InputField>
          </div>
        </div>

        {/* Section 2 — Offre */}
        <div>
          <SectionTitle step={2} label="Choisir une offre de couverture" color={rc.color} />
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {PLANS.map(p => (
              <div
                key={p.value}
                onClick={() => setForm(f => ({ ...f, plan: p.value }))}
                style={{
                  padding:"12px 16px", borderRadius:10, cursor:"pointer",
                  border:`2px solid ${form.plan === p.value ? rc.color : C.border}`,
                  background: form.plan === p.value ? `${rc.color}10` : "#fff",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  transition:"all .15s",
                }}
              >
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:14, color: form.plan === p.value ? rc.color : C.dark }}>{p.label}</p>
                  <p style={{ margin:0, fontSize:12, color:C.slate }}>{p.desc}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:0, fontWeight:800, fontSize:13, color: form.plan === p.value ? rc.color : C.slate }}>{fmt(p.monthly)}/mois</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Récap paiement */}
        <div style={{ background:C.bg, borderRadius:10, padding:"14px 16px", border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, color:C.slate }}>Frais d'adhésion (unique)</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>15 000 FCFA</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, color:C.slate }}>Offre sélectionnée</span>
            <span style={{ fontSize:13, fontWeight:700, color:rc.color }}>{selectedPlan.label}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
            <span style={{ fontSize:14, fontWeight:800, color:C.dark }}>Total à payer maintenant</span>
            <span style={{ fontSize:14, fontWeight:900, color:rc.color }}>15 000 FCFA</span>
          </div>
        </div>

        <button
          type="submit"
          style={{
            width:"100%", padding:"13px 0",
            background:`linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`,
            color:"#fff", border:"none", borderRadius:10,
            fontSize:15, fontWeight:900, cursor:"pointer",
            boxShadow:`0 4px 14px ${rc.color}40`,
          }}
        >
          💳 Payer 15 000 FCFA — CinetPay
        </button>

        <p style={{ margin:0, textAlign:"center", fontSize:11, color:C.slate }}>
          🔒 Paiement sécurisé · Données sauvegardées pendant la redirection
        </p>
      </form>
    </div>
  );
}
