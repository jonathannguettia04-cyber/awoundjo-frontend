import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { statsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatsCard from "../components/StatsCard";
import { StatusBadge, PlanBadge, TypeBadge, MethodBadge } from "../components/Badge";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    statsAPI.dashboard()
      .then(({ data }) => setData(data))
      .catch(() => setError("Impossible de charger le tableau de bord"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Chargement…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">{error}</div>
    </div>
  );

  const { clients: cs, payments: ps, top_agents, last_clients, last_payments } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Bienvenue, <span className="font-medium text-brand-600">{user?.name}</span>
          </p>
        </div>
        <Link to="/clients" className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors hidden sm:block">
          + Nouveau client
        </Link>
      </div>

      {/* Stats clients */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Clients</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard label="Total"       value={cs.total_clients}    icon="👥" color="brand"   />
          <StatsCard label="Actifs"      value={cs.active}           icon="✅" color="success" />
          <StatsCard label="En attente"  value={cs.pending}          icon="⏳" color="warning" />
          <StatsCard label="Essentielle" value={cs.plan_essentielle} icon="🌱" color="brand"   />
          <StatsCard label="Ivoirienne"  value={cs.plan_ivoirienne}  icon="🌿" color="purple"  />
          <StatsCard label="Turquoise"   value={cs.plan_turquoise}   icon="💎" color="teal"    />
        </div>
      </section>

      {/* Stats paiements */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Paiements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard label="Revenu total" value={fmt(ps.total_revenue)}       icon="💰" color="success" />
          <StatsCard label="Aujourd'hui"  value={fmt(ps.today_revenue)}       icon="📅" color="brand"   />
          <StatsCard label="Adhésions"    value={fmt(ps.adhesions_revenue)}   icon="📋" color="purple"  />
          <StatsCard label="Mensualités"  value={fmt(ps.mensualites_revenue)} icon="🔄" color="teal"    />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          <StatsCard label="Nb paiements" value={ps.total_payments}   icon="🧾" color="brand"   />
          <StatsCard label="Via Wave"     value={fmt(ps.wave_revenue)} icon="📱" color="warning" />
          <StatsCard label="Via Cash"     value={fmt(ps.cash_revenue)} icon="💵" color="success" />
        </div>
      </section>

      {/* Top agents (admin seulement) */}
      {isAdmin && top_agents?.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Top Agents</h2>
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Agent</th>
                  <th className="text-right px-4 py-3">Clients</th>
                  <th className="text-right px-4 py-3">Collecté</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {top_agents.slice(0, 5).map((a, i) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <span className="text-slate-400 mr-2">#{i + 1}</span>{a.name}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{a.nb_clients}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">{fmt(a.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Dernières activités */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Derniers clients */}
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800">Derniers clients</h2>
            <Link to="/clients" className="text-brand-500 text-xs hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {last_clients?.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">Aucun client</p>
            )}
            {last_clients?.map((c) => (
              <Link key={c.id} to={`/clients/${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.mutual_number}</p>
                </div>
                <div className="text-right space-y-1">
                  <PlanBadge plan={c.plan} />
                  <div><StatusBadge status={c.status} /></div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Derniers paiements */}
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800">Derniers paiements</h2>
            <Link to="/payments" className="text-brand-500 text-xs hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {last_payments?.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">Aucun paiement</p>
            )}
            {last_payments?.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.client_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TypeBadge type={p.type} />
                    <MethodBadge method={p.payment_method} />
                  </div>
                </div>
                <p className="font-semibold text-brand-600 text-sm">{fmt(p.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
