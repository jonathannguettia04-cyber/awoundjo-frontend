// src/pages/client/ClientDashboard.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clientProfileAPI, PLANS, STATUS_LABELS } from "../../clientApi";
import axios from "axios";

const MENU = [
  { path: "/client/dossier",          icon: "📋", label: "Dossier Médical",  color: "#7C3AED", bg: "linear-gradient(135deg,#EDE9FE,#F5F3FF)" },
  { path: "/client/teleconsultation", icon: "💬", label: "Téléconsultation", color: "#0891B2", bg: "linear-gradient(135deg,#CFFAFE,#ECFEFF)" },
  { path: "/client/cotisations",      icon: "💰", label: "Cotisations",      color: "#059669", bg: "linear-gradient(135deg,#D1FAE5,#ECFDF5)" },
  { path: "/client/reseau",           icon: "🏥", label: "Réseau de Soins",  color: "#D97706", bg: "linear-gradient(135deg,#FEF3C7,#FFFBEB)" },
  { path: "/client/famille",          icon: "👨‍👩‍👧‍👦", label: "Ma Famille",      color: "#DB2777", bg: "linear-gradient(135deg,#FCE7F3,#FDF2F8)" },
  { path: "/client/carte",            icon: "💳", label: "Ma Carte",         color: "#1D4ED8", bg: "linear-gradient(135deg,#DBEAFE,#EFF6FF)" },
];

const PLAN_GRADIENTS = {
  ESSENTIELLE: "linear-gradient(135deg, #1a56db 0%, #1e3a8a 100%)",
  IVOIRIENNE:  "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
  TURQUOISE:   "linear-gradient(135deg, #0891B2 0%, #164e63 100%)",
};

// ─── Icône selon le type de notif ──────────────────────────────────────────
function NotifTypeIcon({ type }) {
  if (type === "image") return <span style={{ fontSize: 16 }}>🖼️</span>;
  if (type === "audio") return <span style={{ fontSize: 16 }}>🎵</span>;
  return <span style={{ fontSize: 16 }}>📣</span>;
}

