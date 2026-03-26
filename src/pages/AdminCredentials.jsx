// src/pages/AdminCredentials.jsx
// ─────────────────────────────────────────────────────────────
//  Page Admin : Gestion des credentials des deux réseaux
//  DIASPORA  : Amb. Diaspora → Amb. Pays → Recruteur
//  REFERRAL  : RUM → Leader → Pasteur → Responsable
//  API réelle : diasporaAdminAPI (diasporaApi.js)
//  Le réseau Fédération utilise la même table ambassadeurs
//  filtrée par rôle (RUM | LEADER | PASTEUR | RESPONSABLE)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Eye, EyeOff, Copy, Key,
  Users, Globe, Network,
  ChevronDown, ChevronUp,
  Shield, AlertCircle, CheckCircle, X, Loader2,
  Download, MoreVertical, RefreshCw,
} from "lucide-react";
import { diasporaAdminAPI } from "../diasporaApi";

// ── Constantes rôles ──────────────────────────────────────────
const DIASPORA_ROLES = ["AMBASSADEUR_DIASPORA", "AMBASSADEUR_PAYS", "RECRUTEUR"];
const REFERRAL_ROLES = ["RUM", "LEADER", "PASTEUR", "RESPONSABLE"];

const ROLE_LABELS = {
  AMBASSADEUR_DIASPORA: "Amb. Diaspora",
  AMBASSADEUR_PAYS:     "Amb. Pays",
  RECRUTEUR:            "Recruteur",
  RUM:                  "RUM",
  LEADER:               "Leader",
  PASTEUR:              "Pasteur",
  RESPONSABLE:          "Responsable",
};

const ROLE_COLORS = {
  AMBASSADEUR_DIASPORA: "bg-blue-100 text-blue-700 border-blue-200",
  AMBASSADEUR_PAYS:     "bg-indigo-100 text-indigo-700 border-indigo-200",
  RECRUTEUR:            "bg-violet-100 text-violet-700 border-violet-200",
  RUM:                  "bg-emerald-100 text-emerald-700 border-emerald-200",
  LEADER:               "bg-teal-100 text-teal-700 border-teal-200",
  PASTEUR:              "bg-cyan-100 text-cyan-700 border-cyan-200",
  RESPONSABLE:          "bg-sky-100 text-sky-700 border-sky-200",
};

