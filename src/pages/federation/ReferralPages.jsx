// src/pages/federation/ReferralPages.jsx
// ─────────────────────────────────────────────────────────────
//  Toutes les pages du réseau Parrainage (REFERRAL)
//  RUM → LEADER → PASTEUR → RESPONSABLE → CLIENT
//  Exports nommés utilisés dans App.jsx via referralPage()
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getDiasporaData } from "../../diasporaApi";
import { federationMemberAPI, federationCommAPI, federationPayAPI, federationNotifAPI, federationLeaderAPI, federationNetAPI, federationRecruitAPI, federationProfileAPI } from "../../federationApi";
import AdhesionForm from "../../components/AdhesionForm";
import { usePlans, planIcon } from "../../hooks/usePlans";

const C = {
  purple:  "#7C3AED", purpleL: "#F5F3FF",
  green:   "#059669", greenL:  "#ECFDF5",
  gold:    "#D97706", goldL:   "#FFFBEB",
  blue:    "#1B4FD8", blueL:   "#EEF2FF",
  teal:    "#0D9488", tealL:   "#F0FDFA",
  red:     "#DC2626", redL:    "#FEF2F2",
  slate:   "#64748B", dark:    "#0F172A",
  border:  "#E2E8F0", bg:      "#F8FAFC",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const ROLE_CONFIG = {
  RUM:         { label:"RUM",         icon:"👑", color:C.purple, bg:C.purpleL },
  LEADER:      { label:"Leader",      icon:"⭐", color:C.blue,   bg:C.blueL   },
  PASTEUR:     { label:"Pasteur",     icon:"⛪", color:C.teal,   bg:C.tealL   },
  RESPONSABLE: { label:"Responsable", icon:"🤝", color:C.gold,   bg:C.goldL   },
};




const REWARD_LEVELS = [
  { level:1, min:5,   label:"Bronze 🥉",  reward:"Bon d'achat 5 000 FCFA",   color:"#CD7F32" },
  { level:2, min:15,  label:"Argent 🥈",  reward:"Bon d'achat 20 000 FCFA",  color:"#A8A9AD" },
  { level:3, min:30,  label:"Or 🥇",      reward:"Smartphone offert",        color:"#FFD700" },
  { level:4, min:60,  label:"Platine 💎", reward:"Voyage tous frais payés",  color:"#7C3AED" },
  { level:5, min:100, label:"Diamant 🚀", reward:"Voiture + prime 500 000",  color:"#0D9488" },
];

// ── Shared UI ─────────────────────────────────────────────────
function Card({ children, style={} }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", padding:20, ...style }}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom:24, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
      <div>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:C.dark }}>{title}</h1>
        {subtitle && <p style={{ margin:"4px 0 0", color:C.slate, fontSize:14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:200 }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.purpleL}`, borderTop:`3px solid ${C.purple}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px", color:C.slate }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <p style={{ margin:0, fontWeight:700, color:C.dark, fontSize:15 }}>{title}</p>
      {desc && <p style={{ margin:"6px 0 0", fontSize:13 }}>{desc}</p>}
    </div>
  );
}

function Btn({ children, onClick, color=C.purple, outline=false, disabled=false, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:700,
        cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.6:1,
        display:"inline-flex", alignItems:"center", gap:6, transition:"opacity 0.15s",
        background: outline ? "#fff" : color,
        color:      outline ? color  : "#fff",
        border:     outline ? `1.5px solid ${color}` : "none",
        ...style,
      }}>
      {children}
    </button>
  );
}

// Affiche les credentials générés après création + bouton paiement CinetPay
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
// Retourne true si le membre doit encore payer
const needsPayment = (m) =>
  m.status !== "ACTIVE" || m.status_payment !== "paid";

