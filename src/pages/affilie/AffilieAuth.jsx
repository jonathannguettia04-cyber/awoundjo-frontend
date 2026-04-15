// src/pages/affilie/AffilieAuth.jsx
// ─────────────────────────────────────────────────────────────
//  Portail d'authentification — Réseau AFFILIÉ
//
//  Modes :
//    - Login : tous rôles affiliés (Directrice, Leader, Superviseur, Recruteur)
//    - Register : uniquement la DIRECTRICE (auto-enregistrement)
//
//  Workflow register :
//    [1] Formulaire → POST /api/affilie/register
//    [2] Compte créé, statut "pending" → redirection vers login
//        avec message "En attente de validation"
//    [3] Après validation admin → POST /api/affilie/payments/initiate-adhesion
//    [4] Paiement CinetPay → activation compte
//    [5] Connexion possible
//
//  Codes d'erreur login :
//    PAYMENT_REQUIRED   → bouton "Finaliser le paiement"
//    PENDING_VALIDATION → bandeau orange
//    ACCOUNT_REJECTED   → message rouge
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const COUNTRIES = [
  "Côte d'Ivoire","France","Belgique","Suisse","Canada","États-Unis","Royaume-Uni",
  "Italie","Espagne","Allemagne","Pays-Bas","Portugal","Maroc","Sénégal","Ghana",
  "Cameroun","Togo","Bénin","Burkina Faso","Mali","Guinée","Gabon","Congo","Autre",
];

const PLANS = [
  { value: "ESSENTIELLE", label: "🌿 Essentielle", desc: "Couverture de base" },
  { value: "IVOIRIENNE",  label: "🌍 Ivoirienne",  desc: "Couverture intermédiaire" },
  { value: "TURQUOISE",   label: "💎 Turquoise",   desc: "Couverture premium" },
];

const C = {
  primary: "#7C3AED", primaryL: "#F5F3FF", primaryD: "#5B21B6",
  green:   "#059669", greenL:   "#ECFDF5",
  gold:    "#D97706", goldL:    "#FFFBEB",
  red:     "#DC2626", redL:     "#FEF2F2",
  slate:   "#64748B", dark:     "#0F172A",
  border:  "#E2E8F0", bg:       "#F8FAFC",
};

// ── Composants utilitaires ────────────────────────────────────
function InputField({ label, type = "text", placeholder, value, onChange, required = false, as = "input", children }) {
  const base = {
    width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14,
    border: `1.5px solid ${C.border}`, outline: "none",
    boxSizing: "border-box", background: "#fff", fontFamily: "inherit",
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {as === "select" ? (
        <select value={value} onChange={onChange} style={{ ...base, cursor: "pointer" }}>
          {children}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} value={value}
          onChange={onChange} style={base} />
      )}
    </div>
  );
}

function Btn({ children, onClick, disabled, color = C.primary, outline = false, full = true }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? "100%" : "auto",
      padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "#CBD5E1" : outline ? "#fff" : color,
      color: disabled ? "#94A3B8" : outline ? color : "#fff",
      border: `2px solid ${disabled ? "#CBD5E1" : color}`,
      transition: "all .2s",
    }}>
      {children}
    </button>
  );
}

