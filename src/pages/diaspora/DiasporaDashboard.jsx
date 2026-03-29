// src/pages/diaspora/DiasporaDashboard.jsx
// ─────────────────────────────────────────────────────────────
//  Dashboard + Layout pour le réseau DIASPORA
//  Hiérarchie : AMBASSADEUR_DIASPORA → AMBASSADEUR_PAYS → RECRUTEUR → CLIENT
//  Navigation adaptée par rôle :
//    - AMBASSADEUR_DIASPORA : enregistre des Ambassadeurs Pays
//    - AMBASSADEUR_PAYS     : enregistre des Recruteurs
//    - RECRUTEUR            : enregistre des Clients + vend des cartes
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  diasporaDashAPI,
  diasporaRefAPI,
  getDiasporaData,
} from "../../diasporaApi";

const C = {
  blue:    "#1B4FD8", blueL:  "#EEF2FF",
  green:   "#059669", greenL: "#ECFDF5",
  gold:    "#D97706", goldL:  "#FFFBEB",
  red:     "#DC2626", redL:   "#FEF2F2",
  purple:  "#7C3AED", purpleL:"#F5F3FF",
  slate:   "#64748B", dark:   "#0F172A",
  border:  "#E2E8F0", bg:     "#F8FAFC",
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });

// ── Config rôles Diaspora ─────────────────────────────────────
const ROLE_CONFIG = {
  AMBASSADEUR_DIASPORA: { label:"Ambassadeur Diaspora", icon:"🌍", color:C.blue,   bg:C.blueL,   level:1 },
  AMBASSADEUR_PAYS:     { label:"Ambassadeur Pays",     icon:"🗺️", color:C.green,  bg:C.greenL,  level:2 },
  RECRUTEUR:            { label:"Recruteur",            icon:"🤝", color:C.gold,   bg:C.goldL,   level:3 },
};

// ── Navigation dynamique par rôle ────────────────────────────
function getNavItems(role) {
  const base = [
    { path:"/diaspora/dashboard", icon:"🏠", label:"Accueil" },
    { path:"/diaspora/network",   icon:"🌐", label:"Mon réseau" },
  ];

  // Label et path de l'action principale selon le rôle
  if (role === "RECRUTEUR") {
    base.push({ path:"/diaspora/clients",    icon:"👤", label:"Mes clients" });
    base.push({ path:"/diaspora/clients/new", icon:"➕", label:"Enregistrer client" });
    base.push({ path:"/diaspora/cards",      icon:"💳", label:"Cartes vendues" });
  } else if (role === "AMBASSADEUR_PAYS") {
    base.push({ path:"/diaspora/register-recruiter",     icon:"👤", label:"Mes Recruteurs" });
    base.push({ path:"/diaspora/register-recruiter/new", icon:"➕", label:"Enregistrer Recruteur" });
  } else {
    // AMBASSADEUR_DIASPORA — peut créer Ambassadeurs Pays ET RUM
    base.push({ path:"/diaspora/register-pays",     icon:"🗺️", label:"Mes Ambassadeurs Pays" });
    base.push({ path:"/diaspora/register-pays/new", icon:"➕", label:"Enregistrer Amb. Pays"  });
    base.push({ path:"/diaspora/register-rum",      icon:"👑", label:"Mes RUM"                });
    base.push({ path:"/diaspora/register-rum/new",  icon:"➕", label:"Enregistrer RUM"         });
  }

  base.push(
    { path:"/diaspora/payments",      icon:"💰", label:"Paiements" },
    { path:"/diaspora/earnings",      icon:"📊", label:"Mes gains" },
    { path:"/diaspora/rewards",       icon:"🏆", label:"Récompenses" },
    { path:"/diaspora/referral",      icon:"🔗", label:"Parrainage" },
    { path:"/diaspora/leaderboard",   icon:"🏅", label:"Classement" },
    { path:"/diaspora/notifications", icon:"🔔", label:"Notifications" },
    { path:"/diaspora/profile",       icon:"👤", label:"Mon profil" },
  );
  return base;
}

