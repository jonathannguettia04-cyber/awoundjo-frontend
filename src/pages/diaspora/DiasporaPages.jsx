// src/pages/diaspora/DiasporaPages.jsx
// ─────────────────────────────────────────────────────────────
//  Toutes les pages du module Diaspora Awoundjô
//  Hiérarchie : AMBASSADEUR_DIASPORA → AMBASSADEUR_PAYS → RECRUTEUR → CLIENT
//  Paiement : JEKO uniquement
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdhesionForm from "../../components/AdhesionForm";
import {
  diasporaBeneAPI,
  diasporaPayAPI,
  diasporaCommAPI,
  diasporaRefAPI,
  diasporaNetAPI,
  diasporaLeaderAPI,
  diasporaNotifAPI,
  diasporaProfileAPI,
  diasporaDashAPI,
  diasporaClientAPI,
  getDiasporaData,
} from "../../diasporaApi";
import { usePlans, planIcon } from "../../hooks/usePlans";

const C = {
  blue:    "#1B4FD8", blueL:   "#EEF2FF",
  green:   "#059669", greenL:  "#ECFDF5",
  gold:    "#D97706", goldL:   "#FFFBEB",
  red:     "#DC2626", redL:    "#FEF2F2",
  purple:  "#7C3AED", purpleL: "#F5F3FF",
  teal:    "#0D9488", tealL:   "#F0FDFA",
  slate:   "#64748B", dark:    "#0F172A",
  border:  "#E2E8F0", bg:      "#F8FAFC",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ROLE_CONFIG = {
  AMBASSADEUR_DIASPORA: { label: "Ambassadeur Diaspora", icon: "🌍", color: C.blue,   bg: C.blueL  },
  AMBASSADEUR_PAYS:     { label: "Ambassadeur Pays",     icon: "🗺️", color: C.green,  bg: C.greenL },
  RECRUTEUR:            { label: "Recruteur",            icon: "🤝", color: C.gold,   bg: C.goldL  },
};

const REWARD_LEVELS = [
  { level: 1, min: 5,   label: "Bronze 🥉",  reward: "Bon d'achat 5 000 FCFA",  color: "#CD7F32" },
  { level: 2, min: 15,  label: "Argent 🥈",  reward: "Bon d'achat 20 000 FCFA", color: "#A8A9AD" },
  { level: 3, min: 30,  label: "Or 🥇",      reward: "Smartphone offert",       color: "#FFD700" },
  { level: 4, min: 60,  label: "Platine 💎", reward: "Voyage tous frais payés", color: "#7C3AED" },
  { level: 5, min: 100, label: "Diamant 🚀", reward: "Voiture + prime 500 000", color: "#0D9488" },
];

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Retourne true si le membre doit encore payer
const needsPayment = (a) => a.status !== "ACTIVE" || a.status_payment !== "paid";

// ── Shared UI ─────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = ROLE_CONFIG[role] || ROLE_CONFIG.RECRUTEUR;
  return (
    <span style={{ background: r.bg, color: r.color, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {r.icon} {r.label}
    </span>
  );
}

function StatusDot({ active }) {
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 6, background: active ? C.green : C.slate }} />;
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: 20, ...style }}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.dark }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", color: C.slate, fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.blueL}`, borderTop: `3px solid ${C.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: C.slate }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 15 }}>{title}</p>
      {desc && <p style={{ margin: "6px 0 0", fontSize: 13 }}>{desc}</p>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", style = {}, disabled = false }) {
  const styles = {
    primary: { background: C.blue,  color: "#fff", border: "none" },
    outline: { background: "#fff",  color: C.blue, border: `1.5px solid ${C.blue}` },
    ghost:   { background: "transparent", color: C.slate, border: "none" },
    danger:  { background: C.red,   color: "#fff", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 0.15s", fontFamily: "inherit", ...styles[variant], ...style }}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL CREDENTIALS — affiché après création d'un rôle
// Paiement via JEKO
// ─────────────────────────────────────────────────────────────
function CredentialsModal({ credentials, ambassadorId, targetLabel, adhesionFee, onClose }) {
  const [copied,     setCopied]     = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError,   setPayError]   = useState("");
  const [jekoMethod, setJekoMethod] = useState("orange");

  const text = `Identifiants ${targetLabel} Awoundjô\nNom d'utilisateur : ${credentials.username}\nMot de passe : ${credentials.temp_password}\nURL : ${BASE.replace("/api", "")}/diaspora/login`;
  const fee  = Number(adhesionFee) > 0 ? Number(adhesionFee) : 15000;

  async function handlePay() {
    setPayLoading(true);
    setPayError("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agent_token");
      const res = await fetch(`${BASE}/api/payments/jeko/init`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ambassador_id: ambassadorId,
          amount:        fee,
          type:          "adhesion",
          jeko_method:   jekoMethod,
          description:   `Adhésion Awoundjô — ${targetLabel}`,
          success_url:   `${window.location.origin}${window.location.pathname}?payment=success`,
          failure_url:   `${window.location.origin}${window.location.pathname}?payment=failed`,
        }),
      });
      const data = await res.json();
      const url  = data?.data?.redirect_url || data?.redirect_url;
      if (!url) throw new Error("URL de paiement non reçue du serveur");
      window.location.href = url;
    } catch (e) {
      setPayError(e.message || "Erreur lors de l'initialisation du paiement");
      setPayLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* En-tête */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.dark }}>{targetLabel} créé(e) !</h2>
          <p style={{ margin: "6px 0 0", color: C.slate, fontSize: 13 }}>Transmettez ces identifiants de connexion</p>
        </div>

        {/* Étapes */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {[
            { label: "Compte créé", done: true  },
            { label: "Paiement",    done: false, active: true },
            { label: "Validation",  done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: s.done ? C.greenL : s.active ? C.blueL : C.bg,
                color:      s.done ? C.green  : s.active ? C.blue  : C.slate,
                border:     `1.5px solid ${s.done ? C.green : s.active ? C.blue : C.border}`,
              }}>
                {s.done ? "✅ " : s.active ? "👉 " : ""}{s.label}
              </div>
              {i < 2 && <span style={{ color: C.border, fontSize: 14 }}>→</span>}
            </div>
          ))}
        </div>

        {/* Identifiants */}
        <div style={{ background: C.bg, borderRadius: 12, padding: "16px 18px", marginBottom: 14, border: `1px solid ${C.border}` }}>
          {[
            { label: "Nom d'utilisateur",      value: credentials.username      },
            { label: "Mot de passe temporaire", value: credentials.temp_password },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: .8 }}>{f.label}</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.dark, fontFamily: "monospace", background: "#fff", padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}` }}>{f.value}</p>
            </div>
          ))}
          <p style={{ margin: "4px 0 0", fontSize: 11, color: C.red }}>⚠️ Le mot de passe doit être changé à la première connexion</p>
        </div>

        {/* Partage */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ flex: 1, padding: "9px 0", background: C.blueL, color: C.blue, border: `1.5px solid ${C.blue}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {copied ? "✅ Copié !" : "📋 Copier les identifiants"}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
            style={{ flex: 1, padding: "9px 0", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            📲 WhatsApp
          </a>
        </div>

        {/* Paiement JEKO */}
        <div style={{ background: "#ECFDF5", border: `1.5px solid ${C.green}44`, borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: C.green }}>
            💳 Étape suivante — Paiement des frais d'adhésion
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: C.slate }}>
            Payez maintenant les frais d'adhésion de <strong>{fee.toLocaleString("fr-FR")} FCFA</strong> via JEKO pour activer le processus de validation.
          </p>
          {payError && (
            <div style={{ background: C.redL, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 12, color: C.red, fontWeight: 600 }}>⚠️ {payError}</p>
            </div>
          )}
          {/* Sélecteur réseau JEKO */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.slate, display: "block", marginBottom: 6 }}>Réseau de paiement</label>
            <select value={jekoMethod} onChange={(e) => setJekoMethod(e.target.value)} disabled={payLoading}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
              <option value="orange">🟠 Orange Money</option>
              <option value="wave">🔵 Wave</option>
              <option value="mtn">🟡 MTN Mobile Money</option>
              <option value="moov">🟢 Moov Money</option>
              <option value="djamo">💜 Djamo / Carte bancaire</option>
            </select>
          </div>
          <button onClick={handlePay} disabled={payLoading}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
              background: payLoading ? "#94a3b8" : `linear-gradient(135deg, ${C.green}, #047857)`,
              color: "#fff", fontWeight: 900, fontSize: 14,
              cursor: payLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: payLoading ? "none" : "0 4px 16px rgba(5,150,105,.35)",
              fontFamily: "inherit",
            }}>
            {payLoading ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                Redirection…
              </>
            ) : <>💳 Payer {fee.toLocaleString("fr-FR")} FCFA avec JEKO</>}
          </button>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: C.slate, textAlign: "center" }}>
            MTN · Orange · Moov · Wave · Carte bancaire · Paiement 100% sécurisé
          </p>
        </div>

        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", background: "#fff", color: C.slate, border: `1.5px solid ${C.border}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Fermer (paiement plus tard)
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL PAIEMENT — pour un membre existant
// Paiement via JEKO uniquement
// ─────────────────────────────────────────────────────────────
function PaymentModal({ member, roleLabel, onClose }) {
  const [payLoading, setPayLoading] = useState(false);
  const [payError,   setPayError]   = useState("");
  const [jekoMethod, setJekoMethod] = useState("orange");
  const fee = Number(member.membership_fee) > 0 ? Number(member.membership_fee) : 15000;

  async function handlePay() {
    setPayLoading(true);
    setPayError("");
    try {
      const token = localStorage.getItem("diaspora_token") || localStorage.getItem("token") || localStorage.getItem("agent_token");
      const res = await fetch(`${BASE}/api/payments/jeko/init`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ambassador_id: member.id,
          amount:        fee,
          type:          "adhesion",
          jeko_method:   jekoMethod,
          description:   `Adhésion Awoundjô — ${roleLabel} — ${member.name}`,
          success_url:   `${window.location.origin}${window.location.pathname}?payment=success`,
          failure_url:   `${window.location.origin}${window.location.pathname}?payment=failed`,
        }),
      });
      const data = await res.json();
      const url  = data?.data?.redirect_url || data?.redirect_url;
      if (!url) throw new Error("URL de paiement non reçue du serveur");
      window.location.href = url;
    } catch (e) {
      setPayError(e.message || "Erreur lors de l'initialisation du paiement");
      setPayLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>💳</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.dark }}>Payer l'adhésion</h2>
          <p style={{ margin: "6px 0 0", color: C.slate, fontSize: 13 }}>{member.name} · {roleLabel}</p>
        </div>

        {/* Récapitulatif */}
        <div style={{ background: C.bg, borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.slate }}>Membre</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{member.name}</span>
          </div>
          {member.plan && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.slate }}>Plan</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{member.plan}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>Frais d'adhésion</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: C.green }}>{fee.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        {payError && (
          <div style={{ background: C.redL, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: C.red, fontWeight: 600 }}>⚠️ {payError}</p>
          </div>
        )}

        {/* Sélecteur réseau JEKO */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.slate, display: "block", marginBottom: 6 }}>Réseau de paiement</label>
          <select value={jekoMethod} onChange={(e) => setJekoMethod(e.target.value)} disabled={payLoading}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
            <option value="orange">🟠 Orange Money</option>
            <option value="wave">🔵 Wave</option>
            <option value="mtn">🟡 MTN Mobile Money</option>
            <option value="moov">🟢 Moov Money</option>
            <option value="djamo">💜 Djamo / Carte bancaire</option>
          </select>
        </div>

        <button onClick={handlePay} disabled={payLoading}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
            background: payLoading ? "#94a3b8" : `linear-gradient(135deg, ${C.green}, #047857)`,
            color: "#fff", fontWeight: 900, fontSize: 15,
            cursor: payLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: payLoading ? "none" : "0 4px 16px rgba(5,150,105,.35)",
            fontFamily: "inherit", marginBottom: 10,
          }}>
          {payLoading ? (
            <>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
              Redirection vers JEKO…
            </>
          ) : <>💳 Payer {fee.toLocaleString("fr-FR")} FCFA avec JEKO</>}
        </button>
        <p style={{ margin: "0 0 12px", fontSize: 11, color: C.slate, textAlign: "center" }}>
          MTN · Orange · Moov · Wave · Carte bancaire · Paiement 100% sécurisé via JEKO
        </p>

        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", background: "#fff", color: C.slate, border: `1.5px solid ${C.border}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : ENREGISTRER AMBASSADEUR PAYS (AMBASSADEUR_DIASPORA uniquement)
