// src/components/WavePayButton.jsx
// ─────────────────────────────────────────────────────────────
//  Bouton Wave qui force l'ouverture dans le navigateur externe
//  (évite la WebView qui redirige vers le Play Store)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";

const WAVE_BASE = "https://pay.wave.com/m/M_Sh7TOpfh6ALd/c/ci/";

export function buildWaveLink(amount, message) {
  return `${WAVE_BASE}?amount=${amount}&message=${encodeURIComponent(message)}`;
}

/**
 * Ouvre le lien Wave dans le navigateur externe du téléphone.
 * Crée un <a> temporaire et simule un vrai clic utilisateur,
 * ce qui force Android à proposer le choix navigateur/app
 * plutôt que de rester dans la WebView.
 */
function openInExternalBrowser(url) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noreferrer noopener";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 200);
}

export default function WavePayButton({ amount, message, label, size = "lg", disabled = false }) {
  const [copied, setCopied] = useState(false);
  const url = buildWaveLink(amount, message);
  const isLg = size === "lg";

  const handleClick = (e) => {
    e.preventDefault();
    if (disabled) return;
    openInExternalBrowser(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Bouton principal */}
      <a
        href={url}
        onClick={handleClick}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: isLg ? "14px 20px" : "9px 16px",
          background: disabled ? "#CBD5E1" : "linear-gradient(135deg,#1DC9A4,#15A882)",
          color: "#fff", fontWeight: 900,
          fontSize: isLg ? 15 : 13,
          borderRadius: isLg ? 12 : 8,
          textDecoration: "none",
          boxShadow: disabled ? "none" : "0 6px 20px rgba(29,201,164,.4)",
          boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        🌊 {label} <span style={{ fontSize: isLg ? 14 : 12 }}>↗</span>
      </a>

      {/* Fallback : copier le lien */}
      {!disabled && (
        <div style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
          padding: "10px 12px",
        }}>
          <p style={{
            margin: "0 0 6px", fontSize: 11, color: "#64748B",
            fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px",
          }}>
            📋 Si Wave ne s'ouvre pas — copiez le lien
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{
              flex: 1, margin: 0, fontSize: 10, color: "#1DC9A4",
              wordBreak: "break-all", fontFamily: "monospace", lineHeight: 1.5,
              userSelect: "all",
            }}>
              {url}
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
          <p style={{ margin: "5px 0 0", fontSize: 10, color: "#94A3B8" }}>
            Ouvrez Chrome → collez ce lien → Wave s'ouvrira automatiquement
          </p>
        </div>
      )}

    </div>
  );
}
