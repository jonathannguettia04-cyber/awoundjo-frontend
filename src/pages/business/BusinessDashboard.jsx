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
        display: "flex", alignItems: "center", gap: 20,
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
          .biz-dash-tab span:last-child { display: none; }
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
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "14px 16px", border: "none", background: "transparent",
            color: tab===t.id ? "#C9933A" : "#6B6B85",
            fontWeight: tab===t.id ? 800 : 500, fontSize: 13, cursor: "pointer",
            whiteSpace: "nowrap",
            borderBottom: `2px solid ${tab===t.id ? "#C9933A" : "transparent"}`,
            transition: "all .15s",
          }}>
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
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
          </>
        ) : null}
      </div>
    </div>
  );
}
