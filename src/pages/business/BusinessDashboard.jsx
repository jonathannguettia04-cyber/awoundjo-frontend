// src/pages/BusinessDashboard.jsx
// ═══════════════════════════════════════════════════════════════
//  AWOUNDJÔ BUSINESS — Dashboard membre (version standalone)
//  Utilisé si vous préférez un dashboard tout-en-un
//  plutôt que les pages séparées de BusinessPages.jsx
//
//  CORRECTIONS APPLIQUÉES :
//  1. authHeaders() lit uniquement "business_token"
//  2. apiFetch() appelle /api/business/* (pas /api/business/dashboard)
//  3. Champs TabAccueil alignés sur getDashboardStats() :
//       stats.commissions.total_earned (pas total_gains)
//       stats.commissions.pending      (pas gains_pending)
//       stats.commissions.paid         (pas gains_payes)
//       stats.network.network_size     (pas reseau.total)
//       stats.network.direct_members   (pas reseau.niveau_1/2)
//  4. TabReseau : data.reseau → data.network.level1 / level2
//  5. TabCommissions : /commissions pagination OK
//     champs : montant / rate_pct / niveau / status / amount_xof
//  6. TabBonus : /bonus-pool → data.history + data.current_pool
//     champs mois/annee/montant_total (pas nb_payments / statut)
//  7. TabInviter : data.code / data.link / data.child_role
//     (pas data.lien_invitation, pas data.member.code_invitation)
//  8. member.inscription → member.created_at
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Palette ─────────────────────────────────────────────────────
const T = {
  gold:    "#C9933A",
  goldL:   "#FBF3E3",
  goldD:   "#8B6520",
  dark:    "#0C0C0F",
  darker:  "#060608",
  surface: "#14141A",
  card:    "#1C1C26",
  border:  "#2A2A38",
  muted:   "#6B6B85",
  text:    "#E8E8F0",
  textSub: "#9898B0",
  green:   "#22C55E",
  greenL:  "#052E16",
  red:     "#EF4444",
  redL:    "#2D1010",
  blue:    "#3B82F6",
  blueL:   "#0A1929",
};

const ROLE_META = {
  DIRECTRICE:  { icon: "👑", label: "Directrice",  color: "#C9933A" },
  LEADER:      { icon: "⭐", label: "Leader",       color: "#8B5CF6" },
  SUPERVISEUR: { icon: "🔷", label: "Superviseur",  color: "#3B82F6" },
  RECRUTEUR:   { icon: "🤝", label: "Recruteur",    color: "#22C55E" },
};

const fmt    = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtNum = (n) => Number(n || 0).toLocaleString("fr-FR");

// FIX : lit uniquement "business_token"
function authHeaders() {
  const token = localStorage.getItem("business_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path) {
  const res  = await fetch(`${BASE}/api/business${path}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Erreur API");
  return data;
}

// ── Spinner ──────────────────────────────────────────────────────
function Spin({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${T.border}`,
      borderTop: `2px solid ${T.gold}`,
      borderRadius: "50%",
      animation: "biz-spin .7s linear infinite",
      margin: "0 auto",
    }} />
  );
}

// ── Badge statut ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ACTIVE:    { label: "Actif",       bg: T.greenL, color: T.green   },
    PENDING:   { label: "En attente",  bg: "#1A1A00", color: "#EAB308" },
    SUSPENDED: { label: "Suspendu",    bg: T.redL,   color: T.red     },
    VALIDATED: { label: "Validé",      bg: T.greenL, color: T.green   },
    PAID:      { label: "Payé",        bg: T.blueL,  color: T.blue    },
  };
  const s = map[status] || { label: status, bg: T.border, color: T.muted };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

// ── Carte stat ────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent || T.gold}, transparent)`,
      }} />
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: accent || T.gold, fontFamily: "'DM Mono', monospace" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Onglets ───────────────────────────────────────────────────────
const TABS = [
  { id: "accueil",     label: "Accueil",     icon: "🏠" },
  { id: "reseau",      label: "Mon Réseau",  icon: "🌐" },
  { id: "commissions", label: "Commissions", icon: "💰" },
  { id: "bonus",       label: "Bonus Pool",  icon: "🎯" },
  { id: "inviter",     label: "Inviter",     icon: "🔗" },
  { id: "retrait",     label: "Retrait",     icon: "💸" },
  { id: "clients",     label: "Mes Clients", icon: "🏥" },
];