// ── DiasporaLayout ────────────────────────────────────────────
export function DiasporaLayout() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread]         = useState(0);
  const amb  = getDiasporaData();
  const role = amb?.role || "RECRUTEUR";
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.RECRUTEUR;
  const NAV  = getNavItems(role);

  useEffect(() => {
    import("../../diasporaApi").then(({ diasporaNotifAPI }) => {
      diasporaNotifAPI.getAll().then(r => {
        setUnread(r.data?.unread_count || 0);
      }).catch(() => {});
    });
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("diaspora_token");
    localStorage.removeItem("diaspora_data");
    navigate("/diaspora/login");
  };

  const isActive = (path) => location.pathname === path;

  const SidebarContent = () => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Logo */}
      <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:"linear-gradient(135deg, #1B4FD8, #3B82F6)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
          }}>🌍</div>
          <div>
            <p style={{ margin:0, fontWeight:900, fontSize:15, color:C.dark }}>Awoundjô</p>
            <p style={{ margin:0, fontSize:10, color:C.slate, fontWeight:600 }}>DIASPORA</p>
          </div>
        </div>

        {amb && (
          <div style={{ marginTop:14, padding:"10px 12px", background:rc.bg, borderRadius:10 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:13, color:C.dark }}>{amb.name}</p>
            <span style={{
              fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, marginTop:4,
              display:"inline-block", background:"rgba(255,255,255,.6)", color:rc.color,
            }}>
              {rc.icon} {rc.label}
            </span>
            {/* Barre de niveau */}
            <div style={{ marginTop:8, display:"flex", gap:4 }}>
              {[1,2,3].map(l => (
                <div key={l} style={{
                  flex:1, height:4, borderRadius:2,
                  background: l <= rc.level ? rc.color : C.border,
                }} />
              ))}
            </div>
            <p style={{ margin:"4px 0 0", fontSize:9, color:C.slate }}>Niveau {rc.level}/3 dans la hiérarchie</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding:"12px 12px", overflowY:"auto" }}>
        {NAV.map(item => {
          const active = isActive(item.path);
          return (
            <button key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px", borderRadius:8, border:"none",
                background: active ? C.blue : "transparent",
                color:      active ? "#fff" : C.slate,
                fontWeight: active ? 700 : 500, fontSize:13,
                cursor:"pointer", marginBottom:2, textAlign:"left",
                transition:"all 0.15s", position:"relative",
              }}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.path === "/diaspora/notifications" && unread > 0 && (
                <span style={{
                  background:C.red, color:"#fff",
                  fontSize:10, fontWeight:800, padding:"1px 6px",
                  borderRadius:999, minWidth:18, textAlign:"center",
                }}>{unread}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding:"12px 12px", borderTop:`1px solid ${C.border}` }}>
        <button onClick={logout}
          style={{
            width:"100%", padding:"9px 12px", borderRadius:8,
            border:`1.5px solid ${C.border}`, background:"#fff",
            color:C.red, fontWeight:700, fontSize:13, cursor:"pointer",
            display:"flex", alignItems:"center", gap:8,
          }}>
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <style>{`
        @media (min-width:768px) { .diaspora-sidebar { display: block !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Sidebar desktop */}
      <aside style={{ width:240, flexShrink:0, background:"#fff", borderRight:`1px solid ${C.border}`, position:"sticky", top:0, height:"100vh", overflowY:"auto", display:"none" }}
        className="diaspora-sidebar">
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:40 }} />
      )}

      {/* Drawer mobile */}
      <aside style={{
        position:"fixed", top:0, left:mobileOpen ? 0 : -280,
        width:260, height:"100vh", background:"#fff",
        borderRight:`1px solid ${C.border}`,
        zIndex:50, transition:"left 0.25s ease", overflowY:"auto",
      }}>
        <SidebarContent />
      </aside>

      {/* Zone principale */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* Top bar mobile */}
        <header style={{
          background:"#fff", borderBottom:`1px solid ${C.border}`,
          padding:"12px 16px", display:"flex", alignItems:"center",
          justifyContent:"space-between", position:"sticky", top:0, zIndex:30,
        }}>
          <button onClick={() => setMobileOpen(true)}
            style={{ border:"none", background:"none", fontSize:22, cursor:"pointer", color:C.dark }}>☰</button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#1B4FD8,#3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🌍</div>
            <span style={{ fontWeight:900, fontSize:14, color:C.dark }}>Awoundjô Diaspora</span>
          </div>
          <button onClick={() => navigate("/diaspora/notifications")}
            style={{ border:"none", background:"none", cursor:"pointer", position:"relative" }}>
            🔔
            {unread > 0 && (
              <span style={{ position:"absolute", top:-4, right:-4, background:C.red, color:"#fff", fontSize:9, fontWeight:800, padding:"1px 4px", borderRadius:999 }}>{unread}</span>
            )}
          </button>
        </header>

        {/* Contenu routable */}
        <main style={{ flex:1, overflowY:"auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ── DiasporaDashboard (page Accueil) ─────────────────────────
export default function DiasporaDashboard() {
  const navigate  = useNavigate();
  const [stats, setStats]   = useState(null);
  const [link,  setLink]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const amb  = getDiasporaData();
  const role = amb?.role || "RECRUTEUR";
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.RECRUTEUR;

  useEffect(() => {
    Promise.all([
      diasporaDashAPI.getStats(),
      diasporaRefAPI.getLink(),
    ]).then(([s, l]) => {
      setStats(s.data);
      setLink(l.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (link?.link) navigator.clipboard.writeText(link.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Stats cards selon le rôle ──────────────────────────────
  const statCards = stats ? [
    ...(role === "RECRUTEUR" ? [
      { icon:"👤", label:"Clients enregistrés", value:stats.clients?.total || 0, sub:`${stats.clients?.active||0} actifs`, color:C.blue,  bg:C.blueL,  path:"/diaspora/clients" },
      { icon:"💳", label:"Cartes vendues",      value:stats.cards_sold || 0,     sub:"Ce mois",                            color:C.green, bg:C.greenL, path:"/diaspora/cards" },
    ] : role === "AMBASSADEUR_PAYS" ? [
      { icon:"🤝", label:"Mes Recruteurs",      value:stats.referrals || 0,       sub:"Recruteurs directs",                 color:C.blue,  bg:C.blueL,  path:"/diaspora/register-recruiter" },
      { icon:"👥", label:"Total réseau",        value:stats.network_size || 0,    sub:"Tous niveaux",                       color:C.green, bg:C.greenL, path:"/diaspora/network" },
    ] : [
      // AMBASSADEUR_DIASPORA — crée Ambassadeurs Pays + RUM
      { icon:"🗺️", label:"Ambassadeurs Pays",  value:stats.referrals_pays  || 0, sub:"Recrutés directs",     color:C.blue,   bg:C.blueL,   path:"/diaspora/register-pays" },
      { icon:"👑", label:"RUM créés",           value:stats.referrals_rum   || 0, sub:"Réseau Parrainage",    color:C.purple, bg:C.purpleL, path:"/diaspora/register-rum"  },
      { icon:"🌐", label:"Total réseau",        value:stats.network_size    || 0, sub:"Tous niveaux",         color:C.green,  bg:C.greenL,  path:"/diaspora/network"       },
    ]),
    { icon:"💰", label:"Commissions totales", value:stats.commissions?.total_earned || 0, sub:`${fmt(stats.commissions?.pending||0)} en attente`, color:C.gold,   bg:C.goldL,   path:"/diaspora/earnings", isAmount:true },
    { icon:"🏆", label:"Récompenses",         value:stats.rewards?.level || "—",  sub:stats.rewards?.unlocked || "Continuez !",   color:C.purple, bg:C.purpleL, path:"/diaspora/rewards", isText:true },
  ] : [];

  // ── Actions rapides selon le rôle ─────────────────────────
  const quickActions = role === "RECRUTEUR" ? [
    { icon:"➕", label:"Enregistrer client",  path:"/diaspora/clients/new",  color:C.blue   },
    { icon:"💳", label:"Vendre une carte",    path:"/diaspora/cards/new",    color:C.green  },
    { icon:"📊", label:"Mes gains",           path:"/diaspora/earnings",     color:C.gold   },
    { icon:"🏆", label:"Récompenses",         path:"/diaspora/rewards",      color:C.purple },
  ] : role === "AMBASSADEUR_PAYS" ? [
    { icon:"➕", label:"Nouveau Recruteur",   path:"/diaspora/register-recruiter/new", color:C.blue   },
    { icon:"🌐", label:"Mon réseau",          path:"/diaspora/network",                color:C.green  },
    { icon:"📊", label:"Mes gains",           path:"/diaspora/earnings",               color:C.gold   },
    { icon:"🏆", label:"Récompenses",         path:"/diaspora/rewards",                color:C.purple },
  ] : [
    // AMBASSADEUR_DIASPORA
    { icon:"🗺️", label:"Nouveau Amb. Pays", path:"/diaspora/register-pays/new", color:C.blue   },
    { icon:"👑", label:"Nouveau RUM",        path:"/diaspora/register-rum/new",  color:C.purple },
    { icon:"📊", label:"Mes gains",          path:"/diaspora/earnings",           color:C.gold   },
    { icon:"🌐", label:"Mon réseau",         path:"/diaspora/network",            color:C.green  },
  ];

  if (loading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
        <div style={{ width:40, height:40, border:`3px solid ${C.blueL}`, borderTop:`3px solid ${C.blue}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding:"20px 16px", maxWidth:960, margin:"0 auto" }}>

      {/* ── Bannière ── */}
      <div style={{
        background:"linear-gradient(135deg, #1B4FD8 0%, #3B82F6 100%)",
        borderRadius:16, padding:"20px 24px", marginBottom:24,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:16,
      }}>
        <div>
          <p style={{ margin:"0 0 4px", color:"rgba(255,255,255,0.75)", fontSize:12, fontWeight:600 }}>BONJOUR 👋</p>
          <h1 style={{ margin:"0 0 8px", color:"#fff", fontSize:22, fontWeight:900 }}>{amb?.name || "Ambassadeur"}</h1>
          <span style={{ background:rc.bg, color:rc.color, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700 }}>
            {rc.icon} {rc.label}
          </span>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ margin:"0 0 4px", color:"rgba(255,255,255,0.75)", fontSize:11, fontWeight:600 }}>GAINS EN ATTENTE</p>
          <p style={{ margin:0, color:"#fff", fontSize:28, fontWeight:900 }}>
            {fmt(stats?.commissions?.pending || 0)} FCFA
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, marginBottom:24 }}>
        {statCards.map(s => (
          <div key={s.label} onClick={() => navigate(s.path)}
            style={{ background:s.bg, borderRadius:14, border:`1px solid ${s.color}22`, padding:"16px 18px", cursor:"pointer", transition:"transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 4px 20px ${s.color}33`; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <span style={{ fontSize:26 }}>{s.icon}</span>
              <span style={{ fontSize:10, color:s.color, fontWeight:700 }}>Voir →</span>
            </div>
            <p style={{ margin:"10px 0 2px", fontSize:s.isText?20:28, fontWeight:900, color:s.color }}>
              {s.isText ? s.value : s.isAmount ? `${fmt(s.value)} FCFA` : fmt(s.value)}
            </p>
            <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:C.dark }}>{s.label}</p>
            <p style={{ margin:0, fontSize:11, color:C.slate }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Lien ambassadeur ── */}
      {link && (
        <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", marginBottom:24 }}>
          <p style={{ margin:"0 0 12px", fontWeight:800, color:C.dark, fontSize:15 }}>🔗 Mon lien ambassadeur</p>
          <div style={{ background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:C.blue, fontWeight:600, wordBreak:"break-all", flex:1 }}>{link.link}</span>
            <span style={{ background:C.blueL, color:C.blue, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
              Code : {link.code}
            </span>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={copyLink}
              style={{ padding:"8px 18px", borderRadius:8, border:`1.5px solid ${C.blue}`, background:C.blueL, color:C.blue, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              {copied ? "✅ Copié !" : "📋 Copier le lien"}
            </button>
            {link.whatsapp_message && (
              <a href={link.whatsapp_message} target="_blank" rel="noreferrer"
                style={{ padding:"8px 18px", borderRadius:8, border:"none", background:"#25D366", color:"#fff", fontWeight:700, fontSize:13, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6 }}>
                📲 WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Actions rapides ── */}
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", marginBottom:24 }}>
        <p style={{ margin:"0 0 14px", fontWeight:800, color:C.dark, fontSize:15 }}>⚡ Actions rapides</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
          {quickActions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{ padding:"12px 10px", borderRadius:10, border:`2px solid ${a.color}22`, background:`${a.color}11`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background=`${a.color}22`}
              onMouseLeave={e => e.currentTarget.style.background=`${a.color}11`}>
              <span style={{ fontSize:22 }}>{a.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color:a.color, textAlign:"center" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Résumé réseau ── */}
      {stats && (
        <div onClick={() => navigate("/diaspora/network")}
          style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", cursor:"pointer", transition:"box-shadow 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:15 }}>🌐 Mon réseau</p>
            <span style={{ fontSize:12, color:C.blue, fontWeight:700 }}>Voir le détail →</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10 }}>
            {[
              { label:"Total",      value:stats.network_size,            color:C.blue   },
              { label:"Directs",    value:stats.referrals,               color:C.green  },
              { label:"Actifs",     value:stats.clients?.active,         color:C.gold   },
              { label:"En attente", value:stats.clients?.pending,        color:C.slate  },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center", padding:"10px 6px", background:C.bg, borderRadius:8 }}>
                <p style={{ margin:0, fontSize:20, fontWeight:900, color:s.color }}>{fmt(s.value)}</p>
                <p style={{ margin:"3px 0 0", fontSize:10, color:C.slate, fontWeight:600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
