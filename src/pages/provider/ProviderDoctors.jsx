// src/pages/provider/ProviderDoctors.jsx
import { useEffect, useState, useCallback } from "react";
import { providerDoctorsAPI } from "../../providerApi";

const BLUE      = "#185FA5";
const BLUE_DARK = "#0C447C";
const GREEN     = "#059669";
const RED       = "#B91C1C";

export default function ProviderDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [showActive, setShowActive] = useState(true); // true = actifs, false = tous

  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName]           = useState("");
  const [specialty, setSpecialty] = useState("");
  const [license, setLicense]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  const loadDoctors = useCallback(() => {
    setLoading(true);
    setError("");
    providerDoctorsAPI
      .getAll(showActive ? true : undefined)
      .then((r) => setDoctors(r.data?.doctors || []))
      .catch((e) => setError(e.response?.data?.error || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [showActive]);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  function openNewForm() {
    setEditingId(null);
    setName("");
    setSpecialty("");
    setLicense("");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(doctor) {
    setEditingId(doctor.id);
    setName(doctor.full_name || "");
    setSpecialty(doctor.specialty || "");
    setLicense(doctor.license_number || "");
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Le nom du médecin est obligatoire");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        full_name: name.trim(),
        specialty: specialty.trim() || null,
        license_number: license.trim() || null,
      };
      if (editingId) {
        await providerDoctorsAPI.update(editingId, payload);
      } else {
        await providerDoctorsAPI.create(payload);
      }
      setShowForm(false);
      loadDoctors();
    } catch (e) {
      setFormError(e.response?.data?.error || "Erreur serveur");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(doctor) {
    try {
      await providerDoctorsAPI.update(doctor.id, { active: !doctor.active });
      loadDoctors();
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de la mise à jour");
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Praticiens</h1>
          <p style={s.subtitle}>Médecins et prescripteurs enregistrés pour votre établissement</p>
        </div>
        <button onClick={openNewForm} style={s.addBtn}>+ Ajouter un médecin</button>
      </div>

      <div style={s.filterRow}>
        <button
          onClick={() => setShowActive(true)}
          style={{ ...s.filterBtn, ...(showActive ? s.filterBtnActive : {}) }}
        >
          Actifs
        </button>
        <button
          onClick={() => setShowActive(false)}
          style={{ ...s.filterBtn, ...(!showActive ? s.filterBtnActive : {}) }}
        >
          Tous
        </button>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {showForm && (
        <div style={s.formBox}>
          <p style={s.formTitle}>{editingId ? "Modifier le médecin" : "Nouveau médecin"}</p>
          <form onSubmit={handleSubmit}>
            <div style={s.formGrid}>
              <div>
                <label style={s.label}>Nom complet *</label>
                <input
                  autoFocus
                  style={s.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Dr. Kouassi Jean"
                />
              </div>
              <div>
                <label style={s.label}>Spécialité</label>
                <input
                  style={s.input}
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex : Généraliste, Pédiatre…"
                />
              </div>
              <div>
                <label style={s.label}>N° d'ordre / licence</label>
                <input
                  style={s.input}
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
            </div>
            {formError && <div style={s.errorBox}>{formError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <button type="button" onClick={() => setShowForm(false)} disabled={saving} style={s.cancelBtn}>
                Annuler
              </button>
              <button type="submit" disabled={saving} style={s.saveBtn}>
                {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={s.card}>
        {loading ? (
          <p style={s.emptyText}>Chargement…</p>
        ) : doctors.length === 0 ? (
          <p style={s.emptyText}>Aucun médecin enregistré pour le moment.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nom</th>
                <th style={s.th}>Spécialité</th>
                <th style={s.th}>N° d'ordre</th>
                <th style={s.th}>Statut</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td style={s.td}><strong>{d.full_name}</strong></td>
                  <td style={s.td}>{d.specialty || "—"}</td>
                  <td style={s.td}>{d.license_number || "—"}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: d.active ? "#ECFDF5" : "#FEF2F2", color: d.active ? GREEN : RED }}>
                      {d.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <button onClick={() => openEditForm(d)} style={s.linkBtn}>Modifier</button>
                    <button onClick={() => toggleActive(d)} style={{ ...s.linkBtn, color: d.active ? RED : GREEN }}>
                      {d.active ? "Désactiver" : "Réactiver"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const s = {
  header:       { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" },
  title:        { fontSize: "clamp(18px,4vw,22px)", fontWeight: 800, color: "#1E293B", margin: "0 0 4px", letterSpacing: -.5 },
  subtitle:     { fontSize: 13, color: "#94A3B8", margin: 0 },
  addBtn:       { background: `linear-gradient(135deg,${BLUE},${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", boxShadow: `0 4px 16px rgba(24,95,165,.25)` },

  filterRow:    { display: "flex", gap: 8, marginBottom: 18 },
  filterBtn:    { background: "#fff", border: "1.5px solid #E2E8F0", color: "#64748B", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  filterBtnActive: { background: "#EFF6FF", borderColor: BLUE, color: BLUE },

  errorBox:     { background: "#FEF2F2", border: "1px solid #FCA5A5", color: RED, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },

  formBox:      { background: "#F0F7FF", border: "1px solid #BFDBFE", borderRadius: 16, padding: 20, marginBottom: 20 },
  formTitle:    { fontSize: 14, fontWeight: 700, color: BLUE_DARK, margin: "0 0 14px" },
  formGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 },
  label:        { display: "block", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 },
  input:        { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" },
  cancelBtn:    { background: "none", border: "none", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: "8px 4px" },
  saveBtn:      { background: BLUE, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },

  card:         { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" },
  emptyText:    { padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 14, margin: 0 },
  table:        { width: "100%", borderCollapse: "collapse" },
  th:           { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .5, padding: "12px 20px", borderBottom: "1px solid #E2E8F0" },
  td:           { padding: "14px 20px", fontSize: 14, color: "#1E293B", borderBottom: "1px solid #F1F5F9" },
  badge:        { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  linkBtn:      { background: "none", border: "none", color: BLUE, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginLeft: 14 },
};
