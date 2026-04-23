// src/pages/shared/CommissionWithdrawal.jsx
// ══════════════════════════════════════════════════════════════
//  Page : Demande de paiement de commissions
//  Compatible : réseau DIASPORA · REFERRAL · BUSINESS · AFFILIE
//
//  Règle : 25 adhésions validées depuis la dernière demande approuvée
//
//  Intégration dans App.jsx :
//    const CommissionWithdrawal = lazy(() => import("./pages/shared/CommissionWithdrawal"));
//    // Diaspora
//    <Route path="withdrawal" element={<CommissionWithdrawal accentColor="#1B4FD8" />} />
//    // Referral
//    <Route path="withdrawal" element={<CommissionWithdrawal accentColor="#7C3AED" />} />
//    // Business
//    <Route path="/business/withdrawal" element={<CommissionWithdrawal accentColor="#0D9488" />} />
//
//  Routes backend attendues (montées via commissionRequestRoutes.js) :
//    GET  /api/commissions/requests/eligibility
//    GET  /api/commissions/requests/me
//    POST /api/commissions/requests
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Palette de base ───────────────────────────────────────────
const BASE_C = {
  green:   "#059669", greenL: "#ECFDF5",
  gold:    "#D97706", goldL:  "#FFFBEB",
  red:     "#DC2626", redL:   "#FEF2F2",
  slate:   "#64748B", dark:   "#0F172A",
  border:  "#E2E8F0", bg:     "#F8FAFC",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Helper : token selon réseau ───────────────────────────────
function getToken() {
  return (
    localStorage.getItem("diaspora_token") ||
    localStorage.getItem("business_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

const THRESHOLD = 25;

// ── Composants UI internes ────────────────────────────────────
function Spinner({ color }) {
  return (
    <>
      <style>{`@keyframes cw-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        border: `3px solid ${color}22`,
        borderTop: `3px solid ${color}`,
        animation: "cw-spin 0.8s linear infinite",
        margin: "60px auto",
      }} />
    </>
  );
}

function Alert({ type = "error", children }) {
  const map = {
    error:   { bg: BASE_C.redL,   border: "#DC262644", color: BASE_C.red,   icon: "⚠️" },
    success: { bg: BASE_C.greenL, border: "#05966944", color: BASE_C.green, icon: "✅" },
    info:    { bg: "#EFF6FF",     border: "#1B4FD833", color: "#1B4FD8",    icon: "ℹ️" },
    warning: { bg: BASE_C.goldL,  border: "#D9770644", color: BASE_C.gold,  icon: "⚠️" },
  };
  const s = map[type] || map.error;
  return (
    <div style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
      <span style={{ fontSize: 13, color: s.color, fontWeight: 600, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BASE_C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

// ── Barre de progression adhésions ───────────────────────────
function ProgressBar({ count, threshold = THRESHOLD, color }) {
  const pct = Math.min(100, Math.round((count / threshold) * 100));
  const done = count >= threshold;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: BASE_C.dark }}>
          {done ? "✅ Seuil atteint" : "Progression vers le seuil"}
        </span>
        <span style={{ fontSize: 20, fontWeight: 900, color: done ? BASE_C.green : color }}>
          {count} <span style={{ fontSize: 13, color: BASE_C.slate }}>/ {threshold}</span>
        </span>
      </div>
      <div style={{ background: BASE_C.bg, borderRadius: 99, height: 12, overflow: "hidden", border: `1px solid ${BASE_C.border}` }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 99,
          background: done
            ? `linear-gradient(90deg, ${BASE_C.green}, #10b981)`
            : `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: "width 0.6s ease",
          minWidth: count > 0 ? 8 : 0,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 11, color: BASE_C.slate }}>
          {done ? `Vous pouvez soumettre une demande` : `Encore ${threshold - count} adhésion(s) requise(s)`}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: done ? BASE_C.green : BASE_C.slate }}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Badge statut demande ──────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PENDING:   { label: "En attente",  bg: BASE_C.goldL,  color: BASE_C.gold,  icon: "⏳" },
    VALIDATED: { label: "Validée",     bg: "#EFF6FF",     color: "#1B4FD8",    icon: "✅" },
    PAID:      { label: "Payée",       bg: BASE_C.greenL, color: BASE_C.green, icon: "💸" },
    REJECTED:  { label: "Rejetée",     bg: BASE_C.redL,   color: BASE_C.red,   icon: "❌" },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Formulaire de demande ─────────────────────────────────────
function WithdrawalForm({ eligibility, color, onSuccess }) {
  const [method, setMethod]   = useState("mobile_money");
  const [details, setDetails] = useState({ phone: "", operator: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const METHODS = [
    { id: "mobile_money", label: "📱 Mobile Money", sub: "MTN · Orange · Moov · Wave" },
    { id: "virement",     label: "🏦 Virement bancaire", sub: "IBAN / RIB" },
    { id: "cash",         label: "💵 Espèces (agence)", sub: "Retrait en agence Awoundjô" },
  ];

  const OPERATORS = ["MTN MoMo", "Orange Money", "Moov Money", "Wave"];

  async function submit() {
    if (method === "mobile_money" && !details.phone.trim())
      return setError("Le numéro de téléphone est requis");
    if (method === "virement" && !details.name.trim())
      return setError("Le nom du titulaire du compte est requis");

    setLoading(true); setError("");
    try {
      await apiFetch("/api/commissions/requests", {
        method: "POST",
        body: JSON.stringify({ payment_method: method, payment_details: details }),
      });
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={{ marginBottom: 24 }}>
      <p style={{ margin: "0 0 18px", fontWeight: 800, fontSize: 15, color: BASE_C.dark }}>
        💸 Soumettre une demande de paiement
      </p>

      {/* Récap montant */}
      <div style={{ background: BASE_C.bg, borderRadius: 12, padding: "14px 16px", marginBottom: 18, border: `1px solid ${BASE_C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: BASE_C.slate, fontWeight: 700 }}>SOLDE DISPONIBLE</p>
            <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: BASE_C.green }}>
              {fmt(eligibility.available_balance_xof)} <span style={{ fontSize: 14 }}>FCFA</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 12, color: BASE_C.slate }}>Adhésions comptées</p>
            <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color }}>
              {eligibility.adhesions_since_last}
            </p>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Choix méthode */}
      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: BASE_C.slate, textTransform: "uppercase", letterSpacing: 0.8 }}>
        Mode de paiement souhaité
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
        {METHODS.map(m => (
          <button key={m.id} onClick={() => { setMethod(m.id); setDetails({ phone:"", operator:"", name:"" }); }}
            style={{
              padding: "10px 8px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              background: method === m.id ? `${color}11` : "#fff",
              border: `2px solid ${method === m.id ? color : BASE_C.border}`,
              fontFamily: "inherit", transition: "all .15s",
            }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: method === m.id ? color : BASE_C.dark }}>{m.label}</p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: BASE_C.slate }}>{m.sub}</p>
          </button>
        ))}
      </div>

      {/* Détails selon méthode */}
      {method === "mobile_money" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: BASE_C.dark, marginBottom: 5 }}>
              Numéro de téléphone *
            </label>
            <input
              type="tel" placeholder="+225 07 00 00 00 00"
              value={details.phone}
              onChange={e => setDetails(p => ({ ...p, phone: e.target.value }))}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 8, fontSize: 13, border: `1.5px solid ${BASE_C.border}`, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: BASE_C.dark, marginBottom: 5 }}>
              Opérateur
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {OPERATORS.map(op => (
                <button key={op} onClick={() => setDetails(p => ({ ...p, operator: op }))}
                  style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: details.operator === op ? `${color}11` : BASE_C.bg,
                    border: `1.5px solid ${details.operator === op ? color : BASE_C.border}`,
                    color: details.operator === op ? color : BASE_C.dark,
                    fontFamily: "inherit",
                  }}>
                  {op}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: BASE_C.dark, marginBottom: 5 }}>
              Nom du titulaire du compte
            </label>
            <input
              type="text" placeholder="Jean Kouassi"
              value={details.name}
              onChange={e => setDetails(p => ({ ...p, name: e.target.value }))}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 8, fontSize: 13, border: `1.5px solid ${BASE_C.border}`, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
      )}

      {method === "virement" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          {[
            { key: "name",  label: "Nom du titulaire *", placeholder: "Jean Kouassi" },
            { key: "iban",  label: "IBAN / RIB",          placeholder: "CI00 0000 0000 0000 0000 000" },
            { key: "bank",  label: "Banque",               placeholder: "Ecobank, SGBCI…" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: BASE_C.dark, marginBottom: 5 }}>{f.label}</label>
              <input
                type="text" placeholder={f.placeholder}
                value={details[f.key] || ""}
                onChange={e => setDetails(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 13px", borderRadius: 8, fontSize: 13, border: `1.5px solid ${BASE_C.border}`, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
      )}

      {method === "cash" && (
        <Alert type="info">
          Un agent Awoundjô vous contactera pour fixer un rendez-vous de retrait en agence. Aucune information supplémentaire requise.
        </Alert>
      )}

      {/* Note */}
      <Alert type="info">
        Votre demande sera examinée par l'administration sous <strong>48h ouvrées</strong>. Vous recevrez une notification dès validation.
      </Alert>

      <button onClick={submit} disabled={loading}
        style={{
          width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
          background: loading ? "#94a3b8" : `linear-gradient(135deg, ${color}, ${color}cc)`,
          color: "#fff", fontWeight: 900, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: loading ? "none" : `0 4px 16px ${color}44`,
          fontFamily: "inherit",
        }}>
        {loading ? (
          <>
            <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "cw-spin .7s linear infinite" }} />
            Envoi en cours…
          </>
        ) : <>💸 Soumettre la demande de {fmt(eligibility.available_balance_xof)} FCFA</>}
      </button>
    </Card>
  );
}

