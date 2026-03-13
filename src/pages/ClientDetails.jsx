import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { clientAPI, paymentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PlanBadge, TypeBadge, MethodBadge } from "../components/Badge";
import Modal from "../components/Modal";

const PLANS    = ["ESSENTIELLE", "IVOIRIENNE", "TURQUOISE"];
const STATUSES = ["actif", "attente", "suspendu"];
const fmt      = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Edit modal
  const [showEdit,   setShowEdit]   = useState(false);
  const [editForm,   setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState("");

  // Payment modal
  const [showPay,   setShowPay]   = useState(false);
  const [payForm,   setPayForm]   = useState({ amount: "", type: "mensualite", payment_method: "cash" });
  const [paySaving, setPaySaving] = useState(false);
  const [payError,  setPayError]  = useState("");
  const [waveLink,  setWaveLink]  = useState("");

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

  useEffect(() => { loadClient(); }, [id]);

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
    setPayError(""); setWaveLink(""); setPaySaving(true);
    try {
      if (payForm.payment_method === "wave") {
        const { data } = await paymentAPI.getWaveLink({ client_id: id, amount: Number(payForm.amount), type: payForm.type });
        setWaveLink(data.wave_link);
      } else {
        await paymentAPI.create({ client_id: id, amount: Number(payForm.amount), type: payForm.type, payment_method: "cash" });
        setShowPay(false);
        setPayForm({ amount: "", type: "mensualite", payment_method: "cash" });
        loadClient();
      }
    } catch (err) {
      setPayError(err.response?.data?.error || "Erreur lors du paiement");
    } finally { setPaySaving(false); }
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in space-y-6">

      {/* Breadcrumb */}
      <Link to="/clients" className="text-sm text-brand-500 hover:underline">← Retour aux clients</Link>

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
              onClick={() => { setShowPay(true); setPayError(""); setWaveLink(""); }}
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
                  <th className="text-right px-4 py-3">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(p.paid_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                    <td className="px-4 py-3"><MethodBadge method={p.payment_method} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {PLANS.map((p) => <option key={p}>{p}</option>)}
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
      <Modal open={showPay} onClose={() => { setShowPay(false); setWaveLink(""); }} title="Enregistrer un paiement">
        {waveLink ? (
          <div className="text-center space-y-4">
            <p className="text-2xl">📱</p>
            <p className="font-medium text-slate-800">Lien Wave généré</p>
            <a href={waveLink} target="_blank" rel="noopener noreferrer"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg text-sm transition-colors">
              Ouvrir le lien Wave →
            </a>
            <button onClick={() => { setWaveLink(""); loadClient(); setShowPay(false); }}
              className="text-sm text-slate-500 hover:underline">Fermer</button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            {payError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{payError}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant (FCFA) *</label>
              <input required type="number" min="1" value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                placeholder="Ex : 5000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={payForm.type} onChange={(e) => setPayForm({ ...payForm, type: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="mensualite">Mensualité</option>
                <option value="adhesion">Adhésion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Méthode</label>
              <select value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="cash">💵 Cash</option>
                <option value="wave">📱 Wave</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowPay(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
              <button type="submit" disabled={paySaving}
                className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-60 font-medium">
                {paySaving ? "Traitement…" : payForm.payment_method === "wave" ? "Générer lien Wave" : "Valider le paiement"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
