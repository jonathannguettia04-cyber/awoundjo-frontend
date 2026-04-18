// src/pages/AdminExports.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "https://awoundjo-backend-production-ba8c.up.railway.app";

function getToken() {
  try { return localStorage.getItem("token"); } catch { return null; }
}

const EXPORTS = [
  {
    id: "clients",
    icon: "👥",
    label: "Clients",
    desc: "Base complète des adhérents (nom, téléphone, ville, formule, statut, paiements)",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    endpoint: "/api/clients?limit=10000",
    filename: "awoundjo_clients",
    mapper: (data) => {
      const rows = data.clients || data;
      return rows.map(c => ({
        "N° Mutuel":      c.mutual_number || "",
        "Nom":            c.name || "",
        "Téléphone":      c.phone || "",
        "Ville":          c.city || "",
        "Formule":        c.plan || "",
        "Statut":         c.status || "",
        "Validation":     c.status_validation || "",
        "Paiement":       c.status_payment || "",
        "Total payé":     c.total_paid || "0",
        "Agent":          c.agent_name || "",
        "Créé le":        c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "",
      }));
    },
  },
  {
    id: "agents",
    icon: "👤",
    label: "Agents",
    desc: "Liste des commerciaux et gestionnaires (nom, rôle, zone, performances)",
    color: "#0891B2",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    endpoint: "/api/agents",
    filename: "awoundjo_agents",
    mapper: (data) => {
      const rows = data.agents || data;
      return rows.map(a => ({
        "Nom":        a.name || "",
        "Téléphone":  a.phone || "",
        "Rôle":       a.role || "",
        "Zone":       a.zone || "",
        "Statut":     a.status || "",
        "Créé le":    a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "",
      }));
    },
  },
  {
    id: "diaspora",
    icon: "🌍",
    label: "Diaspora",
    desc: "Réseau ambassadeurs diaspora (hiérarchie, pays, commissions)",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    endpoint: "/api/diaspora/admin/ambassadors",
    filename: "awoundjo_diaspora",
    mapper: (data) => {
      const rows = data.ambassadors || data.data || data;
      return rows.map(a => ({
        "Code":           a.ambassador_code || "",
        "Nom":            a.name || "",
        "Email":          a.email || "",
        "Téléphone":      a.phone || "",
        "Rôle":           a.role || "",
        "Pays":           a.country || "",
        "Devise":         a.currency || "",
        "Statut":         a.status || "",
        "Parrain":        a.sponsor_code || "",
        "Créé le":        a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "",
      }));
    },
  },
  {
    id: "federation",
    icon: "⛪",
    label: "Fédérations",
    desc: "Réseau ambassadeurs fédérations & églises",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    endpoint: "/api/federation/admin/ambassadors",
    filename: "awoundjo_federations",
    mapper: (data) => {
      const rows = data.ambassadors || data.data || data;
      return rows.map(a => ({
        "Code":           a.ambassador_code || "",
        "Nom":            a.name || "",
        "Email":          a.email || "",
        "Téléphone":      a.phone || "",
        "Rôle":           a.role || "",
        "Organisation":   a.country || "",
        "Devise":         a.currency || "",
        "Statut":         a.status || "",
        "Parrain":        a.sponsor_code || "",
        "Créé le":        a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "",
      }));
    },
  },
  {
    id: "healthcare",
    icon: "🏥",
    label: "Établissements",
    desc: "Réseau de soins partenaires (cliniques, pharmacies, labos)",
    color: "#DB2777",
    bg: "#FDF2F8",
    border: "#FBCFE8",
    endpoint: "/api/healthcare/providers",
    filename: "awoundjo_etablissements",
    mapper: (data) => {
      const rows = data.providers || data.etablissements || data;
      return rows.map(e => ({
        "Nom":          e.name || "",
        "Type":         e.type || e.category || "",
        "Ville":        e.city || "",
        "Téléphone":    e.phone || "",
        "Email":        e.email || "",
        "Statut":       e.status || "",
        "Créé le":      e.created_at ? new Date(e.created_at).toLocaleDateString("fr-FR") : "",
      }));
    },
  },
];

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(";"),
    ...rows.map(r => headers.map(h => escape(r[h])).join(";")),
  ].join("\n");
}

