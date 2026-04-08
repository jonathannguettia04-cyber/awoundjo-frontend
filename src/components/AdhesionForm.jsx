// src/components/AdhesionForm.jsx
// FLUX : Formulaire → Génération ID+MDP (pre-paiement) → CinetPay → Dashboard → Validation admin
import { useState } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const MEMBERSHIP_FEE = 15000;

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

const PLANS = [
  { value: "ESSENTIELLE", label: "🌿 Essentielle", desc: "Couverture de base",  monthly: 10000 },
  { value: "IVOIRIENNE",  label: "🌍 Ivoirienne",  desc: "Couverture élargie", monthly: 15000 },
  { value: "TURQUOISE",   label: "💎 Turquoise",   desc: "Couverture premium", monthly: 35000 },
];

const ROLE_CONFIG = {
  AMBASSADEUR_PAYS: { title: "Adhésion Ambassadeur Pays", icon: "🗺️", color: C.green,  bg: C.greenL,  art: "l'Ambassadeur Pays"  },
  RECRUTEUR:        { title: "Adhésion Recruteur",        icon: "🤝", color: C.gold,   bg: C.goldL,   art: "le Recruteur"        },
  RUM:              { title: "Adhésion RUM",              icon: "👑", color: C.purple, bg: C.purpleL, art: "le RUM"              },
  LEADER:           { title: "Adhésion Leader",           icon: "⭐", color: C.blue,   bg: C.blueL,   art: "le Leader"           },
  PASTEUR:          { title: "Adhésion Pasteur",          icon: "⛪", color: C.teal,   bg: C.tealL,   art: "le Pasteur"          },
  RESPONSABLE:      { title: "Adhésion Responsable",      icon: "🤝", color: C.purple, bg: C.purpleL, art: "le Responsable"      },
};

const COUNTRIES = [
  "Côte d'Ivoire","France","Belgique","Suisse","Canada","États-Unis","Royaume-Uni",
  "Italie","Espagne","Allemagne","Pays-Bas","Portugal","Sénégal","Ghana","Cameroun",
  "Togo","Bénin","Burkina Faso","Mali","Guinée","Gabon","Congo","Maroc","Autre",
];

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