function Alert({ type, children }) {
  const styles = {
    info:    { bg: C.primaryL, color: C.primary,  border: `${C.primary}44` },
    success: { bg: C.greenL,   color: C.green,    border: `${C.green}44`   },
    warning: { bg: C.goldL,    color: C.gold,     border: `${C.gold}44`    },
    error:   { bg: C.redL,     color: C.red,      border: `${C.red}44`     },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{
      background: s.bg, color: s.color,
      border: `1.5px solid ${s.border}`,
      borderRadius: 10, padding: "12px 16px",
      fontSize: 13, fontWeight: 600,
    }}>
      {children}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function AffilieAuth() {
  const navigate         = useNavigate();
  const [params]         = useSearchParams();

  const [tab,            setTab]            = useState("login");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [errorCode,      setErrorCode]      = useState(null);
  const [errorMemberId,  setErrorMemberId]  = useState(null);
  const [errorPlan,      setErrorPlan]      = useState(null);
  const [errorFee,       setErrorFee]       = useState(null);
  const [payLoading,     setPayLoading]     = useState(false);
  const [success,        setSuccess]        = useState("");
  const [paymentResult,  setPaymentResult]  = useState(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm,   setRegForm]   = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    country: "Côte d'Ivoire", city: "", plan: "ESSENTIELLE",
  });

  // Retour CinetPay
  useEffect(() => {
    const result = params.get("payment");
    if (result === "success" || result === "failed") {
      setPaymentResult(result);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Redirige si déjà connecté
  useEffect(() => {
    const token = localStorage.getItem("affilie_token");
    if (token) navigate("/affilie/dashboard");
  }, []);

  // ── Helper champs ─────────────────────────────────────────
  const inp = (field, form, setter) => (e) => setter(p => ({ ...p, [field]: e.target.value }));

  // ── Login ──────────────────────────────────────────────────
  async function handleLogin() {
    setError(""); setErrorCode(null); setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/affilie/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();

      if (!res.ok) {
        // FIX : le backend retourne { success, error, code, member_id, plan, membership_fee }
        // directement à la racine (pas dans data.error_data)
        const code = data.code || null;
        setErrorCode(code);
        if (code === "PAYMENT_REQUIRED") {
          setErrorMemberId(data.member_id || null);
          setErrorPlan(data.plan || null);
          setErrorFee(data.membership_fee || null);
        }
        setError(data.error || "Erreur de connexion");
        return;
      }

      // FIX : le backend retourne { success, token, member, ... } à la racine
      // (pas wrappé dans data.data)
     // Remplace tes lignes 137-138 par ceci :
if (data.token && data.member) {
    localStorage.setItem("affilie_token", data.token);
    localStorage.setItem("affilie_member", JSON.stringify(data.member));
    navigate("/affilie/dashboard");
} else {
    setError("Erreur : Le serveur n'a pas renvoyé toutes les données utilisateur.");
}
    // Ligne 140 à remplacer :
    } catch (e) {
      console.error("[handleLogin] erreur détaillée:", e);
      // On affiche l'erreur réelle pour savoir si c'est le réseau ou ton code JS
      setError(`Erreur : ${e.message}`); 
    } finally {
      setLoading(false);
    }
  }

  // ── Relancer le paiement CinetPay ─────────────────────────
  async function handleRetryPayment() {
    if (!errorMemberId) return;
    setPayLoading(true);
    try {
      const res = await fetch(`${BASE}/api/affilie/payments/initiate-adhesion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: errorMemberId }),
      });
      const data = await res.json();
      // FIX : payment_url à la racine (pas dans data.data)
      if (!res.ok || !data.payment_url) {
        setError("Impossible d'initier le paiement. Contactez le support.");
        return;
      }
      window.location.href = data.payment_url;
    } catch {
      setError("Erreur réseau");
    } finally {
      setPayLoading(false);
    }
  }

  // ── Register Directrice ────────────────────────────────────
  async function handleRegister() {
    setError(""); setSuccess(""); setLoading(true);

    if (!regForm.name || !regForm.email || !regForm.password)
      { setError("Tous les champs obligatoires doivent être remplis"); setLoading(false); return; }
    if (regForm.password.length < 6)
      { setError("Mot de passe trop court (6 caractères minimum)"); setLoading(false); return; }
    if (regForm.password !== regForm.confirmPassword)
      { setError("Les mots de passe ne correspondent pas"); setLoading(false); return; }

    try {
      const res = await fetch(`${BASE}/api/affilie/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    regForm.name.trim(),
          email:   regForm.email.trim(),
          phone:   regForm.phone.trim(),
          country: regForm.country,
          city:    regForm.city.trim(),
          password: regForm.password,
          plan:    regForm.plan,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        return;
      }

      setSuccess("✅ Compte créé avec succès ! Un administrateur va valider votre compte, vous serez notifié(e) par email.");
      setTab("login");
      setRegForm({ name: "", email: "", phone: "", password: "", confirmPassword: "", country: "Côte d'Ivoire", city: "", plan: "ESSENTIELLE" });
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  // ── Rendu ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.primaryL} 0%, #fff 60%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: `2px solid ${C.primary}22`, borderRadius: 14, padding: "10px 22px", marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>💜</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: C.dark }}>Awoundjô</p>
              <p style={{ margin: 0, fontSize: 12, color: C.primary, fontWeight: 700 }}>Réseau Affilié</p>
            </div>
          </div>
          <p style={{ color: C.slate, fontSize: 13, margin: 0 }}>
            Directrice → Leader → Superviseur → Recruteur
          </p>
        </div>

        {/* Résultat paiement CinetPay */}
        {paymentResult === "success" && (
          <div style={{ marginBottom: 16 }}>
            <Alert type="success">✅ Paiement confirmé ! Votre compte est maintenant en attente de validation admin.</Alert>
          </div>
        )}
        {paymentResult === "failed" && (
          <div style={{ marginBottom: 16 }}>
            <Alert type="error">❌ Paiement échoué ou annulé. Vous pouvez réessayer ci-dessous.</Alert>
          </div>
        )}

        {/* Succès inscription */}
        {success && (
          <div style={{ marginBottom: 16 }}>
            <Alert type="success">{success}</Alert>
          </div>
        )}

        {/* Carte principale */}
        <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,.07)", padding: 28 }}>

          {/* Onglets */}
          <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
            {[["login", "🔐 Connexion"], ["register", "✨ Créer un compte"]].map(([key, label]) => (
              <button key={key} onClick={() => { setTab(key); setError(""); setSuccess(""); }} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? C.primary : C.slate,
                boxShadow: tab === key ? "0 2px 8px rgba(0,0,0,.08)" : "none",
                transition: "all .2s",
              }}>{label}</button>
            ))}
          </div>

          {/* ── TAB LOGIN ── */}
          {tab === "login" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InputField label="Email ou nom d'utilisateur" placeholder="votre@email.com" required
                value={loginForm.email} onChange={inp("email", loginForm, setLoginForm)} />
              <InputField label="Mot de passe" type="password" placeholder="••••••••" required
                value={loginForm.password} onChange={inp("password", loginForm, setLoginForm)} />

              {/* Erreurs spéciales */}
              {errorCode === "PAYMENT_REQUIRED" && (
                <Alert type="warning">
                  <p style={{ margin: "0 0 8px" }}>💳 Paiement requis — votre compte est créé mais l'adhésion n'a pas encore été réglée.</p>
                  {errorFee && <p style={{ margin: "0 0 10px", fontSize: 12 }}>Montant : {Number(errorFee).toLocaleString("fr-FR")} FCFA — Plan {errorPlan}</p>}
                  <Btn onClick={handleRetryPayment} disabled={payLoading} color={C.gold} full={false}>
                    {payLoading ? "Chargement..." : "💳 Finaliser le paiement"}
                  </Btn>
                </Alert>
              )}
              {errorCode === "PENDING_VALIDATION" && (
                <Alert type="warning">⏳ Votre compte est en attente de validation par un administrateur. Vous serez notifié(e) dès son activation.</Alert>
              )}
              {errorCode === "ACCOUNT_REJECTED" && (
                <Alert type="error">❌ Votre compte a été refusé. Contactez le support Awoundjô.</Alert>
              )}
              {error && !errorCode && <Alert type="error">{error}</Alert>}

              <Btn onClick={handleLogin} disabled={loading} color={C.primary}>
                {loading ? "Connexion..." : "Se connecter"}
              </Btn>

              <p style={{ textAlign: "center", fontSize: 13, color: C.slate, margin: 0 }}>
                Vous êtes une nouvelle Directrice ?{" "}
                <span style={{ color: C.primary, cursor: "pointer", fontWeight: 700 }}
                  onClick={() => { setTab("register"); setError(""); }}>
                  Créer un compte
                </span>
              </p>
            </div>
          )}

          {/* ── TAB REGISTER (Directrice uniquement) ── */}
          {tab === "register" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Badge informatif */}
              <div style={{ background: C.primaryL, border: `1.5px solid ${C.primary}33`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18 }}>👑</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: C.primary }}>Inscription Directrice</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
                    En tant que Directrice, vous êtes au sommet de votre réseau affilié. Vous créerez vous-même vos Leaders.
                  </p>
                </div>
              </div>

              <InputField label="Nom complet" placeholder="Prénom Nom" required
                value={regForm.name} onChange={inp("name", regForm, setRegForm)} />
              <InputField label="Email" type="email" placeholder="votre@email.com" required
                value={regForm.email} onChange={inp("email", regForm, setRegForm)} />
              <InputField label="Téléphone" type="tel" placeholder="+225 07 XX XX XX XX"
                value={regForm.phone} onChange={inp("phone", regForm, setRegForm)} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <InputField label="Pays" as="select" required value={regForm.country} onChange={inp("country", regForm, setRegForm)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </InputField>
                <InputField label="Ville" placeholder="Abidjan"
                  value={regForm.city} onChange={inp("city", regForm, setRegForm)} />
              </div>

              {/* Choix du plan */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>
                  Plan d'adhésion <span style={{ color: C.red }}>*</span>
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PLANS.map(p => (
                    <div key={p.value} onClick={() => setRegForm(prev => ({ ...prev, plan: p.value }))}
                      style={{
                        border: `2px solid ${regForm.plan === p.value ? C.primary : C.border}`,
                        background: regForm.plan === p.value ? C.primaryL : "#fff",
                        borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 10, transition: "all .2s",
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        border: `2px solid ${regForm.plan === p.value ? C.primary : C.border}`,
                        background: regForm.plan === p.value ? C.primary : "#fff",
                        flexShrink: 0, transition: "all .2s",
                      }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.dark }}>{p.label}</p>
                        <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <InputField label="Mot de passe" type="password" placeholder="••••••••" required
                value={regForm.password} onChange={inp("password", regForm, setRegForm)} />
              <InputField label="Confirmer le mot de passe" type="password" placeholder="••••••••" required
                value={regForm.confirmPassword} onChange={inp("confirmPassword", regForm, setRegForm)} />

              {error && <Alert type="error">{error}</Alert>}

              {/* Info workflow */}
              <div style={{ background: C.goldL, border: `1px solid ${C.gold}44`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.gold, fontWeight: 600 }}>
                ℹ️ Après inscription, un administrateur validera votre compte. Vous recevrez ensuite un lien de paiement pour finaliser votre adhésion.
              </div>

              <Btn onClick={handleRegister} disabled={loading} color={C.primary}>
                {loading ? "Création en cours..." : "✨ Créer mon compte Directrice"}
              </Btn>

              <p style={{ textAlign: "center", fontSize: 13, color: C.slate, margin: 0 }}>
                Déjà un compte ?{" "}
                <span style={{ color: C.primary, cursor: "pointer", fontWeight: 700 }}
                  onClick={() => { setTab("login"); setError(""); }}>
                  Se connecter
                </span>
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: C.slate, marginTop: 16 }}>
          Awoundjô — Mutuelle de santé &nbsp;·&nbsp; Réseau Affilié
        </p>
      </div>
    </div>
  );
}
