// components/PlanModal.jsx
// Modal création / édition d'une formule avec avantages (% + plafond FCFA)
// Props :
//   plan       — formule à éditer (null = création)
//   onClose    — ferme le modal
//   onSaved    — callback(savedPlan) après succès
//   (apiBase supprimé — la constante API est définie en local)

import { useState, useEffect } from "react";

const CATEGORIES = [
  "Hospitalisation",
  "Consultation médicale",
  "Médicaments",
  "Chirurgie",
  "Maternité",
  "Dentaire",
  "Optique",
  "Évacuation sanitaire",
];

const EMPTY_BENEFIT = { category: "", coverage_percent: "", ceiling_fcfa: "" };

const API = import.meta.env.VITE_API_URL || "";

export default function PlanModal({ plan, onClose, onSaved }) {
  const isEdit = Boolean(plan);

  // ── Champs principaux ─────────────────────────────────────────────────────
  const [name,            setName]            = useState(plan?.name            ?? "");
  const [adhesionPrice,   setAdhesionPrice]   = useState(plan?.adhesion_price  ?? "");
  const [monthlyPrice,    setMonthlyPrice]    = useState(plan?.monthly_price   ?? "");
  const [coveragePct,     setCoveragePct]     = useState(plan?.coverage_percent ?? 80);
  const [isActive,        setIsActive]        = useState(plan?.is_active       ?? true);

  // ── Avantages ─────────────────────────────────────────────────────────────
  const [benefits, setBenefits] = useState(
    plan?.benefits?.length
      ? plan.benefits.map((b) => ({
          category:         b.category,
          coverage_percent: b.coverage_percent,
          ceiling_fcfa:     b.ceiling_fcfa,
        }))
      : []
  );

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Gestion des avantages ─────────────────────────────────────────────────
  function addBenefit() {
    setBenefits((prev) => [...prev, { ...EMPTY_BENEFIT }]);
  }

  function removeBenefit(index) {
    setBenefits((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBenefit(index, field, value) {
    setBenefits((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  }

  // Catégories déjà utilisées (pour éviter les doublons)
  const usedCategories = benefits.map((b) => b.category).filter(Boolean);

  // ── Soumission ────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError("");

    // Validation basique
    if (!name.trim())
      return setError("Le nom est obligatoire.");
    if (adhesionPrice === "" || monthlyPrice === "")
      return setError("Les prix sont obligatoires.");
    if (Number(adhesionPrice) < 0 || Number(monthlyPrice) < 0)
      return setError("Les prix ne peuvent pas être négatifs.");

    for (const b of benefits) {
      if (!b.category)
        return setError("Sélectionnez une catégorie pour chaque avantage.");
      if (b.coverage_percent === "" || Number(b.coverage_percent) < 0 || Number(b.coverage_percent) > 100)
        return setError(`Pourcentage invalide pour "${b.category}" (0–100).`);
      if (b.ceiling_fcfa === "" || Number(b.ceiling_fcfa) < 0)
        return setError(`Plafond invalide pour "${b.category}" (≥ 0, 0 = illimité).`);
    }

    const payload = {
      name:             name.trim(),
      adhesion_price:   Number(adhesionPrice),
      monthly_price:    Number(monthlyPrice),
      coverage_percent: Number(coveragePct),
      is_active:        isActive,
      benefits: benefits.map((b) => ({
        category:         b.category,
        coverage_percent: Number(b.coverage_percent),
        ceiling_fcfa:     Number(b.ceiling_fcfa),
      })),
    };

    const token = localStorage.getItem("token");
    const url   = isEdit
      ? `${API}/api/plans/${plan.id}`
      : `${API}/api/plans`;
    const method = isEdit ? "PUT" : "POST";

    setLoading(true);
    try {
      const res  = await fetch(url, {
        method,
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        return setError(data.error || "Une erreur est survenue.");
      onSaved(data.data);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? "Modifier la formule" : "Nouvelle formule"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* ── Corps (scrollable) ── */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1">

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* ── Section : infos générales ── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Informations générales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nom */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la formule <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex : ESSENTIELLE"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Adhésion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais d'adhésion (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" min="0"
                  value={adhesionPrice}
                  onChange={(e) => setAdhesionPrice(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {adhesionPrice === "0" || adhesionPrice === 0 ? (
                  <span className="text-xs text-emerald-600 font-medium">✓ Adhésion gratuite</span>
                ) : null}
              </div>

              {/* Cotisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cotisation mensuelle (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" min="0"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="5000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Couverture globale */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couverture globale : <span className="font-bold text-blue-600">{coveragePct}%</span>
                </label>
                <input
                  type="range" min="0" max="100" step="5"
                  value={coveragePct}
                  onChange={(e) => setCoveragePct(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Statut (édition uniquement) */}
              {isEdit && (
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Formule active</label>
                  <button
                    type="button"
                    onClick={() => setIsActive((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isActive ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                    {isActive ? "Active" : "Désactivée"}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ── Section : avantages ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Avantages ({benefits.length})
              </h3>
              <button
                type="button"
                onClick={addBenefit}
                disabled={benefits.length >= CATEGORIES.length}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-lg leading-none">+</span> Ajouter
              </button>
            </div>

            {benefits.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-lg">
                Aucun avantage défini. Cliquez sur « Ajouter » pour commencer.
              </p>
            )}

            <div className="space-y-3">
              {benefits.map((b, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_90px_110px_32px] gap-2 items-center bg-gray-50 rounded-lg px-3 py-2"
                >
                  {/* Catégorie */}
                  <select
                    value={b.category}
                    onChange={(e) => updateBenefit(i, "category", e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Catégorie --</option>
                    {CATEGORIES.map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                        disabled={usedCategories.includes(cat) && b.category !== cat}
                      >
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* % remboursement */}
                  <div className="relative">
                    <input
                      type="number" min="0" max="100"
                      value={b.coverage_percent}
                      onChange={(e) => updateBenefit(i, "coverage_percent", e.target.value)}
                      placeholder="80"
                      className="w-full border border-gray-300 rounded-lg pl-2 pr-6 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                  </div>

                  {/* Plafond FCFA */}
                  <div className="relative">
                    <input
                      type="number" min="0"
                      value={b.ceiling_fcfa}
                      onChange={(e) => updateBenefit(i, "ceiling_fcfa", e.target.value)}
                      placeholder="0 = illim."
                      className="w-full border border-gray-300 rounded-lg pl-2 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Supprimer */}
                  <button
                    type="button"
                    onClick={() => removeBenefit(i)}
                    className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
                    title="Supprimer cet avantage"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {benefits.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                💡 Plafond FCFA = 0 signifie pas de plafond (remboursement illimité dans la limite du %).
              </p>
            )}
          </section>

          {/* ── Récapitulatif ── */}
          {(name || monthlyPrice) && (
            <section className="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-blue-800 mb-2">Récapitulatif</p>
              {name && <p><span className="text-gray-500">Formule :</span> <strong>{name}</strong></p>}
              {adhesionPrice !== "" && (
                <p>
                  <span className="text-gray-500">Adhésion :</span>{" "}
                  <strong>{Number(adhesionPrice) === 0 ? "Gratuite" : `${Number(adhesionPrice).toLocaleString("fr-FR")} FCFA`}</strong>
                </p>
              )}
              {monthlyPrice !== "" && (
                <p>
                  <span className="text-gray-500">Cotisation :</span>{" "}
                  <strong>{Number(monthlyPrice).toLocaleString("fr-FR")} FCFA / mois</strong>
                </p>
              )}
              <p><span className="text-gray-500">Couverture globale :</span> <strong>{coveragePct}%</strong></p>
              {benefits.filter((b) => b.category).length > 0 && (
                <p>
                  <span className="text-gray-500">Avantages :</span>{" "}
                  <strong>{benefits.filter((b) => b.category).length} catégorie(s)</strong>
                </p>
              )}
            </section>
          )}
        </div>

        {/* ── Pied ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer la formule"}
          </button>
        </div>
      </div>
    </div>
  );
}
