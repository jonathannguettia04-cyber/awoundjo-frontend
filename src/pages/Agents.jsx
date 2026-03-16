import { useEffect, useState } from "react";
import { agentAPI } from "../services/api";
import Modal from "../components/Modal";

const EMPTY = { name: "", phone: "", password: "", role: "AGENT" };
const fmt   = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

export default function Agents() {
  const [agents,    setAgents]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Modal création
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState("");
  const [showPass,   setShowPass]   = useState(false);

  // Modal confirmation action
  const [confirm,    setConfirm]    = useState(null); // { agent, action: "suspend"|"activate"|"delete" }
  const [acting,     setActing]     = useState(false);
  const [actError,   setActError]   = useState("");

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
      setShowCreate(false);
      setForm(EMPTY);
      loadAgents();
    } catch (err) {
      setFormError(err.response?.data?.error || "Erreur lors de la création");
    } finally { setSaving(false); }
  }

  async function handleAction() {
    if (!confirm) return;
    setActError(""); setActing(true);
    try {
      const { agent, action } = confirm;
      if (action === "suspend") {
        await agentAPI.update(agent.id, { active: false });
      } else if (action === "activate") {
        await agentAPI.update(agent.id, { active: true });
      } else if (action === "delete") {
        await agentAPI.update(agent.id, { active: false }); // soft delete via suspension
      }
      setConfirm(null);
      loadAgents();
    } catch (err) {
      setActError(err.response?.data?.error || "Erreur lors de l'opération");
    } finally { setActing(false); }
  }

  const actionConfig = {
    suspend:  { label: "Suspendre",  color: "bg-amber-500 hover:bg-amber-600",  icon: "⏸️", text: "Le compte de cet agent sera suspendu. Il ne pourra plus se connecter." },
    activate: { label: "Réactiver",  color: "bg-green-500 hover:bg-green-600",  icon: "▶️", text: "Le compte de cet agent sera réactivé. Il pourra se reconnecter." },
    delete:   { label: "Désactiver", color: "bg-red-500   hover:bg-red-600",    icon: "🗑️", text: "Le compte sera désactivé définitivement. Les données clients sont conservées." },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agents</h1>
          <p className="text-slate-500 text-sm">
            {agents.filter(a => a.active).length} actif(s) · {agents.filter(a => !a.active).length} suspendu(s)
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setFormError(""); setShowCreate(true); }}
          className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto"
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
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <p className="text-4xl mb-3">🧑‍💼</p>
          <p className="font-medium">Aucun agent enregistré</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <div key={a.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md
                ${!a.active ? "border-slate-200 opacity-60" : "border-slate-100"}`}>

              {/* Top */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
                  ${a.active ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400"}`}>
                  {a.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    a.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>{a.role}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    a.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>{a.active ? "Actif" : "Suspendu"}</span>
                </div>
              </div>

              {/* Infos */}
              <p className="font-semibold text-slate-800">{a.name}</p>
              <p className="text-sm text-slate-400 mt-0.5">📞 {a.phone}</p>

              {/* Stats */}
              {a.nb_clients !== undefined && (
                <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Clients</p>
                    <p className="font-semibold text-slate-700">{a.nb_clients}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Collecté</p>
                    <p className="font-semibold text-brand-600">{fmt(a.total_revenue)}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {a.role !== "ADMIN" && (
                <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2">
                  {a.active ? (
                    <button
                      onClick={() => { setActError(""); setConfirm({ agent: a, action: "suspend" }); }}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 active:scale-95 transition-all"
                    >
                      ⏸️ Suspendre
                    </button>
                  ) : (
                    <button
                      onClick={() => { setActError(""); setConfirm({ agent: a, action: "activate" }); }}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 active:scale-95 transition-all"
                    >
                      ▶️ Réactiver
                    </button>
                  )}
                  <button
                    onClick={() => { setActError(""); setConfirm({ agent: a, action: "delete" }); }}
                    className="flex-1 text-xs font-semibold py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 active:scale-95 transition-all"
                  >
                    🗑️ Désactiver
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal création ──────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvel agent">
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
              <option value="AGENT">Agent commercial</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl disabled:opacity-60 font-semibold">
              {saving ? "Création…" : "Créer l'agent"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal confirmation action ───────────────────────── */}
      <Modal
        open={!!confirm}
        onClose={() => !acting && setConfirm(null)}
        title={confirm ? `${actionConfig[confirm.action]?.icon} ${actionConfig[confirm.action]?.label} l'agent` : ""}
      >
        {confirm && (
          <div className="space-y-4">
            {actError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{actError}</div>}

            {/* Fiche agent */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 font-bold flex items-center justify-center">
                {confirm.agent.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{confirm.agent.name}</p>
                <p className="text-sm text-slate-400">{confirm.agent.phone}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">{actionConfig[confirm.action]?.text}</p>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={acting}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={acting}
                className={`px-5 py-2 text-sm text-white rounded-xl font-semibold disabled:opacity-60 transition-all active:scale-95 ${actionConfig[confirm.action]?.color}`}
              >
                {acting ? "Traitement…" : actionConfig[confirm.action]?.label}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}