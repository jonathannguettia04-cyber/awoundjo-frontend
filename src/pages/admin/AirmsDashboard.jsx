// pages/admin/AirmsDashboard.jsx
//
// Tableau de bord du dossier réglementaire AIRMS. Affiche le statut de
// chaque élément (adhérents, cotisations, prestations, finances, rapports
// narratifs) pour un exercice donné, avec la progression globale.
// Les éléments manuels (rapport moral, comité de contrôle, AG) sont
// modifiables directement depuis cette page.

import { useEffect, useState, useCallback } from "react";
import GovernanceSection from "./GovernanceSection";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || "Erreur serveur");
  return data;
}

const STATUS_META = {
  NON_RENSEIGNEE: { label: "Non renseignée", color: "#9CA3AF", bg: "#F3F4F6" },
  A_COMPLETER:    { label: "À compléter",    color: "#B45309", bg: "#FEF3C7" },
  A_VERIFIER:     { label: "À vérifier",     color: "#B91C1C", bg: "#FEE2E2" },
  A_VALIDER:      { label: "À valider",      color: "#1D4ED8", bg: "#DBEAFE" },
  COMPLET:        { label: "Complet",        color: "#047857", bg: "#D1FAE5" },
  PRET:           { label: "Prêt",           color: "#047857", bg: "#D1FAE5" },
};

const ELEMENT_LABELS = {
  adherents:                "Données adhérents",
  cotisations:               "Cotisations",
  prestations:               "Prestations",
  finances:                  "Données financières",
  rapport_moral:             "Rapport moral",
  rapport_technique:         "Rapport technique",
  rapport_comite_controle:   "Rapport du Comité de contrôle",
  assemblee_generale:        "Assemblée Générale",
};

const MANUAL_STATUS_OPTIONS = ["NON_RENSEIGNEE", "A_COMPLETER", "A_VERIFIER", "A_VALIDER", "COMPLET", "PRET"];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.NON_RENSEIGNEE;
  return (
    <span
      style={{ color: meta.color, backgroundColor: meta.bg }}
      className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
    >
      {meta.label}
    </span>
  );
}

function CompletionBar({ pct }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 tabular-nums">{pct}%</span>
    </div>
  );
}

