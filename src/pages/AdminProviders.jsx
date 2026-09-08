// src/pages/AdminProviders.jsx  — v2
// Ajout : onglet "🔬 Accords préalables" pour gérer les demandes d'examens
import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Regroupe les actes liés (consultation + examen via linked_service_id)
// pour afficher deux lignes distinctes + un sous-total combiné.
// Cohérent avec ProviderBilling.jsx — le backend (adminGetProviderActes)
// trie déjà les lignes pour que parent et enfants soient adjacents.
function groupServices(services = []) {
  const groups = new Map();
  for (const svc of services) {
    const key = svc.linked_service_id || svc.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(svc);
  }
  return Array.from(groups.values());
}

const TYPE_ICONS  = { pharmacy: "💊", clinic: "🏥", hospital: "🏨", lab: "🔬", optician: "👓", dentist: "🦷", midwife: "🤰", medecin_teleconsult: "👨‍⚕️" };
const TYPE_LABELS = { pharmacy: "Pharmacie", clinic: "Clinique", hospital: "Hôpital", lab: "Laboratoire", optician: "Opticien", dentist: "Dentiste", midwife: "Sage-femme", medecin_teleconsult: "Médecin téléconsultation" };

const REQ_STATUS = {
  PENDING:  { label: "En attente", color: "#F59E0B", bg: "#FFFBEB" },
  APPROVED: { label: "Approuvée",  color: "#22C55E", bg: "#F0FDF4" },
  REJECTED: { label: "Rejetée",    color: "#EF4444", bg: "#FEF2F2" },
};
const PRV_STATUS = {
  ACTIVE:    { label: "Actif",      color: "#22C55E", bg: "#F0FDF4" },
  SUSPENDED: { label: "Suspendu",   color: "#EF4444", bg: "#FEF2F2" },
  PENDING:   { label: "En attente", color: "#F59E0B", bg: "#FFFBEB" },
};
const EXAM_STATUS = {
  PENDING_APPROVAL: { label: "En attente",  color: "#F59E0B", bg: "#FFFBEB" },
  APPROVED:         { label: "Accordé",     color: "#22C55E", bg: "#F0FDF4" },
  REJECTED:         { label: "Rejeté",      color: "#EF4444", bg: "#FEF2F2" },
  DONE:             { label: "Exécuté",     color: "#6366F1", bg: "#EEF2FF" },
};
// Accords préalables — actes lourds (hospitalisation, chirurgie, césarienne…)
const PRIOR_STATUS = {
  PENDING:  { label: "En attente",  color: "#F59E0B", bg: "#FFFBEB" },
  APPROVED: { label: "Accordé",     color: "#22C55E", bg: "#F0FDF4" },
  REJECTED: { label: "Rejeté",      color: "#EF4444", bg: "#FEF2F2" },
  DONE:     { label: "Exécuté",     color: "#6366F1", bg: "#EEF2FF" },
};

