// src/components/provider/DoctorSelector.jsx
import { useEffect, useState, useCallback } from "react";
import { providerDoctorsAPI } from "../../providerApi";

const BLUE = "#185FA5";
const RED  = "#B91C1C";

const NEW_DOCTOR_VALUE = "__new__";

/**
 * Dropdown "Médecin / Praticien" avec ajout rapide inline.
 *
 * Props :
 *  - value    : doctor_id sélectionné (string | null)
 *  - onChange : (doctorId: string) => void
 *  - required : bool (affiche l'astérisque, défaut true)
 */
export default function DoctorSelector({ value, onChange, required = true }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [showQuickAdd, setShowQuickAdd]     = useState(false);
  const [quickName, setQuickName]           = useState("");
  const [quickSpecialty, setQuickSpecialty] = useState("");
  const [saving, setSaving]                 = useState(false);
  const [quickError, setQuickError]         = useState("");

  const loadDoctors = useCallback(() => {
    setLoading(true);
    setError("");
    providerDoctorsAPI
      .getAll(true)
      .then((r) => setDoctors(r.data?.doctors || []))
      .catch((e) => setError(e.response?.data?.error || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  function handleSelectChange(e) {
    const val = e.target.value;
    if (val === NEW_DOCTOR_VALUE) {
      setQuickName("");
      setQuickSpecialty("");
      setQuickError("");
      setShowQuickAdd(true);
      return;
    }
    onChange(val);
  }

  async function handleQuickAdd(e) {
    e.preventDefault();
    if (!quickName.trim()) {
      setQuickError("Le nom du médecin est obligatoire");
      return;
    }
    setSaving(true);
    setQuickError("");
    try {
      const r = await providerDoctorsAPI.create({
        full_name: quickName.trim(),
        specialty: quickSpecialty.trim() || null,
      });
      const newDoctor = r.data.doctor;
      setDoctors((prev) => [...prev, newDoctor].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      onChange(newDoctor.id);
      setShowQuickAdd(false);
    } catch (e) {
      setQuickError(e.response?.data?.error || "Erreur serveur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label style={s.label}>Médecin / Praticien {required && "*"}</label>

      {error && <div style={s.error}>{error}</div>}

      <select value={value || ""} onChange={handleSelectChange} disabled={loading} style={s.select}>
        <option value="">— Sélectionner —</option>
        {doctors.map((d) => (
          <option key={d.id} value={d.id}>
            {d.full_name}{d.specialty ? ` (${d.specialty})` : ""}
          </option>
        ))}
        <option value={NEW_DOCTOR_VALUE}>+ Ajouter un nouveau médecin…</option>
      </select>

      {showQuickAdd && (
        <div style={s.quickAddBox}>
          <p style={s.quickAddTitle}>Nouveau médecin</p>
          <form onSubmit={handleQuickAdd}>
            <input
              autoFocus
              style={s.input}
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Nom complet (ex : Dr. Kouassi Jean)"
            />
            <input
              style={{ ...s.input, marginTop: 8 }}
              value={quickSpecialty}
              onChange={(e) => setQuickSpecialty(e.target.value)}
              placeholder="Spécialité (optionnel)"
            />
            {quickError && <div style={s.error}>{quickError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
              <button type="button" onClick={() => setShowQuickAdd(false)} disabled={saving} style={s.cancelBtn}>
                Annuler
              </button>
              <button type="submit" disabled={saving} style={s.addBtn}>
                {saving ? "Ajout…" : "Ajouter et sélectionner"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const s = {
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 },
  select: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" },
  error: { color: RED, fontSize: 12, margin: "6px 0" },
  quickAddBox: { marginTop: 12, background: "#F0F7FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 16 },
  quickAddTitle: { fontSize: 13, fontWeight: 700, color: "#0C447C", margin: "0 0 10px" },
  input: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" },
  cancelBtn: { background: "none", border: "none", color: "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: "8px 4px" },
  addBtn: { background: BLUE, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};
