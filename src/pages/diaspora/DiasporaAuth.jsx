// src/pages/diaspora/DiasporaAuth.jsx
// ─────────────────────────────────────────────────────────────
//  Portail d'authentification unifié Awoundjô
//  Réseaux : DIASPORA | REFERRAL (RUM/Leader/Pasteur/Responsable)
//
//  MODIFICATIONS (FIX) :
//  1. handleLogin() gère les 3 codes d'erreur backend :
//       PAYMENT_REQUIRED  → bouton "Finaliser le paiement"
//       PENDING_VALIDATION → bandeau orange "En attente admin"
//       ACCOUNT_REJECTED   → message rouge définitif
//  2. handleRetryPayment() : relance CinetPay sans token
//     via POST /api/payments/cinetpay/retry-adhesion
//  3. handleRegister() : après inscription, redirige vers login
//     (le compte n'est pas encore payé donc pas de token valide
//      pour accéder au dashboard)
//  4. URL ?payment=success|failed gérée au retour de CinetPay
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { diasporaAuthAPI, diasporaLogin } from "../../diasporaApi";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const COUNTRIES = [
  "France","Belgique","Suisse","Canada","États-Unis","Royaume-Uni","Italie","Espagne",
  "Allemagne","Pays-Bas","Portugal","Maroc","Sénégal","Ghana","Gabon","Congo",
  "Cameroun","Togo","Bénin","Burkina Faso","Mali","Guinée","Côte d'Ivoire","Autre",
];

const SELF_REGISTER_ROLES = {
  DIASPORA: [
    { value: "AMBASSADEUR_DIASPORA", label: "🌍 Ambassadeur Diaspora", desc: "Sommet du réseau Diaspora" },
  ],
  REFERRAL: [
    { value: "RUM", label: "👑 RUM", desc: "Responsable Unifié de Mission" },
  ],
};

const NETWORK_CONFIG = {
  DIASPORA: {
    label: "Réseau Diaspora",
    icon:  "🌍",
    color: "#1B4FD8",
    light: "#EEF2FF",
    desc:  "Ambassadeur Diaspora → Pays → Recruteur → Client",
    dashPath: "/diaspora/dashboard",
  },
  REFERRAL: {
    label: "Réseau Parrainage",
    icon:  "⛪",
    color: "#7C3AED",
    light: "#F5F3FF",
    desc:  "RUM → Leader → Pasteur → Responsable → Client",
    dashPath: "/referral/dashboard",
  },
};

function getDashPath(ambassador) {
  if (!ambassador) return "/diaspora/login";
  return ambassador.network_type === "REFERRAL" ? "/referral/dashboard" : "/diaspora/dashboard";
}

