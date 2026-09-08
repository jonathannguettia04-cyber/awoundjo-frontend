// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { useRole } from "../context/RoleContext";

const BASE = import.meta.env.VITE_API_URL || "";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const CATEGORY_META = {
  famille:     { label: "Famille & enfants",  icon: "ti-users",        color: "brand" },
  pathologie:  { label: "Pathologies",        icon: "ti-heart-rate-monitor", color: "amber" },
  commissions: { label: "Commissions agents", icon: "ti-coins",        color: "emerald" },
  tarifs:      { label: "Tarifs groupe",      icon: "ti-report-money", color: "brand" },
  general:     { label: "Général",            icon: "ti-settings",     color: "slate" },
};

const COLOR_CLASSES = {
  brand:   { bg: "bg-brand-50",   text: "text-brand-600",   ring: "ring-brand-100" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
  slate:   { bg: "bg-slate-100",  text: "text-slate-600",   ring: "ring-slate-200" },
};

const ROLE_LABELS_LOCAL = {
  AGENT: "Agent commercial",
  MANAGER: "Manager",
  CONSEILLERE: "Conseillère",
  RESPONSABLE_COMMERCIAL: "Responsable commercial",
  CONSEILLERE_CLIENTELE: "Conseillère clientèle",
  APPORTEUR_AFFAIRES: "Apporteur d'affaires",
  COMMUNITY_MANAGER: "Community manager",
};

const PLAN_LABELS = { ESSENTIELLE: "Essentielle", IVOIRIENNE: "Ivoirienne", TURQUOISE: "Turquoise" };

function timeAgo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Settings() {
  const { isAdmin } = useRole();
  const [settings, setSettings]   = useState([]);
  const [drafts, setDrafts]       = useState({});   // key -> valeur en cours d'édition
  const [dirty, setDirty]         = useState({});   // key -> bool
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState(null); // message si le chargement a échoué (distinct de "liste vide")
  const [savingKey, setSavingKey] = useState(null);
  const [toast, setToast]         = useState(null);  // { type, msg }

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${BASE}/api/agents/settings`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      const list = data.settings || data.data?.settings || [];
      setSettings(list);
      const initial = {};
      list.forEach((s) => { initial[s.key] = s.value; });
      setDrafts(initial);
      setDirty({});
    } catch (e) {
      const msg = e.message || "Impossible de charger les paramètres";
      setLoadError(msg);
      setToast({ type: "err", msg });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function updateDraft(key, value) {
    setDrafts((d) => ({ ...d, [key]: value }));
    setDirty((d) => ({ ...d, [key]: true }));
  }

  async function saveKey(key) {
    setSavingKey(key);
    try {
      const res = await fetch(`${BASE}/api/agents/settings/${key}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ value: drafts[key] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur d'enregistrement");
      const saved = data.setting || data.data?.setting;
      setSettings((list) => list.map((s) => (s.key === key ? { ...s, ...saved } : s)));
      setDirty((d) => ({ ...d, [key]: false }));
      setToast({ type: "ok", msg: "Paramètre enregistré" });
    } catch (e) {
      setToast({ type: "err", msg: e.message || "Erreur d'enregistrement" });
    } finally {
      setSavingKey(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Accès restreint</h2>
        <p className="text-slate-500">Les paramètres système sont réservés aux administrateurs.</p>
      </div>
    );
  }

  const grouped = {};
  settings.forEach((s) => {
    const cat = s.category || "general";
    (grouped[cat] ||= []).push(s);
  });
  const categoryOrder = ["famille", "pathologie", "commissions", "tarifs", "general"].filter((c) => grouped[c]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Paramètres</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Règles métier modifiables sans redéploiement — surprimes, cautions, commissions.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1.5 self-start sm:self-auto">
          <i className="ti ti-shield-lock" style={{ fontSize: 14 }} aria-hidden="true" />
          Réservé aux administrateurs
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-2xl border border-red-100 px-6 py-16 text-center">
          <i className="ti ti-alert-triangle text-red-500" style={{ fontSize: 30 }} aria-hidden="true" />
          <p className="text-slate-700 font-semibold mt-3 mb-1">Le chargement des paramètres a échoué</p>
          <p className="text-slate-400 text-sm mb-5">{loadError}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
          >
            <i className="ti ti-refresh" style={{ fontSize: 14 }} aria-hidden="true" />
            Réessayer
          </button>
        </div>
      ) : settings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-16 text-center">
          <p className="text-3xl mb-3">⚙️</p>
          <p className="text-slate-600 font-semibold mb-1">Aucun paramètre trouvé</p>
          <p className="text-slate-400 text-sm">Vérifie que la migration <code className="bg-slate-100 px-1.5 py-0.5 rounded">settings</code> a bien été exécutée.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map((cat) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META.general;
            const colors = COLOR_CLASSES[meta.color];
            return (
              <section key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                    <i className={`ti ${meta.icon} ${colors.text}`} style={{ fontSize: 18 }} aria-hidden="true" />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">{meta.label}</h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {grouped[cat].map((setting) => (
                    <SettingRow
                      key={setting.key}
                      setting={setting}
                      value={drafts[setting.key]}
                      isDirty={!!dirty[setting.key]}
                      saving={savingKey === setting.key}
                      onChange={(v) => updateDraft(setting.key, v)}
                      onSave={() => saveKey(setting.key)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold
            ${toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
        >
          <i className={`ti ${toast.type === "ok" ? "ti-check" : "ti-alert-triangle"}`} style={{ fontSize: 16 }} aria-hidden="true" />
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Une ligne de paramètre — le contrôle d'édition dépend de la forme de value ──
function SettingRow({ setting, value, isDirty, saving, onChange, onSave }) {
  return (
    <div className="px-5 sm:px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">{setting.description || setting.key}</p>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{setting.key}</code>
            {!setting.is_public && (
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Interne</span>
            )}
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={!isDirty || saving}
          className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors
            ${isDirty && !saving
              ? "bg-brand-500 hover:bg-brand-600 text-white"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
        >
          {saving ? "Enregistrement…" : isDirty ? "Enregistrer" : "À jour"}
        </button>
      </div>

      <SettingControl settingKey={setting.key} value={value} onChange={onChange} />

      {setting.updated_at && (
        <p className="text-[11px] text-slate-400 mt-2.5">
          Dernière modification {timeAgo(setting.updated_at)}
          {setting.updated_by_name ? ` par ${setting.updated_by_name}` : ""}
        </p>
      )}
    </div>
  );
}

// ── Contrôle adapté à la forme de la valeur ─────────────────────────────────
function SettingControl({ settingKey, value, onChange }) {
  if (settingKey === "surprime_enfant" && value && typeof value === "object") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.keys(PLAN_LABELS).map((plan) => (
          <label key={plan} className="block">
            <span className="text-xs text-slate-500 mb-1 block">{PLAN_LABELS[plan]}</span>
            <div className="relative">
              <input
                type="number" min="0" step="500"
                value={value[plan] ?? 0}
                onChange={(e) => onChange({ ...value, [plan]: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg pl-3 pr-12 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">F</span>
            </div>
          </label>
        ))}
      </div>
    );
  }

  if (settingKey === "tarifs_groupe" && value && typeof value === "object") {
    const tranches = Array.isArray(value.tranches) ? value.tranches : [];

    function updateTranche(i, field, v) {
      const next = tranches.map((t, idx) => (idx === i ? { ...t, [field]: v } : t));
      onChange({ ...value, tranches: next });
    }

    return (
      <div className="space-y-4">
        <label className="block max-w-xs">
          <span className="text-xs text-slate-500 mb-1 block">Adhésion (fixe, tous effectifs)</span>
          <div className="relative">
            <input
              type="number" min="0" step="500"
              value={value.adhesion ?? 0}
              onChange={(e) => onChange({ ...value, adhesion: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded-lg pl-3 pr-12 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">F</span>
          </div>
        </label>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide">
                <th className="font-semibold px-1 py-1.5">Effectif min</th>
                <th className="font-semibold px-1 py-1.5">Effectif max</th>
                <th className="font-semibold px-1 py-1.5 text-right">Ivoirienne</th>
                <th className="font-semibold px-1 py-1.5 text-right">Turquoise</th>
              </tr>
            </thead>
            <tbody>
              {tranches.map((t, i) => (
                <tr key={i} className="border-t border-slate-50">
                  <td className="px-1 py-2">
                    <input
                      type="number" min="0"
                      value={t.min ?? 0}
                      onChange={(e) => updateTranche(i, "min", Number(e.target.value))}
                      className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-1 py-2">
                    <input
                      type="number" min="0"
                      placeholder="∞"
                      value={t.max ?? ""}
                      onChange={(e) => updateTranche(i, "max", e.target.value === "" ? null : Number(e.target.value))}
                      className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </td>
                  {["ivoirienne", "turquoise"].map((plan) => (
                    <td key={plan} className="px-1 py-2">
                      <div className="relative w-28 ml-auto">
                        <input
                          type="number" min="0" step="500"
                          value={t[plan] ?? 0}
                          onChange={(e) => updateTranche(i, plan, Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg pl-2.5 pr-6 py-1.5 text-sm text-right font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">F</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (settingKey === "commission_rates" && value && typeof value === "object") {
    return (
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide">
              <th className="font-semibold px-1 py-1.5">Rôle</th>
              <th className="font-semibold px-1 py-1.5 text-right">Adhésion</th>
              <th className="font-semibold px-1 py-1.5 text-right">Mensualité</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(value).map((role) => (
              <tr key={role} className="border-t border-slate-50">
                <td className="px-1 py-2 text-slate-600 font-medium">{ROLE_LABELS_LOCAL[role] || role}</td>
                {["adhesion", "mensualite"].map((field) => (
                  <td key={field} className="px-1 py-2">
                    <div className="relative w-24 ml-auto">
                      <input
                        type="number" min="0" max="100" step="1"
                        value={value[role]?.[field] ?? 0}
                        onChange={(e) => onChange({
                          ...value,
                          [role]: { ...value[role], [field]: Number(e.target.value) },
                        })}
                        className="w-full border border-slate-200 rounded-lg pl-2.5 pr-6 py-1.5 text-sm text-right font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (settingKey === "surcharge_pathologie" || settingKey === "base_children_cap" || settingKey === "caution_mois") {
    const suffix = settingKey === "surcharge_pathologie" ? "F CFA" : settingKey === "caution_mois" ? "mois" : "enfants";
    return (
      <div className="relative w-full sm:w-56">
        <input
          type="number" min="0"
          value={typeof value === "number" ? value : Number(value) || 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full border border-slate-200 rounded-lg pl-3 pr-20 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>
      </div>
    );
  }

  // Repli générique : édition JSON brute pour tout paramètre non reconnu
  return (
    <textarea
      value={JSON.stringify(value, null, 2)}
      onChange={(e) => {
        try { onChange(JSON.parse(e.target.value)); } catch { /* JSON invalide en cours de frappe, on ignore */ }
      }}
      rows={3}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
    />
  );
}
