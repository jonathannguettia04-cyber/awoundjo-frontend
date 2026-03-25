// src/pages/admin/AdminFederation.jsx
// ─────────────────────────────────────────────────────────────
//  Administration du réseau Fédération Awoundjô
//  Vue : liste ambassadeurs, hiérarchie MLM, commissions
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Palette ──────────────────────────────────────────────────
const C = {
  purple:  "#7C3AED", purpleL: "#F5F3FF", purpleM: "#DDD6FE",
  green:   "#059669", greenL:  "#ECFDF5",
  gold:    "#D97706", goldL:   "#FFFBEB",
  blue:    "#1B4FD8", blueL:   "#EEF2FF",
  red:     "#DC2626", redL:    "#FEF2F2",
  slate:   "#64748B", dark:    "#0F172A",
  border:  "#E2E8F0", bg:      "#F8FAFC",
};

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });

const ROLE_CONFIG = {
  AMBASSADEUR_LEADER:    { label: "Leader",      icon: "👑", color: C.purple, bg: C.purpleL },
  AMBASSADEUR_EGLISE:    { label: "Église",       icon: "⛪", color: C.blue,   bg: C.blueL   },
  AMBASSADEUR_SUPERV:    { label: "Superviseur",  icon: "📋", color: C.green,  bg: C.greenL  },
  AMBASSADEUR_RECRUTEUR: { label: "Recruteur",    icon: "🤝", color: C.gold,   bg: C.goldL   },
};

// ── Taux de commission ────────────────────────────────────────
const COMMISSION_RATES = [
  { type: "DIRECT",    label: "Recruteur direct",       rate: 12, color: C.gold   },
  { type: "SUPERIEUR", label: "Supérieur hiérarchique", rate: 10, color: C.green  },
  { type: "DIRECTION", label: "Direction",              rate:  5, color: C.purple },
];

// ── Données mock (à remplacer par appels API) ─────────────────
const MOCK_AMBASSADORS = [
  { id: 1, name: "Pastor Koné Aimé",     email: "kone@eglise.ci",    role: "AMBASSADEUR_LEADER",    members: 48, commissions_month: 240, commissions_total: 1850, is_active: true,  referral_code: "AWJ-FED-00001", parent: null },
  { id: 2, name: "Marie Bamba",          email: "bamba@eglise.ci",   role: "AMBASSADEUR_EGLISE",    members: 22, commissions_month: 110, commissions_total: 780,  is_active: true,  referral_code: "AWJ-FED-00002", parent: "Pastor Koné Aimé" },
  { id: 3, name: "Jean Kouassi",         email: "kouassi@eglise.ci", role: "AMBASSADEUR_SUPERV",    members: 14, commissions_month: 75,  commissions_total: 430,  is_active: true,  referral_code: "AWJ-FED-00003", parent: "Marie Bamba" },
  { id: 4, name: "Fatou Diallo",         email: "diallo@eglise.ci",  role: "AMBASSADEUR_RECRUTEUR", members: 6,  commissions_month: 32,  commissions_total: 198,  is_active: true,  referral_code: "AWJ-FED-00004", parent: "Jean Kouassi" },
  { id: 5, name: "Ange Yao",             email: "yao@eglise.ci",     role: "AMBASSADEUR_RECRUTEUR", members: 3,  commissions_month: 18,  commissions_total: 95,   is_active: false, referral_code: "AWJ-FED-00005", parent: "Jean Kouassi" },
];

const MOCK_STATS = {
  total_ambassadors: 5,
  active_ambassadors: 4,
  total_members: 93,
  commissions_month: 475,
  commissions_total: 3353,
  new_recruits_month: 8,
};

// ── Composant Badge rôle ──────────────────────────────────────
function RoleBadge({ role }) {
  const rc = ROLE_CONFIG[role];
  if (!rc) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
      background: rc.bg, color: rc.color,
    }}>
      {rc.icon} {rc.label}
    </span>
  );
}