// ── Tab Accueil ───────────────────────────────────────────────────
// FIX : tous les champs viennent de getDashboardStats()
function TabAccueil({ data }) {
  const { member, stats } = data;
  const comm = stats?.commissions || {};
  const net  = stats?.network     || {};
  const rm   = ROLE_META[member.role] || ROLE_META.RECRUTEUR;

  // Commissions récentes : on les charge séparément
  const [recentes, setRecentes] = useState([]);
  useEffect(() => {
    apiFetch("/commissions")
      .then(d => setRecentes((d.commissions || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const totalDirect = Object.values(net.direct_members || {})
    .reduce((acc, r) => acc + Number(r.total || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Profil card */}
      <div style={{
        background: `linear-gradient(135deg, ${T.card}, #1E1830)`,
        border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 28px",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -30, top: -30,
          fontSize: 120, opacity: 0.04, userSelect: "none",
        }}>{rm.icon}</div>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: `linear-gradient(135deg, ${rm.color}33, ${rm.color}11)`,
          border: `2px solid ${rm.color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, flexShrink: 0,
        }}>{rm.icon}</div>
        <div>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            RÉSEAU AWOUNDJÔ BUSINESS
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>{rm.label}</div>
          <div style={{ fontSize: 16, color: T.textSub, fontWeight: 600, marginTop: 2 }}>{member.name}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <StatusBadge status={member.status} />
            {/* FIX : created_at (pas inscription) */}
            {member.created_at && (
              <span style={{ fontSize: 11, color: T.muted }}>
                Depuis {new Date(member.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats principales — FIX champs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <StatCard icon="💰" label="Total gains"    value={fmt(comm.total_earned)} sub={`${fmtNum(Number(comm.direct_count || 0) + Number(comm.network_count || 0))} commission(s)`} accent={T.gold} />
        <StatCard icon="⏳" label="En attente"     value={fmt(comm.pending)}      sub="À valider"           accent="#EAB308" />
        <StatCard icon="✅" label="Payé"           value={fmt(comm.paid)}                                   accent={T.green} />
        <StatCard icon="🌐" label="Mon réseau"     value={fmtNum(net.network_size || 0)} sub={`Directs : ${totalDirect}`}    accent={T.blue} />
      </div>

      {/* Règle commissions */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
          📋 <span>Règle de commission Business</span>
        </div>
        {[
          { niveau: "Niveau 1",    desc: "Vous apportez un client",          taux: "10%", color: T.gold     },
          { niveau: "Niveau 2",    desc: "Votre parrain (sur vos clients)",   taux: "5%",  color: "#8B5CF6" },
          { niveau: "Pool global", desc: "Bonus mensuel partagé",             taux: "2%",  color: T.blue    },
        ].map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: 10, marginBottom: 6,
            background: "#12121A", border: `1px solid ${T.border}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.niveau}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{r.desc}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: r.color, fontFamily: "'DM Mono', monospace" }}>{r.taux}</div>
          </div>
        ))}
        <div style={{
          marginTop: 10, padding: "8px 14px", borderRadius: 8,
          background: `${T.gold}15`, border: `1px solid ${T.gold}33`,
          fontSize: 12, color: T.gold, textAlign: "center", fontWeight: 700,
        }}>
          Maximum distribué = 17% · Aucune commission au-dessus du niveau 2
        </div>
      </div>

      {/* Dernières commissions — FIX champs : montant / rate_pct / niveau / status / amount_xof */}
      {recentes.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 800, color: T.text }}>
            📈 Dernières commissions
          </div>
          {recentes.map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: i < recentes.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                  Niveau {c.niveau} — {c.rate_pct}%
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                  {c.amount_xof ? ` · Base ${fmt(c.amount_xof)}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontWeight: 900, color: T.gold, fontFamily: "monospace" }}>
                  +{fmt(c.montant)}
                </span>
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab Réseau ────────────────────────────────────────────────────
// FIX : data.network.level1 / level2 (pas data.reseau.niveau1/2)
//       Champs membres : name / role / status / created_at (pas nom)
function TabReseau({ network }) {
  const niveau1 = network?.level1 || [];
  const niveau2 = network?.level2 || [];

  function MemberRow({ m, level }) {
    const rm = ROLE_META[m.role] || {};
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 20px", borderBottom: `1px solid ${T.border}`,
        background: "transparent", transition: "background .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#18181F"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {level === 2 && <div style={{ width: 2, height: 36, background: T.border, borderRadius: 2, marginLeft: 16 }} />}
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: `${rm.color || T.gold}20`, border: `1.5px solid ${rm.color || T.gold}50`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>{rm.icon || "👤"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* FIX : m.name (pas m.nom) */}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {m.name || m.email}
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>
            {rm.label || m.role}
            {m.parent_name && <span> · via {m.parent_name}</span>}
            {m.created_at && " · " + new Date(m.created_at).toLocaleDateString("fr-FR")}
          </div>
        </div>
        <StatusBadge status={m.status} />
      </div>
    );
  }

  if (!niveau1.length && !niveau2.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.textSub }}>Votre réseau est vide</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>Utilisez votre lien d'invitation pour recruter</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="biz-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <StatCard icon="🤝" label="Total réseau" value={fmtNum(niveau1.length + niveau2.length)} accent={T.gold} />
        <StatCard icon="1️⃣" label="Niveau 1"    value={fmtNum(niveau1.length)} accent="#8B5CF6" sub="Directs" />
        <StatCard icon="2️⃣" label="Niveau 2"    value={fmtNum(niveau2.length)} accent={T.blue}  sub="Indirects" />
      </div>

      {niveau1.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8B5CF6" }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Niveau 1 — Directs ({niveau1.length})
            </span>
          </div>
          {niveau1.map((m, i) => <MemberRow key={i} m={m} level={1} />)}
        </div>
      )}

      {niveau2.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Niveau 2 — Indirects ({niveau2.length})
            </span>
          </div>
          {niveau2.map((m, i) => <MemberRow key={i} m={m} level={2} />)}
        </div>
      )}
    </div>
  );
}

// ── Tab Commissions ────────────────────────────────────────────────
// FIX : champs montant / rate_pct / niveau / status / amount_xof
function TabCommissions() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/commissions?page=${page}&limit=15`)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>;
  if (!data)   return <div style={{ color: T.red, padding: 20 }}>Erreur de chargement</div>;

  const { commissions = [], totals = {} } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="biz-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCard icon="📊" label="Total commissions" value={fmt(totals.total_earned)} accent={T.gold} />
        <StatCard icon="🔢" label="Ce mois"           value={fmt(totals.this_month)}   accent={T.blue} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        {commissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: T.muted, fontSize: 14 }}>
            Aucune commission pour le moment
          </div>
        ) : commissions.map((c, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: i < commissions.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: c.niveau === 1 ? `${T.gold}20` : `${T.blue}20`,
                border: `1.5px solid ${c.niveau === 1 ? T.gold : T.blue}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>
                {c.niveau === 1 ? "1️⃣" : "2️⃣"}
              </div>
              <div>
                {/* FIX : rate_pct (pas taux) */}
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                  Commission niveau {c.niveau} ({c.rate_pct}%)
                </div>
                {/* FIX : amount_xof (pas base_montant) */}
                <div style={{ fontSize: 11, color: T.muted }}>
                  {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                  {c.amount_xof ? ` · Base ${fmt(c.amount_xof)}` : ""}
                </div>
                {c.source_name && (
                  <div style={{ fontSize: 11, color: T.muted }}>Source : {c.source_name}</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={{ fontWeight: 900, color: T.gold, fontSize: 15, fontFamily: "monospace" }}>
                +{fmt(c.montant)}
              </span>
              {/* FIX : status (pas statut) */}
              <StatusBadge status={c.status} />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination simple */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.border}`, background: page===1?T.surface:T.card, color: page===1?T.muted:T.text, cursor: page===1?"default":"pointer", fontSize: 13 }}>
          ← Préc.
        </button>
        <span style={{ fontSize: 13, color: T.muted }}>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={commissions.length < 15}
          style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.text, cursor: commissions.length<15?"default":"pointer", fontSize: 13 }}>
          Suiv. →
        </button>
      </div>
    </div>
  );
}

