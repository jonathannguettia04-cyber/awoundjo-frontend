// src/pages/Agents.jsx
// ⚠️  Penser à ajouter APPORTEUR_AFFAIRES dans RoleContext.js :
//   ROLE_LABELS : { APPORTEUR_AFFAIRES: "Apporteur d'Affaires", ... }
//   ROLE_COLORS : { APPORTEUR_AFFAIRES: { bg:"bg-orange-50", text:"text-orange-700", dot:"bg-orange-500" }, ... }
import { useEffect, useState } from "react";
import { agentsAPI } from "../services/api";
import axios from "axios";
import { useRole, ROLE_LABELS, ROLE_COLORS } from "../context/RoleContext";
import Modal from "../components/Modal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

const EMPTY = { name: "", phone: "", email: "", role: "AGENT", password: "" };

// Rôles créables selon le rôle de l'utilisateur courant
function getCreatableRoles(userRole) {
  if (userRole === "ADMIN") {
    return [
      { value: "AGENT",                  label: "Agent Commercial" },
      { value: "RESPONSABLE_COMMERCIAL", label: "Responsable Commercial" },
      { value: "CONSEILLERE_CLIENTELE",  label: "Conseillère Clientèle" },
      { value: "APPORTEUR_AFFAIRES",     label: "Apporteur d'Affaires" },
    ];
  }
  if (userRole === "RESPONSABLE_COMMERCIAL") {
    return [{ value: "AGENT", label: "Agent Commercial" }];
  }
  return [];
}

function RoleBadge({ role }) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS.AGENT;
  const label  = ROLE_LABELS[role] || role;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}

