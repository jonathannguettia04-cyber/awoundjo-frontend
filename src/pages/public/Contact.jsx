// src/pages/public/Contact.jsx
import { useState } from "react";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, CONTACT } from "../../data/constants";

const API_BASE = import.meta.env.VITE_API_URL || "";

const SUBJECTS = [
  "Renseignement sur les formules",
  "Problème avec ma carte Mansa",
  "Remboursement en attente",
  "Ajouter un bénéficiaire",
  "Résiliation ou modification",
  "Partenariat établissement",
  "Autre",
];

export default function Contact() {
  const [form, setForm] = useState({ nom: "", tel: "", email: "", sujet: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const [recall, setRecall] = useState({ nom: "", tel: "" });
  const [recallSent, setRecallSent] = useState(false);

  function validate() {
    const e = {};
    if (!form.nom.trim())     e.nom = "Requis";
    if (!form.tel.trim())     e.tel = "Requis";
    if (!form.sujet)          e.sujet = "Choisissez un sujet";
    if (!form.message.trim()) e.message = "Requis";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSending(true);
    // Ici vous pouvez brancher votre endpoint de contact
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setSending(false);
  }

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
    border: "1.5px solid #E2E8F0", outline: "none",
    fontFamily: "Inter, sans-serif", color: C.slate, boxSizing: "border-box",
    background: "#FAFCFB",
  };

  const INFOS = [
    { icon: "📞", label: "Téléphone", val: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, "")}` },
    { icon: "✉️", label: "Email",     val: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: "💬", label: "WhatsApp",  val: "+225 01 71 72 16 68", href: `https://wa.me/${CONTACT.whatsapp}` },
    { icon: "📍", label: "Adresse",   val: CONTACT.address, href: null },
  ];

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, ${C.slate} 0%, ${C.green} 100%)`,
        padding: "140px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, background: `radial-gradient(circle at 70% 40%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Contact</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.15 }}>
            Nous sommes là<br /><span style={{ color: C.gold }}>pour vous aider</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.75 }}>
            Une question, un problème ou un projet ? Notre équipe vous répond sous 24h en semaine.
          </p>
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL ────────────────────────────────── */}
      <section style={{ background: C.cream, padding: "80px 24px 96px" }}>
        <div className="awj-grid-2" style={{ maxWidth: 1200, margin: "0 auto", gap: 56, alignItems: "start" }}>

          {/* Colonne gauche : infos + rappel */}
          <div>
            {/* Coordonnées */}
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 20, textTransform: "uppercase" }}>Nos coordonnées</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
              {INFOS.map(c => (
                <div key={c.label} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: C.white, padding: "16px 18px", borderRadius: 14, border: `1.5px solid ${C.greenPale}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: C.greenPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: C.gray, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>{c.label}</div>
                    {c.href ? (
                      <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: C.slate, textDecoration: "none", wordBreak: "break-word" }}>{c.val}</a>
                    ) : (
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: C.slate, lineHeight: 1.5 }}>{c.val}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Horaires */}
            <div style={{ background: C.white, borderRadius: 16, padding: "22px 20px", border: `1.5px solid ${C.greenPale}`, marginBottom: 28 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, textTransform: "uppercase", marginBottom: 14 }}>Horaires d'ouverture</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { j: "Lundi – Vendredi", h: "8h00 – 17h00" },
                  { j: "Samedi",           h: "8h00 – 13h00" },
                  { j: "Dimanche",         h: "Fermé" },
                ].map(r => (
                  <div key={r.j} style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 13.5 }}>
                    <span style={{ color: C.slate }}>{r.j}</span>
                    <span style={{ fontWeight: 700, color: r.h === "Fermé" ? C.gray : C.green }}>{r.h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rappel rapide */}
            <div style={{ background: C.green, borderRadius: 16, padding: "24px 20px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17, color: "#FFFFFF", marginBottom: 6 }}>Être rappelé rapidement</div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 16, lineHeight: 1.6 }}>
                Laissez vos coordonnées, nous vous rappelons dans les 2h ouvrables.
              </p>
              {recallSent ? (
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#FFFFFF", fontWeight: 600 }}>✓ Demande envoyée ! On vous rappelle bientôt.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    placeholder="Votre prénom"
                    value={recall.nom}
                    onChange={e => setRecall({ ...recall, nom: e.target.value })}
                    style={{ padding: "11px 14px", borderRadius: 9, border: "none", fontFamily: "Inter, sans-serif", fontSize: 13, boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder="Numéro de téléphone"
                      value={recall.tel}
                      onChange={e => setRecall({ ...recall, tel: e.target.value })}
                      style={{ flex: 1, padding: "11px 14px", borderRadius: 9, border: "none", fontFamily: "Inter, sans-serif", fontSize: 13 }}
                    />
                    <button
                      onClick={() => { if (recall.nom && recall.tel) setRecallSent(true); }}
                      style={{ background: C.gold, color: C.slate, border: "none", padding: "11px 18px", borderRadius: 9, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Rappeler →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite : formulaire */}
          <div style={{ background: C.white, borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.07)", border: `1.5px solid ${C.greenPale}` }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700, color: C.green, marginBottom: 8 }}>Message envoyé !</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, lineHeight: 1.7 }}>
                  Merci de nous avoir contactés. Notre équipe vous répond dans les 24h ouvrables.
                  En urgence, contactez-nous sur WhatsApp.
                </p>
                <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-block", marginTop: 20, background: "#25D366", color: "#FFFFFF",
                  fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
                  padding: "12px 24px", borderRadius: 10, textDecoration: "none",
                }}>💬 WhatsApp</a>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 22, color: C.slate, marginBottom: 24 }}>Envoyez-nous un message</div>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="awj-grid-2" style={{ gap: 14 }}>
                    <div>
                      <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.slate, display: "block", marginBottom: 5 }}>Nom complet *</label>
                      <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Aya Kouassi" style={{ ...inputStyle, borderColor: errors.nom ? "#C0392B" : "#E2E8F0" }} />
                      {errors.nom && <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#C0392B" }}>{errors.nom}</span>}
                    </div>
                    <div>
                      <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.slate, display: "block", marginBottom: 5 }}>Téléphone *</label>
                      <input value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} placeholder="07 00 00 00 00" style={{ ...inputStyle, borderColor: errors.tel ? "#C0392B" : "#E2E8F0" }} />
                      {errors.tel && <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#C0392B" }}>{errors.tel}</span>}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.slate, display: "block", marginBottom: 5 }}>Email</label>
                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com" type="email" style={inputStyle} />
                  </div>

                  <div>
                    <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.slate, display: "block", marginBottom: 5 }}>Sujet *</label>
                    <select value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} style={{ ...inputStyle, borderColor: errors.sujet ? "#C0392B" : "#E2E8F0" }}>
                      <option value="">Choisissez un sujet...</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.sujet && <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#C0392B" }}>{errors.sujet}</span>}
                  </div>

                  <div>
                    <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: C.slate, display: "block", marginBottom: 5 }}>Message *</label>
                    <textarea
                      value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                      rows={5} placeholder="Décrivez votre demande en détail..."
                      style={{ ...inputStyle, resize: "vertical", borderColor: errors.message ? "#C0392B" : "#E2E8F0" }}
                    />
                    {errors.message && <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#C0392B" }}>{errors.message}</span>}
                  </div>

                  <button type="submit" disabled={sending} style={{
                    background: C.green, color: "#FFFFFF", border: "none",
                    fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
                    padding: "15px", borderRadius: 10, cursor: sending ? "wait" : "pointer",
                    opacity: sending ? 0.75 : 1,
                  }}>
                    {sending ? "Envoi en cours..." : "Envoyer le message →"}
                  </button>

                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray, textAlign: "center", margin: 0 }}>
                    Réponse garantie sous 24h ouvrables. En urgence, utilisez WhatsApp.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
