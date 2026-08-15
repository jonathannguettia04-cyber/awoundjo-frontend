// src/pages/public/AdhesionEchec.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import { C, CONTACT } from "../../data/constants";

export default function AdhesionEchec() {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let saved = null;
    try {
      const raw = sessionStorage.getItem("awj_last_adhesion");
      if (raw) saved = JSON.parse(raw);
    } catch { /* sessionStorage indisponible — pas bloquant */ }
    setDetails(saved);

    // On garde awj_last_adhesion en session (pas de removeItem) pour
    // permettre au client de relancer le paiement depuis /adhesion sans
    // ressaisir ses infos ; ce n'est pas ici qu'on déclenche Purchase.
  }, []);

  return (
    <>
      <FontLoader />
      <Nav />

      <section style={{
        background: "#F7F4EE",
        padding: "120px 24px 80px",
        minHeight: "70vh",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "#FEF2F2", border: "2px solid #F5C6C0",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, margin: "0 auto 24px",
          }}>⚠️</div>

          <h1 style={{
            fontFamily: "Playfair Display, serif", fontWeight: 900,
            fontSize: "clamp(1.5rem, 3.5vw, 2.1rem)", color: C.slate,
            margin: "0 0 14px", lineHeight: 1.2,
          }}>
            Le paiement n'a pas abouti
          </h1>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.7, margin: "0 0 28px" }}>
            Votre transaction {details?.plan ? `pour la formule ${details.plan} ` : ""}
            n'a pas pu être finalisée. Aucun montant n'a été débité si l'opération a été annulée.
            Vous pouvez réessayer ou nous contacter si le problème persiste.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <Link
              to="/adhesion"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: C.green, color: "#FFFFFF", fontWeight: 800, fontSize: 15,
                padding: "14px 32px", borderRadius: 50, textDecoration: "none",
              }}
            >
              Réessayer le paiement
            </Link>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("Bonjour, mon paiement d'adhésion Awoundjô a échoué, pouvez-vous m'aider ?")}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.green, textDecoration: "underline" }}
            >
              Contacter le support sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
