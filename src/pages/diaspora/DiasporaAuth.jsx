// src/pages/diaspora/DiasporaAuth.jsx
// ─────────────────────────────────────────────────────────────
//  Portail d'authentification unifié Awoundjô
//  Réseaux : DIASPORA | REFERRAL (RUM/Leader/Pasteur/Responsable)
//  Les rôles intermédiaires se connectent avec credentials générés
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { diasporaAuthAPI, diasporaLogin } from "../../diasporaApi";

const COUNTRIES = [
  "France","Belgique","Suisse","Canada","États-Unis","Royaume-Uni","Italie","Espagne",
  "Allemagne","Pays-Bas","Portugal","Maroc","Sénégal","Ghana","Gabon","Congo",
  "Cameroun","Togo","Bénin","Burkina Faso","Mali","Guinée","Côte d'Ivoire","Autre",
];

// ── Hiérarchies par réseau ────────────────────────────────────
// Seuls les rôles "fondateurs" (top de chaque réseau) peuvent créer leur compte.
// Les autres reçoivent leurs credentials générés par leur supérieur.
const SELF_REGISTER_ROLES = {
  DIASPORA: [
    { value: "AMBASSADEUR_DIASPORA", label: "🌍 Ambassadeur Diaspora", desc: "Sommet du réseau Diaspora" },
  ],
  REFERRAL: [
    { value: "RUM",    label: "👑 RUM",    desc: "Responsable Unifié de Mission" },
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

// Redirection selon le rôle après connexion
function getDashPath(ambassador) {
  if (!ambassador) return "/diaspora/login";
  const net = ambassador.network_type;
  if (net === "REFERRAL") return "/referral/dashboard";
  return "/diaspora/dashboard";
}

export default function DiasporaAuth() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const refCode       = params.get("ref")     || "";
  const netParam      = params.get("network") || "DIASPORA"; // réseau pré-sélectionné via URL
  const [tab, setTab] = useState(refCode ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm,   setRegForm]   = useState({
    name:         "",
    country:      "Côte d'Ivoire",
    phone:        "",
    email:        "",
    password:     "",
    referral_code: refCode,
    network_type:  netParam in NETWORK_CONFIG ? netParam : "DIASPORA",
    role:          SELF_REGISTER_ROLES[netParam in NETWORK_CONFIG ? netParam : "DIASPORA"][0].value,
  });

  function handleNetworkChange(network) {
    const firstRole = SELF_REGISTER_ROLES[network][0].value;
    setRegForm(f => ({ ...f, network_type: network, role: firstRole }));
  }

  async function handleLogin(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await diasporaAuthAPI.login(loginForm);
      diasporaLogin(data.token, data.ambassador);
      navigate(getDashPath(data.ambassador));
    } catch (err) {
      setError(err.response?.data?.error || "Identifiants incorrects");
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await diasporaAuthAPI.register(regForm);
      diasporaLogin(data.token, data.ambassador);
      navigate(getDashPath(data.ambassador));
    } catch (err) {
      setError(err.response?.data?.error || "Erreur d'inscription");
    } finally { setLoading(false); }
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
            <button key={t.id} onClick={() => { setTab(t.id); setError(""); }}
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

        {error && (
          <div style={{ background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, padding:"10px 14px", color:"#FCA5A5", fontSize:13, marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* ── CONNEXION ── */}
        {tab === "login" && (
          <>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 6px" }}>Bon retour 👋</h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:"0 0 6px" }}>
              Accédez à votre espace ambassadeur
            </p>
            {/* Info pour rôles qui reçoivent credentials */}
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
                style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#00BCD4,#0097A7)", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 6px 20px rgba(0,188,212,.35)", marginTop:4 }}>
                {loading ? "Connexion…" : "Se connecter →"}
              </button>
            </form>
          </>
        )}

        {/* ── INSCRIPTION (seulement pour les rôles fondateurs) ── */}
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

            {/* Badge rôle auto */}
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
                  fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:4,
                  background: `linear-gradient(135deg, ${net.color}, ${net.color}cc)`,
                  color:"#fff",
                  boxShadow: `0 6px 20px ${net.color}44`,
                }}>
                {loading ? "Création du compte…" : `Rejoindre le réseau ${net.icon} →`}
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
