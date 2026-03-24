// src/pages/diaspora/DiasporaDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { diasporaDashAPI, diasporaRefAPI, getDiasporaData, diasporaLogout } from "../../diasporaApi";

const fmt    = (n, cur="€") => `${Number(n||0).toLocaleString("fr-FR", { minimumFractionDigits:2, maximumFractionDigits:2 })} ${cur}`;
const fmtXof = (n) => `${Number(n||0).toLocaleString("fr-FR")} FCFA`;

const NAV = [
  { to:"/diaspora/dashboard",     icon:"🏠", label:"Accueil" },
  { to:"/diaspora/beneficiaries", icon:"👨‍👩‍👧‍👦", label:"Bénéficiaires" },
  { to:"/diaspora/payments",      icon:"💳", label:"Paiements" },
  { to:"/diaspora/earnings",      icon:"💰", label:"Commissions" },
  { to:"/diaspora/referral",      icon:"🔗", label:"Parrainage" },
];

// ── Layout ────────────────────────────────────────────────────
export function DiasporaLayout() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const [menu, setMenu] = useState(false);
  const ambassador = getDiasporaData();

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      {/* Header */}
      <header style={{ background:"linear-gradient(135deg,#0F2942,#1a3a5c)", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 16px rgba(15,41,66,.4)" }}>
        <div style={{ maxWidth:768, margin:"0 auto", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => navigate("/diaspora/dashboard")}>
            <img src="/logo-awoundjjo.png" alt="" style={{ width:34, height:34, objectFit:"contain", borderRadius:8, background:"rgba(255,255,255,.1)", padding:4 }} />
            <div>
              <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Awoundjô Diaspora</div>
              <div style={{ color:"rgba(255,255,255,.5)", fontSize:11 }}>🌍 {ambassador?.country}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ background:"rgba(0,188,212,.2)", border:"1px solid rgba(0,188,212,.3)", borderRadius:8, padding:"3px 10px" }}>
              <span style={{ color:"#00BCD4", fontSize:11, fontWeight:700 }}>AMB</span>
            </div>
            <button onClick={() => setMenu(!menu)} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer" }}>
              {menu ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* Dropdown menu */}
      {menu && (
        <div style={{ position:"fixed", top:58, left:0, right:0, background:"#0a3d62", boxShadow:"0 8px 30px rgba(0,0,0,.3)", zIndex:99, maxWidth:768, margin:"0 auto" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
            <p style={{ fontWeight:700, fontSize:15, color:"#fff", margin:0 }}>{ambassador?.name}</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.5)", margin:0 }}>{ambassador?.email}</p>
            <p style={{ fontSize:11, color:"#00BCD4", fontFamily:"monospace", margin:"4px 0 0", fontWeight:700 }}>{ambassador?.referral_code}</p>
          </div>
          <Link to="/diaspora/profile" onClick={() => setMenu(false)} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 20px", color:"rgba(255,255,255,.8)", textDecoration:"none", fontSize:14 }}>
            👤 Mon profil
          </Link>
          <button onClick={diasporaLogout} style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"13px 20px", background:"none", border:"none", borderTop:"1px solid rgba(255,255,255,.08)", fontSize:14, color:"#FF6B6B", cursor:"pointer", fontFamily:"inherit" }}>
            🚪 Se déconnecter
          </button>
        </div>
      )}

      {/* Contenu */}
      <main style={{ maxWidth:768, margin:"0 auto", padding:"16px 16px 100px" }}>
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:"#0F2942", borderTop:"1px solid rgba(255,255,255,.08)", display:"flex", boxShadow:"0 -4px 20px rgba(0,0,0,.25)", zIndex:100, maxWidth:768, margin:"0 auto" }}>
        {NAV.map(item => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link key={item.to} to={item.to}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 4px", gap:3, textDecoration:"none", background: active ? "rgba(0,188,212,.1)" : "transparent", transition:"background .15s" }}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ fontSize:10, color: active ? "#00BCD4" : "rgba(255,255,255,.45)", fontFamily:"inherit" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────
export default function DiasporaDashboard() {
  const navigate   = useNavigate();
  const ambassador = getDiasporaData();
  const [stats,    setStats]   = useState(null);
  const [refLink,  setRefLink] = useState("");
  const [copied,   setCopied]  = useState(false);
  const [loading,  setLoading] = useState(true);
  const [visible,  setVisible] = useState(false);

  useEffect(() => {
    Promise.all([
      diasporaDashAPI.stats(),
      diasporaRefAPI.getLink(),
    ]).then(([s, r]) => {
      setStats(s.data);
      setRefLink(r.data.link);
      setTimeout(() => setVisible(true), 80);
    }).catch(() => setVisible(true))
      .finally(() => setLoading(false));
  }, []);

  const hour   = new Date().getHours();
  const greet  = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  function copyRef() {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const kpis = [
    { label:"Bénéficiaires actifs",   value: stats?.beneficiaries?.active || 0,               icon:"👨‍👩‍👧‍👦", color:"#2563EB", bg:"#EFF6FF" },
    { label:"Total bénéficiaires",    value: stats?.beneficiaries?.total  || 0,               icon:"👥", color:"#059669", bg:"#ECFDF5" },
    { label:"Paiements effectués",    value: stats?.payments?.total        || 0,               icon:"💳", color:"#D97706", bg:"#FFFBEB" },
    { label:"Commissions en attente", value: fmt(stats?.commissions?.pending),                 icon:"⏳", color:"#7C3AED", bg:"#F5F3FF" },
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{
        background:"linear-gradient(135deg,#0F2942,#1a3a5c)",
        borderRadius:20, padding:"22px 20px", marginBottom:18,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
        transition:"all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <p style={{ color:"rgba(255,255,255,.6)", fontSize:13, margin:"0 0 4px" }}>{greet} 👋</p>
        <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 8px", letterSpacing:-.3 }}>{ambassador?.name}</h2>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ background:"rgba(0,188,212,.2)", color:"#00BCD4", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, border:"1px solid rgba(0,188,212,.3)", fontFamily:"monospace" }}>
            {ambassador?.referral_code}
          </span>
          <span style={{ color:"rgba(255,255,255,.5)", fontSize:12 }}>🌍 {ambassador?.country}</span>
        </div>

        {/* Commissions totales */}
        <div style={{ background:"rgba(255,255,255,.07)", borderRadius:14, padding:"14px 16px", marginTop:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, margin:"0 0 3px", textTransform:"uppercase", letterSpacing:.8 }}>Total commissions gagnées</p>
            <p style={{ color:"#00BCD4", fontSize:22, fontWeight:900, margin:0 }}>{fmt(stats?.commissions?.total_earned)}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, margin:"0 0 3px" }}>Parrainages</p>
            <p style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{stats?.referrals || 0}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background:"#fff", borderRadius:16, padding:"16px", borderTop:`3px solid ${k.color}`,
            opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(.95)",
            transition:`all .4s ${.1+i*.06}s cubic-bezier(.34,1.56,.64,1)` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600, textTransform:"uppercase", letterSpacing:.8, margin:0 }}>{k.label}</p>
              <div style={{ width:32, height:32, borderRadius:9, background:k.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{k.icon}</div>
            </div>
            <p style={{ fontSize:22, fontWeight:800, color:k.color, margin:0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Lien de parrainage */}
      {refLink && (
        <div style={{ background:"#fff", borderRadius:16, padding:"16px 18px", marginBottom:18, boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
          <p style={{ fontSize:12, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, margin:"0 0 10px" }}>🔗 Mon lien de parrainage</p>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ flex:1, background:"#F8FAFC", borderRadius:10, padding:"10px 12px", fontSize:12, color:"#475569", fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", border:"1px solid #E2E8F0" }}>
              {refLink}
            </div>
            <button onClick={copyRef} style={{ background: copied ? "#059669" : "#0F2942", color:"#fff", border:"none", borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0, transition:"background .2s" }}>
              {copied ? "✓ Copié !" : "📋 Copier"}
            </button>
          </div>
          <p style={{ fontSize:11, color:"#94A3B8", margin:"8px 0 0" }}>
            Partagez ce lien — gagnez <strong style={{ color:"#0F2942" }}>5% sur chaque adhésion</strong> de vos filleuls
          </p>
        </div>
      )}

      {/* Actions rapides */}
      <p style={{ fontSize:13, fontWeight:800, color:"#0F2942", marginBottom:12 }}>Actions rapides</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { icon:"➕", label:"Ajouter un bénéficiaire", desc:"Inscrire un proche", to:"/diaspora/beneficiaries/new", color:"#00BCD4", bg:"linear-gradient(135deg,#E0F7FA,#B2EBF2)" },
          { icon:"💳", label:"Effectuer un paiement",   desc:"Cotisation ou adhésion",to:"/diaspora/payments/new",      color:"#059669", bg:"linear-gradient(135deg,#ECFDF5,#D1FAE5)" },
          { icon:"👥", label:"Mes bénéficiaires",        desc:"Voir la liste",         to:"/diaspora/beneficiaries",     color:"#2563EB", bg:"linear-gradient(135deg,#EFF6FF,#DBEAFE)" },
          { icon:"💰", label:"Mes commissions",           desc:"Suivre mes gains",      to:"/diaspora/earnings",          color:"#7C3AED", bg:"linear-gradient(135deg,#F5F3FF,#EDE9FE)" },
        ].map((a, i) => (
          <button key={i} onClick={() => navigate(a.to)}
            style={{ background:a.bg, borderRadius:16, padding:"16px 14px", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:8, border:"none", cursor:"pointer", textAlign:"left", fontFamily:"inherit",
              opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(.95)",
              transition:`all .4s ${.3+i*.06}s cubic-bezier(.34,1.56,.64,1)` }}>
            <div style={{ width:40, height:40, background:"rgba(255,255,255,.8)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}>
              {a.icon}
            </div>
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:a.color, margin:"0 0 2px" }}>{a.label}</p>
              <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