export default function Agents() {
  const { role: userRole, can, isAdmin } = useRole();
  const [agents,    setAgents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [search,       setSearch]       = useState("");
  const [deleteTarget,  setDeleteTarget]  = useState(null); // { id, name, clientCount }
  const [togglingId,    setTogglingId]    = useState(null);

  const creatableRoles = getCreatableRoles(userRole);

  async function load() {
    setLoading(true);
    try {
      const { data } = await agentsAPI.getAll();
      setAgents(data.agents || data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError(""); setSaving(true);
    try {
      // RC ne peut créer que des AGENT
      if (userRole === "RESPONSABLE_COMMERCIAL" && form.role !== "AGENT") {
        setFormError("Vous pouvez uniquement créer des agents commerciaux");
        setSaving(false); return;
      }
      await agentsAPI.create(form);
      setShowModal(false);
      setForm({ ...EMPTY, role: creatableRoles[0]?.value || "AGENT" });
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || "Erreur lors de la création");
    } finally { setSaving(false); }
  }

  async function handleToggleStatus(agent) {
    if (!window.confirm(
      agent.active
        ? `Suspendre l'agent "${agent.name}" ? Il ne pourra plus se connecter.`
        : `Réactiver l'agent "${agent.name}" ?`
    )) return;
    setTogglingId(agent.id);
    try {
      const BASE = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE}/api/agents/${agent.id}/toggle-status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data?.error || "Erreur lors du changement de statut");
      }
      load();
    } catch (e) {
      alert(e.message || "Erreur réseau");
    } finally { setTogglingId(null); }
  }

  async function handleDelete(password) {
    const BASE = import.meta.env.VITE_API_URL || "";
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE}/api/agents/${deleteTarget.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ adminPassword: password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erreur suppression");
    setDeleteTarget(null);
    load();
  }

  const filtered = agents.filter(a =>
    !search || a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search) || a.role?.includes(search.toUpperCase())
  );

  if (!can("viewAgents")) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Accès restreint</h2>
        <p className="text-slate-500">Vous n'avez pas accès à la gestion des agents.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agents</h1>
          <p className="text-slate-500 text-sm">{agents.length} agent(s) enregistré(s)</p>
        </div>
        {can("createAgents") && (
          <button
            onClick={() => { setForm({ ...EMPTY, role: creatableRoles[0]?.value || "AGENT" }); setFormError(""); setShowModal(true); }}
            className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm">
            + Nouvel agent
          </button>
        )}
      </div>

      {/* Info rôle RC */}
      {userRole === "RESPONSABLE_COMMERCIAL" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <span className="text-purple-500 text-lg">💼</span>
          <p className="text-purple-700 text-sm font-medium">
            En tant que Responsable Commercial, vous pouvez créer et suivre des <strong>Agents Commerciaux</strong> uniquement.
          </p>
        </div>
      )}

      {/* Filtre recherche */}
      <div className="mb-5">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher par nom, téléphone ou rôle…"
          className="w-full sm:w-96 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Liste agents */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <p className="text-4xl mb-3">🧑‍💼</p>
          <p className="font-medium">Aucun agent trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Agent</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Rôle</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Téléphone</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Clients</th>
                  {isAdmin && <th className="text-left px-5 py-3 font-semibold text-slate-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(agent => (
                  <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm flex-shrink-0">
                          {agent.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={agent.role} /></td>
                    <td className="px-5 py-3 text-slate-600">{agent.phone}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{agent.email || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{agent.client_count || 0} client(s)</td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggleStatus(agent)}
                          disabled={togglingId === agent.id}
                          className={`text-xs font-semibold border rounded-lg px-3 py-1.5 transition-colors mr-2 disabled:opacity-50
                            ${agent.active
                              ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                              : "text-green-600 border-green-200 hover:bg-green-50"}`}>
                          {togglingId === agent.id ? "…" : agent.active ? "Suspendre" : "Réactiver"}
                        </button>
                        <button onClick={() => setDeleteTarget({ id: agent.id, name: agent.name, clientCount: agent.client_count || 0 })}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
                          Supprimer
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map(agent => (
              <div key={agent.id} className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-base flex-shrink-0">
                  {agent.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{agent.name}</p>
                  <p className="text-xs text-slate-400">{agent.phone}</p>
                  <div className="mt-1"><RoleBadge role={agent.role} /></div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-slate-500">{agent.client_count || 0} clients</p>
                  {isAdmin && (
                    <button
                      onClick={() => handleToggleStatus(agent)}
                      disabled={togglingId === agent.id}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-lg border transition-colors disabled:opacity-50
                        ${agent.active
                          ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                          : "text-green-600 border-green-200 hover:bg-green-50"}`}>
                      {togglingId === agent.id ? "…" : agent.active ? "Suspendre" : "Réactiver"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal création */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="➕ Nouvel agent">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{formError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Kouamé Jean"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="0707070707"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="agent@email.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            {/* Rôle — affiché uniquement si plusieurs choix */}
            {creatableRoles.length > 1 && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Rôle *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {creatableRoles.map(r => (
                    <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer text-center
                        ${form.role === r.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <span className="text-xl">
                        {r.value === "AGENT" ? "🧑‍💼" : r.value === "RESPONSABLE_COMMERCIAL" ? "💼" : r.value === "APPORTEUR_AFFAIRES" ? "🤝" : "💁‍♀️"}
                      </span>
                      <span className={`text-xs font-semibold ${form.role === r.value ? "text-brand-700" : "text-slate-600"}`}>
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Description du rôle sélectionné */}
                <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500">
                  {form.role === "AGENT" && "Crée et suit ses propres clients, enregistre des paiements, voit ses commissions."}
                  {form.role === "RESPONSABLE_COMMERCIAL" && "Crée et suit des agents commerciaux, voit les commissions de son équipe, vue restreinte du tableau de bord."}
                  {form.role === "CONSEILLERE_CLIENTELE" && "Gère les établissements, importe/exporte des clients, fait des adhésions. Pas de création d'agents."}
                  {form.role === "APPORTEUR_AFFAIRES" && "Enregistre uniquement des clients finaux. Commission de 5% sur les adhésions uniquement (pas de commission sur mensualités)."}
                </div>
              </div>
            )}

            {creatableRoles.length === 1 && (
              <div className="sm:col-span-2">
                <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">🧑‍💼</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Agent Commercial</p>
                    <p className="text-xs text-slate-500">Crée et suit ses propres clients, enregistre des paiements, voit ses commissions.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe temporaire *</label>
              <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 caractères"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl disabled:opacity-60 font-semibold">
              {saving ? "Création…" : "Créer l'agent"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal suppression définitive */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Supprimer l'agent "${deleteTarget?.name}" ?`}
        description={`Cela supprimera aussi ses ${deleteTarget?.clientCount} client(s) et tous leurs paiements associés.`}
        label={deleteTarget?.name}
      />
    </div>
  );
}
