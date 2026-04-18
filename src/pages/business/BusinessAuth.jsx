// src/pages/business/BusinessAuth.jsx
// ─────────────────────────────────────────────────────────────
//  Portail d'authentification dédié — Réseau Business Awoundjô
//  Routes : /business/login  |  /business/register
//
//  CORRECTIONS :
//  - 100% indépendant de DiasporaAuth
//  - Stocke dans business_token + business_data uniquement
//  - Gère les codes d'erreur backend : PAYMENT_REQUIRED /
//    PENDING_VALIDATION / ACCOUNT_REJECTED
//  - Login : accepte email OU username (le backend fait OR)
//  - Register : role DIRECTRICE auto, invitation_code optionnel
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const COUNTRIES = [
  "Côte d'Ivoire","France","Belgique","Suisse","Canada","États-Unis",
  "Royaume-Uni","Italie","Espagne","Allemagne","Pays-Bas","Portugal",
  "Maroc","Sénégal","Ghana","Gabon","Congo","Cameroun","Togo","Bénin",
  "Burkina Faso","Mali","Guinée","Autre",
];

function safeLS(method, ...args) {
  try { return localStorage[method](...args); } catch { return null; }
}

function Spinner({ size = 16 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid rgba(255,255,255,.3)",
      borderTop: "2px solid #fff",
      borderRadius: "50%", animation: "biz-auth-spin .7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

export default function BusinessAuth() {
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const refCode    = params.get("ref") || "";

  const [tab,           setTab]           = useState(refCode ? "register" : "login");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [errorCode,     setErrorCode]     = useState(null);
  const [errorMemberId, setErrorMemberId] = useState(null);
  const [successMsg,    setSuccessMsg]    = useState("");
  const [payLoading,    setPayLoading]    = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm,   setRegForm]   = useState({
    name: "", country: "Côte d'Ivoire", phone: "",
    email: "", password: "", invitation_code: refCode,
  });

  // Retour CinetPay
  useEffect(() => {
    const result = params.get("payment");
    if (result === "success") {
      setSuccessMsg("✅ Paiement reçu ! Un administrateur validera votre compte sous 24–48h.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (result === "failed") {
      setError("Le paiement n'a pas abouti. Reconnectez-vous pour réessayer.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  function resetState() {
    setError(""); setErrorCode(null); setSuccessMsg(""); setErrorMemberId(null);
  }

  // ── LOGIN ───────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    resetState();
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/business/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(loginForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const code   = data?.data?.code || data?.code || null;
        const status = res.status;

        if (status === 402 || code === "PAYMENT_REQUIRED") {
          setErrorCode("PAYMENT_REQUIRED");
          setErrorMemberId(data?.data?.member_id || null);
          setError("Votre paiement d'adhésion n'a pas été reçu. Finalisez-le pour activer votre compte.");
        } else if (code === "PENDING_VALIDATION") {
          setErrorCode("PENDING_VALIDATION");
          setError("Votre compte est en attente de validation. Vous serez contacté(e) sous 24–48h.");
        } else if (code === "ACCOUNT_REJECTED") {
          setErrorCode("ACCOUNT_REJECTED");
          setError("Votre compte a été refusé. Contactez l'équipe Awoundjô.");
        } else {
          setError(data?.error || "Identifiants incorrects");
        }
        return;
      }

      safeLS("setItem", "business_token", data.token);
      safeLS("setItem", "business_data",  JSON.stringify(data.member));
      safeLS("removeItem", "token");
      safeLS("removeItem", "user");
      // must_change_password géré depuis le dashboard (route change-password non définie)
      navigate("/business/dashboard");
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  // ── REGISTER ─────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    resetState();
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/business/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:            regForm.name,
          email:           regForm.email,
          password:        regForm.password,
          phone:           regForm.phone           || undefined,
          country:         regForm.country         || undefined,
          invitation_code: regForm.invitation_code || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data?.error || data?.message || "Erreur d'inscription");

      setTab("login");
      setSuccessMsg("🎉 Compte créé ! Connectez-vous avec vos identifiants.");
    } catch (err) {
      setError(err.message || "Erreur d'inscription. Vérifiez vos informations.");
    } finally {
      setLoading(false);
    }
  }

  // ── Relance paiement ─────────────────────────────────────────
  async function handleRetryPayment() {
    if (!errorMemberId) { setError("Identifiant membre manquant. Contactez le support."); return; }
    setPayLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE}/api/payments/cinetpay/retry-adhesion`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          member_id:  errorMemberId,
          return_url: `${window.location.origin}/business/login?payment=success`,
          cancel_url: `${window.location.origin}/business/login?payment=failed`,
        }),
      });
      const data = await res.json();
      const url  = data?.data?.payment_url || data?.payment_url;
      if (!url) throw new Error(data?.error || "URL de paiement non reçue");
      window.location.href = url;
    } catch (err) {
      setError("Impossible de lancer le paiement : " + (err.message || "Erreur inconnue"));
      setPayLoading(false);
    }
  }

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a1628 0%, #0d2137 45%, #081420 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes biz-auth-spin { to { transform: rotate(360deg); } }
        @keyframes biz-auth-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .biz-auth-input {
          width: 100%; background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
          padding: 12px 14px; color: #fff; font-size: 14px; outline: none;
          box-sizing: border-box; font-family: inherit; transition: border-color .2s, background .2s;
        }
        .biz-auth-input:focus { border-color: rgba(16,185,129,.5); background: rgba(255,255,255,.09); }
        .biz-auth-input::placeholder { color: rgba(255,255,255,.25); }
        .biz-auth-input option { background: #0d2137; color:#fff; }
      `}</style>

      {/* Halos */}
      <div style={{ position:"absolute", top:-180, right:-120, width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle, rgba(16,185,129,.1), transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-140, left:-100, width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle, rgba(5,150,105,.08), transparent 70%)", pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{
          width:52, height:52, borderRadius:16,
          background:"linear-gradient(135deg,#059669,#047857)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:24, boxShadow:"0 8px 24px rgba(5,150,105,.4)",
        }}>💼</div>
        <div>
          <div style={{ color:"#fff", fontSize:22, fontWeight:900, letterSpacing:-.5 }}>
            Awoundjô <span style={{ color:"#34D399" }}>Business</span>
          </div>
          <div style={{ color:"rgba(255,255,255,.4)", fontSize:12, marginTop:2 }}>
            Directrice · Leader · Superviseur · Recruteur
          </div>
        </div>
      </div>

      {/* Carte */}
      <div style={{
        background:"rgba(255,255,255,.04)", backdropFilter:"blur(24px)",
        border:"1px solid rgba(255,255,255,.09)", borderRadius:24,
        padding:"32px 28px", width:"100%", maxWidth:460,
        animation:"biz-auth-in .4s ease",
      }}>

        {/* Tabs */}
        <div style={{ display:"flex", background:"rgba(255,255,255,.05)", borderRadius:14, padding:4, marginBottom:24, gap:4 }}>
          {[{ id:"login", label:"🔑 Connexion" },{ id:"register", label:"✨ Créer un compte" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); resetState(); }} style={{
              flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
              fontSize:13, fontWeight:700, fontFamily:"inherit", transition:"all .25s",
              background: tab===t.id ? "linear-gradient(135deg,#059669,#047857)" : "transparent",
              color:      tab===t.id ? "#fff" : "rgba(255,255,255,.45)",
              boxShadow:  tab===t.id ? "0 4px 14px rgba(5,150,105,.4)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Succès */}
        {successMsg && (
          <div style={{ background:"rgba(5,150,105,.15)", border:"1px solid rgba(5,150,105,.35)", borderRadius:12, padding:"12px 14px", marginBottom:16, color:"#6EE7B7", fontSize:13, fontWeight:600 }}>
            {successMsg}
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{
            background: errorCode==="PENDING_VALIDATION" ? "rgba(217,119,6,.12)" : "rgba(239,68,68,.12)",
            border:`1px solid ${errorCode==="PENDING_VALIDATION" ? "rgba(217,119,6,.35)" : "rgba(239,68,68,.3)"}`,
            borderRadius:12, padding:"12px 14px",
            color: errorCode==="PENDING_VALIDATION" ? "#FDE68A" : "#FCA5A5",
            fontSize:13, marginBottom:12,
          }}>
            {error}
          </div>
        )}

        {/* Bouton relance paiement */}
        {errorCode==="PAYMENT_REQUIRED" && (
          <button onClick={handleRetryPayment} disabled={payLoading} style={{
            width:"100%", padding:"13px 0", marginBottom:16, borderRadius:12, border:"none",
            background: payLoading ? "#374151" : "linear-gradient(135deg,#0072C6,#005A9E)",
            color:"#fff", fontWeight:800, fontSize:14, cursor: payLoading?"not-allowed":"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"inherit",
            boxShadow: payLoading ? "none" : "0 4px 16px rgba(0,114,198,.4)",
          }}>
            {payLoading ? <><Spinner />Redirection CinetPay…</> : <>💳 Finaliser le paiement — 15 000 FCFA</>}
          </button>
        )}

        {/* Attente validation */}
        {errorCode==="PENDING_VALIDATION" && (
          <div style={{ background:"rgba(217,119,6,.08)", border:"1px solid rgba(217,119,6,.25)", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:"rgba(255,255,255,.6)" }}>
            ⏳ Votre dossier est examiné. Vous serez contacté(e) par WhatsApp ou email.
          </div>
        )}

        {/* ════ LOGIN ════ */}
        {tab==="login" && (
          <>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 4px" }}>Bon retour 👋</h2>
            <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, margin:"0 0 18px" }}>
              Accédez à votre espace Business
            </p>
            <div style={{ background:"rgba(16,185,129,.08)", border:"1px solid rgba(16,185,129,.2)", borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.5 }}>
              💡 <strong style={{ color:"rgba(255,255,255,.8)" }}>Leaders, Superviseurs, Recruteurs</strong> — utilisez le <em>username</em> et le mot de passe temporaire transmis par votre supérieur.
            </div>
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { key:"email",    label:"Email ou nom d'utilisateur", type:"text",     placeholder:"votre@email.com ou username" },
                { key:"password", label:"Mot de passe",               type:"password", placeholder:"••••••••" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", marginBottom:6, textTransform:"uppercase", letterSpacing:.9 }}>{f.label}</label>
                  <input className="biz-auth-input" required type={f.type} placeholder={f.placeholder}
                    value={loginForm[f.key]}
                    onChange={e => setLoginForm({ ...loginForm, [f.key]: e.target.value })} />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{
                width:"100%", padding:14, marginTop:4,
                background: loading ? "#374151" : "linear-gradient(135deg,#059669,#047857)",
                color:"#fff", border:"none", borderRadius:14,
                fontSize:15, fontWeight:800, cursor:loading?"not-allowed":"pointer",
                fontFamily:"inherit", boxShadow:loading?"none":"0 6px 20px rgba(5,150,105,.4)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?.75:1,
              }}>
                {loading ? <><Spinner />Connexion…</> : "Se connecter →"}
              </button>
            </form>
          </>
        )}

        {/* ════ REGISTER ════ */}
        {tab==="register" && (
          <>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 4px" }}>Créer votre réseau 💼</h2>
            <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, margin:"0 0 6px" }}>
              Inscription ouverte aux <strong style={{ color:"#34D399" }}>Directrices</strong>
            </p>

            {/* Hiérarchie */}
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
              {["DIRECTRICE","LEADER","SUPERVISEUR","RECRUTEUR"].map((r, i) => (
                <div key={r} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{
                    background: i===0 ? "rgba(52,211,153,.2)" : "rgba(255,255,255,.07)",
                    border:`1px solid ${i===0?"rgba(52,211,153,.4)":"rgba(255,255,255,.1)"}`,
                    borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700,
                    color: i===0 ? "#34D399" : "rgba(255,255,255,.45)",
                  }}>{r}</span>
                  {i<3 && <span style={{ color:"rgba(255,255,255,.2)", fontSize:12 }}>→</span>}
                </div>
              ))}
            </div>

            <div style={{ background:"rgba(16,185,129,.08)", border:"1px solid rgba(16,185,129,.2)", borderRadius:12, padding:"10px 14px", marginBottom:18, fontSize:12, color:"rgba(255,255,255,.65)", lineHeight:1.5 }}>
              ✅ <strong style={{ color:"rgba(255,255,255,.85)" }}>Inscription instantanée.</strong> Votre compte Directrice est activé immédiatement. Créez votre équipe depuis le dashboard.
            </div>

            {refCode && (
              <div style={{ background:"rgba(0,188,212,.1)", border:"1px solid rgba(0,188,212,.25)", borderRadius:12, padding:"10px 14px", marginBottom:16, fontSize:12, color:"rgba(255,255,255,.7)" }}>
                🎁 Code d'invitation : <strong style={{ color:"#34D399" }}>{refCode}</strong>
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { key:"name",     label:"Nom complet *",  type:"text",     placeholder:"Marie Kouassi",           required:true  },
                { key:"email",    label:"Email *",         type:"email",    placeholder:"marie@email.com",          required:true  },
                { key:"phone",    label:"Téléphone",       type:"tel",      placeholder:"+225 07 00 00 00 00",      required:false },
                { key:"password", label:"Mot de passe *",  type:"password", placeholder:"Min. 6 caractères",       required:true  },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", marginBottom:6, textTransform:"uppercase", letterSpacing:.9 }}>{f.label}</label>
                  <input className="biz-auth-input" required={f.required} type={f.type} placeholder={f.placeholder}
                    value={regForm[f.key]}
                    onChange={e => setRegForm({ ...regForm, [f.key]: e.target.value })} />
                </div>
              ))}

              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", marginBottom:6, textTransform:"uppercase", letterSpacing:.9 }}>Pays de résidence *</label>
                <select className="biz-auth-input" required value={regForm.country}
                  onChange={e => setRegForm({ ...regForm, country: e.target.value })}
                  style={{ background:"rgba(13,33,55,.9)" }}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", marginBottom:6, textTransform:"uppercase", letterSpacing:.9 }}>Code d'invitation (optionnel)</label>
                <input className="biz-auth-input" type="text" value={regForm.invitation_code}
                  onChange={e => setRegForm({ ...regForm, invitation_code: e.target.value })}
                  placeholder="AWB-XXXXX — laissez vide pour créer votre propre réseau"
                  style={{ color:regForm.invitation_code?"#34D399":undefined, fontWeight:regForm.invitation_code?700:400 }} />
              </div>

              <button type="submit" disabled={loading} style={{
                width:"100%", padding:14, marginTop:4,
                background: loading ? "#374151" : "linear-gradient(135deg,#059669,#047857)",
                color:"#fff", border:"none", borderRadius:14,
                fontSize:15, fontWeight:800, cursor:loading?"not-allowed":"pointer",
                fontFamily:"inherit", boxShadow:loading?"none":"0 6px 20px rgba(5,150,105,.4)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?.75:1,
              }}>
                {loading ? <><Spinner />Création du compte…</> : "Créer mon compte Directrice →"}
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{ color:"rgba(255,255,255,.2)", fontSize:11, marginTop:24, textAlign:"center" }}>
        © {new Date().getFullYear()} Mutuelle Santé Awoundjô — Côte d'Ivoire<br />
        🔒 Connexion sécurisée · Données chiffrées
      </p>
    </div>
  );
}
