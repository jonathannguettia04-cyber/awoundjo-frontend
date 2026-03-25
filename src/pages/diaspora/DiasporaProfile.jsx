// src/pages/diaspora/DiasporaProfile.jsx
// ─────────────────────────────────────────────────────────────
//  Page profil de l'ambassadeur diaspora
//  Corrige le bug : l'onglet "Profil" pointait sur l'admin commercial
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { diasporaProfileAPI, getDiasporaData } from "../../diasporaApi";

const C = {
  blue:   "#1B4FD8",
  blueL:  "#EEF2FF",
  green:  "#059669",
  greenL: "#ECFDF5",
  gold:   "#D97706",
  goldL:  "#FFFBEB",
  red:    "#DC2626",
  redL:   "#FEF2F2",
  purple: "#7C3AED",
  purpleL:"#F5F3FF",
  slate:  "#64748B",
  dark:   "#0F172A",
  border: "#E2E8F0",
  bg:     "#F8FAFC",
};

const roleLabel = {
  DIRIGEANTE: { label: "Dirigeante",               color: "#7C3AED", bg: "#F5F3FF" },
  DIASPORA:   { label: "Ambassadrice Diaspora",     color: C.blue,   bg: C.blueL  },
  PAYS:       { label: "Ambassadeur Pays",           color: C.green,  bg: C.greenL },
  VILLE:      { label: "Ambassadeur Ville",           color: C.gold,   bg: C.goldL  },
  RECRUTEUR:  { label: "Recruteur",                 color: C.slate,  bg: C.bg     },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

export default function DiasporaProfile() {
  const navigate           = useNavigate();
  const [amb, setAmb]      = useState(null);
  const [form, setForm]    = useState({ name: "", country: "", city: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    // Essayer d'abord depuis les données locales, puis depuis l'API
    const local = getDiasporaData();
    if (local) {
      setAmb(local);
      setForm({ name: local.name || "", country: local.country || "", city: local.city || "", phone: local.phone || "" });
    }
    // Charger les données fraîches depuis l'API
    diasporaProfileAPI.getMe().then(r => {
      const a = r.data?.ambassador;
      if (a) {
        setAmb(a);
        setForm({ name: a.name || "", country: a.country || "", city: a.city || "", phone: a.phone || "" });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.name) return setError("Le nom est requis");
    setSaving(true); setError(""); setSuccess("");
    try {
      await diasporaProfileAPI.update(form);
      // Mettre à jour les données locales
      const updated = { ...amb, ...form };
      localStorage.setItem("diaspora_data", JSON.stringify(updated));
      setAmb(updated);
      setSuccess("Profil mis à jour avec succès ✅");
      setEditMode(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de la mise à jour");
    } finally { setSaving(false); }
  };

  const logout = () => {
    localStorage.removeItem("diaspora_token");
    localStorage.removeItem("diaspora_data");
    navigate("/diaspora/login");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <div style={{
          width: 36, height: 36, border: `3px solid ${C.blueL}`,
          borderTop: `3px solid ${C.blue}`, borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const rl = roleLabel[amb?.role] || roleLabel.RECRUTEUR;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 640, margin: "0 auto" }}>

      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.dark }}>Mon profil</h1>
        <p style={{ margin: "4px 0 0", color: C.slate, fontSize: 14 }}>Gérez vos informations personnelles</p>
      </div>

      {/* Carte identité ambassadeur */}
      <Card style={{
        background: "linear-gradient(135deg, #1B4FD8 0%, #3B82F6 100%)",
        border: "none", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, flexShrink: 0,
          }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#fff" }}>{amb?.name}</p>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{amb?.email}</p>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{
                background: rl.bg, color: rl.color,
                padding: "2px 12px", borderRadius: 999,
                fontSize: 11, fontWeight: 700,
              }}>
                {rl.label}
              </span>
              {amb?.status === "ACTIVE" && (
                <span style={{
                  background: "rgba(5,150,105,0.2)", color: "#6EE7B7",
                  padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                }}>
                  ✓ Actif
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Code ambassadeur */}
        {amb?.referral_code && (
          <div style={{
            marginTop: 16, padding: "10px 14px",
            background: "rgba(255,255,255,0.15)", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>CODE AMBASSADEUR</span>
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 900, letterSpacing: "0.08em" }}>
              {amb.referral_code}
            </span>
          </div>
        )}
      </Card>

      {/* Alertes */}
      {success && (
        <div style={{ background: C.greenL, color: C.green, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ background: C.redL, color: C.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Formulaire d'édition */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 800, color: C.dark, fontSize: 15 }}>Informations personnelles</p>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              style={{
                padding: "6px 14px", borderRadius: 8,
                border: `1.5px solid ${C.blue}`, background: C.blueL,
                color: C.blue, fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}
            >
              ✏️ Modifier
            </button>
          )}
        </div>

        {editMode ? (
          <>
            {[
              { key: "name",    label: "Nom complet *",  placeholder: "Votre nom" },
              { key: "country", label: "Pays",            placeholder: "France" },
              { key: "city",    label: "Ville",           placeholder: "Paris" },
              { key: "phone",   label: "WhatsApp",        placeholder: "+33 6 00 00 00 00" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 5 }}>
                  {f.label}
                </label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
                    border: `1.5px solid ${C.border}`, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setEditMode(false); setError(""); }} style={{
                padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${C.border}`,
                background: "#fff", color: C.slate, fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                Annuler
              </button>
              <button onClick={save} disabled={saving} style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: C.blue, color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Enregistrement…" : "✅ Sauvegarder"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "👤", label: "Nom",       value: amb?.name       },
              { icon: "🌍", label: "Pays",      value: amb?.country    },
              { icon: "🏙️", label: "Ville",     value: amb?.city       },
              { icon: "📱", label: "WhatsApp",  value: amb?.phone      },
              { icon: "📧", label: "Email",     value: amb?.email      },
              { icon: "📅", label: "Membre depuis", value: fmtDate(amb?.created_at) },
              { icon: "🕐", label: "Dernière connexion", value: fmtDate(amb?.last_login) },
            ].map(item => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center",
                padding: "8px 0", borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: C.slate, width: 130, flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{item.value || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sécurité */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 14px", fontWeight: 800, color: C.dark, fontSize: 15 }}>🔒 Sécurité</p>
        <div style={{
          padding: "12px 14px", background: C.bg, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.dark }}>Mot de passe</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
              Pour changer votre mot de passe, contactez le support
            </p>
          </div>
          <span style={{ fontSize: 20 }}>🔑</span>
        </div>
      </Card>

      {/* Déconnexion */}
      <button
        onClick={logout}
        style={{
          width: "100%", padding: "12px", borderRadius: 10,
          border: `2px solid ${C.red}22`, background: C.redL,
          color: C.red, fontWeight: 700, fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        🚪 Se déconnecter
      </button>
    </div>
  );
}
