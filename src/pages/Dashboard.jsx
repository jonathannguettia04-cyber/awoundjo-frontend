import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { statsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatsCard from "../components/StatsCard";
import { StatusBadge, PlanBadge, TypeBadge, MethodBadge } from "../components/Badge";

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

// Barre de progression colorée
function ProgressBar({ value, max, color = "bg-brand-500" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Miniature graphique en barres (évolution)
function MiniChart({ data = [] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => Number(d.revenue || 0)), 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.slice(-12).map((d, i) => {
        const h = Math.max(4, Math.round((Number(d.revenue || 0) / max) * 40));
        return (
          <div key={i} title={`${d.month} : ${fmt(d.revenue)}`}
            className="flex-1 bg-brand-400 hover:bg-brand-600 rounded-sm transition-colors cursor-default"
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
   api.get("/stats/dashboard")
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
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center font-medium">{error}</div>
    </div>
  );

  const { clients: cs, payments: ps, top_agents, last_clients, last_payments, evolution = [] } = data;

  const now   = new Date();
  const heure = now.getHours();
  const greeting = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-slate-800">
            <span className="text-brand-600">{user?.name}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/clients/new"
            className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-brand-200 flex items-center gap-2">
            <span>+</span> Nouveau client
          </Link>
          {isAdmin && (
            <Link to="/agents"
              className="border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
              👥 Agents
            </Link>
          )}
        </div>
      </div>

      {/* ── KPI Revenus ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenus</h2>
          <Link to="/payments" className="text-xs text-brand-500 hover:underline font-medium">Voir les paiements →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Revenu total"
            value={fmt(ps.total_revenue)}
            icon="💰"
            color="success"
            sub={`${ps.total_payments} paiements`}
            to="/payments"
          />
          <StatsCard
            label="Aujourd'hui"
            value={fmt(ps.today_revenue)}
            icon="📅"
            color="brand"
            sub={`${ps.today_payments} paiements`}
            to="/payments"
          />
          <StatsCard
            label="Adhésions"
            value={fmt(ps.adhesions_revenue)}
            icon="📋"
            color="purple"
            to="/payments"
          />
          <StatsCard
            label="Mensualités"
            value={fmt(ps.mensualites_revenue)}
            icon="🔄"
            color="teal"
            to="/payments"
          />
        </div>

        {/* Méthodes de paiement */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/payments")}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">📱 Wave</p>
              <span className="text-sm font-bold text-orange-600">{fmt(ps.wave_revenue)}</span>
            </div>
            <ProgressBar
              value={Number(ps.wave_revenue)}
              max={Number(ps.total_revenue)}
              color="bg-orange-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              {ps.total_revenue > 0 ? Math.round((ps.wave_revenue / ps.total_revenue) * 100) : 0}% du total
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/payments")}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">💵 Cash</p>
              <span className="text-sm font-bold text-green-600">{fmt(ps.cash_revenue)}</span>
            </div>
            <ProgressBar
              value={Number(ps.cash_revenue)}
              max={Number(ps.total_revenue)}
              color="bg-green-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              {ps.total_revenue > 0 ? Math.round((ps.cash_revenue / ps.total_revenue) * 100) : 0}% du total
            </p>
          </div>
        </div>
      </section>

      {/* ── KPI Clients ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clients</h2>
          <Link to="/clients" className="text-xs text-brand-500 hover:underline font-medium">Voir tous →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard label="Total"       value={cs.total_clients}    icon="👥" color="brand"   to="/clients" />
          <StatsCard label="Actifs"      value={cs.active}           icon="✅" color="success" to="/clients?status=actif" />
          <StatsCard label="En attente"  value={cs.pending}          icon="⏳" color="warning" to="/clients?status=attente" />
          <StatsCard label="Essentielle" value={cs.plan_essentielle} icon="🌱" color="brand"   to="/clients?plan=ESSENTIELLE" />
          <StatsCard label="Ivoirienne"  value={cs.plan_ivoirienne}  icon="🌿" color="purple"  to="/clients?plan=IVOIRIENNE" />
          <StatsCard label="Turquoise"   value={cs.plan_turquoise}   icon="💎" color="teal"    to="/clients?plan=TURQUOISE" />
        </div>

        {/* Répartition plans */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Répartition par formule</p>
          <div className="space-y-3">
            {[
              { label: "Essentielle", value: Number(cs.plan_essentielle), color: "bg-brand-500", text: "text-brand-600" },
              { label: "Ivoirienne",  value: Number(cs.plan_ivoirienne),  color: "bg-purple-500", text: "text-purple-600" },
              { label: "Turquoise",   value: Number(cs.plan_turquoise),   color: "bg-teal-500",   text: "text-teal-600" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className={`font-bold ${item.text}`}>{item.value} clients</span>
                </div>
                <ProgressBar value={item.value} max={Number(cs.total_clients)} color={item.color} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Évolution 12 mois ──────────────────────────────────── */}
      {evolution.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Évolution des revenus</p>
              <p className="text-xs text-slate-400 mt-0.5">12 derniers mois</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              {evolution.length} mois
            </span>
          </div>
          <MiniChart data={evolution} />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400">{evolution[0]?.month}</span>
            <span className="text-xs text-slate-400">{evolution[evolution.length - 1]?.month}</span>
          </div>
        </section>
      )}

      {/* ── Top Agents (admin seulement) ───────────────────────── */}
      {isAdmin && top_agents?.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">🏆 Top Agents</h2>
            <Link to="/agents" className="text-xs text-brand-500 hover:underline font-medium">Gérer →</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {top_agents.slice(0, 5).map((a, i) => {
                const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                const maxRevenue = Number(top_agents[0]?.total_revenue || 1);
                return (
                  <Link key={a.id} to={`/agents`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                    <span className="text-xl w-8 flex-shrink-0 text-center">{medals[i]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-600 transition-colors">{a.name}</p>
                        <p className="text-sm font-bold text-brand-600 flex-shrink-0 ml-2">{fmt(a.total_revenue)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={Number(a.total_revenue)} max={maxRevenue} color="bg-brand-400" />
                        <span className="text-xs text-slate-400 flex-shrink-0">{a.nb_clients} clients</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Dernières activités ────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Derniers clients */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800 text-sm">Derniers clients inscrits</h2>
            <Link to="/clients" className="text-brand-500 text-xs hover:underline font-medium">Voir tout →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {!last_clients?.length && (
              <p className="text-center text-slate-400 text-sm py-10">Aucun client pour l'instant</p>
            )}
            {last_clients?.map((c) => (
              <Link key={c.id} to={`/clients/${c.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors group">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-600 font-bold text-sm">{c.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-600 transition-colors">{c.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{c.mutual_number}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <PlanBadge plan={c.plan} />
                  <div><StatusBadge status={c.status} /></div>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
            <Link to="/clients/new"
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              + Enregistrer un nouveau client
            </Link>
          </div>
        </section>

        {/* Derniers paiements */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800 text-sm">Derniers paiements reçus</h2>
            <Link to="/payments" className="text-brand-500 text-xs hover:underline font-medium">Voir tout →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {!last_payments?.length && (
              <p className="text-center text-slate-400 text-sm py-10">Aucun paiement pour l'instant</p>
            )}
            {last_payments?.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                {/* Icône type */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${p.type === "adhesion" ? "bg-purple-50 border border-purple-100" : "bg-teal-50 border border-teal-100"}`}>
                  <span className="text-base">{p.type === "adhesion" ? "📋" : "🔄"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.client_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TypeBadge type={p.type} />
                    <MethodBadge method={p.payment_method} />
                    {isAdmin && p.agent_name && (
                      <span className="text-xs text-slate-400">· {p.agent_name}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-brand-600 text-sm">{fmt(p.amount)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(p.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
            <Link to="/clients"
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              + Enregistrer un paiement
            </Link>
          </div>
        </section>
      </div>

    </div>
  );
}