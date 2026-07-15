// AdminSmsDelivery.jsx
// ══════════════════════════════════════════════════════════════
//  Awoundjô — Admin : suivi des statuts de livraison SMS (DLR)
//  Consomme GET /api/sms/dlr (liste paginée + filtres)
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  0: { label: "En attente", color: "#6b7280", bg: "#f3f4f6" },
  1: { label: "En cours", color: "#2563eb", bg: "#eff6ff" },
  2: { label: "Envoyé à l'opérateur", color: "#7c3aed", bg: "#f5f3ff" },
  3: { label: "Délivré", color: "#15803d", bg: "#f0fdf4" },
  4: { label: "Refusé", color: "#b91c1c", bg: "#fef2f2" },
  6: { label: "Non délivré", color: "#b91c1c", bg: "#fef2f2" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: `Statut ${status}`, color: "#374151", bg: "#f3f4f6" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: cfg.color,
        backgroundColor: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminSmsDelivery() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const limit = 20;

  const apiBase = import.meta.env.VITE_API_URL || "";

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter !== "") params.set("status", statusFilter);
      if (phoneFilter.trim()) params.set("phone", phoneFilter.trim());

      const res = await fetch(`${apiBase}/api/sms/dlr?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors du chargement");
      }

      setRows(data.data || []);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, phoneFilter, apiBase, token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#111827" }}>
          Suivi des SMS
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Statuts de livraison remontés par MTarget (accusés de réception)
        </p>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          style={{
            padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db",
            fontSize: 14, color: "#111827", backgroundColor: "#fff",
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="0">En attente</option>
          <option value="1">En cours</option>
          <option value="2">Envoyé à l'opérateur</option>
          <option value="3">Délivré</option>
          <option value="4">Refusé</option>
          <option value="6">Non délivré</option>
        </select>

        <input
          type="text"
          placeholder="Rechercher un numéro (ex: 225...)"
          value={phoneFilter}
          onChange={(e) => { setPage(1); setPhoneFilter(e.target.value); }}
          style={{
            padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db",
            fontSize: 14, flex: 1, minWidth: 220,
          }}
        />

        <button
          onClick={fetchLogs}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            backgroundColor: "#111827", color: "#fff", fontSize: 14,
            fontWeight: 600, cursor: "pointer",
          }}
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div style={{
          padding: 12, borderRadius: 8, backgroundColor: "#fef2f2",
          color: "#b91c1c", fontSize: 14, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Tableau */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", textAlign: "left" }}>
              <th style={th}>Destinataire</th>
              <th style={th}>Statut</th>
              <th style={th}>Envoyé le</th>
              <th style={th}>Délivré le</th>
              <th style={th}>Détail opérateur</th>
              <th style={th}>Ticket</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#6b7280" }}>Chargement…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#6b7280" }}>Aucun SMS trouvé</td></tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={td}>{row.destination_address || "—"}</td>
                <td style={td}><StatusBadge status={row.status} /></td>
                <td style={td}>{formatDate(row.send_date_time || row.create_date_time)}</td>
                <td style={td}>{formatDate(row.delivery_date_time)}</td>
                <td style={{ ...td, color: "#6b7280" }}>{row.reason || "—"}</td>
                <td style={{ ...td, fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>
                  {row.msg_id?.slice(0, 8)}…
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {total} SMS · page {page} / {totalPages}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            style={pagerBtn(page <= 1)}
          >
            Précédent
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            style={pagerBtn(page >= totalPages)}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

const th = { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 };
const td = { padding: "12px 14px", color: "#111827" };
const pagerBtn = (disabled) => ({
  padding: "6px 14px", borderRadius: 8, border: "1px solid #d1d5db",
  backgroundColor: disabled ? "#f3f4f6" : "#fff", color: disabled ? "#9ca3af" : "#111827",
  fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
});
