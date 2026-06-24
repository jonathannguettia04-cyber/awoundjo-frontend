// src/components/shared/WhatsAppFloat.jsx
import { C, CONTACT } from "../../data/constants";

export default function WhatsAppFloat() {
  return (
    <a href={`https://wa.me/${CONTACT.whatsapp}?text=Bonjour%2C%20je%20souhaite%20des%20informations%20sur%20la%20mutuelle%20Awoundj%C3%B4`}
      target="_blank" rel="noreferrer"
      className="awj-wa-float"
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 999,
        background: "#25D366", color: C.white,
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 20px", borderRadius: 50,
        fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
        textDecoration: "none",
        boxShadow: "0 4px 20px rgba(37,211,102,.4)",
      }}>
      <span style={{ fontSize: 20 }}>💬</span>
      <span className="awj-wa-label">Besoin d'aide ?</span>
      <style>{`
        @media (max-width: 480px) {
          .awj-wa-float { padding: 14px !important; border-radius: 50% !important; }
          .awj-wa-label { display: none !important; }
        }
      `}</style>
    </a>
  );
}
