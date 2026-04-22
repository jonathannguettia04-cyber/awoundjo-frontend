// src/pages/AdminCnepeci.jsx
// Admin CNEPECI — version complète et dynamique
// Nouvelles fonctions : Réinitialisation MDP, Validation cash, Suppression membre
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const agentToken = () =>
  localStorage.getItem("cnepeci_token") ||
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token");

const headers = () => ({ Authorization: `Bearer ${agentToken()}` });
const api = (method, url, data) =>
  axios({ method, url: `${API}${url}`, data, headers: headers() });

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  purple: "#7C3AED", purpleL: "#EDE9FE", purpleD: "#5B21B6",
  green:  "#059669", greenL:  "#D1FAE5",
  blue:   "#2563EB", blueL:   "#DBEAFE",
  gold:   "#D97706", goldL:   "#FEF3C7",
  orange: "#EA580C", orangeL: "#FED7AA",
  red:    "#DC2626", redL:    "#FEE2E2",
  slate:  "#64748B",
  dark:   "#0F172A",
  border: "#E2E8F0",
  bg:     "#F8FAFC",
  surface:"#FFFFFF",
  sidebar:"#0F0E17",
};

const fmt = n => Number(n || 0).toLocaleString("fr-FR");
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtShort = n => { const v = Number(n || 0); if (v >= 1000000) return (v / 1000000).toFixed(1) + "M"; if (v >= 1000) return Math.round(v / 1000) + "k"; return String(v); };

const ROLE_CONFIG = {
  BUREAU_CENTRALE:       { label: "Bureau Centrale",       icon: "🏛️", color: C.purple, bg: C.purpleL },
  COORDONNATEUR_GENERAL: { label: "Coordonnateur Général", icon: "🎯", color: C.green,  bg: C.greenL  },
  BUREAU_LOCAL:          { label: "Bureau Local",          icon: "🏢", color: C.blue,   bg: C.blueL   },
  COORDONNATEUR_LOCAL:   { label: "Coordonnateur Local",   icon: "📍", color: C.gold,   bg: C.goldL   },
  PASTEUR:               { label: "Pasteur d'Église",      icon: "⛪", color: C.orange, bg: C.orangeL },
  SOUSCRIPTEUR:          { label: "Souscripteur Final",    icon: "👤", color: C.slate,  bg: C.bg      },
};

// ── Composants de base ───────────────────────────────────────────────────────
function Spinner({ size = 28 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{ width: size, height: size, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.purple}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Toast({ type, msg, onClose }) {
  if (!msg) return null;
  const map = {
    error:   { bg: C.redL,    color: C.red,    border: "#FECACA", icon: "⚠️" },
    success: { bg: C.greenL,  color: C.green,  border: "#6EE7B7", icon: "✅" },
    info:    { bg: C.purpleL, color: C.purple, border: "#C4B5FD", icon: "ℹ️" },
    warning: { bg: C.goldL,   color: C.gold,   border: "#FCD34D", icon: "⚡" },
  };
  const c = map[type] || map.info;
  return (
    <div style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 10, padding: "11px 16px", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <span>{c.icon}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.color, fontSize: 16, padding: 0, lineHeight: 1, opacity: .7 }}>×</button>}
    </div>
  );
}

function Badge({ children, color, bg, size = 11 }) {
  return (
    <span style={{ background: bg, color, padding: "3px 10px", borderRadius: 999, fontSize: size, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
    </span>
  );
}

function RoleBadge({ role }) {
  const r = ROLE_CONFIG[role];
  if (!r) return null;
  return <Badge color={r.color} bg={r.bg}>{r.icon} {r.label}</Badge>;
}

function StatusBadge({ status }) {
  const s = status === "ACTIVE" || status === "actif"
    ? { label: "● Actif",      color: C.green,  bg: C.greenL }
    : status === "SUSPENDED" || status === "suspendu"
    ? { label: "● Suspendu",   color: C.red,    bg: C.redL }
    : { label: "● En attente", color: C.gold,   bg: C.goldL };
  return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
}

function TypeBadge({ type }) {
  const map = {
    adhesion:   { l: "Adhésion",   c: C.green,  b: C.greenL },
    cotisation: { l: "Cotisation", c: C.blue,   b: C.blueL  },
    bonus:      { l: "Bonus",      c: C.gold,   b: C.goldL  },
    bureau:     { l: "Bureau",     c: C.purple, b: C.purpleL},
  };
  const t = map[type] || { l: type, c: C.slate, b: C.bg };
  return <Badge color={t.c} bg={t.b}>{t.l}</Badge>;
}

function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden", transition: "transform .15s, box-shadow .15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: ".6px" }}>{label}</div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.dark, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.slate, marginTop: 6 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ marginTop: 10, fontSize: 11, color: trend >= 0 ? C.green : C.red, fontWeight: 700 }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs mois précédent
        </div>
      )}
    </div>
  );
}

