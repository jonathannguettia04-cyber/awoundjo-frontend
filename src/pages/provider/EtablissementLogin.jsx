// src/pages/provider/EtablissementLogin.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { providerAuthAPI, providerLogin } from "../../providerApi";

const TYPES = [
  { id: "pharmacy",            label: "Pharmacie",                icon: "💊" },
  { id: "clinic",               label: "Clinique",                 icon: "🏥" },
  { id: "hospital",             label: "Hôpital",                  icon: "🏨" },
  { id: "lab",                  label: "Laboratoire",              icon: "🔬" },
  { id: "optician",             label: "Opticien",                 icon: "👓" },
  { id: "dentist",               label: "Dentiste",                 icon: "🦷" },
  { id: "midwife",               label: "Sage-femme",               icon: "🤱" },
  { id: "medecin_teleconsult",  label: "Médecin téléconsultation",  icon: "👨‍⚕️" },
];

// Palette Awoundjô — bleu institutionnel (remplace le cyan précédent)
const BLUE        = "#185FA5"; // accent principal
const BLUE_DARK    = "#0C447C"; // hover / gradient
const BLUE_DEEP    = "#042C53"; // fond profond
const BLUE_SOFT    = "rgba(24,95,165,.18)"; // fonds translucides
const BLUE_SOFT_2  = "rgba(24,95,165,.08)";

// Remplacez cette URL par le chemin de votre image (ex: "/assets/etablissement-bg.jpg").
// L'overlay bleu ci-dessous garantit la lisibilité du texte quelle que soit l'image choisie.
const BG_IMAGE_URL = "/assets/etablissement-bg.jpg";

