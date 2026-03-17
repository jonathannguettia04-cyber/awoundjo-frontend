// src/pages/client/ClientFamille.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientDepsAPI } from "../../clientApi";

export default function ClientFamille() {
  const navigate = useNavigate();
  const [deps, setDeps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState({ type: "spouse", name: "", firstname: "", identity_document: "" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    clientDepsAPI.get()
      .then(res => setDeps(res.data.data))
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const spouse   = deps.filter(d => d.type === "spouse");
  const children = deps.filter(d => d.type === "child");

  const handleAdd = async () => {
    if (!form.name || !form.firstname) return setError("Nom et prénom requis");
    setError(""); setSaving(true);
    try {
      await clientDepsAPI.add(form);
      setSuccess("Bénéficiaire ajouté !"); setModal(false);
      setForm({ type: "spouse", name: "", firstname: "", identity_document: "" });
      load(); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce bénéficiaire ?")) return;
    try { await clientDepsAPI.remove(id); load(); }
    catch (err) { alert(err.response?.data?.error || "Erreur"); }
  };

  if (loading) return <div style={{ padding: 16 }}><div style={{ height: 100, background: "#E5E7EB", borderRadius: 16 }} /></div>;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={s.title}>Ma Famille</h1>
      <p style={s.sub}>Gérez les bénéficiaires couverts</p>
      {success && <div style={s.ok}>✅ {success}</div>}

      {/* Limites */}
      <div style={s.limCard}>
        {[
          { icon: "💑", label: "Conjoint(e)", count: spouse.length,   max: 1, color: "#EC4899" },
          { icon: "👶", label: "Enfants",      count: children.length, max: 4, color: "#3B82F6" },
        ].map((item, i) => (
          <div key={i} style={i === 0 ? {} : { borderTop: "1px solid #F3F4F6", paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.count}/{item.max}</span>
                </div>
                <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(item.count / item.max) * 100}%`, background: item.color, borderRadius: 3 }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section conjoint */}
      <SectionHeader title="Conjoint(e)" canAdd={spouse.length < 1}
        onAdd={() => { setForm(f => ({ ...f, type: "spouse" })); setModal(true); }} />
      {spouse.length === 0
        ? <EmptyCard icon="💑" text="Aucun conjoint enregistré" />
        : spouse.map(d => <DepCard key={d.id} dep={d} onDelete={handleDelete} />)}

      {/* Section enfants */}
      <SectionHeader title={`Enfants (${children.length}/4)`} canAdd={children.length < 4}
        onAdd={() => { setForm(f => ({ ...f, type: "child" })); setModal(true); }} />
      {children.length === 0
        ? <EmptyCard icon="👶" text="Aucun enfant enregistré" />
        : children.map(d => <DepCard key={d.id} dep={d} onDelete={handleDelete} />)}

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{form.type === "spouse" ? "💑 Ajouter conjoint" : "👶 Ajouter enfant"}</h3>
              <button onClick={() => setModal(false)} style={s.closeBtn}>✕</button>
            </div>
            {error && <div style={s.err}>⚠️ {error}</div>}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {["spouse", "child"].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  style={{ ...s.typeBtn, background: form.type === t ? (t === "spouse" ? "#EC4899" : "#3B82F6") : "#F3F4F6", color: form.type === t ? "#fff" : "#374151" }}>
                  {t === "spouse" ? "💑 Conjoint(e)" : "👶 Enfant"}
                </button>
              ))}
            </div>
            {[
              { key: "name",              label: "Nom",       ph: "Nom de famille" },
              { key: "firstname",         label: "Prénom",    ph: "Prénom" },
              { key: "identity_document", label: form.type === "spouse" ? "N° CNI / Passeport" : "N° Acte de naissance", ph: "Numéro du document" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={s.label}>{f.label}</label>
                <input type="text" placeholder={f.ph} value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={s.input} />
              </div>
            ))}
            <button onClick={handleAdd} disabled={saving} style={s.submitBtn}>
              {saving ? "⏳ Enregistrement..." : "✅ Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, canAdd, onAdd }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 20 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</span>
      {canAdd && <button onClick={onAdd} style={{ background: "#EFF6FF", color: "#1a56db", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>+ Ajouter</button>}
    </div>
  );
}

function EmptyCard({ icon, text }) {
  return (
    <div style={{ background: "#F9FAFB", borderRadius: 16, padding: "30px 20px", textAlign: "center", border: "2px dashed #E5E7EB", marginBottom: 8 }}>
      <span style={{ fontSize: 32 }}>{icon}</span>
      <p style={{ color: "#9CA3AF", fontSize: 14, margin: "8px 0 0" }}>{text}</p>
    </div>
  );
}

function DepCard({ dep, onDelete }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      <div style={{ width: 48, height: 48, background: "#F3F4F6", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
        {dep.type === "spouse" ? "💑" : "👶"}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{dep.name} {dep.firstname}</p>
        <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}{dep.identity_document ? ` · ${dep.identity_document}` : ""}</p>
      </div>
      <button onClick={() => onDelete(dep.id)} style={{ background: "#FEF2F2", border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer", fontSize: 16 }}>🗑️</button>
    </div>
  );
}

const s = {
  title:    { fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" },
  sub:      { fontSize: 13, color: "#6B7280", margin: "0 0 16px" },
  ok:       { background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "12px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 16 },
  limCard:  { background: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)" },
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 },
  modal:    { background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" },
  closeBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6B7280" },
  err:      { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 12, color: "#DC2626", fontSize: 13, marginBottom: 16 },
  typeBtn:  { flex: 1, padding: 12, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
  label:    { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input:    { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#111827", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box" },
  submitBtn:{ width: "100%", background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif", marginTop: 8 },
};
