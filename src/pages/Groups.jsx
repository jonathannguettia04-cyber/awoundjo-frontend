import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { groupAPI, clientAPI } from "../services/api";
import { ADMIN_BASE } from "../config/adminBase";
import Modal from "../components/Modal";
import { StatusBadge, PlanBadge } from "../components/Badge";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

// Composant recherche client pour ajout membres
function ClientSearch({ onSelect, exclude = [] }) {
  const [search,  setSearch]  = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function doSearch(val) {
    setSearch(val);
    if (val.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await clientAPI.getAll({ search: val, limit: 8 });
      setResults((data.clients || []).filter((c) => !exclude.includes(c.id)));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  return (
    <div className="relative">
      <input
        value={search}
        onChange={(e) => doSearch(e.target.value)}
        placeholder="Rechercher un client par nom ou numéro…"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {loading && <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
          {results.map((c) => (
            <button key={c.id} type="button"
              onClick={() => { onSelect(c); setSearch(""); setResults([]); }}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-left transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-400 font-mono">{c.mutual_number}</p>
              </div>
              <PlanBadge plan={c.plan} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Groups() {
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal création groupe
  const [showCreate,  setShowCreate]  = useState(false);
  const [groupName,   setGroupName]   = useState("");
  const [referent,    setReferent]    = useState(null);
  const [members,     setMembers]     = useState([]);
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState("");

  // Modal détail groupe
  const [selected,    setSelected]    = useState(null);
  const [groupDetail, setGroupDetail] = useState(null);
  const [detailLoad,  setDetailLoad]  = useState(false);

  // Modal paiement groupe
  const [showPay,   setShowPay]   = useState(false);
  const [payForm,   setPayForm]   = useState({ total_amount: "", type: "mensualite", payment_method: "cash" });
  const [paying,    setPaying]    = useState(false);
  const [payError,  setPayError]  = useState("");
  const [payResult, setPayResult] = useState(null);

  // Modal ajout membres
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMember,  setAddingMember]  = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

  async function loadGroups() {
    setLoading(true);
    try {
      const { data } = await groupAPI.getAll();
      setGroups(data.groups || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function loadGroupDetail(id) {
    setDetailLoad(true);
    try {
      const { data } = await groupAPI.getById(id);
      setGroupDetail(data);
    } catch { /* ignore */ }
    finally { setDetailLoad(false); }
  }

  useEffect(() => { loadGroups(); }, []);

  useEffect(() => {
    if (selected) loadGroupDetail(selected.id);
  }, [selected]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError(""); setCreating(true);
    try {
      if (!referent) { setCreateError("Veuillez choisir un référent"); setCreating(false); return; }
      await groupAPI.create({
        name:       groupName,
        referent_id: referent.id,
        member_ids:  members.map((m) => m.id),
      });
      setShowCreate(false);
      setGroupName(""); setReferent(null); setMembers([]);
      loadGroups();
    } catch (err) {
      setCreateError(err.response?.data?.error || "Erreur création groupe");
    } finally { setCreating(false); }
  }

  async function handlePay(e) {
    e.preventDefault();
    setPayError(""); setPayResult(null); setPaying(true);
    try {
      const { data } = await groupAPI.pay(selected.id, {
        total_amount:   Number(payForm.total_amount),
        type:           payForm.type,
        payment_method: payForm.payment_method,
      });
      setPayResult(data);
      loadGroupDetail(selected.id);
      loadGroups();
    } catch (err) {
      setPayError(err.response?.data?.error || "Erreur paiement groupe");
    } finally { setPaying(false); }
  }

  async function handleRemoveMember(clientId) {
    try {
      await groupAPI.removeMember(selected.id, clientId);
      loadGroupDetail(selected.id);
      loadGroups();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur suppression membre");
    }
  }

  async function handleAddMember(client) {
    setAddingMember(true);
    setAddMemberError("");
    try {
      await groupAPI.addMembers(selected.id, { member_ids: [client.id] });
      await loadGroupDetail(selected.id);
      loadGroups();
      setShowAddMember(false);
    } catch (err) {
      setAddMemberError(err.response?.data?.error || "Erreur lors de l'ajout du membre");
    } finally { setAddingMember(false); }
  }

  const allMemberIds = [
    ...(referent ? [referent.id] : []),
    ...members.map((m) => m.id),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Groupes</h1>
          <p className="text-slate-500 text-sm">{groups.length} groupe(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => { setGroupName(""); setReferent(null); setMembers([]); setCreateError(""); setShowCreate(true); }}
          className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto"
        >
          + Nouveau groupe
        </button>
      </div>

      {/* Liste groupes */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <p className="text-4xl mb-3">👨‍👩‍👧‍👦</p>
          <p className="font-medium">Aucun groupe enregistré</p>
          <p className="text-sm mt-1">Créez votre premier groupe de cotisation</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div key={g.id}
              onClick={() => setSelected(g)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
                  {g.name?.charAt(0).toUpperCase()}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${g.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {g.active ? "Actif" : "Inactif"}
                </span>
              </div>
              <p className="font-bold text-slate-800 text-base">{g.name}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                👤 Référent : <span className="font-medium text-slate-700">{g.referent_name}</span>
              </p>
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-sm">
                <span className="text-slate-500">👥 {g.nb_members} membre(s)</span>
                <span className="text-xs text-slate-400">{g.agent_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal création groupe ──────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau groupe">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{createError}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du groupe *</label>
            <input required value={groupName} onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex : Groupe Famille Koné"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Référent du groupe *</label>
            {referent ? (
              <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-brand-700">{referent.name}</p>
                  <p className="text-xs text-brand-500 font-mono">{referent.mutual_number}</p>
                </div>
                <button type="button" onClick={() => setReferent(null)} className="text-slate-400 hover:text-red-500 text-lg">✕</button>
              </div>
            ) : (
              <ClientSearch onSelect={(c) => setReferent(c)} exclude={allMemberIds} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Autres membres <span className="text-slate-400 font-normal">({members.length} ajouté(s))</span>
            </label>
            <ClientSearch
              onSelect={(c) => { if (!members.find((m) => m.id === c.id)) setMembers([...members, c]); }}
              exclude={allMemberIds}
            />
            {members.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{m.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{m.mutual_number}</p>
                    </div>
                    <button type="button" onClick={() => setMembers(members.filter((x) => x.id !== m.id))}
                      className="text-slate-400 hover:text-red-500 text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={creating}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl disabled:opacity-60 font-semibold">
              {creating ? "Création…" : `Créer le groupe (${allMemberIds.length} membre(s))`}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal détail groupe ────────────────────────────── */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setGroupDetail(null); setPayResult(null); }} title={selected?.name || ""}>
        {detailLoad ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groupDetail ? (
          <div className="space-y-5">

            {/* Infos groupe */}
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Référent</p>
                <p className="font-semibold text-slate-800">{groupDetail.group.referent_name}</p>
                <p className="text-xs text-slate-500 font-mono">{groupDetail.group.referent_mutual_number}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Agent</p>
                <p className="font-semibold text-slate-800">{groupDetail.group.agent_name}</p>
              </div>
            </div>

            {/* Membres */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">
                  👥 Membres ({groupDetail.group.members?.length || 0})
                </p>
                <button onClick={() => setShowAddMember(true)}
                  className="text-xs font-semibold text-brand-600 hover:underline">+ Ajouter</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {groupDetail.group.members?.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                        ${m.is_referent ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-500"}`}>
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link to={`${ADMIN_BASE}/clients/${m.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600 hover:underline">
                          {m.name}
                          {m.is_referent && <span className="ml-1.5 text-xs bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full">Référent</span>}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono">{m.mutual_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                      {!m.is_referent && (
                        <button onClick={() => handleRemoveMember(m.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors text-sm">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton paiement */}
            {!payResult && (
              <button
                onClick={() => { setPayForm({ total_amount: "", type: "mensualite", payment_method: "cash" }); setPayError(""); setShowPay(true); }}
                className="w-full bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                💳 Enregistrer une cotisation groupe
              </button>
            )}

            {/* Résultat paiement */}
            {payResult && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
                <p className="text-green-700 font-bold text-lg">✅ Paiement enregistré !</p>
                <p className="text-sm text-green-600">{payResult.nb_members} membre(s) mis à jour</p>
                <p className="text-sm text-green-600">{fmt(payResult.amount_per_member)} / membre</p>
                <p className="text-xs text-green-500">Commission : {fmt(payResult.total_commission)}</p>
                <button onClick={() => setPayResult(null)} className="text-xs text-green-600 underline mt-1">Fermer</button>
              </div>
            )}

            {/* Historique paiements */}
            {groupDetail.payments?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Derniers paiements</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {groupDetail.payments.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-slate-600">{p.client_name}</span>
                      <span className="font-semibold text-brand-600">{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* ── Modal paiement groupe ──────────────────────────── */}
      <Modal open={showPay} onClose={() => setShowPay(false)} title="Cotisation groupe">
        <form onSubmit={handlePay} className="space-y-4">
          {payError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{payError}</div>}

          <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-sm text-brand-700">
            👥 <strong>{groupDetail?.group?.members?.length || 0} membres</strong> — le montant sera divisé équitablement
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant total (FCFA) *</label>
            <input required type="number" min="1" value={payForm.total_amount}
              onChange={(e) => setPayForm({ ...payForm, total_amount: e.target.value })}
              placeholder="Ex : 50000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {payForm.total_amount && groupDetail?.group?.members?.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                = {fmt(Math.round(Number(payForm.total_amount) / groupDetail.group.members.length * 100) / 100)} / membre
              </p>
            )}
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
            <button type="submit" disabled={paying}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl disabled:opacity-60 font-semibold">
              {paying ? "Traitement…" : "Valider la cotisation"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal ajout membre ─────────────────────────────── */}
      <Modal open={showAddMember} onClose={() => { setShowAddMember(false); setAddMemberError(""); }} title="Ajouter un membre">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Recherchez un client à ajouter au groupe</p>
          {addMemberError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              ❌ {addMemberError}
            </div>
          )}
          <ClientSearch
            onSelect={handleAddMember}
            exclude={groupDetail?.group?.members?.map((m) => m.id) || []}
          />
          {addingMember && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              Ajout en cours…
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
