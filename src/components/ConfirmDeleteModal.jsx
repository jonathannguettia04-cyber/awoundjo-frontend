// src/components/ConfirmDeleteModal.jsx
// Modal de confirmation de suppression définitive avec mot de passe admin
import { useState } from "react";
import Modal from "./Modal";

/**
 * Props :
 *  open        : boolean
 *  onClose     : () => void
 *  onConfirm   : (password: string) => Promise<void>
 *  title       : string   — ex: "Supprimer cet agent ?"
 *  description : string   — ex: "Cette action supprimera aussi ses X clients et paiements."
 *  label       : string   — ex: "Jean Dupont"
 */
export default function ConfirmDeleteModal({ open, onClose, onConfirm, title, description, label }) {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) { setError("Mot de passe requis"); return; }
    setError(""); setLoading(true);
    try {
      await onConfirm(password);
      setPassword("");
    } catch (err) {
      setError(err?.response?.data?.error || "Mot de passe incorrect ou erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setPassword(""); setError(""); onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="⚠️ Suppression définitive">
      <div className="space-y-5">

        {/* Alerte rouge */}
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 flex gap-3">
          <span className="text-red-500 text-xl flex-shrink-0">🗑️</span>
          <div>
            <p className="font-semibold text-red-700 text-sm">{title}</p>
            {label && (
              <p className="text-red-600 text-sm mt-0.5">
                <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">{label}</span>
              </p>
            )}
            {description && (
              <p className="text-red-500 text-xs mt-1.5">{description}</p>
            )}
            <p className="text-red-500 text-xs mt-1.5 font-semibold">
              ⚠️ Cette action est irréversible. Toutes les données seront perdues définitivement.
            </p>
          </div>
        </div>

        {/* Formulaire mot de passe */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Confirmez avec votre mot de passe admin
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors">
              {loading ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
