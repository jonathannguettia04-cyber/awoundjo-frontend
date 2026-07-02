import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import axios from "axios";
import { clientAPI, paymentsAPI, depsAPI } from "../services/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PlanBadge, TypeBadge, MethodBadge } from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

// Les formules sont chargées dynamiquement depuis /api/plans
const STATUSES = ["actif", "attente", "suspendu"];
const fmt      = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

// Calcule les infos de retard de cotisation à partir de l'historique des paiements
function getCotisationInfo(client, payments) {
  const mensualites = (payments || [])
    .filter((p) => p.type === "mensualite" && p.status === "paid")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const lastPayment = mensualites[0] || null;
  // Date affichée (informative) vs date utilisée pour calculer le retard.
  // Un paiement couvre 1 mois : le retard ne doit se calculer qu'à partir
  // de la FIN de la période couverte, pas de la date du paiement elle-même.
  let displayDate = null;   // ce qu'on montre à l'agent ("payé le...", "valable jusqu'au...")
  let calcDate    = null;   // ce qui sert au calcul du retard
  let source      = null;

  if (client?.expiration_date) {
    // expiration_date est déjà la fin de période couverte (mise à jour à chaque paiement/migration)
    displayDate = new Date(client.expiration_date);
    calcDate    = displayDate;
    source      = "expiration";
  } else if (lastPayment) {
    displayDate = new Date(lastPayment.created_at);
    calcDate    = new Date(displayDate);
    calcDate.setMonth(calcDate.getMonth() + 1); // fin de la période couverte par ce paiement
    source      = "payment";
  } else if (client?.created_at) {
    // Aucun paiement jamais effectué : pas de période de grâce, le compteur part de l'adhésion
    displayDate = new Date(client.created_at);
    calcDate    = displayDate;
    source      = "creation";
  }

  if (!calcDate) {
    return { lastDate: null, daysSince: null, label: "Aucune donnée", level: "neutral" };
  }

  const now = new Date();
  const diffMs = now - calcDate;
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(daysSince / 30);
  const days = daysSince % 30;

  let label;
  if (daysSince <= 0) {
    label = "À jour";
  } else if (months > 0) {
    label = `${months} mois${days > 0 ? ` et ${days} jour${days > 1 ? "s" : ""}` : ""}`;
  } else {
    label = `${daysSince} jour${daysSince > 1 ? "s" : ""}`;
  }

  // Niveaux d'alerte : à jour = ok, 1-30j = attention, >60j = critique
  let level = "ok";
  if (daysSince > 60) level = "critical";
  else if (daysSince > 0) level = "warning";

  return { lastDate: displayDate, daysSince, label, level, hasPayment: !!lastPayment, source };
}

