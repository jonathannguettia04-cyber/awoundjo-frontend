// src/components/WavePayButton.jsx
// ─────────────────────────────────────────────────────────────
//  Bouton de paiement Wave universel
//  - Sur Android : deep link intent:// → ouvre l'app Wave directement
//  - Sur iOS/Desktop : lien https:// classique
//  - Fallback : bouton "Copier le lien"
// ─────────────────────────────────────────────────────────────

import { useState } from "react";

const WAVE_BASE = "https://pay.wave.com/m/M_Sh7TOpfh6ALd/c/ci/";

/**
 * Construit les deux versions du lien Wave :
 *  - httpsLink  : lien web classique (iOS / desktop)
 *  - intentLink : deep link Android qui ouvre l'app Wave directement
 */
export function buildWaveLinks(amount, message) {
  const params = `?amount=${amount}&message=${encodeURIComponent(message)}`;
  const httpsLink  = `${WAVE_BASE}${params}`;
  // intent:// permet à Android d'ouvrir l'app Wave sans passer par le Play Store
  const intentLink = `intent://pay.wave.com/m/M_Sh7TOpfh6ALd/c/ci/${params}#Intent;scheme=https;package=com.wave.payment;S.browser_fallback_url=${encodeURIComponent(httpsLink)};end`;
  return { httpsLink, intentLink };
}

/** Détecte Android dans le navigateur */
function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

/**
 * WavePayButton
 * @param {number}  amount       - Montant en FCFA
 * @param {string}  message      - Message du paiement
 * @param {string}  label        - Texte du bouton (ex: "Payer 15 000 FCFA")
 * @param {string}  [size]       - "lg" (défaut) | "sm"
 */
export default function WavePayButton({ amount, message, label, size = "lg" }) {
  const [copied, setCopied] = useState(false);
  const { httpsLink, intentLink } = buildWaveLinks(amount, message);

  const handleClick = (e) => {
    if (isAndroid()) {
      e.preventDefault();
      window.location.href = intentLink;
    }
    // Sur iOS/desktop le <a href={httpsLink}> s'ouvre normalement
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(httpsLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback si clipboard non dispo
      const el = document.createElement("textarea");
      el.value = httpsLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isLg = size === "lg";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Bouton principal ── */}
      <a
        href={httpsLink}
        onClick={handleClick}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: isLg ? "14px 20px" : "9px 16px",
          background: "linear-gradient(135deg,#1DC9A4,#15A882)",
          color: "#fff", fontWeight: 900,
          fontSize: isLg ? 15 : 13,
          borderRadius: isLg ? 12 : 8,
          textDecoration: "none",
          boxShadow: "0 6px 20px rgba(29,201,164,.4)",
          boxSizing: "border-box",
        }}
      >
        🌊 {label} <span style={{ fontSize: isLg ? 14 : 12 }}>↗</span>
      </a>

      {/* ── Fallback copier-coller ── */}
      <div style={{
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        padding: "10px 12px",
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>
          📋 Si Wave ne s'ouvre pas — copiez le lien
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{
            flex: 1, margin: 0, fontSize: 10, color: "#1DC9A4",
            wordBreak: "break-all", fontFamily: "monospace", lineHeight: 1.4,
          }}>
            {httpsLink}
          </p>
          <button
            onClick={handleCopy}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              background: copied ? "#ECFDF5" : "#fff",
              border: `1.5px solid ${copied ? "#059669" : "#E2E8F0"}`,
              borderRadius: 7,
              fontSize: 12, fontWeight: 700,
              color: copied ? "#059669" : "#64748B",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .2s",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "✅ Copié !" : "📋 Copier"}
          </button>
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 10, color: "#94A3B8" }}>
          Collez ce lien dans votre navigateur ou l'app Wave
        </p>
      </div>

    </div>
  );
}
