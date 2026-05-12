// src/pages/collecte/CollectePage.jsx
// ─────────────────────────────────────────────────────────────
//  Page publique de collecte — accessible via /collecte/:token
//  Sans authentification requise.
//  Flux :
//    1. GET  /api/collecte/:token          → affiche état collecte
//    2. POST /api/collecte/:token/payer    → initie un versement
//    3. POST /api/collecte/:token/wave-confirm → confirme un paiement Wave
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";

// ── Configuration API ─────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || "Erreur serveur");
  return data;
}

// ── Icônes SVG inline ─────────────────────────────────────────
const IconWave    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/></svg>;
const IconPhone   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
const IconCheck   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>;
const IconRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
const IconArrow   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>;
const IconCopy    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconStar    = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// ── Méthodes de paiement ──────────────────────────────────────
const METHODES = [
  { id: "wave",   label: "Wave",         color: "#0094F0", bg: "#EBF7FF", icon: "〜" },
  { id: "orange", label: "Orange Money", color: "#FF6600", bg: "#FFF3EB", icon: "◉" },
  { id: "mtn",    label: "MTN MoMo",     color: "#FFCC00", bg: "#FFFBEB", icon: "◎" },
  { id: "moov",   label: "Moov Money",   color: "#0066CC", bg: "#EBF2FF", icon: "◍" },
];

// ── Formatage monétaire ───────────────────────────────────────
const fcfa = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(n) + " FCFA";

