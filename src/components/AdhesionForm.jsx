// src/components/AdhesionForm.jsx
// ─────────────────────────────────────────────────────────────
//  Formulaire d'adhésion universel — Awoundjô
//
//  Workflow :
//    [1] Infos personnelles + plan (chargé depuis /api/plans)
//    [2] Création compte → identifiants générés automatiquement
//    [3] Affichage credentials → bouton paiement CinetPay
//    [4] Paiement CinetPay (frais adhésion selon la formule choisie)
//    [5] Validation admin → commissions calculées sur la prime réelle
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { diasporaBeneAPI } from "../diasporaApi";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

// Icônes par défaut si l'API n'en fournit pas
const PLAN_ICONS = { ESSENTIELLE:"🌿", IVOIRIENNE:"🌍", TURQUOISE:"💎" };
const planIcon = (slug) => PLAN_ICONS[slug?.toUpperCase()] || "📋";

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

// ── Écran credentials + paiement CinetPay ────────────────────
function SuccessScreen({ credentials, ambassadorId, roleLabel, rc, adhesionFee, onClose }) {
  const [copied,      setCopied]      = useState(false);
  const [payLoading,  setPayLoading]  = useState(false);
  const [payError,    setPayError]    = useState("");
  const [payMethod,   setPayMethod]   = useState("cinetpay"); // "cinetpay" | "paydunya"

  const text = `Identifiants ${roleLabel} Awoundjô\nNom d'utilisateur : ${credentials.username}\nMot de passe : ${credentials.temp_password}\nURL : https://awoundjo-app.vercel.app/diaspora/login`;

  async function handlePay() {
    setPayLoading(true);
    setPayError("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agent_token");
      const res = await fetch(`${BASE}/api/payments/cinetpay/init-web`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ambassador_id:   ambassadorId,
          amount:          adhesionFee,
          type:            "adhesion",
          description:     `Adhésion Awoundjô — ${roleLabel}`,
          return_url:      `${window.location.origin}${window.location.pathname}?payment=success`,
          cancel_url:      `${window.location.origin}${window.location.pathname}?payment=failed`,
        }),
      });
      const data = await res.json();
      const url  = data?.data?.payment_url || data?.payment_url;
      if (!url) throw new Error("URL de paiement non reçue du serveur");
      window.location.href = url;
    } catch (e) {
      setPayError(e.message || "Erreur lors de l'initialisation du paiement");
      setPayLoading(false);
    }
  }

  async function handlePayDunya() {
    setPayLoading(true);
    setPayError("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agent_token");
      const res = await fetch(`${BASE}/api/payments/paydunya/init-web`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ambassador_id: ambassadorId,
          amount:        adhesionFee,
          type:          "adhesion",
          description:   `Adhésion Awoundjô — ${roleLabel}`,
          success_url:   `${window.location.origin}${window.location.pathname}?payment=success`,
          failed_url:    `${window.location.origin}${window.location.pathname}?payment=failed`,
        }),
      });
      const data = await res.json();
      const url  = data?.data?.payment_url;
      if (!url) throw new Error(data?.error || "URL de paiement PayDunya non reçue");
      window.location.href = url;
    } catch (e) {
      setPayError(e.message || "Erreur lors de l'initialisation du paiement PayDunya");
      setPayLoading(false);
    }
  }

  return (
    <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:20 }}>

      {/* Étapes */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, flexWrap:"wrap" }}>
        {[
          { label:"Compte créé", done:true },
          { label:"Paiement", done:false, active:true },
          { label:"Validation admin", done:false },
        ].map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{
              padding:"4px 12px", borderRadius:99, fontSize:11, fontWeight:700,
              background: s.done ? C.greenL : s.active ? C.blueL : C.bg,
              color:      s.done ? C.green  : s.active ? C.blue  : C.slate,
              border:     `1.5px solid ${s.done ? C.green : s.active ? C.blue : C.border}`,
            }}>
              {s.done ? "✅ " : s.active ? "👉 " : ""}{s.label}
            </div>
            {i < 2 && <span style={{ color:C.border, fontSize:14 }}>→</span>}
          </div>
        ))}
      </div>

      {/* Credentials */}
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

      {/* Partage */}
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

      {/* Paiement — choix méthode */}
      <div style={{ background:"#F8FAFC", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"16px 18px" }}>
        <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:800, color:C.dark }}>
          💳 Étape suivante — Paiement des frais d'adhésion
        </p>
        <p style={{ margin:"0 0 14px", fontSize:12, color:C.slate }}>
          Payez maintenant les frais d'adhésion de <strong>{Number(adhesionFee).toLocaleString("fr-FR")} FCFA</strong> pour activer le processus de validation.
        </p>

        {/* Sélecteur méthode */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          {[
            { id:"cinetpay",  label:"💳 CinetPay",  sub:"Orange · Wave · MTN · Carte" },
            { id:"paydunya",  label:"🏦 PayDunya",   sub:"Orange · Wave · MTN · Moov"  },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setPayMethod(m.id)}
              style={{
                flex:1, padding:"10px 8px", borderRadius:10, border:"none",
                background: payMethod === m.id
                  ? (m.id === "cinetpay" ? "#EFF6FF" : "#ECFDF5")
                  : "#fff",
                outline: payMethod === m.id
                  ? `2px solid ${m.id === "cinetpay" ? "#0072C6" : "#059669"}`
                  : "1.5px solid #E2E8F0",
                cursor:"pointer", textAlign:"center", fontFamily:"inherit",
              }}
            >
              <p style={{ margin:0, fontSize:13, fontWeight:800,
                color: payMethod === m.id ? (m.id === "cinetpay" ? "#0072C6" : "#059669") : C.slate }}>
                {m.label}
              </p>
              <p style={{ margin:"2px 0 0", fontSize:10, color:C.slate }}>{m.sub}</p>
            </button>
          ))}
        </div>

        {payError && (
          <div style={{ background:C.redL, borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
            <p style={{ margin:0, fontSize:12, color:C.red, fontWeight:600 }}>⚠️ {payError}</p>
          </div>
        )}
        <button
          onClick={payMethod === "paydunya" ? handlePayDunya : handlePay}
          disabled={payLoading}
          style={{
            width:"100%", padding:"13px 0", borderRadius:10, border:"none",
            background: payLoading ? "#94a3b8"
              : payMethod === "paydunya"
              ? "linear-gradient(135deg,#059669,#047857)"
              : "linear-gradient(135deg,#0072C6,#005A9E)",
            color:"#fff", fontWeight:900, fontSize:14,
            cursor: payLoading ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow: payLoading ? "none"
              : payMethod === "paydunya"
              ? "0 4px 16px rgba(5,150,105,.35)"
              : "0 4px 16px rgba(0,114,198,.35)",
            fontFamily:"inherit",
          }}
        >
          {payLoading ? (
            <>
              <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              Redirection…
            </>
          ) : payMethod === "paydunya" ? (
            <>🏦 Payer {Number(adhesionFee).toLocaleString("fr-FR")} FCFA avec PayDunya</>
          ) : (
            <>💳 Payer {Number(adhesionFee).toLocaleString("fr-FR")} FCFA avec CinetPay</>
          )}
        </button>
        <p style={{ margin:"8px 0 0", fontSize:11, color:C.slate, textAlign:"center" }}>
          Paiement 100% sécurisé
        </p>
      </div>

      {/* Info validation */}
      <div style={{ background:C.goldL, border:`1.5px solid ${C.gold}44`, borderRadius:10, padding:"12px 16px" }}>
        <p style={{ margin:0, fontSize:12, color:C.gold, fontWeight:700 }}>
          ⏳ Après paiement — validation admin requise
        </p>
        <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>
          Un administrateur validera le compte. Le portail sera accessible après activation.
        </p>
      </div>

      <button
        onClick={onClose}
        style={{ width:"100%", padding:"10px 0", background:"#fff", color:C.slate, border:`1.5px solid ${C.border}`, borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}
      >
        Fermer (paiement plus tard)
      </button>
    </div>
  );
}

/**
 * AdhesionForm
 * @param {string}   targetRole - Rôle à créer
 * @param {function} onSuccess  - Appelé avec (credentials, roleLabel) après création
 */
export default function AdhesionForm({ targetRole, onSuccess }) {
  const rc = ROLE_CONFIG[targetRole] || ROLE_CONFIG.RECRUTEUR;

  const [step,          setStep]          = useState("form"); // "form" | "submitting" | "done"
  const [error,         setError]         = useState("");
  const [credentials,   setCredentials]   = useState(null);
  const [ambassadorId,  setAmbassadorId]  = useState(null);

  // ── Formules chargées depuis /api/plans (comme dans Clients.jsx) ──
  const [plans,        setPlans]        = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("agent_token");
    fetch(`${BASE}/api/plans`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(({ data }) => {
        if (data?.length) {
          setPlans(data);
          setForm(prev => ({ ...prev, plan: prev.plan || data[0].slug.toUpperCase() }));
        }
      })
      .catch(console.error)
      .finally(() => setPlansLoading(false));
  }, []);

  const [form, setForm] = useState({
    name:    "",
    email:   "",
    phone:   "",
    country: "Côte d'Ivoire",
    plan:    "",
  });

  // Formule sélectionnée — objet API complet
  const selectedPlan = plans.find(p => p.slug.toUpperCase() === form.plan) || plans[0];
  // Frais d'adhésion réels selon la formule
  const adhesionFee = selectedPlan ? Number(selectedPlan.adhesion_price) : 0;

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

    setStep("submitting");
    try {
      const { data } = await diasporaBeneAPI.createAmbassador({
        name:           form.name,
        email:          form.email,
        phone:          form.phone,
        country:        form.country,
        role:           targetRole,
        plan:           form.plan,
        membership_fee: adhesionFee,  // frais réels selon la formule choisie en DB
        // status_validation et status_payment = 'pending'/'unpaid' par défaut en DB
      });

      const newId = data.ambassador?.id || data.id;
      setCredentials(data.credentials);
      setAmbassadorId(newId);
      setStep("done");
      onSuccess?.(data.credentials, rc.art, newId, adhesionFee);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Erreur lors de la création du compte.");
      setStep("form");
    }
  }

  // ── État : submitting ──────────────────────────────────────
  if (step === "submitting") {
    return (
      <div style={{ textAlign:"center", padding:"60px 20px" }}>
        <div style={{
          width:48, height:48, border:`3px solid ${rc.bg}`,
          borderTop:`3px solid ${rc.color}`,
          borderRadius:"50%", animation:"spin .8s linear infinite",
          margin:"0 auto 20px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontWeight:800, fontSize:18, color:C.dark, margin:"0 0 8px" }}>
          Création du compte…
        </p>
        <p style={{ fontSize:13, color:C.slate, margin:0 }}>
          Génération des identifiants et du numéro mutualiste en cours.
        </p>
      </div>
    );
  }

  // ── État : done ────────────────────────────────────────────
  if (step === "done" && credentials) {
    return (
      <div style={{
        background:"#fff", borderRadius:16,
        border:`1px solid ${C.border}`,
        boxShadow:"0 4px 24px rgba(0,0,0,0.08)",
        overflow:"hidden", maxWidth:540, margin:"0 auto",
      }}>
        <div style={{ padding:"18px 24px", background:`linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`, color:"#fff" }}>
          <p style={{ margin:"0 0 4px", fontSize:20 }}>{rc.icon}</p>
          <h2 style={{ margin:0, fontSize:17, fontWeight:900 }}>{rc.title}</h2>
        </div>
        <SuccessScreen
          credentials={credentials}
          ambassadorId={ambassadorId}
          roleLabel={rc.art}
          rc={rc}
          adhesionFee={adhesionFee}
          onClose={() => { setStep("form"); setCredentials(null); setAmbassadorId(null); setForm({ name:"", email:"", phone:"", country:"Côte d'Ivoire", plan: plans[0]?.slug.toUpperCase() || "" }); }}
        />
      </div>
    );
  }

  // ── État : form ────────────────────────────────────────────
  return (
    <div style={{
      background:"#fff", borderRadius:16,
      border:`1px solid ${C.border}`,
      boxShadow:"0 4px 24px rgba(0,0,0,0.08)",
      overflow:"hidden", maxWidth:540, margin:"0 auto",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ padding:"20px 24px", background:`linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`, color:"#fff" }}>
        <p style={{ margin:"0 0 4px", fontSize:22 }}>{rc.icon}</p>
        <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:900 }}>{rc.title}</h2>
        <p style={{ margin:0, fontSize:13, opacity:0.85 }}>
          Le compte sera créé immédiatement. Le paiement sera effectué après validation admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding:"24px", display:"flex", flexDirection:"column", gap:24 }}>

        {error && (
          <div style={{ background:C.redL, border:`1px solid ${C.red}33`, borderRadius:10, padding:"12px 16px" }}>
            <p style={{ margin:0, fontSize:13, color:C.red, fontWeight:600 }}>⚠️ {error}</p>
          </div>
        )}

        {/* Section 1 : Infos personnelles */}
        <div>
          <SectionTitle step={1} label="Informations personnelles" color={rc.color} />
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <InputField label="Nom complet"         placeholder="Jean Koua"           value={form.name}    onChange={setField("name")}    required />
            <InputField label="Email"               placeholder="jean@email.com"       value={form.email}   onChange={setField("email")}   required type="email" />
            <InputField label="Téléphone WhatsApp"  placeholder="+225 07 00 00 00 00" value={form.phone}   onChange={setField("phone")}   required type="tel" />
            <InputField label="Pays de résidence"   value={form.country}               onChange={setField("country")} as="select">
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </InputField>
          </div>
        </div>

        {/* Section 2 : Plan mensuel — chargé depuis /api/plans */}
        <div>
          <SectionTitle step={2} label="Choisissez le plan mensuel" color={rc.color} />
          {plansLoading ? (
            <div style={{ textAlign:"center", padding:"20px", color:C.slate, fontSize:13 }}>
              <div style={{ width:24, height:24, border:`2px solid ${rc.bg}`, borderTop:`2px solid ${rc.color}`, borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 8px" }} />
              Chargement des formules…
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {plans.map(p => {
                const slug = p.slug.toUpperCase();
                const isSelected = form.plan === slug;
                return (
                  <div
                    key={slug}
                    onClick={() => setForm(prev => ({ ...prev, plan: slug }))}
                    style={{
                      padding:"14px 16px", borderRadius:10,
                      border:`2px solid ${isSelected ? rc.color : C.border}`,
                      background: isSelected ? rc.bg : "#fff",
                      cursor:"pointer", display:"flex",
                      alignItems:"center", justifyContent:"space-between",
                      transition:"all .15s",
                    }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{
                        width:18, height:18, borderRadius:"50%",
                        border:`2px solid ${isSelected ? rc.color : C.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0,
                      }}>
                        {isSelected && <div style={{ width:9, height:9, borderRadius:"50%", background:rc.color }} />}
                      </div>
                      <div>
                        <p style={{ margin:0, fontWeight:700, fontSize:14, color:isSelected ? rc.color : C.dark }}>
                          {planIcon(slug)} {p.name}
                        </p>
                        <p style={{ margin:0, fontSize:12, color:C.slate }}>
                          {p.coverage_percent}% de couverture
                          {p.adhesion_price === 0 ? " · Adhésion gratuite 🎉" : ` · Adhésion ${Number(p.adhesion_price).toLocaleString("fr-FR")} FCFA`}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ margin:0, fontWeight:800, fontSize:15, color:isSelected ? rc.color : C.dark }}>
                        {fmt(p.monthly_price)}
                      </p>
                      <p style={{ margin:0, fontSize:11, color:C.slate }}>/ mois</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3 : Récapitulatif — avec les vrais prix de la formule */}
        <div>
          <SectionTitle step={3} label="Récapitulatif" color={rc.color} />
          <div style={{ background:C.bg, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden" }}>
            {[
              {
                label: selectedPlan ? `Plan mensuel — ${planIcon(selectedPlan.slug)} ${selectedPlan.name}` : "Plan mensuel",
                value: selectedPlan ? fmt(selectedPlan.monthly_price) + " / mois" : "—",
                highlight: false,
              },
              {
                label: "Frais d'adhésion",
                value: selectedPlan
                  ? adhesionFee === 0 ? "Gratuit 🎉" : fmt(adhesionFee)
                  : "—",
                highlight: false,
              },
              {
                label: "Base de calcul des commissions",
                value: selectedPlan
                  ? adhesionFee === 0 ? "Aucune commission" : `50% × ${fmt(adhesionFee)} = ${fmt(adhesionFee * 0.5)}`
                  : "—",
                highlight: false,
              },
              {
                label: "À payer maintenant",
                value: "0 FCFA — après validation admin",
                highlight: true,
              },
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
                <p style={{ margin:0, fontWeight:row.highlight ? 900 : 600, fontSize:14, color:row.highlight ? rc.color : C.dark }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>
          <p style={{ margin:"8px 0 0", fontSize:12, color:C.slate }}>
            💡 Le paiement sera débloqué après validation du compte par un administrateur.
          </p>
        </div>

        {/* Bouton */}
        <button
          type="submit"
          style={{
            width:"100%", padding:"15px 20px", borderRadius:12, border:"none",
            fontSize:15, fontWeight:900, cursor:"pointer",
            background:`linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`,
            color:"#fff",
            boxShadow:`0 6px 20px ${rc.color}44`,
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            transition:"all .2s", fontFamily:"inherit",
          }}
        >
          ✅ Créer le compte {rc.art}
        </button>

        <p style={{ margin:"-12px 0 0", fontSize:11, color:C.slate, textAlign:"center" }}>
          🔒 Les identifiants sont générés automatiquement · Paiement après validation admin
        </p>

      </form>
    </div>
  );
}