const S = {
  root:       { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif", position: "relative", overflow: "hidden" },
  bgImage:    { position: "absolute", inset: 0, backgroundImage: `url(${BG_IMAGE_URL})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 },
  bgOverlay:  { position: "absolute", inset: 0, background: `linear-gradient(160deg, ${BLUE_DEEP}E6 0%, ${BLUE_DARK}CC 45%, ${BLUE_DEEP}F2 100%)`, zIndex: 1 },
  content:    { position: "relative", zIndex: 2, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" },
  logo:       { display: "flex", alignItems: "center", gap: 12, marginBottom: 32 },
  logoImg:    { width: 48, height: 48, objectFit: "contain", borderRadius: 12, background: "rgba(255,255,255,.1)", padding: 6 },
  logoText:   { color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: -.5 },
  logoSub:    { color: "rgba(255,255,255,.6)", fontSize: 12, marginTop: 2 },
  card:       { background: "rgba(255,255,255,.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 24, padding: "32px 28px", width: "100%", maxWidth: 440 },
  tabs:       { display: "flex", background: "rgba(255,255,255,.07)", borderRadius: 14, padding: 4, marginBottom: 28, gap: 4 },
  tab:        { flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all .25s", fontFamily: "inherit" },
  tabActive:  { background: BLUE, color: "#fff", boxShadow: `0 4px 12px ${BLUE_SOFT}` },
  tabInactive:{ background: "transparent", color: "rgba(255,255,255,.6)" },
  label:      { display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: .8 },
  input:      { width: "100%", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s" },
  select:     { width: "100%", background: `rgba(4,44,83,.85)`, border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  field:      { marginBottom: 16 },
  btn:        { width: "100%", padding: "14px", background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8, fontFamily: "inherit", boxShadow: `0 6px 20px ${BLUE_SOFT}`, transition: "transform .2s, box-shadow .2s" },
  err:        { background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13, marginBottom: 16 },
  suc:        { background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 10, padding: "10px 14px", color: "#86EFAC", fontSize: 13, marginBottom: 16 },
  title:      { color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 4 },
  sub:        { color: "rgba(255,255,255,.55)", fontSize: 13, marginBottom: 24 },
  grid2:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  typeGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 },
  typeBtn:    { padding: "10px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, transition: "all .2s", textAlign: "center" },
  footer:     { color: "rgba(255,255,255,.35)", fontSize: 12, marginTop: 24, textAlign: "center", position: "relative", zIndex: 2 },
};

export default function EtablissementLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = TYPES.some(t => t.id === searchParams.get("type")) ? searchParams.get("type") : "pharmacy";
  const initialTab  = searchParams.get("tab") === "request" ? "request" : (searchParams.get("type") ? "request" : "login");

  const [tab,     setTab]     = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [reqForm,   setReqForm]   = useState({
    name: "", type: initialType, phone: "", email: "",
    address: "", city: "", manager_name: "",
  });

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await providerAuthAPI.login(loginForm);
      providerLogin(data.token, data.provider);
      navigate(data.temp_password ? "/etablissement/change-password" : "/etablissement/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Identifiants incorrects");
    } finally { setLoading(false); }
  }

  async function handleRequest(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await providerAuthAPI.requestAccess(reqForm);
      setSuccess("✅ Demande envoyée ! L'équipe Awoundjô vous contactera sous 48h.");
      setReqForm({ name: "", type: "pharmacy", phone: "", email: "", address: "", city: "", manager_name: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally { setLoading(false); }
  }

  return (
    <div style={S.root}>
      {/* Image de fond + overlay bleu pour la lisibilité */}
      <div style={S.bgImage} />
      <div style={S.bgOverlay} />

      <div style={S.content}>
        {/* Logo */}
        <div style={S.logo}>
          <img src="/logo-awoundjjo.png" alt="Awoundjô" style={S.logoImg} />
          <div>
            <div style={S.logoText}>Awoundjô</div>
            <div style={S.logoSub}>Portail Établissements</div>
          </div>
        </div>

        <div style={S.card}>
          {/* Tabs */}
          <div style={S.tabs}>
            {[{ id: "login", label: "🔑 Connexion" }, { id: "request", label: "📋 Demande d'accès" }].map(t => (
              <button key={t.id}
                style={{ ...S.tab, ...(tab === t.id ? S.tabActive : S.tabInactive) }}
                onClick={() => { setTab(t.id); setError(""); setSuccess(""); }}>
                {t.label}
              </button>
            ))}
          </div>

          {error   && <div style={S.err}>{error}</div>}
          {success && <div style={S.suc}>{success}</div>}

          {/* ── LOGIN ── */}
          {tab === "login" && (
            <>
              <div style={S.title}>Bon retour 👋</div>
              <div style={S.sub}>Connectez-vous à votre espace établissement</div>
              <form onSubmit={handleLogin}>
                <div style={S.field}>
                  <label style={S.label}>Téléphone ou Email</label>
                  <input style={S.input} type="text" required placeholder="Ex : 0707080910"
                    value={loginForm.login}
                    onChange={e => setLoginForm({ ...loginForm, login: e.target.value })} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Mot de passe</label>
                  <input style={S.input} type="password" required placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                <button style={S.btn} type="submit" disabled={loading}
                  onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 10px 28px ${BLUE_SOFT}`; }}
                  onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = `0 6px 20px ${BLUE_SOFT}`; }}>
                  {loading ? "Connexion…" : "Se connecter →"}
                </button>
              </form>
            </>
          )}

          {/* ── DEMANDE D'ACCÈS ── */}
          {tab === "request" && (
            <>
              <div style={S.title}>Rejoindre le réseau 🏥</div>
              <div style={S.sub}>Remplissez ce formulaire — nous validerons votre demande sous 48h</div>
              <form onSubmit={handleRequest}>
                <div style={S.field}>
                  <label style={S.label}>{reqForm.type === "medecin_teleconsult" ? "Nom du médecin *" : "Nom de l'établissement *"}</label>
                  <input style={S.input} required placeholder={reqForm.type === "medecin_teleconsult" ? "Ex : Dr. Koné Issouf" : "Ex : Pharmacie du Plateau"}
                    value={reqForm.name}
                    onChange={e => setReqForm({ ...reqForm, name: e.target.value })} />
                </div>

                {/* Type — grille visuelle */}
                <div style={S.field}>
                  <label style={S.label}>Type d'établissement *</label>
                  <div style={S.typeGrid}>
                    {TYPES.map(t => (
                      <button key={t.id} type="button"
                        onClick={() => setReqForm({ ...reqForm, type: t.id })}
                        style={{
                          ...S.typeBtn,
                          background: reqForm.type === t.id ? BLUE_SOFT : "rgba(255,255,255,.04)",
                          borderColor: reqForm.type === t.id ? BLUE : "rgba(255,255,255,.14)",
                          color: reqForm.type === t.id ? "#B5D4F4" : "rgba(255,255,255,.7)",
                        }}>
                        <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ ...S.grid2, marginBottom: 0 }}>
                  <div style={S.field}>
                    <label style={S.label}>Téléphone *</label>
                    <input style={S.input} required placeholder="0707…"
                      value={reqForm.phone}
                      onChange={e => setReqForm({ ...reqForm, phone: e.target.value })} />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Email</label>
                    <input style={S.input} type="email" placeholder="contact@…"
                      value={reqForm.email}
                      onChange={e => setReqForm({ ...reqForm, email: e.target.value })} />
                  </div>
                </div>
                <div style={{ ...S.grid2, marginBottom: 0 }}>
                  <div style={S.field}>
                    <label style={S.label}>Ville</label>
                    <input style={S.input} placeholder="Abidjan"
                      value={reqForm.city}
                      onChange={e => setReqForm({ ...reqForm, city: e.target.value })} />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Quartier / Adresse</label>
                    <input style={S.input} placeholder="Plateau…"
                      value={reqForm.address}
                      onChange={e => setReqForm({ ...reqForm, address: e.target.value })} />
                  </div>
                </div>
                {reqForm.type !== "medecin_teleconsult" && (
                  <div style={S.field}>
                    <label style={S.label}>Nom du responsable *</label>
                    <input style={S.input} required placeholder="Nom complet du gérant"
                      value={reqForm.manager_name}
                      onChange={e => setReqForm({ ...reqForm, manager_name: e.target.value })} />
                  </div>
                )}

                {/* Info partenaire */}
                {reqForm.type !== "medecin_teleconsult" && (
                  <div style={{ background: BLUE_SOFT_2, border: `1px solid ${BLUE_SOFT}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "rgba(255,255,255,.65)" }}>
                    ℹ️ Le statut <strong style={{ color: "#B5D4F4" }}>clinique partenaire</strong> (donnant accès à la formule BASIQUE) sera défini par l'équipe Awoundjô lors de la validation.
                  </div>
                )}

                <button style={S.btn} type="submit" disabled={loading}
                  onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}>
                  {loading ? "Envoi…" : "Envoyer la demande →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p style={S.footer}>
        © 2025 Mutuelle Santé Awoundjô — Côte d'Ivoire
      </p>
    </div>
  );
}
