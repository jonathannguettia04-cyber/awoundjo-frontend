import { useEffect, useState } from "react";
import { agentAPI } from "../services/api";
import Modal from "../components/Modal";

const EMPTY = { name: "", phone: "", password: "", role: "AGENT" };

export default function Agents() {
  const [agents,    setAgents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [showPass,  setShowPass]  = useState(false);

  async function loadAgents() {
    setLoading(true);
    try {
      const { data } = await agentAPI.getAll();
      setAgents(data.agents || data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAgents(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError(""); setSaving(true);
    try {
      await agentAPI.create(form);
      setShowModal(false);
      setForm(EMPTY);
      loadAgents();
    } catch (err) {
      setFormError(err.response?.data?.error || "Erreur lors de la création");
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agents</h1>
          <p className="text-slate-500 text-sm">{agents.length} agent(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setFormError(""); setShowModal(true); }}
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
        >
          + Nouvel agent
        </button>
      </div>

      {/* Grid agents */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-100">
          <p className="text-4xl mb-3">🧑‍💼</p>
          <p className="font-medium">Aucun agent enregistré</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                  {a.name?.charAt(0).toUpperCase()}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>{a.role}</span>
              </div>
              <p className="font-semibold text-slate-800">{a.name}</p>
              <p className="text-sm text-slate-400 mt-0.5">{a.phone}</p>
              {a.nb_clients !== undefined && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{a.nb_clients} client(s)</span>
                  {a.total_revenue !== undefined && (
                    <span className="font-semibold text-brand-600">
                      {Number(a.total_revenue || 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvel agent">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex : Koné Aminata"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Ex : 0701234567"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
            <div className="relative">
              <input required type={showPass ? "text" : "password"} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 caractères"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10" />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-60 font-medium">
              {saving ? "Création…" : "Créer l'agent"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