// ─────────────────────────────────────────────────────────────
export function DiasporaRegisterPays() {
  const [list, setList]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [creds, setCreds]                   = useState(null);
  const [credsLabel, setCredsLabel]         = useState("");
  const [credsId, setCredsId]               = useState(null);
  const [credsAdhesionFee, setCredsAdhesionFee] = useState(0);
  const [payMember, setPayMember]           = useState(null);
  const [payFailed, setPayFailed]           = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "failed") {
      setPayFailed(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    diasporaBeneAPI.getAmbassadors({ role: "AMBASSADEUR_PAYS" })
      .then(r => setList(r.data.ambassadors || []))
      .finally(() => setLoading(false));
  }, []);

  function handleSuccess(credentials, label, id, fee) {
    setCreds(credentials);
    setCredsLabel(label);
    setCredsId(id || null);
    setCredsAdhesionFee(fee || 0);
    setShowForm(false);
    diasporaBeneAPI.getAmbassadors({ role: "AMBASSADEUR_PAYS" })
      .then(r => setList(r.data.ambassadors || []));
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      {creds && <CredentialsModal credentials={creds} ambassadorId={credsId} targetLabel={credsLabel} adhesionFee={credsAdhesionFee} onClose={() => { setCreds(null); setCredsId(null); }} />}
      {payMember && <PaymentModal member={payMember} roleLabel="Ambassadeur Pays" onClose={() => setPayMember(null)} />}

      {payFailed && (
        <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: C.redL, border: `1.5px solid ${C.red}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>❌</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: C.red, fontSize: 14 }}>Paiement annulé ou refusé</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.red }}>Le paiement JEKO n'a pas abouti. Veuillez réessayer ou contacter le support.</p>
          </div>
          <button onClick={() => setPayFailed(false)} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.red }}>✕</button>
        </div>
      )}

      <PageHeader
        title="🗺️ Mes Ambassadeurs Pays"
        subtitle={`${list.length} ambassadeur(s) enregistré(s)`}
        action={<Btn onClick={() => setShowForm(!showForm)}>{showForm ? "✕ Annuler" : "➕ Nouvel Ambassadeur Pays"}</Btn>}
      />

      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <AdhesionForm targetRole="AMBASSADEUR_PAYS" onSuccess={handleSuccess} />
        </div>
      )}

      {loading ? <Loader /> : list.length === 0 ? (
        <EmptyState icon="🗺️" title="Aucun Ambassadeur Pays" desc="Créez votre premier Ambassadeur Pays" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(a => (
            <Card key={a.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, cursor: "pointer", transition: "box-shadow .15s" }}
              onClick={() => needsPayment(a) && setPayMember(a)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.greenL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🗺️</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{a.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{a.email} • {a.country} • {fmtDate(a.created_at)}</p>
                  {a.plan && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenL, padding: "1px 8px", borderRadius: 999 }}>{a.plan}</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {needsPayment(a) && (
                  <button onClick={e => { e.stopPropagation(); setPayMember(a); }}
                    style={{ padding: "5px 12px", borderRadius: 8, background: `linear-gradient(135deg, ${C.green}, #047857)`, color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    💳 Payer
                  </button>
                )}
                <span style={{ background: !needsPayment(a) ? C.greenL : C.goldL, color: !needsPayment(a) ? C.green : C.gold, padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                  {!needsPayment(a) ? "✅ Actif" : "⏳ Paiement requis"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : ENREGISTRER RECRUTEUR (AMBASSADEUR_PAYS uniquement)
// ─────────────────────────────────────────────────────────────
export function DiasporaRegisterRecruiter() {
  const [list, setList]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [creds, setCreds]                   = useState(null);
  const [credsLabel, setCredsLabel]         = useState("");
  const [credsId, setCredsId]               = useState(null);
  const [credsAdhesionFee, setCredsAdhesionFee] = useState(0);
  const [payMember, setPayMember]           = useState(null);
  const [payFailed, setPayFailed]           = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "failed") {
      setPayFailed(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    diasporaBeneAPI.getAmbassadors({ role: "RECRUTEUR" })
      .then(r => setList(r.data.ambassadors || []))
      .finally(() => setLoading(false));
  }, []);

  function handleSuccess(credentials, label, id, fee) {
    setCreds(credentials);
    setCredsLabel(label);
    setCredsId(id || null);
    setCredsAdhesionFee(fee || 0);
    setShowForm(false);
    diasporaBeneAPI.getAmbassadors({ role: "RECRUTEUR" })
      .then(r => setList(r.data.ambassadors || []));
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      {creds && <CredentialsModal credentials={creds} ambassadorId={credsId} targetLabel={credsLabel} adhesionFee={credsAdhesionFee} onClose={() => { setCreds(null); setCredsId(null); }} />}
      {payMember && <PaymentModal member={payMember} roleLabel="Recruteur" onClose={() => setPayMember(null)} />}

      {payFailed && (
        <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: C.redL, border: `1.5px solid ${C.red}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>❌</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: C.red, fontSize: 14 }}>Paiement annulé ou refusé</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.red }}>Le paiement JEKO n'a pas abouti. Veuillez réessayer.</p>
          </div>
          <button onClick={() => setPayFailed(false)} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.red }}>✕</button>
        </div>
      )}

      <PageHeader
        title="🤝 Mes Recruteurs"
        subtitle={`${list.length} recruteur(s) enregistré(s)`}
        action={<Btn onClick={() => setShowForm(!showForm)}>{showForm ? "✕ Annuler" : "➕ Nouveau Recruteur"}</Btn>}
      />

      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <AdhesionForm targetRole="RECRUTEUR" onSuccess={handleSuccess} />
        </div>
      )}

      {loading ? <Loader /> : list.length === 0 ? (
        <EmptyState icon="🤝" title="Aucun Recruteur" desc="Créez votre premier Recruteur" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(a => (
            <Card key={a.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, cursor: "pointer", transition: "box-shadow .15s" }}
              onClick={() => needsPayment(a) && setPayMember(a)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.goldL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤝</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{a.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{a.email} • {a.country} • {fmtDate(a.created_at)}</p>
                  {a.plan && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: C.goldL, padding: "1px 8px", borderRadius: 999 }}>{a.plan}</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {needsPayment(a) && (
                  <button onClick={e => { e.stopPropagation(); setPayMember(a); }}
                    style={{ padding: "5px 12px", borderRadius: 8, background: `linear-gradient(135deg, ${C.green}, #047857)`, color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    💳 Payer
                  </button>
                )}
                <span style={{ background: !needsPayment(a) ? C.greenL : C.goldL, color: !needsPayment(a) ? C.green : C.gold, padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                  {!needsPayment(a) ? "✅ Actif" : "⏳ Paiement requis"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : ENREGISTRER UN RUM (AMBASSADEUR_DIASPORA uniquement)
// ─────────────────────────────────────────────────────────────
export function DiasporaRegisterRUM() {
  const [list, setList]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [creds, setCreds]                   = useState(null);
  const [credsLabel, setCredsLabel]         = useState("");
  const [credsId, setCredsId]               = useState(null);
  const [credsAdhesionFee, setCredsAdhesionFee] = useState(0);
  const [payMember, setPayMember]           = useState(null);
  const [payFailed, setPayFailed]           = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "failed") {
      setPayFailed(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    diasporaBeneAPI.getAmbassadors({ role: "RUM" })
      .then(r => setList(r.data.ambassadors || []))
      .finally(() => setLoading(false));
  }, []);

  function handleSuccess(credentials, label, id, fee) {
    setCreds(credentials);
    setCredsLabel(label);
    setCredsId(id || null);
    setCredsAdhesionFee(fee || 0);
    setShowForm(false);
    diasporaBeneAPI.getAmbassadors({ role: "RUM" })
      .then(r => setList(r.data.ambassadors || []));
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      {creds && <CredentialsModal credentials={creds} ambassadorId={credsId} targetLabel={credsLabel} adhesionFee={credsAdhesionFee} onClose={() => { setCreds(null); setCredsId(null); }} />}
      {payMember && <PaymentModal member={payMember} roleLabel="RUM" onClose={() => setPayMember(null)} />}

      {payFailed && (
        <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: C.redL, border: `1.5px solid ${C.red}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>❌</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: C.red, fontSize: 14 }}>Paiement annulé ou refusé</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.red }}>Le paiement JEKO n'a pas abouti. Veuillez réessayer.</p>
          </div>
          <button onClick={() => setPayFailed(false)} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.red }}>✕</button>
        </div>
      )}

      <PageHeader
        title="👑 Mes RUM"
        subtitle={`${list.length} RUM enregistré(s) — Réseau Parrainage`}
        action={<Btn onClick={() => setShowForm(!showForm)}>{showForm ? "✕ Annuler" : "➕ Nouveau RUM"}</Btn>}
      />

      {!showForm && (
        <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20 }}>👑</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#7C3AED" }}>Qu'est-ce qu'un RUM ?</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.slate }}>
              Le RUM (Responsable Unifié de Mission) est le sommet du <strong>Réseau Parrainage</strong>.
              Il recrute des Leaders, qui recrutent des Pasteurs, etc.
              Son dashboard sera accessible sur <strong>/referral/dashboard</strong>.
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <AdhesionForm targetRole="RUM" onSuccess={handleSuccess} />
        </div>
      )}

      {loading ? <Loader /> : list.length === 0 ? (
        <EmptyState icon="👑" title="Aucun RUM enregistré" desc="Créez votre premier RUM pour lancer le réseau Parrainage" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map(a => (
            <Card key={a.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, cursor: "pointer", transition: "box-shadow .15s" }}
              onClick={() => needsPayment(a) && setPayMember(a)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👑</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, color: C.dark }}>{a.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{a.email} • {a.country} • {fmtDate(a.created_at)}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    {a.plan && <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "1px 8px", borderRadius: 999 }}>{a.plan}</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.slate, background: C.bg, padding: "1px 8px", borderRadius: 999 }}>Réseau Parrainage</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {needsPayment(a) && (
                    <button onClick={e => { e.stopPropagation(); setPayMember(a); }}
                      style={{ padding: "5px 12px", borderRadius: 8, background: `linear-gradient(135deg, ${C.green}, #047857)`, color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      💳 Payer
                    </button>
                  )}
                  <span style={{ background: !needsPayment(a) ? C.greenL : C.goldL, color: !needsPayment(a) ? C.green : C.gold, padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                    {!needsPayment(a) ? "✅ Actif" : "⏳ Paiement requis"}
                  </span>
                </div>
                {a.username && <span style={{ fontSize: 10, color: C.slate, fontFamily: "monospace" }}>@{a.username}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : ENREGISTRER CLIENT (RECRUTEUR uniquement)
// ─────────────────────────────────────────────────────────────
export function DiasporaNewBeneficiary() {
  const navigate = useNavigate();
  const { plans, plansLoading } = usePlans();
  const [form, setForm]     = useState({ name: "", phone: "", city: "", plan: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (plans.length && !form.plan) {
      setForm(f => ({ ...f, plan: plans[0].slug.toUpperCase() }));
    }
  }, [plans]);

  async function submit() {
    if (!form.name) return setError("Le nom est requis");
    setLoading(true); setError("");
    try {
      const { data } = await diasporaBeneAPI.create(form);
      setSuccess({ ...data.beneficiary, temp_password: data.credentials?.temp_password });
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de la création");
    } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>⏳</div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: C.gold }}>Compte créé — en attente de validation</h2>
          <div style={{ background: C.goldL, border: `1.5px solid ${C.gold}44`, borderRadius: 12, padding: "16px 20px", margin: "20px 0" }}>
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: C.slate }}>Numéro mutualiste</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.dark, fontFamily: "monospace" }}>{success.mutual_number}</p>
            </div>
            {success.temp_password && (
              <div style={{ borderTop: "1px solid #eee", paddingTop: 10 }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: C.slate }}>Mot de passe temporaire</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.dark, fontFamily: "monospace" }}>{success.temp_password}</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: C.slate, marginBottom: 20 }}>
            Un administrateur doit valider ce compte avant que le client puisse effectuer son paiement d'adhésion.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => { const t = `Client Awoundjô\nNuméro mutualiste : ${success.mutual_number}\nMot de passe temporaire : ${success.temp_password}`; navigator.clipboard.writeText(t); }}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${C.gold}`, background: C.goldL, color: C.dark, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              📋 Copier
            </button>
            {success.temp_password && (
              <a href={`https://wa.me/?text=${encodeURIComponent(`Client Awoundjô\nNuméro mutualiste : ${success.mutual_number}\nMot de passe temporaire : ${success.temp_password}`)}`}
                target="_blank" rel="noreferrer"
                style={{ padding: "8px 14px", borderRadius: 8, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                📱 WhatsApp
              </a>
            )}
            <Btn onClick={() => setSuccess(null)}>➕ Nouveau client</Btn>
            <Btn variant="outline" onClick={() => navigate("/diaspora/clients")}>Voir mes clients</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <PageHeader title="👤 Enregistrer un client" subtitle="Génère automatiquement un numéro AWJ-YYYY-XXXX" />
      <Card>
        {error && <div style={{ background: C.redL, color: C.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "name",  label: "Nom complet *",      placeholder: "Jean Dupont",         type: "text" },
            { key: "phone", label: "Téléphone WhatsApp", placeholder: "+225 07 00 00 00 00", type: "tel"  },
            { key: "city",  label: "Ville",              placeholder: "Abidjan",             type: "text" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Offre choisie *</label>
            {plansLoading ? (
              <p style={{ fontSize: 12, color: C.slate }}>Chargement des formules…</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plans.map(p => {
                  const slug = p.slug.toUpperCase();
                  return (
                    <div key={slug} onClick={() => setForm(f => ({ ...f, plan: slug }))}
                      style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${form.plan === slug ? C.blue : C.border}`, background: form.plan === slug ? C.blueL : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all .15s" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: form.plan === slug ? C.blue : C.dark }}>{planIcon(slug)} {p.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: C.slate }}>{p.coverage_percent}% de couverture</p>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: form.plan === slug ? C.blue : C.slate }}>{fmt(p.monthly_price)} FCFA/mois</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Btn onClick={submit} disabled={loading}>
            {loading ? "Enregistrement…" : "✅ Enregistrer le client"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : MES CLIENTS / BÉNÉFICIAIRES (RECRUTEUR)
// ─────────────────────────────────────────────────────────────
export function DiasporaBeneficiaries() {
  const navigate = useNavigate();
  const [benes, setBenes]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diasporaBeneAPI.getAll().then(r => setBenes(r.data.beneficiaries || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        title="👤 Mes clients"
        subtitle={`${benes.length} client(s) enregistré(s)`}
        action={<Btn onClick={() => navigate("/diaspora/clients/new")}>➕ Nouveau client</Btn>}
      />
      {loading ? <Loader /> : benes.length === 0 ? (
        <EmptyState icon="👤" title="Aucun client" desc="Enregistrez votre premier client" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {benes.map(b => (
            <Card key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{b.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{b.phone} • {b.city}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, background: C.blueL, padding: "3px 10px", borderRadius: 999 }}>{b.plan}</span>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: C.blue }}>{b.mutual_number}</span>
                <span style={{ fontSize: 12 }}><StatusDot active={b.status === "active"} />{b.status === "active" ? "Actif" : "En attente"}</span>
                <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(b.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : CARTES VENDUES (RECRUTEUR)
// ─────────────────────────────────────────────────────────────
export function DiasporaCards() {
  const [benes, setBenes]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      diasporaBeneAPI.getAll(),
      diasporaDashAPI.getStats(),
    ]).then(([b, s]) => {
      setBenes(b.data.beneficiaries || []);
      setStats(s.data);
    }).finally(() => setLoading(false));
  }, []);

  const cardsSold    = stats?.cards_sold || benes.length;
  const currentLevel = REWARD_LEVELS.slice().reverse().find(l => cardsSold >= l.min) || null;

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        title="💳 Cartes vendues"
        subtitle={`${cardsSold} carte(s) au total`}
        action={<Btn onClick={() => navigate("/diaspora/clients/new")}>➕ Vendre une carte</Btn>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <Card style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 40, fontWeight: 900, color: C.blue }}>{cardsSold}</p>
          <p style={{ margin: 0, color: C.slate, fontSize: 13, fontWeight: 600 }}>Cartes vendues</p>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: currentLevel ? C.gold : C.slate }}>{currentLevel?.label || "Aucun niveau"}</p>
          <p style={{ margin: 0, color: C.slate, fontSize: 13, fontWeight: 600 }}>Niveau atteint</p>
          {currentLevel && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.gold }}>{currentLevel.reward}</p>}
        </Card>
      </div>
      <Card>
        <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark }}>📋 Clients (cartes vendues)</p>
        {benes.length === 0 ? (
          <EmptyState icon="💳" title="Aucune carte vendue" desc="Enregistrez des clients pour vendre des cartes" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {benes.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.bg, borderRadius: 8 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 13 }}>{b.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>{b.city} • {fmtDate(b.created_at)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: C.blue }}>{b.mutual_number}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.blue }}>{b.plan}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : RÉCOMPENSES 🏆
// ─────────────────────────────────────────────────────────────
export function DiasporaRewards() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diasporaDashAPI.getStats().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const cardsSold    = stats?.cards_sold || 0;
  const totalEarned  = stats?.commissions?.total_earned || 0;
  const currentLevel = REWARD_LEVELS.slice().reverse().find(l => cardsSold >= l.min) || null;
  const nextLevel    = REWARD_LEVELS.find(l => cardsSold < l.min) || null;
  const progressPct  = nextLevel
    ? Math.round(((cardsSold - (currentLevel?.min || 0)) / (nextLevel.min - (currentLevel?.min || 0))) * 100)
    : 100;

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 700, margin: "0 auto" }}>
      <PageHeader title="🏆 Mes récompenses" subtitle="Vendez des cartes pour débloquer des paliers" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <Card style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 36, fontWeight: 900, color: C.blue }}>{cardsSold}</p>
          <p style={{ margin: 0, fontSize: 13, color: C.slate, fontWeight: 600 }}>Cartes vendues</p>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 900, color: C.gold }}>{fmt(totalEarned)}</p>
          <p style={{ margin: 0, fontSize: 11, color: C.slate }}>FCFA</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.slate, fontWeight: 600 }}>Commissions totales</p>
        </Card>
      </div>
      <Card style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 16px", fontWeight: 800, color: C.dark, fontSize: 15 }}>🎖️ Niveau actuel</p>
        {currentLevel ? (
          <div style={{ background: C.blueL, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: C.blue }}>{currentLevel.label}</p>
            <p style={{ margin: 0, fontSize: 14, color: C.dark }}>Récompense : <strong>{currentLevel.reward}</strong></p>
          </div>
        ) : (
          <div style={{ background: C.bg, borderRadius: 12, padding: "16px 18px", marginBottom: 16, textAlign: "center" }}>
            <p style={{ margin: 0, color: C.slate, fontSize: 13 }}>Vendez {REWARD_LEVELS[0].min} cartes pour débloquer votre premier niveau !</p>
          </div>
        )}
        {nextLevel && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: C.slate }}>Vers <strong>{nextLevel.label}</strong></span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{cardsSold} / {nextLevel.min} cartes</span>
            </div>
            <div style={{ background: C.border, borderRadius: 99, height: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${C.blue}, #3B82F6)`, borderRadius: 99, transition: "width .5s" }} />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: C.slate }}>Encore {nextLevel.min - cardsSold} cartes → <strong>{nextLevel.reward}</strong></p>
          </div>
        )}
      </Card>
      <Card>
        <p style={{ margin: "0 0 16px", fontWeight: 800, color: C.dark, fontSize: 15 }}>📊 Tous les paliers</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {REWARD_LEVELS.map(l => {
            const unlocked = cardsSold >= l.min;
            return (
              <div key={l.level} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10, background: unlocked ? C.blueL : C.bg, border: `1.5px solid ${unlocked ? C.blue : C.border}` }}>
                <span style={{ fontSize: 28 }}>{unlocked ? "✅" : "🔒"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: unlocked ? C.blue : C.dark }}>{l.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{l.reward}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: unlocked ? C.blue : C.slate, background: unlocked ? `rgba(27,79,216,.1)` : C.border, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                  {l.min} cartes
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : PAIEMENTS
// ─────────────────────────────────────────────────────────────
export function DiasporaPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    diasporaPayAPI.getAll().then(r => setPayments(r.data.payments || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader title="💰 Paiements" subtitle={`${payments.length} paiement(s)`} />
      {loading ? <Loader /> : payments.length === 0 ? (
        <EmptyState icon="💰" title="Aucun paiement" desc="Les paiements apparaîtront ici" />
      ) : (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Date", "Bénéficiaire", "Offre", "Montant", "Statut"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: .8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px", color: C.slate }}>{fmtDate(p.created_at)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: C.dark }}>{p.beneficiary_name || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: C.blueL, color: C.blue, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{p.plan || "—"}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: C.green }}>{fmt(p.amount_xof || p.amount)} FCFA</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: p.status === "COMPLETED" ? C.greenL : C.goldL, color: p.status === "COMPLETED" ? C.green : C.gold, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {p.status === "COMPLETED" ? "Complété" : "En attente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export function DiasporaNewPayment() {
  const navigate = useNavigate();
  const [benes, setBenes]     = useState([]);
  const [form, setForm]       = useState({ beneficiary_id: "", amount: "", currency: "XOF", payment_type: "adhesion" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    diasporaBeneAPI.getAll().then(r => setBenes(r.data.beneficiaries || []));
  }, []);

  async function submit() {
    if (!form.beneficiary_id || !form.amount) return setError("Veuillez remplir tous les champs");
    setLoading(true); setError("");
    try {
      await diasporaPayAPI.initiate(form);
      navigate("/diaspora/payments");
    } catch (e) { setError(e.response?.data?.error || "Erreur lors du paiement"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <PageHeader title="💳 Nouveau paiement" />
      <Card>
        {error && <div style={{ background: C.redL, color: C.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Client *</label>
            <select value={form.beneficiary_id} onChange={e => setForm(p => ({ ...p, beneficiary_id: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box", background: "#fff" }}>
              <option value="">Sélectionner un client…</option>
              {benes.map(b => <option key={b.id} value={b.id}>{b.name} — {b.plan}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Montant (FCFA) *</label>
            <input type="number" min="1" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="Ex : 5000"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Type</label>
            <select value={form.payment_type} onChange={e => setForm(p => ({ ...p, payment_type: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box", background: "#fff" }}>
              <option value="adhesion">Adhésion</option>
              <option value="mensualite">Mensualité</option>
            </select>
          </div>
          <Btn onClick={submit} disabled={loading}>
            {loading ? "Traitement…" : "💳 Initier le paiement"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : GAINS / COMMISSIONS
// ─────────────────────────────────────────────────────────────
export function DiasporaEarnings() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const amb  = getDiasporaData();
  const role = amb?.role || "RECRUTEUR";

  useEffect(() => {
    diasporaCommAPI.getAll().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const totals = data?.totals || {};

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader title="📊 Mes gains" subtitle="Commissions générées par votre réseau" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total gagné", value: totals.total_earned, color: C.green  },
          { label: "En attente",  value: totals.pending,      color: C.gold   },
          { label: "Validé",      value: totals.validated,    color: C.blue   },
          { label: "Payé",        value: totals.paid,         color: C.purple },
          { label: "Ce mois",     value: totals.this_month,   color: C.teal   },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: s.color }}>{fmt(s.value)}</p>
            <p style={{ margin: 0, fontSize: 10, color: C.slate }}>FCFA</p>
            <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 600, color: C.dark }}>{s.label}</p>
          </Card>
        ))}
      </div>
      {role !== "RECRUTEUR" && data?.by_source?.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark }}>📈 Par source</p>
          {data.by_source.map(s => (
            <div key={s.source_role} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: C.bg, borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: C.dark }}><RoleBadge role={s.source_role} /></span>
              <span style={{ fontWeight: 700, color: C.blue }}>{fmt(s.total)} FCFA ({s.count})</span>
            </div>
          ))}
        </Card>
      )}
      <Card>
        <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark }}>📋 Détail des commissions</p>
        {!data?.commissions?.length ? (
          <EmptyState icon="💰" title="Aucune commission" desc="Vos commissions apparaîtront ici" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Date", "Client", "Type", "Taux", "Montant", "Statut"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: .8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.commissions.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px", color: C.slate }}>{fmtDate(c.created_at)}</td>
                    <td style={{ padding: "10px 12px", color: C.dark, fontWeight: 600 }}>{c.beneficiary_name || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: c.source === "direct" ? C.greenL : C.blueL, color: c.source === "direct" ? C.green : C.blue, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {c.source === "direct" ? "Direct" : "Réseau"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: C.slate }}>{c.rate_pct}%</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: C.green }}>{fmt(c.amount)} FCFA</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: c.status === "PAID" ? C.greenL : c.status === "VALIDATED" ? C.blueL : C.goldL, color: c.status === "PAID" ? C.green : c.status === "VALIDATED" ? C.blue : C.gold, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {c.status === "PAID" ? "Payé" : c.status === "VALIDATED" ? "Validé" : "En attente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : PARRAINAGE / LIEN
// ─────────────────────────────────────────────────────────────
export function DiasporaReferral() {
  const [link, setLink]           = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    Promise.all([diasporaRefAPI.getLink(), diasporaRefAPI.getReferrals()])
      .then(([l, r]) => { setLink(l.data); setReferrals(r.data.referrals || []); })
      .finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (link?.link) navigator.clipboard.writeText(link.link).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 700, margin: "0 auto" }}>
      <PageHeader title="🔗 Parrainage" subtitle={`${referrals.length} recruté(s) direct(s)`} />
      {link && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 800, color: C.dark }}>Mon lien ambassadeur</p>
          <div style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.blue, fontWeight: 600, wordBreak: "break-all", flex: 1 }}>{link.link}</span>
            <span style={{ background: C.blueL, color: C.blue, padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Code : {link.code}</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={copyLink}
              style={{ padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${C.blue}`, background: C.blueL, color: C.blue, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {copied ? "✅ Copié !" : "📋 Copier"}
            </button>
            {link.whatsapp_message && (
              <a href={link.whatsapp_message} target="_blank" rel="noreferrer"
                style={{ padding: "8px 18px", borderRadius: 8, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                📲 WhatsApp
              </a>
            )}
          </div>
        </Card>
      )}
      <Card>
        <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark }}>Mes recrutés directs</p>
        {referrals.length === 0 ? (
          <EmptyState icon="🤝" title="Aucun recruté" desc="Partagez votre lien pour recruter" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {referrals.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: C.bg, borderRadius: 8 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 13 }}>{r.referred_name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}><RoleBadge role={r.referred_role} /> • {fmtDate(r.joined_at)}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.referred_status === "ACTIVE" ? C.green : C.gold }}>
                  {r.referred_status === "ACTIVE" ? "✅ Actif" : "⏳ En attente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : RÉSEAU
// ─────────────────────────────────────────────────────────────
export function DiasporaNetwork() {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diasporaNetAPI.getNetwork().then(r => setNetwork(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const levels = network?.network || { level1: [], level2: [], level3: [] };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader title="🌐 Mon réseau" subtitle={`${network?.totals?.total || 0} membres au total`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Niveau 1", value: levels.level1?.length || 0, color: C.blue  },
          { label: "Niveau 2", value: levels.level2?.length || 0, color: C.green },
          { label: "Niveau 3", value: levels.level3?.length || 0, color: C.gold  },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: s.color }}>{fmt(s.value)}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.slate, fontWeight: 600 }}>{s.label}</p>
          </Card>
        ))}
      </div>
      {["level1", "level2", "level3"].map((lvl, i) => (
        levels[lvl]?.length > 0 && (
          <Card key={lvl} style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 800, color: C.dark }}>Niveau {i + 1} — {levels[lvl].length} membre(s)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {levels[lvl].map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: C.bg, borderRadius: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 13 }}>{m.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>{m.country} • <RoleBadge role={m.role} /></p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: m.status === "ACTIVE" ? C.green : C.gold }}>
                    {m.status === "ACTIVE" ? "● Actif" : "● En attente"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )
      ))}
      {network?.totals?.total === 0 && <EmptyState icon="🌐" title="Réseau vide" desc="Commencez à recruter pour construire votre réseau" />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
export function DiasporaNotifications() {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diasporaNotifAPI.getAll()
      .then(r => { setNotifs(r.data.notifications || []); diasporaNotifAPI.markRead().catch(() => {}); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "24px 20px", maxWidth: 700, margin: "0 auto" }}>
      <PageHeader title="🔔 Notifications" subtitle={`${notifs.length} notification(s)`} />
      {loading ? <Loader /> : notifs.length === 0 ? (
        <EmptyState icon="🔔" title="Aucune notification" desc="Vous êtes à jour !" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifs.map(n => (
            <Card key={n.id} style={{ display: "flex", gap: 14, opacity: n.read ? 0.7 : 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {n.type === "commission" ? "💰" : n.type === "welcome" ? "🎉" : "🔔"}
              </div>
              <div>
                <p style={{ margin: "0 0 3px", fontWeight: 700, color: C.dark, fontSize: 13 }}>{n.title || "Notification"}</p>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: C.slate }}>{n.message}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{fmtDate(n.created_at)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : CLASSEMENT
// ─────────────────────────────────────────────────────────────
export function DiasporaLeaderboard() {
  const [data, setData]       = useState(null);
  const [period, setPeriod]   = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    diasporaLeaderAPI.getLeaderboard(period).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [period]);

  return (
    <div style={{ padding: "24px 20px", maxWidth: 700, margin: "0 auto" }}>
      <PageHeader title="🏅 Classement" subtitle="Les meilleurs ambassadeurs Diaspora" />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ id: "week", label: "Cette semaine" }, { id: "month", label: "Ce mois" }, { id: "all", label: "Tout temps" }].map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: period === p.id ? C.blue : "#fff", color: period === p.id ? "#fff" : C.slate, border: `1.5px solid ${period === p.id ? C.blue : C.border}` }}>
            {p.label}
          </button>
        ))}
      </div>
      {loading ? <Loader /> : (
        <Card>
          <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark }}>🏆 Top gains</p>
          {data?.top_earners?.map((a, i) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: i === 0 ? C.goldL : C.bg, borderRadius: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20, width: 30, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, color: C.dark, fontSize: 13 }}>{a.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}><RoleBadge role={a.role} /> • {a.country}</p>
              </div>
              <span style={{ fontWeight: 800, color: C.gold }}>{fmt(a.earnings)} FCFA</span>
            </div>
          ))}
          {!data?.top_earners?.length && <EmptyState icon="🏅" title="Aucune donnée" desc="Le classement s'affichera bientôt" />}
          {data?.my_rank && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: C.blueL, borderRadius: 10, textAlign: "center" }}>
              <p style={{ margin: 0, fontWeight: 700, color: C.blue }}>Votre rang : #{data.my_rank}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : PROFIL
// ─────────────────────────────────────────────────────────────
export function DiasporaProfile() {
  const [form, setForm]       = useState({ name: "", country: "", city: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const amb  = getDiasporaData();
  const role = amb?.role || "RECRUTEUR";
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.RECRUTEUR;

  useEffect(() => {
    diasporaProfileAPI.getMe()
      .then(r => { const a = r.data.ambassador; setForm({ name: a.name || "", country: a.country || "", city: a.city || "", phone: a.phone || "" }); })
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault(); setSaving(true); setSaved(false);
    try { await diasporaProfileAPI.update(form); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch {}
    finally { setSaving(false); }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <PageHeader title="👤 Mon profil" />
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: rc.bg, borderRadius: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 32 }}>{rc.icon}</span>
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: C.dark }}>{form.name}</p>
            <RoleBadge role={role} />
          </div>
        </div>
        {saved && <div style={{ background: C.greenL, color: C.green, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>✅ Profil mis à jour !</div>}
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "name",    label: "Nom complet",  placeholder: "Jean Kouassi"           },
            { key: "phone",   label: "Téléphone",    placeholder: "+225 07 00 00 00 00"    },
            { key: "city",    label: "Ville",        placeholder: "Abidjan"                },
            { key: "country", label: "Pays",         placeholder: "Côte d'Ivoire"          },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <Btn disabled={saving}>{saving ? "Enregistrement…" : "💾 Sauvegarder"}</Btn>
        </form>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : CRÉER UN CLIENT FINAL — Tous niveaux Diaspora
// AMBASSADEUR_DIASPORA · AMBASSADEUR_PAYS · RECRUTEUR
// RUM · LEADER · PASTEUR · RESPONSABLE
// ─────────────────────────────────────────────────────────────
export function DiasporaNewClient() {
  const navigate = useNavigate();
  const { plans, plansLoading } = usePlans();

  const [form, setForm]       = useState({ name: "", phone: "", city: "", plan_slug: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(null);
  const [payMode, setPayMode] = useState(null); // null | 'cash' | 'jeko'
  const [jekoMethod, setJekoMethod] = useState("orange");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError]     = useState("");
  const [cashDone, setCashDone]     = useState(false);

  useEffect(() => {
    if (plans.length && !form.plan_slug) {
      setForm(f => ({ ...f, plan_slug: plans[0].slug.toUpperCase() }));
    }
  }, [plans]);

  async function submit() {
    if (!form.name || !form.phone || !form.plan_slug)
      return setError("Nom, téléphone et formule sont requis");
    setLoading(true); setError("");
    try {
      const { data } = await diasporaClientAPI.create(form);
      setSuccess(data);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de la création");
    } finally { setLoading(false); }
  }

  async function payCash() {
    setPayLoading(true); setPayError("");
    try {
      await diasporaClientAPI.payCash(success.client.id);
      setCashDone(true);
    } catch (e) {
      setPayError(e.response?.data?.error || "Erreur paiement cash");
    } finally { setPayLoading(false); }
  }

  async function payJeko() {
    setPayLoading(true); setPayError("");
    try {
      const { data } = await diasporaClientAPI.payJeko(success.client.id, { jeko_method: jekoMethod });
      const url = data?.data?.redirect_url || data?.redirect_url;
      if (!url) throw new Error("URL de paiement non reçue");
      window.location.href = url;
    } catch (e) {
      setPayError(e.response?.data?.error || e.message || "Erreur initiation JEKO");
      setPayLoading(false);
    }
  }

  // ── Succès création — affichage credentials + paiement ──
  if (success) {
    const client = success.client;
    const fee    = Number(success.adhesion_fee) > 0 ? Number(success.adhesion_fee) : 15000;
    const infoTxt = `Client Awoundjô\nNuméro mutualiste : ${success.mutual_number}\nCode d'accès : ${success.access_code}\nPortail : ${success.portal_url}`;

    if (cashDone) {
      return (
        <div style={{ padding: "24px 20px", maxWidth: 520, margin: "0 auto" }}>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: C.green }}>Adhésion enregistrée !</h2>
            <p style={{ color: C.slate, fontSize: 13, marginBottom: 20 }}>
              {client.name} est maintenant actif(ve). Commissions générées.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn onClick={() => { setSuccess(null); setCashDone(false); setForm({ name: "", phone: "", city: "", plan_slug: plans[0]?.slug?.toUpperCase() || "" }); }}>
                ➕ Nouveau client
              </Btn>
              <Btn variant="outline" onClick={() => navigate("/diaspora/my-clients")}>Voir mes clients</Btn>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div style={{ padding: "24px 20px", maxWidth: 520, margin: "0 auto" }}>
        <Card>
          {/* En-tête */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.dark }}>Client créé !</h2>
            <p style={{ margin: "4px 0 0", color: C.slate, fontSize: 13 }}>Transmettez ces informations au client</p>
          </div>

          {/* Identifiants */}
          <div style={{ background: C.bg, borderRadius: 12, padding: "16px 18px", marginBottom: 16, border: `1px solid ${C.border}` }}>
            {[
              { label: "Numéro mutualiste", value: success.mutual_number },
              { label: "Code d'accès",      value: success.access_code   },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 10 }}>
                <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: .8 }}>{f.label}</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.dark, fontFamily: "monospace", background: "#fff", padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}` }}>{f.value}</p>
              </div>
            ))}
            <p style={{ margin: "4px 0 0", fontSize: 11, color: C.red }}>⚠️ Le code d'accès doit être changé à la première connexion</p>
          </div>

          {/* Partage */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button onClick={() => { navigator.clipboard.writeText(infoTxt); }}
              style={{ flex: 1, padding: "9px 0", background: C.blueL, color: C.blue, border: `1.5px solid ${C.blue}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              📋 Copier
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(infoTxt)}`} target="_blank" rel="noreferrer"
              style={{ flex: 1, padding: "9px 0", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              📲 WhatsApp
            </a>
          </div>

          {/* Paiement adhésion */}
          {fee > 0 && (
            <div style={{ background: C.greenL, border: `1.5px solid ${C.green}44`, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: C.green }}>
                💳 Paiement de l'adhésion — {fee.toLocaleString("fr-FR")} FCFA
              </p>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: C.slate }}>
                Activez immédiatement le compte en enregistrant le paiement.
              </p>

              {payError && (
                <div style={{ background: C.redL, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.red, fontWeight: 600 }}>⚠️ {payError}</p>
                </div>
              )}

              {/* Choix du mode */}
              {!payMode && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setPayMode("cash")}
                    style={{ flex: 1, padding: "11px 0", borderRadius: 8, background: C.blue, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    💵 Paiement cash
                  </button>
                  <button onClick={() => setPayMode("jeko")}
                    style={{ flex: 1, padding: "11px 0", borderRadius: 8, background: `linear-gradient(135deg, ${C.green}, #047857)`, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    📱 Payer via JEKO
                  </button>
                </div>
              )}

              {/* Cash */}
              {payMode === "cash" && (
                <div>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: C.dark }}>
                    Confirmez la réception de <strong>{fee.toLocaleString("fr-FR")} FCFA</strong> en espèces.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPayMode(null)}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#fff", color: C.slate, border: `1.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      ← Retour
                    </button>
                    <button onClick={payCash} disabled={payLoading}
                      style={{ flex: 2, padding: "10px 0", borderRadius: 8, background: payLoading ? "#94a3b8" : C.blue, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: payLoading ? "not-allowed" : "pointer" }}>
                      {payLoading ? "Enregistrement…" : "✅ Confirmer paiement cash"}
                    </button>
                  </div>
                </div>
              )}

              {/* JEKO */}
              {payMode === "jeko" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.slate, display: "block", marginBottom: 6 }}>Réseau de paiement</label>
                  <select value={jekoMethod} onChange={e => setJekoMethod(e.target.value)} disabled={payLoading}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", background: "#fff", marginBottom: 10 }}>
                    <option value="orange">🟠 Orange Money</option>
                    <option value="wave">🔵 Wave</option>
                    <option value="mtn">🟡 MTN Mobile Money</option>
                    <option value="moov">🟢 Moov Money</option>
                    <option value="djamo">💜 Djamo / Carte bancaire</option>
                  </select>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPayMode(null)}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#fff", color: C.slate, border: `1.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      ← Retour
                    </button>
                    <button onClick={payJeko} disabled={payLoading}
                      style={{ flex: 2, padding: "10px 0", borderRadius: 8, background: payLoading ? "#94a3b8" : `linear-gradient(135deg, ${C.green}, #047857)`, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: payLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                      {payLoading
                        ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />Redirection…</>
                        : <>💳 Payer {fee.toLocaleString("fr-FR")} FCFA</>}
                    </button>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: C.slate, textAlign: "center" }}>
                    MTN · Orange · Moov · Wave · Carte bancaire · 100% sécurisé
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn onClick={() => { setSuccess(null); setPayMode(null); setForm({ name: "", phone: "", city: "", plan_slug: plans[0]?.slug?.toUpperCase() || "" }); }}>
              ➕ Nouveau client
            </Btn>
            <Btn variant="outline" onClick={() => navigate("/diaspora/my-clients")}>Voir mes clients</Btn>
          </div>
        </Card>
      </div>
    );
  }

  // ── Formulaire de création ──────────────────────────────────
  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <PageHeader
        title="👤 Créer un client final"
        subtitle="Génère automatiquement un numéro AWJ-YYYY-XXXX"
      />
      <Card>
        {error && (
          <div style={{ background: C.redL, color: C.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "name",  label: "Nom complet *",      placeholder: "Jean Dupont",         type: "text" },
            { key: "phone", label: "Téléphone WhatsApp *", placeholder: "+225 07 00 00 00 00", type: "tel"  },
            { key: "city",  label: "Ville",               placeholder: "Abidjan",             type: "text" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}

          {/* Sélection formule */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Offre choisie *</label>
            {plansLoading ? (
              <p style={{ fontSize: 12, color: C.slate }}>Chargement des formules…</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plans.map(p => {
                  const slug = p.slug.toUpperCase();
                  return (
                    <div key={slug} onClick={() => setForm(f => ({ ...f, plan_slug: slug }))}
                      style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${form.plan_slug === slug ? C.blue : C.border}`, background: form.plan_slug === slug ? C.blueL : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all .15s" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: form.plan_slug === slug ? C.blue : C.dark }}>{planIcon(slug)} {p.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: C.slate }}>Adhésion : {Number(p.adhesion_price).toLocaleString("fr-FR")} FCFA</p>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 13, color: form.plan_slug === slug ? C.blue : C.slate }}>
                        {fmt(p.monthly_price)} FCFA/mois
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Btn onClick={submit} disabled={loading || plansLoading}>
            {loading ? "Enregistrement…" : "✅ Enregistrer le client"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : MES CLIENTS FINAUX — Tous niveaux Diaspora
// ─────────────────────────────────────────────────────────────
export function DiasporaMyClients() {
  const navigate  = useNavigate();
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState(null);

  // ── Paiement inline ─────────────────────────────────────────
  const [payingId,   setPayingId]   = useState(null); // client_id en cours
  const [payMode,    setPayMode]    = useState(null); // 'cash' | 'jeko'
  const [jekoMethod, setJekoMethod] = useState("orange");
  const [payLoading, setPayLoading] = useState(false);
  const [payError,   setPayError]   = useState("");
  const [paidId,     setPaidId]     = useState(null); // client_id venant d'être payé

  const load = useCallback(() => {
    setLoading(true);
    diasporaClientAPI.getMyClients({ page, search, status: statusFilter })
      .then(r => {
        setClients(r.data.clients || []);
        setPagination(r.data.pagination || null);
      })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openPay(clientId) {
    setPayingId(clientId); setPayMode(null);
    setPayError(""); setPayLoading(false);
  }
  function closePay() { setPayingId(null); setPayMode(null); setPayError(""); }

  async function payCash(clientId) {
    setPayLoading(true); setPayError("");
    try {
      await diasporaClientAPI.payCash(clientId);
      setPaidId(clientId);
      closePay();
      load(); // rafraîchit la liste
    } catch (e) {
      setPayError(e.response?.data?.error || "Erreur paiement cash");
    } finally { setPayLoading(false); }
  }

  async function payJeko(clientId) {
    setPayLoading(true); setPayError("");
    try {
      const { data } = await diasporaClientAPI.payJeko(clientId, { jeko_method: jekoMethod });
      const url = data?.data?.redirect_url || data?.redirect_url;
      if (!url) throw new Error("URL de paiement non reçue");
      window.location.href = url;
    } catch (e) {
      setPayError(e.response?.data?.error || e.message || "Erreur JEKO");
      setPayLoading(false);
    }
  }

  const statusColor = (s) => ({
    actif:    { bg: C.greenL, color: C.green, label: "✅ Actif"       },
    attente:  { bg: C.goldL,  color: C.gold,  label: "⏳ En attente"  },
    suspendu: { bg: C.redL,   color: C.red,   label: "🚫 Suspendu"    },
  }[s] || { bg: C.bg, color: C.slate, label: s });

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        title="👥 Mes clients finaux"
        subtitle={pagination ? `${pagination.total} client(s) au total` : ""}
        action={<Btn onClick={() => navigate("/diaspora/my-clients/new")}>➕ Nouveau client</Btn>}
      />

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="Rechercher nom, téléphone, numéro…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8, fontSize: 13, border: `1.5px solid ${C.border}`, outline: "none" }}
        />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 8, fontSize: 13, border: `1.5px solid ${C.border}`, background: "#fff", fontFamily: "inherit" }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="attente">En attente</option>
          <option value="suspendu">Suspendu</option>
        </select>
      </div>

      {loading ? <Loader /> : clients.length === 0 ? (
        <EmptyState icon="👥" title="Aucun client" desc="Créez votre premier client final" />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clients.map(c => {
              const sc      = statusColor(c.status);
              const isPaid  = c.status_payment === "paid";
              const isPayingThis = payingId === c.id;
              const justPaid     = paidId === c.id;

              return (
                <Card key={c.id} style={{ flexDirection: "column", gap: 0 }}>
                  {/* Ligne principale */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: C.blueL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👤</div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, color: C.dark }}>{c.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>{c.phone}{c.city ? ` • ${c.city}` : ""}</p>
                        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.blueL, padding: "1px 8px", borderRadius: 999 }}>{c.plan}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.slate, fontFamily: "monospace" }}>{c.mutual_number}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {sc.label}
                      </span>
                      {c.expiration_date && (
                        <span style={{ fontSize: 11, color: C.slate }}>Exp. {fmtDate(c.expiration_date)}</span>
                      )}
                      {/* Bouton payer — uniquement si non payé */}
                      {!isPaid && !justPaid && (
                        <button onClick={() => isPayingThis ? closePay() : openPay(c.id)}
                          style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${C.green}`, background: isPayingThis ? C.greenL : "#fff", color: C.green, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          {isPayingThis ? "✕ Annuler" : "💳 Payer l'adhésion"}
                        </button>
                      )}
                      {justPaid && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>✅ Adhésion payée !</span>
                      )}
                    </div>
                  </div>

                  {/* Panel paiement inline */}
                  {isPayingThis && (
                    <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                      {payError && (
                        <div style={{ background: C.redL, color: C.red, padding: "8px 12px", borderRadius: 8, marginBottom: 10, fontSize: 12, fontWeight: 600 }}>
                          ⚠️ {payError}
                        </div>
                      )}

                      {!payMode && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <button disabled
                            style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#e2e8f0", color: "#94a3b8", border: "none", fontWeight: 700, fontSize: 13, cursor: "not-allowed", fontFamily: "inherit" }}>
                            💵 Cash (indisponible)
                          </button>
                          <button onClick={() => setPayMode("jeko")}
                            style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: `linear-gradient(135deg, ${C.green}, #047857)`, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                            📱 JEKO
                          </button>
                        </div>
                      )}

                      {payMode === "cash" && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => setPayMode(null)}
                            style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#fff", color: C.slate, border: `1.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                            ← Retour
                          </button>
                          <button onClick={() => payCash(c.id)} disabled={payLoading}
                            style={{ flex: 2, padding: "10px 0", borderRadius: 8, background: payLoading ? "#94a3b8" : C.blue, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: payLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                            {payLoading ? "Enregistrement…" : "✅ Confirmer paiement cash"}
                          </button>
                        </div>
                      )}

                      {payMode === "jeko" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <select value={jekoMethod} onChange={e => setJekoMethod(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
                            <option value="orange">🟠 Orange Money</option>
                            <option value="wave">🔵 Wave</option>
                            <option value="mtn">🟡 MTN Mobile Money</option>
                            <option value="moov">🟢 Moov Money</option>
                            <option value="djamo">💜 Djamo / Carte bancaire</option>
                          </select>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setPayMode(null)}
                              style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#fff", color: C.slate, border: `1.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                              ← Retour
                            </button>
                            <button onClick={() => payJeko(c.id)} disabled={payLoading}
                              style={{ flex: 2, padding: "10px 0", borderRadius: 8, background: payLoading ? "#94a3b8" : `linear-gradient(135deg, ${C.green}, #047857)`, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: payLoading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                              {payLoading
                                ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />Redirection…</>
                                : "💳 Payer via JEKO"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
              <Btn variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</Btn>
              <span style={{ padding: "8px 14px", fontSize: 13, color: C.slate }}>
                Page {page} / {pagination.pages}
              </span>
              <Btn variant="outline" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Suivant →</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
