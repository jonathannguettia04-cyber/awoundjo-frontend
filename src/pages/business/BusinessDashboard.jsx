// src/pages/BusinessDashboard.jsx
// ═══════════════════════════════════════════════════════════════
//  AWOUNDJÔ BUSINESS — Dashboard membre
//  Tabs : Accueil · Mon Réseau · Commissions · Bonus · Inviter
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Palette ────────────────────────────────────────────────────
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

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtNum = (n) => Number(n || 0).toLocaleString("fr-FR");

function authHeaders() {
  const token = localStorage.getItem("token") ||
                localStorage.getItem("agent_token") ||
                localStorage.getItem("diaspora_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiFetch(path) {
  const res = await fetch(`${BASE}/api/business${path}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Erreur API");
  return data;
}

// ── Spinner ────────────────────────────────────────────────────
function Spin({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${T.border}`,
      borderTop: `2px solid ${T.gold}`,
      borderRadius: "50%",
      animation: "spin .7s linear infinite",
      margin: "0 auto",
    }} />
  );
}

// ── Badge statut ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ACTIVE:    { label: "Actif",       bg: T.greenL, color: T.green  },
    PENDING:   { label: "En attente",  bg: "#1A1A00", color: "#EAB308" },
    SUSPENDED: { label: "Suspendu",    bg: T.redL,   color: T.red    },
    VALIDATED: { label: "Validé",      bg: T.greenL, color: T.green  },
    PAID:      { label: "Payé",        bg: T.blueL,  color: T.blue   },
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

// ── Carte stat ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 8,
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow accent */}
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

// ── Onglets ────────────────────────────────────────────────────
const TABS = [
  { id: "accueil",      label: "Accueil",      icon: "🏠" },
  { id: "reseau",       label: "Mon Réseau",   icon: "🌐" },
  { id: "commissions",  label: "Commissions",  icon: "💰" },
  { id: "bonus",        label: "Bonus Pool",   icon: "🎯" },
  { id: "inviter",      label: "Inviter",      icon: "🔗" },
];

