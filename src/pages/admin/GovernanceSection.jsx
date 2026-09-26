// pages/admin/GovernanceSection.jsx
//
// Saisie des réunions de gouvernance pour un exercice donné : CA,
// Comité de contrôle, Assemblées Générales. Alimente le contenu réel
// derrière les statuts "Rapport moral" / "Rapport du Comité de
// contrôle" / "Assemblée Générale" du tableau de bord AIRMS.
//
// Import : cette version suppose que apiFetch est déjà défini dans
// AirmsDashboard.jsx et passé en prop — évite de dupliquer le helper
// une troisième fois dans le module.

import { useEffect, useState, useCallback } from "react";

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EntryRow({ children, onDelete }) {
  return (
    <li className="flex items-start justify-between gap-3 text-sm border-b border-gray-100 last:border-0 py-2">
      <div className="text-gray-700 flex-1">{children}</div>
      <button onClick={onDelete} className="text-gray-400 hover:text-red-600 text-xs shrink-0">✕</button>
    </li>
  );
}

export default function GovernanceSection({ apiFetch, exercice, locked = false }) {
  const [boardMeetings, setBoardMeetings]   = useState([]);
  const [controlMeetings, setControlMeetings] = useState([]);
  const [assemblies, setAssemblies]         = useState([]);
  const [error, setError]                   = useState(null);
  const [saving, setSaving]                 = useState(null);

  const [boardForm, setBoardForm]     = useState({ meeting_date: "", subject: "", decisions: "" });
  const [controlForm, setControlForm] = useState({ meeting_date: "", observations: "", recommendations: "" });
  const [agForm, setAgForm]           = useState({ assembly_date: "", resolutions: "", pv_document_url: "" });

  const loadAll = useCallback(async () => {
    try {
      const [b, c, a] = await Promise.all([
        apiFetch(`/api/airms/governance/board-meetings?exercice=${exercice}`),
        apiFetch(`/api/airms/governance/control-meetings?exercice=${exercice}`),
        apiFetch(`/api/airms/governance/general-assemblies?exercice=${exercice}`),
      ]);
      setBoardMeetings((b?.data || b)?.meetings || []);
      setControlMeetings((c?.data || c)?.meetings || []);
      setAssemblies((a?.data || a)?.assemblies || []);
    } catch (e) {
      setError(e.message);
    }
  }, [apiFetch, exercice]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function submitBoard(e) {
    e.preventDefault();
    if (!boardForm.meeting_date) return;
    setSaving("board");
    setError(null);
    try {
      await apiFetch(`/api/airms/governance/board-meetings`, {
        method: "POST",
        body: JSON.stringify(boardForm),
      });
      setBoardForm({ meeting_date: "", subject: "", decisions: "" });
      await loadAll();
    } catch (e) { setError(e.message); } finally { setSaving(null); }
  }

  async function submitControl(e) {
    e.preventDefault();
    if (!controlForm.meeting_date) return;
    setSaving("control");
    setError(null);
    try {
      await apiFetch(`/api/airms/governance/control-meetings`, {
        method: "POST",
        body: JSON.stringify(controlForm),
      });
      setControlForm({ meeting_date: "", observations: "", recommendations: "" });
      await loadAll();
    } catch (e) { setError(e.message); } finally { setSaving(null); }
  }

  async function submitAg(e) {
    e.preventDefault();
    if (!agForm.assembly_date) return;
    setSaving("ag");
    setError(null);
    try {
      await apiFetch(`/api/airms/governance/general-assemblies`, {
        method: "POST",
        body: JSON.stringify({ ...agForm, exercice }),
      });
      setAgForm({ assembly_date: "", resolutions: "", pv_document_url: "" });
      await loadAll();
    } catch (e) { setError(e.message); } finally { setSaving(null); }
  }

  async function deleteEntry(kind, id) {
    const path = kind === "board" ? "board-meetings" : kind === "control" ? "control-meetings" : "general-assemblies";
    try {
      await apiFetch(`/api/airms/governance/${path}/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (e) { setError(e.message); }
  }

  const inputCls = "rounded-md border border-gray-300 px-2 py-1.5 text-sm w-full";

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Gouvernance</h2>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card title="Réunions du Conseil d'Administration">
        <form onSubmit={submitBoard} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <input type="date" required value={boardForm.meeting_date}
            onChange={(e) => setBoardForm({ ...boardForm, meeting_date: e.target.value })} className={inputCls} />
          <input type="text" placeholder="Sujet" value={boardForm.subject}
            onChange={(e) => setBoardForm({ ...boardForm, subject: e.target.value })} className={inputCls} />
          <div className="flex gap-2">
            <input type="text" placeholder="Décisions" value={boardForm.decisions}
              onChange={(e) => setBoardForm({ ...boardForm, decisions: e.target.value })} className={inputCls} />
            <button type="submit" disabled={saving === "board" || locked}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shrink-0 disabled:opacity-50">
              +
            </button>
          </div>
        </form>
        {boardMeetings.length === 0 ? (
          <p className="text-xs text-gray-400">Aucune réunion enregistrée.</p>
        ) : (
          <ul>
            {boardMeetings.map((m) => (
              <EntryRow key={m.id} onDelete={() => deleteEntry("board", m.id)}>
                <span className="font-medium">{new Date(m.meeting_date).toLocaleDateString("fr-FR")}</span>
                {m.subject && ` — ${m.subject}`}
                {m.decisions && <div className="text-xs text-gray-500">{m.decisions}</div>}
              </EntryRow>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Réunions du Comité de contrôle">
        <form onSubmit={submitControl} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <input type="date" required value={controlForm.meeting_date}
            onChange={(e) => setControlForm({ ...controlForm, meeting_date: e.target.value })} className={inputCls} />
          <input type="text" placeholder="Observations" value={controlForm.observations}
            onChange={(e) => setControlForm({ ...controlForm, observations: e.target.value })} className={inputCls} />
          <div className="flex gap-2">
            <input type="text" placeholder="Recommandations" value={controlForm.recommendations}
              onChange={(e) => setControlForm({ ...controlForm, recommendations: e.target.value })} className={inputCls} />
            <button type="submit" disabled={saving === "control" || locked}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shrink-0 disabled:opacity-50">
              +
            </button>
          </div>
        </form>
        {controlMeetings.length === 0 ? (
          <p className="text-xs text-gray-400">Aucune réunion enregistrée.</p>
        ) : (
          <ul>
            {controlMeetings.map((m) => (
              <EntryRow key={m.id} onDelete={() => deleteEntry("control", m.id)}>
                <span className="font-medium">{new Date(m.meeting_date).toLocaleDateString("fr-FR")}</span>
                {m.observations && ` — ${m.observations}`}
                {m.recommendations && <div className="text-xs text-gray-500">{m.recommendations}</div>}
              </EntryRow>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Assemblée Générale">
        <form onSubmit={submitAg} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <input type="date" required value={agForm.assembly_date}
            onChange={(e) => setAgForm({ ...agForm, assembly_date: e.target.value })} className={inputCls} />
          <input type="text" placeholder="Résolutions" value={agForm.resolutions}
            onChange={(e) => setAgForm({ ...agForm, resolutions: e.target.value })} className={inputCls} />
          <div className="flex gap-2">
            <input type="text" placeholder="Lien PV (optionnel)" value={agForm.pv_document_url}
              onChange={(e) => setAgForm({ ...agForm, pv_document_url: e.target.value })} className={inputCls} />
            <button type="submit" disabled={saving === "ag" || locked}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shrink-0 disabled:opacity-50">
              +
            </button>
          </div>
        </form>
        {assemblies.length === 0 ? (
          <p className="text-xs text-gray-400">Aucune AG enregistrée pour cet exercice.</p>
        ) : (
          <ul>
            {assemblies.map((a) => (
              <EntryRow key={a.id} onDelete={() => deleteEntry("ag", a.id)}>
                <span className="font-medium">{new Date(a.assembly_date).toLocaleDateString("fr-FR")}</span>
                {a.resolutions && ` — ${a.resolutions}`}
                {a.pv_document_url && (
                  <a href={a.pv_document_url} target="_blank" rel="noreferrer" className="text-emerald-700 ml-2 hover:underline">
                    PV
                  </a>
                )}
              </EntryRow>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
