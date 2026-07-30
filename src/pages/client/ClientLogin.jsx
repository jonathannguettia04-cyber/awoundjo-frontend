// src/pages/client/ClientLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientAuthAPI } from "../../clientApi";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [step, setStep]         = useState("login");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPwd, setShowPwd]   = useState(false);

  const [mutual_number, setMN]  = useState("");
  const [password, setPwd]      = useState("");
  const [access_code, setCode]  = useState("");
  const [new_pwd, setNewPwd]    = useState("");
  const [confirm, setConfirm]   = useState("");

  // Après connexion : si d'autres portails sont déjà ouverts → hub de sélection
  const redirectAfterLogin = () => {
    const autres = ["business_token", "diaspora_token", "affilie_token", "cnepeci_token"]
      .some(k => { try { return !!localStorage.getItem(k); } catch { return false; } });
    navigate(autres ? "/portail" : "/client/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await clientAuthAPI.login({ mutual_number: mutual_number.toUpperCase(), password });
      localStorage.setItem("client_token", res.data.token);
      localStorage.setItem("client_data",  JSON.stringify(res.data.client));
      redirectAfterLogin();
    } catch (err) {
      if (err.response?.data?.requiresSetup) setStep("setup");
      else setError(err.response?.data?.error || "Identifiants incorrects");
    } finally { setLoading(false); }
  };

  const handleSetup = async (e) => {
    e.preventDefault(); setError("");
    if (new_pwd !== confirm) return setError("Les mots de passe ne correspondent pas");
    if (new_pwd.length < 6)  return setError("Minimum 6 caractères");
    setLoading(true);
    try {
      const res = await clientAuthAPI.setupPassword({ mutual_number: mutual_number.toUpperCase(), access_code, new_password: new_pwd });
      localStorage.setItem("client_token", res.data.token);
      localStorage.setItem("client_data",  JSON.stringify(res.data.client));
      redirectAfterLogin();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur d'activation");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <img
            src="/logo-awoundjjo.jpg"
            alt="Awoundjô"
            style={s.logo}
          />
          <h1 style={s.appName}>Awoundjô</h1>
          <p style={s.appSub}>Mutuelle santé · Côte d'Ivoire</p>
        </div>

        <div style={s.divider} />

        {step === "login" ? (
          <>
            <h2 style={s.title}>Espace adhérent</h2>
            <p style={s.sub}>Connectez-vous à votre espace personnel</p>
            {error && (
              <div style={s.err}>
                <ErrorIcon />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleLogin} style={s.form}>
              <Field label="Numéro mutualiste">
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><IdIcon /></span>
                  <input type="text" placeholder="AWJ-2026-00001"
                    value={mutual_number} onChange={e => setMN(e.target.value.toUpperCase())}
                    required style={{ ...s.input, paddingLeft: 40 }} />
                </div>
              </Field>
              <Field label="Mot de passe">
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><LockIcon /></span>
                  <input type={showPwd ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={e => setPwd(e.target.value)}
                    required style={{ ...s.input, paddingLeft: 40, paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={s.eye}
                    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                    {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </Field>
              <button type="submit" disabled={loading} style={s.btn}>
                {loading ? "Connexion…" : "Se connecter"}
              </button>
              <button type="button" onClick={() => { setStep("setup"); setError(""); }} style={s.link}>
                Première connexion ? Activer mon compte
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 style={s.title}>Activer mon compte</h2>
            <p style={s.sub}>Utilisez le code reçu de votre agent</p>
            {error && (
              <div style={s.err}>
                <ErrorIcon />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSetup} style={s.form}>
              <Field label="Numéro mutualiste">
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><IdIcon /></span>
                  <input type="text" placeholder="AWJ-2026-00001"
                    value={mutual_number} onChange={e => setMN(e.target.value.toUpperCase())}
                    required style={{ ...s.input, paddingLeft: 40 }} />
                </div>
              </Field>
              <Field label="Code d'accès temporaire">
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><KeyIcon /></span>
                  <input type="text" placeholder="Code reçu de votre agent"
                    value={access_code} onChange={e => setCode(e.target.value)}
                    required style={{ ...s.input, paddingLeft: 40 }} />
                </div>
              </Field>
              <Field label="Nouveau mot de passe">
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><LockIcon /></span>
                  <input type="password" placeholder="Minimum 6 caractères"
                    value={new_pwd} onChange={e => setNewPwd(e.target.value)}
                    required style={{ ...s.input, paddingLeft: 40 }} />
                </div>
              </Field>
              <Field label="Confirmer le mot de passe">
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><LockIcon /></span>
                  <input type="password" placeholder="Répétez le mot de passe"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    required style={{ ...s.input, paddingLeft: 40 }} />
                </div>
              </Field>
              <button type="submit" disabled={loading} style={s.btn}>
                {loading ? "Activation…" : "Activer mon compte"}
              </button>
              <button type="button" onClick={() => { setStep("login"); setError(""); }} style={s.link}>
                ← Retour à la connexion
              </button>
            </form>
          </>
        )}
        <p style={s.footer}>© 2026 Awoundjô · Tous droits réservés</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>{label}</label>
      {children}
    </div>
  );
}

/* ---- Icons (inline SVG, no extra dependency) ---- */
const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

function IdIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 10h4M14 14h4" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.5 12.5 19 4l3 3M17 6l2 2" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const s = {
  page:     { minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Poppins',sans-serif" },
  card:     { background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 400, border: "1px solid #EEF0F3", boxShadow: "0 1px 3px rgba(0,0,0,.04)" },
  logoWrap: { textAlign: "center" },
  logo:     { width: 56, height: 56, borderRadius: 16, objectFit: "contain", margin: "0 auto 12px", display: "block", border: "1px solid #EEF0F3" },
  appName:  { fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 2px" },
  appSub:   { fontSize: 12, color: "#9CA3AF", margin: 0 },
  divider:  { borderTop: "1px solid #F1F2F4", margin: "24px 0" },
  title:    { fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 4px" },
  sub:      { fontSize: 13, color: "#6B7280", margin: "0 0 20px" },
  err:      { display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 16 },
  form:     { display: "flex", flexDirection: "column", gap: 16 },
  inputWrap:{ position: "relative" },
  inputIcon:{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", display: "flex" },
  input:    { border: "1px solid #E5E7EB", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#111827", outline: "none", fontFamily: "'Poppins',sans-serif", width: "100%", boxSizing: "border-box", transition: "border-color .15s" },
  eye:      { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 0 },
  btn:      { background: "#1a56db", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
  link:     { background: "none", border: "none", color: "#1a56db", fontSize: 13, cursor: "pointer", textAlign: "center", fontFamily: "'Poppins',sans-serif" },
  footer:   { textAlign: "center", color: "#9CA3AF", fontSize: 12, marginTop: 24, marginBottom: 0 },
};