// ── Tab Accueil ────────────────────────────────────────────────
function TabAccueil({ data }) {
  const { member, stats, commissions_recentes } = data;
  const rm = ROLE_META[member.role] || ROLE_META.RECRUTEUR;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Profil card */}
      <div style={{
        background: `linear-gradient(135deg, ${T.card}, #1E1830)`,
        border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "24px 28px",
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
          <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>
            {rm.label}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <StatusBadge status={member.status} />
            <span style={{ fontSize: 11, color: T.muted }}>
              Depuis {new Date(member.inscription).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <StatCard
          icon="💰" label="Total gains"
          value={fmt(stats.commissions.total_gains)}
          sub={`${fmtNum(stats.commissions.nb_total)} commission(s)`}
          accent={T.gold}
        />
        <StatCard
          icon="⏳" label="En attente"
          value={fmt(stats.commissions.gains_pending)}
          sub="À valider"
          accent="#EAB308"
        />
        <StatCard
          icon="✅" label="Payé"
          value={fmt(stats.commissions.gains_payes)}
          accent={T.green}
        />
        <StatCard
          icon="🌐" label="Mon réseau"
          value={fmtNum(stats.reseau.total)}
          sub={`Niv.1: ${stats.reseau.niveau_1} · Niv.2: ${stats.reseau.niveau_2}`}
          accent={T.blue}
        />
      </div>

      {/* Règle commissions */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: "20px 24px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
          📋 <span>Règle de commission Business</span>
        </div>
        {[
          { niveau: "Niveau 1", desc: "Vous apportez un client", taux: "10%", color: T.gold },
          { niveau: "Niveau 2", desc: "Votre parrain (sur vos clients)", taux: "5%", color: "#8B5CF6" },
          { niveau: "Pool global", desc: "Bonus mensuel partagé", taux: "2%", color: T.blue },
        ].map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: 10, marginBottom: 6,
            background: "#12121A",
            border: `1px solid ${T.border}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.niveau}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{r.desc}</div>
            </div>
            <div style={{
              fontSize: 20, fontWeight: 900, color: r.color,
              fontFamily: "'DM Mono', monospace",
            }}>{r.taux}</div>
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

      {/* Dernières commissions */}
      {commissions_recentes.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 800, color: T.text }}>
            📈 Dernières commissions
          </div>
          {commissions_recentes.slice(0, 5).map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: i < 4 ? `1px solid ${T.border}` : "none",
            }}>
              <div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                  Niveau {c.niveau} — {c.taux}%
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {new Date(c.created_at).toLocaleDateString("fr-FR")} · Base {fmt(c.base_montant)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontWeight: 900, color: T.gold, fontFamily: "monospace" }}>
                  +{fmt(c.montant)}
                </span>
                <StatusBadge status={c.statut} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab Réseau ─────────────────────────────────────────────────
function TabReseau({ reseau }) {
  const { niveau1 = [], niveau2 = [] } = reseau || {};

  function MemberRow({ m, level }) {
    const rm = ROLE_META[m.role] || {};
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 20px",
        borderBottom: `1px solid ${T.border}`,
        background: "transparent",
        transition: "background .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#18181F"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {level === 2 && <div style={{ width: 2, height: 36, background: T.border, borderRadius: 2, marginLeft: 16 }} />}
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: `${rm.color || T.gold}20`,
          border: `1.5px solid ${rm.color || T.gold}50`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>{rm.icon || "👤"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {m.nom || m.email}
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>
            {rm.label || m.role}
            {m.parent_nom && <span> · via {m.parent_nom}</span>}
            {" · "}{new Date(m.created_at).toLocaleDateString("fr-FR")}
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
      {/* Stats réseau */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <StatCard icon="🤝" label="Total réseau" value={fmtNum(niveau1.length + niveau2.length)} accent={T.gold} />
        <StatCard icon="1️⃣" label="Niveau 1" value={fmtNum(niveau1.length)} accent="#8B5CF6" sub="Directs" />
        <StatCard icon="2️⃣" label="Niveau 2" value={fmtNum(niveau2.length)} accent={T.blue} sub="Indirects" />
      </div>

      {/* Niveau 1 */}
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

      {/* Niveau 2 */}
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

// ── Tab Commissions ────────────────────────────────────────────
function TabCommissions() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/commissions?page=${page}&limit=15`)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>;
  if (!data)   return <div style={{ color: T.red, padding: 20 }}>Erreur de chargement</div>;

  const { commissions = [], pagination } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Résumé */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCard icon="📊" label="Total commissions" value={fmt(pagination.total_montant)} accent={T.gold} />
        <StatCard icon="🔢" label="Nb transactions" value={fmtNum(pagination.total)} accent={T.blue} />
      </div>

      {/* Table */}
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
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                  Commission niveau {c.niveau} ({c.taux}%)
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  Base: {fmt(c.base_montant)} · {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </div>
                {c.payment_ref && (
                  <div style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>
                    Réf: {c.payment_ref.slice(0, 20)}…
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={{
                fontWeight: 900, color: T.gold, fontSize: 15,
                fontFamily: "'DM Mono', monospace",
              }}>+{fmt(c.montant)}</span>
              <StatusBadge status={c.statut} />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: page === 1 ? T.surface : T.card,
              color: page === 1 ? T.muted : T.text, cursor: page === 1 ? "default" : "pointer",
              fontSize: 13, fontWeight: 600,
            }}
          >← Préc.</button>
          <span style={{ fontSize: 13, color: T.muted }}>
            Page {page} / {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(pagination.total / pagination.limit)}
            style={{
              padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.card, color: T.text, cursor: "pointer",
              fontSize: 13, fontWeight: 600,
            }}
          >Suiv. →</button>
        </div>
      )}
    </div>
  );
}

// ── Tab Bonus Pool ─────────────────────────────────────────────
function TabBonus() {
  const [pool, setPool]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/bonus-pool")
      .then(d => setPool(d.pool)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Explication pool */}
      <div style={{
        background: `linear-gradient(135deg, ${T.gold}15, ${T.card})`,
        border: `1px solid ${T.gold}40`,
        borderRadius: 14, padding: "20px 24px",
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.gold, marginBottom: 10 }}>
          🎯 Comment fonctionne le Bonus Pool ?
        </div>
        <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
          À chaque paiement client validé, <strong style={{ color: T.gold }}>2%</strong> sont ajoutés automatiquement dans le pool mensuel global.
          En fin de mois, le pool est distribué entre les membres actifs selon des règles définies par l'administration.
        </div>
        <div style={{
          marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap",
        }}>
          {["Accumulation automatique", "Distribution mensuelle", "Règles admin"].map((t, i) => (
            <span key={i} style={{
              padding: "4px 12px", borderRadius: 99,
              background: `${T.gold}20`, color: T.gold,
              fontSize: 11, fontWeight: 700,
            }}>✦ {t}</span>
          ))}
        </div>
      </div>

      {/* Historique pool */}
      {!pool || pool.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 15, color: T.textSub }}>Aucun bonus pool disponible pour l'instant</div>
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Historique Bonus Pool
          </div>
          {pool.map((p, i) => {
            const statutColor = p.statut === "DISTRIBUTED" ? T.green : p.statut === "CLOSED" ? T.blue : T.gold;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: i < pool.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: `${statutColor}15`,
                    border: `1.5px solid ${statutColor}40`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: statutColor }}>
                      {MONTHS[p.mois - 1]}
                    </div>
                    <div style={{ fontSize: 10, color: T.muted }}>{p.annee}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                      {fmt(p.montant_total)}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {p.nb_payments} paiement(s) comptabilisé(s)
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: `${statutColor}20`, color: statutColor,
                }}>
                  {p.statut === "DISTRIBUTED" ? "Distribué" : p.statut === "CLOSED" ? "Clôturé" : "Ouvert"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab Inviter ────────────────────────────────────────────────
function TabInviter({ member, lien_invitation }) {
  const [copied, setCopied] = useState(false);
  const rm = ROLE_META[member?.role] || {};
  const childRole = { DIRECTRICE: "Leader", LEADER: "Superviseur", SUPERVISEUR: "Recruteur", RECRUTEUR: null }[member?.role];

  function copyLink() {
    navigator.clipboard.writeText(lien_invitation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `🌟 Rejoins le réseau Awoundjô Business !\n` +
      `Code d'invitation : ${member?.code_invitation}\n` +
      `${lien_invitation}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Code d'invitation */}
      <div style={{
        background: `linear-gradient(135deg, #14141F, #1A1430)`,
        border: `1px solid ${T.gold}40`,
        borderRadius: 16, padding: "28px",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Déco */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 150, height: 150,
          borderRadius: "50%", background: `${T.gold}08`,
          border: `1px solid ${T.gold}15`,
        }} />
        <div style={{ fontSize: 13, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Mon code d'invitation
        </div>
        <div style={{
          fontSize: 32, fontWeight: 900, letterSpacing: "0.15em",
          color: T.gold, fontFamily: "monospace",
          background: `${T.gold}10`, borderRadius: 12,
          padding: "14px 28px", display: "inline-block",
          border: `2px dashed ${T.gold}40`,
          marginBottom: 8,
        }}>
          {member?.code_invitation}
        </div>
        {childRole && (
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 20 }}>
            Invite des <strong style={{ color: T.gold }}>{childRole}s</strong> dans votre réseau
          </div>
        )}
        {!childRole && (
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
            En tant que Recruteur, vous ne pouvez pas inviter d'autres membres du réseau Business
          </div>
        )}
      </div>

      {/* Lien */}
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
            {lien_invitation}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={copyLink}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none",
                background: copied ? T.greenL : `${T.gold}20`,
                color: copied ? T.green : T.gold,
                fontWeight: 800, fontSize: 13, cursor: "pointer",
                border: `1px solid ${copied ? T.green : T.gold}40`,
                transition: "all .2s",
              }}
            >
              {copied ? "✅ Copié !" : "📋 Copier le lien"}
            </button>
            <button
              onClick={shareWhatsApp}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none",
                background: "#0D2318", color: "#22C55E",
                fontWeight: 800, fontSize: 13, cursor: "pointer",
                border: "1px solid #22C55E40",
                transition: "all .2s",
              }}
            >
              📲 Partager WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Hiérarchie visuelle */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 16 }}>
          🏗️ Hiérarchie du réseau Business
        </div>
        {[
          { role: "DIRECTRICE", icon: "👑", color: "#C9933A", note: "Sommet" },
          { role: "LEADER",     icon: "⭐", color: "#8B5CF6", note: "" },
          { role: "SUPERVISEUR",icon: "🔷", color: "#3B82F6", note: "" },
          { role: "RECRUTEUR",  icon: "🤝", color: "#22C55E", note: "Apporteur" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 3 ? 0 : 0 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              width: 30, flexShrink: 0,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: `${r.color}20`, border: `2px solid ${r.color}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                outline: r.role === member?.role ? `3px solid ${r.color}` : "none",
                outlineOffset: 2,
              }}>{r.icon}</div>
              {i < 3 && (
                <div style={{ width: 2, height: 16, background: T.border, margin: "2px 0" }} />
              )}
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: r.role === member?.role ? 900 : 600, color: r.role === member?.role ? r.color : T.textSub }}>
                {r.role}
              </span>
              {r.role === member?.role && (
                <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>← Vous</span>
              )}
              {r.note && (
                <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>· {r.note}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────
export default function BusinessDashboard() {
  const [tab, setTab]       = useState("accueil");
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/dashboard")
      .then(d => { setData(d); setError(""); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{
      minHeight: "100vh",
      background: T.darker,
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      color: T.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${T.gold}, ${T.goldD})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: `0 4px 16px ${T.gold}40`,
          }}>💼</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.gold, letterSpacing: "-0.01em" }}>
              Awoundjô Business
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>Réseau MLM · Tableau de bord</div>
          </div>
        </div>
        {data?.member && (
          <div style={{
            padding: "6px 14px", borderRadius: 99,
            background: `${ROLE_META[data.member.role]?.color || T.gold}20`,
            color: ROLE_META[data.member.role]?.color || T.gold,
            fontSize: 12, fontWeight: 700, border: `1px solid ${ROLE_META[data.member.role]?.color || T.gold}40`,
          }}>
            {ROLE_META[data.member.role]?.icon} {ROLE_META[data.member.role]?.label || data.member.role}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", gap: 2, padding: "0 16px",
        overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "14px 16px", border: "none", background: "transparent",
              color: tab === t.id ? T.gold : T.muted,
              fontWeight: tab === t.id ? 800 : 500,
              fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
              borderBottom: `2px solid ${tab === t.id ? T.gold : "transparent"}`,
              transition: "all .15s",
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ padding: "24px 20px", maxWidth: 700, margin: "0 auto", animation: "fadeIn .3s ease" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size={40} />
            <div style={{ color: T.muted, fontSize: 13, marginTop: 16 }}>Chargement du tableau de bord…</div>
          </div>
        ) : error ? (
          <div style={{
            background: T.redL, border: `1px solid ${T.red}40`,
            borderRadius: 12, padding: "20px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: T.red, fontWeight: 700, marginBottom: 8 }}>{error}</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
              Vous devez être inscrit au réseau Awoundjô Business pour accéder à ce tableau de bord.
            </div>
            <button
              onClick={load}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: T.card, color: T.text, cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}
            >Réessayer</button>
          </div>
        ) : data ? (
          <>
            {tab === "accueil"     && <TabAccueil data={data} />}
            {tab === "reseau"      && <TabReseau reseau={data.reseau} />}
            {tab === "commissions" && <TabCommissions />}
            {tab === "bonus"       && <TabBonus />}
            {tab === "inviter"     && <TabInviter member={data.member} lien_invitation={data.lien_invitation} />}
          </>
        ) : null}
      </div>
    </div>
  );
}