// ── API helpers ──────────────────────────────────────────────────────────────
const adminProviderAPI = {
  getRequests:      (status)        => api.get("/provider/admin/requests", { params: { status } }),
  approve:          (id)            => api.put(`/provider/admin/requests/${id}/approve`),
  reject:           (id, notes)     => api.put(`/provider/admin/requests/${id}/reject`, { notes }),
  getProviders:     ()              => api.get("/provider/admin/providers"),
  suspend:          (id, suspend)   => api.put(`/provider/admin/providers/${id}/suspend`, { suspend }),
  resetPassword:    (id)            => api.post(`/provider/admin/providers/${id}/reset-password`),
  delete:           (id)            => api.delete(`/provider/admin/providers/${id}`),
  getActes:         (id)            => api.get(`/provider/admin/providers/${id}/actes`),
  getInvoices:      ()              => api.get("/provider/admin/invoices"),
  payInvoice:       (id)            => api.post(`/provider/admin/invoices/${id}/pay`),
  // ── Accords préalables (examens) ────────────────────────────
  getExamRequests:  (status)        => api.get("/provider/admin/exam-requests", { params: { status } }),
  approveExam:      (id, notes)     => api.put(`/provider/admin/exam-requests/${id}/approve`, { approved_by: notes }),
  rejectExam:       (id, notes)     => api.put(`/provider/admin/exam-requests/${id}/reject`, { notes }),
  // ── Accords préalables (actes lourds) ───────────────────────
  getPriorAuth:     (status)        => api.get("/provider/admin/prior-auth", { params: { status } }),
  approvePrior:     (id, notes)     => api.put(`/provider/admin/prior-auth/${id}/approve`, { approved_by: notes }),
  rejectPrior:      (id, notes)     => api.put(`/provider/admin/prior-auth/${id}/reject`, { notes }),
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: accent + "18" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-extrabold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Mini progress bar ────────────────────────────────────────────────────────
function MiniBar({ value, max, color = "#6366F1" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Provider Detail Modal ────────────────────────────────────────────────────
function ProviderDetailModal({ provider, onClose }) {
  const [actes,   setActes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await adminProviderAPI.getActes(provider.id);
        setActes(data.actes || []);
      } catch {
        setError("Impossible de charger l'historique des actes.");
      } finally { setLoading(false); }
    }
    load();
  }, [provider.id]);

  const totalMontant = actes.reduce((s, a) => s + Number(a.montant || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
            {TYPE_ICONS[provider.type] || "🏥"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-base truncate">{provider.name}</h3>
            <p className="text-xs text-slate-400">{TYPE_LABELS[provider.type]} · {provider.city || "—"} · {provider.phone}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2">✕</button>
        </div>
        <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Actes ce mois</p>
            <p className="font-extrabold text-slate-800 text-lg">{Number(provider.actes_month || 0).toLocaleString("fr-FR")}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Montant du mois</p>
            <p className="font-extrabold text-slate-800 text-base">{fmt(provider.montant_month)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Total historique</p>
            <p className="font-extrabold text-indigo-600 text-base">{fmt(totalMontant)}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Historique des actes</p>
          {loading && <div className="text-center py-10 text-slate-400 text-sm">Chargement…</div>}
          {error   && <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>}
          {!loading && !error && actes.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              <p className="text-3xl mb-2">📋</p>
              <p>Aucun acte enregistré pour cet établissement.</p>
            </div>
          )}
          {!loading && actes.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bénéficiaire</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type d'acte</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Montant</span>
              </div>
              {groupServices(actes).map((group) => {
                const isGroup = group.length > 1;
                const groupKey = group[0].linked_service_id || group[0].id;
                const subtotalMontant = group.reduce((s, x) => s + Number(x.montant), 0);
                return (
                  <React.Fragment key={groupKey}>
                    {group.map((a, i) => (
                      <div key={a.id || i}
                        className={`grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center px-3 py-2.5 rounded-xl border transition-colors ${
                          isGroup ? "border-sky-100 bg-sky-50 hover:bg-sky-100" : "border-slate-50 hover:bg-slate-50"
                        }`}>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm truncate">{a.beneficiary_name || "—"}</p>
                          {a.member_id && <p className="text-xs text-slate-400">#{a.member_id}</p>}
                        </div>
                        <div>
                          <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                            {a.linked_service_id && <span className="text-sky-500 mr-1">↳</span>}
                            {a.catalog_label || a.act_type || a.type || "—"}
                          </span>
                          {isGroup && !a.linked_service_id && (
                            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-sky-100 text-sky-600">
                              + examen lié
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{fmtDate(a.created_at || a.date)}</p>
                        <p className="font-bold text-slate-800 text-sm text-right whitespace-nowrap">{fmt(a.montant)}</p>
                      </div>
                    ))}
                    {isGroup && (
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center px-3 py-2 rounded-xl bg-sky-100 border border-sky-200">
                        <p className="col-span-3 text-xs font-extrabold text-sky-700 text-right">
                          Sous-total combiné (consultation + examen)
                        </p>
                        <p className="font-extrabold text-slate-800 text-sm text-right whitespace-nowrap">{fmt(subtotalMontant)}</p>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
        {!loading && actes.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-3 flex justify-between items-center bg-slate-50 rounded-b-2xl">
            <span className="text-xs text-slate-400">{actes.length} acte{actes.length > 1 ? "s" : ""} au total</span>
            <span className="font-bold text-slate-800 text-sm">Total : {fmt(totalMontant)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Provider Detail Panel (expanded row) ────────────────────────────────────
function ProviderDetail({ p, onSuspend, onResetPassword, onDelete }) {
  return (
    <div className="px-5 pb-5 pt-4 border-t border-slate-50 bg-slate-50/50">
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ce mois</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Actes</span>
              <span className="font-bold text-slate-800">{Number(p.actes_month || 0).toLocaleString("fr-FR")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Montant</span>
              <span className="font-bold text-slate-800 text-xs">{fmt(p.montant_month)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Couverture moy.</span>
              <span className="font-bold text-slate-800">{Number(p.coverage_avg || 0).toFixed(0)} %</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cumul annuel</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total actes</span>
              <span className="font-bold text-slate-800">{Number(p.bons_used || 0).toLocaleString("fr-FR")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Montant</span>
              <span className="font-bold text-slate-800 text-xs">{fmt(p.montant_year)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Administratif</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-400">Téléphone</p>
              <p className="font-semibold text-slate-700 text-sm">{p.phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Ville</p>
              <p className="font-semibold text-slate-700 text-sm">{p.city || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Dernière connexion</p>
              <p className="font-semibold text-slate-700 text-sm">{fmtDate(p.last_login)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onResetPassword(p)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors">
          🔑 Réinit. MDP
        </button>
        {p.status === "ACTIVE" ? (
          <button onClick={() => onSuspend(p, true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
            ⏸ Suspendre
          </button>
        ) : (
          <button onClick={() => onSuspend(p, false)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors">
            ▶ Réactiver
          </button>
        )}
        <button onClick={() => onDelete(p)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
}

// ── ExamRequestRow ────────────────────────────────────────────────────────────
function ExamRequestRow({ exam, onApprove, onReject, processing }) {
  const [open, setOpen] = useState(false);
  const s = EXAM_STATUS[exam.status] || EXAM_STATUS.PENDING_APPROVAL;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-xl flex-shrink-0">
          🔬
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate text-sm">{exam.exam_label || exam.catalog_code}</p>
          <p className="text-xs text-slate-400 truncate">
            {exam.client_name} · {exam.mutual_number} · Prescrit par <span className="font-semibold">{exam.prescriber_name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-400 hidden sm:block">{fmtDate(exam.created_at)}</span>
          <span style={{ background: s.bg, color: s.color }}
            className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
            {s.label}
          </span>
          <span className="text-slate-300 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50">
          {/* Détail */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-4">
            {[
              { label: "Patient",      value: `${exam.client_name} (${exam.mutual_number})` },
              { label: "Formule",      value: exam.client_plan || "—" },
              { label: "Prescripteur", value: `${exam.prescriber_name} (${TYPE_LABELS[exam.prescriber_type] || exam.prescriber_type})` },
              { label: "Date demande", value: fmtDate(exam.created_at) },
              { label: "Examen",       value: exam.exam_label || exam.catalog_code },
              { label: "Catégorie",    value: exam.exam_category || "—" },
              { label: "Description",  value: exam.description || "—" },
              { label: "Expiration",   value: fmtDate(exam.expires_at) },
            ].map((f, i) => (
              <div key={i}>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{f.label}</p>
                <p className="text-sm font-semibold text-slate-700">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Code accord si approuvé */}
          {exam.status === "APPROVED" && exam.preauth_code && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Code accord préalable</span>
              <span className="font-mono font-bold text-green-800 bg-green-100 px-3 py-1 rounded-lg text-sm">
                {exam.preauth_code}
              </span>
            </div>
          )}

          {/* Notes rejet */}
          {exam.status === "REJECTED" && exam.result_notes && (
            <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 mb-4">
              <span className="font-semibold">Motif : </span>{exam.result_notes}
            </div>
          )}

          {/* Résultat examen */}
          {exam.status === "DONE" && (
            <div className="bg-indigo-50 rounded-xl p-3 text-sm text-indigo-700 mb-4">
              <p className="font-semibold mb-1">✅ Examen réalisé le {fmtDate(exam.performed_at)}</p>
              {exam.result_notes && <p className="text-xs">{exam.result_notes}</p>}
            </div>
          )}

          {/* Actions — seulement si en attente */}
          {exam.status === "PENDING_APPROVAL" && (
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(exam)}
                disabled={processing}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                {processing ? "Traitement…" : "✅ Accorder l'accord préalable"}
              </button>
              <button
                onClick={() => onReject(exam)}
                disabled={processing}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm transition-colors border border-red-200 disabled:opacity-60">
                ❌ Refuser
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PriorAuthRequestRow (actes lourds : hospitalisation, chirurgie, césarienne…) ──
// NOTE : champs alignés sur le pattern exam-requests + le body documenté dans
// providerRoutes.js (client_id, dependent_id, catalog_code, description,
// estimated_amount, attachments). À ajuster si le controller renvoie des noms
// différents pour adminGetPriorAuthRequests.
function PriorAuthRequestRow({ req, onApprove, onReject, processing }) {
  const [open, setOpen] = useState(false);
  const s = PRIOR_STATUS[req.status] || PRIOR_STATUS.PENDING;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
        <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-xl flex-shrink-0">
          🏨
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate text-sm">{req.catalog_label || req.catalog_code}</p>
          <p className="text-xs text-slate-400 truncate">
            {req.client_name} · {req.mutual_number} · Établissement <span className="font-semibold">{req.provider_name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-400 hidden sm:block">{fmtDate(req.created_at)}</span>
          <span style={{ background: s.bg, color: s.color }}
            className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
            {s.label}
          </span>
          <span className="text-slate-300 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50">
          {/* Détail */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-4">
            {[
              { label: "Patient",         value: `${req.client_name} (${req.mutual_number})` },
              { label: "Formule",         value: req.client_plan || "—" },
              { label: "Établissement",   value: `${req.provider_name} (${TYPE_LABELS[req.provider_type] || req.provider_type})` },
              { label: "Date demande",    value: fmtDate(req.created_at) },
              { label: "Acte",            value: req.catalog_label || req.catalog_code },
              { label: "Montant estimé",  value: req.estimated_amount ? fmt(req.estimated_amount) : "—" },
              { label: "Description",     value: req.description || "—" },
              { label: "Expiration",      value: fmtDate(req.expires_at) },
            ].map((f, i) => (
              <div key={i}>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{f.label}</p>
                <p className="text-sm font-semibold text-slate-700">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Pièces jointes */}
          {Array.isArray(req.attachments) && req.attachments.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Pièces jointes</p>
              <div className="flex flex-wrap gap-2">
                {req.attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                    📎 Document {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Code accord si approuvé */}
          {req.status === "APPROVED" && req.preauth_code && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Code accord préalable</span>
              <span className="font-mono font-bold text-green-800 bg-green-100 px-3 py-1 rounded-lg text-sm">
                {req.preauth_code}
              </span>
            </div>
          )}

          {/* Notes rejet */}
          {req.status === "REJECTED" && req.result_notes && (
            <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 mb-4">
              <span className="font-semibold">Motif : </span>{req.result_notes}
            </div>
          )}

          {/* Résultat exécution */}
          {req.status === "DONE" && (
            <div className="bg-indigo-50 rounded-xl p-3 text-sm text-indigo-700 mb-4">
              <p className="font-semibold mb-1">✅ Acte réalisé le {fmtDate(req.performed_at)}</p>
              <p className="text-xs text-indigo-500 mb-1">Le montant réel facturé est visible dans l'onglet Facturation (associé à l'acte créé dans provider_services).</p>
              {req.result_notes && <p className="text-xs">{req.result_notes}</p>}
            </div>
          )}

          {/* Actions — seulement si en attente */}
          {req.status === "PENDING" && (
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(req)}
                disabled={processing}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                {processing ? "Traitement…" : "✅ Accorder l'accord préalable"}
              </button>
              <button
                onClick={() => onReject(req)}
                disabled={processing}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm transition-colors border border-red-200 disabled:opacity-60">
                ❌ Refuser
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminProviders() {
  const [tab,         setTab]        = useState("requests");
  const [reqStatus,   setReqStatus]  = useState("PENDING");
  const [examStatus,  setExamStatus] = useState("PENDING_APPROVAL");
  const [requests,    setRequests]   = useState([]);
  const [providers,   setProviders]  = useState([]);
  const [invoices,    setInvoices]   = useState([]);
  const [examRequests,setExamReqs]   = useState([]);
  const [examPendingCount, setExamPendingCount] = useState(0);
  const [priorStatus,  setPriorStatus]  = useState("PENDING");
  const [priorRequests,setPriorReqs]    = useState([]);
  const [priorPendingCount, setPriorPendingCount] = useState(0);
  const [loading,     setLoading]    = useState(false);
  const [selected,    setSelected]   = useState(null);
  const [rejectNote,  setRejectNote] = useState("");
  const [modal,       setModal]      = useState(null);
  const [detailModal, setDetailModal]= useState(null);
  const [examRejectModal, setExamRejectModal] = useState(null); // { exam }
  const [priorRejectModal, setPriorRejectModal] = useState(null); // { req }
  const [processing,  setProcessing] = useState(false);
  const [error,       setError]      = useState("");
  const [success,     setSuccess]    = useState("");
  const [tempPass,    setTempPass]   = useState("");
  const [resetPass,   setResetPass]  = useState("");

  const [search,       setSearch]      = useState("");
  const [filterType,   setFilterType]  = useState("ALL");
  const [filterStatus, setFilterStatus]= useState("ALL");

  async function loadRequests() {
    setLoading(true);
    try {
      const { data } = await adminProviderAPI.getRequests(reqStatus);
      setRequests(data.requests || []);
    } catch { setError("Erreur chargement demandes"); }
    finally { setLoading(false); }
  }

  async function loadProviders() {
    setLoading(true);
    try {
      const { data } = await adminProviderAPI.getProviders();
      setProviders(data.providers || []);
    } catch { setError("Erreur chargement providers"); }
    finally { setLoading(false); }
  }

  async function loadInvoices() {
    setLoading(true);
    try {
      const { data } = await adminProviderAPI.getInvoices();
      setInvoices(data.invoices || []);
    } catch { setError("Erreur chargement factures"); }
    finally { setLoading(false); }
  }

  async function loadExamRequests() {
    setLoading(true);
    try {
      const { data } = await adminProviderAPI.getExamRequests(examStatus);
      setExamReqs(data.exam_requests || []);
      // Badge header : toujours recharger le count des pending_approval
      if (examStatus !== "PENDING_APPROVAL") {
        const { data: pd } = await adminProviderAPI.getExamRequests("PENDING_APPROVAL");
        setExamPendingCount((pd.exam_requests || []).length);
      } else {
        setExamPendingCount((data.exam_requests || []).length);
      }
    } catch { setError("Erreur chargement accords préalables"); }
    finally { setLoading(false); }
  }

  async function loadPriorAuthRequests() {
    setLoading(true);
    try {
      const { data } = await adminProviderAPI.getPriorAuth(priorStatus);
      setPriorReqs(data.prior_auth_requests || []);
      // Badge header : toujours recharger le count des PENDING
      if (priorStatus !== "PENDING") {
        const { data: pd } = await adminProviderAPI.getPriorAuth("PENDING");
        setPriorPendingCount((pd.prior_auth_requests || []).length);
      } else {
        setPriorPendingCount((data.prior_auth_requests || []).length);
      }
    } catch { setError("Erreur chargement accords préalables (actes lourds)"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadProviders();
    if (tab === "requests")  loadRequests();
    if (tab === "invoices")  loadInvoices();
    if (tab === "exams")     loadExamRequests();
    if (tab === "priorauth") loadPriorAuthRequests();
  }, [tab, reqStatus, examStatus, priorStatus]);

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active      = providers.filter(p => p.status === "ACTIVE").length;
    const actesMonth  = providers.reduce((s, p) => s + Number(p.actes_month  || 0), 0);
    const montantMonth= providers.reduce((s, p) => s + Number(p.montant_month|| 0), 0);
    const pendingReq  = requests.filter(r => r.status === "PENDING").length;
    const pendingExams= examPendingCount;
    const pendingPrior= priorPendingCount;
    return { active, total: providers.length, actesMonth, montantMonth, pendingReq, pendingExams, pendingPrior };
  }, [providers, requests, examRequests, examPendingCount, priorRequests, priorPendingCount]);

  const maxActes = useMemo(() =>
    Math.max(1, ...providers.map(p => Number(p.actes_month || 0))), [providers]);

  const filtered = useMemo(() => {
    return providers.filter(p => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.city || "").toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search);
      const matchType   = filterType   === "ALL" || p.type   === filterType;
      const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [providers, search, filterType, filterStatus]);

  // ── Actions ────────────────────────────────────────────────
  async function handleApprove() {
    setProcessing(true); setError("");
    try {
      const { data } = await adminProviderAPI.approve(modal.item.id);
      setTempPass(data.temp_password);
      setModal({ type: "approved_result", item: modal.item, provider: data.provider });
      loadRequests(); loadProviders();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur approbation");
      setModal(null);
    } finally { setProcessing(false); }
  }

  async function handleReject() {
    setProcessing(true); setError("");
    try {
      await adminProviderAPI.reject(modal.item.id, rejectNote);
      setSuccess("Demande rejetée");
      setModal(null); setRejectNote("");
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur rejet");
    } finally { setProcessing(false); }
  }

  async function handleSuspend(provider, suspend) {
    try {
      await adminProviderAPI.suspend(provider.id, suspend);
      setSuccess(suspend ? "Établissement suspendu" : "Établissement réactivé");
      loadProviders();
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
  }

  async function handleResetPassword(provider) {
    try {
      const { data } = await adminProviderAPI.resetPassword(provider.id);
      setResetPass(data.temp_password);
      setModal({ type: "reset_result", item: provider });
    } catch (err) { setError(err.response?.data?.error || "Erreur reset mot de passe"); }
  }

  async function handleDelete(provider) {
    try {
      await adminProviderAPI.delete(provider.id);
      setSuccess(`${provider.name} supprimé`);
      setModal(null); loadProviders();
    } catch (err) { setError(err.response?.data?.error || "Erreur suppression"); }
  }

  async function handlePayInvoice(invoice) {
    try {
      await adminProviderAPI.payInvoice(invoice.id);
      setSuccess(`Facture de ${invoice.provider_name} validée ✅`);
      loadInvoices();
    } catch (err) { setError(err.response?.data?.error || "Erreur validation paiement"); }
  }

  async function handleApproveExam(exam) {
    setProcessing(true); setError("");
    try {
      const { data } = await adminProviderAPI.approveExam(exam.id, "admin");
      setSuccess(`Accord préalable accordé — code : ${data.preauth_code}`);
      loadExamRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur accord préalable");
    } finally { setProcessing(false); }
  }

  async function handleRejectExam() {
    if (!examRejectModal) return;
    setProcessing(true); setError("");
    try {
      await adminProviderAPI.rejectExam(examRejectModal.exam.id, rejectNote);
      setSuccess("Demande d'accord préalable rejetée");
      setExamRejectModal(null); setRejectNote("");
      loadExamRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur rejet accord préalable");
    } finally { setProcessing(false); }
  }

  async function handleApprovePrior(req) {
    setProcessing(true); setError("");
    try {
      const { data } = await adminProviderAPI.approvePrior(req.id, "admin");
      setSuccess(`Accord préalable (acte lourd) accordé — code : ${data.preauth_code}`);
      loadPriorAuthRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur accord préalable");
    } finally { setProcessing(false); }
  }

  async function handleRejectPrior() {
    if (!priorRejectModal) return;
    setProcessing(true); setError("");
    try {
      await adminProviderAPI.rejectPrior(priorRejectModal.req.id, rejectNote);
      setSuccess("Demande d'accord préalable (acte lourd) rejetée");
      setPriorRejectModal(null); setRejectNote("");
      loadPriorAuthRequests();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur rejet accord préalable");
    } finally { setProcessing(false); }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Portail Établissements</h1>
          <p className="text-slate-500 text-sm">Gestion des prestataires de soins</p>
        </div>
        <div className="flex gap-2">
          {kpis.pendingReq > 0 && (
            <button onClick={() => { setTab("requests"); setReqStatus("PENDING"); }}
              className="bg-amber-100 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-amber-200 transition-colors">
              <span className="text-amber-600 font-bold text-lg">{kpis.pendingReq}</span>
              <span className="text-amber-700 text-sm font-medium">accès en attente</span>
            </button>
          )}
          {kpis.pendingExams > 0 && (
            <button onClick={() => { setTab("exams"); setExamStatus("PENDING_APPROVAL"); }}
              className="bg-indigo-100 border border-indigo-200 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-indigo-200 transition-colors">
              <span className="text-indigo-600 font-bold text-lg">{kpis.pendingExams}</span>
              <span className="text-indigo-700 text-sm font-medium">accord(s) à valider</span>
            </button>
          )}
          {kpis.pendingPrior > 0 && (
            <button onClick={() => { setTab("priorauth"); setPriorStatus("PENDING"); }}
              className="bg-rose-100 border border-rose-200 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-rose-200 transition-colors">
              <span className="text-rose-600 font-bold text-lg">{kpis.pendingPrior}</span>
              <span className="text-rose-700 text-sm font-medium">acte(s) lourd(s) à valider</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <KpiCard icon="🏥" label="Établissements actifs" value={`${kpis.active} / ${kpis.total}`} accent="#6366F1" />
        <KpiCard icon="📋" label="Actes ce mois"         value={kpis.actesMonth.toLocaleString("fr-FR")} accent="#22C55E" />
        <KpiCard icon="💰" label="Montant engagé"        value={fmt(kpis.montantMonth)} sub="mois en cours" accent="#F59E0B" />
        <KpiCard icon="🔬" label="Accords à valider"     value={kpis.pendingExams} accent="#6366F1" />
        <KpiCard icon="🏨" label="Actes lourds à valider" value={kpis.pendingPrior} accent="#F43F5E" />
      </div>

      {/* Alerts */}
      {error   && <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}   <button onClick={() => setError("")}   className="ml-2 underline">OK</button></div>}
      {success && <div className="bg-green-50 text-green-700 rounded-xl p-4 mb-4 text-sm">{success} <button onClick={() => setSuccess("")} className="ml-2 underline">OK</button></div>}

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-2xl p-1 mb-6 gap-1">
        {[
          { id: "requests",  label: "📋 Demandes d'accès" },
          { id: "providers", label: "🏥 Établissements" },
          { id: "exams",     label: "🔬 Accords préalables", badge: kpis.pendingExams },
          { id: "priorauth", label: "🏨 Actes lourds",       badge: kpis.pendingPrior },
          { id: "invoices",  label: "💳 Factures" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${tab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB : DEMANDES D'ACCÈS
      ══════════════════════════════════════════════════════════ */}
      {tab === "requests" && (
        <>
          <div className="flex gap-2 mb-5">
            {["PENDING", "APPROVED", "REJECTED"].map(s => (
              <button key={s} onClick={() => setReqStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${reqStatus === s ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
                {REQ_STATUS[s].label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="text-center py-16 text-slate-400">Chargement…</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
              <p className="text-4xl mb-3">📭</p>
              <p>Aucune demande {REQ_STATUS[reqStatus]?.label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => {
                const s    = REQ_STATUS[req.status];
                const open = selected === req.id;
                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => setSelected(open ? null : req.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                        {TYPE_ICONS[req.type] || "🏥"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{req.name}</p>
                        <p className="text-xs text-slate-400">{TYPE_LABELS[req.type]} · {req.city || "N/A"} · {fmtDate(req.created_at)}</p>
                      </div>
                      <span style={{ background: s.bg, color: s.color }} className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">
                        {s.label}
                      </span>
                      <span className="text-slate-300 text-xs">{open ? "▲" : "▼"}</span>
                    </button>
                    {open && (
                      <div className="px-5 pb-5 border-t border-slate-50">
                        <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
                          {[
                            { label: "Responsable", value: req.manager_name },
                            { label: "Téléphone",   value: req.phone },
                            { label: "Email",       value: req.email || "—" },
                            { label: "Adresse",     value: req.address || "—" },
                          ].map((f, i) => (
                            <div key={i}>
                              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{f.label}</p>
                              <p className="text-sm font-semibold text-slate-700">{f.value}</p>
                            </div>
                          ))}
                        </div>
                        {req.status === "PENDING" && (
                          <div className="flex gap-3">
                            <button onClick={() => setModal({ type: "approve", item: req })}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                              ✅ Approuver
                            </button>
                            <button onClick={() => setModal({ type: "reject", item: req })}
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm transition-colors border border-red-200">
                              ❌ Rejeter
                            </button>
                          </div>
                        )}
                        {req.status === "APPROVED" && (
                          <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium">
                            ✅ Demande approuvée — compte créé
                          </div>
                        )}
                        {req.status === "REJECTED" && req.notes && (
                          <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">
                            <span className="font-semibold">Motif : </span>{req.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB : ÉTABLISSEMENTS
      ══════════════════════════════════════════════════════════ */}
      {tab === "providers" && (
        <>
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nom, ville, téléphone…"
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option value="ALL">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option value="ALL">Tous les statuts</option>
              {Object.entries(PRV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {(search || filterType !== "ALL" || filterStatus !== "ALL") && (
              <button onClick={() => { setSearch(""); setFilterType("ALL"); setFilterStatus("ALL"); }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                ✕ Réinitialiser
              </button>
            )}
          </div>
          {loading ? (
            <div className="text-center py-16 text-slate-400">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
              <p className="text-4xl mb-3">🏥</p>
              <p>{providers.length === 0 ? "Aucun établissement enregistré" : "Aucun résultat pour ces filtres"}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Établissement</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actes / mois</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Montant engagé</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</span>
                <span />
              </div>
              {filtered.map((p, idx) => {
                const s    = PRV_STATUS[p.status] || PRV_STATUS.ACTIVE;
                const open = selected === p.id;
                return (
                  <div key={p.id} className={idx < filtered.length - 1 ? "border-b border-slate-50" : ""}>
                    <div className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors">
                      <button onClick={() => setDetailModal(p)}
                        className="flex items-center gap-3 min-w-0 text-left group">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                          {TYPE_ICONS[p.type] || "🏥"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-indigo-600 group-hover:text-indigo-800 underline underline-offset-2 truncate text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400 truncate">{TYPE_LABELS[p.type]} · {p.city || "—"}</p>
                        </div>
                      </button>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800 text-sm">{Number(p.actes_month || 0).toLocaleString("fr-FR")}</span>
                        <MiniBar value={Number(p.actes_month || 0)} max={maxActes} color="#6366F1" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 text-sm">{fmt(p.montant_month)}</span>
                      </div>
                      <div>
                        <span style={{ background: s.bg, color: s.color }}
                          className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                          {s.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => handleResetPassword(p)} title="Réinitialiser le mot de passe"
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors whitespace-nowrap">
                          🔑 MDP
                        </button>
                        {p.status === "ACTIVE" ? (
                          <button onClick={() => handleSuspend(p, true)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors whitespace-nowrap">
                            ⏸ Suspendre
                          </button>
                        ) : (
                          <button onClick={() => handleSuspend(p, false)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors whitespace-nowrap">
                            ▶ Réactiver
                          </button>
                        )}
                        <button onClick={() => setModal({ type: "delete_confirm", item: p })}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                          🗑️
                        </button>
                      </div>
                      <button onClick={() => setSelected(open ? null : p.id)}
                        className="text-slate-300 hover:text-slate-500 text-xs px-1">
                        {open ? "▲" : "▼"}
                      </button>
                    </div>
                    {open && (
                      <ProviderDetail p={p} onSuspend={handleSuspend} onResetPassword={handleResetPassword}
                        onDelete={(provider) => setModal({ type: "delete_confirm", item: provider })} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {filtered.length > 0 && (
            <p className="text-xs text-slate-400 mt-3 text-right">
              {filtered.length} établissement{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
              {providers.length !== filtered.length && ` sur ${providers.length}`}
            </p>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB : ACCORDS PRÉALABLES
      ══════════════════════════════════════════════════════════ */}
      {tab === "exams" && (
        <>
          {/* Filtres statut */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {Object.entries(EXAM_STATUS).map(([key, val]) => (
              <button key={key} onClick={() => setExamStatus(key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${examStatus === key ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
                {val.label}
              </button>
            ))}
          </div>

          {/* KPI mini row */}
          {(() => {
            const pending  = examPendingCount;
            const approved = examStatus === "APPROVED" ? examRequests.length : "—";
            const done     = examStatus === "DONE"     ? examRequests.length : "—";
            const rejected = examStatus === "REJECTED" ? examRequests.length : "—";
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <KpiCard icon="⏳" label="En attente"  value={pending}  accent="#F59E0B" />
                <KpiCard icon="✅" label="Accordés"    value={approved} accent="#22C55E" />
                <KpiCard icon="🔬" label="Exécutés"    value={done}     accent="#6366F1" />
                <KpiCard icon="❌" label="Refusés"     value={rejected} accent="#EF4444" />
              </div>
            );
          })()}

          {loading ? (
            <div className="text-center py-16 text-slate-400">Chargement…</div>
          ) : examRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
              <p className="text-4xl mb-3">🔬</p>
              <p>Aucun accord préalable {EXAM_STATUS[examStatus]?.label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {examRequests.map(exam => (
                <ExamRequestRow
                  key={exam.id}
                  exam={exam}
                  onApprove={handleApproveExam}
                  onReject={(e) => { setExamRejectModal({ exam: e }); setRejectNote(""); }}
                  processing={processing}
                />
              ))}
            </div>
          )}
          {examRequests.length > 0 && (
            <p className="text-xs text-slate-400 mt-3 text-right">
              {examRequests.length} demande{examRequests.length > 1 ? "s" : ""}
            </p>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB : ACTES LOURDS (accord préalable hospitalisation/chirurgie)
      ══════════════════════════════════════════════════════════ */}
      {tab === "priorauth" && (
        <>
          {/* Filtres statut */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {Object.entries(PRIOR_STATUS).map(([key, val]) => (
              <button key={key} onClick={() => setPriorStatus(key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${priorStatus === key ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
                {val.label}
              </button>
            ))}
          </div>

          {/* KPI mini row */}
          {(() => {
            const pending  = priorPendingCount;
            const approved = priorStatus === "APPROVED" ? priorRequests.length : "—";
            const done     = priorStatus === "DONE"     ? priorRequests.length : "—";
            const rejected = priorStatus === "REJECTED" ? priorRequests.length : "—";
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <KpiCard icon="⏳" label="En attente"  value={pending}  accent="#F59E0B" />
                <KpiCard icon="✅" label="Accordés"    value={approved} accent="#22C55E" />
                <KpiCard icon="🏨" label="Exécutés"    value={done}     accent="#6366F1" />
                <KpiCard icon="❌" label="Refusés"     value={rejected} accent="#EF4444" />
              </div>
            );
          })()}

          {loading ? (
            <div className="text-center py-16 text-slate-400">Chargement…</div>
          ) : priorRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
              <p className="text-4xl mb-3">🏨</p>
              <p>Aucune demande d'acte lourd {PRIOR_STATUS[priorStatus]?.label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {priorRequests.map(req => (
                <PriorAuthRequestRow
                  key={req.id}
                  req={req}
                  onApprove={handleApprovePrior}
                  onReject={(r) => { setPriorRejectModal({ req: r }); setRejectNote(""); }}
                  processing={processing}
                />
              ))}
            </div>
          )}
          {priorRequests.length > 0 && (
            <p className="text-xs text-slate-400 mt-3 text-right">
              {priorRequests.length} demande{priorRequests.length > 1 ? "s" : ""}
            </p>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB : FACTURES
      ══════════════════════════════════════════════════════════ */}
      {tab === "invoices" && (
        <>
          {(() => {
            const submitted = invoices.filter(i => i.status === "SUBMITTED").length;
            const paid      = invoices.filter(i => i.status === "PAID").length;
            const pending   = invoices.filter(i => i.status === "PENDING").length;
            const totalDue  = invoices.filter(i => i.status === "SUBMITTED")
                                .reduce((s, i) => s + Number(i.mutual_amount || 0), 0);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <KpiCard icon="📨" label="À valider"    value={submitted}    accent="#F59E0B" />
                <KpiCard icon="✅" label="Payées"       value={paid}         accent="#22C55E" />
                <KpiCard icon="🕐" label="Non soumises" value={pending}      accent="#94A3B8" />
                <KpiCard icon="💸" label="Montant dû"   value={fmt(totalDue)} accent="#EF4444" />
              </div>
            );
          })()}

          {loading ? (
            <div className="text-center py-16 text-slate-400">Chargement…</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
              <p className="text-4xl mb-3">🧾</p>
              <p>Aucune facture enregistrée</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Établissement</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Période</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total actes</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Part mutuelle</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</span>
                <span />
              </div>
              {invoices.map((inv, idx) => {
                const INV_STATUS = {
                  PENDING:   { label: "Non soumise", color: "#94A3B8", bg: "#F1F5F9" },
                  SUBMITTED: { label: "À valider",   color: "#F59E0B", bg: "#FFFBEB" },
                  PAID:      { label: "Payée",        color: "#22C55E", bg: "#F0FDF4" },
                };
                const st = INV_STATUS[inv.status] || INV_STATUS.PENDING;
                return (
                  <div key={inv.id} className={idx < invoices.length - 1 ? "border-b border-slate-50" : ""}>
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base flex-shrink-0">
                          {TYPE_ICONS[inv.provider_type] || "🏥"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate text-sm">{inv.provider_name}</p>
                          <p className="text-xs text-slate-400">{TYPE_LABELS[inv.provider_type]} · {inv.provider_city || "—"}</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600">
                        <p>{fmtDate(inv.period_start)}</p>
                        <p className="text-slate-400">→ {fmtDate(inv.period_end)}</p>
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">{fmt(inv.total_amount)}</p>
                      <p className="font-bold text-indigo-700 text-sm">{fmt(inv.mutual_amount)}</p>
                      <span style={{ background: st.bg, color: st.color }}
                        className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap w-fit">
                        {st.label}
                      </span>
                      <div className="flex-shrink-0">
                        {inv.status === "SUBMITTED" && (
                          <button onClick={() => handlePayInvoice(inv)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors whitespace-nowrap">
                            ✅ Valider cash
                          </button>
                        )}
                        {inv.status === "PAID" && <span className="text-xs text-slate-400">Payé le {fmtDate(inv.paid_at)}</span>}
                        {inv.status === "PENDING" && <span className="text-xs text-slate-300 italic">En attente clinique</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {invoices.length > 0 && (
            <p className="text-xs text-slate-400 mt-3 text-right">
              {invoices.length} facture{invoices.length > 1 ? "s" : ""} au total
            </p>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════ */}

      {/* Approve accès */}
      {modal?.type === "approve" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Approuver la demande</h3>
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-slate-800">{modal.item.name}</p>
              <p className="text-sm text-slate-500">{TYPE_LABELS[modal.item.type]} · {modal.item.phone}</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Un compte HEALTHCARE_PROVIDER sera créé avec un mot de passe temporaire.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
                Annuler
              </button>
              <button onClick={handleApprove} disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors disabled:opacity-60">
                {processing ? "Création…" : "✅ Confirmer l'approbation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Résultat approbation */}
      {modal?.type === "approved_result" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-bold text-slate-800 text-lg">Compte créé avec succès !</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Identifiants à transmettre</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Login (téléphone)</span>
                  <span className="font-mono font-bold text-slate-800">{modal.item.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Mot de passe temporaire</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg text-sm">{tempPass}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-amber-200 mt-1">
                  <span className="text-sm text-slate-600">Lien de connexion</span>
                  <a href="https://mutuelleawoundjo.org/etablissement/login" target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 underline truncate max-w-[180px]">
                    mutuelleawoundjo.org/etablissement/login
                  </a>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3 text-center">
              ⚠️ Notez ces identifiants — ils ne seront plus affichés.
            </p>
            <button onClick={() => {
              const text = `Login : ${modal.item.phone}\nMot de passe : ${tempPass}\nLien : https://mutuelleawoundjo.org/etablissement/login`;
              try { navigator.clipboard.writeText(text); } catch {
                const ta = document.createElement("textarea");
                ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
              }
            }} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors mb-2">
              📋 Copier tout
            </button>
            <button onClick={() => { setModal(null); setTempPass(""); }}
              className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm">
              J'ai noté les identifiants ✓
            </button>
          </div>
        </div>
      )}

      {/* Reset password result */}
      {modal?.type === "reset_result" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🔑</div>
              <h3 className="font-bold text-slate-800 text-lg">Mot de passe réinitialisé</h3>
              <p className="text-slate-500 text-sm mt-1">{modal.item.name}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Nouveaux identifiants</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Login (téléphone)</span>
                  <span className="font-mono font-bold text-slate-800">{modal.item.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Mot de passe temporaire</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg text-sm">{resetPass}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-amber-200 mt-1">
                  <span className="text-sm text-slate-600">Lien de connexion</span>
                  <a href="https://mutuelleawoundjo.org/etablissement/login" target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 underline truncate max-w-[180px]">
                    mutuelleawoundjo.org/etablissement/login
                  </a>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3 text-center">⚠️ Notez ces identifiants — ils ne seront plus affichés.</p>
            <button onClick={() => {
              const text = `Login : ${modal.item.phone}\nMot de passe : ${resetPass}\nLien : https://mutuelleawoundjo.org/etablissement/login`;
              try { navigator.clipboard.writeText(text); } catch {
                const ta = document.createElement("textarea");
                ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
              }
            }} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors mb-2">
              📋 Copier tout
            </button>
            <button onClick={() => { setModal(null); setResetPass(""); }}
              className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm">
              J'ai noté les identifiants ✓
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {modal?.type === "delete_confirm" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="font-bold text-slate-800 text-lg">Supprimer l'établissement ?</h3>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="font-semibold text-slate-800">{modal.item.name}</p>
              <p className="text-sm text-slate-500">{TYPE_LABELS[modal.item.type]} · {modal.item.phone}</p>
            </div>
            <p className="text-sm text-red-600 mb-4 text-center font-medium">
              ⚠️ Cette action est irréversible. Tous les actes et factures liés seront supprimés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
                Annuler
              </button>
              <button onClick={() => handleDelete(modal.item)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">
                🗑️ Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject accès */}
      {modal?.type === "reject" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Rejeter la demande</h3>
            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-slate-800">{modal.item.name}</p>
              <p className="text-sm text-slate-500">{modal.item.phone}</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Motif du rejet (optionnel)
              </label>
              <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="Ex : Zone non couverte, document manquant…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" rows={3} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setModal(null); setRejectNote(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
                Annuler
              </button>
              <button onClick={handleReject} disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-60">
                {processing ? "Rejet…" : "❌ Confirmer le rejet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject accord préalable */}
      {examRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Refuser l'accord préalable</h3>
            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-slate-800">{examRejectModal.exam.exam_label || examRejectModal.exam.catalog_code}</p>
              <p className="text-sm text-slate-500">{examRejectModal.exam.client_name} · Prescrit par {examRejectModal.exam.prescriber_name}</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Motif du refus (optionnel)
              </label>
              <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="Ex : Non couvert par la formule, quota atteint…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" rows={3} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setExamRejectModal(null); setRejectNote(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
                Annuler
              </button>
              <button onClick={handleRejectExam} disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-60">
                {processing ? "Rejet…" : "❌ Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject accord préalable — actes lourds */}
      {priorRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Refuser l'accord préalable (acte lourd)</h3>
            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-slate-800">{priorRejectModal.req.catalog_label || priorRejectModal.req.catalog_code}</p>
              <p className="text-sm text-slate-500">{priorRejectModal.req.client_name} · {priorRejectModal.req.provider_name}</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Motif du refus (optionnel)
              </label>
              <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="Ex : Non couvert par la formule, quota atteint…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" rows={3} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPriorRejectModal(null); setRejectNote(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
                Annuler
              </button>
              <button onClick={handleRejectPrior} disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-60">
                {processing ? "Rejet…" : "❌ Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Detail Modal */}
      {detailModal && (
        <ProviderDetailModal provider={detailModal} onClose={() => setDetailModal(null)} />
      )}

    </div>
  );
}