// ── Composant Modal détail ambassadeur ────────────────────────
function AmbassadorModal({ amb, onClose }) {
  if (!amb) return null;
  const rc = ROLE_CONFIG[amb.role];
  const base_month = amb.commissions_month * 2; // prime estimée (comm = 50% prime * taux)

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 28px", maxWidth: 500, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: rc?.color || C.purple, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {rc?.icon || "👤"}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: C.dark }}>{amb.name}</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{amb.email}</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: C.slate }}>✕</button>
        </div>

        <RoleBadge role={amb.role} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16, marginBottom: 16 }}>
          {[
            { label: "Membres recrutés",   value: amb.members,             color: C.purple },
            { label: "Commissions/mois",   value: `${fmt(amb.commissions_month)} €`, color: C.gold, isText: true },
            { label: "Total commissions",  value: `${fmt(amb.commissions_total)} €`, color: C.green, isText: true },
            { label: "Statut",             value: amb.is_active ? "✅ Actif" : "⏸ Inactif", color: amb.is_active ? C.green : C.slate, isText: true },
          ].map(item => (
            <div key={item.label} style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: C.slate, fontWeight: 600 }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: item.isText ? 14 : 22, fontWeight: 800, color: item.color }}>
                {item.isText ? item.value : fmt(item.value)}
              </p>
            </div>
          ))}
        </div>

        <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.slate, fontWeight: 600 }}>SUPÉRIEUR HIÉRARCHIQUE</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.dark }}>{amb.parent || "— Direction"}</p>
        </div>

        <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.slate, fontWeight: 600 }}>CODE DE PARRAINAGE</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.purple, letterSpacing: 1 }}>{amb.referral_code}</p>
        </div>

        {/* Détail commission */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: C.slate }}>RÉPARTITION DES COMMISSIONS (ce mois)</p>
          {COMMISSION_RATES.map(r => {
            const base = base_month * 0.5;
            const amount = base * r.rate / 100;
            return (
              <div key={r.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.slate }}>{r.label} ({r.rate}%)</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{amount.toFixed(2)} €</span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: amb.is_active ? C.red : C.green, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {amb.is_active ? "⏸ Suspendre" : "✅ Réactiver"}
          </button>
          <button style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: C.purple, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ✏️ Modifier le rôle
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AdminFederation ───────────────────────────────────────────
export default function AdminFederation() {
  const navigate = useNavigate();
  const [tab, setTab]             = useState("ambassadors");
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(false);

  // Données (remplacer par appels API réels)
  const stats       = MOCK_STATS;
  const ambassadors = MOCK_AMBASSADORS;

  // Filtrage
  const filtered = ambassadors.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === "ALL" || a.role === filterRole;
    const matchStatus = filterStatus === "ALL" || (filterStatus === "ACTIVE" ? a.is_active : !a.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const TABS = [
    { id: "ambassadors", label: "👥 Ambassadeurs", count: stats.total_ambassadors },
    { id: "commissions", label: "💰 Commissions",  count: null },
    { id: "hierarchy",   label: "🏛️ Hiérarchie",   count: null },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px", fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <button onClick={() => navigate(-1)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: C.slate }}>←</button>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.dark }}>⛪ Réseau Fédération</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.slate }}>Gestion des ambassadeurs et commissions du réseau fédération</p>
        </div>
        <button style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.purple, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          ➕ Ajouter un ambassadeur
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { icon: "👥", label: "Ambassadeurs",  value: stats.total_ambassadors, sub: `${stats.active_ambassadors} actifs`,   color: C.purple, bg: C.purpleL },
          { icon: "🤝", label: "Membres total", value: stats.total_members,     sub: "membres recrutés",                      color: C.blue,   bg: C.blueL   },
          { icon: "💰", label: "Comm. ce mois", value: `${fmt(stats.commissions_month)} €`, sub: "distribuées", color: C.gold, bg: C.goldL, isText: true },
          { icon: "📈", label: "Comm. totales", value: `${fmt(stats.commissions_total)} €`, sub: "depuis le début", color: C.green, bg: C.greenL, isText: true },
          { icon: "🆕", label: "Nouveaux/mois", value: stats.new_recruits_month, sub: "ce mois",                             color: C.blue,   bg: C.blueL   },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 12, border: `1px solid ${k.color}22`, padding: "14px 16px" }}>
            <span style={{ fontSize: 22 }}>{k.icon}</span>
            <p style={{ margin: "8px 0 2px", fontSize: k.isText ? 16 : 24, fontWeight: 900, color: k.color }}>
              {k.isText ? k.value : fmt(k.value)}
            </p>
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: C.dark }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 10, color: C.slate }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: C.bg, borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 600, transition: "all .2s",
              background: tab === t.id ? "#fff" : "transparent",
              color:      tab === t.id ? C.purple : C.slate,
              boxShadow:  tab === t.id ? "0 1px 4px rgba(0,0,0,.08)" : "none",
            }}>
            {t.label}{t.count !== null ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {/* ══ TAB : Ambassadeurs ══ */}
      {tab === "ambassadors" && (
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 20px" }}>

          {/* Filtres */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="🔍 Rechercher un ambassadeur…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: "none", fontFamily: "inherit", color: C.dark }}
            />
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: "none", fontFamily: "inherit", color: C.dark, background: "#fff" }}>
              <option value="ALL">Tous les rôles</option>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: "none", fontFamily: "inherit", color: C.dark, background: "#fff" }}>
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">✅ Actifs</option>
              <option value="INACTIVE">⏸ Inactifs</option>
            </select>
          </div>

          {/* Tableau */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Ambassadeur", "Rôle", "Supérieur", "Membres", "Comm./mois", "Total", "Statut", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((amb, i) => (
                  <tr key={amb.id} style={{ borderTop: `1px solid ${C.border}`, transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: ROLE_CONFIG[amb.role]?.color || C.purple, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                          {ROLE_CONFIG[amb.role]?.icon || "👤"}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{amb.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{amb.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 12px" }}><RoleBadge role={amb.role} /></td>
                    <td style={{ padding: "12px 12px", color: C.slate, fontSize: 12 }}>{amb.parent || "— Direction"}</td>
                    <td style={{ padding: "12px 12px", fontWeight: 700, color: C.purple }}>{fmt(amb.members)}</td>
                    <td style={{ padding: "12px 12px", fontWeight: 700, color: C.gold }}>{fmt(amb.commissions_month)} €</td>
                    <td style={{ padding: "12px 12px", fontWeight: 700, color: C.green }}>{fmt(amb.commissions_total)} €</td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: amb.is_active ? C.greenL : C.bg, color: amb.is_active ? C.green : C.slate }}>
                        {amb.is_active ? "✅ Actif" : "⏸ Inactif"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <button onClick={() => setSelected(amb)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${C.purpleM}`, background: C.purpleL, color: C.purple, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        Détail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px", color: C.slate, fontSize: 13 }}>
                Aucun ambassadeur trouvé avec ces critères.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB : Commissions ══ */}
      {tab === "commissions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Explication du système */}
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: C.dark }}>📐 Règles de calcul</h3>
            <div style={{ background: C.purpleL, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: C.purple, fontWeight: 700 }}>
                Base de calcul = 50% de la prime encaissée
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: C.slate }}>
                Exemple : prime de 100 € → base de 50 €
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
              {COMMISSION_RATES.map(r => (
                <div key={r.type} style={{ background: C.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${r.color}22` }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: .6 }}>{r.type}</p>
                  <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: r.color }}>{r.rate}%</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.dark, fontWeight: 600 }}>{r.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: C.slate }}>Exemple 100€ prime → {(50 * r.rate / 100).toFixed(2)} €</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau commissions par ambassadeur */}
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: C.dark }}>💰 Commissions par ambassadeur</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {["Ambassadeur", "Rôle", "Ce mois", "Total", "En attente"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: .6 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ambassadors.sort((a,b) => b.commissions_month - a.commissions_month).map(amb => (
                    <tr key={amb.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: C.dark }}>{amb.name}</td>
                      <td style={{ padding: "12px 12px" }}><RoleBadge role={amb.role} /></td>
                      <td style={{ padding: "12px 12px", fontWeight: 800, color: C.gold }}>{fmt(amb.commissions_month)} €</td>
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: C.green }}>{fmt(amb.commissions_total)} €</td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ background: C.goldL, color: C.gold, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          {fmt(Math.round(amb.commissions_month * 0.3))} €
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB : Hiérarchie ══ */}
      {tab === "hierarchy" && (
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "24px 24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: C.dark }}>🏛️ Organigramme Fédération</h3>

          {/* Schéma hiérarchique visuel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, alignItems: "center", marginBottom: 24 }}>
            {Object.entries(ROLE_CONFIG).map(([key, cfg], i) => {
              const ambs = ambassadors.filter(a => a.role === key);
              return (
                <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  {i > 0 && <div style={{ width: 2, height: 20, background: C.border }} />}
                  <div style={{ background: cfg.bg, border: `2px solid ${cfg.color}44`, borderRadius: 12, padding: "12px 20px", width: "fit-content", textAlign: "center", minWidth: 200 }}>
                    <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                    <p style={{ margin: "4px 0 2px", fontWeight: 800, fontSize: 14, color: cfg.color }}>{cfg.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: C.slate }}>{ambs.length} ambassadeur{ambs.length > 1 ? "s" : ""}</p>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
                      {ambs.map(a => (
                        <span key={a.id} onClick={() => setSelected(a)}
                          style={{ fontSize: 11, background: cfg.color, color: "#fff", padding: "2px 10px", borderRadius: 999, cursor: "pointer", fontWeight: 600 }}>
                          {a.name.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tableau arborescent */}
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: .6 }}>Vue détaillée</h4>
          {ambassadors.map(amb => {
            const rc = ROLE_CONFIG[amb.role];
            const indent = { AMBASSADEUR_LEADER: 0, AMBASSADEUR_EGLISE: 1, AMBASSADEUR_SUPERV: 2, AMBASSADEUR_RECRUTEUR: 3 }[amb.role] || 0;
            return (
              <div key={amb.id} onClick={() => setSelected(amb)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", marginLeft: indent * 24, borderRadius: 10, cursor: "pointer", transition: "background .15s", marginBottom: 4, border: `1px solid ${rc?.color}22`, background: rc?.bg }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                {indent > 0 && <span style={{ color: C.border, fontSize: 16, flexShrink: 0 }}>└─</span>}
                <span style={{ fontSize: 18 }}>{rc?.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.dark }}>{amb.name}</p>
                  {amb.parent && <p style={{ margin: 0, fontSize: 11, color: C.slate }}>↳ {amb.parent}</p>}
                </div>
                <span style={{ fontSize: 11, color: C.slate }}>{amb.members} membres →</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal détail ── */}
      <AmbassadorModal amb={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
