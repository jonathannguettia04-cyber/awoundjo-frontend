// src/pages/client/ClientCarte.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clientCardAPI, PLANS } from "../../clientApi";

const PLAN_GRADIENTS = {
  ESSENTIELLE: "linear-gradient(135deg, #1a56db 0%, #1e3a8a 100%)",
  IVOIRIENNE:  "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
  TURQUOISE:   "linear-gradient(135deg, #0891B2 0%, #164e63 100%)",
};

export default function ClientCarte() {
  const navigate = useNavigate();
  const [data,       setData]    = useState(null);
  const [loading,    setLoading] = useState(true);
  const [scanning,   setScanning]= useState(false);
  const [scanResult, setScanRes] = useState(null);
  const [visible,    setVis]     = useState(false);
  const [qrUrl,      setQrUrl]   = useState(null);
  const [qrExpanded, setQrExpanded] = useState(false); // agrandissement QR
  const videoRef  = useRef();
  const streamRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    clientCardAPI.get()
      .then(res => {
        const d = res.data.data;
        setData(d);
        const qrData = encodeURIComponent(JSON.stringify({
          id:     d.card.mutual_number,
          name:   d.card.name,
          plan:   d.card.plan,
          status: d.card.status,
          exp:    d.card.expiration_date,
        }));
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}&bgcolor=ffffff&color=1a56db&margin=10`);
        setTimeout(() => setVis(true), 100);
      })
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  }, []);

  const openCamera = async () => {
    setScanning(true); setScanRes(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch {
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setScanning(false);
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false); setScanRes(null);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    setScanRes({ valid: true, name: data?.card?.name, number: data?.card?.mutual_number, plan: data?.card?.plan, status: data?.card?.status });
    closeCamera();
  };

  if (loading) return <Skeleton />;
  if (!data)   return null;

  const { card, dependents } = data;
  const plan     = PLANS[card.plan] || PLANS.ESSENTIELLE;
  const gradient = PLAN_GRADIENTS[card.plan] || PLAN_GRADIENTS.ESSENTIELLE;
  const isActive = card.status === "active" || card.status === "actif";

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Ma Carte Mutualiste</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Présentez cette carte dans les établissements partenaires</p>

      {/* ── Carte recto ── */}
      <div style={{
        background: gradient, borderRadius: 24, padding: 22, color: "#fff",
        position: "relative", overflow: "hidden",
        boxShadow: "0 16px 48px rgba(26,86,219,.35)", marginBottom: 14,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(.97)",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: 60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 40, left: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, position: "relative" }}>
          <div style={{ width: 42, height: 42, background: "rgba(255,255,255,.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.2)" }}>A</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>AWOUNDJÔ</div>
            <div style={{ fontSize: 10, opacity: .7, letterSpacing: .5 }}>Mutuelle Santé · Côte d'Ivoire</div>
          </div>
          <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, background: isActive ? "rgba(16,185,129,.25)" : "rgba(239,68,68,.25)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "5px 12px", border: `1px solid ${isActive ? "rgba(16,185,129,.4)" : "rgba(239,68,68,.4)"}` }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#10B981" : "#EF4444", display: "inline-block", boxShadow: isActive ? "0 0 6px #10B981" : "none" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .5 }}>{isActive ? "ACTIVE" : "INACTIVE"}</span>
          </div>
        </div>

        <div style={{ marginBottom: 18, position: "relative" }}>
          <div style={{ fontSize: 10, opacity: .6, letterSpacing: 1.5, marginBottom: 4, textTransform: "uppercase" }}>Adhérent(e)</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.3 }}>{card.name}</div>
          <div style={{ fontSize: 13, opacity: .75, fontFamily: "monospace", letterSpacing: 2, marginTop: 2 }}>{card.mutual_number}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative" }}>
          <div>
            <div style={{ fontSize: 10, opacity: .6, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Formule</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{plan.name}</div>
            <div style={{ fontSize: 11, opacity: .7 }}>{plan.coverage} couverture</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, opacity: .6, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Expire le</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {card.expiration_date
                ? new Date(card.expiration_date).toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" })
                : "12/2026"}
            </div>
          </div>
        </div>
      </div>

      {/* ── QR Code — SECTION PROMINENTE ── */}
      <div style={{
        background: "#fff", borderRadius: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,.08)",
        overflow: "hidden", marginBottom: 16,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "all .5s .15s cubic-bezier(.34,1.56,.64,1)",
        border: "2px solid #E2E8F0",
      }}>
        {/* Header section QR */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#0F172A" }}>🔲 Code de vérification</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>Présentez ce QR code à l'accueil de l'établissement</p>
          </div>
          <button
            onClick={() => setQrExpanded(!qrExpanded)}
            style={{
              background: "#EEF2FF", border: "none", borderRadius: 10,
              padding: "8px 14px", fontSize: 12, fontWeight: 700,
              color: "#1B4FD8", cursor: "pointer", fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            {qrExpanded ? "Réduire ↑" : "Agrandir ↓"}
          </button>
        </div>

        {/* QR Code centré et bien visible */}
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            onClick={() => setQrExpanded(!qrExpanded)}
            style={{
              width: qrExpanded ? 260 : 160,
              height: qrExpanded ? 260 : 160,
              background: "#F8FAFC",
              borderRadius: 20,
              border: "3px solid #E2E8F0",
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "all .35s cubic-bezier(.34,1.56,.64,1)",
              boxShadow: "0 4px 16px rgba(26,86,219,.12)",
            }}
          >
            {qrUrl
              ? <img src={qrUrl} alt="QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <span style={{ fontSize: 48 }}>⬛</span>
            }
          </div>

          {/* Numéro adhérent sous le QR */}
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1a56db", fontFamily: "monospace", letterSpacing: 2 }}>
              {card.mutual_number}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748B" }}>
              Appuyez sur le QR pour agrandir
            </p>
          </div>
        </div>

        {/* Bénéficiaires */}
        {dependents?.length > 0 && (
          <div style={{ padding: "0 20px 16px", borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: .8 }}>
              Bénéficiaires couverts
            </p>
            {dependents.map((dep, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC", borderRadius: 12, padding: "10px 14px", marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{dep.type === "spouse" ? "💑" : "👶"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", flex: 1 }}>{dep.firstname} {dep.name}</span>
                <span style={{ fontSize: 11, color: "#64748B", background: "#E2E8F0", borderRadius: 6, padding: "3px 8px" }}>
                  {dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal QR agrandi ── */}
      {qrExpanded && (
        <div
          onClick={() => setQrExpanded(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.85)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 28, padding: 32, textAlign: "center", maxWidth: 360, width: "100%" }}
          >
            <p style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#0F172A" }}>🔲 QR Code Awoundjô</p>
            <div style={{ width: 280, height: 280, margin: "0 auto 16px", borderRadius: 16, overflow: "hidden", border: "3px solid #E2E8F0" }}>
              {qrUrl && <img src={qrUrl} alt="QR Code" style={{ width: "100%", height: "100%" }} />}
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#1a56db", fontFamily: "monospace", letterSpacing: 2 }}>
              {card.mutual_number}
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#64748B" }}>{card.name} · {plan.name}</p>
            <button
              onClick={() => setQrExpanded(false)}
              style={{ width: "100%", background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, opacity: visible ? 1 : 0, transition: "all .5s .25s", transform: visible ? "translateY(0)" : "translateY(10px)" }}>
        <button onClick={openCamera} style={{ flex: 1, background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", border: "none", borderRadius: 16, padding: "14px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 16px rgba(26,86,219,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          📷 Scanner
        </button>
        <button onClick={() => navigator.share?.({ title: "Ma carte Awoundjô", text: card.mutual_number })} style={{ flex: 1, background: "linear-gradient(135deg,#059669,#064e3b)", color: "#fff", border: "none", borderRadius: 16, padding: "14px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 16px rgba(5,150,105,.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          📤 Partager
        </button>
        <button onClick={() => window.print()} style={{ flex: 1, background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 16, padding: "14px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          🖨️ Imprimer
        </button>
      </div>

      {/* ── Modal Caméra ── */}
      {scanning && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
            <div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0, fontFamily: "'Poppins',sans-serif" }}>📷 Scanner un QR code</p>
              <p style={{ color: "rgba(255,255,255,.6)", fontSize: 12, margin: "2px 0 0", fontFamily: "'Poppins',sans-serif" }}>Pointez vers le QR code à vérifier</p>
            </div>
            <button onClick={closeCamera} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 0, display: "block" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: 240, height: 240, position: "relative" }}>
                {[
                  { top: 0, left: 0, borderTop: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "12px 0 0 0" },
                  { top: 0, right: 0, borderTop: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 12px 0 0" },
                  { bottom: 0, left: 0, borderBottom: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "0 0 0 12px" },
                  { bottom: 0, right: 0, borderBottom: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 0 12px 0" },
                ].map((corner, i) => (
                  <div key={i} style={{ position: "absolute", width: 30, height: 30, ...corner }} />
                ))}
                <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #1a56db, transparent)", animation: "scan 2s linear infinite", top: "50%" }} />
              </div>
            </div>
            <style>{`@keyframes scan { 0% { top: 10% } 100% { top: 90% } }`}</style>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <button onClick={captureFrame} style={{ background: "#fff", border: "4px solid rgba(255,255,255,.3)", borderRadius: "50%", width: 72, height: 72, fontSize: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.4)" }}>
              📷
            </button>
          </div>
        </div>
      )}

      {/* ── Résultat scan ── */}
      {scanResult && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.7)", backdropFilter: "blur(8px)", zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setScanRes(null)}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 380, textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 80, height: 80, background: scanResult.valid ? "#ECFDF5" : "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>
              {scanResult.valid ? "✅" : "❌"}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
              {scanResult.valid ? "Carte valide" : "Carte invalide"}
            </h3>
            {scanResult.valid && (
              <div style={{ background: "#F8FAFC", borderRadius: 14, padding: 16, marginTop: 16, textAlign: "left" }}>
                {[
                  { label: "Nom",    value: scanResult.name   },
                  { label: "N°",     value: scanResult.number },
                  { label: "Plan",   value: scanResult.plan   },
                  { label: "Statut", value: scanResult.status },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < 3 ? 10 : 0 }}>
                    <span style={{ fontSize: 12, color: "#64748B" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setScanRes(null)} style={{ width: "100%", background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", marginTop: 20 }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: 16 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[220, 180, 60].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 24, marginBottom: 14, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}
