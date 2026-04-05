// src/pages/client/ClientProfil.jsx
import { useState, useRef, useEffect } from "react";
import { clientLogout, getClientData, clientProfileAPI } from "../../clientApi";
import { uploadFile } from "../../supabaseClient";

export default function ClientProfil() {
  const [client, setClient]   = useState(getClientData());
  const [editModal, setEdit]  = useState(false);
  const [pwdModal,  setPwd]   = useState(false);
  const [saving,    setSaving]= useState(false);
  const [error,     setError] = useState("");
  const [success,   setSucc]  = useState("");
  const [visible,   setVis]   = useState(false);
  const photoRef = useRef();
  const pieceRef = useRef();

  const [form, setForm] = useState({
    phone:       client?.phone       || "",
    city:        client?.city        || "",
    birth_date:  client?.birth_date  || "",
    birth_place: client?.birth_place || "",
    photo:       client?.photo       || null,
    piece:       client?.piece       || null,
  });
  const [curPwd,  setCurPwd]  = useState("");
  const [newPwd,  setNewPwd]  = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => { setTimeout(() => setVis(true), 100); }, []);

  const [uploading, setUploading] = useState(false);

  const handleFile = async (key, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const bucket = key === "photo" ? "photos" : "pieces";
      const url = await uploadFile(file, bucket);
      if (!url) { setError("Échec de l\'upload. Réessayez."); return; }
      setForm(f => ({ ...f, [key]: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true); setError("");
    try {
      await clientProfileAPI.update(form);
      const d = getClientData();
      if (d) {
        Object.assign(d, form);
        localStorage.setItem("client_data", JSON.stringify(d));
        setClient({ ...d });
      }
      setSucc("Profil mis à jour !"); setEdit(false);
      setTimeout(() => setSucc(""), 3000);
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSaving(false); }
  };

  const handleChangePwd = async () => {
    if (newPwd !== confirm) return setError("Mots de passe différents");
    if (newPwd.length < 6)  return setError("Minimum 6 caractères");
    setSaving(true); setError("");
    try {
      const { clientAuthAPI } = await import("../../clientApi");
      await clientAuthAPI.changePassword({ current_password: curPwd, new_password: newPwd });
      setSucc("Mot de passe modifié !"); setPwd(false);
      setCurPwd(""); setNewPwd(""); setConfirm("");
      setTimeout(() => setSucc(""), 3000);
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSaving(false); }
  };

  const PLAN_COLOR = { ESSENTIELLE: "#1D4ED8", IVOIRIENNE: "#059669", TURQUOISE: "#0891B2" };
  const planColor  = PLAN_COLOR[client?.plan] || "#1D4ED8";

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {success && (
        <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "1px solid #6EE7B7", borderRadius: 14, padding: "14px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          ✅ {success}
        </div>
      )}

      {/* ── Hero Avatar ── */}
      <div style={{
        background: `linear-gradient(135deg, ${planColor}, #1e3a8a)`,
        borderRadius: 24, padding: "28px 20px", color: "#fff",
        marginBottom: 20, textAlign: "center", position: "relative", overflow: "hidden",
        boxShadow: `0 12px 40px ${planColor}50`,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />

        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "3px solid rgba(255,255,255,.4)", margin: "0 auto 14px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800 }}>
          {client?.photo
            ? <img src={client.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : client?.name?.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: -.3 }}>{client?.name}</h2>
        <p style={{ margin: "0 0 12px", opacity: .75, fontFamily: "monospace", letterSpacing: 1.5, fontSize: 13 }}>{client?.mutual_number}</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 14px", border: "1px solid rgba(255,255,255,.2)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{client?.plan} · {client?.status === "active" ? "Actif" : client?.status}</span>
        </div>
      </div>

      {/* ── Infos ── */}
      <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.06)", marginBottom: 16, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "all .5s .1s cubic-bezier(.34,1.56,.64,1)" }}>
        {[
          { icon: "📱", label: "Téléphone",        val: client?.phone       || "—" },
          { icon: "🏙️", label: "Ville",            val: client?.city        || "—" },
          { icon: "🎂", label: "Date de naissance", val: client?.birth_date ? new Date(client.birth_date).toLocaleDateString("fr-FR") : "—" },
          { icon: "📍", label: "Lieu de naissance", val: client?.birth_place || "—" },
          { icon: "🏷️", label: "Formule",          val: client?.plan        || "—" },
        ].map((item, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
            <div style={{ width: 38, height: 38, background: "#F8FAFC", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: .6 }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: "2px 0 0" }}>{item.val}</p>
            </div>
          </div>
        ))}

        {/* Pièce d'identité */}
        {client?.piece && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px" }}>
            <div style={{ width: 38, height: 38, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: .6 }}>Pièce d'identité</p>
              <a href={client.piece} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "#1D4ED8", textDecoration: "none" }}>📎 Voir le document</a>
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "all .5s .2s cubic-bezier(.34,1.56,.64,1)" }}>
        <ActionBtn icon="✏️" label="Modifier mes informations" color="#1D4ED8" bg="#EFF6FF" onClick={() => { setError(""); setEdit(true); }} />
        <ActionBtn icon="🔑" label="Changer mon mot de passe"   color="#7C3AED" bg="#F5F3FF" onClick={() => { setError(""); setPwd(true); }} />
        <ActionBtn icon="🚪" label="Se déconnecter"             color="#EF4444" bg="#FEF2F2" onClick={clientLogout} />
      </div>

      {/* ── Modal édition profil ── */}
      {editModal && (
        <Modal title="✏️ Modifier mon profil" onClose={() => setEdit(false)} error={error}>

          {/* Photo */}
          <div style={{ marginBottom: 18 }}>
            <label style={ls.label}>📸 Photo de profil</label>
            <div onClick={() => photoRef.current?.click()} style={{ border: "2px dashed #CBD5E1", borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer", background: form.photo ? "#F0FDF4" : "#F8FAFC" }}>
              {form.photo
                ? <img src={form.photo} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto" }} />
                : <div><span style={{ fontSize: 32 }}>📷</span><p style={{ color: "#94A3B8", fontSize: 12, margin: "6px 0 0" }}>Cliquez pour importer</p></div>}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile("photo", e.target.files[0])} />
          </div>

          {/* Champs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Téléphone" type="tel" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="0707070707" />
            <Field label="Ville" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Abidjan" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Date de naissance" type="date" value={form.birth_date} onChange={v => setForm(f => ({ ...f, birth_date: v }))} />
            <Field label="Lieu de naissance" value={form.birth_place} onChange={v => setForm(f => ({ ...f, birth_place: v }))} placeholder="Ville" />
          </div>

          {/* Pièce d'identité */}
          <div style={{ marginBottom: 20 }}>
            <label style={ls.label}>📄 Pièce d'identité (CNI / Passeport)</label>
            <div onClick={() => pieceRef.current?.click()} style={{ border: "2px dashed #CBD5E1", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: form.piece ? "#EFF6FF" : "#F8FAFC" }}>
              <span style={{ fontSize: 28 }}>{form.piece ? "✅" : "📎"}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: form.piece ? "#1D4ED8" : "#475569" }}>
                  {form.piece ? "Document importé ✓" : "Importer ma pièce d'identité"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94A3B8" }}>JPG, PNG ou PDF</p>
              </div>
            </div>
            <input ref={pieceRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => handleFile("piece", e.target.files[0])} />
          </div>

          <button onClick={handleUpdateProfile} disabled={saving || uploading} style={ls.submitBtn}>
            {uploading ? "⬆️ Upload en cours..." : saving ? "⏳ Sauvegarde..." : "💾 Sauvegarder les modifications"}
          </button>
        </Modal>
      )}

      {/* ── Modal mot de passe ── */}
      {pwdModal && (
        <Modal title="🔑 Changer mot de passe" onClose={() => setPwd(false)} error={error}>
          {[
            { label: "Mot de passe actuel",   val: curPwd,  set: setCurPwd },
            { label: "Nouveau mot de passe",   val: newPwd,  set: setNewPwd },
            { label: "Confirmer le mot passe", val: confirm, set: setConfirm },
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <Field label={f.label} type="password" value={f.val} onChange={f.set} placeholder="••••••••" />
            </div>
          ))}
          <button onClick={handleChangePwd} disabled={saving} style={{ ...ls.submitBtn, background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
            {saving ? "⏳..." : "🔑 Modifier le mot de passe"}
          </button>
        </Modal>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, color, bg, onClick }) {
  return (
    <button onClick={onClick} style={{ background: bg, color, border: "none", borderRadius: 16, padding: "15px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "transform .15s, box-shadow .15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
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

function Modal({ title, onClose, error, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
        {children}
      </div>
    </div>
  );
}

const ls = {
  label:     { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 },
  submitBtn: { width: "100%", background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", border: "none", borderRadius: 14, padding: 15, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 16px rgba(26,86,219,.3)", marginTop: 4 },
};