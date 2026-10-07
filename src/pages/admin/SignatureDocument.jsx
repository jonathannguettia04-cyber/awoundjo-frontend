// pages/public/SignatureDocument.jsx
//
// Page publique (aucune authentification) ouverte par un membre du
// CA/AG via son lien unique pour signer électroniquement, à distance.
// Route attendue : /signature/:token
//
// Signature manuscrite dessinée sur un canvas (souris ou doigt sur
// mobile), convertie en PNG base64 et envoyée au serveur.

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || "Erreur serveur");
  return data;
}

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const lastPoint = useRef(null);

  // Dimensionne le canvas en tenant compte du devicePixelRatio pour un
  // tracé net sur écrans haute densité (mobiles), sans flou.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f1d33";
  }, []);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing.current = true;
    lastPoint.current = getPos(e);
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
    hasDrawn.current = true;
  }

  function end() {
    drawing.current = false;
    if (hasDrawn.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        style={{ width: "100%", height: 160, border: "2px dashed #d1d5db", borderRadius: 10, touchAction: "none", background: "#fcfcfd", cursor: "crosshair" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Dessinez votre signature ci-dessus</span>
        <button type="button" onClick={clear} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Effacer
        </button>
      </div>
    </div>
  );
}

export default function SignatureDocument() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmName, setConfirmName] = useState("");
  const [signatureImage, setSignatureImage] = useState(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/public/ag-signature/${token}`);
      const data = res?.data || res;
      setDoc(data);
      if (data.signed_at) setSigned(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSign(e) {
    e.preventDefault();
    if (!signatureImage) {
      setError("Veuillez dessiner votre signature avant de valider.");
      return;
    }
    setSigning(true);
    setError(null);
    try {
      await apiFetch(`/api/public/ag-signature/${token}`, {
        method: "POST",
        body: JSON.stringify({ confirm_name: confirmName, signature_image: signatureImage }),
      });
      setSigned(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSigning(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1d33", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0b429", letterSpacing: 0.5, marginBottom: 4 }}>
            MUTUELLE AWOUNDJÔ
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f1d33", margin: 0 }}>
            Signature électronique
          </h1>
        </div>

        {loading && (
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}>Chargement du document…</p>
        )}

        {!loading && error && !doc && (
          <p style={{ textAlign: "center", color: "#b91c1c", fontSize: 14 }}>{error}</p>
        )}

        {!loading && doc && !signed && (
          <>
            <div style={{ background: "#f9fafb", borderRadius: 10, padding: 18, marginBottom: 20, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 8px" }}>
                <strong>{doc.full_name}</strong>{doc.role ? ` — ${doc.role}` : ""}
              </p>
              <p style={{ margin: "0 0 8px" }}>
                Assemblée Générale du {new Date(doc.assembly_date).toLocaleDateString("fr-FR")} — Exercice {doc.exercice}
              </p>
              {doc.resolutions && (
                <p style={{ margin: 0 }}>
                  <strong>Résolutions :</strong> {doc.resolutions}
                </p>
              )}
            </div>

            <form onSubmit={handleSign}>
              <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 6 }}>
                Retapez votre nom complet
              </label>
              <input
                type="text"
                placeholder={doc.full_name}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                required
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, marginBottom: 18 }}
              />

              <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 6 }}>
                Votre signature
              </label>
              <SignaturePad onChange={setSignatureImage} />

              {error && <p style={{ color: "#b91c1c", fontSize: 13, margin: "14px 0 0" }}>{error}</p>}

              <button
                type="submit"
                disabled={signing}
                style={{ width: "100%", marginTop: 18, padding: "12px", borderRadius: 8, border: "none", background: "#f0b429", color: "#0f1d33", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: signing ? 0.6 : 1 }}
              >
                {signing ? "Signature en cours…" : "Valider ma signature"}
              </button>
            </form>
          </>
        )}

        {signed && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#047857", marginBottom: 6 }}>Document signé</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Merci, votre signature a bien été enregistrée.</p>
          </div>
        )}
      </div>
    </div>
  );
}
