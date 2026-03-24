// src/pages/diaspora/DiasporaAuth.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { diasporaAuthAPI, diasporaLogin } from "../../diasporaApi";

const COUNTRIES = [
  "France","Belgique","Suisse","Canada","États-Unis","Royaume-Uni","Italie","Espagne",
  "Allemagne","Pays-Bas","Portugal","Maroc","Sénégal","Ghana","Gabon","Congo",
  "Cameroun","Togo","Bénin","Burkina Faso","Mali","Guinée","Autre",
];

const PLANS_INFO = {
  ESSENTIELLE: { label: "Essentielle", price: "15€/mois", coverage: "50%", color: "#2563EB", features: ["Consultations","Pharmacie (30%)","Labo (40%)"] },
  IVOIRIENNE:  { label: "Ivoirienne",  price: "25€/mois", coverage: "70%", color: "#059669", features: ["Consultations","Pharmacie (50%)","Labo (60%)","Hospitalisation (75%)"] },
  TURQUOISE:   { label: "Turquoise",   price: "40€/mois", coverage: "90%", color: "#0891B2", features: ["Consultations","Pharmacie (80%)","Labo (85%)","Hospitalisation (95%)","Téléconsultation"] },
};

export default function DiasporaAuth() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const refCode       = params.get("ref") || "";
  const [tab, setTab] = useState(refCode ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [loginForm,  setLoginForm]  = useState({ email: "", password: "" });
  const [regForm,    setRegForm]    = useState({ name: "", country: "France", phone: "", email: "", password: "", referral_code: refCode });

  async function handleLogin(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await diasporaAuthAPI.login(loginForm);
      diasporaLogin(data.token, data.ambassador);
      navigate("/diaspora/dashboard");
    } catch (err) { setError(err.response?.data?.error || "Identifiants incorrects"); }
    finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await diasporaAuthAPI.register(regForm);
      diasporaLogin(data.token, data.ambassador);
      navigate("/diaspora/dashboard");
    } catch (err) { setError(err.response?.data?.error || "Erreur d'inscription"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F2942 0%,#1a3a5c 60%,#0c2035 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .diasp-input { width:100%; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); borderRadius:12px; padding:12px 14px; color:#fff; fontSize:14px; outline:none; boxSizing:border-box; fontFamily:inherit; transition:border-color .2s; }
        .diasp-input:focus { border-color:rgba(0,188,212,.5); }
        .diasp-input option { background:#1a3a5c; color:#fff; }
      `}</style>

      {/* Blobs décoratifs */}
      <div style={{ position:"absolute", top:-150, right:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,188,212,.12),transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-100, left:-100, width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,rgba(5,150,105,.1),transparent 70%)", pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:32 }}>
        <img src="/logo-awoundjjo.png" alt="Awoundjô" style={{ width:52, height:52, objectFit:"contain", borderRadius:14, background:"rgba(255,255,255,.1)", padding:6 }} />
        <div>
          <div style={{ color:"#fff", fontSize:22, fontWeight:900, letterSpacing:-.5 }}>Awoundjô</div>
          <div style={{ color:"rgba(255,255,255,.5)", fontSize:12, marginTop:1 }}>🌍 Portail Ambassadeurs Diaspora</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ background:"rgba(255,255,255,.04)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:24, padding:"32px 28px", width:"100%", maxWidth:460 }}>

        {/* Tabs */}
        <div style={{ display:"flex", background:"rgba(255,255,255,.06)", borderRadius:14, padding:4, marginBottom:28, gap:4 }}>
          {[{ id:"login", label:"🔑 Connexion" },{ id:"register", label:"✨ Créer un compte" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError(""); }}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all .25s",
                background: tab===t.id ? "#00BCD4" : "transparent",
                color:      tab===t.id ? "#fff"    : "rgba(255,255,255,.55)",
                boxShadow:  tab===t.id ? "0 4px 12px rgba(0,188,212,.3)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, padding:"10px 14px", color:"#FCA5A5", fontSize:13, marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* LOGIN */}
        {tab === "login" && (
          <>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 6px" }}>Bon retour 👋</h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:"0 0 24px" }}>Connectez-vous pour gérer vos bénéficiaires</p>
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>Email</label>
                <input className="diasp-input" type="email" required placeholder="votre@email.com"
                  value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"12px 14px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>Mot de passe</label>
                <input type="password" required placeholder="••••••••"
                  value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"12px 14px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#00BCD4,#0097A7)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 6px 20px rgba(0,188,212,.35)", marginTop:4 }}>
                {loading ? "Connexion…" : "Se connecter →"}
              </button>
            </form>
          </>
        )}

        {/* REGISTER */}
        {tab === "register" && (
          <>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 6px" }}>Rejoignez la diaspora 🌍</h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:"0 0 24px" }}>Protégez vos proches en Côte d'Ivoire</p>
            {refCode && (
              <div style={{ background:"rgba(0,188,212,.12)", border:"1px solid rgba(0,188,212,.3)", borderRadius:12, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:18 }}>🎁</span>
                <div>
                  <p style={{ color:"#00BCD4", fontSize:13, fontWeight:700, margin:0 }}>Invitation reçue !</p>
                  <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, margin:0 }}>Code parrainage : <strong style={{ color:"#fff" }}>{refCode}</strong></p>
                </div>
              </div>
            )}
            <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { key:"name",    label:"Nom complet *",    type:"text",     placeholder:"Jean Kouassi" },
                { key:"email",   label:"Email *",          type:"email",    placeholder:"jean@email.com" },
                { key:"phone",   label:"Téléphone",        type:"tel",      placeholder:"+33 6 12 34 56 78" },
                { key:"password",label:"Mot de passe *",   type:"password", placeholder:"Min. 6 caractères" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>{f.label}</label>
                  <input required={f.key !== "phone"} type={f.type} placeholder={f.placeholder}
                    value={regForm[f.key]} onChange={e => setRegForm({ ...regForm, [f.key]: e.target.value })}
                    style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"12px 14px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
                </div>
              ))}
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>Pays de résidence *</label>
                <select required value={regForm.country} onChange={e => setRegForm({ ...regForm, country: e.target.value })}
                  style={{ width:"100%", background:"rgba(30,58,92,.9)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"12px 14px", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {refCode && (
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>Code parrainage</label>
                  <input value={regForm.referral_code} onChange={e => setRegForm({ ...regForm, referral_code: e.target.value })}
                    placeholder="AWJ-AMB-XXXXX (optionnel)"
                    style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(0,188,212,.3)", borderRadius:12, padding:"12px 14px", color:"#00BCD4", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", fontWeight:700 }} />
                </div>
              )}
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#00BCD4,#0097A7)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 6px 20px rgba(0,188,212,.35)", marginTop:4 }}>
                {loading ? "Création du compte…" : "Créer mon compte →"}
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