export default function AirmsDashboard() {
  const currentYear = new Date().getFullYear();
  const [exercice, setExercice] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  const load = useCallback(async (year) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/airms/dashboard?exercice=${year}`);
      setData(res?.data || res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(exercice); }, [exercice, load]);

  async function handleManualUpdate(elementKey, newStatus) {
    setSavingKey(elementKey);
    try {
      await apiFetch(`/api/airms/dashboard/${elementKey}`, {
        method: "PUT",
        body: JSON.stringify({ exercice, status: newStatus }),
      });
      await load(exercice);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  }

  const [notesDraft, setNotesDraft] = useState({});
  async function handleNotesSave(elementKey, currentStatus) {
    setSavingKey(elementKey + ":notes");
    try {
      await apiFetch(`/api/airms/dashboard/${elementKey}`, {
        method: "PUT",
        body: JSON.stringify({ exercice, status: currentStatus, notes: notesDraft[elementKey] ?? "" }),
      });
      await load(exercice);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [generatingType, setGeneratingType] = useState(null); // 'technique' | 'financier' | null
  const [reports, setReports] = useState([]);

  const loadReports = useCallback(async (year) => {
    try {
      const res = await apiFetch(`/api/airms/reports?exercice=${year}`);
      setReports((res?.data || res)?.reports || []);
    } catch (e) {
      // silencieux — pas bloquant pour le reste du dashboard
    }
  }, []);

  useEffect(() => { loadReports(exercice); }, [exercice, loadReports]);

  async function handleGenerateReport(type) {
    setGeneratingType(type);
    setError(null);
    try {
      await apiFetch(`/api/airms/reports/${type}/generate?exercice=${exercice}`, { method: "POST" });
      await loadReports(exercice);
    } catch (e) {
      setError(e.message);
    } finally {
      setGeneratingType(null);
    }
  }

  // ── Finances (recettes/dépenses) ──────────────────────────────
  const [finances, setFinances] = useState({ revenues: [], expenses: [] });
  const [financeForm, setFinanceForm] = useState({ kind: "revenue", category: "", label: "", amount: "" });
  const [savingFinance, setSavingFinance] = useState(false);

  const loadFinances = useCallback(async (year) => {
    try {
      const res = await apiFetch(`/api/airms/finances?exercice=${year}`);
      setFinances(res?.data || res || { revenues: [], expenses: [] });
    } catch (e) {
      // silencieux
    }
  }, []);

  useEffect(() => { loadFinances(exercice); }, [exercice, loadFinances]);

  async function handleAddFinanceEntry(e) {
    e.preventDefault();
    if (!financeForm.category || !financeForm.amount) return;
    setSavingFinance(true);
    setError(null);
    try {
      const endpoint = financeForm.kind === "revenue" ? "revenues" : "expenses";
      await apiFetch(`/api/airms/finances/${endpoint}`, {
        method: "POST",
        body: JSON.stringify({
          exercice,
          category: financeForm.category,
          label: financeForm.label || undefined,
          amount: Number(financeForm.amount),
        }),
      });
      setFinanceForm({ kind: financeForm.kind, category: "", label: "", amount: "" });
      await Promise.all([loadFinances(exercice), load(exercice)]); // refresh statut "finances" aussi
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingFinance(false);
    }
  }

  async function handleDeleteFinanceEntry(kind, id) {
    const endpoint = kind === "revenue" ? "revenues" : "expenses";
    try {
      await apiFetch(`/api/airms/finances/${endpoint}/${id}`, { method: "DELETE" });
      await Promise.all([loadFinances(exercice), load(exercice)]);
    } catch (e) {
      setError(e.message);
    }
  }

  const totalRevenues = finances.revenues.reduce((s, r) => s + Number(r.amount), 0);
  const totalExpenses  = finances.expenses.reduce((s, r) => s + Number(r.amount), 0);
  const fmt = (n) => Number(n).toLocaleString("fr-FR") + " FCFA";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dossier AIRMS</h1>
          <p className="text-sm text-gray-500 mt-1">Suivi réglementaire — mutuelle Awoundjô</p>
        </div>
        <select
          value={exercice}
          onChange={(e) => setExercice(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>Exercice {y}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">Chargement…</div>
      )}

      {!loading && data && (
        <>
          <div className="mb-8 rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-600 mb-2">Progression du dossier {data.exercice}</div>
            <CompletionBar pct={data.completion_pct} />
          </div>

          <div className="space-y-2">
            {data.elements.map((el) => {
              const isManual = el.source === "manuel";
              return (
                <div key={el.key} className="rounded-lg border border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-gray-900">
                      {ELEMENT_LABELS[el.key] || el.key}
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={el.status} />
                      {isManual && (
                        <select
                          value={el.status}
                          disabled={savingKey === el.key}
                          onChange={(e) => handleManualUpdate(el.key, e.target.value)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs bg-white disabled:opacity-50"
                        >
                          {MANUAL_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {["rapport_moral", "rapport_comite_controle", "assemblee_generale"].includes(el.key) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <label className="block text-xs text-gray-500 mb-1">
                        Synthèse (utilisée dans le PDF du {ELEMENT_LABELS[el.key].toLowerCase()})
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Activités, gouvernance, réalisations, observations de l'exercice…"
                        value={notesDraft[el.key] ?? el.notes ?? ""}
                        onChange={(e) => setNotesDraft({ ...notesDraft, [el.key]: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <button
                        onClick={() => handleNotesSave(el.key, el.status)}
                        disabled={savingKey === el.key + ":notes"}
                        className="mt-2 rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {savingKey === el.key + ":notes" ? "Enregistrement…" : "Enregistrer la synthèse"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Rapports</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateReport("technique")}
                  disabled={generatingType !== null}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generatingType === "technique" ? "Génération…" : "Rapport technique"}
                </button>
                <button
                  onClick={() => handleGenerateReport("financier")}
                  disabled={generatingType !== null}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generatingType === "financier" ? "Génération…" : "Rapport financier"}
                </button>
                <button
                  onClick={() => handleGenerateReport("moral")}
                  disabled={generatingType !== null}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generatingType === "moral" ? "Génération…" : "Rapport moral"}
                </button>
                <button
                  onClick={() => handleGenerateReport("comite-controle")}
                  disabled={generatingType !== null}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generatingType === "comite-controle" ? "Génération…" : "Comité de contrôle"}
                </button>
                <button
                  onClick={() => handleGenerateReport("assemblee-generale")}
                  disabled={generatingType !== null}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generatingType === "assemblee-generale" ? "Génération…" : "Assemblée Générale"}
                </button>
              </div>
            </div>

            {reports.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun rapport généré pour cet exercice.</p>
            ) : (
              <ul className="space-y-2">
                {reports.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {r.report_type} — v{r.version}
                      {r.generated_by_name ? ` · ${r.generated_by_name}` : ""}
                      {" · "}
                      {new Date(r.generated_at).toLocaleString("fr-FR")}
                    </span>
                    <a
                      href={`${API_BASE}${r.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-medium hover:underline"
                    >
                      Télécharger
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Recettes & dépenses (hors cotisations)</h2>
            <p className="text-xs text-gray-500 mb-4">
              Les cotisations sont déjà comptées automatiquement. Ajoutez ici les autres recettes
              (subventions, dons...) et les dépenses de l'exercice.
            </p>

            <form onSubmit={handleAddFinanceEntry} className="flex flex-wrap items-end gap-2 mb-5">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={financeForm.kind}
                  onChange={(e) => setFinanceForm({ ...financeForm, kind: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="revenue">Recette</option>
                  <option value="expense">Dépense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
                <input
                  type="text"
                  placeholder="ex: subvention, prestations..."
                  value={financeForm.category}
                  onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm w-40"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Libellé (optionnel)</label>
                <input
                  type="text"
                  value={financeForm.label}
                  onChange={(e) => setFinanceForm({ ...financeForm, label: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm w-48"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={financeForm.amount}
                  onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm w-32"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={savingFinance}
                className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {savingFinance ? "Ajout…" : "Ajouter"}
              </button>
            </form>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Recettes</h3>
                  <span className="text-sm font-medium text-emerald-700">{fmt(totalRevenues)}</span>
                </div>
                {finances.revenues.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucune recette manuelle.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {finances.revenues.map((r) => (
                      <li key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{r.category}{r.label ? ` · ${r.label}` : ""}</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums">{fmt(r.amount)}</span>
                          <button
                            onClick={() => handleDeleteFinanceEntry("revenue", r.id)}
                            className="text-gray-400 hover:text-red-600 text-xs"
                          >
                            ✕
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Dépenses</h3>
                  <span className="text-sm font-medium text-red-700">{fmt(totalExpenses)}</span>
                </div>
                {finances.expenses.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucune dépense enregistrée.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {finances.expenses.map((r) => (
                      <li key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{r.category}{r.label ? ` · ${r.label}` : ""}</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums">{fmt(r.amount)}</span>
                          <button
                            onClick={() => handleDeleteFinanceEntry("expense", r.id)}
                            className="text-gray-400 hover:text-red-600 text-xs"
                          >
                            ✕
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <GovernanceSection apiFetch={apiFetch} exercice={exercice} />
        </>
      )}
    </div>
  );
}
