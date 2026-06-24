// src/pages/public/Contact.jsx
import { useState } from "react";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C, CONTACT } from "../../data/constants";

export default function Contact() {
  const [form, setForm] = useState({ nom: "", tel: "", email: "", sujet: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.cream, padding: "140px 24px 96px" }}>
        <div className="awj-grid-2" style={{ maxWidth: 1200, margin: "0 auto", gap: 64, alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>CONTACT</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", color: C.slate, margin: "0 0 24px" }}>
              Nous sommes là pour vous
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.7, marginBottom: 36 }}>
              Une question sur nos formules, votre adhésion ou le réseau de soins ? Notre équipe vous répond dans les 24h.
            </p>
            {[
              { icon: "📞", label: "Téléphone", val: CONTACT.phone },
              { icon: "📧", label: "Email", val: CONTACT.email },
              { icon: "📍", label: "Adresse", val: CONTACT.address },
            ].map(c => (
              <div key={c.label} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: C.greenPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray, letterSpacing: 1 }}>{c.label.toUpperCase()}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: C.slate, wordBreak: "break-word" }}>{c.val}</div>
                </div>
              </div>
            ))}

            {/* Rappel rapide */}
            <div style={{ background: C.green, borderRadius: 16, padding: 24, marginTop: 32 }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: C.white, marginBottom: 14 }}>Être rappelé rapidement</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input placeholder="Votre prénom" style={{ flex: "1 1 120px", padding: "10px 12px", borderRadius: 8, border: "none", fontFamily: "Inter, sans-serif", fontSize: 13 }} />
                <input placeholder="Téléphone" style={{ flex: "1 1 120px", padding: "10px 12px", borderRadius: 8, border: "none", fontFamily: "Inter, sans-serif", fontSize: 13 }} />
                <button style={{ background: C.gold, color: C.white, border: "none", padding: "10px 16px", borderRadius: 8, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>OK</button>
              </div>
            </div>
          </div>

          <div style={{ background: C.white, borderRadius: 20, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,.06)" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: C.green }}>Message envoyé !</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.gray, marginTop: 8 }}>Nous vous répondons sous 24h.</p>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[["nom","Nom complet"],["tel","Téléphone"],["email","Email"],["sujet","Sujet"]].map(([key, label]) => (
                  <input key={key} required placeholder={label} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 14, padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", outline: "none", boxSizing: "border-box" }}
                  />
                ))}
                <textarea required placeholder="Votre message" value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={4}
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 14, padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
                <button type="submit" style={{
                  background: C.green, color: C.white, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15,
                  padding: "14px", borderRadius: 10, border: "none", cursor: "pointer",
                }}>Envoyer le message</button>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
