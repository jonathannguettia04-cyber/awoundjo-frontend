// src/pages/AdminDiaspora.jsx
// ─────────────────────────────────────────────────────────────
//  Vue admin commercial : liste des ambassadeurs diaspora
//  Accessible via /admin/diaspora (ADMIN + RESPONSABLE_COMMERCIAL)
//  Corrige : "absence de vue depuis tableau de bord admin commercial"
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Récupérer le token de l'agent commercial (pas du diaspora)
const agentToken = () => localStorage.getItem("token") || localStorage.getItem("agent_token");

const C = {
  blue:   "#1B4FD8",
  blueL:  "#EEF2FF",
  green:  "#059669",
  greenL: "#ECFDF5",
  gold:   "#D97706",
  goldL:  "#FFFBEB",
  red:    "#DC2626",
  redL:   "#FEF2F2",
  purple: "#7C3AED",
  purpleL:"#F5F3FF",
  slate:  "#64748B",
  dark:   "#0F172A",
  border: "#E2E8F0",
  bg:     "#F8FAFC",
};

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const roleLabel = {
  DIRIGEANTE: { label: "Dirigeante",   color: C.purple, bg: C.purpleL },
  DIASPORA:   { label: "Diaspora",     color: C.blue,   bg: C.blueL  },
  PAYS:       { label: "Pays",         color: C.green,  bg: C.greenL },
  VILLE:      { label: "Ville",        color: C.gold,   bg: C.goldL  },
  RECRUTEUR:  { label: "Recruteur",    color: C.slate,  bg: C.bg     },
};

const statusStyle = {
  ACTIVE:    { color: C.green, bg: C.greenL, label: "Actif"    },
  SUSPENDED: { color: C.red,   bg: C.redL,   label: "Suspendu" },
  PENDING:   { color: C.gold,  bg: C.goldL,  label: "En attente" },
};