// ── Composant barre de progression ───────────────────────────
function ProgressBar({ pct }) {
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${Math.max(2, pct)}%` }}
      />
      <span className="progress-label">{pct}%</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function CollectePage() {
  const { token }            = useParams();
  const [searchParams]       = useSearchParams();
  const paymentStatus        = searchParams.get("payment"); // "success" | "failed"

  // ── State ─────────────────────────────────────────────────
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Étape : "home" | "choix" | "wave_instruct" | "wave_confirm" | "success"
  const [step,       setStep]       = useState("home");
  const [methode,    setMethode]    = useState(null);
  const [montant,    setMontant]    = useState("");
  const [wavePayData,setWavePayData]= useState(null); // réponse /payer pour wave
  const [waveRef,    setWaveRef]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback,   setFeedback]   = useState(null); // { type: "ok"|"err", msg }
  const [copied,     setCopied]     = useState(false);

  // ── Chargement initial ────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiFetch(`/api/collecte/${token}`);
      setData(res.data ?? res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Redirection auto si paiement Jeko réussi (retour depuis lien externe)
  useEffect(() => {
    if (paymentStatus === "success") {
      setStep("success");
      setFeedback({ type: "ok", msg: "Paiement confirmé ! Merci pour votre versement." });
      fetchData();
    }
    if (paymentStatus === "failed") {
      setFeedback({ type: "err", msg: "Le paiement n'a pas abouti. Veuillez réessayer." });
    }
  }, [paymentStatus, fetchData]);

  // ── Initier un versement ─────────────────────────────────
  async function handlePayer() {
    if (!methode) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const body = { methode };
      const m = parseInt(montant, 10);
      if (m && m >= 500) body.montant = m;

      const res = await apiFetch(`/api/collecte/${token}/payer`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const payload = res.data ?? res;

      if (methode === "wave") {
        setWavePayData(payload);
        setMontant(String(payload.montant));
        setStep("wave_instruct");
        // Ouvre le deeplink Wave si disponible
        if (payload.wave_qr_data) {
          setTimeout(() => { window.location.href = payload.wave_qr_data; }, 400);
        }
      } else {
        // Orange / MTN / Moov → redirection vers lien Jeko
        const redirectUrl =
          payload.data?.redirect_url  ||
          payload.data?.payment_url   ||
          payload.redirect_url        ||
          payload.payment_url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          setFeedback({ type: "err", msg: "Lien de paiement indisponible. Réessayez." });
        }
      }
    } catch (e) {
      setFeedback({ type: "err", msg: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Confirmer versement Wave ──────────────────────────────
  async function handleWaveConfirm() {
    if (!waveRef.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const m = parseInt(montant, 10);
      const res = await apiFetch(`/api/collecte/${token}/wave-confirm`, {
        method: "POST",
        body: JSON.stringify({ montant: m, wave_ref: waveRef.trim() }),
      });
      const payload = res.data ?? res;
      setData((prev) => ({
        ...prev,
        collecte: payload.collecte,
        client:   { ...prev?.client, status_payment: payload.client_active ? "paid" : prev?.client?.status_payment },
      }));
      setStep("success");
      setFeedback({ type: "ok", msg: payload.message });
    } catch (e) {
      setFeedback({ type: "err", msg: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Copier la référence Wave ──────────────────────────────
  function copyWaveNumber(num) {
    navigator.clipboard?.writeText(num).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Rendu états ───────────────────────────────────────────
  if (loading) return <Loader />;
  if (error)   return <ErrorScreen message={error} />;
  if (!data)   return null;

  const { client, agent, collecte } = data;
  const complete = collecte?.complete || client?.status_payment === "paid";

  return (
    <>
      <style>{STYLES}</style>
      <div className="page-wrap">
        {/* En-tête */}
        <header className="page-header">
          <div className="logo-badge">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Awoundjô</span>
          </div>
          <p className="header-sub">Espace de collecte sécurisé</p>
        </header>

        <div className="card-wrap">
          {/* ── Carte client ─────────────────────────────── */}
          <div className="client-card">
            <div className="client-avatar">
              {(client?.name || "?")[0].toUpperCase()}
            </div>
            <div className="client-info">
              <p className="client-name">{client?.name}</p>
              <p className="client-meta">{client?.phone} · N° {client?.mutual_number}</p>
              {agent && <p className="client-agent">Agent : {agent.name}</p>}
            </div>
            {complete && (
              <span className="badge-complete"><IconCheck /> Adhésion complète</span>
            )}
          </div>

          {/* ── Progression ──────────────────────────────── */}
          <div className="progress-section">
            <div className="progress-row">
              <span className="progress-title">Collecte d'adhésion</span>
              <span className="progress-amounts">
                <strong>{fcfa(collecte?.total_verse ?? 0)}</strong>
                <span className="muted"> / {fcfa(collecte?.adhesion_price ?? 0)}</span>
              </span>
            </div>
            <ProgressBar pct={collecte?.pct_atteint ?? 0} />
            {!complete && (
              <p className="reste-text">Reste à verser : <strong>{fcfa(collecte?.reste ?? 0)}</strong></p>
            )}
          </div>

          {/* ── Feedback global ───────────────────────────── */}
          {feedback && (
            <div className={`feedback feedback-${feedback.type}`}>
              {feedback.type === "ok" ? <IconCheck /> : "⚠"}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              ÉTAPES
          ═══════════════════════════════════════════════ */}

          {/* ÉTAPE : home */}
          {step === "home" && !complete && (
            <div className="step-section">
              <button className="btn-primary" onClick={() => setStep("choix")}>
                Effectuer un versement
              </button>
              {collecte?.versements?.length > 0 && (
                <Historique versements={collecte.versements} />
              )}
            </div>
          )}

          {/* ÉTAPE : choix de méthode + montant */}
          {step === "choix" && (
            <div className="step-section">
              <button className="btn-back" onClick={() => setStep("home")}>
                <IconArrow /> Retour
              </button>
              <p className="step-title">Choisissez votre moyen de paiement</p>

              <div className="methodes-grid">
                {METHODES.map((m) => (
                  <button
                    key={m.id}
                    className={`methode-card ${methode === m.id ? "selected" : ""}`}
                    style={{ "--m-color": m.color, "--m-bg": m.bg }}
                    onClick={() => setMethode(m.id)}
                  >
                    <span className="methode-icon">{m.icon}</span>
                    <span className="methode-label">{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="montant-row">
                <label className="input-label">
                  Montant (FCFA) — optionnel
                  <span className="input-hint">Laissez vide pour verser le solde restant ({fcfa(collecte?.reste ?? 0)})</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder={String(collecte?.reste ?? 0)}
                  min="500"
                  max={collecte?.reste}
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                />
              </div>

              {feedback && (
                <div className={`feedback feedback-${feedback.type}`}>
                  {feedback.type === "ok" ? <IconCheck /> : "⚠"} {feedback.msg}
                </div>
              )}

              <button
                className="btn-primary"
                disabled={!methode || submitting}
                onClick={handlePayer}
              >
                {submitting ? <span className="spinner" /> : null}
                {submitting ? "Chargement…" : "Continuer"}
              </button>
            </div>
          )}

          {/* ÉTAPE : instructions Wave + QR */}
          {step === "wave_instruct" && wavePayData && (
            <div className="step-section">
              <button className="btn-back" onClick={() => setStep("choix")}>
                <IconArrow /> Retour
              </button>
              <p className="step-title">Paiement Wave</p>

              <div className="wave-box">
                <p className="wave-amount">{fcfa(wavePayData.montant)}</p>
                <p className="wave-desc">à envoyer au numéro Wave :</p>
                <div className="wave-number-row">
                  <span className="wave-number">{wavePayData.wave_number}</span>
                  <button className="btn-copy" onClick={() => copyWaveNumber(wavePayData.wave_number)}>
                    {copied ? <IconCheck /> : <IconCopy />}
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>
                <p className="wave-instructions">{wavePayData.instructions}</p>
                <a
                  href={wavePayData.wave_qr_data}
                  className="btn-wave-open"
                >
                  <IconWave /> Ouvrir l'app Wave
                </a>
              </div>

              <p className="step-subtitle">Une fois le paiement effectué, saisissez votre référence de transaction Wave :</p>

              <input
                type="text"
                className="input-field"
                placeholder="Ex : WT-XXXXXXXXXX"
                value={waveRef}
                onChange={(e) => setWaveRef(e.target.value)}
              />

              <input
                type="number"
                className="input-field mt-2"
                placeholder={`Montant versé (${wavePayData.montant} FCFA)`}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />

              {feedback && (
                <div className={`feedback feedback-${feedback.type}`}>
                  {feedback.type === "ok" ? <IconCheck /> : "⚠"} {feedback.msg}
                </div>
              )}

              <button
                className="btn-primary"
                disabled={!waveRef.trim() || submitting}
                onClick={handleWaveConfirm}
              >
                {submitting ? <span className="spinner" /> : null}
                {submitting ? "Vérification…" : "Confirmer le versement"}
              </button>
            </div>
          )}

          {/* ÉTAPE : succès */}
          {(step === "success" || complete) && (
            <div className="step-section success-section">
              <div className="success-icon">
                {collecte?.complete || complete ? (
                  <span className="star-burst"><IconStar /><IconStar /><IconStar /></span>
                ) : (
                  <IconCheck />
                )}
              </div>
              {collecte?.complete || complete ? (
                <>
                  <p className="success-title">Adhésion complète ! 🎉</p>
                  <p className="success-body">
                    Félicitations, {client?.name}. Bienvenue dans la mutuelle Awoundjô !
                  </p>
                </>
              ) : (
                <>
                  <p className="success-title">Versement enregistré ✅</p>
                  {feedback && <p className="success-body">{feedback.msg}</p>}
                </>
              )}
              <button className="btn-secondary" onClick={() => { setStep("home"); setFeedback(null); fetchData(); }}>
                <IconRefresh /> Voir l'état de ma collecte
              </button>
            </div>
          )}

          {/* Adhésion déjà complète & pas dans step success */}
          {complete && step === "home" && (
            <div className="complete-banner">
              <IconCheck />
              <div>
                <strong>Votre adhésion est complète.</strong>
                <p>Vous êtes bien enregistré(e) dans la mutuelle Awoundjô.</p>
              </div>
            </div>
          )}

          {/* Historique si home */}
          {step === "home" && collecte?.versements?.length > 0 && complete && (
            <Historique versements={collecte.versements} />
          )}
        </div>

        <footer className="page-footer">
          <p>🔒 Lien sécurisé · Awoundjô Mutuelle</p>
        </footer>
      </div>
    </>
  );
}

// ── Composant historique des versements ───────────────────────
function Historique({ versements }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="historique">
      <button className="historique-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "▲" : "▼"} Historique des versements ({versements.length})
      </button>
      {open && (
        <ul className="historique-list">
          {versements.map((v) => (
            <li key={v.id} className="historique-item">
              <span className="h-amount">{fcfa(Number(v.montant))}</span>
              <span className="h-method">{v.payment_method?.toUpperCase() || "WAVE"}</span>
              <span className="h-date">{new Date(v.created_at).toLocaleDateString("fr-FR")}</span>
              {v.wave_ref && <span className="h-ref">{v.wave_ref}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Loader & Error ────────────────────────────────────────────
function Loader() {
  return (
    <>
      <style>{STYLES}</style>
      <div className="page-wrap centered">
        <div className="logo-badge mb-4">
          <span className="logo-icon">✦</span>
          <span className="logo-text">Awoundjô</span>
        </div>
        <div className="spinner-lg" />
        <p className="muted mt-3">Chargement de votre espace…</p>
      </div>
    </>
  );
}

function ErrorScreen({ message }) {
  return (
    <>
      <style>{STYLES}</style>
      <div className="page-wrap centered">
        <div className="error-screen">
          <p className="error-icon">⚠️</p>
          <p className="error-title">Lien invalide ou expiré</p>
          <p className="error-body">{message}</p>
          <p className="muted">Contactez votre agent Awoundjô pour obtenir un nouveau lien.</p>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green:       #00875A;
    --green-light: #E6F6F0;
    --green-dark:  #006644;
    --gold:        #D4A017;
    --gold-light:  #FDF6E3;
    --red-light:   #FFF0F0;
    --red:         #C0392B;
    --text:        #1A1A2E;
    --muted:       #6B7280;
    --border:      #E5E7EB;
    --bg:          #F4F7F5;
    --card-bg:     #FFFFFF;
    --radius:      14px;
    --radius-sm:   8px;
    --shadow:      0 4px 24px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04);
  }

  body { background: var(--bg); }

  .page-wrap {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px 40px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    background:
      radial-gradient(ellipse 80% 40% at 50% 0%, #d4f0e5 0%, transparent 70%),
      var(--bg);
  }

  .page-wrap.centered {
    justify-content: center;
    text-align: center;
    gap: 16px;
  }

  /* ── Header ── */
  .page-header {
    text-align: center;
    margin-bottom: 20px;
  }
  .logo-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--green);
    color: #fff;
    padding: 6px 14px 6px 10px;
    border-radius: 999px;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 17px;
    letter-spacing: -.3px;
    box-shadow: 0 2px 12px rgba(0,135,90,.25);
  }
  .logo-icon { font-size: 18px; }
  .logo-text {}
  .header-sub {
    margin-top: 6px;
    color: var(--muted);
    font-size: 13px;
  }

  /* ── Card wrapper ── */
  .card-wrap {
    width: 100%;
    max-width: 440px;
    background: var(--card-bg);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Client card ── */
  .client-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(135deg, #f8fffe 0%, #f0faf5 100%);
  }
  .client-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--green);
    color: #fff;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,135,90,.3);
  }
  .client-info { flex: 1; min-width: 0; }
  .client-name {
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .client-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .client-agent { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .badge-complete {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--green-light);
    color: var(--green-dark);
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }

  /* ── Progression ── */
  .progress-section {
    padding: 20px;
    border-bottom: 1px solid var(--border);
  }
  .progress-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 4px;
  }
  .progress-title {
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .4px;
  }
  .progress-amounts { font-size: 14px; }
  .progress-amounts strong { font-family: 'Sora', sans-serif; color: var(--green-dark); }
  .muted { color: var(--muted); }

  .progress-track {
    position: relative;
    background: var(--border);
    border-radius: 999px;
    height: 12px;
    overflow: visible;
  }
  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--green) 0%, #00c483 100%);
    transition: width .6s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 0 8px rgba(0,196,131,.4);
  }
  .progress-label {
    position: absolute;
    right: 0; top: -20px;
    font-size: 11px;
    font-weight: 700;
    color: var(--green-dark);
    font-family: 'Sora', sans-serif;
  }
  .reste-text {
    margin-top: 10px;
    font-size: 13px;
    color: var(--muted);
  }
  .reste-text strong { color: var(--text); }

  /* ── Feedback ── */
  .feedback {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    margin: 0 20px;
  }
  .feedback-ok  { background: var(--green-light); color: var(--green-dark); }
  .feedback-err { background: var(--red-light);   color: var(--red);        }

  /* ── Steps ── */
  .step-section {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .step-title {
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 15px;
  }
  .step-subtitle {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.5;
  }

  /* ── Boutons ── */
  .btn-primary {
    width: 100%;
    padding: 14px;
    background: var(--green);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background .2s, transform .1s;
    box-shadow: 0 2px 12px rgba(0,135,90,.25);
  }
  .btn-primary:hover:not(:disabled) { background: var(--green-dark); }
  .btn-primary:active:not(:disabled) { transform: scale(.98); }
  .btn-primary:disabled { opacity: .55; cursor: not-allowed; }

  .btn-secondary {
    width: 100%;
    padding: 12px;
    background: transparent;
    color: var(--green);
    border: 1.5px solid var(--green);
    border-radius: var(--radius-sm);
    font-family: 'Sora', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background .2s;
  }
  .btn-secondary:hover { background: var(--green-light); }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--muted);
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    font-family: 'DM Sans', sans-serif;
    align-self: flex-start;
  }
  .btn-back:hover { color: var(--text); }

  .btn-copy {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: #fff;
    color: var(--text);
    font-size: 12px;
    cursor: pointer;
    transition: background .15s;
  }
  .btn-copy:hover { background: var(--green-light); }

  /* ── Méthodes ── */
  .methodes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .methode-card {
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card-bg);
    padding: 12px 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: border-color .15s, background .15s, transform .1s;
    font-family: 'DM Sans', sans-serif;
  }
  .methode-card:hover { border-color: var(--m-color, var(--green)); background: var(--m-bg, var(--green-light)); }
  .methode-card.selected {
    border-color: var(--m-color, var(--green));
    background: var(--m-bg, var(--green-light));
    transform: scale(1.02);
  }
  .methode-icon { font-size: 22px; color: var(--m-color, var(--green)); }
  .methode-label { font-size: 12px; font-weight: 600; color: var(--text); text-align: center; }

  /* ── Montant input ── */
  .montant-row { display: flex; flex-direction: column; gap: 4px; }
  .input-label {
    font-size: 13px;
    font-weight: 500;
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--text);
  }
  .input-hint { font-size: 11px; color: var(--muted); font-weight: 400; }
  .input-field {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: var(--text);
    background: #fff;
    outline: none;
    transition: border-color .15s;
  }
  .input-field:focus { border-color: var(--green); }
  .input-field.mt-2 { margin-top: 8px; }

  /* ── Wave box ── */
  .wave-box {
    background: #EBF7FF;
    border: 1.5px solid #BDE4FF;
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }
  .wave-amount {
    font-family: 'Sora', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #0094F0;
  }
  .wave-desc { font-size: 13px; color: var(--muted); }
  .wave-number-row {
    display: flex; align-items: center; gap: 8px;
    background: #fff; padding: 8px 14px; border-radius: var(--radius-sm);
    border: 1px solid #BDE4FF;
  }
  .wave-number {
    font-family: 'Sora', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: #0094F0;
    letter-spacing: 1px;
  }
  .wave-instructions {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
    text-align: center;
  }
  .btn-wave-open {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #0094F0;
    color: #fff;
    padding: 10px 18px;
    border-radius: var(--radius-sm);
    font-family: 'Sora', sans-serif;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    margin-top: 4px;
    transition: background .2s;
  }
  .btn-wave-open:hover { background: #007ACC; }

  /* ── Succès ── */
  .success-section {
    align-items: center;
    text-align: center;
    padding: 28px 20px;
  }
  .success-icon {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--green-light);
    color: var(--green);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    margin-bottom: 4px;
  }
  .star-burst { display: flex; gap: 2px; color: var(--gold); }
  .success-title {
    font-family: 'Sora', sans-serif;
    font-size: 18px;
    font-weight: 700;
  }
  .success-body { font-size: 14px; color: var(--muted); line-height: 1.5; }

  /* ── Complete banner ── */
  .complete-banner {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 16px 20px;
    background: var(--green-light);
    color: var(--green-dark);
    border-top: 1px solid #b3e8d4;
  }
  .complete-banner strong { font-family: 'Sora', sans-serif; font-size: 14px; }
  .complete-banner p { font-size: 13px; margin-top: 2px; }

  /* ── Historique ── */
  .historique {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .historique-toggle {
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    font-family: 'DM Sans', sans-serif;
  }
  .historique-toggle:hover { color: var(--text); }
  .historique-list {
    list-style: none;
    border-top: 1px solid var(--border);
  }
  .historique-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    flex-wrap: wrap;
  }
  .historique-item:last-child { border-bottom: none; }
  .h-amount { font-weight: 700; color: var(--green-dark); flex: 1; }
  .h-method {
    background: var(--green-light);
    color: var(--green-dark);
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
  }
  .h-date { color: var(--muted); }
  .h-ref { color: var(--muted); font-family: monospace; font-size: 11px; }

  /* ── Footer ── */
  .page-footer {
    margin-top: 20px;
    font-size: 12px;
    color: var(--muted);
    text-align: center;
  }

  /* ── Spinners ── */
  .spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  .spinner-lg {
    display: block;
    width: 40px; height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--green);
    border-radius: 50%;
    animation: spin .8s linear infinite;
    margin: 0 auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Error screen ── */
  .error-screen {
    max-width: 340px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .error-icon { font-size: 40px; }
  .error-title {
    font-family: 'Sora', sans-serif;
    font-size: 17px;
    font-weight: 700;
  }
  .error-body { font-size: 14px; color: var(--red); }

  .mb-4 { margin-bottom: 16px; }
  .mt-3 { margin-top: 12px; }

  @media (max-width: 480px) {
    .page-wrap { padding: 16px 12px 32px; }
    .methodes-grid { grid-template-columns: 1fr 1fr; }
    .progress-amounts { font-size: 13px; }
  }
`;
