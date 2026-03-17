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

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await clientAuthAPI.login({ mutual_number: mutual_number.toUpperCase(), password });
      localStorage.setItem("client_token", res.data.token);
      localStorage.setItem("client_data",  JSON.stringify(res.data.client));
      navigate("/client/dashboard");
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
      navigate("/client/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur d'activation");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoBox}><span style={s.logoLetter}>A</span></div>
          <h1 style={s.appName}>Awoundjô</h1>
          <p style={s.appSub}>Mutuelle Santé · Côte d'Ivoire</p>
        </div>

        {step === "login" ? (
          <>
            <h2 style={s.title}>Espace Adhérent</h2>
            <p style={s.sub}>Connectez-vous à votre espace personnel</p>
            {error && <div style={s.err}>⚠️ {error}</div>}
            <form onSubmit={handleLogin} style={s.form}>
              <Field label="Numéro Mutualiste">
                <input type="text" placeholder="AWJ-2026-00001"
                  value={mutual_number} onChange={e => setMN(e.target.value.toUpperCase())}
                  required style={s.input} />
              </Field>
              <Field label="Mot de passe">
                <div style={{ position: "relative" }}>
                  <input type={showPwd ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={e => setPwd(e.target.value)}
                    required style={{ ...s.input, paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={s.eye}>
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </Field>
              <button type="submit" disabled={loading} style={s.btn}>
                {loading ? "⏳ Connexion..." : "Se connecter"}
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
            {error && <div style={s.err}>⚠️ {error}</div>}
            <form onSubmit={handleSetup} style={s.form}>
              <Field label="Numéro Mutualiste">
                <input type="text" placeholder="AWJ-2026-00001"
                  value={mutual_number} onChange={e => setMN(e.target.value.toUpperCase())}
                  required style={s.input} />
              </Field>
              <Field label="Code d'accès temporaire">
                <input type="text" placeholder="Code reçu de votre agent"
                  value={access_code} onChange={e => setCode(e.target.value)}
                  required style={s.input} />
              </Field>
              <Field label="Nouveau mot de passe">
                <input type="password" placeholder="Minimum 6 caractères"
                  value={new_pwd} onChange={e => setNewPwd(e.target.value)}
                  required style={s.input} />
              </Field>
              <Field label="Confirmer le mot de passe">
                <input type="password" placeholder="Répétez le mot de passe"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  required style={s.input} />
              </Field>
              <button type="submit" disabled={loading} style={s.btn}>
                {loading ? "⏳ Activation..." : "Activer mon compte"}
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
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", background: "linear-gradient(135deg,#1a56db 0%,#1e3a8a 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden", fontFamily: "'Poppins',sans-serif" },
  blob1:     { position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" },
  blob2:     { position: "absolute", bottom: -150, left: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" },
  card:      { background: "#fff", borderRadius: 24, padding: "40px 32px", width: "100%", maxWidth: 420, boxShadow: "0 25px 60px rgba(0,0,0,.25)", position: "relative", zIndex: 1 },
  logoWrap:  { textAlign: "center", marginBottom: 28 },
  logoBox:   { width: 64, height: 64, background: "linear-gradient(135deg,#1a56db,#1e40af)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 8px 20px rgba(26,86,219,.35)" },
  logoLetter:{ color: "#fff", fontSize: 28, fontWeight: 800 },
  appName:   { fontSize: 22, fontWeight: 700, color: "#1e3a8a", margin: "0 0 4px" },
  appSub:    { fontSize: 13, color: "#6B7280", margin: 0 },
  title:     { fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" },
  sub:       { fontSize: 13, color: "#6B7280", margin: "0 0 20px" },
  err:       { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", color: "#DC2626", fontSize: 14, marginBottom: 16 },
  form:      { display: "flex", flexDirection: "column", gap: 16 },
  input:     { border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#111827", outline: "none", fontFamily: "'Poppins',sans-serif", width: "100%", boxSizing: "border-box" },
  eye:       { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18 },
  btn:       { background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 15px rgba(26,86,219,.35)" },
  link:      { background: "none", border: "none", color: "#1a56db", fontSize: 13, cursor: "pointer", textAlign: "center", fontFamily: "'Poppins',sans-serif", textDecoration: "underline" },
  footer:    { textAlign: "center", color: "#9CA3AF", fontSize: 12, marginTop: 24, marginBottom: 0 },
};
