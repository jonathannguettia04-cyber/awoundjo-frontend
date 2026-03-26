// src/pages/federation/FederationDashboard.jsx (Réseau Parrainage)
// ─────────────────────────────────────────────────────────────
//  Dashboard + Layout pour le réseau REFERRAL (Parrainage)
//  Hiérarchie : RUM → LEADER → PASTEUR → RESPONSABLE → CLIENT
//
//  RUM         : enregistre des Leaders
//  LEADER      : enregistre des Pasteurs
//  PASTEUR     : enregistre des Responsables OU des Clients (2 modes)
//  RESPONSABLE : enregistre uniquement des Clients + vend des cartes
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  federationDashAPI,
  federationRecruitAPI,
} from "../../federationApi";
import { getDiasporaData } from "../../diasporaApi";

const C = {
  purple:  "#7C3AED", purpleL: "#F5F3FF", purpleM: "#DDD6FE",
  green:   "#059669", greenL:  "#ECFDF5",
  gold:    "#D97706", goldL:   "#FFFBEB",
  blue:    "#1B4FD8", blueL:   "#EEF2FF",
  teal:    "#0D9488", tealL:   "#F0FDFA",
  red:     "#DC2626", redL:    "#FEF2F2",
  slate:   "#64748B", dark:    "#0F172A",
  border:  "#E2E8F0", bg:      "#F8FAFC",
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });

// ── Config rôles Parrainage ───────────────────────────────────
const ROLE_CONFIG = {
  RUM:         { label:"RUM",         icon:"👑", color:C.purple, bg:C.purpleL, level:1 },
  LEADER:      { label:"Leader",      icon:"⭐", color:C.blue,   bg:C.blueL,   level:2 },
  PASTEUR:     { label:"Pasteur",     icon:"⛪", color:C.teal,   bg:C.tealL,   level:3 },
  RESPONSABLE: { label:"Responsable", icon:"🤝", color:C.gold,   bg:C.goldL,   level:4 },
};

// ── Navigation dynamique par rôle ────────────────────────────
function getNavItems(role) {
  const base = [
    { path:"/referral/dashboard", icon:"🏠", label:"Accueil" },
    { path:"/referral/network",   icon:"🌐", label:"Mon réseau" },
  ];

  if (role === "RESPONSABLE") {
    base.push({ path:"/referral/clients",     icon:"👤", label:"Mes clients" });
    base.push({ path:"/referral/clients/new", icon:"➕", label:"Enregistrer client" });
    base.push({ path:"/referral/cards",       icon:"💳", label:"Cartes vendues" });
  } else if (role === "PASTEUR") {
    base.push({ path:"/referral/register-responsable",     icon:"🤝", label:"Mes Responsables" });
    base.push({ path:"/referral/register-responsable/new", icon:"➕", label:"Enregistrer Responsable" });
    base.push({ path:"/referral/clients",     icon:"👤", label:"Mes clients directs" });
    base.push({ path:"/referral/clients/new", icon:"➕", label:"Enregistrer client" });
    base.push({ path:"/referral/cards",       icon:"💳", label:"Cartes vendues" });
  } else if (role === "LEADER") {
    base.push({ path:"/referral/register-pasteur",     icon:"⛪", label:"Mes Pasteurs" });
    base.push({ path:"/referral/register-pasteur/new", icon:"➕", label:"Enregistrer Pasteur" });
  } else {
    // RUM
    base.push({ path:"/referral/register-leader",     icon:"⭐", label:"Mes Leaders" });
    base.push({ path:"/referral/register-leader/new", icon:"➕", label:"Enregistrer Leader" });
  }

  base.push(
    { path:"/referral/payments",      icon:"💰", label:"Paiements" },
    { path:"/referral/earnings",      icon:"📊", label:"Mes gains" },
    { path:"/referral/rewards",       icon:"🏆", label:"Récompenses" },
    { path:"/referral/referral",      icon:"🔗", label:"Recrutement" },
    { path:"/referral/leaderboard",   icon:"🏅", label:"Classement" },
    { path:"/referral/notifications", icon:"🔔", label:"Notifications" },
    { path:"/referral/profile",       icon:"👤", label:"Mon profil" },
  );
  return base;
}