// ── Modal générique ──────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,14,23,.6)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, borderRadius: 20, width, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.3)", animation: "modalIn .2s ease" }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}`}</style>
        <div style={{ padding: "22px 26px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{title}</div>
          <button onClick={onClose} style={{ background: C.bg, border: "none", cursor: "pointer", width: 32, height: 32, borderRadius: 8, fontSize: 18, color: C.slate, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "24px 26px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Confirmation dialog ──────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={420}>
      <div style={{ fontSize: 14, color: C.slate, marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading}
          style={{ padding: "10px 20px", border: "none", borderRadius: 10, background: danger ? C.red : C.purple, color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? .7 : 1 }}>
          {loading ? "⏳ En cours…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ── Actions membre (nouveau composant riche) ─────────────────────────────────
function MembreActions({ membre, onRefresh, onAlert }) {
  const [loading, setLoading] = useState(null);
  const [modal, setModal] = useState(null); // "suspend" | "reactivate" | "delete" | "reset"
  const [newPwd, setNewPwd] = useState("");

  const isActive = membre.statut === "ACTIVE" || membre.status === "ACTIVE";
  const mid = membre.id;

  const doAction = async (action, body = {}) => {
    setLoading(action);
    try {
      if (action === "delete") {
        await api("delete", `/api/cnepeci/admin/membres/${mid}`);
        onAlert({ type: "success", msg: `Membre ${membre.nom} supprimé avec succès.` });
      } else if (action === "reset") {
        await api("post", `/api/cnepeci/admin/membres/${mid}/reset-password`, { new_password: newPwd || undefined });
        onAlert({ type: "success", msg: `Mot de passe de ${membre.nom} réinitialisé.` });
        setNewPwd("");
      } else {
        await api("patch", `/api/cnepeci/admin/membres/${mid}/${action}`);
        onAlert({ type: "success", msg: `Membre ${action === "suspend" ? "suspendu" : "réactivé"} avec succès.` });
      }
      onRefresh();
    } catch (e) {
      onAlert({ type: "error", msg: e.response?.data?.message || `Erreur : ${action}` });
    } finally {
      setLoading(null);
      setModal(null);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {/* Suspend / Réactiver */}
        {isActive ? (
          <button onClick={() => setModal("suspend")}
            style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.red}44`, background: C.redL, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            ⏸ Suspendre
          </button>
        ) : (
          <button onClick={() => setModal("reactivate")}
            style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.green}44`, background: C.greenL, color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            ▶ Réactiver
          </button>
        )}

        {/* Reset MDP */}
        <button onClick={() => setModal("reset")}
          style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.gold}44`, background: C.goldL, color: C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          🔑 MDP
        </button>

        {/* Supprimer */}
        <button onClick={() => setModal("delete")}
          style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.red}`, background: "#fff", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          🗑
        </button>
      </div>

      {/* Modal suspend */}
      <ConfirmModal open={modal === "suspend"} onClose={() => setModal(null)}
        onConfirm={() => doAction("suspend")} loading={loading === "suspend"} danger
        title="Suspendre le membre" confirmLabel="Suspendre"
        message={`Voulez-vous suspendre ${membre.nom} ? Le membre ne pourra plus accéder à la plateforme jusqu'à réactivation.`} />

      {/* Modal réactiver */}
      <ConfirmModal open={modal === "reactivate"} onClose={() => setModal(null)}
        onConfirm={() => doAction("reactivate")} loading={loading === "reactivate"}
        title="Réactiver le membre" confirmLabel="Réactiver"
        message={`Voulez-vous réactiver ${membre.nom} ? Le membre pourra à nouveau accéder à la plateforme.`} />

      {/* Modal supprimer */}
      <ConfirmModal open={modal === "delete"} onClose={() => setModal(null)}
        onConfirm={() => doAction("delete")} loading={loading === "delete"} danger
        title="⚠️ Supprimer le membre" confirmLabel="Supprimer définitivement"
        message={`Vous êtes sur le point de SUPPRIMER définitivement ${membre.nom} (${membre.email}). Cette action est irréversible et supprimera toutes ses données associées.`} />

      {/* Modal reset MDP */}
      <Modal open={modal === "reset"} onClose={() => setModal(null)} title="🔑 Réinitialiser le mot de passe" width={440}>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 18 }}>
          Réinitialiser le mot de passe de <strong>{membre.nom}</strong>. Laissez vide pour générer automatiquement.
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>Nouveau mot de passe (optionnel)</label>
          <input type="text" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Laisser vide = généré automatiquement"
            style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => setModal(null)} style={{ padding: "10px 20px", border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
          <button onClick={() => doAction("reset")} disabled={loading === "reset"}
            style={{ padding: "10px 20px", border: "none", borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, #B45309)`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading === "reset" ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading === "reset" ? .7 : 1 }}>
            {loading === "reset" ? "⏳ En cours…" : "🔑 Réinitialiser"}
          </button>
        </div>
      </Modal>
    </>
  );
}

// ── Tableau membres ──────────────────────────────────────────────────────────
function MembresTable({ membres, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [alert, setAlert] = useState(null);
  const [selected, setSelected] = useState(null);

  const filtered = membres.filter(m => {
    const matchSearch = !search ||
      m.nom?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search);
    const matchRole = filterRole === "ALL" || m.role === filterRole;
    const status = m.statut || m.status;
    const matchStatus = filterStatus === "ALL" || status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div>
      {alert && <Toast type={alert.type} msg={alert.msg} onClose={() => setAlert(null)} />}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input placeholder="🔍 Rechercher nom, email, téléphone…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: "9px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", background: C.bg }} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ padding: "9px 13px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none" }}>
          <option value="ALL">Tous les rôles</option>
          {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "9px 13px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none" }}>
          <option value="ALL">Tous les statuts</option>
          <option value="ACTIVE">● Actifs</option>
          <option value="SUSPENDED">● Suspendus</option>
          <option value="PENDING">● En attente</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Membre", "Rôle", "Contact", "Statut", "Parrain", "Inscription", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: C.slate }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>Aucun membre trouvé
              </td></tr>
            ) : filtered.map((m, i) => {
              const rc = ROLE_CONFIG[m.role];
              return (
                <tr key={m.id || i} style={{ borderBottom: `1px solid ${C.border}`, transition: "background .1s", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  onClick={() => setSelected(selected?.id === m.id ? null : m)}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: (rc?.color || C.purple) + "18", color: rc?.color || C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {m.nom?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: C.dark }}>{m.nom || "—"}</div>
                        {m.code_invitation && <div style={{ fontSize: 10, color: C.purple, fontFamily: "monospace", marginTop: 1 }}>#{m.code_invitation}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}><RoleBadge role={m.role} /></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ color: C.dark, fontSize: 12 }}>{m.email}</div>
                    <div style={{ color: C.slate, fontSize: 11, marginTop: 2 }}>{m.phone || "—"}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={m.statut || m.status} /></td>
                  <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12 }}>{m.parrain_nom || "—"}</td>
                  <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(m.created_at)}</td>
                  <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                    <MembreActions membre={m} onRefresh={onRefresh} onAlert={setAlert} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ligne détail étendue */}
      {selected && (
        <div style={{ background: C.purpleL, border: `1px solid ${C.purple}33`, borderRadius: 12, padding: "16px 20px", marginTop: 12, display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>Détails — {selected.nom}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["ID", selected.id], ["Code", selected.code_invitation || "—"], ["Rôle", ROLE_CONFIG[selected.role]?.label], ["Inscrit le", fmtDate(selected.created_at)]].map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 10, color: C.slate, marginBottom: 2 }}>{k}</div><div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div>
            <button onClick={() => setSelected(null)} style={{ padding: "6px 14px", border: `1px solid ${C.border}`, borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.slate, fontFamily: "inherit" }}>Fermer</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: C.slate, marginTop: 10 }}>
        <strong>{filtered.length}</strong> membre{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        {membres.length !== filtered.length && ` sur ${membres.length} total`}
      </div>
    </div>
  );
}

// ── Tableau paiements avec validation cash ────────────────────────────────────
function PaiementsTable({ paiements, onRefresh, onAlert }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(null);
  const [modal, setModal] = useState(null); // { type: "validate"|"reject", paiement }

  const filtered = paiements.filter(p => {
    const matchSearch = !search ||
      p.membre_nom?.toLowerCase().includes(search.toLowerCase()) ||
      p.tx_ref?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || p.statut === filterStatus || p.status === filterStatus;
    const matchType = filterType === "ALL" || p.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleValidateCash = async (paiement, action) => {
    setLoading(paiement.id + action);
    try {
      await api("patch", `/api/cnepeci/admin/paiements/${paiement.id}/${action}`);
      onAlert({ type: "success", msg: `Paiement ${action === "validate" ? "validé" : "rejeté"} avec succès.` });
      onRefresh();
    } catch (e) {
      onAlert({ type: "error", msg: e.response?.data?.message || "Erreur lors de l'action." });
    } finally {
      setLoading(null);
      setModal(null);
    }
  };

  const pendingCount = paiements.filter(p => p.statut === "pending" || p.status === "pending").length;

  return (
    <div>
      {pendingCount > 0 && (
        <div style={{ background: C.goldL, border: `1px solid ${C.gold}44`, borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{pendingCount} paiement{pendingCount > 1 ? "s" : ""} en attente de validation</div>
            <div style={{ fontSize: 12, color: "#92400E", marginTop: 2 }}>Filtrez par "En attente" pour les voir et les traiter.</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input placeholder="🔍 Rechercher membre, référence…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: "9px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", background: C.bg }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "9px 13px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none" }}>
          <option value="ALL">Tous statuts</option>
          <option value="success">✅ Validés</option>
          <option value="pending">⏳ En attente</option>
          <option value="failed">❌ Échoués</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: "9px 13px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none" }}>
          <option value="ALL">Tous types</option>
          <option value="adhesion">Adhésion</option>
          <option value="cotisation">Cotisation</option>
        </select>
      </div>

      <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Date", "Membre", "Type", "Montant", "Méthode", "Référence", "Statut", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: C.slate }}>Aucun paiement trouvé</td></tr>
            ) : filtered.map((p, i) => {
              const isPending = p.statut === "pending" || p.status === "pending";
              const isSuccess = p.statut === "success" || p.status === "success" || p.statut === "paid";
              return (
                <tr key={p.id || i} style={{ borderBottom: `1px solid ${C.border}`, background: isPending ? "#FFFDF0" : "#fff", transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = isPending ? "#FEF9C3" : C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = isPending ? "#FFFDF0" : "#fff"}>
                  <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(p.created_at)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, color: C.dark, fontSize: 13 }}>{p.membre_nom || "—"}</div>
                    {p.membre_role && <div style={{ fontSize: 10, color: C.slate, marginTop: 1 }}>{ROLE_CONFIG[p.membre_role]?.label}</div>}
                  </td>
                  <td style={{ padding: "12px 14px" }}><TypeBadge type={p.type} /></td>
                  <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 800, color: C.dark }}>{fmt(p.montant)} F</td>
                  <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12, textTransform: "capitalize" }}>{p.payment_method || "cash"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>{(p.tx_ref || p.transaction_reference || "—").substring(0, 14)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge color={isSuccess ? C.green : isPending ? C.gold : C.red} bg={isSuccess ? C.greenL : isPending ? C.goldL : C.redL}>
                      {isSuccess ? "● Validé" : isPending ? "⏳ En attente" : "❌ Échoué"}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {isPending && (
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => setModal({ type: "validate", paiement: p })}
                          style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.green}44`, background: C.greenL, color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                          ✅ Valider
                        </button>
                        <button onClick={() => setModal({ type: "reject", paiement: p })}
                          style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.red}44`, background: C.redL, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal validation cash */}
      <ConfirmModal
        open={!!modal}
        onClose={() => setModal(null)}
        onConfirm={() => handleValidateCash(modal.paiement, modal?.type === "validate" ? "validate" : "reject")}
        loading={loading !== null}
        danger={modal?.type === "reject"}
        title={modal?.type === "validate" ? "✅ Valider le paiement cash" : "❌ Rejeter le paiement"}
        confirmLabel={modal?.type === "validate" ? "Valider le paiement" : "Rejeter"}
        message={modal?.type === "validate"
          ? `Valider le paiement cash de ${modal?.paiement?.membre_nom || "ce membre"} — ${fmt(modal?.paiement?.montant)} F ? Cela déclenchera automatiquement les commissions.`
          : `Rejeter le paiement de ${modal?.paiement?.membre_nom || "ce membre"} — ${fmt(modal?.paiement?.montant)} F ? Le membre sera notifié.`}
      />
    </div>
  );
}

// ── Tableau commissions ───────────────────────────────────────────────────────
function CommissionsTable({ commissions }) {
  const [search, setSearch] = useState("");
  const filtered = commissions.filter(c => !search || c.membre_nom?.toLowerCase().includes(search.toLowerCase()) || c.source_nom?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <input placeholder="🔍 Rechercher membre, source…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 14, padding: "9px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: C.bg }} />
      <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Date", "Bénéficiaire", "Type", "Source", "Montant"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: C.slate, fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: C.slate }}>Aucune commission trouvée</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id || i} style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12 }}>{fmtDate(c.created_at)}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 600, color: C.dark }}>{c.membre_nom || c.beneficiaire_nom || "—"}</div>
                  <div style={{ fontSize: 10, color: C.slate, marginTop: 1 }}>{ROLE_CONFIG[c.membre_role]?.label || c.role}</div>
                </td>
                <td style={{ padding: "12px 14px" }}><TypeBadge type={c.type} /></td>
                <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12 }}>{c.source_nom || "—"}</td>
                <td style={{ padding: "12px 14px", fontSize: 15, fontWeight: 800, color: C.gold }}>{fmt(c.montant)} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminCnepeci() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [membres, setMembres] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [bureauCentrale, setBureauCentrale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchOverlay, setSearchOverlay] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, membresRes, paiementsRes, commissionsRes, bureauRes] = await Promise.allSettled([
        api("get", "/api/cnepeci/admin/stats"),
        api("get", "/api/cnepeci/admin/membres"),
        api("get", "/api/cnepeci/paiements?limit=200"),
        api("get", "/api/cnepeci/commissions?limit=200"),
        api("get", "/api/cnepeci/admin/bureau-centrale"),
      ]);
      if (statsRes.status === "fulfilled")       setStats(statsRes.value.data?.data || statsRes.value.data || null);
      if (membresRes.status === "fulfilled")     setMembres(membresRes.value.data?.membres || membresRes.value.data?.data || []);
      if (paiementsRes.status === "fulfilled")   setPaiements(paiementsRes.value.data?.paiements || paiementsRes.value.data?.data || []);
      if (commissionsRes.status === "fulfilled") setCommissions(commissionsRes.value.data?.commissions || commissionsRes.value.data?.data || []);
      if (bureauRes.status === "fulfilled")      setBureauCentrale(bureauRes.value.data?.data || null);
    } catch { setAlert({ type: "error", msg: "Erreur lors du chargement des données." }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCalculerBonus = async () => {
    if (!window.confirm("Déclencher le calcul du bonus mensuel CNEPECI (1,5%) pour tous les membres actifs ?")) return;
    setBonusLoading(true);
    try {
      const res = await api("post", "/api/cnepeci/admin/calcul-bonus");
      setAlert({ type: "success", msg: res.data?.message || "Bonus mensuel calculé avec succès !" });
      loadAll();
    } catch (e) {
      setAlert({ type: "error", msg: e.response?.data?.message || "Erreur lors du calcul du bonus." });
    } finally { setBonusLoading(false); }
  };

  const roleCount = membres.reduce((acc, m) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {});
  const totalCA = paiements.filter(p => p.statut === "success" || p.status === "success").reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);
  const totalCommissions = commissions.reduce((s, c) => s + (parseFloat(c.montant) || 0), 0);
  const pendingPaiements = paiements.filter(p => p.statut === "pending" || p.status === "pending").length;
  const activeMembers = membres.filter(m => m.statut === "ACTIVE" || m.status === "ACTIVE").length;

  const TABS = [
    { id: "overview",    label: "📊 Vue d'ensemble" },
    { id: "membres",     label: `👥 Membres`, count: membres.length },
    { id: "paiements",   label: `💰 Paiements`, count: paiements.length, alert: pendingPaiements },
    { id: "commissions", label: `🏆 Commissions` },
    { id: "bureau",      label: "🏛️ Bureau Centrale" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 0 rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.purple}, ${C.purpleD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⛪</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, letterSpacing: "-.3px" }}>Réseau CNEPECI</div>
            <div style={{ fontSize: 11, color: C.slate }}>Administration — Tableau de bord</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {pendingPaiements > 0 && (
            <div onClick={() => setTab("paiements")} style={{ background: C.goldL, color: C.gold, border: `1px solid ${C.gold}44`, borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              ⚡ {pendingPaiements} en attente
            </div>
          )}
          <button onClick={loadAll}
            style={{ padding: "9px 16px", border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: C.slate, display: "flex", alignItems: "center", gap: 6 }}>
            🔄 Actualiser
          </button>
          <button onClick={handleCalculerBonus} disabled={bonusLoading}
            style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: bonusLoading ? C.bg : `linear-gradient(135deg, ${C.purple}, ${C.purpleD})`, color: bonusLoading ? C.slate : "#fff", fontWeight: 700, fontSize: 13, cursor: bonusLoading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, boxShadow: bonusLoading ? "none" : `0 4px 14px ${C.purple}44` }}>
            {bonusLoading ? "⏳ Calcul…" : "🎁 Calculer Bonus (1,5%)"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px" }}>
        {alert && <Toast type={alert.type} msg={alert.msg} onClose={() => setAlert(null)} />}

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `2px solid ${C.border}`, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "11px 20px", border: "none", borderBottom: tab === t.id ? `2px solid ${C.purple}` : "2px solid transparent", background: "none", color: tab === t.id ? C.purple : C.slate, fontWeight: tab === t.id ? 800 : 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: -2, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8, transition: "color .15s" }}>
              {t.label}
              {t.count !== undefined && (
                <span style={{ background: tab === t.id ? C.purpleL : C.bg, color: tab === t.id ? C.purple : C.slate, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{t.count}</span>
              )}
              {t.alert > 0 && (
                <span style={{ background: C.gold, color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{t.alert}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : (
          <div style={{ animation: "fadeIn .2s ease" }} key={tab}>

            {/* ════ TAB : VUE D'ENSEMBLE ════ */}
            {tab === "overview" && (
              <div>
                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16, marginBottom: 28 }}>
                  <StatCard icon="👥" label="Membres actifs" value={fmt(activeMembers)} sub={`${membres.length} inscrits au total`} color={C.purple} trend={8} />
                  <StatCard icon="💰" label="CA total"       value={`${fmtShort(totalCA)} F`} sub="Paiements validés" color={C.green} />
                  <StatCard icon="🏆" label="Commissions"    value={`${fmtShort(totalCommissions)} F`} sub="Toutes confondues" color={C.gold} />
                  <StatCard icon="📋" label="Paiements"      value={fmt(paiements.length)} sub={`${paiements.filter(p => p.statut === "success").length} validés, ${pendingPaiements} en attente`} color={C.blue} />
                </div>

                {/* Répartition par rôle */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 18 }}>Répartition par rôle</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                        const count = roleCount[role] || 0;
                        const pct = membres.length ? Math.round(count / membres.length * 100) : 0;
                        return (
                          <div key={role}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{config.icon} {config.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: config.color }}>{count}</span>
                            </div>
                            <div style={{ height: 6, background: C.border, borderRadius: 4 }}>
                              <div style={{ height: 6, background: config.color, borderRadius: 4, width: `${pct}%`, transition: "width .5s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {stats && (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 18 }}>Statistiques réseau</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {Object.entries(stats).map(([key, val]) => (
                          <div key={key} style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{key.replace(/_/g, " ")}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{typeof val === "number" ? fmt(val) : String(val)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions rapides */}
                <div style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleD} 100%)`, borderRadius: 16, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Actions rapides</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Gérez votre réseau efficacement</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      { label: "👥 Voir les membres", action: () => setTab("membres") },
                      { label: "⚡ Paiements en attente", action: () => setTab("paiements") },
                      { label: "🎁 Calculer le bonus", action: handleCalculerBonus },
                    ].map((a, i) => (
                      <button key={i} onClick={a.action}
                        style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(4px)", transition: "all .15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.22)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB : MEMBRES ════ */}
            {tab === "membres" && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>Membres du réseau</div>
                    <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>{membres.length} membre{membres.length > 1 ? "s" : ""} inscrits</div>
                  </div>
                </div>
                <MembresTable membres={membres} onRefresh={loadAll} />
              </div>
            )}

            {/* ════ TAB : PAIEMENTS ════ */}
            {tab === "paiements" && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>Gestion des paiements</div>
                    <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>Validation des paiements cash et suivi des transactions</div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{fmtShort(totalCA)} F</div>
                      <div style={{ fontSize: 10, color: C.slate }}>CA validé</div>
                    </div>
                  </div>
                </div>
                <PaiementsTable paiements={paiements} onRefresh={loadAll} onAlert={setAlert} />
              </div>
            )}

            {/* ════ TAB : COMMISSIONS ════ */}
            {tab === "commissions" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                  <StatCard icon="🏆" label="Total commissions" value={`${fmtShort(totalCommissions)} F`} sub={`${commissions.length} entrées`} color={C.gold} />
                  <StatCard icon="🎁" label="Bonus versés" value={`${fmtShort(commissions.filter(c => c.type === "bonus").reduce((s, c) => s + (parseFloat(c.montant) || 0), 0))} F`} sub="Bonus 1,5% mensuel" color={C.purple} />
                  <StatCard icon="🤝" label="Commissions adhésion" value={`${fmtShort(commissions.filter(c => c.type === "adhesion").reduce((s, c) => s + (parseFloat(c.montant) || 0), 0))} F`} sub="10% par adhésion" color={C.green} />
                  <StatCard icon="💳" label="Commissions cotisation" value={`${fmtShort(commissions.filter(c => c.type === "cotisation").reduce((s, c) => s + (parseFloat(c.montant) || 0), 0))} F`} sub="5% par cotisation" color={C.blue} />
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 18 }}>Détail des commissions</div>
                  <CommissionsTable commissions={commissions} />
                </div>
              </div>
            )}

            {/* ════ TAB : BUREAU CENTRALE ════ */}
            {tab === "bureau" && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 20 }}>🏛️ Bureau Centrale & Coordonnateurs Généraux</div>
                {!bureauCentrale ? (
                  <div style={{ textAlign: "center", padding: 48, color: C.slate, fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>Aucune donnée disponible
                  </div>
                ) : (
                  <div>
                    {bureauCentrale.coordonnateurs_generaux?.length > 0 && (
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 14 }}>🎯 Coordonnateurs Généraux ({bureauCentrale.coordonnateurs_generaux.length})</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                          {bureauCentrale.coordonnateurs_generaux.map((m, i) => (
                            <div key={i} style={{ background: C.greenL, border: `1px solid ${C.green}33`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, transition: "transform .15s" }}
                              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                              onMouseLeave={e => e.currentTarget.style.transform = ""}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.green + "22", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                                {m.nom?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{m.nom}</div>
                                <div style={{ color: C.slate, fontSize: 11, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                                <div style={{ marginTop: 6 }}><StatusBadge status={m.statut || m.status} /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bureauCentrale.membres_bureau?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 14 }}>🏛️ Membres Bureau Centrale ({bureauCentrale.membres_bureau.length})</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                          {bureauCentrale.membres_bureau.map((m, i) => (
                            <div key={i} style={{ background: C.purpleL, border: `1px solid ${C.purple}33`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, transition: "transform .15s" }}
                              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                              onMouseLeave={e => e.currentTarget.style.transform = ""}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.purple + "22", color: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                                {m.nom?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>{m.nom}</div>
                                <div style={{ color: C.slate, fontSize: 11, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                                <div style={{ marginTop: 6 }}><StatusBadge status={m.statut || m.status} /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bureauCentrale.stats && (
                      <div style={{ background: C.bg, borderRadius: 14, padding: "18px 20px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>Statistiques bureau</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                          {Object.entries(bureauCentrale.stats).map(([key, val]) => (
                            <div key={key} style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", border: `1px solid ${C.border}` }}>
                              <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{key.replace(/_/g, " ")}</div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>{typeof val === "number" ? fmt(val) : String(val)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
