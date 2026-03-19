import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { clientProfileAPI, clientMedicalAPI } from "../../clientApi";
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

export default function ClientDossier({ clientId: propClientId }) {
  const { id: paramId } = useParams();
  const storedClient = JSON.parse(localStorage.getItem("client_data") || "{}");
  const clientId = propClientId || paramId || storedClient.id;

  const [client,  setClient]  = useState(null);
  const [medical, setMedical] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [section, setSection] = useState("general");

  // Lecture seule pour le portail client
  const canWrite = false;

  async function loadData() {
    setLoading(true);
    try {
      const [clientRes, medicalRes] = await Promise.all([
        clientProfileAPI.get(),
        clientMedicalAPI.get().catch(() => ({ data: null })),
      ]);
      setClient(clientRes.data.client || clientRes.data);
      setMedical(medicalRes.data || null);
    } catch (e) {
      setError("Impossible de charger le dossier médical");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clientId) {
      loadData();
    } else {
      setError("Identifiant client introuvable. Reconnectez-vous.");
      setLoading(false);
    }
  }, [clientId]);

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
          <SectionHeader title="Informations médicales générales" icon="👤" />

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
          <SectionHeader title="Allergies" icon="⚠️" />

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
          <SectionHeader title="Antécédents médicaux" icon="📋" />

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
          <SectionHeader title="Consultations" icon="🩺" />

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
          <SectionHeader title="Ordonnances & Médicaments" icon="💊" />

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
          <SectionHeader title="Analyses & Examens" icon="🔬" />

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