const STATUS_CONFIG = {
  active:    { label: "Actif",    bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  inactive:  { label: "Inactif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  suspended: { label: "Suspendu",bg: "bg-red-100",   text: "text-red-700",   dot: "bg-red-500"   },
};

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function initials(name = "") {
  return name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

// ── Badge rôle ────────────────────────────────────────────────
function Badge({ role }) {
  const cls = ROLE_COLORS[role] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

// ── Badge statut ──────────────────────────────────────────────
function StatusDot({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium animate-slide-up
      ${type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
      {type === "success"
        ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Modal confirmation reset ──────────────────────────────────
function ResetModal({ agent, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Réinitialiser le mot de passe</h3>
            <p className="text-xs text-slate-500">Un mot de passe temporaire sera généré</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 mb-5 text-sm text-slate-600">
          Vous allez réinitialiser le mot de passe de{" "}
          <span className="font-semibold text-slate-900">{agent?.name}</span>.
          L'utilisateur devra le modifier à sa prochaine connexion.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ligne agent ───────────────────────────────────────────────
function AgentRow({ agent, onReset, onCopy, showPwd, togglePwd, loadingReset }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const id = agent.id || agent._id;

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
      {/* Identité */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
            {initials(agent.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 leading-tight">{agent.name}</p>
            <p className="text-xs text-slate-400 font-mono">{id}</p>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-600 font-mono truncate max-w-[190px]">{agent.email}</span>
          <button
            onClick={() => onCopy(agent.email, "Email copié !")}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
            title="Copier l'email"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
        {agent.phone && (
          <p className="text-xs text-slate-400 mt-0.5">{agent.phone}</p>
        )}
      </td>

      {/* Rôle */}
      <td className="py-3.5 px-4">
        <Badge role={agent.role} />
      </td>

      {/* Statut */}
      <td className="py-3.5 px-4">
        <StatusDot status={agent.status || "active"} />
      </td>

      {/* Mot de passe temporaire */}
      <td className="py-3.5 px-4">
        {agent.tempPassword ? (
          <div className="flex items-center gap-2">
            <code className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-lg font-mono tracking-wider">
              {showPwd ? agent.tempPassword : "••••••••••••"}
            </code>
            <button
              onClick={() => togglePwd(id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onCopy(agent.tempPassword, "Mot de passe copié !")}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Copier"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">défini par l'utilisateur</span>
        )}
        <p className="text-xs text-slate-400 mt-0.5">
          Dernière co. : {fmtDate(agent.lastLogin || agent.lastLoginAt)}
        </p>
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-slate-100 py-1 w-48 animate-slide-up">
              <button
                onClick={() => { onReset(agent); setMenuOpen(false); }}
                disabled={loadingReset}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" /> Réinitialiser MDP
              </button>
              <button
                onClick={() => { onCopy(agent.email, "Email copié !"); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copier l'email
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Tableau réseau ────────────────────────────────────────────
function NetworkTable({
  agents, onReset, onCopy, showPwdMap, togglePwd, resetingId,
  title, icon: Icon, accent, roles,
}) {
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [collapsed, setCollapsed]     = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const filtered = agents.filter(a => {
    const q         = search.toLowerCase();
    const id        = String(a.id || a._id || "");
    const matchQ    = !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || id.includes(q);
    const matchRole = roleFilter   === "ALL" || a.role === roleFilter;
    const matchStat = statusFilter === "ALL" || (a.status || "active") === statusFilter;
    return matchQ && matchRole && matchStat;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* En-tête */}
      <div className={`flex items-center justify-between px-5 py-4 border-b border-slate-100 ${accent}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/80 rounded-xl shadow-sm">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
            <p className="text-xs text-slate-500">{filtered.length} / {agents.length} utilisateurs</p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
        >
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-slate-500" />
            : <ChevronUp   className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Nom, email, ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Tous les rôles</option>
              {roles.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Utilisateur", "Contact", "Rôle", "Statut", "Mot de passe", "Actions"].map(h => (
                    <th
                      key={h}
                      className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-400">Aucun résultat</p>
                    </td>
                  </tr>
                ) : filtered.map(a => (
                  <AgentRow
                    key={a.id || a._id}
                    agent={a}
                    onReset={setResetTarget}
                    onCopy={onCopy}
                    showPwd={showPwdMap[a.id || a._id]}
                    togglePwd={togglePwd}
                    loadingReset={resetingId === (a.id || a._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal reset */}
      {resetTarget && (
        <ResetModal
          agent={resetTarget}
          onConfirm={() => { onReset(resetTarget); setResetTarget(null); }}
          onCancel={() => setResetTarget(null)}
          loading={resetingId === (resetTarget.id || resetTarget._id)}
        />
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function AdminCredentials() {
  const [allAgents, setAllAgents]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [showPwdMap, setShowPwdMap] = useState({});   // { agentId: bool }
  const [resetingId, setResetingId] = useState(null);
  const [toast, setToast]           = useState(null);

  // ── Chargement initial ──────────────────────────────────────
  const fetchAgents = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      // GET /api/diaspora/admin/ambassadors?limit=500
      const res = await diasporaAdminAPI.getAll({ limit: 500 });
      // Adapte selon la structure réelle retournée par ton API :
      //   res.data.ambassadors  |  res.data.data  |  res.data (tableau)
      const list = res.data?.ambassadors ?? res.data?.data ?? res.data ?? [];
      setAllAgents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("AdminCredentials — fetch error:", err);
      setError(err.response?.data?.message || "Impossible de charger les agents.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // ── Réinitialisation mot de passe ───────────────────────────
  const handleReset = useCallback(async (agent) => {
    const id = agent.id || agent._id;
    setResetingId(id);
    try {
      // POST /api/diaspora/admin/ambassadors/:id/reset-password
      const res = await diasporaAdminAPI.resetPassword(id);
      // Le backend peut retourner tempPassword | password | newPassword
      const pwd = res.data?.tempPassword ?? res.data?.password ?? res.data?.newPassword;
      if (pwd) {
        setAllAgents(prev =>
          prev.map(a => (a.id || a._id) === id ? { ...a, tempPassword: pwd } : a)
        );
        setShowPwdMap(prev => ({ ...prev, [id]: true }));
        setToast({ message: `MDP réinitialisé pour ${agent.name}`, type: "success" });
      } else {
        setToast({ message: "Réinitialisation effectuée", type: "success" });
      }
    } catch (err) {
      console.error("AdminCredentials — reset error:", err);
      setToast({ message: err.response?.data?.message || "Erreur lors de la réinitialisation", type: "error" });
    } finally {
      setResetingId(null);
    }
  }, []);

  // ── Copie presse-papiers ────────────────────────────────────
  const handleCopy = useCallback((text, msg = "Copié !") => {
    navigator.clipboard?.writeText(text)
      .then(() => setToast({ message: msg, type: "success" }))
      .catch(() => setToast({ message: "Échec de la copie", type: "error" }));
  }, []);

  const togglePwd = useCallback((id) => {
    setShowPwdMap(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ── Partition Diaspora / Referral ───────────────────────────
  const diasporaAgents = allAgents.filter(a => DIASPORA_ROLES.includes(a.role));
  const referralAgents = allAgents.filter(a => REFERRAL_ROLES.includes(a.role));

  const stats = {
    total:       allAgents.length,
    active:      allAgents.filter(a => (a.status || "active") === "active").length,
    withTempPwd: allAgents.filter(a => a.tempPassword).length,
    suspended:   allAgents.filter(a => a.status === "suspended").length,
  };

  // ── États de chargement / erreur ────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Chargement des credentials…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="p-3 bg-red-100 rounded-2xl">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-slate-700 font-medium">{error}</p>
          <button
            onClick={() => fetchAgents()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ── Rendu principal ─────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.22s ease-out; }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Credentials</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Consultez et réinitialisez les accès des deux réseaux ambassadeurs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAgents(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setToast({ message: "Export en cours de développement", type: "error" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total agents",    value: stats.total,       icon: Users,       color: "text-slate-700", bg: "bg-slate-100" },
          { label: "Actifs",          value: stats.active,      icon: CheckCircle, color: "text-green-700", bg: "bg-green-100" },
          { label: "MDP temporaires", value: stats.withTempPwd, icon: Key,         color: "text-amber-700", bg: "bg-amber-100" },
          { label: "Suspendus",       value: stats.suspended,   icon: AlertCircle, color: "text-red-700",   bg: "bg-red-100"   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${s.bg}`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Réseau Diaspora */}
      <NetworkTable
        agents={diasporaAgents}
        onReset={handleReset}
        onCopy={handleCopy}
        showPwdMap={showPwdMap}
        togglePwd={togglePwd}
        resetingId={resetingId}
        title="Réseau Diaspora"
        icon={Globe}
        accent="bg-blue-50/60"
        roles={DIASPORA_ROLES}
      />

      {/* Réseau Parrainage */}
      <NetworkTable
        agents={referralAgents}
        onReset={handleReset}
        onCopy={handleCopy}
        showPwdMap={showPwdMap}
        togglePwd={togglePwd}
        resetingId={resetingId}
        title="Réseau Parrainage (Referral)"
        icon={Network}
        accent="bg-emerald-50/60"
        roles={REFERRAL_ROLES}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