// ─── Modal notification ────────────────────────────────────────────────────
function NotifModal({ notif, onClose, onShare, shareLink, shareLoading, copied, onCopy }) {
  if (!notif) return null;

  const hasContest = !!notif.prize_description;
  const isWinner   = notif.is_winner;
  const contestActive = hasContest && !notif.is_resolved &&
    (!notif.contest_end_date || new Date(notif.contest_end_date) > new Date());

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 520, maxHeight: "85vh",
        overflowY: "auto", padding: "24px 20px 40px",
        boxShadow: "0 -8px 40px rgba(0,0,0,.2)",
        animation: "slideUp .3s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 99, margin: "0 auto 20px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <NotifTypeIcon type={notif.type} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", lineHeight: 1.3 }}>{notif.title}</h3>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
              {new Date(notif.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 10, width: 32, height: 32, cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>

        {/* Corps texte */}
        {notif.body && (
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginBottom: 16, background: "#F8FAFC", borderRadius: 14, padding: "14px 16px" }}>
            {notif.body}
          </p>
        )}

        {/* Média image */}
        {notif.type === "image" && notif.media_url && (
          <img src={notif.media_url} alt="broadcast" style={{ width: "100%", borderRadius: 16, marginBottom: 16, objectFit: "cover", maxHeight: 240 }} />
        )}

        {/* Média audio */}
        {notif.type === "audio" && notif.media_url && (
          <audio controls src={notif.media_url} style={{ width: "100%", marginBottom: 16 }} />
        )}

        {/* Concours actif */}
        {hasContest && (
          <div style={{
            background: contestActive
              ? "linear-gradient(135deg,#FFFBEB,#FEF3C7)"
              : "linear-gradient(135deg,#F0FDF4,#DCFCE7)",
            border: `1.5px solid ${contestActive ? "#FCD34D" : "#86EFAC"}`,
            borderRadius: 16, padding: "14px 16px", marginBottom: 16,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: contestActive ? "#92400E" : "#166534", margin: "0 0 4px" }}>
              {isWinner ? "🏆 Vous avez gagné !" : contestActive ? "🎁 Concours en cours" : "✅ Concours terminé"}
            </p>
            <p style={{ fontSize: 12, color: contestActive ? "#B45309" : "#15803D", margin: "0 0 6px" }}>
              {notif.prize_description}
            </p>
            {notif.contest_end_date && contestActive && (
              <p style={{ fontSize: 11, color: "#D97706", margin: 0 }}>
                Fin le {new Date(notif.contest_end_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
              </p>
            )}
            {notif.share_token && (
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#6B7280", background: "#fff", padding: "4px 10px", borderRadius: 8, border: "1px solid #E5E7EB" }}>
                  👥 {notif.my_conversions || 0} adhésion(s)
                </span>
                <span style={{ fontSize: 11, color: "#6B7280", background: "#fff", padding: "4px 10px", borderRadius: 8, border: "1px solid #E5E7EB" }}>
                  👁️ {notif.my_clicks || 0} clic(s)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bouton partager */}
        {!shareLink ? (
          <button onClick={onShare} disabled={shareLoading} style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: shareLoading ? "#E2E8F0" : "linear-gradient(135deg,#1a56db,#1e3a8a)",
            color: shareLoading ? "#94A3B8" : "#fff",
            border: "none", fontSize: 14, fontWeight: 700,
            cursor: shareLoading ? "not-allowed" : "pointer",
            fontFamily: "'Poppins',sans-serif",
            boxShadow: shareLoading ? "none" : "0 4px 14px rgba(26,86,219,.3)",
            transition: "all .2s",
          }}>
            {shareLoading ? "Génération..." : "🔗 Générer mon lien de partage"}
          </button>
        ) : (
          <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 16, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", margin: "0 0 8px" }}>✅ Votre lien personnel</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: "#15803D", flex: 1, wordBreak: "break-all", background: "#fff", borderRadius: 8, padding: "8px 10px", border: "1px solid #BBF7D0", margin: 0 }}>
                {shareLink.share_url}
              </p>
              <button onClick={onCopy} style={{
                background: copied ? "#059669" : "#1a56db",
                color: "#fff", border: "none", borderRadius: 10,
                padding: "8px 14px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Poppins',sans-serif",
                transition: "background .2s", whiteSpace: "nowrap",
              }}>
                {copied ? "✓ Copié" : "Copier"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, textAlign: "center", background: "#fff", borderRadius: 10, padding: "8px", border: "1px solid #BBF7D0" }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#059669", margin: "0 0 2px" }}>{shareLink.conversions || 0}</p>
                <p style={{ fontSize: 10, color: "#6B7280", margin: 0 }}>Adhésions</p>
              </div>
              <div style={{ flex: 1, textAlign: "center", background: "#fff", borderRadius: 10, padding: "8px", border: "1px solid #BBF7D0" }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#0891B2", margin: "0 0 2px" }}>{shareLink.clicks || 0}</p>
                <p style={{ fontSize: 10, color: "#6B7280", margin: 0 }}>Clics</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [visible,      setVisible]      = useState(false);
  const [broadcasts,   setBroadcasts]   = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [activeNotif,  setActiveNotif]  = useState(null);
  const [shareLink,    setShareLink]    = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied,       setCopied]       = useState(false);
  const cardRef = useRef();

  useEffect(() => {
    clientProfileAPI.get()
      .then(res => { setProfile(res.data.data); setTimeout(() => setVisible(true), 100); })
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));

    axios.get("/api/client/broadcasts", { withCredentials: true })
      .then(res => {
        if (res.data.success) {
          setBroadcasts(res.data.data.notifications || []);
          setUnreadCount(res.data.data.unread_count || 0);
        }
      })
      .catch(() => {});
  }, []);

  const openNotif = async (notif) => {
    setActiveNotif(notif);
    setShareLink(null);
    if (!notif.is_read) {
      try {
        await axios.patch(`/api/client/broadcasts/${notif.id}/read`, {}, { withCredentials: true });
        setBroadcasts(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (_) {}
    }
  };

  const handleShare = async () => {
    if (!activeNotif) return;
    setShareLoading(true);
    try {
      const res = await axios.post(`/api/client/broadcasts/${activeNotif.id}/share`, {}, { withCredentials: true });
      if (res.data.success) setShareLink(res.data.data);
    } catch (_) {}
    setShareLoading(false);
  };

  const copyLink = () => {
    if (!shareLink?.share_url) return;
    navigator.clipboard.writeText(shareLink.share_url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <Skeleton />;
  if (!profile) return null;

  const plan     = PLANS[profile.plan] || PLANS.ESSENTIELLE;
  const status   = STATUS_LABELS[profile.status] || STATUS_LABELS["actif"] || STATUS_LABELS.active || { label: "Actif", color: "#16A34A" };
  const gradient = PLAN_GRADIENTS[profile.plan] || PLAN_GRADIENTS.ESSENTIELLE;

  const expiry = profile.expiration_date
    ? new Date(profile.expiration_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "N/A";

  const expiringSoon = profile.expiration_date &&
    new Date(profile.expiration_date) - new Date() < 7 * 86400000;

  const spouse   = profile.dependents_summary?.spouse   || 0;
  const children = profile.dependents_summary?.children || 0;
  const total    = 1 + spouse + children;

  // Notifs à afficher : max 5 dans le dashboard
  const previewNotifs = broadcasts.slice(0, 5);

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* ── Modal notification ───────────────────────────────────── */}
      <NotifModal
        notif={activeNotif}
        onClose={() => setActiveNotif(null)}
        onShare={handleShare}
        shareLink={shareLink}
        shareLoading={shareLoading}
        copied={copied}
        onCopy={copyLink}
      />

      {/* ── Hero Card ──────────────────────────────────────────────── */}
      <div ref={cardRef} style={{
        background: gradient,
        borderRadius: 24,
        padding: "24px 20px",
        color: "#fff",
        boxShadow: "0 16px 48px rgba(26,86,219,.35)",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />

        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
          <div>
            <p style={{ fontSize: 13, opacity: .75, margin: "0 0 3px", fontWeight: 500 }}>Bonjour 👋</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", letterSpacing: -.3 }}>{profile.name}</h2>
            <p style={{ fontSize: 12, opacity: .65, margin: 0, fontFamily: "monospace", letterSpacing: 1.5 }}>{profile.mutual_number}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,.18)", backdropFilter: "blur(10px)", borderRadius: 14, padding: "10px 16px", border: "1px solid rgba(255,255,255,.2)" }}>
            <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{plan.coverage}</span>
            <span style={{ fontSize: 9, opacity: .8, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>couverture</span>
          </div>
        </div>

        {/* Bottom info row */}
        <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,.12)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)" }}>
          {[
            { label: "Formule", value: plan.name },
            { label: "Statut",  value: ["actif","active","ACTIVE"].includes(profile.status) ? "✅ Actif" : "⚠️ " + status.label },
            { label: "Expire",  value: expiry },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: "12px 10px", borderRight: i < 2 ? "1px solid rgba(255,255,255,.15)" : "none", textAlign: "center" }}>
              <p style={{ fontSize: 10, opacity: .7, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: .8 }}>{item.label}</p>
              <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Alerte suspension ──────────────────────────────────────── */}
      {profile.status === "suspendu" && (
        <div style={{
          background: "linear-gradient(135deg,#FEF2F2,#FEE2E2)",
          border: "1px solid #FCA5A5",
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          boxShadow: "0 4px 12px rgba(220,38,38,.12)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "all .5s .05s cubic-bezier(.34,1.56,.64,1)",
        }}>
          <span style={{ fontSize: 24 }}>🚫</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: "#991B1B", margin: "0 0 2px", fontSize: 13 }}>
              Compte suspendu — cotisation non à jour
            </p>
            <p style={{ color: "#B91C1C", margin: 0, fontSize: 12 }}>
              Votre adhésion a expiré. Réglez votre cotisation pour réactiver l'accès à vos services.
            </p>
          </div>
          <button onClick={() => navigate("/client/cotisations")} style={{
            background: "linear-gradient(135deg,#DC2626,#B91C1C)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "9px 14px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Poppins',sans-serif",
            boxShadow: "0 4px 10px rgba(220,38,38,.3)",
            whiteSpace: "nowrap",
          }}>Payer →</button>
        </div>
      )}

      {/* ── Alerte renouvellement ──────────────────────────────────── */}
      {profile.status !== "suspendu" && (expiringSoon || profile.status === "renewal_required") && (
        <div style={{
          background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
          border: "1px solid #FCD34D",
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          boxShadow: "0 4px 12px rgba(245,158,11,.15)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "all .5s .1s cubic-bezier(.34,1.56,.64,1)",
        }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: "#92400E", margin: "0 0 2px", fontSize: 13 }}>Renouvellement requis</p>
            <p style={{ color: "#B45309", margin: 0, fontSize: 12 }}>Votre adhésion expire bientôt.</p>
          </div>
          <button onClick={() => navigate("/client/cotisations")} style={{
            background: "linear-gradient(135deg,#F59E0B,#D97706)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "9px 14px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Poppins',sans-serif",
            boxShadow: "0 4px 10px rgba(245,158,11,.3)",
            whiteSpace: "nowrap",
          }}>Renouveler →</button>
        </div>
      )}

      {/* ── Notifications Broadcast ────────────────────────────────── */}
      {broadcasts.length > 0 && (
        <div style={{
          marginBottom: 20,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "all .5s .12s cubic-bezier(.34,1.56,.64,1)",
        }}>
          {/* Header section */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: -.3 }}>
                Notifications
              </p>
              {unreadCount > 0 && (
                <span style={{
                  background: "linear-gradient(135deg,#EF4444,#DC2626)",
                  color: "#fff", borderRadius: 99,
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 8px",
                  boxShadow: "0 2px 6px rgba(239,68,68,.4)",
                }}>
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {broadcasts.length > 5 && (
              <button onClick={() => navigate("/client/notifications")} style={{
                background: "none", border: "none", color: "#1a56db",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Poppins',sans-serif", padding: 0,
              }}>
                Voir tout →
              </button>
            )}
          </div>

          {/* Liste des notifs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {previewNotifs.map((notif, i) => {
              const hasContest   = !!notif.prize_description;
              const isWinner     = notif.is_winner;
              const contestActive = hasContest && !notif.is_resolved &&
                (!notif.contest_end_date || new Date(notif.contest_end_date) > new Date());

              return (
                <div
                  key={notif.id}
                  onClick={() => openNotif(notif)}
                  style={{
                    background: notif.is_read ? "#fff" : "linear-gradient(135deg,#EFF6FF,#F0F9FF)",
                    border: notif.is_read ? "1px solid #F1F5F9" : "1.5px solid #BFDBFE",
                    borderRadius: 16,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    boxShadow: notif.is_read
                      ? "0 2px 8px rgba(0,0,0,.04)"
                      : "0 4px 14px rgba(26,86,219,.1)",
                    transition: "transform .15s, box-shadow .15s",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                    transitionDelay: `${.15 + i * .05}s`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = notif.is_read ? "0 2px 8px rgba(0,0,0,.04)" : "0 4px 14px rgba(26,86,219,.1)"; }}
                >
                  {/* Icône type */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: notif.is_read ? "#F1F5F9" : "linear-gradient(135deg,#1a56db,#1e3a8a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: notif.is_read ? "none" : "0 3px 10px rgba(26,86,219,.3)",
                  }}>
                    <span style={{ fontSize: 18 }}>
                      {notif.type === "image" ? "🖼️" : notif.type === "audio" ? "🎵" : "📣"}
                    </span>
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <p style={{
                        fontSize: 13, fontWeight: notif.is_read ? 600 : 800,
                        color: "#0F172A", margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1a56db", flexShrink: 0, boxShadow: "0 0 0 2px #BFDBFE" }} />
                      )}
                      {isWinner && <span style={{ fontSize: 14 }}>🏆</span>}
                    </div>
                    {notif.body && (
                      <p style={{
                        fontSize: 12, color: "#64748B", margin: "0 0 4px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {notif.body}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>
                        {new Date(notif.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </span>
                      {contestActive && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#D97706", background: "#FEF3C7", padding: "1px 6px", borderRadius: 6 }}>
                          🎁 Concours
                        </span>
                      )}
                      {notif.share_token && (
                        <span style={{ fontSize: 10, color: "#059669", background: "#D1FAE5", padding: "1px 6px", borderRadius: 6 }}>
                          🔗 {notif.my_conversions || 0} adhésion{(notif.my_conversions || 0) > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <span style={{ color: "#CBD5E1", fontSize: 16, flexShrink: 0 }}>›</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Famille stats ──────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 20,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "all .5s .15s cubic-bezier(.34,1.56,.64,1)",
      }}>
        {[
          { icon: "👤", val: "1",              sub: "Titulaire",   color: "#1D4ED8", bg: "#EFF6FF" },
          { icon: "💑", val: `${spouse}/1`,    sub: "Conjoint(e)", color: "#DB2777", bg: "#FDF2F8" },
          { icon: "👶", val: `${children}/3`,  sub: "Enfants",     color: "#059669", bg: "#ECFDF5" },
          { icon: "👨‍👩‍👧‍👦", val: `${total}`,       sub: "Membres",    color: "#7C3AED", bg: "#F5F3FF" },
        ].map((st, i) => (
          <div key={i} onClick={() => navigate("/client/famille")} style={{
            flex: 1, background: "#fff", borderRadius: 14,
            padding: "12px 8px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3,
            boxShadow: "0 2px 10px rgba(0,0,0,.06)",
            cursor: "pointer", transition: "transform .2s, box-shadow .2s",
            border: `1.5px solid ${st.bg}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.06)"; }}
          >
            <span style={{ fontSize: 18 }}>{st.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: st.color }}>{st.val}</span>
            <span style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", fontWeight: 500 }}>{st.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Menu Services ──────────────────────────────────────────── */}
      <p style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 14, letterSpacing: -.3 }}>Mes services</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {MENU.map((item, i) => (
          <button key={item.path} onClick={() => navigate(item.path)} style={{
            background: item.bg,
            borderRadius: 18,
            padding: "18px 16px",
            display: "flex", flexDirection: "column",
            alignItems: "flex-start", gap: 10,
            border: "none", cursor: "pointer", textAlign: "left",
            boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            transition: "transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(15px) scale(.95)",
            transitionDelay: `${.2 + i * .07}s`,
            fontFamily: "'Poppins',sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.05)"; }}
          >
            <div style={{ width: 44, height: 44, background: "rgba(255,255,255,.8)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: item.color, lineHeight: 1.3 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Agent card ─────────────────────────────────────────────── */}
      {profile.agent_name && (
        <div style={{
          background: "#fff",
          borderRadius: 18, padding: "16px",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 4px 16px rgba(0,0,0,.07)",
          border: "1px solid #F1F5F9",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "all .5s .65s cubic-bezier(.34,1.56,.64,1)",
        }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#1a56db,#1e3a8a)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👨‍💼</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 2px", fontWeight: 500, textTransform: "uppercase", letterSpacing: .8 }}>Votre agent</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>{profile.agent_name}</p>
          </div>
          {profile.agent_phone && (
            <a href={`tel:${profile.agent_phone}`} style={{
              background: "linear-gradient(135deg,#1a56db,#1e40af)",
              color: "#fff", borderRadius: 12,
              padding: "10px 16px", fontSize: 12,
              fontWeight: 700, textDecoration: "none",
              boxShadow: "0 4px 12px rgba(26,86,219,.3)",
              whiteSpace: "nowrap",
            }}>📞 Appeler</a>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: 16, fontFamily: "'Poppins',sans-serif" }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[180, 80, 100].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 20, marginBottom: 16, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ height: 100, borderRadius: 18, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", animationDelay: `${i*0.1}s` }} />
        ))}
      </div>
    </div>
  );
}
