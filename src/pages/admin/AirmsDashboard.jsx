// pages/admin/AirmsDashboard.jsx
//
// Tableau de bord du dossier réglementaire AIRMS. Affiche le statut de
// chaque élément (adhérents, cotisations, prestations, finances, rapports
// narratifs) pour un exercice donné, avec la progression globale.
// Les éléments manuels (rapport moral, comité de contrôle, AG) sont
// modifiables directement depuis cette page.

import { useEffect, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
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

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
                <div
                  key={el.key}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {ELEMENT_LABELS[el.key] || el.key}
                    </div>
                    {el.notes && (
                      <div className="text-xs text-gray-500 mt-0.5">{el.notes}</div>
                    )}
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
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