function CredentialsModal({ credentials, ambassadorId, targetLabel, adhesionFee, onClose }) {
  const [copied,     setCopied]     = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError,   setPayError]   = useState("");
  const text = `Identifiants ${targetLabel} Awoundjô\nNom d'utilisateur : ${credentials.username}\nMot de passe : ${credentials.temp_password}\nURL : https://awoundjo-app.vercel.app/diaspora/login`;
  const fee = Number(adhesionFee) || 0;

  async function handlePay() {
    setPayLoading(true); setPayError("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agent_token");
      const res = await fetch(`${BASE}/api/payments/cinetpay/init-web`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ambassador_id: ambassadorId,
          amount:        fee,
          type:          "adhesion",
          description:   `Adhésion Awoundjô — ${targetLabel}`,
          return_url:    `${window.location.origin}${window.location.pathname}?payment=success`,
          cancel_url:    `${window.location.origin}${window.location.pathname}?payment=failed`,
        }),
      });
      const data = await res.json();
      const url  = data?.data?.payment_url || data?.payment_url;
      if (!url) throw new Error("URL de paiement non reçue du serveur");
      window.location.href = url;
    } catch (e) {
      setPayError(e.message || "Erreur lors de l'initialisation du paiement");
      setPayLoading(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:28, maxWidth:480, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", maxHeight:"90vh", overflowY:"auto" }}>
        {/* En-tête */}
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:C.dark }}>{targetLabel} créé(e) avec succès !</h2>
          <p style={{ margin:"6px 0 0", color:C.slate, fontSize:13 }}>Transmettez ces identifiants de connexion</p>
        </div>

        {/* Étapes */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, flexWrap:"wrap", marginBottom:18 }}>
          {[
            { label:"Compte créé", done:true },
            { label:"Paiement",    done:false, active:true },
            { label:"Validation",  done:false },
          ].map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{
                padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
                background: s.done ? C.greenL : s.active ? C.purpleL : C.bg,
                color:      s.done ? C.green  : s.active ? C.purple  : C.slate,
                border:     `1.5px solid ${s.done ? C.green : s.active ? C.purple : C.border}`,
              }}>
                {s.done ? "✅ " : s.active ? "👉 " : ""}{s.label}
              </div>
              {i < 2 && <span style={{ color:C.border, fontSize:14 }}>→</span>}
            </div>
          ))}
        </div>

        {/* Identifiants */}
        <div style={{ background:C.bg, borderRadius:12, padding:"16px 18px", marginBottom:14, border:`1px solid ${C.border}` }}>
          {[
            { label:"Nom d'utilisateur",      value:credentials.username      },
            { label:"Mot de passe temporaire", value:credentials.temp_password },
          ].map(f => (
            <div key={f.label} style={{ marginBottom:10 }}>
              <p style={{ margin:"0 0 3px", fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.8 }}>{f.label}</p>
              <p style={{ margin:0, fontSize:15, fontWeight:800, color:C.dark, fontFamily:"monospace", background:"#fff", padding:"6px 10px", borderRadius:6, border:`1px solid ${C.border}` }}>{f.value}</p>
            </div>
          ))}
          <p style={{ margin:"4px 0 0", fontSize:11, color:C.red }}>⚠️ Le mot de passe doit être changé à la première connexion</p>
        </div>

        {/* Partage */}
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
            style={{ flex:1, padding:"9px 0", background:C.purpleL, color:C.purple, border:`1.5px solid ${C.purple}`, borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            {copied ? "✅ Copié !" : "📋 Copier les identifiants"}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
            style={{ flex:1, padding:"9px 0", background:"#25D366", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            📲 WhatsApp
          </a>
        </div>

        {/* Paiement CinetPay */}
        <div style={{ background:"#EFF6FF", border:"1.5px solid #0072C644", borderRadius:12, padding:"16px 18px", marginBottom:14 }}>
          <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:800, color:"#0072C6" }}>
            💳 Étape suivante — Paiement des frais d'adhésion
          </p>
          <p style={{ margin:"0 0 12px", fontSize:12, color:C.slate }}>
            Payez maintenant les frais d'adhésion de <strong>{fee.toLocaleString("fr-FR")} FCFA</strong> via CinetPay pour activer le processus de validation.
          </p>
          {payError && (
            <div style={{ background:C.redL, borderRadius:8, padding:"8px 12px", marginBottom:10 }}>
              <p style={{ margin:0, fontSize:12, color:C.red, fontWeight:600 }}>⚠️ {payError}</p>
            </div>
          )}
          <button onClick={handlePay} disabled={payLoading}
            style={{
              width:"100%", padding:"13px 0", borderRadius:10, border:"none",
              background: payLoading ? "#94a3b8" : "linear-gradient(135deg,#0072C6,#005A9E)",
              color:"#fff", fontWeight:900, fontSize:14,
              cursor: payLoading ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              boxShadow: payLoading ? "none" : "0 4px 16px rgba(0,114,198,.35)",
              fontFamily:"inherit",
            }}>
            {payLoading ? (
              <>
                <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                Redirection…
              </>
            ) : <>💳 Payer {fee.toLocaleString("fr-FR")} FCFA avec CinetPay</>}
          </button>
          <p style={{ margin:"8px 0 0", fontSize:11, color:C.slate, textAlign:"center" }}>
            MTN · Orange · Moov · Wave · Carte bancaire · Paiement 100% sécurisé
          </p>
        </div>

        <button onClick={onClose}
          style={{ width:"100%", padding:"10px 0", background:"#fff", color:C.slate, border:`1.5px solid ${C.border}`, borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          Fermer (paiement plus tard)
        </button>
      </div>
    </div>
  );
}

// Modal de paiement pour un membre existant (cartes cliquables)
function PaymentModal({ member, roleLabel, onClose }) {
  const [payLoading, setPayLoading] = useState(false);
  const [payError,   setPayError]   = useState("");
  const fee = Number(member.membership_fee) || 0;

  async function handlePay() {
    setPayLoading(true); setPayError("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agent_token");
      const res = await fetch(`${BASE}/api/payments/cinetpay/init-web`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ambassador_id: member.id,
          amount:        fee,
          type:          "adhesion",
          description:   `Adhésion Awoundjô — ${roleLabel} — ${member.name}`,
          return_url:    `${window.location.origin}${window.location.pathname}?payment=success`,
          cancel_url:    `${window.location.origin}${window.location.pathname}?payment=failed`,
        }),
      });
      const data = await res.json();
      const url  = data?.data?.payment_url || data?.payment_url;
      if (!url) throw new Error("URL de paiement non reçue du serveur");
      window.location.href = url;
    } catch (e) {
      setPayError(e.message || "Erreur lors de l'initialisation du paiement");
      setPayLoading(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:28, maxWidth:440, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>💳</div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:C.dark }}>Payer l'adhésion</h2>
          <p style={{ margin:"6px 0 0", color:C.slate, fontSize:13 }}>{member.name} · {roleLabel}</p>
        </div>

        <div style={{ background:C.bg, borderRadius:12, padding:"14px 16px", marginBottom:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:13, color:C.slate }}>Membre</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{member.name}</span>
          </div>
          {member.plan && (
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:C.slate }}>Plan</span>
              <span style={{ fontSize:13, fontWeight:700, color:C.purple }}>{member.plan}</span>
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
            <span style={{ fontSize:13, fontWeight:800, color:C.dark }}>Frais d'adhésion</span>
            <span style={{ fontSize:15, fontWeight:900, color:"#0072C6" }}>{fee.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        {payError && (
          <div style={{ background:C.redL, borderRadius:8, padding:"10px 12px", marginBottom:14 }}>
            <p style={{ margin:0, fontSize:13, color:C.red, fontWeight:600 }}>⚠️ {payError}</p>
          </div>
        )}

        <button onClick={handlePay} disabled={payLoading}
          style={{
            width:"100%", padding:"14px 0", borderRadius:10, border:"none",
            background: payLoading ? "#94a3b8" : "linear-gradient(135deg,#0072C6,#005A9E)",
            color:"#fff", fontWeight:900, fontSize:15,
            cursor: payLoading ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            boxShadow: payLoading ? "none" : "0 4px 16px rgba(0,114,198,.35)",
            fontFamily:"inherit", marginBottom:10,
          }}>
          {payLoading ? (
            <>
              <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              Redirection vers CinetPay…
            </>
          ) : <>💳 Payer {fee.toLocaleString("fr-FR")} FCFA avec CinetPay</>}
        </button>
        <p style={{ margin:"0 0 12px", fontSize:11, color:C.slate, textAlign:"center" }}>
          MTN · Orange · Moov · Wave · Carte bancaire · Paiement 100% sécurisé
        </p>

        <button onClick={onClose}
          style={{ width:"100%", padding:"10px 0", background:"#fff", color:C.slate, border:`1.5px solid ${C.border}`, borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

// NB : RegisterRoleForm remplacé par AdhesionForm (CinetPay + plan + récap)

// ─────────────────────────────────────────────────────────────
// PAGE : ENREGISTRER UN LEADER (RUM uniquement)
// ─────────────────────────────────────────────────────────────
export function ReferralRegisterLeader() {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creds, setCreds]       = useState(null);
  const [credsLabel, setCredsLabel] = useState("");
  const [credsId, setCredsId]   = useState(null);
  const [credsAdhesionFee, setCredsAdhesionFee] = useState(0);
  const [payMember, setPayMember] = useState(null);
  const [payFailed, setPayFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "failed") {
      setPayFailed(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    federationMemberAPI.getAll({ role:"LEADER" })
      .then(r => setList(r.data.members || []))
      .finally(() => setLoading(false));
  }, []);

  function handleSuccess(credentials, label, id, fee) {
    setCreds(credentials);
    setCredsLabel(label);
    setCredsId(id || null);
    setCredsAdhesionFee(fee || 0);
    setShowForm(false);
    federationMemberAPI.getAll({ role:"LEADER" })
      .then(r => setList(r.data.members || []));
  }

  return (
    <div style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      {creds && <CredentialsModal credentials={creds} ambassadorId={credsId} targetLabel={credsLabel} adhesionFee={credsAdhesionFee} onClose={() => { setCreds(null); setCredsId(null); }} />}
      {payMember && <PaymentModal member={payMember} roleLabel="Leader" onClose={() => setPayMember(null)} />}

      {payFailed && (
        <div style={{ marginBottom:20, padding:"14px 18px", borderRadius:12, background:C.redL, border:`1.5px solid ${C.red}`, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>❌</span>
          <div>
            <p style={{ margin:0, fontWeight:800, color:C.red, fontSize:14 }}>Paiement annulé ou refusé</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:C.red }}>Le paiement CinetPay n'a pas abouti. Veuillez réessayer.</p>
          </div>
          <button onClick={() => setPayFailed(false)} style={{ marginLeft:"auto", background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.red }}>✕</button>
        </div>
      )}

      <PageHeader
        title="⭐ Mes Leaders"
        subtitle={`${list.length} leader(s) enregistré(s)`}
        action={<Btn onClick={() => setShowForm(!showForm)}>{showForm ? "✕ Annuler" : "➕ Nouveau Leader"}</Btn>}
      />

      {showForm && (
        <div style={{ marginBottom:24 }}>
          <AdhesionForm targetRole="LEADER" onSuccess={handleSuccess} />
        </div>
      )}

      {loading ? <Loader /> : list.length === 0 ? (
        <EmptyState icon="⭐" title="Aucun Leader enregistré" desc="Cliquez sur + Nouveau Leader pour commencer" />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {list.map(m => (
            <Card key={m.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, cursor:"pointer", transition:"box-shadow .15s" }}
              onClick={() => needsPayment(m) && setPayMember(m)}
              onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:C.blueL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⭐</div>
                <div>
                  <p style={{ margin:0, fontWeight:700, color:C.dark }}>{m.name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>{m.email} • Depuis {fmtDate(m.createdAt||m.created_at)}</p>
                  {m.plan && <span style={{ fontSize:10, fontWeight:700, color:C.blue, background:C.blueL, padding:"1px 8px", borderRadius:999 }}>{m.plan}</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {needsPayment(m) && (
                  <button onClick={e => { e.stopPropagation(); setPayMember(m); }}
                    style={{ padding:"5px 12px", borderRadius:8, background:"linear-gradient(135deg,#0072C6,#005A9E)", color:"#fff", border:"none", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                    💳 Payer
                  </button>
                )}
                <span style={{ background:!needsPayment(m)?C.greenL:C.goldL, color:!needsPayment(m)?C.green:C.gold, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                  {!needsPayment(m) ? "✅ Actif" : "⏳ Paiement requis"}
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
// PAGE : ENREGISTRER UN PASTEUR (LEADER uniquement)
// ─────────────────────────────────────────────────────────────
export function ReferralRegisterPasteur() {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creds, setCreds]       = useState(null);
  const [credsLabel, setCredsLabel] = useState("");
  const [credsId, setCredsId]   = useState(null);
  const [credsAdhesionFee, setCredsAdhesionFee] = useState(0);
  const [payMember, setPayMember] = useState(null);
  const [payFailed, setPayFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "failed") {
      setPayFailed(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    federationMemberAPI.getAll({ role:"PASTEUR" })
      .then(r => setList(r.data.members || []))
      .finally(() => setLoading(false));
  }, []);

  function handleSuccess(credentials, label, id, fee) {
    setCreds(credentials);
    setCredsLabel(label);
    setCredsId(id || null);
    setCredsAdhesionFee(fee || 0);
    setShowForm(false);
    federationMemberAPI.getAll({ role:"PASTEUR" })
      .then(r => setList(r.data.members || []));
  }

  return (
    <div style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      {creds && <CredentialsModal credentials={creds} ambassadorId={credsId} targetLabel={credsLabel} adhesionFee={credsAdhesionFee} onClose={() => { setCreds(null); setCredsId(null); }} />}
      {payMember && <PaymentModal member={payMember} roleLabel="Pasteur" onClose={() => setPayMember(null)} />}

      {payFailed && (
        <div style={{ marginBottom:20, padding:"14px 18px", borderRadius:12, background:C.redL, border:`1.5px solid ${C.red}`, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>❌</span>
          <div>
            <p style={{ margin:0, fontWeight:800, color:C.red, fontSize:14 }}>Paiement annulé ou refusé</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:C.red }}>Le paiement CinetPay n'a pas abouti. Veuillez réessayer.</p>
          </div>
          <button onClick={() => setPayFailed(false)} style={{ marginLeft:"auto", background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.red }}>✕</button>
        </div>
      )}

      <PageHeader
        title="⛪ Mes Pasteurs"
        subtitle={`${list.length} pasteur(s) enregistré(s)`}
        action={<Btn onClick={() => setShowForm(!showForm)}>{showForm ? "✕ Annuler" : "➕ Nouveau Pasteur"}</Btn>}
      />

      {showForm && (
        <div style={{ marginBottom:24 }}>
          <AdhesionForm targetRole="PASTEUR" onSuccess={handleSuccess} />
        </div>
      )}

      {loading ? <Loader /> : list.length === 0 ? (
        <EmptyState icon="⛪" title="Aucun Pasteur enregistré" desc="Créez votre premier Pasteur" />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {list.map(m => (
            <Card key={m.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, cursor:"pointer", transition:"box-shadow .15s" }}
              onClick={() => needsPayment(m) && setPayMember(m)}
              onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:C.tealL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⛪</div>
                <div>
                  <p style={{ margin:0, fontWeight:700, color:C.dark }}>{m.name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>{m.email} • {fmtDate(m.createdAt||m.created_at)}</p>
                  {m.plan && <span style={{ fontSize:10, fontWeight:700, color:C.teal, background:C.tealL, padding:"1px 8px", borderRadius:999 }}>{m.plan}</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {needsPayment(m) && (
                  <button onClick={e => { e.stopPropagation(); setPayMember(m); }}
                    style={{ padding:"5px 12px", borderRadius:8, background:"linear-gradient(135deg,#0072C6,#005A9E)", color:"#fff", border:"none", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                    💳 Payer
                  </button>
                )}
                <span style={{ background:!needsPayment(m)?C.greenL:C.goldL, color:!needsPayment(m)?C.green:C.gold, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                  {!needsPayment(m) ? "✅ Actif" : "⏳ Paiement requis"}
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
// PAGE : ENREGISTRER UN RESPONSABLE (PASTEUR uniquement)
// ─────────────────────────────────────────────────────────────
export function ReferralRegisterResponsable() {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creds, setCreds]       = useState(null);
  const [credsLabel, setCredsLabel] = useState("");
  const [credsId, setCredsId]   = useState(null);
  const [credsAdhesionFee, setCredsAdhesionFee] = useState(0);
  const [payMember, setPayMember] = useState(null);
  const [payFailed, setPayFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "failed") {
      setPayFailed(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    federationMemberAPI.getAll({ role:"RESPONSABLE" })
      .then(r => setList(r.data.members || []))
      .finally(() => setLoading(false));
  }, []);

  function handleSuccess(credentials, label, id, fee) {
    setCreds(credentials);
    setCredsLabel(label);
    setCredsId(id || null);
    setCredsAdhesionFee(fee || 0);
    setShowForm(false);
    federationMemberAPI.getAll({ role:"RESPONSABLE" })
      .then(r => setList(r.data.members || []));
  }

  return (
    <div style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      {creds && <CredentialsModal credentials={creds} ambassadorId={credsId} targetLabel={credsLabel} adhesionFee={credsAdhesionFee} onClose={() => { setCreds(null); setCredsId(null); }} />}
      {payMember && <PaymentModal member={payMember} roleLabel="Responsable" onClose={() => setPayMember(null)} />}

      {payFailed && (
        <div style={{ marginBottom:20, padding:"14px 18px", borderRadius:12, background:C.redL, border:`1.5px solid ${C.red}`, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>❌</span>
          <div>
            <p style={{ margin:0, fontWeight:800, color:C.red, fontSize:14 }}>Paiement annulé ou refusé</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:C.red }}>Le paiement CinetPay n'a pas abouti. Veuillez réessayer.</p>
          </div>
          <button onClick={() => setPayFailed(false)} style={{ marginLeft:"auto", background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.red }}>✕</button>
        </div>
      )}

      <PageHeader
        title="🤝 Mes Responsables"
        subtitle={`${list.length} responsable(s) enregistré(s)`}
        action={<Btn onClick={() => setShowForm(!showForm)}>{showForm ? "✕ Annuler" : "➕ Nouveau Responsable"}</Btn>}
      />

      {showForm && (
        <div style={{ marginBottom:24 }}>
          <AdhesionForm targetRole="RESPONSABLE" onSuccess={handleSuccess} />
        </div>
      )}

      {loading ? <Loader /> : list.length === 0 ? (
        <EmptyState icon="🤝" title="Aucun Responsable enregistré" desc="Créez votre premier Responsable" />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {list.map(m => (
            <Card key={m.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, cursor:"pointer", transition:"box-shadow .15s" }}
              onClick={() => needsPayment(m) && setPayMember(m)}
              onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}>
              <div>
                <p style={{ margin:0, fontWeight:700, color:C.dark }}>{m.name}</p>
                <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>{m.email} • {fmtDate(m.createdAt||m.created_at)}</p>
                {m.plan && <span style={{ fontSize:10, fontWeight:700, color:C.gold, background:C.goldL, padding:"1px 8px", borderRadius:999 }}>{m.plan}</span>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {needsPayment(m) && (
                  <button onClick={e => { e.stopPropagation(); setPayMember(m); }}
                    style={{ padding:"5px 12px", borderRadius:8, background:"linear-gradient(135deg,#0072C6,#005A9E)", color:"#fff", border:"none", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                    💳 Payer
                  </button>
                )}
                <span style={{ background:!needsPayment(m)?C.greenL:C.goldL, color:!needsPayment(m)?C.green:C.gold, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                  {!needsPayment(m) ? "✅ Actif" : "⏳ Paiement requis"}
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
// PAGE : ENREGISTRER UN CLIENT (RESPONSABLE / PASTEUR)
// Génère numéro mutualiste AWJ-YYYY-XXXX
// ─────────────────────────────────────────────────────────────
export function ReferralRegisterClient() {
  const navigate  = useNavigate();
  const { plans, plansLoading } = usePlans();
  const [form, setForm] = useState({ name:"", phone:"", city:"", plan:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (plans.length && !form.plan) {
      setForm(f => ({ ...f, plan: plans[0].slug.toUpperCase() }));
    }
  }, [plans]);

  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await federationMemberAPI.create({ ...form, role:"CLIENT" });
      setSuccess(data.client);
    } catch(err) {
      setError(err.response?.data?.error || "Erreur création client");
    } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div style={{ padding:"24px 20px", maxWidth:560, margin:"0 auto" }}>
        <Card style={{ textAlign:"center" }}>
          <div style={{ fontSize:56, marginBottom:12 }}>⏳</div>
          <h2 style={{ margin:"0 0 6px", fontSize:20, fontWeight:900, color:C.gold }}>
            Compte créé — en attente de validation
          </h2>
          <div style={{ background:C.goldL, border:`1.5px solid ${C.gold}44`, borderRadius:12, padding:"16px 20px", margin:"20px 0" }}>
            <p style={{ margin:"0 0 6px", fontSize:13, color:C.slate }}>Numéro mutualiste</p>
            <p style={{ margin:0, fontSize:24, fontWeight:900, color:C.dark, fontFamily:"monospace" }}>{success.mutual_number}</p>
          </div>
          <p style={{ fontSize:13, color:C.slate, marginBottom:20 }}>
            Un administrateur doit valider ce compte avant que le client puisse effectuer son paiement d'adhésion.
          </p>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <Btn onClick={() => setSuccess(null)}>➕ Nouveau client</Btn>
            <Btn outline onClick={() => navigate("/referral/clients")}>Voir mes clients</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding:"24px 20px", maxWidth:560, margin:"0 auto" }}>
      <PageHeader title="👤 Enregistrer un client" subtitle="Génère automatiquement un numéro mutualiste AWJ-YYYY-XXXX" />
      <Card>
        {error && <div style={{ background:C.redL, color:C.red, padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13 }}>⚠️ {error}</div>}
        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {[
            { key:"name",  label:"Nom complet *",      placeholder:"Jean Dupont",           type:"text" },
            { key:"phone", label:"Téléphone WhatsApp", placeholder:"+225 07 00 00 00 00",   type:"tel"  },
            { key:"city",  label:"Ville",              placeholder:"Abidjan",               type:"text" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display:"block", fontSize:13, fontWeight:700, color:C.dark, marginBottom:6 }}>{f.label}</label>
              <input required={f.key==="name"} type={f.type} placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, fontSize:14, border:`1.5px solid ${C.border}`, outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}

          {/* Choix offre */}
          <div>
            <label style={{ display:"block", fontSize:13, fontWeight:700, color:C.dark, marginBottom:8 }}>Offre choisie *</label>
            {plansLoading ? (
              <p style={{ fontSize:12, color:C.slate }}>Chargement des formules…</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {plans.map(p => {
                  const slug = p.slug.toUpperCase();
                  return (
                    <div key={slug} onClick={() => setForm(f => ({ ...f, plan: slug }))}
                      style={{ padding:"12px 16px", borderRadius:10, border:`2px solid ${form.plan===slug?C.purple:C.border}`, background:form.plan===slug?C.purpleL:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .15s" }}>
                      <div>
                        <p style={{ margin:0, fontWeight:700, fontSize:14, color:form.plan===slug?C.purple:C.dark }}>{planIcon(slug)} {p.name}</p>
                        <p style={{ margin:0, fontSize:12, color:C.slate }}>{p.coverage_percent}% de couverture</p>
                      </div>
                      <span style={{ fontWeight:800, fontSize:14, color:form.plan===slug?C.purple:C.slate }}>{fmt(p.monthly_price)} FCFA/mois</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Btn disabled={loading}>
            {loading ? "Enregistrement…" : "✅ Enregistrer le client"}
          </Btn>
        </form>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : MES CLIENTS
// ─────────────────────────────────────────────────────────────
export function ReferralClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    federationMemberAPI.getAll({ role:"CLIENT" })
      .then(r => setClients(r.data.members || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      <PageHeader
        title="👤 Mes clients"
        subtitle={`${clients.length} client(s) enregistré(s)`}
        action={<Btn onClick={() => navigate("/referral/clients/new")}>➕ Nouveau client</Btn>}
      />
      {loading ? <Loader /> : clients.length === 0 ? (
        <EmptyState icon="👤" title="Aucun client" desc="Enregistrez votre premier client" />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {clients.map(c => (
            <Card key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <p style={{ margin:0, fontWeight:700, color:C.dark }}>{c.name}</p>
                <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>{c.phone} • {c.city}</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:12, fontWeight:700, color:C.purple, background:C.purpleL, padding:"3px 10px", borderRadius:999 }}>{c.plan}</span>
                <span style={{ fontSize:12, fontWeight:700, fontFamily:"monospace", color:C.teal }}>{c.mutual_number}</span>
                <span style={{ fontSize:12, color:C.slate }}>{fmtDate(c.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : RÉCOMPENSES 🏆 (tous les rôles avec cardsSold)
// ─────────────────────────────────────────────────────────────
export function ReferralRewards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    federationDashAPI.getStats()
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
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
    <div style={{ padding:"24px 20px", maxWidth:700, margin:"0 auto" }}>
      <PageHeader title="🏆 Mes récompenses" subtitle="Vendez des cartes pour débloquer des paliers" />

      {/* Résumé */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <Card style={{ textAlign:"center" }}>
          <p style={{ margin:"0 0 4px", fontSize:36, fontWeight:900, color:C.purple }}>{cardsSold}</p>
          <p style={{ margin:0, fontSize:13, color:C.slate, fontWeight:600 }}>Cartes vendues</p>
        </Card>
        <Card style={{ textAlign:"center" }}>
          <p style={{ margin:"0 0 4px", fontSize:28, fontWeight:900, color:C.gold }}>{fmt(totalEarned)}</p>
          <p style={{ margin:0, fontSize:11, color:C.slate }}>FCFA</p>
          <p style={{ margin:"2px 0 0", fontSize:13, color:C.slate, fontWeight:600 }}>Commissions totales</p>
        </Card>
      </div>

      {/* Niveau actuel */}
      <Card style={{ marginBottom:24 }}>
        <p style={{ margin:"0 0 16px", fontWeight:800, color:C.dark, fontSize:15 }}>🎖️ Niveau actuel</p>
        {currentLevel ? (
          <div style={{ background:C.purpleL, borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
            <p style={{ margin:"0 0 4px", fontSize:24, fontWeight:900, color:C.purple }}>{currentLevel.label}</p>
            <p style={{ margin:0, fontSize:14, color:C.dark }}>Récompense : <strong>{currentLevel.reward}</strong></p>
          </div>
        ) : (
          <div style={{ background:C.bg, borderRadius:12, padding:"16px 18px", marginBottom:16, textAlign:"center" }}>
            <p style={{ margin:0, color:C.slate, fontSize:13 }}>Vendez {REWARD_LEVELS[0].min} cartes pour débloquer votre premier niveau !</p>
          </div>
        )}

        {/* Progression vers le prochain niveau */}
        {nextLevel && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:C.slate }}>Progression vers <strong>{nextLevel.label}</strong></span>
              <span style={{ fontSize:13, fontWeight:700, color:C.purple }}>{cardsSold} / {nextLevel.min} cartes</span>
            </div>
            <div style={{ background:C.border, borderRadius:99, height:10, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progressPct}%`, background:`linear-gradient(90deg, ${C.purple}, #A78BFA)`, borderRadius:99, transition:"width .5s" }} />
            </div>
            <p style={{ margin:"6px 0 0", fontSize:12, color:C.slate }}>Encore {nextLevel.min - cardsSold} cartes pour débloquer : <strong>{nextLevel.reward}</strong></p>
          </div>
        )}
      </Card>

      {/* Tous les paliers */}
      <Card>
        <p style={{ margin:"0 0 16px", fontWeight:800, color:C.dark, fontSize:15 }}>📊 Tous les paliers</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {REWARD_LEVELS.map(l => {
            const unlocked = cardsSold >= l.min;
            return (
              <div key={l.level} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", borderRadius:10, background:unlocked?C.purpleL:C.bg, border:`1.5px solid ${unlocked?C.purple:C.border}` }}>
                <span style={{ fontSize:28 }}>{unlocked ? "✅" : "🔒"}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:700, color:unlocked?C.purple:C.dark }}>{l.label}</p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>{l.reward}</p>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:unlocked?C.purple:C.slate, background:unlocked?"rgba(124,58,237,.1)":C.border, padding:"3px 10px", borderRadius:999, whiteSpace:"nowrap" }}>
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
// PAGE : GAINS / COMMISSIONS
// ─────────────────────────────────────────────────────────────
export function ReferralEarnings() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const amb  = getDiasporaData();
  const role = amb?.role || "RESPONSABLE";

  useEffect(() => {
    federationCommAPI.getAll()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const totals = data?.totals || {};

  if (loading) return <Loader />;

  return (
    <div style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      <PageHeader title="💰 Mes gains" subtitle="Commissions générées par votre réseau" />

      {/* Totaux */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12, marginBottom:24 }}>
        {[
          { label:"Total gagné",    value:totals.total_earned, color:C.green  },
          { label:"En attente",     value:totals.pending,      color:C.gold   },
          { label:"Validé",         value:totals.validated,    color:C.blue   },
          { label:"Payé",           value:totals.paid,         color:C.purple },
          { label:"Ce mois",        value:totals.this_month,   color:C.teal   },
        ].map(s => (
          <Card key={s.label} style={{ textAlign:"center" }}>
            <p style={{ margin:"0 0 4px", fontSize:22, fontWeight:900, color:s.color }}>{fmt(s.value)}</p>
            <p style={{ margin:0, fontSize:11, color:C.slate }}>FCFA</p>
            <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:600, color:C.dark }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tableau commissions */}
      <Card>
        <p style={{ margin:"0 0 16px", fontWeight:800, color:C.dark, fontSize:15 }}>📋 Détail des commissions</p>
        {!data?.commissions?.length ? (
          <EmptyState icon="💰" title="Aucune commission" desc="Vos commissions apparaîtront ici" />
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:500 }}>
              <thead>
                <tr style={{ background:C.bg }}>
                  {["Date","Type","Montant","Statut"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:C.slate, fontSize:11, textTransform:"uppercase", letterSpacing:.8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.commissions.map(c => (
                  <tr key={c.id} style={{ borderTop:`1px solid ${C.border}` }}>
                    <td style={{ padding:"10px 12px", color:C.slate }}>{fmtDate(c.created_at)}</td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ background:c.source==="direct"?C.greenL:C.blueL, color:c.source==="direct"?C.green:C.blue, padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                        {c.source === "direct" ? "Direct" : "Réseau"}
                      </span>
                    </td>
                    <td style={{ padding:"10px 12px", fontWeight:700, color:C.green }}>{fmt(c.amount)} FCFA</td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ background:c.status==="PAID"?C.greenL:c.status==="VALIDATED"?C.blueL:C.goldL, color:c.status==="PAID"?C.green:c.status==="VALIDATED"?C.blue:C.gold, padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                        {c.status==="PAID"?"Payé":c.status==="VALIDATED"?"Validé":"En attente"}
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
// PAGE : MON RÉSEAU
// ─────────────────────────────────────────────────────────────
export function ReferralNetwork() {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    federationNetAPI.getHierarchy()
      .then(r => setNetwork(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const levels = network?.network || { level1:[], level2:[], level3:[] };

  return (
    <div style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      <PageHeader title="🌐 Mon réseau" subtitle={`${network?.totals?.total || 0} membres au total`} />

      {/* Totaux par niveau */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Niveau 1",  value:levels.level1?.length||0, color:C.purple },
          { label:"Niveau 2",  value:levels.level2?.length||0, color:C.blue   },
          { label:"Niveau 3",  value:levels.level3?.length||0, color:C.teal   },
        ].map(s => (
          <Card key={s.label} style={{ textAlign:"center" }}>
            <p style={{ margin:0, fontSize:28, fontWeight:900, color:s.color }}>{fmt(s.value)}</p>
            <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate, fontWeight:600 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Liste par niveau */}
      {["level1","level2","level3"].map((lvl, i) => (
        levels[lvl]?.length > 0 && (
          <Card key={lvl} style={{ marginBottom:16 }}>
            <p style={{ margin:"0 0 14px", fontWeight:800, color:C.dark }}>Niveau {i+1} — {levels[lvl].length} membre(s)</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {levels[lvl].map(m => (
                <div key={m.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:C.bg, borderRadius:8 }}>
                  <div>
                    <p style={{ margin:0, fontWeight:700, color:C.dark, fontSize:13 }}>{m.name}</p>
                    <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{m.country} • {ROLE_CONFIG[m.role]?.label || m.role}</p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:m.status==="ACTIVE"?C.green:C.gold }}>
                    {m.status==="ACTIVE"?"● Actif":"● En attente"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )
      ))}

      {network?.totals?.total === 0 && (
        <EmptyState icon="🌐" title="Réseau vide" desc="Commencez à recruter pour construire votre réseau" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
export function ReferralNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    federationNotifAPI.getAll()
      .then(r => { setNotifs(r.data.notifications || []); federationNotifAPI.markRead().catch(()=>{}); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding:"24px 20px", maxWidth:700, margin:"0 auto" }}>
      <PageHeader title="🔔 Notifications" subtitle={`${notifs.length} notification(s)`} />
      {loading ? <Loader /> : notifs.length === 0 ? (
        <EmptyState icon="🔔" title="Aucune notification" desc="Vous êtes à jour !" />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {notifs.map(n => (
            <Card key={n.id} style={{ display:"flex", gap:14, opacity:n.read?0.7:1 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.purpleL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                {n.type==="commission"?"💰":n.type==="welcome"?"🎉":"🔔"}
              </div>
              <div>
                <p style={{ margin:"0 0 3px", fontWeight:700, color:C.dark, fontSize:13 }}>{n.title || "Notification"}</p>
                <p style={{ margin:"0 0 4px", fontSize:13, color:C.slate }}>{n.message}</p>
                <p style={{ margin:0, fontSize:11, color:C.slate }}>{fmtDate(n.created_at)}</p>
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
export function ReferralLeaderboard() {
  const [data, setData]   = useState(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    federationLeaderAPI.getLeaderboard(period)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div style={{ padding:"24px 20px", maxWidth:700, margin:"0 auto" }}>
      <PageHeader title="🏅 Classement" subtitle="Les meilleurs performers de votre réseau" />

      {/* Sélecteur période */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[{ id:"week",label:"Cette semaine" },{ id:"month",label:"Ce mois" },{ id:"all",label:"Tout temps" }].map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:period===p.id?C.purple:"#fff", color:period===p.id?"#fff":C.slate, border:`1.5px solid ${period===p.id?C.purple:C.border}` }}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <Card>
          <p style={{ margin:"0 0 14px", fontWeight:800, color:C.dark }}>🏆 Top gains</p>
          {data?.top_earners?.map((a, i) => (
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:i===0?C.goldL:C.bg, borderRadius:10, marginBottom:8 }}>
              <span style={{ fontSize:20, width:30, textAlign:"center" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontWeight:700, color:C.dark, fontSize:13 }}>{a.name}</p>
                <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{ROLE_CONFIG[a.role]?.label || a.role} • {a.country}</p>
              </div>
              <span style={{ fontWeight:800, color:C.gold, fontSize:14 }}>{fmt(a.earnings)} FCFA</span>
            </div>
          ))}
          {!data?.top_earners?.length && <EmptyState icon="🏅" title="Aucune donnée" desc="Le classement s'affichera bientôt" />}

          {data?.my_rank && (
            <div style={{ marginTop:16, padding:"12px 16px", background:C.purpleL, borderRadius:10, textAlign:"center" }}>
              <p style={{ margin:0, fontWeight:700, color:C.purple }}>Votre rang : #{data.my_rank}</p>
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
export function ReferralProfile() {
  const [form, setForm]   = useState({ name:"", country:"", city:"", phone:"" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const amb  = getDiasporaData();
  const role = amb?.role || "RESPONSABLE";
  const rc   = ROLE_CONFIG[role] || {};

  useEffect(() => {
    federationProfileAPI.getMe()
      .then(r => { const a = r.data.ambassador; setForm({ name:a.name||"", country:a.country||"", city:a.city||"", phone:a.phone||"" }); })
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault(); setSaving(true); setSaved(false);
    try { await federationProfileAPI.update(form); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch {}
    finally { setSaving(false); }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding:"24px 20px", maxWidth:560, margin:"0 auto" }}>
      <PageHeader title="👤 Mon profil" subtitle="Gérez vos informations personnelles" />
      <Card>
        {/* Badge rôle */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:rc.bg||C.purpleL, borderRadius:12, marginBottom:24 }}>
          <span style={{ fontSize:32 }}>{rc.icon}</span>
          <div>
            <p style={{ margin:0, fontWeight:900, fontSize:16, color:C.dark }}>{form.name}</p>
            <span style={{ fontSize:12, fontWeight:700, color:rc.color||C.purple }}>{rc.label}</span>
          </div>
        </div>

        {saved && <div style={{ background:C.greenL, color:C.green, padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:700 }}>✅ Profil mis à jour !</div>}

        <form onSubmit={save} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {[
            { key:"name",    label:"Nom complet",  placeholder:"Jean Kofi" },
            { key:"phone",   label:"Téléphone",     placeholder:"+225 07 00 00 00 00" },
            { key:"city",    label:"Ville",          placeholder:"Abidjan" },
            { key:"country", label:"Pays",           placeholder:"Côte d'Ivoire" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display:"block", fontSize:13, fontWeight:700, color:C.dark, marginBottom:6 }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width:"100%", padding:"10px 14px", borderRadius:8, fontSize:14, border:`1.5px solid ${C.border}`, outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          <Btn disabled={saving}>
            {saving ? "Enregistrement…" : "💾 Sauvegarder"}
          </Btn>
        </form>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE : PAIEMENTS
// ─────────────────────────────────────────────────────────────
export function ReferralPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    federationPayAPI.getAll()
      .then(r => setPayments(r.data.payments || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      <PageHeader title="💳 Paiements" subtitle={`${payments.length} paiement(s)`} />
      {loading ? <Loader /> : payments.length === 0 ? (
        <EmptyState icon="💳" title="Aucun paiement" desc="Les paiements apparaîtront ici" />
      ) : (
        <Card>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:500 }}>
              <thead>
                <tr style={{ background:C.bg }}>
                  {["Date","Bénéficiaire","Offre","Montant","Statut"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:C.slate, fontSize:11, textTransform:"uppercase", letterSpacing:.8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderTop:`1px solid ${C.border}` }}>
                    <td style={{ padding:"10px 12px", color:C.slate }}>{fmtDate(p.created_at)}</td>
                    <td style={{ padding:"10px 12px", fontWeight:600, color:C.dark }}>{p.beneficiary_name || "—"}</td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ background:C.purpleL, color:C.purple, padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700 }}>{p.plan || "—"}</span>
                    </td>
                    <td style={{ padding:"10px 12px", fontWeight:700, color:C.green }}>{fmt(p.amount_xof || p.amount)} FCFA</td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ background:p.status==="COMPLETED"?C.greenL:C.goldL, color:p.status==="COMPLETED"?C.green:C.gold, padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700 }}>
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

// ─────────────────────────────────────────────────────────────
// PAGE : RECRUTEMENT / LIEN PARRAINAGE
// ─────────────────────────────────────────────────────────────
export function ReferralReferral() {
  const [link, setLink]   = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([federationRecruitAPI.getLink(), federationRecruitAPI.getReferrals()])
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
    <div style={{ padding:"24px 20px", maxWidth:700, margin:"0 auto" }}>
      <PageHeader title="🔗 Recrutement" subtitle={`${referrals.length} recruté(s) direct(s)`} />

      {link && (
        <Card style={{ marginBottom:20 }}>
          <p style={{ margin:"0 0 12px", fontWeight:800, color:C.dark }}>Mon lien de recrutement</p>
          <div style={{ background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:C.purple, fontWeight:600, wordBreak:"break-all", flex:1 }}>{link.link}</span>
            <span style={{ background:C.purpleL, color:C.purple, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700 }}>Code : {link.code}</span>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={copyLink}
              style={{ padding:"8px 18px", borderRadius:8, border:`1.5px solid ${C.purple}`, background:C.purpleL, color:C.purple, fontWeight:700, fontSize:13, cursor:"pointer" }}>
              {copied ? "✅ Copié !" : "📋 Copier le lien"}
            </button>
            {link.whatsapp_message && (
              <a href={link.whatsapp_message} target="_blank" rel="noreferrer"
                style={{ padding:"8px 18px", borderRadius:8, background:"#25D366", color:"#fff", fontWeight:700, fontSize:13, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6 }}>
                📲 WhatsApp
              </a>
            )}
          </div>
        </Card>
      )}

      <Card>
        <p style={{ margin:"0 0 14px", fontWeight:800, color:C.dark }}>Mes recrutés directs</p>
        {referrals.length === 0 ? (
          <EmptyState icon="🤝" title="Aucun recruté" desc="Partagez votre lien pour commencer à recruter" />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {referrals.map(r => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:C.bg, borderRadius:8 }}>
                <div>
                  <p style={{ margin:0, fontWeight:700, color:C.dark, fontSize:13 }}>{r.referred_name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{ROLE_CONFIG[r.referred_role]?.label || r.referred_role} • {fmtDate(r.joined_at)}</p>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:r.referred_status==="ACTIVE"?C.green:C.gold }}>
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
// PAGE : CARTES VENDUES (RESPONSABLE / PASTEUR)
// ─────────────────────────────────────────────────────────────
export function ReferralCards() {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      federationDashAPI.getStats(),
      federationMemberAPI.getAll({ role:"CLIENT" }),
    ]).then(([s, c]) => {
      setStats(s.data);
      setClients(c.data.members || []);
    }).finally(() => setLoading(false));
  }, []);

  const cardsSold = stats?.cards_sold || clients.length;
  const currentLevel = REWARD_LEVELS.slice().reverse().find(l => cardsSold >= l.min) || null;

  if (loading) return <Loader />;

  return (
    <div style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      <PageHeader title="💳 Cartes vendues" subtitle={`${cardsSold} carte(s) au total`} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <Card style={{ textAlign:"center" }}>
          <p style={{ margin:"0 0 4px", fontSize:40, fontWeight:900, color:C.purple }}>{cardsSold}</p>
          <p style={{ margin:0, color:C.slate, fontSize:13, fontWeight:600 }}>Cartes vendues</p>
        </Card>
        <Card style={{ textAlign:"center" }}>
          <p style={{ margin:"0 0 4px", fontSize:24, fontWeight:900, color:currentLevel ? C.gold : C.slate }}>{currentLevel?.label || "Aucun niveau"}</p>
          <p style={{ margin:0, color:C.slate, fontSize:13, fontWeight:600 }}>Niveau atteint</p>
          {currentLevel && <p style={{ margin:"6px 0 0", fontSize:12, color:C.gold }}>{currentLevel.reward}</p>}
        </Card>
      </div>

      <Card>
        <p style={{ margin:"0 0 14px", fontWeight:800, color:C.dark }}>📋 Liste des clients (cartes)</p>
        {clients.length === 0 ? (
          <EmptyState icon="💳" title="Aucune carte vendue" desc="Enregistrez des clients pour vendre des cartes" />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {clients.map(c => (
              <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:C.bg, borderRadius:8 }}>
                <div>
                  <p style={{ margin:0, fontWeight:700, color:C.dark, fontSize:13 }}>{c.name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{c.city} • {fmtDate(c.created_at)}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, fontFamily:"monospace", color:C.purple }}>{c.mutual_number}</p>
                  <span style={{ fontSize:11, fontWeight:700, color:C.teal }}>{c.plan}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Export manquant pour federationDashAPI (utilisé dans ReferralRewards et ReferralCards)
import { federationDashAPI } from "../../federationApi";
