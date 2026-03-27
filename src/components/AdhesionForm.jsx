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
//    [7] → Écran de succès : identifiants affichés selon hiérarchie du rôle
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

// ── Hiérarchie des identifiants par rôle ─────────────────────
//  Définit quels champs de `credentials` afficher et dans quel ordre,
//  selon la position du rôle dans l'organigramme Awoundjô.
//
//  Structure attendue de `credentials` (retournée par le backend) :
//  {
//    membre_id, login, password, qr_code?,
//    recruteur_id?, ambassadeur_id?,
//    leader_id?, pasteur_id?, responsable_id?,
//    parrain_code?, lien_parrainage?,
//    dashboard_url,
//  }
const ROLE_CREDENTIALS_HIERARCHY = {

  // ─── Réseau Diaspora ──────────────────────────────────────
  AMBASSADEUR_PAYS: [
    {
      section: "Compte Ambassadeur Pays",
      icon: "🗺️",
      fields: [
        { key: "ambassadeur_id", label: "ID Ambassadeur",    copy: true, highlight: true },
        { key: "membre_id",      label: "ID Membre",          copy: true },
        { key: "login",          label: "Identifiant",        copy: true },
        { key: "password",       label: "Mot de passe",       copy: true, secret: true },
      ],
    },
    {
      section: "Accès & Gestion",
      icon: "🔗",
      fields: [
        { key: "dashboard_url",  label: "Tableau de bord",   link: true },
        { key: "qr_code",        label: "QR Code d'accès",   qr:   true },
      ],
    },
  ],

  RECRUTEUR: [
    {
      section: "Compte Recruteur",
      icon: "🤝",
      fields: [
        { key: "recruteur_id",   label: "ID Recruteur",       copy: true, highlight: true },
        { key: "membre_id",      label: "ID Membre",           copy: true },
        { key: "login",          label: "Identifiant",         copy: true },
        { key: "password",       label: "Mot de passe",        copy: true, secret: true },
      ],
    },
    {
      section: "Lien & Parrainage",
      icon: "🔗",
      fields: [
        { key: "lien_parrainage", label: "Lien de recrutement", copy: true, link: true },
        { key: "dashboard_url",   label: "Tableau de bord",     link: true },
      ],
    },
  ],

  // ─── Réseau Parrainage ────────────────────────────────────
  LEADER: [
    {
      section: "Compte Leader",
      icon: "⭐",
      fields: [
        { key: "leader_id",    label: "ID Leader",         copy: true, highlight: true },
        { key: "membre_id",    label: "ID Membre",          copy: true },
        { key: "login",        label: "Identifiant",        copy: true },
        { key: "password",     label: "Mot de passe",       copy: true, secret: true },
      ],
    },
    {
      section: "Parrainage & Accès",
      icon: "🔗",
      fields: [
        { key: "parrain_code",    label: "Code Parrain",          copy: true },
        { key: "lien_parrainage", label: "Lien de parrainage",    copy: true, link: true },
        { key: "dashboard_url",   label: "Tableau de bord",       link: true },
      ],
    },
  ],

  PASTEUR: [
    {
      section: "Compte Pasteur",
      icon: "⛪",
      fields: [
        { key: "pasteur_id",   label: "ID Pasteur",        copy: true, highlight: true },
        { key: "membre_id",    label: "ID Membre",          copy: true },
        { key: "login",        label: "Identifiant",        copy: true },
        { key: "password",     label: "Mot de passe",       copy: true, secret: true },
      ],
    },
    {
      section: "Parrainage & Accès",
      icon: "🔗",
      fields: [
        { key: "parrain_code",    label: "Code Parrain",          copy: true },
        { key: "lien_parrainage", label: "Lien de parrainage",    copy: true, link: true },
        { key: "dashboard_url",   label: "Tableau de bord",       link: true },
      ],
    },
  ],

  RESPONSABLE: [
    {
      section: "Compte Responsable",
      icon: "🤝",
      fields: [
        { key: "responsable_id", label: "ID Responsable",   copy: true, highlight: true },
        { key: "membre_id",      label: "ID Membre",         copy: true },
        { key: "login",          label: "Identifiant",       copy: true },
        { key: "password",       label: "Mot de passe",      copy: true, secret: true },
      ],
    },
    {
      section: "Parrainage & Accès",
      icon: "🔗",
      fields: [
        { key: "parrain_code",    label: "Code Parrain",          copy: true },
        { key: "lien_parrainage", label: "Lien de parrainage",    copy: true, link: true },
        { key: "dashboard_url",   label: "Tableau de bord",       link: true },
      ],
    },
  ],
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

// ── Écran de succès : affiche les identifiants selon la hiérarchie ──
function SuccessScreen({ credentials, roleLabel, rc, targetRole, onDone }) {
  const [copied, setCopied]     = useState({});
  const [revealed, setRevealed] = useState({});

  const hierarchy = ROLE_CREDENTIALS_HIERARCHY[targetRole] || [];

  function copyToClipboard(key, value) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
    });
  }

  function toggleReveal(key) {
    setRevealed(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden" }}>

      {/* Bandeau succès */}
      <div style={{
        background:`linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`,
        padding:"24px 22px", textAlign:"center",
      }}>
        <div style={{
          width:56, height:56, borderRadius:"50%",
          background:"rgba(255,255,255,.2)", border:"2px solid rgba(255,255,255,.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:28, margin:"0 auto 12px",
        }}>✅</div>
        <p style={{ margin:0, color:"#fff", fontWeight:900, fontSize:18 }}>
          Compte créé avec succès !
        </p>
        <p style={{ margin:"6px 0 0", color:"rgba(255,255,255,.8)", fontSize:13 }}>
          Bienvenue en tant que {roleLabel}
        </p>
      </div>

      {/* Avertissement sécurité */}
      <div style={{
        background:"#FFFBEB", border:"none", borderBottom:`1px solid ${C.border}`,
        padding:"12px 20px", display:"flex", alignItems:"flex-start", gap:10,
      }}>
        <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
        <p style={{ margin:0, fontSize:12, color:"#92400E", fontWeight:600, lineHeight:1.5 }}>
          Notez et conservez ces identifiants en lieu sûr. Le mot de passe ne sera plus affiché après la fermeture de cette page.
        </p>
      </div>

      {/* Sections hiérarchisées */}
      <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:20 }}>
        {hierarchy.map((section, si) => {
          // Filtrer les champs qui ont une valeur dans credentials
          const visibleFields = section.fields.filter(f => credentials?.[f.key]);
          if (visibleFields.length === 0) return null;

          return (
            <div key={si}>
              {/* Titre de section */}
              <div style={{
                display:"flex", alignItems:"center", gap:8, marginBottom:12,
                paddingBottom:8, borderBottom:`2px solid ${rc.color}22`,
              }}>
                <span style={{ fontSize:16 }}>{section.icon}</span>
                <p style={{ margin:0, fontSize:13, fontWeight:800, color:rc.color, textTransform:"uppercase", letterSpacing:".5px" }}>
                  {section.section}
                </p>
              </div>

              {/* Champs */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {visibleFields.map((field) => {
                  const value = credentials[field.key];
                  const isRevealed = revealed[field.key];
                  const isCopied   = copied[field.key];

                  return (
                    <div
                      key={field.key}
                      style={{
                        borderRadius:10,
                        border:`1.5px solid ${field.highlight ? rc.color : C.border}`,
                        background: field.highlight ? rc.bg : C.bg,
                        overflow:"hidden",
                      }}
                    >
                      <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{
                            margin:"0 0 3px",
                            fontSize:11, fontWeight:700,
                            color: field.highlight ? rc.color : C.slate,
                            textTransform:"uppercase", letterSpacing:".4px",
                          }}>
                            {field.label}
                          </p>

                          {/* Valeur selon le type de champ */}
                          {field.link ? (
                            <a
                              href={value} target="_blank" rel="noreferrer"
                              style={{ fontSize:13, color:rc.color, fontWeight:600, wordBreak:"break-all", textDecoration:"none" }}
                            >
                              {value} ↗
                            </a>
                          ) : field.secret ? (
                            <p style={{
                              margin:0, fontSize:13, fontWeight:700,
                              color:C.dark, letterSpacing: isRevealed ? 0 : "3px",
                              fontFamily: isRevealed ? "inherit" : "monospace",
                              wordBreak:"break-all",
                            }}>
                              {isRevealed ? value : "•".repeat(Math.min(value.length, 12))}
                            </p>
                          ) : (
                            <p style={{
                              margin:0, fontSize:13, fontWeight:field.highlight ? 800 : 600,
                              color: field.highlight ? rc.color : C.dark,
                              fontFamily:"monospace", wordBreak:"break-all",
                            }}>
                              {value}
                            </p>
                          )}
                        </div>

                        {/* Boutons d'action */}
                        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                          {field.secret && (
                            <button
                              type="button"
                              onClick={() => toggleReveal(field.key)}
                              style={{
                                padding:"5px 10px", borderRadius:6, border:`1px solid ${C.border}`,
                                background:"#fff", cursor:"pointer", fontSize:12, color:C.slate,
                                fontFamily:"inherit",
                              }}
                            >
                              {isRevealed ? "🙈 Masquer" : "👁 Voir"}
                            </button>
                          )}
                          {field.copy && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(field.key, value)}
                              style={{
                                padding:"5px 10px", borderRadius:6, border:"none",
                                background: isCopied ? C.greenL : rc.bg,
                                color: isCopied ? C.green : rc.color,
                                cursor:"pointer", fontSize:12, fontWeight:700,
                                fontFamily:"inherit", transition:"all .15s",
                              }}
                            >
                              {isCopied ? "✓ Copié" : "📋 Copier"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Bouton finaliser */}
        <button
          type="button"
          onClick={() => onDone?.(credentials, roleLabel)}
          style={{
            width:"100%", padding:"14px 20px", borderRadius:12, border:"none",
            fontSize:15, fontWeight:900, cursor:"pointer",
            background:`linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`,
            color:"#fff", boxShadow:`0 6px 20px ${rc.color}44`,
            fontFamily:"inherit", marginTop:4,
          }}
        >
          {rc.icon} Accéder à mon espace {roleLabel}
        </button>

        <p style={{ margin:"-8px 0 0", fontSize:11, color:C.slate, textAlign:"center" }}>
          Ces identifiants vous ont également été envoyés par email.
        </p>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
/**
 * AdhesionForm
 * @param {string}   targetRole   - Rôle à créer (AMBASSADEUR_PAYS, RECRUTEUR, LEADER, PASTEUR, RESPONSABLE)
 * @param {function} onSuccess    - Appelé avec (credentials, roleLabel) après que l'utilisateur clique "Accéder"
 */
export default function AdhesionForm({ targetRole, onSuccess }) {
  const rc = ROLE_CONFIG[targetRole] || ROLE_CONFIG.RECRUTEUR;

  // Étapes : "form" → "payment" → "processing" → "done"
  const [step, setStep]               = useState("form");
  const [error, setError]             = useState("");
  const [credentials, setCredentials] = useState(null);

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
          // ✅ Stocker les credentials et passer à l'écran de succès
          setCredentials(data.credentials);
          setStep("done");
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

  // ── Écran "Succès" : identifiants par hiérarchie ──────────
  if (step === "done" && credentials) {
    return (
      <SuccessScreen
        credentials={credentials}
        roleLabel={rc.art}
        rc={rc}
        targetRole={targetRole}
        onDone={onSuccess}
      />
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