function RoleBadge({ role }) {
  const r = roleLabel[role] || roleLabel.RECRUTEUR;
  return (
    <span style={{
      background: r.bg, color: r.color,
      padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700,
    }}>
      {r.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = statusStyle[status] || statusStyle.PENDING;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
}

export default function AdminDiaspora() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("ALL");
  const [selected, setSelected]       = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Stats globales calculées
  const stats = {
    total:      ambassadors.length,
    actifs:     ambassadors.filter(a => a.status === "ACTIVE").length,
    cartes:     ambassadors.reduce((s, a) => s + Number(a.beneficiary_count || 0), 0),
    commissions:ambassadors.reduce((s, a) => s + Number(a.total_payments_eur || 0), 0),
  };

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  useEffect(() => {
    let list = ambassadors;
    if (roleFilter !== "ALL") list = list.filter(a => a.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q) ||
        a.referral_code?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [ambassadors, search, roleFilter]);

  async function fetchAmbassadors() {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(`${API}/api/diaspora/admin/ambassadors`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setAmbassadors(data.ambassadors || []);
      setFiltered(data.ambassadors || []);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors du chargement");
    } finally { setLoading(false); }
  }

  async function validateCommission(commId) {
    setActionLoading(true);
    try {
      await axios.put(`${API}/api/diaspora/admin/commissions/${commId}/validate`, {}, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      fetchAmbassadors();
    } catch {} finally { setActionLoading(false); }
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto" }}>

      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.dark }}>
          🌍 Ambassadeurs Diaspora
        </h1>
        <p style={{ margin: "4px 0 0", color: C.slate, fontSize: 14 }}>
          Suivi du réseau MLM et des performances
        </p>
      </div>

      {/* Cartes stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "👥", label: "Total ambassadeurs", value: stats.total,      color: C.blue,   bg: C.blueL   },
          { icon: "✅", label: "Actifs",             value: stats.actifs,     color: C.green,  bg: C.greenL  },
          { icon: "🎴", label: "Cartes vendues",     value: stats.cartes,     color: C.gold,   bg: C.goldL   },
          { icon: "💰", label: "Volume total (€)",   value: `${fmt(stats.commissions)} €`, color: C.purple, bg: C.purpleL, isText: true },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 14, padding: "16px 18px",
            border: `1px solid ${s.color}22`,
          }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <p style={{ margin: "8px 0 2px", fontSize: s.isText ? 18 : 26, fontWeight: 900, color: s.color }}>
              {s.isText ? s.value : fmt(s.value)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.slate, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{
        background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`,
        padding: "14px 16px", marginBottom: 20,
        display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher par nom, email, pays, code…"
          style={{
            flex: 1, minWidth: 220, padding: "8px 14px", borderRadius: 8,
            border: `1.5px solid ${C.border}`, fontSize: 13, outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["ALL", "DIASPORA", "PAYS", "VILLE", "RECRUTEUR"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: `2px solid ${roleFilter === r ? C.blue : C.border}`,
              background: roleFilter === r ? C.blue : "#fff",
              color: roleFilter === r ? "#fff" : C.slate,
              cursor: "pointer",
            }}>
              {r === "ALL" ? "Tous" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Message erreur */}
      {error && (
        <div style={{ background: C.redL, color: C.red, padding: "12px 16px", borderRadius: 10, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tableau / liste */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${C.blueL}`,
            borderTop: `3px solid ${C.blue}`, borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.slate }}>
          <p style={{ fontSize: 40 }}>🌍</p>
          <p style={{ fontWeight: 700, color: C.dark }}>Aucun ambassadeur trouvé</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(amb => (
            <div
              key={amb.id}
              onClick={() => setSelected(selected?.id === amb.id ? null : amb)}
              style={{
                background: "#fff", borderRadius: 12,
                border: `1px solid ${selected?.id === amb.id ? C.blue : C.border}`,
                padding: "14px 16px", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {/* Ligne principale */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                {/* Avatar initiales */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: roleLabel[amb.role]?.bg || C.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 900, color: roleLabel[amb.role]?.color || C.slate,
                }}>
                  {amb.name?.charAt(0)?.toUpperCase() || "?"}
                </div>

                {/* Infos principales */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontWeight: 800, color: C.dark, fontSize: 14 }}>{amb.name}</p>
                    <RoleBadge role={amb.role} />
                    <StatusBadge status={amb.status} />
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
                    {amb.email} • {amb.country} {amb.city ? `• ${amb.city}` : ""}
                  </p>
                </div>

                {/* Métriques */}
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 800, color: C.blue, fontSize: 16 }}>{amb.beneficiary_count || 0}</p>
                    <p style={{ margin: 0, fontSize: 10, color: C.slate }}>Cartes</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 800, color: C.green, fontSize: 16 }}>{amb.recruit_count || 0}</p>
                    <p style={{ margin: 0, fontSize: 10, color: C.slate }}>Recrutés</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 800, color: C.gold, fontSize: 16 }}>{fmt(amb.total_payments_eur)} €</p>
                    <p style={{ margin: 0, fontSize: 10, color: C.slate }}>Volume</p>
                  </div>
                </div>

                <span style={{ fontSize: 14, color: C.slate }}>{selected?.id === amb.id ? "▲" : "▼"}</span>
              </div>

              {/* Détail dépliable */}
              {selected?.id === amb.id && (
                <div style={{
                  marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`,
                  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10,
                }}>
                  {[
                    { label: "Code ambassadeur", value: amb.referral_code },
                    { label: "Inscrit le",        value: fmtDate(amb.created_at) },
                    { label: "Dernière connexion", value: fmtDate(amb.last_login) },
                    { label: "Total gagné (€)",   value: `${fmt(amb.total_earned)} €` },
                    { label: "Téléphone",          value: amb.phone || "—" },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: C.bg, borderRadius: 8, padding: "10px 12px",
                    }}>
                      <p style={{ margin: 0, fontSize: 10, color: C.slate, fontWeight: 600 }}>{item.label}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 700, color: C.dark }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Compteur résultats */}
      {!loading && (
        <p style={{ marginTop: 16, textAlign: "center", color: C.slate, fontSize: 12 }}>
          {filtered.length} ambassadeur(s) affiché(s) sur {ambassadors.length} au total
        </p>
      )}
    </div>
  );
}
