// src/pages/affilie/AffiliePages.jsx
// ─────────────────────────────────────────────────────────────
//  Barrel de pages du portail Affilié
//  Exports nommés :
//    AffilieDashboard
//    AffilieCommissions
//    AffilieReseau
//    AffilieNotifications
//    AffilieProfil
//    AffilieMembers
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Constantes ─────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "https://awoundjo-backend-production-ba8c.up.railway.app";

const C = {
  primary: "#7C3AED", primaryL: "#F5F3FF", primaryD: "#5B21B6",
  green:   "#059669", greenL:   "#ECFDF5",
  gold:    "#D97706", goldL:    "#FFFBEB",
  red:     "#DC2626", redL:     "#FEF2F2",
  slate:   "#64748B", dark:     "#0F172A",
  border:  "#E2E8F0", bg:       "#F8FAFC",
};

const ROLE_LABELS = {
  DIRECTRICE:      "👑 Directrice",
  LEADER_AFF:      "🌟 Leader",
  SUPERVISEUR_AFF: "🔷 Superviseur",
  RECRUTEUR_AFF:   "🤝 Recruteur",
};

const CAN_CREATE = {
  DIRECTRICE:      "LEADER_AFF",
  LEADER_AFF:      "SUPERVISEUR_AFF",
  SUPERVISEUR_AFF: "RECRUTEUR_AFF",
};

// ── Helpers ────────────────────────────────────────────────────
function safe(method, key, val) {
  try { return val !== undefined ? localStorage[method](key, val) : localStorage[method](key); } catch { return null; }
}
function getMember() {
  try { return JSON.parse(safe("getItem", "affilie_member") || "{}"); } catch { return {}; }
}
function getToken() { return safe("getItem", "affilie_token"); }
function fcfa(n) { return Number(n || 0).toLocaleString("fr-FR") + " FCFA"; }
function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

// ── Composants partagés ────────────────────────────────────────
function PageTitle({ children }) {
  return <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800, color: C.dark }}>{children}</h1>;
}

function StatCard({ icon, label, value, sub, color = C.primary }) {
  return (
    <div style={{
      background: "#fff", border: `1.5px solid ${C.border}`,
      borderRadius: 14, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.slate, fontSize: 13, fontWeight: 600 }}>
        <span style={{ fontSize: 20 }}>{icon}</span> {label}
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: C.slate }}>{sub}</p>}
    </div>
  );
}

function Badge({ text, color = C.slate, bg = C.bg }) {
  return (
    <span style={{
      background: bg, color, borderRadius: 20,
      padding: "3px 10px", fontSize: 11, fontWeight: 700,
    }}>{text}</span>
  );
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE:    { text: "Actif",    color: C.green,  bg: C.greenL },
    PENDING:   { text: "En attente", color: C.gold, bg: C.goldL  },
    SUSPENDED: { text: "Suspendu", color: C.red,    bg: C.redL   },
    PAID:      { text: "Versée",   color: C.green,  bg: C.greenL },
    PENDING_C: { text: "En attente", color: C.gold, bg: C.goldL  },
  };
  const s = map[status] || { text: status, color: C.slate, bg: C.bg };
  return <Badge text={s.text} color={s.color} bg={s.bg} />;
}

function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
      <div style={{
        width: 36, height: 36, border: `4px solid ${C.primaryL}`,
        borderTop: `4px solid ${C.primary}`, borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 16px", color: C.slate }}>
      <p style={{ fontSize: 40, margin: "0 0 12px" }}>{icon}</p>
      <p style={{ fontWeight: 600, fontSize: 14 }}>{text}</p>
    </div>
  );
}