export default function ClientDetails() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Edit modal
  const [showEdit,   setShowEdit]   = useState(false);
  const [editForm,   setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState("");

  // Formules dynamiques
  const [plans,        setPlans]        = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Payment modal
  const [showPay,    setShowPay]    = useState(false);
  const [payForm,    setPayForm]    = useState({ amount: "", type: "mensualite", payment_method: "cash" });
  const [paySaving,  setPaySaving]  = useState(false);
  const [payError,   setPayError]   = useState("");
  const [paySuccess,    setPaySuccess]    = useState("");
  const [showDelete,    setShowDelete]    = useState(false);
  const [forceActivating, setForceActivating] = useState(false);
  const [forceSuccess,    setForceSuccess]    = useState("");
  const [flagging,        setFlagging]        = useState(false);

  // Famille / Ayants droit
  const [deps,          setDeps]          = useState([]);
  const [depsLoading,   setDepsLoading]   = useState(false);
  const [showDepEdit,   setShowDepEdit]   = useState(false);
  const [depEditTarget, setDepEditTarget] = useState(null); // dep en cours d'édition
  const [depForm,       setDepForm]       = useState({});
  const [depSaving,     setDepSaving]     = useState(false);
  const [depError,      setDepError]      = useState("");
  const [depDeleteTarget, setDepDeleteTarget] = useState(null);

  async function handleDeleteClient(password) {
    const token = localStorage.getItem("token");
    await axios.delete(`${API}/api/clients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { adminPassword: password },
    });
    navigate("/clients");
  }

  async function handleForceActivate() {
    setForceActivating(true);
    setForceSuccess("");
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API}/api/clients/${id}/force-activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForceSuccess("✅ Client réactivé avec succès");
      loadClient();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la réactivation");
    } finally {
      setForceActivating(false);
    }
  }

  async function handleFlagRenewal() {
    setFlagging(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API}/api/clients/${id}/flag-renewal`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadClient();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors du marquage");
    } finally {
      setFlagging(false);
    }
  }

  async function loadDeps() {
    setDepsLoading(true);
    try {
      const { data } = await depsAPI.getByClient(id);
      setDeps(data.dependents || []);
    } catch { /* ignore */ }
    finally { setDepsLoading(false); }
  }

  async function handleDepEdit(e) {
    e.preventDefault();
    setDepSaving(true); setDepError("");
    try {
      await depsAPI.update(depEditTarget.id, depForm);
      setShowDepEdit(false);
      loadDeps();
    } catch (err) {
      setDepError(err.response?.data?.error || "Erreur lors de la modification");
    } finally { setDepSaving(false); }
  }

  async function handleDepDelete(password) {
    await depsAPI.deleteWithPassword(depDeleteTarget.id, password);
    setDepDeleteTarget(null);
    loadDeps();
  }

  async function loadClient() {
    setLoading(true);
    try {
      const { data } = await clientAPI.getById(id);
      setClient(data);
      setEditForm({
        name:   data.client.name,
        phone:  data.client.phone,
        city:   data.client.city || "",
        plan:   data.client.plan,
        status: data.client.status,
      });
    } catch {
      setError("Client introuvable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClient(); loadDeps(); }, [id]);

  // Charger les formules depuis l'API
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/plans`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(({ data }) => { if (data?.length) setPlans(data); })
      .catch(console.error)
      .finally(() => setPlansLoading(false));
  }, []);

  // Gestion retour JEKO après redirect
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const ps = params.get("ps");
    const tx = params.get("tx");
    if (ps === "1") {
      setPaySuccess(`✅ Paiement confirmé${tx ? ` — Réf : ${tx}` : ""}`);
      window.history.replaceState({}, "", window.location.pathname);
      loadClient();
    } else if (ps === "0") {
      setPayError("❌ Paiement annulé ou refusé. Vous pouvez réessayer.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function handleEdit(e) {
    e.preventDefault();
    setEditError(""); setEditSaving(true);
    try {
      await clientAPI.update(id, editForm);
      setShowEdit(false);
      loadClient();
    } catch (err) {
      setEditError(err.response?.data?.error || "Erreur lors de la mise à jour");
    } finally { setEditSaving(false); }
  }

  async function handlePay(e) {
    e.preventDefault();
    setPayError(""); setPaySuccess(""); setPaySaving(true);

    const amount = Number(payForm.amount);

    if (payForm.payment_method === "jeko") {
      // JEKO — redirection
      try {
        const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const token = localStorage.getItem("token");
        const clientData = client?.client || {};
        const txId = `AWJ-CLI-${Date.now()}`;

        const res = await fetch(`${BASE}/api/payments/jeko/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            transaction_id: txId,
            description: `${payForm.type === "adhesion" ? "Adhésion" : "Mensualité"} — ${clientData.name || ""}`,
            client_name:  clientData.name  || "Client",
            client_email: clientData.email || "client@awoundjo.ci",
            client_id:    id,
            type:         payForm.type,
            jeko_method:  payForm.jeko_method || "orange",
            success_url: `${window.location.origin}/clients/${id}?ps=1&tx=${txId}`,
            failed_url:  `${window.location.origin}/clients/${id}?ps=0`,
          }),
        });

        const data = await res.json();
        const paymentUrl = data?.data?.redirect_url || data?.data?.payment_url;

        if (!paymentUrl) {
          throw new Error(data?.error || "URL de paiement JEKO non reçue");
        }

        window.location.href = paymentUrl;
      } catch (err) {
        setPayError(err.message || "Erreur initialisation paiement JEKO");
        setPaySaving(false);
      }

    } else {
      // Cash — enregistrement direct
      try {
        await paymentsAPI.create({
          client_id: id,
          amount,
          type: payForm.type,
          payment_method: "cash",
        });
        setShowPay(false);
        setPayForm({ amount: "", type: "mensualite", payment_method: "cash" });
        loadClient();
      } catch (err) {
        setPayError(err.response?.data?.error || "Erreur lors du paiement");
      } finally { setPaySaving(false); }
    }
  }

  function handleClosePayModal() {
    setShowPay(false);
    setPaySuccess("");
    setPayError("");
    setPayForm({ amount: "", type: "mensualite", payment_method: "cash" });
    loadClient();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">{error}</div>
      <div className="text-center mt-4">
        <Link to="/clients" className="text-brand-500 hover:underline text-sm">← Retour aux clients</Link>
      </div>
    </div>
  );

  const { client: c, payments } = client;
  const cotisInfo = getCotisationInfo(c, payments);

  const cotisStyles = {
    ok:       { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  icon: "✅" },
    warning:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  icon: "⚠️" },
    critical: { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    icon: "🚨" },
    neutral:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600",  icon: "ℹ️" },
  };
  const cs = cotisStyles[cotisInfo.level] || cotisStyles.neutral;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in space-y-6">

      {/* Breadcrumb */}
      <Link to="/clients" className="text-sm text-brand-500 hover:underline">← Retour aux clients</Link>

      {/* Bandeau suspension manuelle — admin only */}
      {isAdmin && c.status === "suspendu" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-800 text-sm">⚠️ Client suspendu automatiquement</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Ce client a été suspendu par la règle du 6 du mois (cotisation impayée) ou manuellement.
              Vous pouvez le réactiver manuellement si la situation a été régularisée.
            </p>
            {forceSuccess && (
              <p className="text-xs text-green-700 font-semibold mt-1">{forceSuccess}</p>
            )}
          </div>
          <button
            onClick={handleForceActivate}
            disabled={forceActivating}
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {forceActivating ? "⏳ Réactivation…" : "🔄 Réactiver manuellement"}
          </button>
        </div>
      )}

      {/* Bandeau renouvellement requis — admin only */}
      {isAdmin && c.status === "renewal_required" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-blue-800 text-sm">🔔 Renouvellement requis</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Ce client a été marqué comme devant renouveler sa cotisation. Il voit une alerte dans son espace adhérent.
              Vous pouvez le réactiver une fois le paiement régularisé.
            </p>
          </div>
          <button
            onClick={handleForceActivate}
            disabled={forceActivating}
            className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {forceActivating ? "⏳ Réactivation…" : "✅ Marquer comme payé"}
          </button>
        </div>
      )}

      {/* Fiche client */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-800">{c.name}</h1>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-slate-500 text-sm font-mono">{c.mutual_number}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowPay(true); setPayError(""); setPaySuccess(""); }}
              className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              💳 Paiement
            </button>
            {isAdmin && (
              <button
                onClick={() => { setShowEdit(true); setEditError(""); }}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                ✏️ Modifier
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowDelete(true)}
                className="border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                🗑️ Supprimer
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-50">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Téléphone</p>
            <p className="text-sm font-medium text-slate-700">{c.phone}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Ville</p>
            <p className="text-sm font-medium text-slate-700">{c.city || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Formule</p>
            <PlanBadge plan={c.plan} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total payé</p>
            <p className="text-sm font-bold text-brand-600">{fmt(c.total_paid)}</p>
          </div>
        </div>

        {c.agent_name && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Agent responsable</p>
            <p className="text-sm font-medium text-slate-700">🧑‍💼 {c.agent_name}</p>
          </div>
        )}
      </div>

      {/* Détails de cotisation */}
      <div className={`rounded-xl border ${cs.border} ${cs.bg} px-5 py-4`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className={`text-sm font-semibold ${cs.text} flex items-center gap-2`}>
              <span>{cs.icon}</span>
              Détails de cotisation
            </p>
            {cotisInfo.lastDate ? (
              <>
                <p className="text-xs text-slate-500 mt-1">
                  {cotisInfo.source === "expiration"
                    ? "Cotisation valable jusqu'au "
                    : cotisInfo.source === "payment"
                      ? "Dernière mensualité payée le "
                      : "Adhésion le "}
                  <span className="font-medium text-slate-700">
                    {cotisInfo.lastDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </p>
                <p className={`text-sm font-bold mt-1 ${cs.text}`}>
                  {cotisInfo.daysSince <= 0
                    ? "Cotisation à jour"
                    : `Impayée depuis ${cotisInfo.label}`}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Aucune information de paiement disponible</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Statut actuel</p>
            <StatusBadge status={c.status} />
          </div>
        </div>
      </div>

      {/* Historique paiements */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="font-semibold text-slate-800">Historique des paiements</h2>
        </div>
        {!payments || payments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-sm">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Méthode</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-right px-4 py-3">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((p) => {
                  const isPaid = p.status === "paid";
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${!isPaid ? "bg-amber-50/40" : ""}`}>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                      <td className="px-4 py-3"><MethodBadge method={p.payment_method} /></td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Payé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Dû
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${isPaid ? "text-brand-600" : "text-amber-600"}`}>
                        {fmt(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* ── Famille / Ayants droit (admin only) ── */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">👨‍👩‍👧 Ayants droit</h2>
            <span className="text-xs text-slate-400">{deps.length} membre(s)</span>
          </div>

          {depsLoading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Chargement…</div>
          ) : deps.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-sm">Aucun ayant droit enregistré</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {deps.map((dep) => (
                <div key={dep.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm flex-shrink-0 overflow-hidden">
                    {dep.photo
                      ? <img src={dep.photo} alt="" className="w-full h-full object-cover" />
                      : (dep.firstname || dep.name || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                      {dep.firstname} {dep.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}
                      {dep.birth_date && ` · ${new Date(dep.birth_date).toLocaleDateString("fr-FR")}`}
                      {dep.birth_place && ` · ${dep.birth_place}`}
                    </p>
                    {dep.identity_document && (
                      <p className="text-xs text-slate-400 mt-0.5">N° pièce : {dep.identity_document}</p>
                    )}
                    {dep.piece && (
                      <a href={dep.piece} target="_blank" rel="noreferrer"
                        className="text-xs text-brand-600 hover:underline mt-0.5 block">
                        📎 Voir la pièce d'identité
                      </a>
                    )}
                  </div>

                  {/* Actions admin */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setDepEditTarget(dep);
                        setDepForm({
                          name:              dep.name              || "",
                          firstname:         dep.firstname         || "",
                          birth_date:        dep.birth_date        ? dep.birth_date.split("T")[0] : "",
                          birth_place:       dep.birth_place       || "",
                          identity_document: dep.identity_document || "",
                        });
                        setDepError("");
                        setShowDepEdit(true);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => setDepDeleteTarget(dep)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal modification */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier le client">
        <form onSubmit={handleEdit} className="space-y-4">
          {editError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{editError}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
              <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
              <input required value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
              <input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Formule</label>
              <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={plansLoading}>
                {plansLoading
                  ? <option>Chargement…</option>
                  : plans.map((p) => (
                      <option key={p.slug} value={p.slug.toUpperCase()}>
                        {p.name}
                      </option>
                    ))
                }
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowEdit(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={editSaving}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-60 font-medium">
              {editSaving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal paiement */}
      <Modal open={showPay} onClose={handleClosePayModal} title="Enregistrer un paiement">
        <form onSubmit={handlePay} className="space-y-4">

          {/* Succès */}
          {paySuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg font-medium">
              {paySuccess}
            </div>
          )}

          {/* Erreur */}
          {payError && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{payError}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant (FCFA) *</label>
            <input
              required type="number" min="1" value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              placeholder="Ex : 5000"
              disabled={paySaving}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={payForm.type} onChange={(e) => setPayForm({ ...payForm, type: e.target.value })}
              disabled={paySaving}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="mensualite">Mensualité</option>
              <option value="adhesion">Adhésion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Méthode</label>
            <select value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
              disabled={paySaving}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="cash">💵 Cash</option>
              <option value="jeko">💳 JEKO (Orange · Wave · MTN · Moov · Carte)</option>
            </select>
          </div>

          {/* Sélecteur méthode JEKO */}
          {payForm.payment_method === "jeko" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Réseau de paiement</label>
              <select
                value={payForm.jeko_method || "orange"}
                onChange={(e) => setPayForm({ ...payForm, jeko_method: e.target.value })}
                disabled={paySaving}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="orange">🟠 Orange Money</option>
                <option value="wave">🔵 Wave</option>
                <option value="mtn">🟡 MTN Mobile Money</option>
                <option value="moov">🟢 Moov Money</option>
                <option value="djamo">💜 Djamo / Carte bancaire</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={handleClosePayModal} disabled={paySaving}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
              {paySuccess ? "Fermer" : "Annuler"}
            </button>
            {!paySuccess && (
              <button type="submit" disabled={paySaving}
                className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-60 font-medium transition-colors">
                {paySaving
                  ? "⏳ Ouverture…"
                  : payForm.payment_method === "jeko"
                    ? "💳 Payer via JEKO"
                    : "✅ Valider le paiement"}
              </button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteClient}
        title={`Supprimer le client "${client?.client?.name}" ?`}
        description="Cela supprimera définitivement ce client et tous ses paiements associés."
        label={client?.client?.name}
      />

      {/* Modal modifier ayant droit */}
      <Modal open={showDepEdit} onClose={() => setShowDepEdit(false)} title="✏️ Modifier l'ayant droit">
        <form onSubmit={handleDepEdit} className="space-y-4">
          {depError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{depError}</div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input required value={depForm.name || ""}
                onChange={e => setDepForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
              <input required value={depForm.firstname || ""}
                onChange={e => setDepForm(f => ({ ...f, firstname: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
              <input type="date" value={depForm.birth_date || ""}
                onChange={e => setDepForm(f => ({ ...f, birth_date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lieu de naissance</label>
              <input value={depForm.birth_place || ""}
                onChange={e => setDepForm(f => ({ ...f, birth_place: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">N° pièce d'identité</label>
              <input value={depForm.identity_document || ""}
                onChange={e => setDepForm(f => ({ ...f, identity_document: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowDepEdit(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={depSaving}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold disabled:opacity-60">
              {depSaving ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal supprimer ayant droit */}
      <ConfirmDeleteModal
        open={!!depDeleteTarget}
        onClose={() => setDepDeleteTarget(null)}
        onConfirm={handleDepDelete}
        title={`Supprimer l'ayant droit "${depDeleteTarget?.firstname} ${depDeleteTarget?.name}" ?`}
        description="Cette action est irréversible."
        label={`${depDeleteTarget?.firstname || ""} ${depDeleteTarget?.name || ""}`}
      />
    </div>
  );
}