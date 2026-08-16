// src/pages/admin/AdminDiaspora.jsx
// ─────────────────────────────────────────────────────────────
//  Vue admin : réseau DIASPORA — redesign visuel (logique inchangée)
//  Rôles : AMBASSADEUR_DIASPORA → AMBASSADEUR_PAYS → RECRUTEUR
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const agentToken = () => localStorage.getItem("token") || localStorage.getItem("agent_token");

/* ── Design tokens ────────────────────────────────────────────
   Une seule couleur signature (teal profond) pour la marque et les
   actions principales. Les autres teintes servent UNIQUEMENT à du
   signal sémantique ponctuel (attention, succès, danger) — jamais
   en aplat plein sur de grandes surfaces.
------------------------------------------------------------- */
const C = {
  ink:    "#101828", // texte principal
  slate:  "#667085", // texte secondaire
  mist:   "#98A2B3", // texte tertiaire / placeholder
  line:   "#E4E7EC", // hairlines
  paper:  "#FFFFFF",
  canvas: "#F9FAFB", // fond de page

  teal:     "#0F766E", // signature — marque, actions primaires
  tealSoft: "#F0FDFA",
  ocean:    "#155E75", // Ambassadeur Diaspora
  oceanSoft:"#F0F9FB",
  green:    "#15803D", // Ambassadeur Pays / succès / actif
  greenSoft:"#F0FDF4",
  amber:    "#B45309", // Recruteur / attention / en attente
  amberSoft:"#FFFBEB",
  red:      "#B42318", // danger / rejeté
  redSoft:  "#FEF3F2",
  purple:   "#5B21B6", // clients finaux
  purpleSoft:"#F5F3FF",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const initials = (name = "") => name.split(" ").slice(0,2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";

const ROLE_CONFIG = {
  AMBASSADEUR_DIASPORA: { label:"Ambassadeur Diaspora", short:"Diaspora", color:C.ocean  },
  AMBASSADEUR_PAYS:     { label:"Ambassadeur Pays",     short:"Pays",     color:C.green  },
  RECRUTEUR:            { label:"Recruteur",            short:"Recruteur",color:C.amber  },
};
const PLAN_CONFIG = {
  ESSENTIELLE: { label:"Essentielle", color:C.teal   },
  IVOIRIENNE:  { label:"Ivoirienne",  color:C.ocean  },
  TURQUOISE:   { label:"Turquoise",   color:C.purple },
};
const STATUS_CONFIG = {
  ACTIVE:    { label:"Actif",      color:C.green },
  SUSPENDED: { label:"Suspendu",   color:C.red   },
  PENDING:   { label:"En attente", color:C.amber },
};
const VALIDATION_CONFIG = {
  pending:  { label:"À valider", color:C.amber },
  approved: { label:"Validé",    color:C.green },
  rejected: { label:"Rejeté",    color:C.red   },
};

/* ── Icônes (SVG minimal, pas de dépendance) ─────────────────── */
const iconProps = { width:14, height:14, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:2.2, strokeLinecap:"round", strokeLinejoin:"round" };
const IconCheck   = (p) => <svg {...iconProps} {...p}><polyline points="20 6 9 17 4 12"/></svg>;
const IconX        = (p) => <svg {...iconProps} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconRefresh   = (p) => <svg {...iconProps} {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconTrash    = (p) => <svg {...iconProps} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconKey      = (p) => <svg {...iconProps} {...p}><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5L18 10M18.5 5.5L21 8"/></svg>;
const IconChevron  = (p) => <svg {...iconProps} {...p}><polyline points="9 18 15 12 9 6"/></svg>;
const IconSearch   = (p) => <svg {...iconProps} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconClose    = (p) => <svg {...iconProps} width={16} height={16} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

/* ── Bouton unifié — remplace les dizaines de styles ad hoc ──── */
function Btn({ variant="secondary", size="md", icon, children, style, ...props }) {
  const variants = {
    primary:   { bg:C.teal,     color:"#fff",   border:"1px solid transparent" },
    secondary: { bg:C.paper,    color:C.ink,    border:`1px solid ${C.line}` },
    danger:    { bg:C.redSoft,  color:C.red,    border:`1px solid ${C.red}33` },
    dangerSolid:{bg:C.red,      color:"#fff",   border:"1px solid transparent" },
    ghost:     { bg:"transparent", color:C.slate, border:"1px solid transparent" },
  };
  const sizes = {
    sm: { padding:"6px 12px", fontSize:12 },
    md: { padding:"8px 16px", fontSize:13 },
  };
  const v = variants[variant] || variants.secondary;
  const s = sizes[size] || sizes.md;
  return (
    <button
      {...props}
      style={{
        ...v, ...s,
        borderRadius:8, fontWeight:600, fontFamily:"inherit", cursor:"pointer",
        display:"inline-flex", alignItems:"center", gap:6, lineHeight:1,
        transition:"opacity .15s, background .15s",
        opacity: props.disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon}{children}
    </button>
  );
}

/* ── Puce discrète (statut / rôle / plan) — plus de pastille pleine ── */
function Chip({ color, children, dot=true }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      fontSize:11, fontWeight:600, color,
      padding: dot ? "2px 8px 2px 6px" : "2px 8px",
      borderRadius:6, border:`1px solid ${color}33`, background:`${color}0D`,
      whiteSpace:"nowrap",
    }}>
      {dot && <span style={{ width:5, height:5, borderRadius:"50%", background:color, flexShrink:0 }} />}
      {children}
    </span>
  );
}
function RoleChip({ role }) {
  const r = ROLE_CONFIG[role]; if (!r) return null;
  return <Chip color={r.color}>{r.short}</Chip>;
}
function PlanChip({ plan }) {
  if (!plan) return <span style={{ color:C.mist, fontSize:11 }}>—</span>;
  const p = PLAN_CONFIG[plan] || { label:plan, color:C.slate };
  return <Chip color={p.color} dot={false}>{p.label}</Chip>;
}
function StatusChip({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return <Chip color={s.color}>{s.label}</Chip>;
}
function ValidationChip({ v }) {
  const s = VALIDATION_CONFIG[v] || VALIDATION_CONFIG.pending;
  return <Chip color={s.color}>{s.label}</Chip>;
}

/* ── Toggle ───────────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange} style={{
      width:38, height:21, borderRadius:11, border:"none", cursor:"pointer",
      background: on ? C.teal : C.line, position:"relative",
      transition:"background 0.15s", padding:0, flexShrink:0,
    }}>
      <span style={{
        position:"absolute", top:2.5, left: on ? 19 : 2.5, width:16, height:16,
        borderRadius:"50%", background:"#fff", transition:"left 0.15s", display:"block",
        boxShadow:"0 1px 2px rgba(0,0,0,.25)",
      }} />
    </button>
  );
}

/* ── Avatar monogramme (remplace icônes-emoji par rôle) ──────── */
function Avatar({ name, color=C.teal, size=42 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.32, background:`${color}12`,
      color, border:`1px solid ${color}30`, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.36, fontWeight:700, letterSpacing:0.3,
    }}>
      {initials(name)}
    </div>
  );
}

