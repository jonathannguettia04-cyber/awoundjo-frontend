import { useEffect, useState } from "react";
import { statsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function ProgressBar({ value, max, color = "bg-brand-500" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function KpiCard({ label, value, sub, icon, color = "brand" }) {
  const themes = {
    brand:   "bg-white border-brand-200   text-brand-700",
    success: "bg-white border-green-200   text-green-700",
    warning: "bg-white border-amber-200   text-amber-700",
    purple:  "bg-white border-purple-200  text-purple-700",
    teal:    "bg-white border-teal-200    text-teal-600",
  };
  const bars = { brand: "bg-brand-500", success: "bg-green-500", warning: "bg-amber-500", purple: "bg-purple-500", teal: "bg-teal-500" };

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${themes[color]}`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${bars[color]} opacity-60`} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold leading-none">{value ?? "—"}</p>
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
        </div>
        <span className="text-2xl opacity-80">{icon}</span>
      </div>
    </div>
  );
}

export default function Commissions() {
  const { isAdmin } = useAuth();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [agentId,   setAgentId]   = useState(""); // filtre admin par agent

  async function load(aid = "") {
    setLoading(true); setError("");
    try {
      const params = aid ? { agent_id: aid } : {};
      const { data: d } = await statsAPI.commissions(params);
      setData(d);
    } catch {
      setError("Impossible de charger les commissions");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">{error}</div>
    </div>
  );

  const { year, contract, totals, by_month, detail, agent_ranking, rates } = data;

  // Calcul du mois courant pour la progression
  const currentMonth = new Date().getMonth(); // 0-11
  const monthsElapsed = currentMonth + 1;
  const progressPct = Math.round((monthsElapsed / 12) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Commissions</h1>
          <p className="text-slate-500 text-sm">Année {year} · Contrat du 01/01 au 31/12</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <span className="text-amber-500 text-lg">⏳</span>
          <div>
            <p className="text-xs text-amber-600 font-semibold">Fin de contrat dans</p>
            <p className="text-sm font-bold text-amber-700">{contract.days_left} jours</p>
          </div>
        </div>
      </div>

      {/* ── Barre progression annuelle ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progression annuelle</p>
          <span className="text-xs font-semibold text-brand-600">{progressPct}% de l'année écoulée</span>
        </div>
        <ProgressBar value={monthsElapsed} max={12} color="bg-brand-500" />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-400">01 Jan {year}</span>
          <span className="text-xs text-slate-400">31 Déc {year}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Taux adhésion</p>
            <p className="font-bold text-purple-600">{rates.adhesion}%</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Taux mensualité</p>
            <p className="font-bold text-teal-600">{rates.mensualite}%</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Paiements</p>
            <p className="font-bold text-slate-700">{totals.nb_paiements}</p>
          </div>
        </div>
      </div>

      {/* ── Filtre agent (admin) ── */}
      {isAdmin && agent_ranking?.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Filtrer par agent :</label>
          <select
            value={agentId}
            onChange={(e) => { setAgentId(e.target.value); load(e.target.value); }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous les agents</option>
            {agent_ranking.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── KPI Commissions ── */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Total {year}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Commission totale"
            value={fmt(totals.commission_totale)}
            icon="💰"
            color="success"
            sub={`sur ${fmt(totals.total_collecte)} collectés`}
          />
          <KpiCard
            label="Sur adhésions"
            value={fmt(totals.commission_adhesion)}
            icon="📋"
            color="purple"
            sub={`${totals.nb_adhesions} adhésion(s) · ${rates.adhesion}%`}
          />
          <KpiCard
            label="Sur mensualités"
            value={fmt(totals.commission_mensualite)}
            icon="🔄"
            color="teal"
            sub={`${totals.nb_mensualites} mensualité(s) · ${rates.mensualite}%`}
          />
          <KpiCard
            label="Paiements traités"
            value={totals.nb_paiements}
            icon="🧾"
            color="brand"
            sub="cette année"
          />
        </div>
      </section>

      {/* ── Évolution mensuelle ── */}
      {by_month?.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800 text-sm">Commissions mois par mois</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Mois</th>
                  <th className="text-right px-4 py-3">Base adhésion</th>
                  <th className="text-right px-4 py-3">Commission (10%)</th>
                  <th className="text-right px-4 py-3">Base mensualité</th>
                  <th className="text-right px-4 py-3">Commission (5%)</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {by_month.map((m) => {
                  const monthNum = parseInt(m.month.split("-")[1]) - 1;
                  const isCurrentMonth = m.month === `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
                  return (
                    <tr key={m.month} className={`hover:bg-slate-50 transition-colors ${isCurrentMonth ? "bg-brand-50/40" : ""}`}>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {MONTHS_FR[monthNum]} {year}
                        {isCurrentMonth && <span className="ml-2 text-xs bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full">En cours</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">{fmt(m.adhesion_base)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-purple-600">{fmt(m.commission_adhesion)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{fmt(m.mensualite_base)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-teal-600">{fmt(m.commission_mensualite)}</td>
                      <td className="px-4 py-3 text-right font-bold text-brand-600">{fmt(m.commission_totale)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-800">TOTAL {year}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-600">{fmt(totals.total_collecte)}</td>
                  <td className="px-4 py-3 text-right font-bold text-purple-600">{fmt(totals.commission_adhesion)}</td>
                  <td className="px-4 py-3 text-right"></td>
                  <td className="px-4 py-3 text-right font-bold text-teal-600">{fmt(totals.commission_mensualite)}</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-700 text-base">{fmt(totals.commission_totale)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* ── Classement agents (admin global) ── */}
      {isAdmin && !agentId && agent_ranking?.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">🏆 Classement des agents</h2>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {agent_ranking.map((a, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const maxComm = Number(agent_ranking[0]?.commission_totale || 1);
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <span className="text-xl w-8 text-center flex-shrink-0">{medals[i] || `#${i + 1}`}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-800">{a.name}</p>
                        <p className="font-bold text-brand-600 text-sm">{fmt(a.commission_totale)}</p>
                      </div>
                      <ProgressBar value={Number(a.commission_totale)} max={maxComm} color="bg-brand-400" />
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                        <span>📋 {fmt(a.commission_adhesion)} adhésion</span>
                        <span>🔄 {fmt(a.commission_mensualite)} mensualité</span>
                        <span>👥 {a.nb_clients} clients</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Détail paiements ── */}
      {detail?.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800 text-sm">Détail des 30 derniers paiements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Client</th>
                  {isAdmin && <th className="text-left px-4 py-3">Agent</th>}
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Montant</th>
                  <th className="text-right px-4 py-3">Taux</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-700">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {detail.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.client_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.mutual_number}</p>
                    </td>
                    {isAdmin && <td className="px-4 py-3 text-slate-600 text-xs">{p.agent_name}</td>}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.type === "adhesion"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-teal-100 text-teal-700"
                      }`}>
                        {p.type === "adhesion" ? "Adhésion" : "Mensualité"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs">{p.taux_pct}%</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-600">{fmt(p.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