export default function DiasporaAuth() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const refCode       = params.get("ref")     || "";
  const netParam      = params.get("network") || "DIASPORA";

  const [tab,     setTab]     = useState(refCode ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // FIX — états pour les codes d'erreur spéciaux
  const [errorCode,         setErrorCode]         = useState(null);  // PAYMENT_REQUIRED | PENDING_VALIDATION | ACCOUNT_REJECTED | null
  const [errorAmbassadorId, setErrorAmbassadorId] = useState(null);
  const [payLoading,        setPayLoading]         = useState(false);

  // FIX — retour CinetPay : ?payment=success ou ?payment=failed
  const [paymentResult, setPaymentResult] = useState(null); // "success" | "failed" | null

  useEffect(() => {
    const result = params.get("payment");
    if (result === "success" || result === "failed") {
      setPaymentResult(result);
      // Nettoyer l'URL sans recharger
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm,   setRegForm]   = useState({
    name:          "",
    country:       "Côte d'Ivoire",
    phone:         "",
    email:         "",
    password:      "",
    referral_code: refCode,
    network_type:  netParam in NETWORK_CONFIG ? netParam : "DIASPORA",
    role:          SELF_REGISTER_ROLES[netParam in NETWORK_CONFIG ? netParam : "DIASPORA"][0].value,
  });

  function handleNetworkChange(network) {
    const firstRole = SELF_REGISTER_ROLES[network][0].value;
    setRegForm(f => ({ ...f, network_type: network, role: firstRole }));
  }

  function resetErrorState() {
    setError("");
    setErrorCode(null);
    setErrorAmbassadorId(null);
  }

  // ── Connexion ─────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    resetErrorState();
    setLoading(true);
    try {
      const { data } = await diasporaAuthAPI.login(loginForm);
      diasporaLogin(data.token, data.ambassador);
      navigate(getDashPath(data.ambassador));
    } catch (err) {
      const response = err?.response;
      const body     = response?.data || {};
      // Le backend renvoie le code dans body.data.code (voir diasporaController)
      const code     = body?.data?.code || body?.code || null;
      const status   = response?.status;

      // FIX 1 — Paiement requis (HTTP 402)
      if (status === 402 || code === "PAYMENT_REQUIRED") {
        setErrorCode("PAYMENT_REQUIRED");
        setErrorAmbassadorId(body?.data?.ambassador_id || null);
        setError("Votre paiement d'adhésion n'a pas été reçu. Finalisez-le pour activer votre compte.");

      // FIX 2 — En attente validation admin
      } else if (code === "PENDING_VALIDATION") {
        setErrorCode("PENDING_VALIDATION");
        setError("Votre compte est en attente de validation par un administrateur. Vous serez contacté(e) dès son activation.");

      // FIX 3 — Compte rejeté
      } else if (code === "ACCOUNT_REJECTED") {
        setErrorCode("ACCOUNT_REJECTED");
        setError("Votre compte a été refusé. Contactez l'équipe Awoundjô pour plus d'informations.");

      } else {
        setError(body?.error || "Identifiants incorrects");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── FIX — Relance paiement depuis la page login (sans token) ──
  async function handleRetryPayment() {
    if (!errorAmbassadorId) {
      setError("Identifiant ambassadeur manquant. Contactez le support.");
      return;
    }
    setPayLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/payments/cinetpay/retry-adhesion`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambassador_id: errorAmbassadorId,
          return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
          cancel_url: `${window.location.origin}${window.location.pathname}?payment=failed`,
        }),
      });
      const data = await res.json();
      const url  = data?.data?.payment_url || data?.payment_url;
      if (!url) throw new Error(data?.error || "URL de paiement non reçue du serveur");
      window.location.href = url;
    } catch (e) {
      setError("Impossible de lancer le paiement : " + (e.message || "Erreur inconnue"));
      setPayLoading(false);
    }
  }

  // ── Inscription ───────────────────────────────────────────
  // FIX — Après inscription, on NE connecte PAS directement l'ambassadeur.
  // Le compte est créé (status_payment=unpaid, status_validation=pending).
  // On bascule sur l'onglet login avec un message d'info.
  async function handleRegister(e) {
    e.preventDefault();
    resetErrorState();
    setLoading(true);
    try {
      await diasporaAuthAPI.register(regForm);
      // Compte créé — l'utilisateur doit passer par le paiement AVANT de se connecter.
      // On bascule sur l'onglet login avec un message de succès.
      setTab("login");
      setError(""); // pas une erreur
      setPaymentResult("registered"); // message spécial "compte créé"
    } catch (err) {
      setError(err?.response?.data?.error || "Erreur d'inscription. Vérifiez vos informations.");
    } finally {
      setLoading(false);
    }
  }

  const net = NETWORK_CONFIG[regForm.network_type];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#0F2942 0%,#1a3a5c 60%,#0c2035 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 20,
      fontFamily: "'DM Sans',system-ui,sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        .unif-input {
          width: 100%; background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12); border-radius: 12px;
          padding: 12px 14px; color: #fff; font-size: 14px; outline: none;
          box-sizing: border-box; font-family: inherit; transition: border-color .2s;
        }
        .unif-input:focus { border-color: rgba(0,188,212,.5); }
        .unif-input option { background: #1a3a5c; color: #fff; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Blobs déco */}
      <div style={{ position:"absolute", top:-150, right:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,188,212,.12),transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-100, left:-100, width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,.1),transparent 70%)", pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <img src="/logo-awoundjjo.png" alt="Awoundjô" style={{ width:52, height:52, objectFit:"contain", borderRadius:14, background:"rgba(255,255,255,.1)", padding:6 }} />
        <div>
          <div style={{ color:"#fff", fontSize:22, fontWeight:900, letterSpacing:-.5 }}>Awoundjô</div>
          <div style={{ color:"rgba(255,255,255,.5)", fontSize:12, marginTop:1 }}>🌍 Portail Ambassadeurs</div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: "rgba(255,255,255,.04)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,.1)", borderRadius: 24,
        padding: "32px 28px", width: "100%", maxWidth: 480,
      }}>

        {/* Tabs */}
        <div style={{ display:"flex", background:"rgba(255,255,255,.06)", borderRadius:14, padding:4, marginBottom:24, gap:4 }}>
          {[{ id:"login", label:"🔑 Connexion" },{ id:"register", label:"✨ Créer un compte" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); resetErrorState(); setPaymentResult(null); }}
              style={{
                flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
                fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all .25s",
                background: tab===t.id ? "#00BCD4" : "transparent",
                color:      tab===t.id ? "#fff"    : "rgba(255,255,255,.55)",
                boxShadow:  tab===t.id ? "0 4px 12px rgba(0,188,212,.3)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* FIX — Bandeau retour paiement CinetPay */}
        {paymentResult === "success" && (
          <div style={{ background:"rgba(5,150,105,.2)", border:"1px solid rgba(5,150,105,.4)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>✅</span>
            <div>
              <p style={{ margin:0, color:"#6EE7B7", fontWeight:700, fontSize:13 }}>Paiement reçu !</p>
              <p style={{ margin:"3px 0 0", color:"rgba(255,255,255,.6)", fontSize:12 }}>
                Votre paiement a bien été enregistré. Un administrateur va valider votre compte sous 24–48h. Reconnectez-vous après validation.
              </p>
            </div>
          </div>
        )}

        {paymentResult === "failed" && (
          <div style={{ background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.35)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>❌</span>
            <div>
              <p style={{ margin:0, color:"#FCA5A5", fontWeight:700, fontSize:13 }}>Paiement annulé ou refusé</p>
              <p style={{ margin:"3px 0 0", color:"rgba(255,255,255,.55)", fontSize:12 }}>
                Le paiement CinetPay n'a pas abouti. Connectez-vous pour réessayer.
              </p>
            </div>
          </div>
        )}

        {/* FIX — Compte créé, pas encore payé */}
        {paymentResult === "registered" && tab === "login" && (
          <div style={{ background:"rgba(0,188,212,.12)", border:"1px solid rgba(0,188,212,.3)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>🎉</span>
            <div>
              <p style={{ margin:0, color:"#00BCD4", fontWeight:700, fontSize:13 }}>Compte créé avec succès !</p>
              <p style={{ margin:"3px 0 0", color:"rgba(255,255,255,.55)", fontSize:12 }}>
                Connectez-vous pour finaliser votre paiement d'adhésion (15 000 FCFA) et soumettre votre dossier à l'administrateur.
              </p>
            </div>
          </div>
        )}

        {/* Bloc erreur standard */}
        {error && (
          <div style={{
            background: errorCode === "PENDING_VALIDATION"
              ? "rgba(217,119,6,.15)"
              : "rgba(239,68,68,.15)",
            border: `1px solid ${errorCode === "PENDING_VALIDATION" ? "rgba(217,119,6,.35)" : "rgba(239,68,68,.3)"}`,
            borderRadius: 10, padding: "10px 14px",
            color: errorCode === "PENDING_VALIDATION" ? "#FDE68A" : "#FCA5A5",
            fontSize: 13, marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        {/* FIX — Bouton relance paiement */}
        {errorCode === "PAYMENT_REQUIRED" && (
          <button
            onClick={handleRetryPayment}
            disabled={payLoading}
            style={{
              width: "100%", padding: "13px 0", marginBottom: 16,
              borderRadius: 12, border: "none",
              background: payLoading ? "#475569" : "linear-gradient(135deg,#0072C6,#005A9E)",
              color: "#fff", fontWeight: 900, fontSize: 14,
              cursor: payLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: payLoading ? "none" : "0 4px 16px rgba(0,114,198,.4)",
              fontFamily: "inherit",
            }}
          >
            {payLoading ? (
              <>
                <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                Redirection vers CinetPay…
              </>
            ) : (
              <>💳 Finaliser le paiement — 15 000 FCFA</>
            )}
          </button>
        )}

        {/* FIX — Bandeau validation admin en attente */}
        {errorCode === "PENDING_VALIDATION" && (
          <div style={{ background:"rgba(217,119,6,.1)", border:"1px solid rgba(217,119,6,.3)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:"rgba(255,255,255,.65)" }}>
            ⏳ Votre dossier est en cours d'examen. L'administrateur vous contactera par WhatsApp ou email sous 24–48h.
          </div>
        )}

        {/* ── CONNEXION ── */}
        {tab === "login" && (
          <>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 6px" }}>Bon retour 👋</h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:"0 0 6px" }}>
              Accédez à votre espace ambassadeur
            </p>
            <div style={{ background:"rgba(0,188,212,.08)", border:"1px solid rgba(0,188,212,.2)", borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:12, color:"rgba(255,255,255,.65)" }}>
              💡 Recruteurs, Pasteurs, Responsables, Leaders : utilisez les identifiants transmis par votre supérieur.
            </div>
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { key:"email",    label:"Email ou nom d'utilisateur", type:"text",     placeholder:"votre@email.com" },
                { key:"password", label:"Mot de passe",               type:"password", placeholder:"••••••••" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>{f.label}</label>
                  <input className="unif-input" required type={f.type} placeholder={f.placeholder}
                    value={loginForm[f.key]}
                    onChange={e => setLoginForm({ ...loginForm, [f.key]: e.target.value })} />
                </div>
              ))}
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#00BCD4,#0097A7)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit", boxShadow:"0 6px 20px rgba(0,188,212,.35)", marginTop:4, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Connexion…" : "Se connecter →"}
              </button>
            </form>
          </>
        )}

        {/* ── INSCRIPTION ── */}
        {tab === "register" && (
          <>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 6px" }}>Rejoignez notre réseau 🌍</h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:"0 0 20px" }}>
              Inscription réservée aux rôles fondateurs (Ambassadeur Diaspora, RUM)
            </p>

            {/* Sélecteur réseau */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              {Object.entries(NETWORK_CONFIG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => handleNetworkChange(key)}
                  style={{
                    padding:"14px 10px", borderRadius:14, border:"none", cursor:"pointer",
                    fontFamily:"inherit", transition:"all .2s",
                    background: regForm.network_type === key
                      ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`
                      : "rgba(255,255,255,.06)",
                    boxShadow: regForm.network_type === key ? `0 6px 20px ${cfg.color}44` : "none",
                    transform: regForm.network_type === key ? "translateY(-2px)" : "none",
                  }}>
                  <div style={{ fontSize:26, marginBottom:6 }}>{cfg.icon}</div>
                  <div style={{ color:"#fff", fontWeight:800, fontSize:13 }}>{cfg.label}</div>
                  <div style={{ color:"rgba(255,255,255,.6)", fontSize:10, marginTop:3 }}>{cfg.desc}</div>
                </button>
              ))}
            </div>

            {/* Badge rôle */}
            <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:18 }}>🎖️</span>
              <div>
                <p style={{ color:"rgba(255,255,255,.9)", fontSize:13, fontWeight:700, margin:0 }}>
                  Rôle : {SELF_REGISTER_ROLES[regForm.network_type][0].label}
                </p>
                <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, margin:0 }}>
                  {SELF_REGISTER_ROLES[regForm.network_type][0].desc}
                </p>
              </div>
            </div>

            {/* FIX — Info workflow paiement + validation */}
            <div style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"10px 14px", marginBottom:20 }}>
              <p style={{ margin:"0 0 6px", color:"rgba(255,255,255,.8)", fontSize:12, fontWeight:700 }}>📋 Étapes après inscription</p>
              {[
                { step:"1", label:"Compte créé",            done:true  },
                { step:"2", label:"Paiement 15 000 FCFA",   done:false },
                { step:"3", label:"Validation administrateur", done:false },
              ].map(s => (
                <div key={s.step} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <div style={{ width:18, height:18, borderRadius:"50%", background: s.done ? "#059669" : "rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:"#fff", flexShrink:0 }}>
                    {s.step}
                  </div>
                  <span style={{ fontSize:12, color: s.done ? "#6EE7B7" : "rgba(255,255,255,.5)" }}>{s.label}</span>
                </div>
              ))}
            </div>

            {refCode && (
              <div style={{ background:"rgba(0,188,212,.12)", border:"1px solid rgba(0,188,212,.3)", borderRadius:12, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:18 }}>🎁</span>
                <div>
                  <p style={{ color:"#00BCD4", fontSize:13, fontWeight:700, margin:0 }}>Invitation reçue !</p>
                  <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, margin:0 }}>Code : <strong style={{ color:"#fff" }}>{refCode}</strong></p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { key:"name",     label:"Nom complet *",  type:"text",     placeholder:"Jean Kouassi" },
                { key:"email",    label:"Email *",         type:"email",    placeholder:"jean@email.com" },
                { key:"phone",    label:"Téléphone",       type:"tel",      placeholder:"+225 07 00 00 00 00" },
                { key:"password", label:"Mot de passe *",  type:"password", placeholder:"Min. 6 caractères" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>{f.label}</label>
                  <input className="unif-input" required={f.key !== "phone"} type={f.type} placeholder={f.placeholder}
                    value={regForm[f.key]}
                    onChange={e => setRegForm({ ...regForm, [f.key]: e.target.value })} />
                </div>
              ))}

              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>Pays de résidence *</label>
                <select className="unif-input" required value={regForm.country}
                  onChange={e => setRegForm({ ...regForm, country: e.target.value })}
                  style={{ background:"rgba(30,58,92,.9)" }}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>Code parrainage</label>
                <input className="unif-input" value={regForm.referral_code}
                  onChange={e => setRegForm({ ...regForm, referral_code: e.target.value })}
                  placeholder="AWJ-AMB-XXXXX (optionnel)"
                  style={{ color: regForm.referral_code ? "#00BCD4" : "rgba(255,255,255,.4)", fontWeight: regForm.referral_code ? 700 : 400 }} />
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width:"100%", padding:14, border:"none", borderRadius:14,
                  fontSize:15, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily:"inherit", marginTop:4, opacity: loading ? 0.7 : 1,
                  background: `linear-gradient(135deg, ${net.color}, ${net.color}cc)`,
                  color:"#fff",
                  boxShadow: `0 6px 20px ${net.color}44`,
                }}>
                {loading ? "Création du compte…" : `Créer mon compte ${net.icon} →`}
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{ color:"rgba(255,255,255,.25)", fontSize:12, marginTop:24, textAlign:"center" }}>
        © {new Date().getFullYear()} Mutuelle Santé Awoundjô — Côte d'Ivoire<br/>
        🔒 Paiements sécurisés · Données chiffrées
      </p>
    </div>
  );
}