/* ── Section comptes en attente ───────────────────────────── */
function PendingValidationSection({ ambassadors, onValidate }) {
  const [cashModes, setCashModes] = useState({});
  const pending = ambassadors.filter(a => a.status_validation === "pending" || !a.status_validation);
  if (pending.length === 0) return null;

  return (
    <div style={{ background:C.paper, borderRadius:12, border:`1px solid ${C.line}`, borderLeft:`3px solid ${C.amber}`, padding:"16px 18px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:14 }}>
        <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.ink }}>Comptes en attente de validation</p>
        <span style={{ fontSize:12, color:C.slate }}>{pending.length} à traiter · paiement bloqué jusqu'à validation</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {pending.map(amb => {
          const isCash = !!cashModes[amb.id];
          const roleColor = ROLE_CONFIG[amb.role]?.color || C.slate;
          return (
            <div key={amb.id} style={{
              background:C.canvas, borderRadius:10, padding:"11px 14px",
              border:`1px solid ${C.line}`,
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <Avatar name={amb.name} color={roleColor} size={36} />
                <div>
                  <p style={{ margin:0, fontWeight:600, color:C.ink, fontSize:13 }}>{amb.name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11.5, color:C.slate }}>{amb.email} · {amb.country} · {fmtDate(amb.created_at)}</p>
                  <div style={{ display:"flex", gap:6, marginTop:5 }}>
                    <RoleChip role={amb.role} /><PlanChip plan={amb.plan} />
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11.5, fontWeight:600, color: isCash ? C.green : C.slate }}>Paiement cash</span>
                  <Toggle on={isCash} onChange={() => setCashModes(prev => ({ ...prev, [amb.id]: !prev[amb.id] }))} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn variant="primary" size="sm" icon={<IconCheck/>} onClick={() => onValidate(amb.id, "approve", isCash ? "cash" : null)}>
                    {isCash ? "Valider (cash)" : "Valider"}
                  </Btn>
                  <Btn variant="danger" size="sm" icon={<IconX/>} onClick={() => onValidate(amb.id, "reject", null)}>Rejeter</Btn>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Carte ambassadeur (cliquable) ─────────────────────────── */
function AmbassadorCard({ amb, onClick }) {
  const roleColor = ROLE_CONFIG[amb.role]?.color || C.slate;
  const isPending = amb.status_validation === "pending" || !amb.status_validation;

  return (
    <div
      onClick={() => onClick(amb)}
      style={{
        background:C.paper, borderRadius:12,
        border:`1px solid ${isPending ? C.amber+"55" : C.line}`,
        padding:"14px 16px", cursor:"pointer",
        transition:"border-color .15s, box-shadow .15s",
        display:"flex", alignItems:"center", gap:16, flexWrap:"wrap",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 2px 10px ${C.teal}14`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isPending ? C.amber+"55" : C.line; e.currentTarget.style.boxShadow = "none"; }}
    >
      <Avatar name={amb.name} color={roleColor} />

      <div style={{ flex:1, minWidth:160 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
          <span style={{ fontWeight:600, color:C.ink, fontSize:13.5 }}>{amb.name}</span>
          <RoleChip role={amb.role} />
          <StatusChip status={amb.status} />
          {isPending && <ValidationChip v="pending" />}
        </div>
        <p style={{ margin:0, fontSize:12, color:C.slate }}>
          {amb.email} · {amb.country}{amb.city ? ` · ${amb.city}` : ""}
        </p>
        <p style={{ margin:"2px 0 0", fontSize:11, color:C.mist }}>
          @{amb.username || "—"} · inscrit {fmtDate(amb.created_at)}
        </p>
      </div>

      <div style={{ display:"flex", gap:22, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ textAlign:"center" }}>
          <PlanChip plan={amb.plan} />
          <p style={{ margin:"4px 0 0", fontSize:10, color:C.mist }}>Plan</p>
        </div>
        <div style={{ textAlign:"center", minWidth:36 }}>
          <p style={{ margin:0, fontWeight:700, color:C.ink, fontSize:16, lineHeight:1 }}>{amb.beneficiary_count || 0}</p>
          <p style={{ margin:"3px 0 0", fontSize:10, color:C.mist }}>Cartes</p>
        </div>
        <div style={{ textAlign:"center", minWidth:36 }}>
          <p style={{ margin:0, fontWeight:700, color:C.ink, fontSize:16, lineHeight:1 }}>{amb.recruit_count || 0}</p>
          <p style={{ margin:"3px 0 0", fontSize:10, color:C.mist }}>Recrutés</p>
        </div>
        <IconChevron style={{ color:C.mist }} />
      </div>
    </div>
  );
}

/* ── Modal détail ambassadeur ─────────────────────────────── */
function AmbassadorModal({
  amb, onClose,
  onValidate, validating,
  onToggleStatus,
  onResetPassword, resetLoading,
  onRecalc, recalcLoading, recalcMsg,
  onDelete,
  cashMode, onToggleCash,
}) {
  if (!amb) return null;
  const isPending = amb.status_validation === "pending" || !amb.status_validation;
  const roleColor = ROLE_CONFIG[amb.role]?.color || C.slate;

  const fields = [
    { label:"Code ambassadeur", value: amb.referral_code || "—" },
    { label:"Username",         value: `@${amb.username || "—"}` },
    { label:"Plan mensuel",     value: amb.plan || "—" },
    { label:"Adhésion",         value: amb.membership_fee ? `${fmt(amb.membership_fee)} FCFA` : "—" },
    { label:"Mode paiement",    value: amb.membership_payment_method || "—" },
    { label:"Téléphone",        value: amb.phone || "—" },
    { label:"Dernière connexion", value: fmtDate(amb.last_login) },
    { label:"Inscription",      value: fmtDate(amb.created_at) },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(16,24,40,.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:600, padding:20, overflowY:"auto" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:C.paper, borderRadius:16, width:"100%", maxWidth:600,
          boxShadow:"0 20px 60px rgba(16,24,40,.18)",
          maxHeight:"90vh", display:"flex", flexDirection:"column",
          border:`1px solid ${C.line}`,
        }}
      >
        {/* Header modal */}
        <div style={{ padding:"20px 22px 16px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"flex-start", gap:14 }}>
          <Avatar name={amb.name} color={roleColor} size={48} />
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:16.5, fontWeight:700, color:C.ink }}>{amb.name}</h2>
              <RoleChip role={amb.role} />
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <StatusChip status={amb.status} />
              <ValidationChip v={amb.status_validation} />
            </div>
            <p style={{ margin:"6px 0 0", fontSize:12, color:C.slate }}>{amb.email} · {amb.country}{amb.city ? ` · ${amb.city}` : ""}</p>
          </div>
          <button onClick={onClose}
            style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.line}`, background:C.canvas, cursor:"pointer", color:C.slate, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <IconClose />
          </button>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY:"auto", padding:"18px 22px", flex:1 }}>

          {/* Stats rapides */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, marginBottom:20, background:C.line, borderRadius:10, overflow:"hidden", border:`1px solid ${C.line}` }}>
            {[
              { label:"Cartes créées",    value:amb.beneficiary_count || 0 },
              { label:"Membres recrutés", value:amb.recruit_count || 0 },
              { label:"Adhésion (FCFA)",  value:fmt(amb.membership_fee||0) },
            ].map(s => (
              <div key={s.label} style={{ background:C.paper, padding:"12px 14px", textAlign:"center" }}>
                <p style={{ margin:0, fontSize:18, fontWeight:700, color:C.ink }}>{s.value}</p>
                <p style={{ margin:"4px 0 0", fontSize:10.5, color:C.slate }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Fiche détaillée */}
          <div style={{ marginBottom:20 }}>
            <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:C.mist, textTransform:"uppercase", letterSpacing:.6 }}>Informations</p>
            <div style={{ border:`1px solid ${C.line}`, borderRadius:10, overflow:"hidden" }}>
              {fields.map((f, i) => (
                <div key={f.label} style={{
                  display:"flex", justifyContent:"space-between", gap:12,
                  padding:"9px 14px", fontSize:12.5,
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                  background: i % 2 === 0 ? C.paper : C.canvas,
                }}>
                  <span style={{ color:C.slate }}>{f.label}</span>
                  <span style={{ color:C.ink, fontWeight:600, wordBreak:"break-all", textAlign:"right" }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.mist, textTransform:"uppercase", letterSpacing:.6 }}>Actions</p>

            {isPending && (
              <div style={{ background:C.amberSoft, borderRadius:10, padding:"12px 14px", border:`1px solid ${C.amber}33` }}>
                <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:600, color:C.amber }}>Ce compte est en attente de validation</p>
                <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:600, color: cashMode ? C.green : C.slate }}>Cash</span>
                    <Toggle on={cashMode} onChange={onToggleCash} />
                  </div>
                  <Btn variant="primary" size="sm" icon={<IconCheck/>} disabled={validating === amb.id}
                    onClick={() => onValidate(amb.id, "approve", cashMode ? "cash" : null)}>
                    {cashMode ? "Valider (cash)" : "Valider le compte"}
                  </Btn>
                  <Btn variant="danger" size="sm" icon={<IconX/>} disabled={validating === amb.id}
                    onClick={() => onValidate(amb.id, "reject", null)}>Rejeter</Btn>
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <Btn
                variant={amb.status==="ACTIVE" ? "danger" : "primary"}
                size="sm"
                onClick={() => onToggleStatus(amb)}
              >
                {amb.status==="ACTIVE" ? "Suspendre" : "Réactiver"}
              </Btn>

              <Btn variant="secondary" size="sm" icon={<IconKey/>} disabled={resetLoading === amb.id} onClick={() => onResetPassword(amb)}>
                {resetLoading === amb.id ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
              </Btn>

              {amb.status_validation === "approved" && (
                <Btn variant="secondary" size="sm" icon={<IconRefresh/>} disabled={recalcLoading === amb.id} onClick={() => onRecalc(amb)}>
                  {recalcLoading === amb.id ? "Calcul…" : "Recalculer les commissions"}
                </Btn>
              )}

              <Btn variant="danger" size="sm" icon={<IconTrash/>} onClick={() => onDelete(amb)} style={{ marginLeft:"auto" }}>
                Supprimer
              </Btn>
            </div>

            {recalcMsg && (
              <p style={{ margin:0, fontSize:12, fontWeight:600,
                color: recalcMsg.startsWith("✅") ? C.green : C.red,
                background: recalcMsg.startsWith("✅") ? C.greenSoft : C.redSoft,
                padding:"8px 12px", borderRadius:8 }}>
                {recalcMsg.replace(/^✅ |^❌ /, "")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Composant principal ──────────────────────────────────── */
export default function AdminDiaspora() {
  const [ambassadors, setAmbassadors]     = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [search, setSearch]               = useState("");
  const [roleFilter, setRoleFilter]       = useState("ALL");
  const [statusFilter, setStatusFilter]   = useState("ALL");
  const [validFilter, setValidFilter]     = useState("ALL");

  /* Modal ambassadeur */
  const [modalAmb, setModalAmb]           = useState(null);
  const [cashModes, setCashModes]         = useState({});
  const [validating, setValidating]       = useState(null);
  const [recalcLoading, setRecalcLoading] = useState(null);
  const [recalcMsgs, setRecalcMsgs]       = useState({});

  /* Modal suppression */
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError]     = useState("");
  const [deleting, setDeleting]           = useState(false);

  /* Modal reset MDP */
  const [resetLoading, setResetLoading]   = useState(null);
  const [resetResult, setResetResult]     = useState(null);

  /* Onglets */
  const [activeTab, setActiveTab]         = useState("membres");

  /* Demandes commissions */
  const [demandesComm, setDemandesComm]   = useState([]);
  const [demandesStats, setDemandesStats] = useState({});
  const [demandesFilter, setDemandesFilter] = useState("");
  const [demandesLoading, setDemandesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal]     = useState(null);
  const [rejectNote, setRejectNote]       = useState("");

  /* Clients finaux */
  const [clients, setClients]             = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsSearch, setClientsSearch] = useState("");
  const [clientsStatus, setClientsStatus] = useState("");
  const [clientsPage, setClientsPage]     = useState(1);
  const [clientsPagination, setClientsPagination] = useState(null);

  const stats = {
    total:    ambassadors.length,
    actifs:   ambassadors.filter(a => a.status === "ACTIVE").length,
    pending:  ambassadors.filter(a => a.status_validation === "pending" || !a.status_validation).length,
    cartes:   ambassadors.reduce((s, a) => s + Number(a.beneficiary_count || 0), 0),
    adhesions: ambassadors.reduce((s, a) => s + Number(a.membership_fee || 0), 0),
    diaspora: ambassadors.filter(a => a.role === "AMBASSADEUR_DIASPORA").length,
    pays:     ambassadors.filter(a => a.role === "AMBASSADEUR_PAYS").length,
    recruteurs: ambassadors.filter(a => a.role === "RECRUTEUR").length,
    clients_finaux: clientsPagination?.total ?? clients.length,
  };

  /* ── Filtrage ────────────────────────────────────────────── */
  useEffect(() => {
    let list = ambassadors;
    if (roleFilter !== "ALL")   list = list.filter(a => a.role === roleFilter);
    if (statusFilter !== "ALL") list = list.filter(a => a.status === statusFilter);
    if (validFilter !== "ALL") {
      if (validFilter === "pending")  list = list.filter(a => a.status_validation === "pending" || !a.status_validation);
      if (validFilter === "approved") list = list.filter(a => a.status_validation === "approved");
      if (validFilter === "rejected") list = list.filter(a => a.status_validation === "rejected");
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q) ||
        a.referral_code?.toLowerCase().includes(q) ||
        a.username?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [ambassadors, search, roleFilter, statusFilter, validFilter]);

  /* ── API calls (inchangés) ──────────────────────────────── */
  async function fetchAmbassadors() {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(`${API}/api/diaspora/admin/ambassadors`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setAmbassadors(data.ambassadors || []);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors du chargement");
    } finally { setLoading(false); }
  }
  useEffect(() => { fetchAmbassadors(); }, []);

  async function handleValidate(id, action, paymentMethod = null) {
    if (validating) return;
    setValidating(id);
    try {
      const body = { action };
      if (paymentMethod) body.paymentMethod = paymentMethod;
      await axios.patch(`${API}/api/diaspora/admin/ambassadors/${id}/validate`, body, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      await fetchAmbassadors();
      setModalAmb(null);
    } catch (e) {
      alert(e.response?.data?.error || "Erreur lors de la validation");
    } finally { setValidating(null); }
  }

  async function handleRecalc(amb) {
    if (!window.confirm(`Recalculer les commissions pour ${amb.name} ?`)) return;
    setRecalcLoading(amb.id);
    setRecalcMsgs(prev => ({ ...prev, [amb.id]: "" }));
    try {
      const { data } = await axios.post(
        `${API}/api/diaspora/admin/ambassadors/${amb.id}/recalc-commissions`, {},
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      setRecalcMsgs(prev => ({ ...prev, [amb.id]: "✅ " + (data.message || "Commissions calculées") }));
      fetchAmbassadors();
    } catch (err) {
      setRecalcMsgs(prev => ({ ...prev, [amb.id]: "❌ " + (err.response?.data?.error || "Erreur serveur") }));
    } finally { setRecalcLoading(null); }
  }

  async function toggleStatus(amb) {
    const newStatus = amb.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await axios.put(`${API}/api/diaspora/admin/ambassadors/${amb.id}/status`, { status:newStatus }, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      fetchAmbassadors();
      setModalAmb(null);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur mise à jour statut");
    }
  }

  async function handleDeleteAmbassador() {
    if (!deletePassword) { setDeleteError("Mot de passe requis"); return; }
    setDeleting(true); setDeleteError("");
    try {
      await axios.delete(`${API}/api/diaspora/admin/ambassadors/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
        data: { adminPassword: deletePassword },
      });
      setDeleteTarget(null); setDeletePassword("");
      fetchAmbassadors(); setModalAmb(null);
    } catch (e) {
      setDeleteError(e.response?.data?.error || "Erreur suppression");
    } finally { setDeleting(false); }
  }

  async function handleResetPassword(amb) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${amb.name} ?`)) return;
    setResetLoading(amb.id);
    try {
      const { data } = await axios.get(`${API}/api/diaspora/admin/ambassadors/${amb.id}/reset-password`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setResetResult({ name:amb.name, username:data.credentials?.username||amb.username, temp_password:data.credentials?.temp_password });
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la réinitialisation");
    } finally { setResetLoading(null); }
  }

  /* Demandes */
  async function fetchDemandes() {
    setDemandesLoading(true);
    try {
      const params = new URLSearchParams({ network:"DIASPORA", limit:100 });
      if (demandesFilter) params.set("status", demandesFilter);
      const { data } = await axios.get(`${API}/api/commissions/requests?${params}`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setDemandesComm(data.requests || data.data?.requests || []);
      setDemandesStats(data.stats   || data.data?.stats   || {});
    } catch (e) {
      console.error("fetchDemandes", e.message);
    } finally { setDemandesLoading(false); }
  }

  async function handleDemandeAction(id, action, note = "") {
    setActionLoading(id + action);
    try {
      await axios.patch(`${API}/api/commissions/requests/${id}`, { action, admin_note:note }, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setRejectModal(null); setRejectNote("");
      fetchDemandes();
    } catch (e) {
      alert(e.response?.data?.error || "Erreur action");
    } finally { setActionLoading(null); }
  }

  /* Clients */
  async function fetchClients() {
    setClientsLoading(true);
    try {
      const params = new URLSearchParams({ page:clientsPage, limit:30 });
      if (clientsSearch) params.set("search", clientsSearch);
      if (clientsStatus) params.set("status", clientsStatus);
      const { data } = await axios.get(`${API}/api/diaspora/admin/clients?${params}`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setClients(data.clients || []);
      setClientsPagination(data.pagination || null);
    } catch (e) {
      console.error("fetchClients diaspora", e.message);
    } finally { setClientsLoading(false); }
  }

  useEffect(() => { if (activeTab === "demandes") fetchDemandes(); }, [activeTab, demandesFilter]);
  useEffect(() => { if (activeTab === "clients") fetchClients(); }, [activeTab, clientsPage, clientsSearch, clientsStatus]);

  const inputStyle = { padding:"8px 12px", borderRadius:8, border:`1px solid ${C.line}`, fontSize:13, outline:"none", fontFamily:"inherit", background:C.paper, color:C.ink };

  /* ── Rendu ───────────────────────────────────────────────── */
  return (
    <div style={{ padding:"28px 24px", maxWidth:1080, margin:"0 auto", fontFamily:"-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif", background:C.canvas }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* En-tête */}
      <div style={{ marginBottom:22 }}>
        <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:700, color:C.teal, textTransform:"uppercase", letterSpacing:.8 }}>Organisation</p>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:C.ink }}>Réseau Diaspora</h1>
        <p style={{ margin:"4px 0 0", color:C.slate, fontSize:13 }}>Ambassadeur Diaspora → Ambassadeur Pays → Recruteur → Client</p>
      </div>

      {/* Stats — bande unifiée, pas de blocs pastel */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",
        background:C.paper, border:`1px solid ${C.line}`, borderRadius:12, marginBottom:20, overflow:"hidden",
      }}>
        {[
          { label:"Total",          value:stats.total },
          { label:"Actifs",         value:stats.actifs,         color:C.green },
          { label:"À valider",      value:stats.pending,        color:C.amber },
          { label:"Diaspora",       value:stats.diaspora,       color:C.ocean },
          { label:"Pays",           value:stats.pays,           color:C.green },
          { label:"Recruteurs",     value:stats.recruteurs,     color:C.amber },
          { label:"Cartes",         value:stats.cartes,         color:C.teal },
          { label:"Clients finaux", value:stats.clients_finaux, color:C.purple },
        ].map((s, i) => (
          <div key={s.label} style={{ padding:"14px 16px", borderLeft: i===0 ? "none" : `1px solid ${C.line}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              {s.color && <span style={{ width:6, height:6, borderRadius:"50%", background:s.color }} />}
              <p style={{ margin:0, fontSize:10.5, color:C.slate, fontWeight:600 }}>{s.label}</p>
            </div>
            <p style={{ margin:0, fontSize:20, fontWeight:700, color:C.ink, lineHeight:1 }}>{fmt(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Onglets — soulignés, pas de pilules colorées */}
      <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:`1px solid ${C.line}` }}>
        {[
          { id:"membres",  label:"Ambassadeurs" },
          { id:"clients",  label:"Clients finaux", badge:stats.clients_finaux||null },
          { id:"demandes", label:"Demandes commission", badge:demandesStats["PENDING"]||null },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding:"10px 4px", marginRight:22, border:"none", background:"transparent",
              borderBottom: activeTab===t.id ? `2px solid ${C.teal}` : "2px solid transparent",
              color: activeTab===t.id ? C.ink : C.slate,
              fontWeight: activeTab===t.id ? 700 : 500,
              fontSize:13.5, cursor:"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center", gap:8, transition:"all .15s",
            }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{ background:C.amberSoft, color:C.amber, borderRadius:5, padding:"1px 7px", fontSize:10.5, fontWeight:700 }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Onglet Clients ── */}
      {activeTab === "clients" && (
        <div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
            <div style={{ position:"relative", flex:1, minWidth:200 }}>
              <IconSearch style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.mist }} />
              <input placeholder="Rechercher nom, téléphone, numéro…" value={clientsSearch}
                onChange={e => { setClientsSearch(e.target.value); setClientsPage(1); }}
                style={{ ...inputStyle, width:"100%", boxSizing:"border-box", paddingLeft:34 }} />
            </div>
            <select value={clientsStatus} onChange={e => { setClientsStatus(e.target.value); setClientsPage(1); }} style={inputStyle}>
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="attente">En attente</option>
              <option value="suspendu">Suspendu</option>
            </select>
            <Btn variant="secondary" icon={<IconRefresh/>} onClick={fetchClients}>Actualiser</Btn>
          </div>
          {clientsLoading ? (
            <div style={{ textAlign:"center", padding:48 }}>
              <div style={{ width:28, height:28, border:`2.5px solid ${C.tealSoft}`, borderTop:`2.5px solid ${C.teal}`, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} />
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 20px", color:C.slate, background:C.paper, borderRadius:12, border:`1px solid ${C.line}` }}>
              <p style={{ fontWeight:600, fontSize:14, margin:"0 0 6px", color:C.ink }}>Aucun client final</p>
              <p style={{ fontSize:12, margin:0 }}>Les clients créés par les ambassadeurs diaspora apparaîtront ici.</p>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {clients.map(c => {
                  const sCfg = { actif:{label:"Actif",color:C.green}, attente:{label:"En attente",color:C.amber}, suspendu:{label:"Suspendu",color:C.red} }[c.status] || {label:c.status,color:C.slate};
                  const pCfg = c.status_payment === "paid" ? {label:"Payé",color:C.green} : {label:"Non payé",color:C.amber};
                  return (
                    <div key={c.id} style={{ background:C.paper, borderRadius:10, border:`1px solid ${C.line}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <Avatar name={c.name} color={C.purple} size={36} />
                        <div>
                          <p style={{ margin:0, fontWeight:600, color:C.ink, fontSize:13 }}>{c.name}</p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{c.phone}{c.city?` · ${c.city}`:""}</p>
                          <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>
                            <Chip color={C.ocean} dot={false}>{c.plan}</Chip>
                            <span style={{ fontSize:10.5, fontWeight:600, color:C.mist, fontFamily:"monospace" }}>{c.mutual_number}</span>
                            {c.ambassador_name && <span style={{ fontSize:10.5, color:C.mist }}>via {c.ambassador_name}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <Chip color={sCfg.color}>{sCfg.label}</Chip>
                          <Chip color={pCfg.color}>{pCfg.label}</Chip>
                        </div>
                        {c.expiration_date && <span style={{ fontSize:10.5, color:C.mist }}>Exp. {fmtDate(c.expiration_date)}</span>}
                        <span style={{ fontSize:10.5, color:C.mist }}>{fmtDate(c.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {clientsPagination?.pages > 1 && (
                <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, marginTop:18 }}>
                  <Btn variant="secondary" size="sm" disabled={clientsPage<=1} onClick={() => setClientsPage(p=>p-1)}>Précédent</Btn>
                  <span style={{ fontSize:12.5, color:C.slate }}>Page {clientsPage} / {clientsPagination.pages}</span>
                  <Btn variant="secondary" size="sm" disabled={clientsPage>=clientsPagination.pages} onClick={() => setClientsPage(p=>p+1)}>Suivant</Btn>
                </div>
              )}
              {clientsPagination && <p style={{ textAlign:"center", color:C.mist, fontSize:11.5, marginTop:12 }}>{clientsPagination.total} client(s) au total</p>}
            </>
          )}
        </div>
      )}

      {/* ── Onglet Demandes ── */}
      {activeTab === "demandes" && (
        <div>
          <div style={{ display:"flex", gap:1, flexWrap:"wrap", marginBottom:16, background:C.line, borderRadius:10, overflow:"hidden", border:`1px solid ${C.line}` }}>
            {[
              { label:"En attente", key:"PENDING",   color:C.amber },
              { label:"Validées",   key:"VALIDATED", color:C.ocean },
              { label:"Payées",     key:"PAID",       color:C.green },
              { label:"Rejetées",   key:"REJECTED",   color:C.red   },
            ].map(({ label, key, color }) => (
              <div key={key} onClick={() => setDemandesFilter(demandesFilter===key?"":key)}
                style={{ flex:"1 1 100px", background:C.paper, padding:"10px 14px", cursor:"pointer", opacity:demandesFilter&&demandesFilter!==key?.45:1, transition:"opacity .15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:color }} />
                  <div style={{ fontSize:11, color:C.slate, fontWeight:600 }}>{label}</div>
                </div>
                <div style={{ fontSize:17, fontWeight:700, color:C.ink }}>{demandesStats[key]||0}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <Btn variant="secondary" size="sm" icon={<IconRefresh/>} onClick={fetchDemandes}>Actualiser</Btn>
          </div>

          {demandesLoading ? (
            <div style={{ textAlign:"center", padding:48 }}>
              <div style={{ width:28, height:28, border:`2.5px solid ${C.tealSoft}`, borderTop:`2.5px solid ${C.teal}`, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }} />
            </div>
          ) : demandesComm.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 20px", color:C.slate, background:C.paper, borderRadius:12, border:`1px solid ${C.line}` }}>
              <p style={{ fontWeight:600, fontSize:14, margin:"0 0 6px", color:C.ink }}>Aucune demande</p>
              <p style={{ fontSize:12, margin:0 }}>Les demandes de retrait Diaspora apparaîtront ici.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {demandesComm.map(r => {
                const details = typeof r.payment_details==="string" ? JSON.parse(r.payment_details||"{}") : (r.payment_details||{});
                const ST = {
                  PENDING:   { label:"En attente", color:C.amber },
                  VALIDATED: { label:"Validée",    color:C.ocean },
                  PAID:      { label:"Payée",      color:C.green },
                  REJECTED:  { label:"Rejetée",    color:C.red   },
                };
                const st = ST[r.status] || ST.PENDING;
                return (
                  <div key={r.id} style={{ background:C.paper, borderRadius:10, border:`1px solid ${r.status==="PENDING"?C.amber+"44":C.line}`, padding:"14px 18px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <span style={{ fontSize:17, fontWeight:700, color:C.ink }}>{Number(r.amount_requested||0).toLocaleString("fr-FR")} FCFA</span>
                          <Chip color={st.color}>{st.label}</Chip>
                        </div>
                        <div style={{ fontSize:12, color:C.slate, marginBottom:4 }}>
                          Demande #{r.id} · {r.member_name||"—"} ({r.member_role||"Ambassadeur"}) · {r.adhesions_since_last} adhésions
                        </div>
                        <div style={{ fontSize:12, color:C.slate }}>
                          {r.payment_method==="mobile_money"&&`Mobile Money — ${details.operator||""} ${details.phone||""}`}
                          {r.payment_method==="virement"&&`Virement — ${details.name||""} — ${details.iban||details.bank||""}`}
                          {r.payment_method==="cash"&&"Espèces en agence"}
                          {" · "}{new Date(r.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}
                        </div>
                        {r.status==="REJECTED"&&r.admin_note&&(
                          <div style={{ marginTop:8, background:C.redSoft, borderRadius:8, padding:"6px 12px", fontSize:12, color:C.red, fontWeight:600 }}>Motif : {r.admin_note}</div>
                        )}
                        {r.validated_at&&<div style={{ fontSize:11, color:C.ocean, fontWeight:600, marginTop:6 }}>Validée le {new Date(r.validated_at).toLocaleDateString("fr-FR")}</div>}
                        {r.paid_at&&<div style={{ fontSize:11, color:C.green, fontWeight:600, marginTop:4 }}>Payée le {new Date(r.paid_at).toLocaleDateString("fr-FR")}</div>}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {r.status==="PENDING"&&(
                          <>
                            <Btn variant="primary" size="sm" disabled={!!actionLoading} onClick={()=>handleDemandeAction(r.id,"validate")}>
                              {actionLoading===r.id+"validate"?"…":"Valider"}
                            </Btn>
                            <Btn variant="danger" size="sm" onClick={()=>{setRejectModal({id:r.id,name:r.member_name||`#${r.id}`});setRejectNote("");}}>
                              Rejeter
                            </Btn>
                          </>
                        )}
                        {r.status==="VALIDATED"&&(
                          <Btn variant="primary" size="sm" disabled={!!actionLoading} onClick={()=>handleDemandeAction(r.id,"pay")}>
                            {actionLoading===r.id+"pay"?"…":"Marquer payée"}
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal rejet demande */}
          {rejectModal && (
            <div style={{ position:"fixed", inset:0, background:"rgba(16,24,40,.55)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <div style={{ background:C.paper, borderRadius:14, padding:"24px 22px", maxWidth:420, width:"100%", border:`1px solid ${C.line}` }}>
                <h3 style={{ margin:"0 0 10px", fontSize:16, fontWeight:700, color:C.ink }}>Rejeter la demande</h3>
                <p style={{ margin:"0 0 14px", fontSize:13, color:C.slate }}>Demande de <strong>{rejectModal.name}</strong> — motif (optionnel) :</p>
                <input placeholder="Motif du rejet…" value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                  style={{ ...inputStyle, width:"100%", boxSizing:"border-box", marginBottom:16, borderColor:C.red+"44" }} />
                <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                  <Btn variant="secondary" onClick={()=>setRejectModal(null)}>Annuler</Btn>
                  <Btn variant="dangerSolid" disabled={!!actionLoading} onClick={()=>handleDemandeAction(rejectModal.id,"reject",rejectNote)}>
                    {actionLoading?"…":"Rejeter"}
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Ambassadeurs ── */}
      {activeTab === "membres" && (
        <>
          <PendingValidationSection ambassadors={ambassadors} onValidate={handleValidate} />

          {/* Flux hiérarchique — remplace l'organigramme en blocs colorés */}
          <div style={{ background:C.paper, borderRadius:12, border:`1px solid ${C.line}`, padding:"16px 20px", marginBottom:20 }}>
            <p style={{ margin:"0 0 14px", fontWeight:700, color:C.ink, fontSize:12.5 }}>Organigramme du réseau</p>
            <div style={{ display:"flex", alignItems:"center", gap:0, flexWrap:"wrap" }}>
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{ display:"flex", alignItems:"center" }}>
                  <div style={{ textAlign:"center", minWidth:120 }}>
                    <p style={{ margin:"0 0 2px", fontWeight:700, fontSize:13, color:cfg.color }}>{cfg.short}</p>
                    <p style={{ margin:0, fontSize:11, color:C.slate }}>{ambassadors.filter(a=>a.role===key).length} membre(s)</p>
                  </div>
                  <div style={{ width:28, height:1, background:C.line, margin:"0 10px" }} />
                </div>
              ))}
              <div style={{ textAlign:"center", minWidth:100 }}>
                <p style={{ margin:"0 0 2px", fontWeight:700, fontSize:13, color:C.slate }}>Client</p>
                <p style={{ margin:0, fontSize:11, color:C.slate }}>{fmt(stats.cartes)} carte(s)</p>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div style={{ background:C.paper, borderRadius:10, border:`1px solid ${C.line}`, padding:"12px 14px", marginBottom:16, display:"flex", gap:10, flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:1, minWidth:200 }}>
              <IconSearch style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.mist }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, email, pays, code, username…"
                style={{ ...inputStyle, width:"100%", boxSizing:"border-box", paddingLeft:34 }} />
            </div>
            <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={inputStyle}>
              <option value="ALL">Tous les rôles</option>
              {Object.entries(ROLE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={inputStyle}>
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actifs</option>
              <option value="PENDING">En attente</option>
              <option value="SUSPENDED">Suspendus</option>
            </select>
            <select value={validFilter} onChange={e=>setValidFilter(e.target.value)} style={inputStyle}>
              <option value="ALL">Toutes validations</option>
              <option value="pending">À valider</option>
              <option value="approved">Validés</option>
              <option value="rejected">Rejetés</option>
            </select>
            <Btn variant="secondary" icon={<IconRefresh/>} onClick={fetchAmbassadors}>Actualiser</Btn>
          </div>

          {error && <div style={{ background:C.redSoft, color:C.red, padding:"11px 16px", borderRadius:10, marginBottom:16, fontSize:13 }}>{error}</div>}

          {/* Liste cartes */}
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
              <div style={{ width:32, height:32, border:`2.5px solid ${C.tealSoft}`, borderTop:`2.5px solid ${C.teal}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:C.slate, background:C.paper, borderRadius:12, border:`1px solid ${C.line}` }}>
              <p style={{ fontWeight:600, color:C.ink, fontSize:14, margin:"0 0 4px" }}>Aucun ambassadeur trouvé</p>
              <p style={{ fontSize:12, margin:0 }}>Ajustez vos filtres ou votre recherche.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.map(amb => (
                <AmbassadorCard key={amb.id} amb={amb} onClick={setModalAmb} />
              ))}
            </div>
          )}

          {!loading && (
            <p style={{ marginTop:16, textAlign:"center", color:C.mist, fontSize:11.5 }}>
              {filtered.length} ambassadeur(s) sur {ambassadors.length} au total
            </p>
          )}
        </>
      )}

      {/* ── Modal détail ambassadeur ── */}
      {modalAmb && (
        <AmbassadorModal
          amb={modalAmb}
          onClose={() => setModalAmb(null)}
          onValidate={handleValidate}
          validating={validating}
          onToggleStatus={toggleStatus}
          onResetPassword={handleResetPassword}
          resetLoading={resetLoading}
          onRecalc={handleRecalc}
          recalcLoading={recalcLoading}
          recalcMsg={recalcMsgs[modalAmb.id]}
          onDelete={(amb) => { setDeleteTarget(amb); setDeletePassword(""); setDeleteError(""); }}
          cashMode={!!cashModes[modalAmb.id]}
          onToggleCash={() => setCashModes(prev => ({ ...prev, [modalAmb.id]: !prev[modalAmb.id] }))}
        />
      )}

      {/* ── Modal reset MDP ── */}
      {resetResult && (
        <div style={{ position:"fixed", inset:0, background:"rgba(16,24,40,.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:700, padding:20 }}
          onClick={() => setResetResult(null)}>
          <div style={{ background:C.paper, borderRadius:16, padding:"26px 24px", width:"100%", maxWidth:420, border:`1px solid ${C.line}` }} onClick={e=>e.stopPropagation()}>
            <div style={{ marginBottom:18 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:C.ink }}>Mot de passe réinitialisé</h3>
              <p style={{ margin:"3px 0 0", fontSize:12, color:C.slate }}>{resetResult.name}</p>
            </div>
            <div style={{ background:C.amberSoft, border:`1px solid ${C.amber}33`, borderRadius:10, padding:"16px 18px", marginBottom:18, display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:10.5, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.5 }}>Identifiant</p>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.ink, fontFamily:"monospace", background:C.paper, padding:"8px 12px", borderRadius:8, border:`1px solid ${C.line}`, userSelect:"all" }}>{resetResult.username}</p>
              </div>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:10.5, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.5 }}>Mot de passe temporaire</p>
                <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.amber, fontFamily:"monospace", background:C.paper, padding:"8px 12px", borderRadius:8, border:`1px solid ${C.amber}44`, userSelect:"all", letterSpacing:1 }}>{resetResult.temp_password}</p>
              </div>
            </div>
            <div style={{ background:C.amberSoft, border:`1px solid ${C.amber}22`, borderRadius:8, padding:"10px 14px", marginBottom:18 }}>
              <p style={{ margin:0, fontSize:12, color:C.amber, fontWeight:600 }}>Communiquez ces informations directement à l'ambassadeur. Ce mot de passe ne sera plus affiché.</p>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={() => navigator.clipboard?.writeText(`Login: ${resetResult.username}\nMDP: ${resetResult.temp_password}`)}>Copier</Btn>
              <Btn variant="primary" onClick={() => setResetResult(null)}>Fermer</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal suppression ── */}
      {deleteTarget && (
        <div style={{ position:"fixed", inset:0, background:"rgba(16,24,40,.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:700, padding:20 }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ background:C.paper, borderRadius:16, padding:"26px 24px", width:"100%", maxWidth:440, border:`1px solid ${C.line}` }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:"0 0 16px", fontSize:16.5, fontWeight:700, color:C.ink }}>Suppression définitive</h3>
            <div style={{ background:C.redSoft, border:`1px solid ${C.red}22`, borderRadius:10, padding:"14px 16px", marginBottom:20 }}>
              <p style={{ margin:"0 0 4px", fontWeight:600, color:C.red, fontSize:13.5 }}>Supprimer l'ambassadeur « {deleteTarget.name} » ?</p>
              <p style={{ margin:0, fontSize:12, color:C.red }}>Cela supprimera définitivement ses bénéficiaires, paiements, commissions et notifications.</p>
              <p style={{ margin:"8px 0 0", fontSize:12, fontWeight:600, color:C.red }}>Cette action est irréversible.</p>
            </div>
            <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:C.slate, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Confirmez avec votre mot de passe admin</label>
            <input type="password" value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} placeholder="Votre mot de passe" autoFocus
              style={{ ...inputStyle, width:"100%", boxSizing:"border-box", marginBottom:12 }} />
            {deleteError && <div style={{ background:C.redSoft, border:`1px solid ${C.red}22`, borderRadius:8, padding:"10px 14px", color:C.red, fontSize:13, marginBottom:12 }}>{deleteError}</div>}
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="secondary" disabled={deleting} onClick={()=>setDeleteTarget(null)}>Annuler</Btn>
              <Btn variant="dangerSolid" disabled={deleting||!deletePassword} onClick={handleDeleteAmbassador}>
                {deleting?"Suppression…":"Supprimer définitivement"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