function getToken() {
  return (
    localStorage.getItem("diaspora_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("agent_token") ||
    ""
  );
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// Props :
//   targetRole   : string   — rôle à créer (RECRUTEUR, LEADER, etc.)
//   returnPath   : string   — chemin de retour après CinetPay
//                            ex: "/diaspora/register/pays"
//   onSuccess    : fn()     — appelé après paiement confirmé (pour rafraîchir la liste)
//   onReset      : fn()     — appelé quand l'utilisateur ferme le formulaire
// ─────────────────────────────────────────────────────────────
export default function AdhesionForm({ targetRole, returnPath, onSuccess, onReset }) {
  const rc = ROLE_CONFIG[targetRole] || ROLE_CONFIG.RECRUTEUR;

  // ÉTAPES :
  //   "form"        → saisie des infos
  //   "redirecting" → création du compte en cours + redirection CinetPay
  const [step,  setStep]  = useState("form");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name:    "",
    email:   "",
    phone:   "",
    country: "Côte d'Ivoire",
    plan:    "ESSENTIELLE",
  });

  const selectedPlan = PLANS.find(p => p.value === form.plan) || PLANS[0];

  function setField(key) {
    return (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  function validate() {
    if (!form.name.trim())  return "Le nom complet est requis.";
    if (!form.email.trim()) return "L'adresse email est requise.";
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

    try {
      const token  = getToken();
      const origin = window.location.origin;
      const path   = returnPath || window.location.pathname;

      // ── ÉTAPE 1 : Créer le compte ambassadeur (status_payment='unpaid')
      //             Le backend génère username + temp_password et les retourne
      const createRes = await fetch(`${BASE}/api/diaspora/ambassadors/pre-register`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:    form.name.trim(),
          email:   form.email.trim().toLowerCase(),
          phone:   form.phone.trim(),
          country: form.country,
          role:    targetRole,
          plan:    form.plan,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData?.error || createData?.message || "Erreur lors de la création du compte.");
      }

      const payload = createData.data ?? createData;
      const { ambassador_id, transaction_id } = payload;

      if (!ambassador_id || !transaction_id) {
        throw new Error("Réponse serveur invalide (ambassador_id ou transaction_id manquant).");
      }

      // ── ÉTAPE 2 : Initialiser le paiement CinetPay
      //             success_url → dashboard de l'ambassadeur (qui sera "pending" jusqu'à validation admin)
      const networkDash = ["RUM","LEADER","PASTEUR","RESPONSABLE"].includes(targetRole)
        ? "/referral/dashboard"
        : "/diaspora/dashboard";

      const payRes = await fetch(`${BASE}/api/payments/cinetpay/init-web`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          ambassador_id,
          amount:         MEMBERSHIP_FEE,
          description:    `Adhésion Awoundjô — ${rc.art}`,
          transaction_id,
          client_name:    form.name,
          client_email:   form.email,
          client_phone:   form.phone,
          type:           "adhesion",
          // ✅ success_url = dashboard ambassadeur (pas la page courante)
          // Le webhook CinetPay activera le compte côté serveur
          success_url: `${origin}${networkDash}?payment=success&tx=${transaction_id}`,
          failed_url:  `${origin}${path}?payment=failed`,
        }),
      });

      const payData = await payRes.json();
      const paymentUrl = payData?.data?.payment_url || payData?.payment_url;

      if (!paymentUrl) {
        throw new Error(payData?.message || "URL de paiement non reçue du serveur.");
      }

      // ── ÉTAPE 3 : Rediriger vers CinetPay
      window.location.href = paymentUrl;

    } catch (err) {
      setError(err.message || "Une erreur inattendue s'est produite.");
      setStep("form");
    }
  }

  // ── Écran de redirection ──────────────────────────────────
  if (step === "redirecting") {
    return (
      <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, padding: 32, textAlign: "center" }}>
        <div style={{
          width: 44, height: 44,
          border: `3px solid ${C.blueL}`, borderTop: `3px solid ${C.blue}`,
          borderRadius: "50%", animation: "spin .8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ margin: 0, fontWeight: 800, color: C.blue, fontSize: 15 }}>Création du compte en cours…</p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.slate }}>Redirection vers CinetPay — ne fermez pas cette fenêtre</p>
      </div>
    );
  }

  // ── Formulaire ────────────────────────────────────────────
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${rc.color}18, ${rc.color}08)`,
        borderBottom: `1px solid ${C.border}`,
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>{rc.icon}</span>
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: C.dark }}>{rc.title}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
            Frais d'adhésion : <strong style={{ color: rc.color }}>15 000 FCFA</strong> — paiement sécurisé CinetPay
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>

        {error && (
          <div style={{ background: C.redL, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Infos processus */}
        <div style={{ background: C.blueL, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 12, color: C.blue, lineHeight: 1.6 }}>
            Votre compte sera <strong>créé immédiatement</strong> après le paiement.
            Vous serez redirigé(e) vers votre tableau de bord.
            Un administrateur validera votre compte pour activer toutes les fonctionnalités.
          </p>
        </div>

        {/* Section 1 — Identité */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 99, background: rc.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>1</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.dark }}>Informations personnelles</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { key: "name",  label: "Nom complet *",       type: "text",  placeholder: "Jean Kouassi"          },
              { key: "email", label: "Adresse email *",      type: "email", placeholder: "jean@email.com"        },
              { key: "phone", label: "Numéro WhatsApp *",    type: "tel",   placeholder: "+225 07 00 00 00 00"   },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={setField(f.key)} required
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Pays de résidence</label>
              <select value={form.country} onChange={setField("country")}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box", background: "#fff", fontFamily: "inherit" }}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2 — Offre */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 99, background: rc.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>2</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.dark }}>Choisir une offre de couverture</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PLANS.map(p => (
              <div key={p.value} onClick={() => setForm(f => ({ ...f, plan: p.value }))}
                style={{
                  padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${form.plan === p.value ? rc.color : C.border}`,
                  background: form.plan === p.value ? `${rc.color}10` : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all .15s",
                }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: form.plan === p.value ? rc.color : C.dark }}>{p.label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.slate }}>{p.desc}</p>
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: form.plan === p.value ? rc.color : C.slate, whiteSpace: "nowrap" }}>
                  {fmt(p.monthly)}/mois
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Récap paiement */}
        <div style={{ background: C.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: C.slate }}>Frais d'adhésion (unique)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>15 000 FCFA</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: C.slate }}>Offre sélectionnée</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: rc.color }}>{selectedPlan.label}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>Total à payer maintenant</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: rc.color }}>15 000 FCFA</span>
          </div>
        </div>

        <button type="submit"
          style={{
            width: "100%", padding: "13px 0",
            background: `linear-gradient(135deg, ${rc.color}, ${rc.color}cc)`,
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: `0 4px 14px ${rc.color}40`,
          }}>
          💳 Créer le compte et payer 15 000 FCFA
        </button>

        <p style={{ margin: 0, textAlign: "center", fontSize: 11, color: C.slate }}>
          🔒 Compte créé immédiatement · Paiement sécurisé CinetPay
        </p>
      </form>
    </div>
  );
}
