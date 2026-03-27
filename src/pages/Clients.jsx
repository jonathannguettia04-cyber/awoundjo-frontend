import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { clientAPI } from "../services/api";
import { StatusBadge, PlanBadge } from "../components/Badge";
import Modal from "../components/Modal";
import { payWithCinetPay } from "../services/cinetpay";

const PLANS    = ["ESSENTIELLE", "IVOIRIENNE", "TURQUOISE"];
const STATUSES = ["actif", "attente", "suspendu"];
const EMPTY    = { name: "", phone: "", city: "", plan: "ESSENTIELLE", status: "attente" };

// Frais d'adhésion : 15 000 FCFA pour toutes les formules
const ADHESION_FEE = 15000;

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep     = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const rows    = lines.slice(1).map((line) => {
    const vals = line.split(sep).map((v) => v.trim().replace(/['"]/g, ""));
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

function mapRow(row) {
  const get = (...keys) => {
    for (const k of keys) {
      if (row[k] && row[k].trim()) return row[k].trim();
    }
    return "";
  };
  return {
    name:   get("nom", "name", "nom complet", "prenom nom", "client"),
    phone:  get("telephone", "phone", "tel", "mobile", "contact"),
    city:   get("ville", "city", "localite", "localité"),
    plan:   (get("formule", "plan", "forfait") || "ESSENTIELLE").toUpperCase(),
    status: (get("statut", "status", "etat", "état") || "actif").toLowerCase(),
  };
}

export default function Clients() {
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlan,   setFilterPlan]   = useState("");
  const [pagination,   setPagination]   = useState({ total: 0, page: 1, pages: 1 });

  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");

  const [accessCode, setAccessCode] = useState("");
  const [showCode,   setShowCode]   = useState(false);

  // États pour le paiement CinetPay après création
  const [pendingPayment, setPendingPayment] = useState(null); // { client, accessCode }
  const [showPayModal,   setShowPayModal]   = useState(false);
  const [payError,       setPayError]       = useState("");
  const [paySuccess,     setPaySuccess]     = useState("");
  const [paying,         setPaying]         = useState(false);

  const [showImport,   setShowImport]   = useState(false);
  const [csvRows,      setCsvRows]      = useState([]);
  const [csvErrors,    setCsvErrors]    = useState([]);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [csvFileName,  setCsvFileName]  = useState("");
  const fileRef = useRef();

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPlan)   params.plan   = filterPlan;
      const { data } = await clientAPI.getAll(params);
      setClients(data.clients);
      setPagination(data.pagination);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search, filterStatus, filterPlan]);

  useEffect(() => { load(1); }, [load]);

  // ── Création client + ouverture du modal de paiement ───────────
  async function handleCreate(e) {
    e.preventDefault();
    setFormError(""); setSaving(true);
    try {
      const { data } = await clientAPI.create(form);
      setShowModal(false);

      // Identifiants temporaires retournés par l'API
      const createdClient = data.client || data;
      const accessCode    = createdClient.access_code  || data.access_code  || null;
      const mutualNumber  = createdClient.mutual_number || data.mutual_number || null;

      // Préparer les infos pour le paiement CinetPay
      setPendingPayment({
        client:       { name: form.name, phone: form.phone, email: "" },
        plan:         form.plan,
        accessCode,
        mutualNumber,
        clientId:     createdClient.id || data.id,
      });
      setPayError("");
      setPaySuccess("");
      setShowPayModal(true);
      setForm(EMPTY);
      load(1);
    } catch (err) {
      setFormError(err.response?.data?.error || "Erreur lors de la création");
    } finally { setSaving(false); }
  }

  // ── Lancement du paiement d'adhésion CinetPay ──────────────────
  function handlePayAdhesion() {
    if (!pendingPayment) return;
    const amount = ADHESION_FEE;
    setPayError(""); setPaying(true);

    payWithCinetPay({
      user:          pendingPayment.client,
      amount,
      description:   `Adhésion Awoundjô — Formule ${pendingPayment.plan}`,
      transactionId: `AWJ-ADH-${Date.now()}`,

      onSuccess: async (cinetData, txId) => {
        setPaying(false);
        try {
          // Enregistrer le paiement d'adhésion côté serveur
          await clientAPI.recordPayment?.({
            clientId:              pendingPayment.clientId,
            amount,
            payment_method:        "CinetPay",
            transaction_reference: txId,
            payment_type:          "adhesion",
          });
        } catch { /* paiement accepté côté CinetPay, sync sera faite via webhook */ }

        setPaySuccess(`✅ Adhésion confirmée — Réf: ${txId}`);
        // Afficher le code d'accès si disponible
        if (pendingPayment.accessCode) {
          setAccessCode(pendingPayment.accessCode);
          setTimeout(() => {
            setShowPayModal(false);
            setPaySuccess("");
            setShowCode(true);
          }, 1500);
        }
        load(1);
      },

      onError: ({ message }) => {
        setPaying(false);
        setPayError(message || "Le paiement a été refusé ou annulé.");
      },
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportResult(null);
    setCsvErrors([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows } = parseCSV(ev.target.result);
      const mapped   = rows.map((r, i) => {
        const m = mapRow(r);
        const errs = [];
        if (!m.name)  errs.push("Nom manquant");
        if (!m.phone) errs.push("Téléphone manquant");
        if (!PLANS.includes(m.plan)) m.plan = "ESSENTIELLE";
        if (!STATUSES.includes(m.status)) m.status = "actif";
        return { ...m, _row: i + 2, _errors: errs, _selected: errs.length === 0 };
      });
      setCsvRows(mapped);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    const toImport = csvRows.filter((r) => r._selected && r._errors.length === 0);
    if (!toImport.length) return;
    setImporting(true);
    const results = { success: 0, failed: 0, errors: [] };
    for (const row of toImport) {
      try {
        await clientAPI.create({ name: row.name, phone: row.phone, city: row.city, plan: row.plan, status: row.status });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Ligne ${row._row} (${row.name}) : ${err.response?.data?.error || "Erreur"}`);
      }
    }
    setImporting(false);
    setImportResult(results);
    if (results.success > 0) load(1);
  }

  function toggleRow(i) {
    setCsvRows((prev) => prev.map((r, idx) => idx === i ? { ...r, _selected: !r._selected } : r));
  }

  const validRows    = csvRows.filter((r) => r._errors.length === 0);
  const invalidRows  = csvRows.filter((r) => r._errors.length > 0);
  const selectedRows = csvRows.filter((r) => r._selected && r._errors.length === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
          <p className="text-slate-500 text-sm">{pagination.total} adhérent(s)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setCsvRows([]); setCsvErrors([]); setImportResult(null); setCsvFileName(""); setShowImport(true); }}
            className="flex-1 sm:flex-none border border-brand-500 text-brand-600 hover:bg-brand-50 active:scale-95 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            📂 Importer CSV
          </button>
          <button
            onClick={() => { setForm(EMPTY); setFormError(""); setShowModal(true); }}
            className="flex-1 sm:flex-none bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            + Nouveau client
          </button>
        </div>
      </div>

      {/* ── Filtres ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text" placeholder="🔍 Rechercher nom, téléphone, numéro…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Toutes les formules</option>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Chargement…</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium">Aucun client trouvé</p>
        </div>
      ) : (
        <>
          {/* ── TABLE (desktop ≥ md) ────────────────────────────── */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Nom</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Téléphone</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Ville</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Formule</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">N° Mutuel</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Total payé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/clients/${c.id}`} className="font-semibold text-brand-600 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                      <td className="px-4 py-3 text-slate-500">{c.city || "—"}</td>
                      <td className="px-4 py-3"><PlanBadge plan={c.plan} /></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.mutual_number}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {Number(c.total_paid).toLocaleString("fr-FR")} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Page {pagination.page} / {pagination.pages} · {pagination.total} clients
                </p>
                <div className="flex gap-2">
                  <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                    ← Préc.
                  </button>
                  <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                    Suiv. →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── CARTES (mobile < md) ────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {clients.map((c) => (
              <Link key={c.id} to={`/clients/${c.id}`}
                className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow active:scale-[.99]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-slate-800 text-base leading-tight">{c.name}</p>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <PlanBadge plan={c.plan} />
                  <span className="font-mono text-xs text-slate-400">{c.mutual_number}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>📞 {c.phone}</span>
                  {c.city && <span>📍 {c.city}</span>}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total payé</span>
                  <span className="font-bold text-slate-700 text-sm">
                    {Number(c.total_paid).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </Link>
            ))}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  {pagination.page} / {pagination.pages} · {pagination.total} clients
                </p>
                <div className="flex gap-2">
                  <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}
                    className="px-4 py-2 text-xs border border-slate-200 rounded-xl disabled:opacity-40 bg-white font-semibold">
                    ← Préc.
                  </button>
                  <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}
                    className="px-4 py-2 text-xs border border-slate-200 rounded-xl disabled:opacity-40 bg-white font-semibold">
                    Suiv. →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal nouveau client ──────────────────────────────── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="➕ Nouveau client">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Kouamé Jean"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ex: 0707070707"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ex: Abidjan"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Formule *</label>
              <select required value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {PLANS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statut initial</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Aperçu frais d'adhésion */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">💳</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">Frais d'adhésion : {ADHESION_FEE.toLocaleString("fr-FR")} FCFA</p>
              <p className="text-xs text-blue-500">Un paiement CinetPay sera proposé après la création · Identifiants générés automatiquement</p>
            </div>
          </div>

          <div className="pt-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl disabled:opacity-60 font-semibold">
              {saving ? "Enregistrement…" : "Créer le client"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal paiement adhésion CinetPay ─────────────────── */}
      <Modal open={showPayModal} onClose={() => !paying && setShowPayModal(false)} title="💳 Paiement de l'adhésion">
        <div className="space-y-4">
          {paySuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-green-700 font-bold text-sm">{paySuccess}</p>
            </div>
          ) : (
            <>
              {payError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  ⚠️ {payError}
                </div>
              )}

              {pendingPayment && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client</span>
                    <span className="font-semibold text-slate-800">{pendingPayment.client.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Formule</span>
                    <span className="font-semibold text-slate-800">{pendingPayment.plan}</span>
                  </div>
                  {pendingPayment.mutualNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">N° Mutuel</span>
                      <span className="font-mono text-xs font-bold text-slate-700">{pendingPayment.mutualNumber}</span>
                    </div>
                  )}
                  {pendingPayment.accessCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Code d'accès</span>
                      <span className="font-mono text-sm font-bold text-brand-600 tracking-widest">{pendingPayment.accessCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-600 font-semibold">Adhésion (toutes formules)</span>
                    <span className="font-bold text-brand-600 text-base">
                      {ADHESION_FEE.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Moyens acceptés</p>
                <div className="flex gap-2 flex-wrap">
                  {["🟠 Orange Money","💛 MTN MoMo","🌊 Wave","💳 Carte"].map(m => (
                    <span key={m} className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium text-slate-600">{m}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowPayModal(false)} disabled={paying}
                  className="flex-1 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">
                  Payer plus tard
                </button>
                <button onClick={handlePayAdhesion} disabled={paying}
                  className="flex-1 px-4 py-2.5 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold disabled:opacity-60 transition-all">
                  {paying ? "⏳ Ouverture…" : "💳 Payer maintenant"}
                </button>
              </div>

              <p className="text-center text-xs text-slate-400">🔒 Paiement sécurisé par CinetPay</p>
            </>
          )}
        </div>
      </Modal>

      {/* ── Modal code d'accès ───────────────────────────────── */}
      <Modal open={showCode} onClose={() => setShowCode(false)} title="🔑 Identifiants du client">
        <div className="text-center space-y-4 py-2">
          <p className="text-slate-600 text-sm">Communiquez ces identifiants au client pour sa première connexion :</p>

          {pendingPayment?.mutualNumber && (
            <div className="bg-slate-100 rounded-xl px-6 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Numéro Mutuel</p>
              <p className="text-xl font-mono font-bold text-slate-700">{pendingPayment.mutualNumber}</p>
            </div>
          )}

          <div className="bg-slate-100 rounded-xl px-6 py-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Code d'accès temporaire</p>
            <p className="text-3xl font-mono font-bold tracking-widest text-brand-600">{accessCode}</p>
          </div>
          <p className="text-xs text-red-500 font-medium">⚠️ Ce code ne sera plus affiché après fermeture</p>
          <button onClick={() => navigator.clipboard.writeText(accessCode)}
            className="w-full py-2 text-sm font-semibold border border-brand-200 text-brand-600 rounded-xl hover:bg-brand-50">
            📋 Copier le code
          </button>
          <button onClick={() => setShowCode(false)}
            className="w-full py-2 text-sm font-semibold bg-brand-500 text-white rounded-xl hover:bg-brand-600">
            J'ai noté le code ✓
          </button>
        </div>
      </Modal>

      {/* ── Modal import CSV ─────────────────────────────────── */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="📂 Importer des anciens clients">
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-2">Format CSV attendu :</p>
            <p className="font-mono text-xs bg-white border border-blue-100 rounded px-3 py-2 mt-1">
              nom;telephone;ville;formule;statut
            </p>
            <p className="text-xs mt-2 text-blue-600">
              Colonnes acceptées : <strong>nom</strong>, <strong>telephone</strong>, <strong>ville</strong> (optionnel),{" "}
              <strong>formule</strong> (ESSENTIELLE/IVOIRIENNE/TURQUOISE), <strong>statut</strong> (actif/attente/suspendu)
            </p>
            <p className="text-xs mt-1 text-blue-500">Séparateur : <strong>;</strong> ou <strong>,</strong> · Encodage : UTF-8</p>
          </div>

          {!csvRows.length && !importResult && (
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all">
              <p className="text-3xl mb-2">📄</p>
              <p className="font-semibold text-slate-700">Cliquez pour choisir un fichier CSV</p>
              <p className="text-xs text-slate-400 mt-1">ou glissez-déposez ici</p>
              {csvFileName && <p className="text-xs text-brand-600 mt-2 font-medium">📎 {csvFileName}</p>}
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {importResult && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold text-lg">✅ Import terminé !</p>
                <p className="text-green-600 text-sm mt-1">{importResult.success} client(s) importé(s) avec succès</p>
                {importResult.failed > 0 && (
                  <p className="text-amber-600 text-sm">{importResult.failed} ligne(s) échouée(s)</p>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 max-h-32 overflow-y-auto">
                  {importResult.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
                </div>
              )}
              <button onClick={() => { setCsvRows([]); setImportResult(null); setCsvFileName(""); setShowImport(false); }}
                className="w-full py-2 text-sm font-semibold text-brand-600 border border-brand-200 rounded-xl hover:bg-brand-50">
                Fermer
              </button>
            </div>
          )}

          {csvRows.length > 0 && !importResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                  ✅ {validRows.length} valides
                </span>
                {invalidRows.length > 0 && (
                  <span className="bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">
                    ❌ {invalidRows.length} erreurs
                  </span>
                )}
                <span className="text-slate-400 text-xs">{selectedRows.length} sélectionné(s)</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left w-8">
                        <input type="checkbox"
                          checked={selectedRows.length === validRows.length && validRows.length > 0}
                          onChange={(e) => setCsvRows((prev) => prev.map((r) =>
                            r._errors.length === 0 ? { ...r, _selected: e.target.checked } : r
                          ))} />
                      </th>
                      <th className="px-3 py-2 text-left">Nom</th>
                      <th className="px-3 py-2 text-left">Téléphone</th>
                      <th className="px-3 py-2 text-left hidden sm:table-cell">Ville</th>
                      <th className="px-3 py-2 text-left">Formule</th>
                      <th className="px-3 py-2 text-left hidden sm:table-cell">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvRows.map((row, i) => (
                      <tr key={i} className={row._errors.length > 0 ? "bg-red-50" : "hover:bg-slate-50"}>
                        <td className="px-3 py-2">
                          {row._errors.length === 0 ? (
                            <input type="checkbox" checked={row._selected} onChange={() => toggleRow(i)} />
                          ) : (
                            <span title={row._errors.join(", ")} className="text-red-500 cursor-help">⚠️</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800">{row.name || <span className="text-red-400">—</span>}</td>
                        <td className="px-3 py-2 text-slate-600">{row.phone || <span className="text-red-400">—</span>}</td>
                        <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{row.city || "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            row.plan === "TURQUOISE" ? "bg-teal-100 text-teal-700" :
                            row.plan === "IVOIRIENNE" ? "bg-purple-100 text-purple-700" :
                            "bg-brand-100 text-brand-700"
                          }`}>{row.plan}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-500 capitalize hidden sm:table-cell">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setCsvRows([]); setCsvFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                  ↩ Changer de fichier
                </button>
                <button onClick={handleImport} disabled={importing || selectedRows.length === 0}
                  className="flex-1 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl disabled:opacity-60 transition-all">
                  {importing ? `Import en cours… (${selectedRows.length})` : `Importer ${selectedRows.length} client(s)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