// ── FederationLayout ──────────────────────────────────────────
export function FederationLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread]         = useState(0);
  const amb  = getDiasporaData();
  const role = amb?.role || "RESPONSABLE";
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.RESPONSABLE;
  const NAV  = getNavItems(role);

  useEffect(() => {
    import("../../federationApi").then(({ federationNotifAPI }) => {
      federationNotifAPI.getAll().then(r => {
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
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg, #7C3AED, #A78BFA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⛪</div>
          <div>
            <p style={{ margin:0, fontWeight:900, fontSize:15, color:C.dark }}>Awoundjô</p>
            <p style={{ margin:0, fontSize:10, color:C.slate, fontWeight:600 }}>PARRAINAGE</p>
          </div>
        </div>

        {amb && (
          <div style={{ marginTop:14, padding:"10px 12px", background:rc.bg, borderRadius:10 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:13, color:C.dark }}>{amb.name}</p>
            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, marginTop:4, display:"inline-block", background:"rgba(255,255,255,.6)", color:rc.color }}>
              {rc.icon} {rc.label}
            </span>
            {/* Barre de niveau */}
            <div style={{ marginTop:8, display:"flex", gap:3 }}>
              {[1,2,3,4].map(l => (
                <div key={l} style={{ flex:1, height:4, borderRadius:2, background:l <= rc.level ? rc.color : C.border }} />
              ))}
            </div>
            <p style={{ margin:"4px 0 0", fontSize:9, color:C.slate }}>Niveau {rc.level}/4 dans la hiérarchie</p>
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
                background: active ? C.purple : "transparent",
                color:      active ? "#fff" : C.slate,
                fontWeight: active ? 700 : 500, fontSize:13,
                cursor:"pointer", marginBottom:2, textAlign:"left",
                transition:"all 0.15s", position:"relative",
              }}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.path === "/referral/notifications" && unread > 0 && (
                <span style={{ background:C.red, color:"#fff", fontSize:10, fontWeight:800, padding:"1px 6px", borderRadius:999, minWidth:18, textAlign:"center" }}>{unread}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding:"12px 12px", borderTop:`1px solid ${C.border}` }}>
        <button onClick={logout}
          style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.red, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <style>{`
        @media (min-width:768px) { .federation-sidebar { display: block !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <aside style={{ width:240, flexShrink:0, background:"#fff", borderRight:`1px solid ${C.border}`, position:"sticky", top:0, height:"100vh", overflowY:"auto", display:"none" }}
        className="federation-sidebar">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:40 }} />
      )}

      <aside style={{ position:"fixed", top:0, left:mobileOpen ? 0 : -280, width:260, height:"100vh", background:"#fff", borderRight:`1px solid ${C.border}`, zIndex:50, transition:"left 0.25s ease", overflowY:"auto" }}>
        <SidebarContent />
      </aside>

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <header style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:30 }}>
          <button onClick={() => setMobileOpen(true)}
            style={{ border:"none", background:"none", fontSize:22, cursor:"pointer", color:C.dark }}>☰</button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#7C3AED,#A78BFA)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⛪</div>
            <span style={{ fontWeight:900, fontSize:14, color:C.dark }}>Awoundjô Parrainage</span>
          </div>
          <button onClick={() => navigate("/referral/notifications")}
            style={{ border:"none", background:"none", cursor:"pointer", position:"relative" }}>
            🔔
            {unread > 0 && (
              <span style={{ position:"absolute", top:-4, right:-4, background:C.red, color:"#fff", fontSize:9, fontWeight:800, padding:"1px 4px", borderRadius:999 }}>{unread}</span>
            )}
          </button>
        </header>

        <main style={{ flex:1, overflowY:"auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ── FederationDashboard (page Accueil) ────────────────────────
export default function FederationDashboard() {
  const navigate  = useNavigate();
  const [stats, setStats]   = useState(null);
  const [link,  setLink]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  // Mode Pasteur : peut basculer entre "enregistrer Responsable" et "enregistrer Client"
  const [pasteurMode, setPasteurMode] = useState("responsable"); // "responsable" | "client"
  const amb  = getDiasporaData();
  const role = amb?.role || "RESPONSABLE";
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.RESPONSABLE;

  useEffect(() => {
    Promise.all([
      federationDashAPI.getStats(),
      federationRecruitAPI.getLink(),
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
    ...(role === "RESPONSABLE" ? [
      { icon:"👤", label:"Clients enregistrés", value:stats.clients?.total||0,  sub:`${stats.clients?.active||0} actifs`,    color:C.purple, bg:C.purpleL, path:"/referral/clients" },
      { icon:"💳", label:"Cartes vendues",      value:stats.cards_sold||0,       sub:"Toutes périodes",                        color:C.teal,   bg:C.tealL,   path:"/referral/cards" },
    ] : role === "PASTEUR" ? [
      { icon:"🤝", label:"Mes Responsables",    value:stats.referrals||0,        sub:"Responsables directs",                   color:C.purple, bg:C.purpleL, path:"/referral/register-responsable" },
      { icon:"👤", label:"Clients directs",     value:stats.direct_clients||0,   sub:"Enregistrés par vous",                   color:C.teal,   bg:C.tealL,   path:"/referral/clients" },
      { icon:"💳", label:"Cartes vendues",      value:stats.cards_sold||0,       sub:"Toutes périodes",                        color:C.green,  bg:C.greenL,  path:"/referral/cards" },
    ] : role === "LEADER" ? [
      { icon:"⛪", label:"Mes Pasteurs",        value:stats.referrals||0,        sub:"Pasteurs directs",                       color:C.purple, bg:C.purpleL, path:"/referral/register-pasteur" },
      { icon:"🌐", label:"Total réseau",        value:stats.network_size||0,     sub:"Tous niveaux",                           color:C.blue,   bg:C.blueL,   path:"/referral/network" },
    ] : [
      // RUM
      { icon:"⭐", label:"Mes Leaders",         value:stats.referrals||0,        sub:"Leaders directs",                        color:C.purple, bg:C.purpleL, path:"/referral/register-leader" },
      { icon:"🌐", label:"Total réseau",        value:stats.network_size||0,     sub:"Tous niveaux confondus",                 color:C.blue,   bg:C.blueL,   path:"/referral/network" },
    ]),
    { icon:"💰", label:"Commissions totales", value:stats.commissions?.total_earned||0, sub:`${fmt(stats.commissions?.pending||0)} en attente`, color:C.gold,   bg:C.goldL,   path:"/referral/earnings", isAmount:true },
    { icon:"🏆", label:"Récompenses",         value:stats.rewards?.level||"—",  sub:stats.rewards?.unlocked||"Continuez !",   color:C.green,  bg:C.greenL,  path:"/referral/rewards", isText:true },
  ] : [];

  // ── Actions rapides selon le rôle ──────────────────────────
  const quickActions = role === "RESPONSABLE" ? [
    { icon:"➕", label:"Enregistrer client",     path:"/referral/clients/new",            color:C.purple },
    { icon:"💳", label:"Vendre une carte",       path:"/referral/cards/new",              color:C.teal   },
    { icon:"📊", label:"Mes gains",              path:"/referral/earnings",               color:C.gold   },
    { icon:"🏆", label:"Récompenses",            path:"/referral/rewards",                color:C.green  },
  ] : role === "PASTEUR" ? [
    { icon:"🤝", label:"Nouveau Responsable",    path:"/referral/register-responsable/new", color:C.purple },
    { icon:"👤", label:"Enregistrer client",     path:"/referral/clients/new",            color:C.teal   },
    { icon:"📊", label:"Mes gains",              path:"/referral/earnings",               color:C.gold   },
    { icon:"🏆", label:"Récompenses",            path:"/referral/rewards",                color:C.green  },
  ] : role === "LEADER" ? [
    { icon:"⛪", label:"Nouveau Pasteur",         path:"/referral/register-pasteur/new",   color:C.purple },
    { icon:"🌐", label:"Mon réseau",             path:"/referral/network",                color:C.blue   },
    { icon:"📊", label:"Mes gains",              path:"/referral/earnings",               color:C.gold   },
    { icon:"🏆", label:"Récompenses",            path:"/referral/rewards",                color:C.green  },
  ] : [
    // RUM
    { icon:"⭐", label:"Nouveau Leader",          path:"/referral/register-leader/new",    color:C.purple },
    { icon:"🌐", label:"Mon réseau",             path:"/referral/network",                color:C.blue   },
    { icon:"📊", label:"Mes gains",              path:"/referral/earnings",               color:C.gold   },
    { icon:"🏆", label:"Récompenses",            path:"/referral/rewards",                color:C.green  },
  ];

  if (loading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
        <div style={{ width:40, height:40, border:`3px solid ${C.purpleL}`, borderTop:`3px solid ${C.purple}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding:"20px 16px", maxWidth:960, margin:"0 auto" }}>

      {/* ── Bannière ── */}
      <div style={{
        background:"linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        borderRadius:16, padding:"20px 24px", marginBottom:24,
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16,
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

      {/* ── Mode Pasteur (2 modes d'action) ── */}
      {role === "PASTEUR" && (
        <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"16px 20px", marginBottom:24 }}>
          <p style={{ margin:"0 0 12px", fontWeight:800, color:C.dark, fontSize:14 }}>⛪ Mode d'action Pasteur</p>
          <div style={{ display:"flex", gap:10 }}>
            {[
              { id:"responsable", label:"🤝 Enregistrer un Responsable", desc:"Créer un nouveau Responsable sous vous" },
              { id:"client",      label:"👤 Enregistrer un Client",       desc:"Inscrire directement un client final" },
            ].map(m => (
              <button key={m.id} onClick={() => setPasteurMode(m.id)}
                style={{
                  flex:1, padding:"12px 14px", borderRadius:10, border:`2px solid ${pasteurMode===m.id ? C.purple : C.border}`,
                  background:pasteurMode===m.id ? C.purpleL : "#fff",
                  cursor:"pointer", textAlign:"left", transition:"all .2s",
                }}>
                <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:700, color:pasteurMode===m.id ? C.purple : C.dark }}>{m.label}</p>
                <p style={{ margin:0, fontSize:11, color:C.slate }}>{m.desc}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate(pasteurMode === "responsable" ? "/referral/register-responsable/new" : "/referral/clients/new")}
            style={{ marginTop:12, padding:"10px 20px", background:C.purple, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            ➕ {pasteurMode === "responsable" ? "Créer un Responsable" : "Enregistrer un Client"}
          </button>
        </div>
      )}

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

      {/* ── Lien de recrutement ── */}
      {link && (
        <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", marginBottom:24 }}>
          <p style={{ margin:"0 0 12px", fontWeight:800, color:C.dark, fontSize:15 }}>🔗 Mon lien de recrutement</p>
          <div style={{ background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:C.purple, fontWeight:600, wordBreak:"break-all", flex:1 }}>{link.link}</span>
            <span style={{ background:C.purpleL, color:C.purple, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
              Code : {link.code}
            </span>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={copyLink}
              style={{ padding:"8px 18px", borderRadius:8, border:`1.5px solid ${C.purple}`, background:C.purpleL, color:C.purple, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
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
        <div onClick={() => navigate("/referral/network")}
          style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", cursor:"pointer", transition:"box-shadow 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:15 }}>🌐 Mon réseau</p>
            <span style={{ fontSize:12, color:C.purple, fontWeight:700 }}>Voir le détail →</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10 }}>
            {[
              { label:"Total",      value:stats.network_size,        color:C.purple },
              { label:"Directs",    value:stats.referrals,           color:C.blue   },
              { label:"Actifs",     value:stats.clients?.active,     color:C.teal   },
              { label:"En attente", value:stats.clients?.pending,    color:C.slate  },
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
