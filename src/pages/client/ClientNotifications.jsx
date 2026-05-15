// pages/client/Notifications.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../utils/apiClient"; // ton client axios centralisé

/* ─────────────────────────────────────────────────────────
   ICÔNES inline SVG — zéro dépendance
───────────────────────────────────────────────────────── */
const Icon = {
  Bell:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Image:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Audio:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  Text:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  Share:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Copy:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  Trophy:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Close:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Whatsapp: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>,
};

/* ─────────────────────────────────────────────────────────
   CONFIG TYPE
───────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  text:  { label: "Message", color: "bg-teal-100 text-teal-700",    Ico: Icon.Text  },
  image: { label: "Image",   color: "bg-indigo-100 text-indigo-700", Ico: Icon.Image },
  audio: { label: "Audio",   color: "bg-amber-100 text-amber-700",  Ico: Icon.Audio },
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// Lit { success, data } ou renvoie null
function extract(res) {
  if (res?.data?.success === false) return null;
  return res?.data?.data ?? null;
}

/* ─────────────────────────────────────────────────────────
   MODAL DE PARTAGE
───────────────────────────────────────────────────────── */
function ShareModal({ notif, onClose }) {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState(false);
  const [apiError, setApiError]   = useState(false);

  useEffect(() => {
    // Si le token est déjà dans la notif on reconstruit l'URL directement
    if (notif.share_token) {
      setShareData({
        share_token:  notif.share_token,
        share_url:    `${window.location.origin}/inscription?ref=${notif.share_token}`,
        conversions:  notif.my_conversions ?? 0,
        clicks:       notif.my_clicks ?? 0,
      });
      setLoading(false);
      return;
    }
    // Sinon on appelle l'API pour en créer un
    api.post(`/client/broadcasts/${notif.id}/share`)
      .then(res => {
        const d = extract(res);
        if (d) setShareData(d);
        else   setApiError(true);
      })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, [notif.id, notif.share_token]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareData.share_url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsapp = () => {
    const text = encodeURIComponent(
      `🏥 *${notif.title}*\n\nRejoins Awoundjô et couvre-toi ainsi que ta famille !\n👉 ${shareData.share_url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <Icon.Share /> Partager & Gagner
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Icon.Close />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Concours actif */}
          {notif.prize_description && !notif.is_resolved && (
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="text-amber-500 mt-0.5"><Icon.Trophy /></span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Concours en cours 🎁</p>
                <p className="text-sm text-amber-700 mt-0.5">{notif.prize_description}</p>
                {notif.contest_end_date && (
                  <p className="text-xs text-amber-500 mt-1">
                    Fin le {new Date(notif.contest_end_date).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Gagnant */}
          {notif.is_resolved && notif.is_winner && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
              <p className="text-3xl mb-1">🏆</p>
              <p className="font-bold text-teal-700">Félicitations, vous avez gagné !</p>
              <p className="text-sm text-teal-600 mt-0.5">{notif.prize_description}</p>
            </div>
          )}

          {/* Stats */}
          {shareData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-teal-600">{shareData.conversions}</p>
                <p className="text-xs text-gray-500 mt-0.5">Adhésions via ton lien</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-indigo-500">{shareData.clicks}</p>
                <p className="text-xs text-gray-500 mt-0.5">Clics sur ton lien</p>
              </div>
            </div>
          )}

          {/* Lien */}
          {loading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : apiError ? (
            <p className="text-sm text-red-500 text-center">Impossible de générer le lien. Réessaie.</p>
          ) : shareData ? (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Ton lien unique</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <p className="text-xs text-gray-600 truncate flex-1 font-mono">{shareData.share_url}</p>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    copied
                      ? "bg-green-100 text-green-700"
                      : "bg-teal-100 text-teal-700 hover:bg-teal-200"
                  }`}
                >
                  {copied ? <><Icon.Check /> Copié</> : <><Icon.Copy /> Copier</>}
                </button>
              </div>
            </div>
          ) : null}

          {/* Actions partage */}
          {shareData && (
            <div className="flex gap-2">
              <button
                onClick={handleWhatsapp}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                <Icon.Whatsapp /> WhatsApp
              </button>
              {navigator.share && (
                <button
                  onClick={() => navigator.share({ title: notif.title, url: shareData.share_url })}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  <Icon.Share /> Partager
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CARTE NOTIFICATION
───────────────────────────────────────────────────────── */
function NotificationCard({ notif, onRead, onShare }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.text;
  const Ico = cfg.Ico;

  return (
    <div
      onClick={() => !notif.is_read && onRead(notif.id)}
      className={`relative rounded-2xl border transition-all cursor-pointer ${
        notif.is_read
          ? "bg-white border-gray-100"
          : "bg-teal-50/40 border-teal-200 shadow-sm shadow-teal-100"
      }`}
    >
      {/* Point non-lu */}
      {!notif.is_read && (
        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-teal-500" />
      )}

      <div className="p-4 space-y-3">

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 pr-6">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
            <Ico /> {cfg.label}
          </span>
          {notif.prize_description && !notif.is_resolved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              <Icon.Trophy /> Concours
            </span>
          )}
          {notif.is_winner && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
              🏆 Gagné !
            </span>
          )}
        </div>

        {/* Titre + heure */}
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-sm font-semibold leading-snug ${notif.is_read ? "text-gray-700" : "text-gray-900"}`}>
            {notif.title}
          </h3>
          <span className="text-xs text-gray-400 shrink-0">{timeAgo(notif.created_at)}</span>
        </div>

        {/* Corps */}
        {notif.type === "text" && notif.body && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{notif.body}</p>
        )}

        {notif.type === "image" && notif.media_url && (
          <div className="space-y-2">
            {notif.body && <p className="text-sm text-gray-600">{notif.body}</p>}
            <img
              src={notif.media_url}
              alt={notif.title}
              className="w-full rounded-xl object-cover max-h-56"
              loading="lazy"
            />
          </div>
        )}

        {notif.type === "audio" && notif.media_url && (
          <div className="space-y-2">
            {notif.body && <p className="text-sm text-gray-600">{notif.body}</p>}
            {/* stopPropagation pour ne pas déclencher onRead au clic sur les contrôles audio */}
            <audio controls src={notif.media_url} className="w-full" onClick={e => e.stopPropagation()} />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">
            {notif.my_conversions > 0
              ? `${notif.my_conversions} adhésion${notif.my_conversions > 1 ? "s" : ""} via ton lien`
              : ""}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onShare(notif); }}
            className="flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Icon.Share />
            {notif.share_token ? "Mon lien" : "Partager & Gagner"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [shareTarget, setShareTarget]     = useState(null);
  const [filter, setFilter]               = useState("all"); // all | unread | shared

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/client/broadcasts");
      const d   = extract(res);
      if (!d) throw new Error("Réponse invalide");
      setNotifications(d.notifications ?? []);
      setUnread(d.unread_count ?? 0);
    } catch {
      setError("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRead = async (id) => {
    // Mise à jour optimiste
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(u => Math.max(0, u - 1));
    try {
      await api.patch(`/client/broadcasts/${id}/read`);
    } catch {
      // Rollback silencieux — sera corrigé au prochain fetch
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "shared") return !!n.share_token;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">

      {/* En-tête */}
      <div className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0">
            <Icon.Bell />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-500">
              {unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <span className="bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {unread}
          </span>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5">
        {[
          { key: "all",    label: "Toutes"      },
          { key: "unread", label: "Non lues"    },
          { key: "shared", label: "Mes partages"},
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${
              filter === f.key
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* États */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={fetchNotifications} className="mt-3 text-teal-600 text-sm font-medium underline">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
            <Icon.Bell />
          </div>
          <p className="font-medium text-gray-600">
            {filter === "unread"  ? "Aucune notification non lue" :
             filter === "shared"  ? "Vous n'avez encore rien partagé" :
             "Aucune notification pour le moment"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === "shared" && "Partagez des notifications pour gagner des récompenses !"}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {filtered.map(notif => (
            <NotificationCard
              key={notif.id}
              notif={notif}
              onRead={handleRead}
              onShare={setShareTarget}
            />
          ))}
        </div>
      )}

      {/* Modal partage */}
      {shareTarget && (
        <ShareModal notif={shareTarget} onClose={() => setShareTarget(null)} />
      )}

    </div>
  );
}
