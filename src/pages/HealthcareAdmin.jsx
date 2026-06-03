
import { useEffect, useState } from "react";
import { healthcareAPI } from "../services/api";
import Modal from "../components/Modal";
import * as XLSX from "xlsx";

const TYPES = [
  { id: "pharmacy", label: "Pharmacie",   icon: "💊", color: "bg-green-100 text-green-700 border-green-200" },
  { id: "clinic",   label: "Clinique",    icon: "🏥", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "hospital", label: "Hôpital",     icon: "🏨", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "lab",      label: "Laboratoire", icon: "🔬", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "optician", label: "Opticien",    icon: "👓", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: "dentist",  label: "Dentiste",    icon: "🦷", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { id: "midwife",  label: "Sage-femme",  icon: "🩺", color: "bg-pink-100 text-pink-700 border-pink-200" },
];

const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.id, t]));
const EMPTY = { name: "", type: "pharmacy", address: "", city: "", commune: "", phone: "", email: "", manager_name: "" };

export default function HealthcareAdmin() {
  const [providers,    setProviders]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterType,   setFilterType]   = useState("all");
  const [filterCity,   setFilterCity]   = useState("");
  const [search,       setSearch]       = useState("");

  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState("");

  const [confirm,      setConfirm]      = useState(null);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState(null);

  // ── Chargement ───────────────────────────────────────────────
  async function load() {
    setLoading(true);
    try {
      const { data } = await healthcareAPI.getProviders({ active: "all" });
      setProviders(data.providers || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // ── CRUD ─────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null); setForm(EMPTY); setFormError(""); setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name, type: p.type,
      address: p.address || "", city: p.city || "", commune: p.commune || "",
      phone: p.phone || "", email: p.email || "",
      manager_name: p.manager_name || "",
    });
    setFormError(""); setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError(""); setSaving(true);
    try {
      if (editing) {
        await healthcareAPI.updateProvider(editing.id, form);
      } else {
        await healthcareAPI.createProvider(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || "Erreur");
    } finally { setSaving(false); }
  }

  async function handleDelete(p) {
    try {
      await healthcareAPI.deleteProvider(p.id);
      setConfirm(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur suppression");
    }
  }

  async function handleRestore(p) {
    try {
      await healthcareAPI.updateProvider(p.id, { active: true });
      load();
    } catch { /* ignore */ }
  }

  // ── Import Excel ─────────────────────────────────────────────
  async function handleImportExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

      let ok = 0;
      const errors = [];

      for (const row of rows) {
        const payload = {
          name:         String(row["Nom"]          || row["name"]         || "").trim(),
          type:         String(row["Type"]         || row["type"]         || "pharmacy").trim().toLowerCase(),
          city:         String(row["Ville"]        || row["city"]         || "").trim(),
          commune:      String(row["Commune"]      || row["commune"]      || "").trim(),
          address:      String(row["Adresse"]      || row["address"]      || "").trim(),
          phone:        String(row["Téléphone"]    || row["phone"]        || "").trim(),
          email:        String(row["Email"]        || row["email"]        || "").trim(),
          manager_name: String(row["Responsable"]  || row["manager_name"] || "").trim(),
        };

        if (!payload.name) { errors.push("Ligne ignorée : nom manquant"); continue; }
        if (!["pharmacy", "clinic", "hospital", "lab", "optician", "dentist", "midwife"].includes(payload.type)) {
          payload.type = "pharmacy";
        }

        try {
          await healthcareAPI.createProvider(payload);
          ok++;
        } catch (err) {
          errors.push(`${payload.name} : ${err.response?.data?.error || "erreur"}`);
        }
      }

      setImportResult({ ok, errors });
      load();
    } catch {
      setImportResult({ ok: 0, errors: ["Fichier invalide ou illisible"] });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  // ── Données filtrées ──────────────────────────────────────────
  const cities = ["Toutes", ...Array.from(new Set(providers.map((p) => p.city).filter(Boolean))).sort()];

  const filtered = providers.filter((p) => {
    const matchType   = filterType === "all" || p.type === filterType;
    const matchCity   = !filterCity || filterCity === "Toutes" || p.city === filterCity;
    const matchSearch = !search
      || p.name.toLowerCase().includes(search.toLowerCase())
      || (p.city || "").toLowerCase().includes(search.toLowerCase())
      || (p.commune || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchCity && matchSearch;
  });

  // Groupement 2 niveaux : ville → commune
  const groupedByCity = filtered.reduce((acc, p) => {
    const city    = p.city?.trim()    || "Sans ville";
    const commune = p.commune?.trim() || "Sans commune";
    if (!acc[city]) acc[city] = {};
    if (!acc[city][commune]) acc[city][commune] = [];
    acc[city][commune].push(p);
    return acc;
  }, {});
  const sortedCities = Object.keys(groupedByCity).sort((a, b) => {
    if (a === "Sans ville") return 1;
    if (b === "Sans ville") return -1;
    return a.localeCompare(b, "fr");
  });

  const counts = TYPES.reduce((acc, t) => {
    acc[t.id] = providers.filter((p) => p.type === t.id && p.status === "ACTIVE").length;
    return acc;
  }, {});

  // ── Rendu ─────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Réseau de Soins</h1>
          <p className="text-slate-500 text-sm">{providers.filter((p) => p.status === "ACTIVE").length} établissements actifs</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Bouton Import Excel */}
          <label className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 text-sm font-semibold transition-all ${importing ? "opacity-60 pointer-events-none" : ""}`}>
            {importing ? "⏳ Import…" : "📥 Importer Excel"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
              disabled={importing}
            />
          </label>

          <button
            onClick={openCreate}
            className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm">
            + Nouvel établissement
          </button>
        </div>
      </div>

      {/* Résultat import */}
      {importResult && (
        <div className={`rounded-xl p-4 text-sm mb-5 border ${importResult.errors.length ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
          <p className="font-semibold text-slate-700 mb-1">
            ✅ {importResult.ok} établissement(s) importé(s)
            {importResult.errors.length > 0 && ` · ⚠️ ${importResult.errors.length} erreur(s)`}
          </p>
          {importResult.errors.map((e, i) => (
            <p key={i} className="text-xs text-amber-700">• {e}</p>
          ))}
          <button
            onClick={() => setImportResult(null)}
            className="text-xs text-slate-400 hover:text-slate-600 mt-1 underline">
            Fermer
          </button>
        </div>
      )}

      {/* Modèle Excel à télécharger */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          📋 Format Excel attendu — colonnes : <span className="font-mono font-semibold">Nom, Type, Ville, Commune, Adresse, Téléphone, Email, Responsable</span>
          <br />Types valides : <span className="font-mono">pharmacy · clinic · hospital · lab · optician · dentist · midwife</span>
        </p>
        <button
          onClick={() => {
            const ws = XLSX.utils.aoa_to_sheet([
              ["Nom", "Type", "Ville", "Commune", "Adresse", "Téléphone", "Email", "Responsable"],
              ["Pharmacie du Plateau", "pharmacy", "Abidjan", "Plateau", "Rue du Commerce", "0101020304", "", ""],
              ["Clinique Sainte Marie", "clinic", "Yamoussoukro", "Centre-ville", "Centre-ville", "0505060708", "", "Dr Koné"],
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Établissements");
            XLSX.writeFile(wb, "modele_etablissements.xlsx");
          }}
          className="flex-shrink-0 text-xs font-semibold text-brand-600 border border-brand-200 bg-white hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
          ⬇️ Modèle
        </button>
      </div>

      {/* KPI par type */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {TYPES.map((t) => (
          <button key={t.id}
            onClick={() => setFilterType(filterType === t.id ? "all" : t.id)}
            className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md
              ${filterType === t.id ? "border-brand-300 shadow-md" : "border-slate-100"}`}>
            <span className="text-2xl">{t.icon}</span>
            <p className="font-bold text-slate-800 text-xl mt-1">{counts[t.id]}</p>
            <p className="text-xs text-slate-400">{t.label}s</p>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un établissement…"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <p className="text-4xl mb-3">🏥</p>
          <p className="font-medium">Aucun établissement trouvé</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedCities.map((city) => {
            const communesInCity = Object.keys(groupedByCity[city]).sort((a, b) => {
              if (a === "Sans commune") return 1;
              if (b === "Sans commune") return -1;
              return a.localeCompare(b, "fr");
            });
            const totalInCity = communesInCity.reduce((n, c) => n + groupedByCity[city][c].length, 0);
            return (
            <div key={city}>
              {/* En-tête VILLE */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-base">📍</span>
                <h3 className="font-bold text-slate-800 text-base uppercase tracking-wide">{city}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{totalInCity} établissement(s)</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Communes */}
              <div className="space-y-6 pl-4 border-l-2 border-slate-100">
                {communesInCity.map((commune) => (
                  <div key={commune}>
                    {/* En-tête COMMUNE */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">🏘</span>
                      <h4 className="font-semibold text-slate-600 text-sm">{commune}</h4>
                      <span className="text-xs text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{groupedByCity[city][commune].length}</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedByCity[city][commune].map((p) => {
            const t = TYPE_MAP[p.type] || TYPE_MAP.pharmacy;
            return (
              <div key={p.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md
                  ${p.status !== "ACTIVE" ? "opacity-50 border-slate-200" : "border-slate-100"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 ${t.color}`}>
                    {t.icon}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${t.color}`}>{t.label}</span>
                    {p.status !== "ACTIVE" && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{p.status === "SUSPENDED" ? "Suspendu" : "Inactif"}</span>}
                  </div>
                </div>
                <p className="font-bold text-slate-800 text-sm leading-tight">{p.name}</p>
                {(p.address || p.commune || p.city) && (
                  <p className="text-xs text-slate-400 mt-1">📍 {[p.address, p.commune, p.city].filter(Boolean).join(", ")}</p>
                )}
                {p.phone && (
                  <p className="text-xs text-slate-500 mt-0.5">📞 {p.phone}</p>
                )}

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    ✏️ Modifier
                  </button>
                  {p.status === "ACTIVE" ? (
                    <button onClick={() => setConfirm(p)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                      🗑️ Désactiver
                    </button>
                  ) : (
                    <button onClick={() => handleRestore(p)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors">
                      ▶️ Réactiver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal création/édition */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Modifier l'établissement" : "Nouvel établissement"}>
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex : Pharmacie du Centre"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ex : Abidjan"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Commune</label>
              <input value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })}
                placeholder="Ex : Cocody, Yopougon, Abobo…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse / Quartier</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ex : Plateau, Rue du Commerce"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone 1</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
              <input value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                placeholder="Ex : Dr Koné"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl disabled:opacity-60 font-semibold">
              {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmation désactivation */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Désactiver l'établissement">
        {confirm && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-semibold text-slate-800">{confirm.name}</p>
              <p className="text-sm text-slate-500">{confirm.city}</p>
            </div>
            <p className="text-sm text-slate-600">Cet établissement ne sera plus visible dans le réseau de soins des clients.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
              <button onClick={() => handleDelete(confirm)}
                className="px-5 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold">
                Désactiver
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}