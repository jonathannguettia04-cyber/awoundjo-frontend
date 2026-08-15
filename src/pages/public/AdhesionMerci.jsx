// src/pages/public/AdhesionMerci.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import { C, CONTACT } from "../../data/constants";

const fcfa = (n) => new Intl.NumberFormat("fr-FR").format(n) + " F";

export default function AdhesionMerci() {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let saved = null;
    try {
      const raw = sessionStorage.getItem("awj_last_adhesion");
      if (raw) saved = JSON.parse(raw);
    } catch { /* sessionStorage indisponible — pas bloquant */ }

    setDetails(saved);

    // ── Tracking conversion : Purchase ──────────────────────────
    // Protection anti-double comptage (rafraîchissement de la page,
    // retour arrière navigateur) : on ne déclenche qu'une seule fois
    // par transaction, via un flag localStorage keyé sur le tx id.
    if (saved?.tx) {
      const flagKey = `awj_purchase_tracked_${saved.tx}`;
      let alreadyTracked = false;
      try { alreadyTracked = !!localStorage.getItem(flagKey); } catch { /* noop */ }

      if (!alreadyTracked) {
        if (typeof window.fbq === "function") {
          window.fbq("track", "Purchase", {
            content_name: `Adhésion ${saved.plan}`,
            content_category: saved.mode,
            value: saved.amount,
            currency: "XOF",
          });
        }
        if (typeof window.gtag === "function") {
          window.gtag("event", "purchase", {
            transaction_id: saved.tx,
            currency: "XOF",
            value: saved.amount,
            items: [{ item_name: saved.plan, item_category: saved.mode }],
          });
        }
        try { localStorage.setItem(flagKey, "1"); } catch { /* noop */ }
      }
    }

    // Nettoyage — évite de réafficher un ancien récapitulatif
    // si l'utilisateur revient sur cette page plus tard sans nouvelle adhésion.
    try { sessionStorage.removeItem("awj_last_adhesion"); } catch { /* noop */ }
  }, []);

  return (
    <>
      <FontLoader />
      <Nav />

      <section style={{
        background: `linear-gradient(150deg, #08172B 0%, ${C.green} 100%)`,
        padding: "120px 24px 80px",
        minHeight: "70vh",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, margin: "0 auto 24px",
          }}>✅</div>

          <h1 style={{
            fontFamily: "Playfair Display, serif", fontWeight: 900,
            fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "#FFFFFF",
            margin: "0 0 14px", lineHeight: 1.2,
          }}>
            Bienvenue chez Awoundjô 🎉
          </h1>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15.5, color: "#A9C6E0", lineHeight: 1.7, margin: "0 0 28px" }}>
            Votre paiement a bien été reçu. Votre dossier est en cours de validation
            et votre carte sera activée sous 24h. Vous recevrez une confirmation par SMS et WhatsApp.
          </p>

          {details && (
            <div style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16, padding: "20px 24px", marginBottom: 28, textAlign: "left",
            }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#A9C6E0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                Récapitulatif
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#FFFFFF", marginBottom: 8 }}>
                <span>Formule</span>
                <span style={{ fontWeight: 700 }}>{details.plan}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#FFFFFF" }}>
                <span>Montant payé</span>
                <span style={{ fontWeight: 700 }}>{fcfa(details.amount)}</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("Bonjour, je viens d'adhérer à Awoundjô et je souhaite suivre mon dossier.")}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: C.gold, color: "#08172B", fontWeight: 800, fontSize: 15,
                padding: "14px 32px", borderRadius: 50, textDecoration: "none",
              }}
            >
              💬 Suivre mon dossier sur WhatsApp
            </a>
            <Link to="/" style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#A9C6E0", textDecoration: "underline" }}>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
