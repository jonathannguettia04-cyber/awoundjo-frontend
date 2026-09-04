// src/pages/admin/AgentsRoles.jsx
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext"; // adapte le chemin si besoin
import { agentsAPI, rolesAPI } from "../../services/api";

const ROLE_LABELS = {
  ADMIN: "Administrateur",
  AGENT: "Agent",
  MANAGER: "Manager",
  CONSEILLERE: "Conseillère",
  RESPONSABLE_COMMERCIAL: "Responsable commercial",
  CONSEILLERE_CLIENTELE: "Conseillère clientèle",
  APPORTEUR_AFFAIRES: "Apporteur d'affaires",
  COMMUNITY_MANAGER: "Community Manager",
};

function RoleBadge({ role }) {
  if (!role) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        En attente de rôle
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {ROLE_LABELS[role] || role}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VUE 1 — Liste des agents + affectation de rôle
// ═══════════════════════════════════════════════════════════════════════
function AgentsList() {
  const [agents, setAgents]   = useState([]);
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [assigning, setAssigning] = useState(null); // agent en cours d'affectation (modale)

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [agentsRes, rolesRes] = await Promise.all([
        agentsAPI.getAll(),
        rolesAPI.getAll(),
      ]);
      setAgents(agentsRes.data.agents || []);
      setRoles(rolesRes.data.roles || []);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAssign(agentId, roleCode) {
    try {
      await agentsAPI.assignRole(agentId, roleCode);
      setAssigning(null);
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Erreur d'affectation");
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Chargement…</div>;
  if (error)   return <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
            <th className="px-5 py-3">Nom</th>
            <th className="px-5 py-3">Téléphone</th>
            <th className="px-5 py-3">Rôle</th>
            <th className="px-5 py-3">Statut</th>
            <th className="px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {agents.map(a => (
            <tr key={a.id} className="hover:bg-slate-50/60">
              <td className="px-5 py-3 font-medium text-slate-800">{a.name}</td>
              <td className="px-5 py-3 text-slate-500">{a.phone}</td>
              <td className="px-5 py-3"><RoleBadge role={a.role} /></td>
              <td className="px-5 py-3">
                <span className={`text-xs font-medium ${a.active ? "text-emerald-600" : "text-slate-400"}`}>
                  {a.active ? "Actif" : "Suspendu"}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => setAssigning(a)}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  {a.role ? "Changer le rôle" : "Affecter un rôle"}
                </button>
              </td>
            </tr>
          ))}
          {!agents.length && (
            <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Aucun agent</td></tr>
          )}
        </tbody>
      </table>

      {/* ── Modale d'affectation ── */}
      {assigning && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onClick={() => setAssigning(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-1">Affecter un rôle</h3>
            <p className="text-sm text-slate-500 mb-4">{assigning.name} — {assigning.phone}</p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {roles.filter(r => r.code !== "ADMIN").map(r => (
                <button
                  key={r.code}
                  onClick={() => handleAssign(assigning.id, r.code)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                    assigning.role === r.code
                      ? "bg-brand-50 border-brand-300 text-brand-700 font-medium"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {r.label}
                  {r.description && <div className="text-xs text-slate-400 mt-0.5">{r.description}</div>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAssigning(null)}
              className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VUE 2 — Matrice des permissions par rôle
// ═══════════════════════════════════════════════════════════════════════
function PermissionsMatrix() {
  const [roles, setRoles]           = useState([]);
  const [selectedRole, setSelected] = useState(null);
  const [permissions, setPermissions] = useState([]); // { id, code, label, category, granted }
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  // ── Création de rôle ──────────────────────────────────────────
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRole, setNewRole]         = useState({ code: "", label: "", description: "" });
  const [savingRole, setSavingRole]   = useState(false);
  const [roleFormError, setRoleFormError] = useState("");

  // ── Création de permission ────────────────────────────────────
  const [showNewPerm, setShowNewPerm] = useState(false);
  const [newPerm, setNewPerm]         = useState({ code: "", label: "", category: "", description: "" });
  const [savingPerm, setSavingPerm]   = useState(false);
  const [permFormError, setPermFormError] = useState("");

  function loadRoles() {
    return rolesAPI.getAll()
      .then(res => {
        const list = (res.data.roles || res.data.data?.roles || []).filter(r => r.code !== "ADMIN");
        setRoles(list);
        return list;
      })
      .catch(e => { setError(e.response?.data?.error || "Erreur de chargement"); return []; });
  }

  useEffect(() => {
    loadRoles()
      .then(list => { if (list.length) setSelected(list[0]); })
      .finally(() => setLoading(false));
  }, []);

  function loadRolePermissions() {
    if (!selectedRole) return;
    setLoading(true);
    return rolesAPI.getRolePermissions(selectedRole.id)
      .then(res => setPermissions(res.data.permissions || res.data.data?.permissions || []))
      .catch(e => setError(e.response?.data?.error || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadRolePermissions(); }, [selectedRole]);

  function toggle(permId) {
    setPermissions(prev => prev.map(p => p.id === permId ? { ...p, granted: !p.granted } : p));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const permission_ids = permissions.filter(p => p.granted).map(p => p.id);
      await rolesAPI.setRolePermissions(selectedRole.id, permission_ids);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRole(e) {
    e.preventDefault();
    setRoleFormError("");
    if (!newRole.code.trim() || !newRole.label.trim()) {
      setRoleFormError("Le code et le libellé sont requis.");
      return;
    }
    setSavingRole(true);
    try {
      const res = await rolesAPI.create(newRole);
      const created = res.data.role || res.data.data?.role;
      setShowNewRole(false);
      setNewRole({ code: "", label: "", description: "" });
      const list = await loadRoles();
      const match = list.find(r => r.code === created?.code) || list[list.length - 1];
      if (match) setSelected(match);
    } catch (e) {
      setRoleFormError(e.response?.data?.error || "Erreur de création du rôle");
    } finally {
      setSavingRole(false);
    }
  }

  async function handleCreatePermission(e) {
    e.preventDefault();
    setPermFormError("");
    if (!newPerm.code.trim() || !newPerm.label.trim() || !newPerm.category.trim()) {
      setPermFormError("Le code, le libellé et la catégorie sont requis.");
      return;
    }
    setSavingPerm(true);
    try {
      await rolesAPI.createPermission(newPerm);
      setShowNewPerm(false);
      setNewPerm({ code: "", label: "", category: "", description: "" });
      await loadRolePermissions(); // la nouvelle permission apparaît, non cochée, prête à assigner
    } catch (e) {
      setPermFormError(e.response?.data?.error || "Erreur de création de la permission");
    } finally {
      setSavingPerm(false);
    }
  }

  // Regroupement par catégorie pour l'affichage
  const byCategory = permissions.reduce((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
      {/* Sélecteur de rôle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 h-fit">
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
              selectedRole?.id === r.id
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {r.label}
          </button>
        ))}
        <button
          onClick={() => setShowNewRole(true)}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm mt-1 text-brand-600 hover:bg-brand-50 font-medium flex items-center gap-1.5"
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
          Nouveau rôle
        </button>
      </div>

      {/* Matrice de permissions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        {loading ? (
          <div className="text-center text-slate-400 text-sm py-8">Chargement…</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5 gap-3">
              <h3 className="font-semibold text-slate-800">{selectedRole?.label}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewPerm(true)}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 px-2 py-1"
                >
                  <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
                  Nouvelle permission
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {Object.entries(byCategory).map(([category, perms]) => (
                <div key={category}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    {category}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map(p => (
                      <label
                        key={p.id}
                        className="flex items-start gap-2.5 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!!p.granted}
                          onChange={() => toggle(p.id)}
                          className="mt-0.5 accent-brand-600"
                        />
                        <span>
                          <span className="block text-sm text-slate-700">{p.label}</span>
                          {p.description && <span className="block text-xs text-slate-400">{p.description}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modale Nouveau rôle ── */}
      {showNewRole && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onClick={() => setShowNewRole(false)}>
          <form onSubmit={handleCreateRole} className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-4">Nouveau rôle</h3>
            {roleFormError && <div className="mb-3 p-2.5 bg-red-50 text-red-600 text-xs rounded-lg">{roleFormError}</div>}
            <div className="space-y-3">
              <label className="block">
                <span className="block text-xs text-slate-500 mb-1">Code (ex: SUPERVISEUR_REGIONAL)</span>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newRole.code}
                  onChange={e => setNewRole(f => ({ ...f, code: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="block text-xs text-slate-500 mb-1">Libellé affiché</span>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newRole.label}
                  onChange={e => setNewRole(f => ({ ...f, label: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="block text-xs text-slate-500 mb-1">Description (optionnel)</span>
                <textarea
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newRole.description}
                  onChange={e => setNewRole(f => ({ ...f, description: e.target.value }))}
                />
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setShowNewRole(false)} className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-700">
                Annuler
              </button>
              <button type="submit" disabled={savingRole} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg">
                {savingRole ? "Création…" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modale Nouvelle permission ── */}
      {showNewPerm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onClick={() => setShowNewPerm(false)}>
          <form onSubmit={handleCreatePermission} className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-1">Nouvelle permission</h3>
            <p className="text-xs text-slate-400 mb-4">Ajoutée au catalogue, non accordée à aucun rôle par défaut.</p>
            {permFormError && <div className="mb-3 p-2.5 bg-red-50 text-red-600 text-xs rounded-lg">{permFormError}</div>}
            <div className="space-y-3">
              <label className="block">
                <span className="block text-xs text-slate-500 mb-1">Code (ex: viewGroups)</span>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newPerm.code}
                  onChange={e => setNewPerm(f => ({ ...f, code: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="block text-xs text-slate-500 mb-1">Libellé affiché</span>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newPerm.label}
                  onChange={e => setNewPerm(f => ({ ...f, label: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="block text-xs text-slate-500 mb-1">Catégorie (ex: Adhésions)</span>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newPerm.category}
                  onChange={e => setNewPerm(f => ({ ...f, category: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="block text-xs text-slate-500 mb-1">Description (optionnel)</span>
                <textarea
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newPerm.description}
                  onChange={e => setNewPerm(f => ({ ...f, description: e.target.value }))}
                />
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setShowNewPerm(false)} className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-700">
                Annuler
              </button>
              <button type="submit" disabled={savingPerm} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg">
                {savingPerm ? "Création…" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE — Onglets Agents / Rôles & permissions
// ═══════════════════════════════════════════════════════════════════════
export default function AgentsRoles() {
  const { isAdmin, initializing } = useAuth();
  const [tab, setTab] = useState("agents"); // "agents" | "permissions"

  // Cette page touche aux droits d'accès de tout le monde — réservée aux admins.
  if (initializing) return null;
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center text-slate-500 text-sm">
        Cette section est réservée aux administrateurs.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Agents & rôles</h1>
      <p className="text-sm text-slate-500 mb-5">
        Gérez les comptes agents et les permissions accordées à chaque rôle.
      </p>

      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("agents")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "agents" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          }`}
        >
          Agents
        </button>
        <button
          onClick={() => setTab("permissions")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "permissions" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          }`}
        >
          Rôles & permissions
        </button>
      </div>

      {tab === "agents" ? <AgentsList /> : <PermissionsMatrix />}
    </div>
  );
}
