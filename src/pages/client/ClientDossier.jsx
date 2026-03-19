import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { healthcareAPI, clientAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SEVERITY_STYLE = {
  mild:     { label: "Légère",    color: "#059669", bg: "#ECFDF5" },
  moderate: { label: "Modérée",   color: "#D97706", bg: "#FFFBEB" },
  severe:   { label: "Sévère",    color: "#DC2626", bg: "#FEF2F2" },
};

const SECTIONS = [
  { id: "general",       label: "Général",       icon: "👤" },
  { id: "allergies",     label: "Allergies",     icon: "⚠️" },
  { id: "history",       label: "Antécédents",   icon: "📋" },
  { id: "consultations", label: "Consultations", icon: "🩺" },
  { id: "prescriptions", label: "Ordonnances",   icon: "💊" },
  { id: "analyses",      label: "Analyses",      icon: "🔬" },
];

function SectionHeader({ title, icon, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h3>
      {onAdd && (
        <button onClick={onAdd}
          className="text-xs font-semibold text-brand-600 border border-brand-200 px-3 py-1 rounded-lg hover:bg-brand-50 transition-colors">
          + {addLabel || "Ajouter"}
        </button>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl">
      <p className="text-sm">{label}</p>
    </div>
  );
}

function QuickForm({ fields, onSave, onCancel }) {
  const [form, setForm] = useState(Object.fromEntries(fields.map((f) => [f.key, f.default || ""])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try { await onSave(form); }
    catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl p-4 space-y-3 mb-4">
      {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>}
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}{f.required ? " *" : ""}</label>
            {f.type === "select" ? (
              <select required={f.required} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {f.options.map((o) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
              </select>
            ) : f.type === "textarea" ? (
              <textarea required={f.required} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                rows={2} placeholder={f.placeholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            ) : (
              <input required={f.required} type={f.type || "text"} value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-white">Annuler</button>
        <button type="submit" disabled={saving}
          className="px-4 py-1.5 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-60">
          {saving ? "…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

export default function ClientDossier({ clientId: propClientId }) {
  const { id: paramId } = useParams();
  const clientId = propClientId || paramId;
  const { user } = useAuth();

  const [client,  setClient]  = useState(null);
  const [medical, setMedical] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [section, setSection] = useState("general");

  // Formulaires d'ajout
  const [addingAllergy,      setAddingAllergy]      = useState(false);
  const [addingHistory,      setAddingHistory]      = useState(false);
  const [addingConsultation, setAddingConsultation] = useState(false);
  const [addingPrescription, setAddingPrescription] = useState(false);
  const [addingAnalyse,      setAddingAnalyse]      = useState(false);
  const [editingGeneral,     setEditingGeneral]     = useState(false);

  const canWrite = ["ADMIN", "MEDECIN", "INFIRMIER"].includes(user?.role);

  async function loadData() {
    setLoading(true);
    try {
      const [clientRes, medicalRes] = await Promise.all([
        clientAPI.getById(clientId),
        healthcareAPI.getMedical(clientId).catch(() => ({ data: null })),
      ]);
      setClient(clientRes.data.client);
      setMedical(medicalRes.data || null);
    } catch (e) {
      setError("Impossible de charger le dossier médical");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (clientId) loadData(); }, [clientId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">{error}</div>
    </div>
  );

  const r  = medical?.record;
  const bmi = r?.weight_kg && r?.height_cm
    ? (r.weight_kg / Math.pow(r.height_cm / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

      {/* En-tête client */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl">
            {client?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{client?.name}</h2>
            <p className="text-slate-500 text-sm font-mono">{client?.mutual_number}</p>
            <p className="text-slate-400 text-xs">{client?.phone} · {client?.city || "—"}</p>
          </div>
          {r?.blood_type && (
            <div className="ml-auto text-center bg-red-50 border border-red-100 rounded-xl px-4 py-2">
              <p className="text-2xl font-black text-red-600">{r.blood_type}</p>
              <p className="text-xs text-red-400">Groupe sanguin</p>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
              ${section === s.id ? "bg-brand-500 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <span>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      {/* ── Section Général ── */}
      {section === "general" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <SectionHeader title="Informations médicales générales" icon="👤"
            onAdd={canWrite ? () => setEditingGeneral(true) : null} addLabel="Modifier" />

          {editingGeneral && (
            <QuickForm
              fields={[
                { key: "blood_type", label: "Groupe sanguin", type: "select", options: BLOOD_TYPES.map((b) => ({ value: b, label: b })) },
                { key: "weight_kg",  label: "Poids (kg)",     type: "number", placeholder: "Ex: 70" },
                { key: "height_cm",  label: "Taille (cm)",    type: "number", placeholder: "Ex: 175" },
                { key: "chronic_diseases", label: "Maladies chroniques", type: "textarea", full: true, placeholder: "Ex: Diabète type 2, HTA…" },
                { key: "notes", label: "Notes générales", type: "textarea", full: true, placeholder: "Observations particulières…" },
              ]}
              onSave={async (form) => { await healthcareAPI.upsertMedical(clientId, form); setEditingGeneral(false); loadData(); }}
              onCancel={() => setEditingGeneral(false)}
            />
          )}

          {r ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Groupe sanguin", value: r.blood_type || "—", icon: "🩸" },
                { label: "Poids",          value: r.weight_kg ? `${r.weight_kg} kg` : "—", icon: "⚖️" },
                { label: "Taille",         value: r.height_cm ? `${r.height_cm} cm` : "—", icon: "📏" },
                { label: "IMC",            value: bmi || "—", icon: "📊" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl mb-1">{item.icon}</p>
                  <p className="font-bold text-slate-800">{item.value}</p>
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
              {r.chronic_diseases && (
                <div className="col-span-2 sm:col-span-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Maladies chroniques</p>
                  <p className="text-sm text-amber-800">{r.chronic_diseases}</p>
                </div>
              )}
              {r.notes && (
                <div className="col-span-2 sm:col-span-4 bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{r.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState label="Aucune information médicale générale enregistrée" />
          )}
        </div>
      )}

      {/* ── Section Allergies ── */}
      {section === "allergies" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <SectionHeader title="Allergies" icon="⚠️"
            onAdd={canWrite ? () => setAddingAllergy(true) : null} addLabel="Ajouter allergie" />

          {addingAllergy && (
            <QuickForm
              fields={[
                { key: "allergen", label: "Allergène *", required: true, placeholder: "Ex: Pénicilline, Arachides" },
                { key: "severity", label: "Sévérité", type: "select", options: [{ value: "mild", label: "Légère" }, { value: "moderate", label: "Modérée" }, { value: "severe", label: "Sévère" }], default: "moderate" },
                { key: "reaction", label: "Réaction observée", type: "textarea", full: true, placeholder: "Ex: Urticaire, choc anaphylactique…" },
              ]}
              onSave={async (form) => { await healthcareAPI.addAllergy(clientId, form); setAddingAllergy(false); loadData(); }}
              onCancel={() => setAddingAllergy(false)}
            />
          )}

          {!medical?.allergies?.length ? <EmptyState label="Aucune allergie enregistrée" /> : (
            <div className="space-y-2">
              {medical.allergies.map((a) => {
                const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.moderate;
                return (
                  <div key={a.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: s.bg }}>⚠️</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{a.allergen}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: s.color, background: s.bg }}>{s.label}</span>
                      </div>
                      {a.reaction && <p className="text-xs text-slate-500 mt-0.5">{a.reaction}</p>}
                      <p className="text-xs text-slate-400 mt-1">Noté par {a.noted_by_name} · {fmtDate(a.noted_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Section Antécédents ── */}
      {section === "history" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <SectionHeader title="Antécédents médicaux" icon="📋"
            onAdd={canWrite ? () => setAddingHistory(true) : null} addLabel="Ajouter antécédent" />

          {addingHistory && (
            <QuickForm
              fields={[
                { key: "condition", label: "Condition / Maladie *", required: true, placeholder: "Ex: Diabète type 2, HTA" },
                { key: "diagnosed_at", label: "Date diagnostic", type: "date" },
                { key: "status", label: "Statut", type: "select", options: [{ value: "active", label: "Actif" }, { value: "chronic", label: "Chronique" }, { value: "resolved", label: "Résolu" }], default: "active" },
                { key: "notes", label: "Notes", type: "textarea", full: true, placeholder: "Observations…" },
              ]}
              onSave={async (form) => { await healthcareAPI.addHistory(clientId, form); setAddingHistory(false); loadData(); }}
              onCancel={() => setAddingHistory(false)}
            />
          )}

          {!medical?.history?.length ? <EmptyState label="Aucun antécédent médical enregistré" /> : (
            <div className="space-y-2">
              {medical.history.map((h) => (
                <div key={h.id} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 text-sm">{h.condition}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      h.status === "resolved" ? "bg-green-100 text-green-700" :
                      h.status === "chronic" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}>{h.status === "resolved" ? "Résolu" : h.status === "chronic" ? "Chronique" : "Actif"}</span>
                  </div>
                  {h.diagnosed_at && <p className="text-xs text-slate-400 mt-0.5">Diagnostiqué le {fmtDate(h.diagnosed_at)}</p>}
                  {h.notes && <p className="text-xs text-slate-500 mt-1">{h.notes}</p>}
                  <p className="text-xs text-slate-400 mt-1">Noté par {h.noted_by_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Section Consultations ── */}
      {section === "consultations" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <SectionHeader title="Consultations" icon="🩺"
            onAdd={canWrite ? () => setAddingConsultation(true) : null} addLabel="Nouvelle consultation" />

          {addingConsultation && (
            <QuickForm
              fields={[
                { key: "consultation_date", label: "Date *", type: "date", required: true },
                { key: "doctor_name",  label: "Médecin",    placeholder: "Dr. Koné" },
                { key: "provider_name", label: "Établissement", placeholder: "Clinique Sainte Marie" },
                { key: "reason",     label: "Motif *",     required: true, type: "textarea", full: true, placeholder: "Ex: Douleurs abdominales" },
                { key: "diagnosis",  label: "Diagnostic",  type: "textarea", full: true, placeholder: "Ex: Gastrite aiguë" },
                { key: "notes",      label: "Notes",       type: "textarea", full: true, placeholder: "Observations complémentaires…" },
              ]}
              onSave={async (form) => { await healthcareAPI.addConsultation(clientId, form); setAddingConsultation(false); loadData(); }}
              onCancel={() => setAddingConsultation(false)}
            />
          )}

          {!medical?.consultations?.length ? <EmptyState label="Aucune consultation enregistrée" /> : (
            <div className="space-y-3">
              {medical.consultations.map((c) => (
                <div key={c.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{c.reason}</p>
                      {c.doctor_name && <p className="text-xs text-slate-500">Dr. {c.doctor_name}</p>}
                      {(c.provider_name || c.provider_name_full) && (
                        <p className="text-xs text-slate-400">🏥 {c.provider_name_full || c.provider_name}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{fmtDate(c.consultation_date)}</span>
                  </div>
                  {c.diagnosis && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2 mt-2">
                      <p className="text-xs font-semibold text-blue-700">Diagnostic</p>
                      <p className="text-xs text-blue-600">{c.diagnosis}</p>
                    </div>
                  )}
                  {c.notes && <p className="text-xs text-slate-500 mt-2">{c.notes}</p>}
                  <p className="text-xs text-slate-400 mt-2">Enregistré par {c.created_by_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Section Prescriptions ── */}
      {section === "prescriptions" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <SectionHeader title="Ordonnances & Médicaments" icon="💊"
            onAdd={canWrite ? () => setAddingPrescription(true) : null} addLabel="Ajouter ordonnance" />

          {addingPrescription && (
            <QuickForm
              fields={[
                { key: "medication", label: "Médicament *", required: true, placeholder: "Ex: Paracétamol 500mg" },
                { key: "dosage",     label: "Dosage",       placeholder: "Ex: 500mg" },
                { key: "frequency",  label: "Fréquence",    placeholder: "Ex: 3 fois par jour" },
                { key: "duration",   label: "Durée",        placeholder: "Ex: 7 jours" },
                { key: "notes",      label: "Notes",        type: "textarea", full: true, placeholder: "Instructions particulières…" },
              ]}
              onSave={async (form) => { await healthcareAPI.addPrescription(clientId, form); setAddingPrescription(false); loadData(); }}
              onCancel={() => setAddingPrescription(false)}
            />
          )}

          {!medical?.prescriptions?.length ? <EmptyState label="Aucune ordonnance enregistrée" /> : (
            <div className="space-y-2">
              {medical.prescriptions.map((p) => (
                <div key={p.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">💊</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{p.medication}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {p.dosage    && <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">{p.dosage}</span>}
                      {p.frequency && <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">{p.frequency}</span>}
                      {p.duration  && <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">{p.duration}</span>}
                    </div>
                    {p.notes && <p className="text-xs text-slate-500 mt-1">{p.notes}</p>}
                    <p className="text-xs text-slate-400 mt-1">Par {p.prescribed_by_name} · {fmtDate(p.prescribed_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Section Analyses ── */}
      {section === "analyses" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <SectionHeader title="Analyses & Examens" icon="🔬"
            onAdd={canWrite ? () => setAddingAnalyse(true) : null} addLabel="Ajouter analyse" />

          {addingAnalyse && (
            <QuickForm
              fields={[
                { key: "type",        label: "Type d'analyse *", required: true, placeholder: "Ex: NFS, Glycémie, Échographie" },
                { key: "result_date", label: "Date résultat",    type: "date" },
                { key: "result",      label: "Résultat",         type: "textarea", full: true, placeholder: "Ex: Glycémie à jeun : 1,2 g/L (normale)" },
                { key: "notes",       label: "Interprétation",   type: "textarea", full: true, placeholder: "Commentaires du médecin…" },
              ]}
              onSave={async (form) => { await healthcareAPI.addAnalyse(clientId, form); setAddingAnalyse(false); loadData(); }}
              onCancel={() => setAddingAnalyse(false)}
            />
          )}

          {!medical?.analyses?.length ? <EmptyState label="Aucune analyse enregistrée" /> : (
            <div className="space-y-2">
              {medical.analyses.map((a) => (
                <div key={a.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      <span>🔬</span>{a.type}
                    </p>
                    <span className="text-xs text-slate-400">{fmtDate(a.result_date || a.created_at)}</span>
                  </div>
                  {a.result && (
                    <div className="bg-cyan-50 rounded-lg px-3 py-2 mt-2">
                      <p className="text-xs font-semibold text-cyan-700">Résultat</p>
                      <p className="text-xs text-cyan-600">{a.result}</p>
                    </div>
                  )}
                  {a.notes && <p className="text-xs text-slate-500 mt-2">{a.notes}</p>}
                  <p className="text-xs text-slate-400 mt-2">Par {a.ordered_by_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