// ── Tab Bonus Pool ─────────────────────────────────────────────────
// FIX : data.history[]{mois/annee/montant_total} + data.current_pool
//       Pas de champ nb_payments ni statut dans le schéma
function TabBonus() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/bonus-pool")
      .then(d => setData(d)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const now    = new Date();

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>;

  const history = data?.history      || [];
  const current = data?.current_pool || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        background: `linear-gradient(135deg, ${T.gold}15, ${T.card})`,
        border: `1px solid ${T.gold}40`, borderRadius: 14, padding: "20px 24px",
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.gold, marginBottom: 10 }}>
          🎯 Comment fonctionne le Bonus Pool ?
        </div>
        <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
          À chaque paiement client validé, <strong style={{ color: T.gold }}>2%</strong> sont ajoutés automatiquement dans le pool mensuel global.
          En fin de mois, le pool est distribué entre les membres actifs selon les règles de performance.
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Accumulation automatique", "Distribution mensuelle", "Règles admin"].map((t, i) => (
            <span key={i} style={{
              padding: "4px 12px", borderRadius: 99,
              background: `${T.gold}20`, color: T.gold, fontSize: 11, fontWeight: 700,
            }}>✦ {t}</span>
          ))}
        </div>
      </div>

      {/* Pool courant */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Pool {MONTHS[now.getMonth()]} {now.getFullYear()} (en cours)
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: T.gold, fontFamily: "monospace" }}>
          {fmt(current)}
        </div>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 15, color: T.textSub }}>Aucun historique disponible</div>
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Historique Bonus Pool
          </div>
          {history.map((p, i) => {
            const isCurrent = p.mois === (now.getMonth() + 1) && p.annee === now.getFullYear();
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: i < history.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: `${T.gold}15`, border: `1.5px solid ${T.gold}40`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: T.gold }}>
                      {MONTHS[(p.mois || 1) - 1]}
                    </div>
                    <div style={{ fontSize: 10, color: T.muted }}>{p.annee}</div>
                  </div>
                  <div>
                    {/* FIX : montant_total (pas montant) */}
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                      {fmt(p.montant_total)}
                    </div>
                  </div>
                </div>
                {/* FIX : pas de champ "statut" → on déduit du mois courant */}
                <span style={{
                  padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: isCurrent ? `${T.gold}20` : `${T.blue}20`,
                  color:      isCurrent ? T.gold         : T.blue,
                }}>
                  {isCurrent ? "En cours" : "Clôturé"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab Inviter ────────────────────────────────────────────────────
// FIX : data.code / data.link / data.child_role / data.whatsapp_message
//       (pas data.lien_invitation ni data.member.code_invitation)
function TabInviter() {
  const [data,   setData]   = useState(null);
  const [copied, setCopied] = useState(null);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    apiFetch("/invitation-link")
      .then(d => setData(d)).catch(console.error).finally(() => setLoading(false));
  }, []);

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    });
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>;
  if (!data)   return <div style={{ color: T.red, padding: 20 }}>Erreur de chargement</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Code d'invitation */}
      <div style={{
        background: `linear-gradient(135deg, #14141F, #1A1430)`,
        border: `1px solid ${T.gold}40`, borderRadius: 16, padding: "28px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: `${T.gold}08`, border: `1px solid ${T.gold}15` }} />
        <div style={{ fontSize: 13, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Mon code d'invitation
        </div>
        {/* FIX : data.code */}
        <div style={{
          fontSize: 32, fontWeight: 900, letterSpacing: "0.15em", color: T.gold,
          fontFamily: "monospace", background: `${T.gold}10`, borderRadius: 12,
          padding: "14px 28px", display: "inline-block", border: `2px dashed ${T.gold}40`, marginBottom: 8,
        }}>
          {data.code}
        </div>
        {/* FIX : data.child_role */}
        {data.child_role ? (
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 20 }}>
            Invitez des <strong style={{ color: T.gold }}>{data.child_role}s</strong> dans votre réseau
          </div>
        ) : (
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
            En tant que Recruteur, vous ne pouvez pas inviter d'autres membres
          </div>
        )}
        <button onClick={() => copy(data.code, "code")} style={{
          padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
          background: copied==="code" ? T.greenL : `${T.gold}20`,
          color:      copied==="code" ? T.green   : T.gold,
          border: `1px solid ${copied==="code" ? T.green : T.gold}40`,
          fontWeight: 800, fontSize: 13, transition: "all .2s",
        }}>
          {copied==="code" ? "✅ Copié !" : "📋 Copier le code"}
        </button>
      </div>

      {/* Lien — FIX : data.link */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 800, color: T.text }}>
          🔗 Lien d'invitation
        </div>
        <div style={{ padding: 16 }}>
          <div style={{
            background: "#0C0C12", borderRadius: 10, padding: "12px 16px",
            border: `1px solid ${T.border}`, marginBottom: 12,
            fontSize: 12, color: T.muted, fontFamily: "monospace",
            wordBreak: "break-all", lineHeight: 1.6,
          }}>
            {data.link}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => copy(data.link, "link")} style={{
              flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer",
              background: copied==="link" ? T.greenL : `${T.gold}20`,
              color:      copied==="link" ? T.green   : T.gold,
              border: `1px solid ${copied==="link" ? T.green : T.gold}40`,
              fontWeight: 800, fontSize: 13, transition: "all .2s",
            }}>
              {copied==="link" ? "✅ Copié !" : "📋 Copier le lien"}
            </button>
            {/* FIX : data.whatsapp_message */}
            {data.whatsapp_message && (
              <a href={data.whatsapp_message} target="_blank" rel="noreferrer" style={{
                flex: 1, padding: "12px", borderRadius: 10, textDecoration: "none",
                background: "#0D2318", color: "#22C55E",
                border: "1px solid #22C55E40",
                fontWeight: 800, fontSize: 13, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                📲 Partager WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Hiérarchie */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 16 }}>
          🏗️ Hiérarchie du réseau Business
        </div>
        {[
          { role: "DIRECTRICE",  icon: "👑", color: "#C9933A", note: "Sommet"   },
          { role: "LEADER",      icon: "⭐", color: "#8B5CF6", note: ""         },
          { role: "SUPERVISEUR", icon: "🔷", color: "#3B82F6", note: ""         },
          { role: "RECRUTEUR",   icon: "🤝", color: "#22C55E", note: "Apporteur" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: `${r.color}20`, border: `2px solid ${r.color}60`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                outline: data.role === r.role ? `3px solid ${r.color}` : "none", outlineOffset: 2,
              }}>{r.icon}</div>
              {i < 3 && <div style={{ width: 2, height: 16, background: T.border, margin: "2px 0" }} />}
            </div>
            <div style={{ fontSize: 13, paddingBottom: i < 3 ? 18 : 0 }}>
              <span style={{ fontWeight: data.role===r.role ? 900 : 600, color: data.role===r.role ? r.color : T.textSub }}>
                {r.role}
              </span>
              {data.role === r.role && <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>← Vous</span>}
              {r.note && <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>· {r.note}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab Retrait commissions ────────────────────────────────────────
// Appelle POST /api/commissions/requests  (monté via commissionRequestRoutes.js)
// Le JWT "business_token" est lu par authenticateToken → resolveIdentity
// → network: BUSINESS, field: business_member_id
function TabRetrait() {
  const [eligibility, setEligibility] = useState(null);
  const [history,     setHistory]     = useState([]);
  const [loadingElig, setLoadingElig] = useState(true);
  const [loadingHist, setLoadingHist] = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  // Formulaire
  const [method,  setMethod]  = useState("WAVE");
  const [details, setDetails] = useState({ phone: "" });

  const COMM_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api/commissions";

  async function commFetch(path, opts = {}) {
    const token = localStorage.getItem("business_token");
    const res   = await fetch(`${COMM_BASE}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || data?.message || `Erreur ${res.status}`);
    return data;
  }

  const loadData = () => {
    setLoadingElig(true);
    commFetch("/requests/eligibility")
      .then(d => setEligibility(d))
      .catch(e => setError(e.message))
      .finally(() => setLoadingElig(false));

    setLoadingHist(true);
    commFetch("/requests/me")
      .then(d => setHistory(d.requests || []))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  };

  useEffect(loadData, []);

  const METHODS = [
    { id: "WAVE",          label: "Wave",            icon: "🌊" },
    { id: "ORANGE_MONEY",  label: "Orange Money",    icon: "🟠" },
    { id: "MTN_MONEY",     label: "MTN Mobile Money",icon: "🟡" },
    { id: "VIREMENT",      label: "Virement bancaire",icon: "🏦" },
  ];

  const needsPhone = method !== "VIREMENT";

  async function handleSubmit() {
    setError(""); setSuccess("");
    if (needsPhone && !details.phone.trim()) {
      setError("Numéro de téléphone requis pour ce mode de paiement."); return;
    }
    if (method === "VIREMENT" && !details.rib?.trim()) {
      setError("RIB / IBAN requis pour un virement."); return;
    }
    setSubmitting(true);
    try {
      const res = await commFetch("/requests", {
        method: "POST",
        body: JSON.stringify({ payment_method: method, payment_details: details }),
      });
      setSuccess(`✅ Demande soumise (${(res.amount_requested || 0).toLocaleString("fr-FR")} FCFA). Traitement sous 48h.`);
      loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const STATUS_MAP = {
    PENDING:   { label: "En attente",  bg: "#1A1A00", color: "#EAB308" },
    VALIDATED: { label: "Validé",      bg: T.greenL,  color: T.green   },
    PAID:      { label: "Payé",        bg: T.blueL,   color: T.blue    },
    REJECTED:  { label: "Rejeté",      bg: T.redL,    color: T.red     },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #14141F 0%, #1C1028 100%)",
        border: `1px solid ${T.gold}30`, borderRadius: 16, padding: "22px 26px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: `${T.gold}06` }} />
        <div style={{ fontSize: 28, marginBottom: 8 }}>💸</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: T.text }}>Demande de paiement</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
          Seuil requis : <strong style={{ color: T.gold }}>25 adhésions actives</strong> depuis la dernière demande
        </div>
      </div>

      {/* Éligibilité */}
      {loadingElig ? (
        <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
      ) : eligibility && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            📊 Votre éligibilité
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Solde disponible */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 12, background: `${T.gold}10`, border: `1px solid ${T.gold}30` }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Solde disponible</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: T.gold, fontFamily: "monospace" }}>
                  {(eligibility.available_balance_xof || 0).toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              <div style={{ fontSize: 36 }}>💰</div>
            </div>

            {/* Progress adhésions */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: T.textSub }}>Adhésions depuis dernière demande</span>
                <span style={{ fontWeight: 900, color: eligibility.eligible ? T.green : "#EAB308" }}>
                  {eligibility.adhesions_since_last} / {eligibility.threshold}
                </span>
              </div>
              <div style={{ background: T.border, borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{
                  height: 8, borderRadius: 99, transition: "width .4s",
                  width: `${Math.min(100, Math.round((eligibility.adhesions_since_last / eligibility.threshold) * 100))}%`,
                  background: eligibility.eligible
                    ? `linear-gradient(90deg, ${T.green}, #16A34A)`
                    : `linear-gradient(90deg, #EAB308, #CA8A04)`,
                }} />
              </div>
              {!eligibility.eligible && !eligibility.pending_request && (
                <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                  Il manque <strong style={{ color: "#EAB308" }}>{eligibility.adhesions_missing} adhésion(s)</strong> pour débloquer le retrait.
                </div>
              )}
            </div>

            {/* Demande PENDING existante */}
            {eligibility.pending_request && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "#1A1A00", border: "1px solid #EAB30840", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>⏳</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#EAB308" }}>Demande en cours de traitement</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                    Soumise le {new Date(eligibility.pending_request.created_at).toLocaleDateString("fr-FR")}. Attendez sa résolution.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulaire de demande — affiché seulement si éligible */}
      {eligibility?.eligible && !eligibility?.pending_request && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            📝 Nouvelle demande
          </div>
          <div style={{ padding: "20px" }}>

            {error && (
              <div style={{ background: T.redL, border: `1px solid ${T.red}40`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: T.red, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ background: T.greenL, border: `1px solid ${T.green}40`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: T.green, marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                {success}
              </div>
            )}

            {/* Méthode de paiement */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Méthode de paiement
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {METHODS.map(m => (
                  <div key={m.id} onClick={() => setMethod(m.id)} style={{
                    padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${method === m.id ? T.gold : T.border}`,
                    background: method === m.id ? `${T.gold}12` : "#12121A",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "all .15s",
                  }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: method === m.id ? 800 : 500, color: method === m.id ? T.gold : T.textSub }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Détails de paiement */}
            {needsPhone && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  placeholder="07 XX XX XX XX"
                  value={details.phone}
                  onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    background: "#0C0C12", border: `1px solid ${T.border}`,
                    color: T.text, fontSize: 14, fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
            {method === "VIREMENT" && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  RIB / IBAN
                </label>
                <input
                  type="text"
                  placeholder="CI XX XXXX XXXX XXXX XXXX XXXX XXX"
                  value={details.rib || ""}
                  onChange={e => setDetails(d => ({ ...d, rib: e.target.value }))}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    background: "#0C0C12", border: `1px solid ${T.border}`,
                    color: T.text, fontSize: 13, fontFamily: "monospace", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* Récapitulatif */}
            <div style={{ background: "#0C0C12", border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
              {[
                { label: "Montant demandé", value: `${(eligibility.available_balance_xof || 0).toLocaleString("fr-FR")} FCFA`, color: T.gold },
                { label: "Méthode",         value: METHODS.find(m => m.id === method)?.label },
                { label: "Adhésions",       value: `${eligibility.adhesions_since_last} validées` },
              ].map((row, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: T.muted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color || T.text }}>{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={submitting} style={{
              width: "100%", padding: "14px 20px", borderRadius: 10, border: "none",
              background: submitting ? T.border : `linear-gradient(135deg, ${T.gold}, ${T.goldD})`,
              color: submitting ? T.muted : "#0C0C0F",
              fontSize: 14, fontWeight: 900, cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "all .15s",
            }}>
              {submitting ? "⏳ Envoi en cours…" : "💸 Soumettre la demande"}
            </button>
          </div>
        </div>
      )}

      {/* Historique des demandes */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          📋 Historique des demandes
        </div>
        {loadingHist ? (
          <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>
        ) : history.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, color: T.textSub }}>Aucune demande pour l'instant</div>
          </div>
        ) : (
          history.map((req, i) => {
            const s = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
            return (
              <div key={req.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: i < history.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: T.gold, fontFamily: "monospace" }}>
                    {(req.amount_requested || 0).toLocaleString("fr-FR")} FCFA
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
                    {req.payment_method}
                    {req.created_at && " · " + new Date(req.created_at).toLocaleDateString("fr-FR")}
                    {req.admin_note && <span style={{ color: T.red }}> · {req.admin_note}</span>}
                  </div>
                </div>
                <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap", marginLeft: 12 }}>
                  {s.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Modal Créer Client ─────────────────────────────────────────────
const JEKO_METHODS_LIST = [
  { value: "orange", label: "Orange",  icon: "🟠" },
  { value: "wave",   label: "Wave",    icon: "🔵" },
  { value: "mtn",    label: "MTN",     icon: "🟡" },
  { value: "moov",   label: "Moov",    icon: "🟢" },
  { value: "djamo",  label: "Djamo",   icon: "💜" },
];

function CreateClientModal({ onClose, onCreated }) {
  const [step,         setStep]         = useState(0);
  const [plans,        setPlans]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [city,         setCity]         = useState("");
  const [isReturning,  setIsReturning]  = useState(false);
  const [expDate,      setExpDate]      = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payMethod,    setPayMethod]    = useState("cash");
  const [jekoMethod,   setJekoMethod]   = useState("orange");
  const [result,       setResult]       = useState(null);
  const [copied,       setCopied]       = useState(null);

  useEffect(() => {
    apiFetch("/plans")
      .then(d => setPlans(d.plans || []))
      .catch(() => setError("Impossible de charger les formules."));
  }, []);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    });
  }

  function goStep1() {
    setError("");
    if (!name.trim())  return setError("Le nom est requis.");
    if (!phone.trim()) return setError("Le téléphone est requis.");
    if (isReturning && !expDate) return setError("La date d'expiration est requise pour un ancien client.");
    setStep(1);
  }

  function goStep2() {
    setError("");
    if (!selectedPlan) return setError("Veuillez choisir une formule.");
    setStep(2);
  }

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      const createData = await apiFetch("/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                name.trim(),
          phone:               phone.trim(),
          city:                city.trim() || undefined,
          plan_slug:           selectedPlan.slug,
          is_returning_client: isReturning,
          expiration_date:     isReturning ? expDate : undefined,
        }),
      });
      const { client, access_code, mutual_number, adhesion_fee } = createData;
      if (isReturning) {
        setResult({ client, access_code, mutual_number, adhesion_fee: 0, isReturning: true });
        setStep(3); onCreated?.(); return;
      }
      if (payMethod === "cash") {
        await apiFetch(`/clients/${client.id}/pay-adhesion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: adhesion_fee }),
        });
        setResult({ client, access_code, mutual_number, adhesion_fee, paymentMethod: "cash" });
        setStep(3); onCreated?.(); return;
      }
      if (payMethod === "jeko") {
        const jekoData = await apiFetch(`/clients/${client.id}/pay-adhesion-jeko`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jeko_method: jekoMethod }),
        });
        const redirectUrl = jekoData?.data?.redirect_url;
        if (redirectUrl) window.open(redirectUrl, "_blank");
        setResult({ client, access_code, mutual_number, adhesion_fee, paymentMethod: "jeko", pending: !redirectUrl });
        setStep(3); onCreated?.();
      }
    } catch (e) {
      setError(e?.error || e?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const STEPS = ["Infos", "Formule", "Paiement", "Confirmation"];
  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    background: "#0C0C12", border: `1px solid ${T.border}`,
    color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
  const btnGold = {
    padding: "12px 24px", borderRadius: 10, border: "none", cursor: "pointer",
    background: `linear-gradient(135deg, ${T.gold}, ${T.goldD})`,
    color: "#0C0C0F", fontWeight: 900, fontSize: 14, fontFamily: "inherit",
  };
  const btnGhost = {
    padding: "12px 24px", borderRadius: 10, cursor: "pointer",
    background: "transparent", border: `1px solid ${T.border}`,
    color: T.textSub, fontWeight: 600, fontSize: 14, fontFamily: "inherit",
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.75)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20,
        width: "100%", maxWidth: 500, maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,.8)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>🏥 Nouveau client mutualiste</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Étape {step + 1} / {STEPS.length} — {STEPS[step]}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= step ? T.gold : T.border, transition: "background .3s" }} />
            ))}
          </div>
        </div>

        {/* Corps */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {error && (
            <div style={{ background: T.redL, border: `1px solid ${T.red}40`, borderRadius: 10, padding: "11px 16px", fontSize: 13, color: T.red, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Nom complet *</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="ex : Kouamé Adjoua" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Téléphone *</div>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0707080808" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Ville</div>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Abidjan" style={inp} />
              </div>
              <div style={{ background: "#14110A", border: `1px solid ${T.gold}30`, borderRadius: 12, padding: "14px 16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={isReturning} onChange={e => setIsReturning(e.target.checked)} style={{ width: 16, height: 16, accentColor: T.gold }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>Ancien client (migration de dossier)</span>
                </label>
                {isReturning && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Date d'expiration *</div>
                    <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} style={{ ...inp, borderColor: T.gold + "60" }} />
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Date passée → suspendu · Date future → actif</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {plans.length === 0 && <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>}
              {plans.map(plan => (
                <div key={plan.id} onClick={() => setSelectedPlan(plan)} style={{
                  borderRadius: 12, padding: 16, cursor: "pointer",
                  border: `2px solid ${selectedPlan?.id === plan.id ? T.gold : T.border}`,
                  background: selectedPlan?.id === plan.id ? `${T.gold}10` : T.card, transition: "all .15s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{plan.name}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
                        Couverture {plan.coverage_percent}%{plan.benefits?.length > 0 && ` · ${plan.benefits.length} catégorie(s)`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 16, color: T.gold, fontFamily: "monospace" }}>{Number(plan.adhesion_price).toLocaleString("fr-FR")} FCFA</div>
                      <div style={{ fontSize: 11, color: T.muted }}>adhésion</div>
                      <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{Number(plan.monthly_price).toLocaleString("fr-FR")} FCFA/mois</div>
                    </div>
                  </div>
                  {selectedPlan?.id === plan.id && plan.benefits?.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.gold}25`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {plan.benefits.map(b => (
                        <div key={b.category} style={{ fontSize: 11, color: T.textSub, display: "flex", gap: 4 }}>
                          <span style={{ color: T.gold }}>✓</span> {b.category} ({b.coverage_percent}%)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 2 && selectedPlan && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#0C0C12", border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", fontSize: 13 }}>
                <div style={{ fontWeight: 800, color: T.text, marginBottom: 10 }}>Récapitulatif</div>
                <div style={{ color: T.muted, marginBottom: 4 }}>Client : <span style={{ color: T.text, fontWeight: 700 }}>{name}</span> · {phone}</div>
                <div style={{ color: T.muted, marginBottom: 4 }}>Formule : <span style={{ color: T.text, fontWeight: 700 }}>{selectedPlan.name}</span></div>
                <div style={{ color: T.muted }}>Adhésion : <span style={{ color: T.gold, fontWeight: 900, fontSize: 16, fontFamily: "monospace" }}>{Number(selectedPlan.adhesion_price).toLocaleString("fr-FR")} FCFA</span></div>
              </div>
              {isReturning ? (
                <div style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}30`, borderRadius: 12, padding: "14px 16px", fontSize: 13, color: T.gold }}>
                  ✓ Migration de dossier — aucun paiement requis.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mode de paiement</div>
                  {[
                    { id: "cash", icon: "💵", label: "Paiement Cash", sub: "Espèces reçues — activation immédiate" },
                    { id: "jeko", icon: "📱", label: "Paiement Mobile (JEKO)", sub: "Orange, Wave, MTN, Moov, Djamo" },
                  ].map(m => (
                    <div key={m.id} onClick={() => setPayMethod(m.id)} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                      border: `2px solid ${payMethod === m.id ? T.gold : T.border}`,
                      background: payMethod === m.id ? `${T.gold}10` : T.card, transition: "all .15s",
                    }}>
                      <span style={{ fontSize: 28 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{m.label}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{m.sub}</div>
                      </div>
                    </div>
                  ))}
                  {payMethod === "jeko" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                      {JEKO_METHODS_LIST.map(m => (
                        <div key={m.value} onClick={() => setJekoMethod(m.value)} style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                          border: `2px solid ${jekoMethod === m.value ? T.gold : T.border}`,
                          background: jekoMethod === m.value ? `${T.gold}10` : "#0C0C12",
                          fontSize: 11, fontWeight: 700,
                          color: jekoMethod === m.value ? T.gold : T.muted, transition: "all .15s",
                        }}>
                          <span style={{ fontSize: 20 }}>{m.icon}</span>{m.label}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 3 && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: result.pending ? `${T.gold}20` : T.greenL,
                  border: `2px solid ${result.pending ? T.gold : T.green}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, margin: "0 auto 12px",
                }}>{result.pending ? "⏳" : "✅"}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: T.text }}>
                  {result.pending ? "Paiement en attente" : "Client enregistré !"}
                </div>
                {result.pending && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Activation automatique après confirmation du paiement.</div>}
              </div>
              <div style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}40`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Numéro mutualiste</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 900, color: T.gold, letterSpacing: 2 }}>{result.mutual_number}</span>
                  <button onClick={() => copy(result.mutual_number, "num")} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: `1px solid ${T.gold}50`, background: `${T.gold}15`, color: T.gold, cursor: "pointer", fontWeight: 700 }}>
                    {copied === "num" ? "✅" : "📋 Copier"}
                  </button>
                </div>
              </div>
              <div style={{ background: T.blueL, border: `1px solid ${T.blue}40`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.blue, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Code d'accès temporaire (portail client)</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 900, color: T.blue, letterSpacing: 4 }}>{result.access_code}</span>
                  <button onClick={() => copy(result.access_code, "code")} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: `1px solid ${T.blue}50`, background: `${T.blue}15`, color: T.blue, cursor: "pointer", fontWeight: 700 }}>
                    {copied === "code" ? "✅" : "📋 Copier"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>⚠️ À remettre au client — il devra le changer à la première connexion.</div>
              </div>
              <div style={{ background: "#0C0C12", border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 13 }}>
                <div style={{ color: T.muted, marginBottom: 4 }}>Nom : <span style={{ color: T.text, fontWeight: 700 }}>{result.client?.name}</span></div>
                <div style={{ color: T.muted, marginBottom: 4 }}>Téléphone : <span style={{ color: T.textSub }}>{result.client?.phone}</span></div>
                <div style={{ color: T.muted, marginBottom: 4 }}>Formule : <span style={{ color: T.textSub }}>{result.client?.plan}</span></div>
                <div style={{ color: T.muted }}>Statut : <span style={{ fontWeight: 800, color: result.client?.status === "actif" ? T.green : T.gold }}>
                  {result.client?.status === "actif" ? "✅ Actif" : "⏳ En attente"}
                </span></div>
              </div>
              <button onClick={() => copy(`Numéro mutualiste : ${result.mutual_number}\nCode d'accès : ${result.access_code}`, "all")}
                style={{ ...btnGhost, width: "100%", textAlign: "center" }}>
                {copied === "all" ? "✅ Copié !" : "📋 Copier numéro + code"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", gap: 10, background: "#0E0E16", flexShrink: 0 }}>
          <button onClick={() => { if (step === 0) onClose(); else setStep(s => s - 1); }}
            disabled={loading || step === 3} style={{ ...btnGhost, opacity: (loading || step === 3) ? .4 : 1 }}>
            {step === 0 ? "Annuler" : "← Retour"}
          </button>
          {step === 0 && <button onClick={goStep1} style={btnGold}>Suivant →</button>}
          {step === 1 && <button onClick={goStep2} style={btnGold}>Suivant →</button>}
          {step === 2 && (
            <button onClick={handleSubmit} disabled={loading} style={{ ...btnGold, opacity: loading ? .6 : 1 }}>
              {loading ? "⏳ Traitement…" : isReturning ? "✅ Enregistrer" : payMethod === "cash" ? "💵 Confirmer" : "📱 Payer par mobile"}
            </button>
          )}
          {step === 3 && (
            <button onClick={onClose} style={{ ...btnGold, background: `linear-gradient(135deg, ${T.green}, #15803D)` }}>Fermer ✓</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab Clients ────────────────────────────────────────────────────
function TabClients() {
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState({});

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (search)       params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    apiFetch(`/my-clients?${params}`)
      .then(d => { setClients(d.clients || []); setPagination(d.pagination || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const STATUS_MAP = {
    actif:            { label: "Actif",          bg: T.greenL,  color: T.green   },
    attente:          { label: "En attente",     bg: "#1A1A00", color: "#EAB308" },
    suspendu:         { label: "Suspendu",       bg: T.redL,    color: T.red     },
    renewal_required: { label: "Renouvellement", bg: T.blueL,   color: T.blue    },
  };

  const inp = { padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#0C0C12", border: `1px solid ${T.border}`, color: T.text, outline: "none", fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        background: "linear-gradient(135deg, #14141F, #0C1420)", border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "22px 26px", display: "flex",
        justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: T.text }}>🏥 Mes clients mutualistes</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            {pagination.total !== undefined ? `${pagination.total} client(s) enregistré(s)` : "Gérez vos clients depuis votre espace"}
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: "12px 22px", borderRadius: 10, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${T.gold}, ${T.goldD})`,
          color: "#0C0C0F", fontWeight: 900, fontSize: 13, fontFamily: "inherit",
        }}>➕ Nouveau client</button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder="🔍 Nom, téléphone, numéro…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inp, flex: 1, minWidth: 200 }} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ ...inp, minWidth: 160 }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="attente">En attente</option>
          <option value="suspendu">Suspendu</option>
          <option value="renewal_required">Renouvellement</option>
        </select>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 50 }}><Spin size={36} /></div>
        ) : clients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: T.muted }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🏥</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textSub, marginBottom: 6 }}>Aucun client enregistré</div>
            <button onClick={() => setShowModal(true)} style={{
              padding: "12px 24px", borderRadius: 10, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${T.gold}, ${T.goldD})`,
              color: "#0C0C0F", fontWeight: 900, fontSize: 13, fontFamily: "inherit",
            }}>➕ Nouveau client</button>
          </div>
        ) : clients.map((c, i) => {
          const st = STATUS_MAP[c.status] || { label: c.status, bg: T.border, color: T.muted };
          const payOk = c.status_payment === "paid";
          return (
            <div key={c.id} style={{
              display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px",
              borderBottom: i < clients.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: payOk ? T.greenL : "#1A1A00",
                border: `1.5px solid ${payOk ? T.green : "#EAB308"}40`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{payOk ? "✅" : "⏳"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{c.name}</span>
                  <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 10, fontWeight: 800, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>📞 {c.phone}{c.city && ` · 📍 ${c.city}`}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: T.gold, background: `${T.gold}10`, border: `1px solid ${T.gold}30`, borderRadius: 6, padding: "2px 8px" }}>{c.mutual_number}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: T.blueL, border: `1px solid ${T.blue}30`, borderRadius: 6, padding: "2px 8px" }}>{c.plan}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: T.muted }}>{c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}</div>
                {c.expiration_date && <div style={{ fontSize: 11, color: T.textSub, marginTop: 3 }}>Exp : {new Date(c.expiration_date).toLocaleDateString("fr-FR")}</div>}
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: payOk ? T.green : "#EAB308" }}>
                  {payOk ? "Adhésion payée" : "Paiement requis"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.border}`, background: page === 1 ? T.surface : T.card, color: page === 1 ? T.muted : T.text, cursor: page === 1 ? "default" : "pointer", fontSize: 13, fontFamily: "inherit" }}>← Préc.</button>
          <span style={{ fontSize: 13, color: T.muted }}>Page {page} / {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
            style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.text, cursor: page === pagination.pages ? "default" : "pointer", fontSize: 13, fontFamily: "inherit" }}>Suiv. →</button>
        </div>
      )}

      {showModal && <CreateClientModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────
export default function BusinessDashboard() {
  const [tab,     setTab]     = useState("accueil");
  const [data,    setData]    = useState(null);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/dashboard"),
      apiFetch("/network"),
    ])
      .then(([dash, net]) => { setData(dash); setNetwork(net); setError(""); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{
      minHeight: "100vh", background: "#060608",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif", color: "#E8E8F0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes biz-spin    { to { transform: rotate(360deg); } }
        @keyframes biz-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2A2A38; border-radius: 4px; }
        @media (max-width: 768px) {
          .biz-dash-header { padding: 12px 14px !important; }
          .biz-dash-header-title { font-size: 14px !important; }
          .biz-dash-tabs { padding: 0 8px !important; }
          .biz-dash-tab { padding: 12px 10px !important; font-size: 12px !important; }
          .biz-dash-content { padding: 16px 12px !important; }
          .biz-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .biz-grid-2 { grid-template-columns: 1fr !important; }
          .biz-stat-card { padding: 14px 12px !important; }
          .biz-member-row { padding: 10px 12px !important; }
          .biz-member-row-right { flex-direction: column !important; align-items: flex-end !important; gap: 2px !important; }
          .biz-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
        @media (max-width: 480px) {
          .biz-grid-3 { grid-template-columns: 1fr !important; }
          .biz-dash-header-name { display: none; }
          .biz-dash-tab .biz-tab-label { display: none; }
        }
      `}</style>

      {/* Header */}
      <div className="biz-dash-header" style={{
        background: "#14141A", borderBottom: "1px solid #2A2A38",
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #C9933A, #8B6520)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 4px 16px #C9933A40",
          }}>💼</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#C9933A", letterSpacing: "-0.01em" }}>
              Awoundjô Business
            </div>
            <div style={{ fontSize: 11, color: "#6B6B85" }}>Réseau MLM · Tableau de bord</div>
          </div>
        </div>
        {data?.member && (
          <div style={{
            padding: "6px 14px", borderRadius: 99,
            background: `${ROLE_META[data.member.role]?.color || T.gold}20`,
            color: ROLE_META[data.member.role]?.color || T.gold,
            fontSize: 12, fontWeight: 700,
            border: `1px solid ${ROLE_META[data.member.role]?.color || T.gold}40`,
            // responsive
          }}>
            {ROLE_META[data.member.role]?.icon} {data.member.name}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="biz-dash-tabs" style={{
        background: "#14141A", borderBottom: "1px solid #2A2A38",
        display: "flex", gap: 2, padding: "0 16px", overflowX: "auto",
        WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
      }}>
        {TABS.map(t => (
          <button key={t.id} className="biz-dash-tab" onClick={() => setTab(t.id)} style={{
            padding: "14px 16px", border: "none", background: "transparent",
            color: tab===t.id ? "#C9933A" : "#6B6B85",
            fontWeight: tab===t.id ? 800 : 500, fontSize: 13, cursor: "pointer",
            whiteSpace: "nowrap",
            borderBottom: `2px solid ${tab===t.id ? "#C9933A" : "transparent"}`,
            transition: "all .15s",
          }}>
            <span style={{ marginRight: 6 }}>{t.icon}</span><span className="biz-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="biz-dash-content" style={{ padding: "24px 20px", maxWidth: 760, margin: "0 auto", animation: "biz-fade-in .3s ease" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size={40} />
            <div style={{ color: "#6B6B85", fontSize: 13, marginTop: 16 }}>Chargement…</div>
          </div>
        ) : error ? (
          <div style={{
            background: "#2D1010", border: "1px solid #EF444440",
            borderRadius: 12, padding: "20px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: "#EF4444", fontWeight: 700, marginBottom: 8 }}>{error}</div>
            <button onClick={load} style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: "#1C1C26", color: "#E8E8F0", cursor: "pointer", fontSize: 13,
            }}>Réessayer</button>
          </div>
        ) : data ? (
          <>
            {/* FIX : passer data.network (pas data.reseau) */}
            {tab === "accueil"     && <TabAccueil data={data} />}
            {tab === "reseau"      && <TabReseau  network={network?.network} />}
            {tab === "commissions" && <TabCommissions />}
            {tab === "bonus"       && <TabBonus />}
            {tab === "inviter"     && <TabInviter />}
            {tab === "retrait"     && <TabRetrait />}
            {tab === "clients"     && <TabClients />}
          </>
        ) : null}
      </div>
    </div>
  );
}