function downloadCSV(csv, filename) {
  const bom = "\uFEFF"; // UTF-8 BOM pour Excel
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminExports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});

  async function handleExport(exp) {
    setLoading(l => ({ ...l, [exp.id]: true }));
    setResults(r => ({ ...r, [exp.id]: null }));
    try {
      const res = await fetch(`${API}${exp.endpoint}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      const payload = data.data ?? data;
      const rows = exp.mapper(payload);
      if (!rows.length) {
        setResults(r => ({ ...r, [exp.id]: { type: "warn", msg: "Aucune donnée à exporter." } }));
        return;
      }
      downloadCSV(toCSV(rows), exp.filename);
      setResults(r => ({ ...r, [exp.id]: { type: "ok", msg: `✅ ${rows.length} ligne(s) exportée(s)` } }));
    } catch (e) {
      setResults(r => ({ ...r, [exp.id]: { type: "err", msg: `❌ ${e.message}` } }));
    } finally {
      setLoading(l => ({ ...l, [exp.id]: false }));
    }
  }

  return (
    <div style={s.page}>
      <button onClick={() => navigate("/hub")} style={s.back}>← Retour au hub</button>

      <div style={s.header}>
        <h1 style={s.title}>📤 Exports de données</h1>
        <p style={s.subtitle}>Téléchargez vos données en CSV — compatibles Excel & Google Sheets</p>
      </div>

      <div style={s.grid}>
        {EXPORTS.map(exp => {
          const isLoading = loading[exp.id];
          const result    = results[exp.id];
          return (
            <div key={exp.id} style={{ ...s.card, borderTop: `4px solid ${exp.color}` }}>
              <div style={s.cardHeader}>
                <span style={s.cardIcon}>{exp.icon}</span>
                <div>
                  <h2 style={{ ...s.cardTitle, color: exp.color }}>{exp.label}</h2>
                  <p style={s.cardDesc}>{exp.desc}</p>
                </div>
              </div>

              {result && (
                <div style={{
                  ...s.resultBanner,
                  background: result.type === "ok" ? "#F0FDF4" : result.type === "warn" ? "#FFFBEB" : "#FEF2F2",
                  color:      result.type === "ok" ? "#15803D" : result.type === "warn" ? "#B45309" : "#B91C1C",
                  border:     `1px solid ${result.type === "ok" ? "#BBF7D0" : result.type === "warn" ? "#FDE68A" : "#FECACA"}`,
                }}>
                  {result.msg}
                </div>
              )}

              <button
                onClick={() => handleExport(exp)}
                disabled={isLoading}
                style={{
                  ...s.btn,
                  background: isLoading ? "#94A3B8" : exp.color,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "⏳ Téléchargement..." : "⬇️ Télécharger CSV"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page:         { maxWidth: 900, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans',system-ui,sans-serif" },
  back:         { background: "none", border: "none", color: "#7C3AED", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 20, padding: 0 },
  header:       { marginBottom: 28 },
  title:        { fontSize: 26, fontWeight: 900, color: "#0F172A", margin: "0 0 6px" },
  subtitle:     { fontSize: 14, color: "#64748B", margin: 0 },

  grid:         { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 },
  card:         { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 10px rgba(0,0,0,.05)", display: "flex", flexDirection: "column", gap: 14 },
  cardHeader:   { display: "flex", gap: 14, alignItems: "flex-start" },
  cardIcon:     { fontSize: 32, flexShrink: 0 },
  cardTitle:    { fontSize: 16, fontWeight: 800, margin: "0 0 4px" },
  cardDesc:     { fontSize: 12, color: "#94A3B8", margin: 0, lineHeight: 1.5 },

  resultBanner: { padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 },

  btn:          { color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, width: "100%", transition: "opacity .15s" },
};
