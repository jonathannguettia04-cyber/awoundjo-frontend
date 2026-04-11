// src/pages/Payments.jsx
import { useEffect, useState, useCallback } from "react";
import { paymentAPI } from "../services/api";
import { TypeBadge, MethodBadge } from "../components/Badge";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

function StatusBadge({ status }) {
  const map = {
    paid:    { label: "✅ Payé",       bg: "#ECFDF5", color: "#059669" },
    pending: { label: "⏳ En attente", bg: "#FFFBEB", color: "#D97706" },
    failed:  { label: "❌ Échoué",     bg: "#FEF2F2", color: "#DC2626" },
  };
  const s = map[status] || { label: status, bg: "#F8FAFC", color: "#64748B" };
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

export default function Payments() {
  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [pagination,   setPagination]   = useState({ total: 0, page: 1, pages: 1 });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search)       params.search         = search;
      if (filterType)   params.type           = filterType;
      if (filterMethod) params.payment_method = filterMethod;

      const { data } = await paymentAPI.getAll(params);

      setPayments(data.payments || []);
      // ── Pagination — le backend retourne maintenant data.pagination ──
      setPagination(
        data.pagination || {
          total: data.payments?.length || 0,
          page:  page,
          pages: 1,
          limit: 20,
        }
      );
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterMethod]);

  useEffect(() => { load(1); }, [load]);

  // ── Totaux rapides ──────────────────────────────────────────────────────
  const totalAmount = payments
    .filter(p => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Paiements</h1>
        <p className="text-slate-500 text-sm">
          {pagination.total} paiement(s) — {fmt(totalAmount)} collectés
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher par client ou N° mutuel…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Tous les types</option>
          <option value="adhesion">Adhésion</option>
          <option value="mensualite">Mensualité</option>
        </select>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Toutes les méthodes</option>
          <option value="cinetpay">CinetPay</option>
          <option value="paydunya">PayDunya</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🧾</p>
            <p className="font-medium">Aucun paiement trouvé</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Méthode</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-right px-4 py-3">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(p.paid_at || p.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{p.client_name}</p>
                        {p.mutual_number && (
                          <p className="text-xs text-slate-400 font-mono">{p.mutual_number}</p>
                        )}
                        {p.agent_name && (
                          <p className="text-xs text-slate-400">via {p.agent_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                      <td className="px-4 py-3"><MethodBadge method={p.payment_method} /></td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-600">
                        {fmt(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50 text-sm text-slate-500">
                <span>Page {pagination.page} / {pagination.pages} ({pagination.total} total)</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => load(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
                  >← Préc</button>
                  <button
                    onClick={() => load(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
                  >Suiv →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