function InputField({ label, type = "text", placeholder, value, onChange, required, as = "input", children }) {
  const base = {
    width: "100%", padding: "10px 13px", borderRadius: 8, fontSize: 14,
    border: `1.5px solid ${C.border}`, outline: "none",
    boxSizing: "border-box", background: "#fff", fontFamily: "inherit",
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {as === "select" ? (
        <select value={value} onChange={onChange} style={{ ...base, cursor: "pointer" }}>{children}</select>
      ) : (
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={base} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  1. DASHBOARD
// ═══════════════════════════════════════════════════════════════
export function AffilieDashboard() {
  const member = getMember();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/affilie/dashboard`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setStats(d?.data || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const comm   = stats?.commissions || {};
  const direct = stats?.direct_members || {};

  return (
    <div>
      <PageTitle>Tableau de bord</PageTitle>

      {/* Bienvenue */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryD} 100%)`,
        borderRadius: 16, padding: "20px 24px", marginBottom: 24, color: "#fff",
      }}>
        <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 18 }}>
          Bonjour, {member.name?.split(" ")[0] || "Affilié"} 👋
        </p>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
          {ROLE_LABELS[member.role] || member.role} — Réseau Affilié Awoundjô
        </p>
        <div style={{
          marginTop: 14, background: "rgba(255,255,255,.15)", borderRadius: 10,
          padding: "10px 14px", display: "inline-flex", gap: 6, alignItems: "center",
          fontSize: 13, fontWeight: 700,
        }}>
          🔗 Code parrainage : <strong>{member.referral_code || "—"}</strong>
        </div>
      </div>

      {/* Stats commissions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="💰" label="Total gagné"    value={fcfa(comm.total_earned)} color={C.primary} />
        <StatCard icon="⏳" label="En attente"     value={fcfa(comm.pending)}      color={C.gold} />
        <StatCard icon="✅" label="Déjà versé"     value={fcfa(comm.paid)}         color={C.green} />
        <StatCard icon="📅" label="Ce mois"        value={fcfa(comm.this_month)}   color={C.primaryD} />
      </div>

      {/* Stats réseau */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="Membres directs"  value={direct.total || 0}            sub={`${direct.active || 0} actifs`} color={C.primary} />
        <StatCard icon="🌐" label="Taille du réseau" value={stats?.network_size || 0}     sub="membres total" color={C.primaryD} />
        <StatCard icon="🌟" label="Leaders"          value={stats?.direct_leaders || 0}      color={C.gold} />
        <StatCard icon="🔷" label="Superviseurs"     value={stats?.direct_superviseurs || 0} color={C.green} />
      </div>

      {/* Info plan */}
      <div style={{
        background: "#fff", border: `1.5px solid ${C.border}`,
        borderRadius: 14, padding: "18px 20px",
      }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700, color: C.dark }}>📋 Informations du compte</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {[
            ["Rôle",     ROLE_LABELS[member.role] || member.role],
            ["Plan",     member.plan || "—"],
            ["Statut",   member.status || "—"],
            ["Username", member.username || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p style={{ margin: "0 0 3px", fontSize: 11, color: C.slate, fontWeight: 600, textTransform: "uppercase" }}>{k}</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.dark }}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  2. COMMISSIONS
// ═══════════════════════════════════════════════════════════════
export function AffilieCommissions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/affilie/commissions`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setData(d?.data || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  const list    = data?.commissions || [];
  const totals  = data?.totals || {};

  return (
    <div>
      <PageTitle>💰 Commissions</PageTitle>

      {/* Résumé */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="💰" label="Total cumulé" value={fcfa(totals.total)}   color={C.primary} />
        <StatCard icon="⏳" label="En attente"   value={fcfa(totals.pending)} color={C.gold} />
        <StatCard icon="✅" label="Versées"       value={fcfa(totals.paid)}   color={C.green} />
      </div>

      {/* Tableau */}
      <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.dark }}>
          Historique des commissions
        </div>
        {list.length === 0 ? (
          <EmptyState icon="💸" text="Aucune commission pour le moment" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg, fontSize: 12, color: C.slate, fontWeight: 700 }}>
                  {["Source", "Type", "Montant", "Statut", "Date"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : C.bg }}>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{c.source_name || "—"}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{ROLE_LABELS[c.source_role_name] || c.source_role_name}</p>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.slate, whiteSpace: "nowrap" }}>
                      {c.commission_type === "direct" ? "Direct" : c.commission_type === "level2" ? "N+2" : c.commission_type}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>
                      {fcfa(c.amount)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={c.status === "PENDING" ? "PENDING_C" : c.status} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.slate, whiteSpace: "nowrap" }}>
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  3. RÉSEAU
// ═══════════════════════════════════════════════════════════════
export function AffilieReseau() {
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => {
    fetch(`${BASE}/api/affilie/network`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setNetwork(d?.data?.network || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const roles   = ["ALL", "LEADER_AFF", "SUPERVISEUR_AFF", "RECRUTEUR_AFF"];
  const filtered = filter === "ALL" ? network : network.filter(m => m.role === filter);
  const counts   = {};
  network.forEach(m => { counts[m.role] = (counts[m.role] || 0) + 1; });

  return (
    <div>
      <PageTitle>🌐 Mon réseau</PageTitle>

      {/* Stats par rôle */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {["LEADER_AFF", "SUPERVISEUR_AFF", "RECRUTEUR_AFF"].map(r => (
          <StatCard key={r} icon={ROLE_LABELS[r].split(" ")[0]} label={ROLE_LABELS[r].split(" ").slice(1).join(" ")}
            value={counts[r] || 0} color={C.primary} />
        ))}
        <StatCard icon="🌐" label="Total réseau" value={network.length} color={C.primaryD} />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {roles.map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{
            padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${filter === r ? C.primary : C.border}`,
            background: filter === r ? C.primaryL : "#fff", color: filter === r ? C.primary : C.slate,
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            {r === "ALL" ? "Tous" : ROLE_LABELS[r]?.split(" ").slice(1).join(" ") || r}
            <span style={{ marginLeft: 5, opacity: .7 }}>
              ({r === "ALL" ? network.length : counts[r] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🌱" text="Aucun membre dans votre réseau" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg, fontSize: 12, color: C.slate, fontWeight: 700 }}>
                  {["Nom", "Rôle", "Niveau", "Statut", "Inscrit le"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : C.bg }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: C.dark, fontSize: 14 }}>{m.name}</td>
                    <td style={{ padding: "12px 16px" }}><Badge text={ROLE_LABELS[m.role] || m.role} color={C.primary} bg={C.primaryL} /></td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.slate }}>N+{m.depth}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={m.status} /></td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.slate, whiteSpace: "nowrap" }}>
                      {new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  4. NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
export function AffilieNotifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`${BASE}/api/affilie/notifications`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setNotifs(d?.data?.notifications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  async function markRead() {
    await fetch(`${BASE}/api/affilie/notifications/read`, { method: "PUT", headers: authHeaders() });
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  const TYPE_ICONS = { welcome: "🎉", validation: "✅", commission: "💰", recruitment: "👥", info: "ℹ️" };
  const unread = notifs.filter(n => !n.is_read).length;

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <PageTitle>🔔 Notifications {unread > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 14, marginLeft: 8 }}>{unread}</span>}</PageTitle>
        {unread > 0 && (
          <button onClick={markRead} style={{
            border: `1.5px solid ${C.border}`, background: "#fff", borderRadius: 8,
            padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.slate,
          }}>Tout marquer comme lu</button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifs.length === 0 ? (
          <EmptyState icon="🔔" text="Aucune notification" />
        ) : notifs.map(n => (
          <div key={n.id} style={{
            background: n.is_read ? "#fff" : C.primaryL,
            border: `1.5px solid ${n.is_read ? C.border : C.primary + "44"}`,
            borderRadius: 12, padding: "14px 18px",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{TYPE_ICONS[n.type] || "ℹ️"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: C.dark }}>{n.title}</p>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: C.slate }}>{n.message}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.slate }}>
                {new Date(n.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
            {!n.is_read && (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary, flexShrink: 0, marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  5. PROFIL
// ═══════════════════════════════════════════════════════════════
const COUNTRIES = [
  "Côte d'Ivoire","France","Belgique","Suisse","Canada","États-Unis","Royaume-Uni",
  "Italie","Espagne","Allemagne","Pays-Bas","Portugal","Maroc","Sénégal","Ghana",
  "Cameroun","Togo","Bénin","Burkina Faso","Mali","Guinée","Gabon","Congo","Autre",
];

export function AffilieProfil() {
  const member = getMember();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: member.name || "", country: member.country || "", city: member.city || "", phone: member.phone || "" });
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [saving,  setSaving]  = useState(false);
  const [pwSave,  setPwSave]  = useState(false);
  const [msg,     setMsg]     = useState("");
  const [pwMsg,   setPwMsg]   = useState("");
  const [tab,     setTab]     = useState("info");

  const inp = (field, setter) => (e) => setter(p => ({ ...p, [field]: e.target.value }));

  async function saveProfile() {
    setSaving(true); setMsg("");
    try {
      const r = await fetch(`${BASE}/api/affilie/me`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok) {
        setMsg("✅ Profil mis à jour !");
        safe("setItem", "affilie_member", JSON.stringify({ ...member, ...form }));
      } else {
        setMsg("❌ " + (d.error || "Erreur"));
      }
    } catch { setMsg("❌ Erreur réseau"); }
    setSaving(false);
  }

  async function changePassword() {
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg("❌ Les mots de passe ne correspondent pas"); return; }
    if (pwForm.new_password.length < 6) { setPwMsg("❌ Minimum 6 caractères"); return; }
    setPwSave(true); setPwMsg("");
    try {
      const r = await fetch(`${BASE}/api/affilie/me/password`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ old_password: pwForm.old_password, new_password: pwForm.new_password }),
      });
      const d = await r.json();
      if (r.ok) { setPwMsg("✅ Mot de passe modifié !"); setPwForm({ old_password: "", new_password: "", confirm: "" }); }
      else       { setPwMsg("❌ " + (d.error || "Erreur")); }
    } catch { setPwMsg("❌ Erreur réseau"); }
    setPwSave(false);
  }

  function logout() {
    safe("removeItem", "affilie_token");
    safe("removeItem", "affilie_member");
    navigate("/affilie/login");
  }

  const tabStyle = (t) => ({
    flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 700, transition: "all .2s",
    background: tab === t ? "#fff" : "transparent",
    color: tab === t ? C.primary : C.slate,
    boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,.08)" : "none",
  });

  return (
    <div>
      <PageTitle>👤 Mon profil</PageTitle>

      {/* Avatar + infos rapides */}
      <div style={{
        background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14,
        padding: "20px 24px", marginBottom: 20,
        display: "flex", gap: 16, alignItems: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryD})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 22, fontWeight: 800, flexShrink: 0,
        }}>
          {(member.name || "?")[0].toUpperCase()}
        </div>
        <div>
          <p style={{ margin: "0 0 3px", fontWeight: 800, fontSize: 16, color: C.dark }}>{member.name}</p>
          <p style={{ margin: "0 0 3px", fontSize: 13, color: C.slate }}>{member.email}</p>
          <Badge text={ROLE_LABELS[member.role] || member.role} color={C.primary} bg={C.primaryL} />
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.slate, fontWeight: 600 }}>CODE PARRAINAGE</p>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.primary }}>{member.referral_code || "—"}</p>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
        <button onClick={() => setTab("info")} style={tabStyle("info")}>✏️ Informations</button>
        <button onClick={() => setTab("pwd")}  style={tabStyle("pwd")}>🔒 Mot de passe</button>
      </div>

      {tab === "info" && (
        <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InputField label="Nom complet" required value={form.name}    onChange={inp("name",    setForm)} />
            <InputField label="Téléphone"   value={form.phone}   onChange={inp("phone",   setForm)} />
            <InputField label="Pays" as="select" value={form.country} onChange={inp("country", setForm)}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </InputField>
            <InputField label="Ville" value={form.city} onChange={inp("city", setForm)} />
          </div>
          {msg && (
            <p style={{ margin: "14px 0 0", fontSize: 13, fontWeight: 600, color: msg.startsWith("✅") ? C.green : C.red }}>{msg}</p>
          )}
          <button onClick={saveProfile} disabled={saving} style={{
            marginTop: 16, padding: "11px 24px", borderRadius: 10, border: "none",
            background: saving ? "#CBD5E1" : C.primary, color: "#fff",
            fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      )}

      {tab === "pwd" && (
        <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 400 }}>
            <InputField label="Mot de passe actuel" type="password" required value={pwForm.old_password} onChange={inp("old_password", setPwForm)} />
            <InputField label="Nouveau mot de passe" type="password" required value={pwForm.new_password} onChange={inp("new_password", setPwForm)} />
            <InputField label="Confirmer le nouveau" type="password" required value={pwForm.confirm}      onChange={inp("confirm",      setPwForm)} />
          </div>
          {pwMsg && (
            <p style={{ margin: "14px 0 0", fontSize: 13, fontWeight: 600, color: pwMsg.startsWith("✅") ? C.green : C.red }}>{pwMsg}</p>
          )}
          <button onClick={changePassword} disabled={pwSave} style={{
            marginTop: 16, padding: "11px 24px", borderRadius: 10, border: "none",
            background: pwSave ? "#CBD5E1" : C.primary, color: "#fff",
            fontWeight: 700, fontSize: 14, cursor: pwSave ? "not-allowed" : "pointer",
          }}>
            {pwSave ? "Modification..." : "Changer le mot de passe"}
          </button>
        </div>
      )}

      {/* Déconnexion */}
      <div style={{ marginTop: 24 }}>
        <button onClick={logout} style={{
          padding: "10px 20px", borderRadius: 10, border: "1.5px solid #FCA5A5",
          background: C.redL, color: C.red, fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  6. MEMBRES (créer + lister les directs)
// ═══════════════════════════════════════════════════════════════
export function AffilieMembers() {
  const member = getMember();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "Côte d'Ivoire", city: "" });
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);  // { credentials }
  const [error, setError] = useState("");

  const targetRole = CAN_CREATE[member.role];
  const inp = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const load = useCallback(() => {
    fetch(`${BASE}/api/affilie/members`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setMembers(d?.data?.members || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name || !form.email) { setError("Nom et email requis"); return; }
    setCreating(true); setError("");
    try {
      const r = await fetch(`${BASE}/api/affilie/members`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok) {
        setResult(d.data);
        setShowForm(false);
        setForm({ name: "", email: "", phone: "", country: "Côte d'Ivoire", city: "" });
        load();
      } else {
        setError(d.error || "Erreur création");
      }
    } catch { setError("Erreur réseau"); }
    setCreating(false);
  }

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <PageTitle>➕ Mes membres</PageTitle>
        {targetRole && (
          <button onClick={() => { setShowForm(p => !p); setResult(null); setError(""); }} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: C.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>
            {showForm ? "Annuler" : `➕ Créer un ${ROLE_LABELS[targetRole]?.split(" ").slice(1).join(" ") || targetRole}`}
          </button>
        )}
      </div>

      {/* Résultat création (credentials) */}
      {result && (
        <div style={{
          background: C.greenL, border: `1.5px solid ${C.green}44`,
          borderRadius: 14, padding: "16px 20px", marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 10px", fontWeight: 800, color: C.green, fontSize: 15 }}>
            ✅ Membre créé avec succès !
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: C.dark }}>
            <strong>Identifiant :</strong> {result.credentials?.username}
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: C.dark }}>
            <strong>Mot de passe temporaire :</strong>{" "}
            <code style={{ background: "#fff", padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }}>
              {result.credentials?.temp_password}
            </code>
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.slate }}>
            ⚠️ Communiquez ces identifiants de façon sécurisée. Le membre devra changer son mot de passe à la première connexion.
          </p>
          <button onClick={() => setResult(null)} style={{
            marginTop: 12, padding: "6px 14px", borderRadius: 8,
            border: `1.5px solid ${C.green}`, background: "#fff",
            color: C.green, fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>Fermer</button>
        </div>
      )}

      {/* Formulaire création */}
      {showForm && targetRole && (
        <div style={{
          background: "#fff", border: `1.5px solid ${C.border}`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 16px", fontWeight: 700, color: C.dark, fontSize: 15 }}>
            Créer un {ROLE_LABELS[targetRole] || targetRole}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InputField label="Nom complet" required value={form.name}  onChange={inp("name")} />
            <InputField label="Email"       required type="email" value={form.email} onChange={inp("email")} />
            <InputField label="Téléphone"   value={form.phone}   onChange={inp("phone")} />
            <InputField label="Ville"       value={form.city}    onChange={inp("city")} />
            <div style={{ gridColumn: "1/-1" }}>
              <InputField label="Pays" as="select" value={form.country} onChange={inp("country")}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </InputField>
            </div>
          </div>
          {error && <p style={{ margin: "12px 0 0", color: C.red, fontWeight: 600, fontSize: 13 }}>❌ {error}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={create} disabled={creating} style={{
              padding: "10px 22px", borderRadius: 10, border: "none",
              background: creating ? "#CBD5E1" : C.green, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: creating ? "not-allowed" : "pointer",
            }}>
              {creating ? "Création..." : "Créer le compte"}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${C.border}`,
              background: "#fff", color: C.slate, fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Liste des membres directs */}
      <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.dark }}>
          Membres directs ({members.length})
        </div>
        {members.length === 0 ? (
          <EmptyState icon="👥" text="Aucun membre direct pour le moment" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg, fontSize: 12, color: C.slate, fontWeight: 700 }}>
                  {["Nom", "Rôle", "Plan", "Statut", "Recrutés", "Inscrit le"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : C.bg }}>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 14 }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{m.email}</p>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge text={ROLE_LABELS[m.role] || m.role} color={C.primary} bg={C.primaryL} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.slate }}>{m.plan || "—"}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={m.status} /></td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: C.dark, textAlign: "center" }}>
                      {m.recruited_count || 0}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.slate, whiteSpace: "nowrap" }}>
                      {new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
