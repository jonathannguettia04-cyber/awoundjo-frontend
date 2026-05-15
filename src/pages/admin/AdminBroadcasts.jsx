// pages/admin/AdminBroadcasts.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../utils/apiClient";

/* ─────────── ICÔNES ─────────── */
const Icon = {
  Plus:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Send:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Trophy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Chart:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Delete: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Close:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Users:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

/* ─────────── HELPERS ─────────── */
// Lit { success: true, data: {...} } → retourne data ou null
function extract(res) {
  if (res?.data?.success === false) return null;
  return res?.data?.data ?? null;
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─────────── MODAL LEADERBOARD ─────────── */
function LeaderboardModal({ notif, onClose, onRefresh }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    api.get(`/broadcasts/${notif.id}/leaderboard`)
      .then(res => {
        const d = extract(res);
        setRows(d?.leaderboard ?? []);
      })
      .finally(() => setLoading(false));
  }, [notif.id]);

  const handleResolve = async () => {
    if (!confirm("Désigner le gagnant maintenant ? Cette action est irréversible.")) return;
    setResolving(true);
    try {
      const res = await api.post(`/broadcasts/${notif.id}/contest/resolve`);
      const d   = extract(res);
      if (d?.winner) {
        alert(`🏆 ${d.message}`);
        onRefresh();
        onClose();
      }
    } catch (e) {
      alert(e?.response?.data?.error ?? "Erreur lors de la résolution");
    } finally {
      setResolving(false);
    }
  };

  const canResolve = !notif.is_resolved && notif.prize_description && rows.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <Icon.Chart /> Classement — {notif.title}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon.Close /></button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Aucun partage enregistré pour l'instant</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {rows.map(r => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    r.rank == 1 ? "bg-amber-50 border border-amber-200" : "bg-gray-50"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    r.rank == 1 ? "bg-amber-400 text-white" :
                    r.rank == 2 ? "bg-gray-300 text-gray-700" :
                    r.rank == 3 ? "bg-orange-300 text-white" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {r.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.mutual_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-teal-700">
                      {r.conversions} adhésion{r.conversions != 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-400">{r.clicks} clic{r.clicks != 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {canResolve && (
          <div className="px-5 pb-5">
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              <Icon.Trophy />
              {resolving ? "Résolution en cours…" : "Désigner le gagnant"}
            </button>
          </div>
        )}

        {notif.is_resolved && notif.winner_name && (
          <div className="px-5 pb-5">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-amber-600 font-medium">Gagnant désigné</p>
                <p className="font-bold text-amber-900">{notif.winner_name}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─────────── MODAL CRÉATION ─────────── */
function CreateModal({ onClose, onSuccess }) {
  const [form, setForm]       = useState({ title: "", body: "", type: "text" });
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [contest, setContest] = useState({ enabled: false, prize: "", end_date: "" });
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState(null);
  const fileRef               = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (form.type === "image") {
      const prev = URL.createObjectURL(f);
      setPreview(prev);
    }
  };

  const handleTypeChange = (t) => {
    setForm(f => ({ ...f, type: t }));
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) return setError("Le titre est requis");
    if (form.type !== "text" && !file) return setError("Un fichier est requis pour ce type");
    if (contest.enabled && !contest.prize.trim()) return setError("La description du lot est requise");

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("type",  form.type);
      if (form.body.trim()) fd.append("body", form.body.trim());
      if (file) fd.append("media", file);

      const res     = await api.post("/broadcasts", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const created = extract(res);

      if (!created) throw new Error("Réponse invalide du serveur");

      // Créer le concours si activé
      if (contest.enabled && created.notification?.id) {
        await api.post(`/broadcasts/${created.notification.id}/contest`, {
          prize_description: contest.prize.trim(),
          end_date:          contest.end_date || null,
        });
      }

      onSuccess();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error ?? "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header sticky */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <Icon.Send /> Nouvelle notification
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon.Close /></button>
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex : Offre spéciale Awoundjô juillet"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-gray-400 font-normal">(facultatif)</span>
            </label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="Texte qui accompagne la notification"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de contenu</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "text",  label: "Texte"  },
                { key: "image", label: "Image"  },
                { key: "audio", label: "Audio"  },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTypeChange(t.key)}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                    form.type === t.key
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          {form.type !== "text" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier {form.type === "image" ? "(JPG, PNG, WebP)" : "(MP3, OGG, WAV)"} *
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="aperçu" className="max-h-40 mx-auto rounded-lg" />
                ) : file && form.type === "audio" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-teal-700">{file.name}</p>
                    <audio controls src={URL.createObjectURL(file)} className="mx-auto" />
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="flex justify-center mb-2"><Icon.Upload /></div>
                    <p className="text-sm">Cliquez pour choisir un fichier</p>
                    <p className="text-xs mt-1 text-gray-300">Max 20 Mo</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept={form.type === "image" ? "image/*" : "audio/*"}
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
            </div>
          )}

          {/* Concours */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={contest.enabled}
                onChange={e => setContest(c => ({ ...c, enabled: e.target.checked }))}
                className="w-4 h-4 accent-teal-600"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Icon.Trophy /> Associer un concours de parrainage
              </span>
            </label>

            {contest.enabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lot à gagner *</label>
                  <input
                    type="text"
                    value={contest.prize}
                    onChange={e => setContest(c => ({ ...c, prize: e.target.value }))}
                    placeholder="Ex : Bon d'achat 50 000 FCFA"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de fin <span className="text-gray-300">(optionnel)</span></label>
                  <input
                    type="date"
                    value={contest.end_date}
                    onChange={e => setContest(c => ({ ...c, end_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

        </div>

        {/* Footer sticky */}
        <div className="px-5 py-4 border-t shrink-0">
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <Icon.Send />
            {sending ? "Envoi en cours…" : "Envoyer à tous les clients actifs"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─────────── CARTE NOTIFICATION ADMIN ─────────── */
function NotifCard({ notif, onLeaderboard, onRefresh }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Supprimer la notification "${notif.title}" ?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/broadcasts/${notif.id}`);
      onRefresh();
    } catch {
      alert("Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  const readPct = notif.total_recipients > 0
    ? Math.round((notif.total_read / notif.total_recipients) * 100)
    : 0;

  const TYPE_COLORS = {
    text:  "bg-teal-100 text-teal-700",
    image: "bg-indigo-100 text-indigo-700",
    audio: "bg-amber-100 text-amber-700",
  };
  const TYPE_LABELS = { text: "Texte", image: "Image", audio: "Audio" };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${TYPE_COLORS[notif.type]}`}>
              {TYPE_LABELS[notif.type]}
            </span>
            {notif.prize_description && (
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                notif.is_resolved
                  ? "bg-gray-100 text-gray-500"
                  : "bg-amber-100 text-amber-700"
              }`}>
                <Icon.Trophy />
                {notif.is_resolved ? "Concours terminé" : "Concours actif"}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">{notif.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {fmtDate(notif.created_at)} · par {notif.created_by_name ?? "Admin"}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Supprimer"
          className="shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
        >
          <Icon.Delete />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-xl p-3">
        {[
          { label: "Destinataires", value: notif.total_recipients,  color: "text-gray-800"    },
          { label: "Lus",           value: `${readPct}%`,           color: "text-teal-600"    },
          { label: "Partageurs",    value: notif.total_sharers,     color: "text-indigo-600"  },
          { label: "Adhésions",     value: notif.total_conversions, color: "text-amber-600"   },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barre de lecture */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Taux de lecture</span>
          <span>{notif.total_read} / {notif.total_recipients}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${readPct}%` }}
          />
        </div>
      </div>

      {/* Gagnant */}
      {notif.is_resolved && notif.winner_name && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-amber-600 font-medium">Gagnant désigné</p>
            <p className="font-bold text-amber-900">{notif.winner_name}</p>
            <p className="text-xs text-amber-600">{notif.winner_mutual_number}</p>
          </div>
        </div>
      )}

      {/* Action classement */}
      <button
        onClick={() => onLeaderboard(notif)}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 py-2 rounded-xl transition-colors"
      >
        <Icon.Chart /> Voir le classement des partages
      </button>

    </div>
  );
}

/* ─────────── PAGE PRINCIPALE ─────────── */
export default function AdminBroadcasts() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showCreate, setShowCreate]       = useState(false);
  const [leaderTarget, setLeaderTarget]   = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/broadcasts");
      const d   = extract(res);
      setNotifications(d?.notifications ?? []);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Totaux globaux
  const totals = notifications.reduce(
    (acc, n) => ({
      recipients:  acc.recipients  + (Number(n.total_recipients)  || 0),
      conversions: acc.conversions + (Number(n.total_conversions) || 0),
      sharers:     acc.sharers     + (Number(n.total_sharers)     || 0),
    }),
    { recipients: 0, conversions: 0, sharers: 0 }
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">

      {/* En-tête */}
      <div className="flex items-center justify-between py-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications broadcast</h1>
          <p className="text-sm text-gray-500">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""} envoyée{notifications.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-teal-200"
        >
          <Icon.Plus /> Nouvelle
        </button>
      </div>

      {/* Résumé global */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Clients atteints",   value: totals.recipients,  color: "text-gray-800"   },
            { label: "Partageurs actifs",  value: totals.sharers,     color: "text-indigo-600" },
            { label: "Nouvelles adhésions",value: totals.conversions, color: "text-teal-600"   },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse"/>)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
            <Icon.Users />
          </div>
          <p className="text-gray-500 text-sm">Aucune notification envoyée pour le moment</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 text-teal-600 font-medium text-sm hover:underline"
          >
            <Icon.Plus /> Créer la première notification
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(n => (
            <NotifCard
              key={n.id}
              notif={n}
              onLeaderboard={setLeaderTarget}
              onRefresh={fetchAll}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onSuccess={fetchAll} />
      )}
      {leaderTarget && (
        <LeaderboardModal
          notif={leaderTarget}
          onClose={() => setLeaderTarget(null)}
          onRefresh={fetchAll}
        />
      )}

    </div>
  );
}
