// src/pages/client/ClientFamille.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clientDepsAPI } from "../../clientApi";
import { uploadFile } from "../../supabaseClient";

const EMPTY_SPOUSE = { type: "spouse", name: "", firstname: "", birth_date: "", birth_place: "", identity_document: "", photo: null, piece: null };
const EMPTY_CHILD  = { type: "child",  name: "", firstname: "", birth_date: "", birth_place: "", identity_document: "", photo: null, piece: null };

export default function ClientFamille() {
  const navigate = useNavigate();
  const [deps, setDeps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY_SPOUSE);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Fichiers bruts (File objects) pour upload Supabase
  const [photoFile, setPhotoFile] = useState(null);
  const [pieceFile, setPieceFile] = useState(null);
  // Previews locaux (URL.createObjectURL)
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pieceReady,   setPieceReady]   = useState(false);
  // État upload
  const [uploading, setUploading] = useState(false);

  const photoRef = useRef();
  const pieceRef = useRef();

  const load = () => {
    clientDepsAPI.get()
      .then(res => setDeps(res.data.data))
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const spouse   = deps.filter(d => d.type === "spouse");
  const children = deps.filter(d => d.type === "child");

  const openModal = (type) => {
    setForm(type === "spouse" ? { ...EMPTY_SPOUSE } : { ...EMPTY_CHILD });
    setPhotoFile(null);
    setPieceFile(null);
    setPhotoPreview(null);
    setPieceReady(false);
    setError("");
    setModal(type);
  };

  const handlePhotoChange = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePieceChange = (file) => {
    if (!file) return;
    setPieceFile(file);
    setPieceReady(true);
  };

  const handleAdd = async () => {
    if (!form.name || !form.firstname) return setError("Nom et prénom requis");
    setError("");
    setSaving(true);
    setUploading(true);

    try {
      // ── Upload vers Supabase Storage (plus de base64) ──────────
      const [photoUrl, pieceUrl] = await Promise.all([
        photoFile ? uploadFile(photoFile, "photos") : Promise.resolve(null),
        pieceFile ? uploadFile(pieceFile, "pieces") : Promise.resolve(null),
      ]);
      setUploading(false);

      if (photoFile && !photoUrl)
        return setError("Échec de l'upload de la photo. Réessayez.");
      if (pieceFile && !pieceUrl)
        return setError("Échec de l'upload du document. Réessayez.");

      // ── Envoi au backend — uniquement des URLs, plus de base64 ─
      await clientDepsAPI.add({
        type:              form.type,
        name:              form.name,
        firstname:         form.firstname,
        birth_date:        form.birth_date,
        birth_place:       form.birth_place,
        identity_document: form.identity_document,
        photo:             photoUrl,
        piece:             pieceUrl,
      });

      setSuccess(`${form.type === "spouse" ? "Conjoint(e)" : "Enfant"} ajouté(e) !`);
      setModal(null);
      load();
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      setUploading(false);
      const msg = err.response?.data?.error || err.message || "Erreur lors de l'enregistrement";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce bénéficiaire ?")) return;
    try { await clientDepsAPI.remove(id); load(); }
    catch (err) { alert(err.response?.data?.error || "Erreur"); }
  };

  if (loading) return <Skeleton />;

  const isBusy = saving || uploading;

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Ma Famille</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Gérez les bénéficiaires couverts par votre mutuelle</p>

      {success && (
        <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "1px solid #6EE7B7", borderRadius: 14, padding: "14px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          ✅ {success}
        </div>
      )}

      {/* Compteurs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { icon: "👤", label: "Souscripteur", count: 1,              max: 1, color: "#1D4ED8", bg: "#EFF6FF" },
          { icon: "💑", label: "Conjoint(e)",  count: spouse.length,   max: 1, color: "#DB2777", bg: "#FDF2F8" },
          { icon: "👶", label: "Enfants",       count: children.length, max: 3, color: "#059669", bg: "#ECFDF5" },
        ].map((item, i) => (
          <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: `1.5px solid ${item.bg}` }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.count}/{item.max}</span>
            <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textAlign: "center" }}>{item.label}</span>
            <div style={{ width: "100%", height: 4, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(item.count / item.max) * 100}%`, background: item.color, borderRadius: 2, transition: "width .4s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Section Conjoint ── */}
      <SectionHeader title="Conjoint(e)" icon="💑" color="#DB2777"
        canAdd={spouse.length < 1} onAdd={() => openModal("spouse")} />
      {spouse.length === 0
        ? <EmptyCard icon="💑" text="Aucun conjoint enregistré" color="#DB2777" onAdd={() => openModal("spouse")} />
        : spouse.map(d => <DepCard key={d.id} dep={d} onDelete={handleDelete} />)}

      {/* ── Section Enfants ── */}
      <SectionHeader title={`Enfants (${children.length}/3)`} icon="👶" color="#059669"
        canAdd={children.length < 3} onAdd={() => openModal("child")} />
      {children.length === 0
        ? <EmptyCard icon="👶" text="Aucun enfant enregistré" color="#059669" onAdd={() => openModal("child")} />
        : children.map(d => <DepCard key={d.id} dep={d} onDelete={handleDelete} />)}

      {/* ── Modal ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={() => !isBusy && setModal(null)}>
          <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                  {modal === "spouse" ? "💑 Ajouter conjoint(e)" : "👶 Ajouter un enfant"}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>
                  {modal === "spouse" ? "1 conjoint maximum" : `${children.length}/3 enfants`}
                </p>
              </div>
              <button onClick={() => !isBusy && setModal(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Photo d'identité */}
            <div style={{ marginBottom: 20 }}>
              <label style={ls.label}>📸 Photo d'identité</label>
              <div onClick={() => photoRef.current?.click()} style={{ border: "2px dashed #CBD5E1", borderRadius: 14, padding: "16px", textAlign: "center", cursor: "pointer", background: photoPreview ? "#F0FDF4" : "#F8FAFC", transition: "all .2s" }}>
                {photoPreview
                  ? <img src={photoPreview} alt="photo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", margin: "0 auto" }} />
                  : <div><span style={{ fontSize: 32 }}>📷</span><p style={{ color: "#94A3B8", fontSize: 12, margin: "8px 0 0" }}>Cliquez pour importer</p></div>}
              </div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handlePhotoChange(e.target.files[0])} />
            </div>

            {/* Champs identité */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Field label="Nom *" placeholder="Nom de famille" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="Prénom *" placeholder="Prénom" value={form.firstname} onChange={v => setForm(f => ({ ...f, firstname: v }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Field label="Date de naissance" type="date" value={form.birth_date} onChange={v => setForm(f => ({ ...f, birth_date: v }))} />
              <Field label="Lieu de naissance" placeholder="Ville" value={form.birth_place} onChange={v => setForm(f => ({ ...f, birth_place: v }))} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <Field
                label={modal === "spouse" ? "N° CNI / Passeport" : "N° Extrait de naissance"}
                placeholder="Numéro du document"
                value={form.identity_document}
                onChange={v => setForm(f => ({ ...f, identity_document: v }))}
              />
            </div>

            {/* Pièce justificative */}
            <div style={{ marginBottom: 24 }}>
              <label style={ls.label}>{modal === "spouse" ? "📄 CNI / Passeport (scan)" : "📄 Extrait de naissance (scan)"}</label>
              <div onClick={() => pieceRef.current?.click()} style={{ border: "2px dashed #CBD5E1", borderRadius: 14, padding: "14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: pieceReady ? "#EFF6FF" : "#F8FAFC" }}>
                <span style={{ fontSize: 28 }}>{pieceReady ? "✅" : "📎"}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: pieceReady ? "#1D4ED8" : "#475569" }}>
                    {pieceReady ? "Document prêt ✓" : "Importer le document"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94A3B8" }}>JPG, PNG ou PDF</p>
                </div>
              </div>
              <input ref={pieceRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
                onChange={e => handlePieceChange(e.target.files[0])} />
            </div>

            {/* Bouton enregistrer */}
            <button onClick={handleAdd} disabled={isBusy} style={{ width: "100%", background: isBusy ? "#94A3B8" : modal === "spouse" ? "linear-gradient(135deg,#DB2777,#9D174D)" : "linear-gradient(135deg,#059669,#065F46)", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 700, cursor: isBusy ? "not-allowed" : "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,.2)", transition: "background .2s" }}>
              {uploading ? "⬆️ Upload en cours..." : saving ? "⏳ Enregistrement..." : `✅ Enregistrer ${modal === "spouse" ? "le conjoint" : "l'enfant"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <div>
      <label style={ls.label}>{label}</label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#0F172A", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box", outline: "none", background: "#FAFAFA" }} />
    </div>
  );
}

function SectionHeader({ title, icon, color, canAdd, onAdd }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 24 }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{title}</span>
      {canAdd && (
        <button onClick={onAdd} style={{ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: `0 4px 12px ${color}40` }}>
          + Ajouter
        </button>
      )}
    </div>
  );
}

function EmptyCard({ icon, text, color, onAdd }) {
  return (
    <div onClick={onAdd} style={{ background: "#fff", borderRadius: 16, padding: "28px 20px", textAlign: "center", border: "2px dashed #E2E8F0", marginBottom: 8, cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <p style={{ color: "#94A3B8", fontSize: 14, margin: "10px 0 6px" }}>{text}</p>
      <p style={{ color, fontSize: 13, fontWeight: 600, margin: 0 }}>+ Ajouter</p>
    </div>
  );
}

function DepCard({ dep, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div style={{ width: 50, height: 50, background: dep.type === "spouse" ? "#FDF2F8" : "#ECFDF5", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, overflow: "hidden" }}>
          {dep.photo ? <img src={dep.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (dep.type === "spouse" ? "💑" : "👶")}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 2px" }}>{dep.firstname} {dep.name}</p>
          <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
            {dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}
            {dep.birth_date ? ` · Né(e) le ${new Date(dep.birth_date).toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 16, color: "#94A3B8", transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
          <button onClick={e => { e.stopPropagation(); onDelete(dep.id); }} style={{ background: "#FEF2F2", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontSize: 14 }}>🗑️</button>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "14px 16px", background: "#FAFAFA" }}>
          {dep.birth_place && <InfoRow label="Lieu de naissance" value={dep.birth_place} />}
          {dep.identity_document && <InfoRow label={dep.type === "spouse" ? "N° CNI/Passeport" : "N° Extrait"} value={dep.identity_document} />}
          {dep.piece && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: .8 }}>Document</p>
              <a href={dep.piece} target="_blank" rel="noreferrer" style={{ color: "#1D4ED8", fontSize: 13, fontWeight: 600 }}>📄 Voir le document</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: 16 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[80, 120, 120].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 16, marginBottom: 12, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

const ls = {
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 },
};
