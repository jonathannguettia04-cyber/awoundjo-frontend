// src/pages/client/ClientProfil.jsx
import { useState } from "react";
import { clientLogout, getClientData, clientProfileAPI } from "../../clientApi";

export default function ClientProfil() {
  const client = getClientData();
  const [editModal, setEditModal] = useState(false);
  const [pwdModal,  setPwdModal]  = useState(false);
  const [phone, setPhone]         = useState(client?.phone || "");
  const [city,  setCity]          = useState(client?.city  || "");
  const [curPwd,  setCurPwd]      = useState("");
  const [newPwd,  setNewPwd]      = useState("");
  const [confirm, setConfirm]     = useState("");
  const [saving,  setSaving]      = useState(false);
  const [error,   setError]       = useState("");
  const [success, setSuccess]     = useState("");

  const handleUpdateProfile = async () => {
    setSaving(true); setError("");
    try {
      await clientProfileAPI.update({ phone, city });
      setSuccess("Profil mis à jour !"); setEditModal(false);
      const d = getClientData(); if (d) { d.phone = phone; localStorage.setItem("client_data", JSON.stringify(d)); }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSaving(false); }
  };

  const handleChangePwd = async () => {
    if (newPwd !== confirm) return setError("Mots de passe différents");
    if (newPwd.length < 6) return setError("Minimum 6 caractères");
    setSaving(true); setError("");
    try {
      const { clientAuthAPI } = await import("../../clientApi");
      await clientAuthAPI.changePassword({ current_password: curPwd, new_password: newPwd });
      setSuccess("Mot de passe modifié !"); setPwdModal(false);
      setCurPwd(""); setNewPwd(""); setConfirm("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 16, fontFamily: "'Poppins',sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Mon Profil</h1>

      {success && <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "12px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>✅ {success}</div>}

      {/* Avatar */}
      <div style={{ background: "linear-gradient(135deg,#1a56db,#1e40af)", borderRadius: 20, padding: 24, color: "#fff", marginBottom: 20, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, background: "rgba(255,255,255,.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 32, fontWeight: 800 }}>
          {client?.name?.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>{client?.name}</h2>
        <p style={{ margin: 0, opacity: .8, fontFamily: "monospace", letterSpacing: 1, fontSize: 13 }}>{client?.mutual_number}</p>
      </div>

      {/* Infos */}
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)", marginBottom: 16 }}>
        {[
          { icon: "📱", label: "Téléphone", val: client?.phone || "—" },
          { icon: "🏙️", label: "Ville",     val: client?.city  || "—" },
          { icon: "🏷️", label: "Plan",      val: client?.plan  || "—" },
          { icon: "📊", label: "Statut",    val: client?.status || "—" },
        ].map((item, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <button onClick={() => { setError(""); setEditModal(true); }} style={{ background: "#EFF6FF", color: "#1a56db", border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>
          ✏️ Modifier mes informations
        </button>
        <button onClick={() => { setError(""); setPwdModal(true); }} style={{ background: "#F5F3FF", color: "#8B5CF6", border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>
          🔑 Changer mon mot de passe
        </button>
        <button onClick={clientLogout} style={{ background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>
          🚪 Se déconnecter
        </button>
      </div>

      {/* Modal édition */}
      {editModal && (
        <Modal title="✏️ Modifier mes informations" onClose={() => setEditModal(false)} error={error}>
          <label style={s.label}>Téléphone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={s.input} />
          <label style={{ ...s.label, marginTop: 14 }}>Ville</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ ...s.input, marginBottom: 16 }} />
          <button onClick={handleUpdateProfile} disabled={saving} style={s.submitBtn}>{saving ? "⏳ Sauvegarde..." : "💾 Sauvegarder"}</button>
        </Modal>
      )}

      {/* Modal mot de passe */}
      {pwdModal && (
        <Modal title="🔑 Changer mot de passe" onClose={() => setPwdModal(false)} error={error}>
          {[
            { label: "Mot de passe actuel", val: curPwd, set: setCurPwd },
            { label: "Nouveau mot de passe", val: newPwd, set: setNewPwd },
            { label: "Confirmer",            val: confirm, set: setConfirm },
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <label style={s.label}>{f.label}</label>
              <input type="password" value={f.val} onChange={e => f.set(e.target.value)} style={s.input} />
            </div>
          ))}
          <button onClick={handleChangePwd} disabled={saving} style={s.submitBtn}>{saving ? "⏳..." : "🔑 Modifier"}</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, error, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6B7280" }}>✕</button>
        </div>
        {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 12, color: "#DC2626", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
        {children}
      </div>
    </div>
  );
}

const s = {
  label:    { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input:    { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#111827", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box" },
  submitBtn:{ width: "100%", background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif", marginTop: 8 },
};