// ── Historique des demandes ───────────────────────────────────
function RequestHistory({ requests, color }) {
  if (!requests.length) {
    return (
      <Card>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: BASE_C.dark, marginBottom: 16 }}>📋 Historique des demandes</p>
        <div style={{ textAlign: "center", padding: "32px 0", color: BASE_C.slate }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>💤</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Aucune demande pour l'instant</p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>Vos demandes de paiement apparaîtront ici</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 15, color: BASE_C.dark }}>
        📋 Historique des demandes
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {requests.map(r => {
          const details = typeof r.payment_details === "string"
            ? JSON.parse(r.payment_details || "{}")
            : (r.payment_details || {});

          return (
            <div key={r.id} style={{
              background: BASE_C.bg, borderRadius: 12, padding: "14px 16px",
              border: r.status === "PENDING" ? `1.5px solid ${color}33` : `1px solid ${BASE_C.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: BASE_C.green }}>
                    {fmt(r.amount_requested)} FCFA
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: BASE_C.slate }}>
                    Demande #{r.id} · {fmtDate(r.created_at)}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: BASE_C.slate }}>
                    {r.adhesions_since_last} adhésion(s) comptabilisée(s) ·{" "}
                    <span style={{ fontWeight: 700 }}>
                      {r.payment_method === "mobile_money" ? "📱 Mobile Money" : r.payment_method === "virement" ? "🏦 Virement" : "💵 Espèces"}
                    </span>
                  </p>
                  {details.phone && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: BASE_C.slate }}>
                      {details.operator && `${details.operator} · `}{details.phone}
                    </p>
                  )}
                </div>
                <StatusBadge status={r.status} />
              </div>

              {/* Dates secondaires */}
              <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                {r.validated_at && (
                  <span style={{ fontSize: 11, color: "#1B4FD8", fontWeight: 700 }}>
                    ✅ Validée le {fmtDate(r.validated_at)}
                  </span>
                )}
                {r.paid_at && (
                  <span style={{ fontSize: 11, color: BASE_C.green, fontWeight: 700 }}>
                    💸 Payée le {fmtDate(r.paid_at)}
                  </span>
                )}
              </div>

              {/* Note admin en cas de rejet */}
              {r.status === "REJECTED" && r.admin_note && (
                <div style={{ marginTop: 10, background: BASE_C.redL, borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ margin: 0, fontSize: 12, color: BASE_C.red, fontWeight: 600 }}>
                    ❌ Motif : {r.admin_note}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE : CommissionWithdrawal
//
//  Props :
//    accentColor  — couleur du réseau (bleu diaspora, violet referral…)
//    backPath     — route de retour (défaut: -1 navigate)
// ══════════════════════════════════════════════════════════════
export default function CommissionWithdrawal({ accentColor = "#1B4FD8", backPath }) {
  const navigate = useNavigate();
  const color    = accentColor;

  const [eligibility, setEligibility] = useState(null);
  const [requests,    setRequests]    = useState([]);
  const [loadingElig, setLoadingElig] = useState(true);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [errElig,     setErrElig]     = useState("");
  const [submitted,   setSubmitted]   = useState(false);

  const loadEligibility = useCallback(async () => {
    setLoadingElig(true); setErrElig("");
    try {
      const data = await apiFetch("/api/commissions/requests/eligibility");
      setEligibility(data.data || data);
    } catch (e) {
      setErrElig(e.message);
    } finally {
      setLoadingElig(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingReqs(true);
    try {
      const data = await apiFetch("/api/commissions/requests/me");
      setRequests((data.data || data).requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingReqs(false);
    }
  }, []);

  useEffect(() => {
    loadEligibility();
    loadRequests();
  }, []);

  function handleSuccess() {
    setSubmitted(true);
    loadEligibility();
    loadRequests();
    setTimeout(() => setSubmitted(false), 6000);
  }

  const elig = eligibility;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 720, margin: "0 auto" }}>
      <style>{`@keyframes cw-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button onClick={() => backPath ? navigate(backPath) : navigate(-1)}
          style={{ background: BASE_C.bg, border: `1.5px solid ${BASE_C.border}`, borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          ←
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: BASE_C.dark }}>
            💸 Demande de paiement
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: BASE_C.slate }}>
            Retirez vos commissions accumulées
          </p>
        </div>
      </div>

      {/* ── Alerte succès ── */}
      {submitted && (
        <Alert type="success">
          Demande envoyée avec succès ! L'administration traitera votre demande sous 48h ouvrées. Vous serez notifié(e) dès validation.
        </Alert>
      )}

      {/* ── Bloc éligibilité ── */}
      {loadingElig ? (
        <Spinner color={color} />
      ) : errElig ? (
        <Alert type="error">{errElig} — <button onClick={loadEligibility} style={{ background: "none", border: "none", color: BASE_C.red, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Réessayer</button></Alert>
      ) : elig && (
        <>
          {/* Carte éligibilité */}
          <Card style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 15, color: BASE_C.dark }}>
              📊 Votre éligibilité
            </p>

            <ProgressBar count={elig.adhesions_since_last} threshold={THRESHOLD} color={color} />

            {/* Stats rapides */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 18 }}>
              {[
                { label: "Solde dispo.", value: `${fmt(elig.available_balance_xof)} F`, color: BASE_C.green },
                { label: "Adhésions",    value: `${elig.adhesions_since_last} / ${THRESHOLD}`, color },
                { label: "Manquantes",   value: elig.adhesions_missing > 0 ? elig.adhesions_missing : "✅", color: elig.adhesions_missing > 0 ? BASE_C.gold : BASE_C.green },
              ].map(s => (
                <div key={s.label} style={{ background: BASE_C.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 10, color: BASE_C.slate, fontWeight: 700 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Date de référence */}
            <p style={{ margin: "14px 0 0", fontSize: 11, color: BASE_C.slate }}>
              📅 Adhésions comptées depuis : <strong>{fmtDate(elig.reference_date)}</strong>
              {elig.pending_request && (
                <span style={{ marginLeft: 10, background: BASE_C.goldL, color: BASE_C.gold, padding: "1px 8px", borderRadius: 999, fontWeight: 700, fontSize: 10 }}>
                  ⏳ Demande en cours (#{elig.pending_request.id})
                </span>
              )}
            </p>
          </Card>

          {/* ── Bloc selon état ── */}
          {elig.pending_request ? (
            <Alert type="warning">
              Une demande (#{ elig.pending_request.id}) est déjà en cours de traitement depuis le {fmtDate(elig.pending_request.created_at)}.
              Vous ne pouvez pas en soumettre une nouvelle tant qu'elle n'est pas clôturée.
            </Alert>
          ) : !elig.eligible ? (
            <Card style={{ marginBottom: 20, border: `1.5px dashed ${BASE_C.border}` }}>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 40, margin: "0 0 10px" }}>🎯</p>
                <p style={{ margin: 0, fontWeight: 800, color: BASE_C.dark, fontSize: 16 }}>
                  Encore {elig.adhesions_missing} adhésion{elig.adhesions_missing > 1 ? "s" : ""} à atteindre
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: BASE_C.slate, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
                  Continuez à parrainer de nouveaux membres pour débloquer votre demande de paiement. Chaque adhésion validée compte !
                </p>
                {elig.available_balance_xof > 0 && (
                  <div style={{ marginTop: 16, background: BASE_C.bg, borderRadius: 10, padding: "10px 16px", display: "inline-block" }}>
                    <p style={{ margin: 0, fontSize: 12, color: BASE_C.slate }}>Solde en attente de déblocage</p>
                    <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: BASE_C.green }}>
                      {fmt(elig.available_balance_xof)} FCFA
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <WithdrawalForm eligibility={elig} color={color} onSuccess={handleSuccess} />
          )}
        </>
      )}

      {/* ── Historique ── */}
      {loadingReqs ? (
        <Spinner color={color} />
      ) : (
        <RequestHistory requests={requests} color={color} />
      )}

      {/* ── Aide ── */}
      <div style={{ marginTop: 20, padding: "14px 16px", background: BASE_C.bg, borderRadius: 12, border: `1px solid ${BASE_C.border}` }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 800, color: BASE_C.dark }}>❓ Comment ça marche ?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            `Atteignez ${THRESHOLD} adhésions validées depuis votre dernière demande`,
            "Soumettez votre demande avec vos coordonnées de paiement",
            "L'administration valide et effectue le virement sous 48h ouvrées",
            "Vous recevez une notification de confirmation de paiement",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: color, color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <p style={{ margin: 0, fontSize: 12, color: BASE_C.slate }}>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
