// src/pages/AdminProviders.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

const fmt     = (n) => Number(n||0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const TYPE_ICONS  = { pharmacy: "💊", clinic: "🏥", hospital: "🏨", lab: "🔬" };
const TYPE_LABELS = { pharmacy: "Pharmacie", clinic: "Clinique", hospital: "Hôpital", lab: "Laboratoire" };

const REQ_STATUS = {
  PENDING:  { label: "En attente", color: "#F59E0B", bg: "#FFFBEB" },
  APPROVED: { label: "Approuvée",  color: "#22C55E", bg: "#F0FDF4" },
  REJECTED: { label: "Rejetée",    color: "#EF4444", bg: "#FEF2F2" },
};
const PRV_STATUS = {
  ACTIVE:    { label: "Actif",     color: "#22C55E", bg: "#F0FDF4" },
  SUSPENDED: { label: "Suspendu",  color: "#EF4444", bg: "#FEF2F2" },
  PENDING:   { label: "En attente",color: "#F59E0B", bg: "#FFFBEB" },
};

// ── API helpers ──────────────────────────────────────────────
const adminProviderAPI = {
  getRequests:  (status) => api.get("/provider/admin/requests", { params: { status } }),
  approve:      (id)     => api.put(`/provider/admin/requests/${id}/approve`),
  reject:       (id, notes) => api.put(`/provider/admin/requests/${id}/reject`, { notes }),
  getProviders: ()       => api.get("/provider/admin/providers"),
  suspend:      (id, suspend) => api.put(`/provider/admin/providers/${id}/suspend`, { suspend }),
};

export default function AdminProviders() {
  const [tab,       setTab]      = useState("requests");
  const [reqStatus, setReqStatus]= useState("PENDING");
  const [requests,  setRequests] = useState([]);
  const [providers, setProviders]= useState([]);
  const [loading,   setLoading]  = useState(false);
  const [selected,  setSelected] = useState(null);
  const [rejectNote,setRejectNote]=useState("");
  const [modal,     setModal]    = useState(null); // { type: 'approve'|'reject'|'suspend', item }
  const [processing,setProcessing]=useState(false);
  const [error,     setError]    = useState("");
  const [success,   setSuccess]  = useState("");
  const [tempPass,  setTempPass] = useState("");

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

  useEffect(() => {
    if (tab === "requests") loadRequests();
    else loadProviders();
  }, [tab, reqStatus]);

  async function handleApprove() {
    setProcessing(true); setError("");
    try {
      const { data } = await adminProviderAPI.approve(modal.item.id);
      setTempPass(data.temp_password);
      setModal({ type: "approved_result", item: modal.item, provider: data.provider });
      loadRequests();
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
      setSuccess(suspend ? "Provider suspendu" : "Provider réactivé");
      loadProviders();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur");
    }
  }

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Portail Établissements</h1>
          <p className="text-slate-500 text-sm">Gestion des prestataires de soins</p>
        </div>
        {pendingCount > 0 && tab === "requests" && (
          <div className="bg-amber-100 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-amber-600 font-bold text-lg">{pendingCount}</span>
            <span className="text-amber-700 text-sm font-medium">demande(s) en attente</span>
          </div>
        )}
      </div>

      {error   && <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-4 text-sm">{error} <button onClick={() => setError("")} className="ml-2 underline">OK</button></div>}
      {success && <div className="bg-green-50 text-green-700 rounded-xl p-4 mb-4 text-sm">{success} <button onClick={() => setSuccess("")} className="ml-2 underline">OK</button></div>}

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-2xl p-1 mb-6 gap-1">
        {[
          { id: "requests",  label: "📋 Demandes d'accès" },
          { id: "providers", label: "🏥 Établissements actifs" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DEMANDES ─────────────────────────────────────────── */}
      {tab === "requests" && (
        <>
          {/* Filtre statut */}
          <div className="flex gap-2 mb-5">
            {["PENDING","APPROVED","REJECTED"].map(s => (
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
                const s = REQ_STATUS[req.status];
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
                    </button>

                    {open && (
                      <div className="px-5 pb-5 border-t border-slate-50">
                        <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
                          {[
                            { label: "Responsable", value: req.manager_name },
                            { label: "Téléphone",   value: req.phone },
                            { label: "Email",        value: req.email || "—" },
                            { label: "Adresse",      value: req.address || "—" },
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

      {/* ── PROVIDERS ────────────────────────────────────────── */}
      {tab === "providers" && (
        <>
          {loading ? (
            <div className="text-center py-16 text-slate-400">Chargement…</div>
          ) : providers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">
              <p className="text-4xl mb-3">🏥</p>
              <p>Aucun établissement enregistré</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map(p => {
                const s = PRV_STATUS[p.status] || PRV_STATUS.ACTIVE;
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                      {TYPE_ICONS[p.type] || "🏥"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400">{TYPE_LABELS[p.type]} · {p.city || "—"} · {p.phone}</p>
                      {p.last_login && <p className="text-xs text-slate-300 mt-0.5">Dernière connexion : {fmtDate(p.last_login)}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span style={{ background: s.bg, color: s.color }} className="text-xs font-bold px-2.5 py-1 rounded-full">
                        {s.label}
                      </span>
                      {p.status === "ACTIVE" ? (
                        <button onClick={() => handleSuspend(p, true)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                          Suspendre
                        </button>
                      ) : (
                        <button onClick={() => handleSuspend(p, false)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors">
                          Réactiver
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modal Approbation ────────────────────────────────── */}
      {modal?.type === "approve" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Approuver la demande</h3>
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-slate-800">{modal.item.name}</p>
              <p className="text-sm text-slate-500">{TYPE_LABELS[modal.item.type]} · {modal.item.phone}</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Un compte HEALTHCARE_PROVIDER sera créé avec un mot de passe temporaire. Les identifiants seront affichés pour transmission au responsable.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">Annuler</button>
              <button onClick={handleApprove} disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors disabled:opacity-60">
                {processing ? "Création…" : "✅ Confirmer l'approbation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Résultat Approbation (mot de passe temporaire) */}
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
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4 text-center">
              ⚠️ Notez ces identifiants — ils ne seront plus affichés. Le provider devra changer son mot de passe à la première connexion.
            </p>
            <button onClick={() => { setModal(null); setTempPass(""); }}
              className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm">
              J'ai noté les identifiants ✓
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Rejet ──────────────────────────────────────── */}
      {modal?.type === "reject" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Rejeter la demande</h3>
            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-slate-800">{modal.item.name}</p>
              <p className="text-sm text-slate-500">{modal.item.phone}</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motif du rejet (optionnel)</label>
              <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="Ex : Zone non couverte, document manquant…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setModal(null); setRejectNote(""); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">Annuler</button>
              <button onClick={handleReject} disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-60">
                {processing ? "Rejet…" : "❌ Confirmer le rejet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
