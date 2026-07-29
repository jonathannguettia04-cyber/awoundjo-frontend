// src/pages/client/ClientCarte.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clientCardAPI, PLANS } from "../../clientApi";

// ── Style "carte bancaire" clair/métallique, façon Visa Santé ──────────────
const PLAN_GRADIENTS = {
  ESSENTIELLE: "linear-gradient(135deg, #EAF3FC 0%, #BFDCF5 45%, #6FA8DC 100%)",
  IVOIRIENNE:  "linear-gradient(135deg, #EAFBF3 0%, #C6EBDA 45%, #6FC79A 100%)",
  TURQUOISE:   "linear-gradient(135deg, #E7FAFC 0%, #BEE9EF 45%, #5FB9C9 100%)",
};

// Couleur de texte/lignes adaptée à un fond clair (au lieu du blanc sur fond foncé)
const PLAN_INK = {
  ESSENTIELLE: "#0F3D75",
  IVOIRIENNE:  "#0F5B3D",
  TURQUOISE:   "#0B4A54",
};

// ── QR dynamique : Carte + Nom + Mutualiste ──────────────────────────────────
const LOGO_DATA_URI = "data:image/jpeg;base64,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";

function buildQrUrl(card) {
  const content = [
    `Carte: ${card.numero_carte || card.mutual_number}`,
    `Nom: ${card.name}`,
    `Mutualiste: ${card.mutual_number}`,
    `Urgence: 0171721668`,
  ].join(" | ");
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(content)}&bgcolor=ffffff&color=1a56db&margin=10&ecc=H`;
}

// ── Formatte un numéro (carte ou mutualiste) en groupes de 4 façon carte bancaire ──
function formatCardNumber(str) {
  const clean = (str || "").toString().replace(/[\s-]+/g, "");
  const groups = clean.match(/.{1,4}/g);
  return groups ? groups.join(" ") : clean;
}


// ── QR Code avec logo centré (canvas overlay) ─────────────────────────────
function QrWithLogo({ qrUrl, size = 280 }) {
  const canvasRef = React.useRef();
  React.useEffect(() => {
    if (!qrUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, size, size);
      const logo = new Image();
      logo.onload = () => {
        const logoSize = size * 0.22;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        // White background circle behind logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(size/2, size/2, logoSize/2 + 4, 0, Math.PI*2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();
        // Draw logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(size/2, size/2, logoSize/2, 0, Math.PI*2);
        ctx.clip();
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      };
      logo.src = LOGO_DATA_URI;
    };
    qrImg.src = qrUrl;
  }, [qrUrl, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size, display:"block" }} />;
}

export default function ClientCarte() {
  const navigate = useNavigate();
  const [data,        setData]       = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [scanning,    setScanning]   = useState(false);
  const [scanResult,  setScanRes]    = useState(null);
  const [visible,     setVis]        = useState(false);
  const [qrUrl,       setQrUrl]      = useState(null);
  const [qrExpanded,  setQrExpanded] = useState(false);
  const [downloading, setDownloading]= useState(false);
  const videoRef  = useRef();
  const streamRef = useRef();
  const canvasRef = useRef();
  const carteRef  = useRef(); // pour html2canvas

  useEffect(() => {
    clientCardAPI.get()
      .then(res => {
        const d = res.data.data;
        setData(d);
        setQrUrl(buildQrUrl(d.card));
        setTimeout(() => setVis(true), 100);
      })
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  }, []);

  // ── Téléchargement PNG via html2canvas ───────────────────────────────────
  const handleDownload = async () => {
    if (!carteRef.current || !data) return;
    setDownloading(true);
    try {
      // Scroller la carte en vue AVANT capture : évite que html2canvas
      // calcule mal l'offset et rogne le bas de l'élément si la page est scrollée.
      carteRef.current.scrollIntoView({ block: "center", behavior: "instant" });
      await new Promise(r => setTimeout(r, 50));

      const html2canvas = (await import("html2canvas")).default;
      const el = carteRef.current;
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        // Fige les dimensions réelles de la carte pour ne rien couper
        width: el.offsetWidth,
        height: el.offsetHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
      });
      const link = document.createElement("a");
      link.download = `carte-mutualiste-${data.card.numero_carte || data.card.mutual_number}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      alert("Impossible de télécharger la carte. Réessayez.");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  // ── Impression format CNI ────────────────────────────────────────────────
  const [printMode, setPrintMode] = useState(null); // null | 'choose' | 'carte' | 'qr'
  const handlePrint = () => setPrintMode('choose');
  const doPrint = (mode) => {
    setPrintMode(mode);
    document.body.setAttribute('data-print-mode', mode);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintMode(null);
        document.body.removeAttribute('data-print-mode');
      }, 600);
    }, 150);
  };

  // ── Caméra ───────────────────────────────────────────────────────────────
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
  const plan      = PLANS[card.plan] || PLANS.ESSENTIELLE;
  const gradient  = PLAN_GRADIENTS[card.plan] || PLAN_GRADIENTS.ESSENTIELLE;
  const ink       = PLAN_INK[card.plan] || PLAN_INK.ESSENTIELLE;
  const isActive  = card.status === "active" || card.status === "actif";
  const numeroCarte = card.numero_carte || card.mutual_number;
  const expiryStr = card.expiration_date
    ? new Date(card.expiration_date).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" })
    : "12/26";

  return (
    <div id="carte-page-root" style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* ── CSS impression CNI 85.6mm × 54mm ────────────────────────────── */}
      <style>{`
        @keyframes scan { 0% { top: 10% } 100% { top: 90% } }

        @media print {
          body * { visibility: hidden !important; }

          /* Le reste de la page ne doit occuper AUCUNE hauteur, sinon l'imprimante
             paginé sur toute la hauteur du scroll (d'où les pages blanches en trop) */
          body[data-print-mode="carte"] #carte-page-root,
          body[data-print-mode="qr"]    #carte-page-root {
            height: 0 !important; min-height: 0 !important; max-height: 0 !important;
            overflow: hidden !important; padding: 0 !important; margin: 0 !important;
          }

          /* === MODE CARTE === */
          body[data-print-mode="carte"] #carte-physique,
          body[data-print-mode="carte"] #carte-physique * { visibility: visible !important; }
          body[data-print-mode="carte"] #carte-physique {
            position: fixed !important; left: 0 !important; top: 0 !important;
            width: 85.6mm !important; height: 54mm !important;
            border-radius: 4mm !important; box-shadow: none !important;
            margin: 0 !important; padding: 3mm !important; overflow: hidden !important;
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }

          /* === MODE QR === */
          body[data-print-mode="qr"] #qr-print-zone,
          body[data-print-mode="qr"] #qr-print-zone * { visibility: visible !important; }
          body[data-print-mode="qr"] #qr-print-zone {
            display: flex !important; position: fixed !important;
            left: 0 !important; top: 0 !important;
            width: 85.6mm !important; height: 54mm !important;
            flex-direction: column !important; align-items: center !important;
            justify-content: center !important; background: #ffffff !important;
            margin: 0 !important; padding: 2mm !important; box-sizing: border-box !important;
            gap: 3px !important;
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }

          @page { size: 85.6mm 54mm; margin: 0 !important; padding: 0 !important; }
        }
        @media screen {
          #qr-print-zone { display: none !important; }
        }
      `}</style>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Ma Carte Mutualiste</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Présentez cette carte dans les établissements partenaires</p>

      {/* ════════════════════════════════════════════════════════════════════
          CARTE PHYSIQUE  — id="carte-physique" pour l'impression
          ref={carteRef}  — pour html2canvas
          ════════════════════════════════════════════════════════════════════ */}
      <div
        id="carte-physique"
        ref={carteRef}
        style={{
          background: gradient, borderRadius: 20, padding: 24, color: ink,
          position: "relative", overflow: "hidden",
          boxShadow: "0 16px 48px rgba(15,61,117,.25)", marginBottom: 14,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(.97)",
          transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
          minHeight: 200,
        }}
      >
        {/* Fond mappemonde stylisée, bien visible façon carte bancaire (illustration originale, décorative) */}
        <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", opacity:.5 }}>
          {/* Amérique du Nord */}
          <path d="M10,10 Q46,-4 82,16 Q112,4 132,30 Q120,60 92,66 Q66,86 40,70 Q4,56 10,10 Z" fill={ink} fillOpacity=".14" />
          {/* Amérique du Sud */}
          <path d="M64,116 Q92,104 104,140 Q112,178 90,214 Q72,226 60,200 Q46,162 64,116 Z" fill={ink} fillOpacity=".14" />
          {/* Europe */}
          <path d="M188,12 Q214,-2 240,10 Q248,30 228,42 Q208,50 196,38 Q182,26 188,12 Z" fill={ink} fillOpacity=".14" />
          {/* Afrique */}
          <path d="M196,58 Q236,50 254,84 Q266,122 253,162 Q241,198 214,210 Q188,198 181,162 Q168,122 176,84 Q182,66 196,58 Z"
            fill={ink} fillOpacity=".22" />
          {/* Asie */}
          <path d="M256,20 Q314,6 362,32 Q388,58 368,88 Q336,101 298,82 Q266,68 256,44 Q250,32 256,20 Z" fill={ink} fillOpacity=".14" />
          {/* Océanie */}
          <path d="M330,168 Q362,160 375,186 Q369,206 344,206 Q325,194 330,168 Z" fill={ink} fillOpacity=".14" />
        </svg>
        <div style={{ position:"absolute", top:-70, right:-70, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,.35)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-80, left:-50, width:240, height:240, borderRadius:"50%", background:"rgba(255,255,255,.2)", pointerEvents:"none" }} />

        {/* ── Ligne 1 : puce (gauche) + marque "AWOUNDJÔ SANTÉ" (droite, façon VISA) ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, position:"relative" }}>
          {/* Puce dorée */}
          <div style={{ width:44, height:34, borderRadius:6, background:"linear-gradient(135deg,#F5D889,#C9A24B)", position:"relative", boxShadow:"inset 0 0 0 1px rgba(0,0,0,.15)" }}>
            <div style={{ position:"absolute", inset:5, border:"1px solid rgba(0,0,0,.25)", borderRadius:3 }} />
            <div style={{ position:"absolute", top:"50%", left:5, right:5, height:1, background:"rgba(0,0,0,.25)" }} />
            <div style={{ position:"absolute", left:"50%", top:5, bottom:5, width:1, background:"rgba(0,0,0,.25)" }} />
          </div>

          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:15, fontWeight:900, letterSpacing:.3 }}>
              AWOUNDJÔ <span style={{ background: ink, color:"#fff", borderRadius:5, padding:"2px 7px", marginLeft:4 }}>SANTÉ</span>
            </div>
            <div style={{ fontSize:9, fontWeight:700, opacity:.7, letterSpacing:.5, textTransform:"uppercase", marginTop:3 }}>
              {plan.name} · {plan.coverage} couverture
            </div>
          </div>
        </div>

        {/* ── Numéro façon carte bancaire, groupé par 4 ── */}
        <div style={{
          fontSize:22, fontWeight:700, fontFamily:"monospace", letterSpacing:3,
          marginBottom:20, position:"relative",
        }}>
          {formatCardNumber(numeroCarte)}
        </div>

        {/* ── Titulaire + expiration ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, position:"relative" }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:9, opacity:.6, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>Titulaire</div>
            <div style={{ fontSize:16, fontWeight:800, letterSpacing:.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {card.name?.toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
            <div style={{ fontSize:9, opacity:.6, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>Expire fin</div>
            <div style={{ fontSize:16, fontWeight:800 }}>{expiryStr}</div>
          </div>
        </div>

        {/* ── Bas de carte : logo + marque | anneaux entrelacés + statut ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, background: ink, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:"#fff" }}>A</div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:.6, lineHeight:1.25 }}>
              MUTUELLE SANTÉ<br />AWOUNDJÔ
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background: isActive ? "rgba(16,129,89,.18)" : "rgba(180,40,40,.18)", borderRadius:20, padding:"4px 12px", border:`1px solid ${isActive ? "rgba(16,129,89,.35)" : "rgba(180,40,40,.35)"}` }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background: isActive ? "#0E9F6E" : "#C0392B", display:"inline-block" }} />
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:.5 }}>{isActive ? "ACTIVE" : "INACTIVE"}</span>
            </div>
            {/* Anneaux entrelacés décoratifs, façon réseau bancaire */}
            <div style={{ position:"relative", width:44, height:26, flexShrink:0 }}>
              <div style={{ position:"absolute", left:0, top:0, width:26, height:26, borderRadius:"50%", background:"rgba(255,255,255,.55)", border:`1.5px solid ${ink}55` }} />
              <div style={{ position:"absolute", right:0, top:0, width:26, height:26, borderRadius:"50%", background:"rgba(255,255,255,.35)", border:`1.5px solid ${ink}55` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          BOUTONS TÉLÉCHARGER / IMPRIMER  — uniquement si statut actif
          ════════════════════════════════════════════════════════════════════ */}
      {isActive ? (
        <div style={{ display:"flex", gap:10, marginBottom:14, opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(10px)", transition:"all .5s .1s" }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              flex:1, background:"linear-gradient(135deg,#7C3AED,#5B21B6)",
              color:"#fff", border:"none", borderRadius:16,
              padding:"14px 10px", fontSize:13, fontWeight:700,
              cursor: downloading ? "not-allowed" : "pointer",
              fontFamily:"'Poppins',sans-serif",
              boxShadow:"0 4px 16px rgba(124,58,237,.35)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              opacity: downloading ? .7 : 1, transition:"opacity .2s",
            }}
          >
            {downloading ? "⏳ Export..." : "⬇️ Télécharger"}
          </button>
          <button
            onClick={handlePrint}
            style={{
              flex:1, background:"linear-gradient(135deg,#0891B2,#164e63)",
              color:"#fff", border:"none", borderRadius:16,
              padding:"14px 10px", fontSize:13, fontWeight:700,
              cursor:"pointer", fontFamily:"'Poppins',sans-serif",
              boxShadow:"0 4px 16px rgba(8,145,178,.3)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            }}
          >
            🖨️ Imprimer
          </button>
        </div>
      ) : (
        /* ── Message carte inactive ─────────────────────────────────── */
        <div style={{ background:"linear-gradient(135deg,#FEF2F2,#FFF1F2)", border:"1px solid #FECACA", borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <span style={{ fontSize:24 }}>🔒</span>
          <div>
            <p style={{ fontWeight:700, color:"#991B1B", margin:"0 0 2px", fontSize:13 }}>Carte désactivée</p>
            <p style={{ color:"#B91C1C", margin:0, fontSize:12 }}>Renouvelez votre adhésion pour accéder à votre carte et aux téléchargements.</p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTION QR étendu — uniquement si actif
          ════════════════════════════════════════════════════════════════════ */}
      {isActive && (
        <div style={{
          background:"#fff", borderRadius:24,
          boxShadow:"0 4px 20px rgba(0,0,0,.08)",
          overflow:"hidden", marginBottom:16,
          opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(10px)",
          transition:"all .5s .15s cubic-bezier(.34,1.56,.64,1)",
          border:"2px solid #E2E8F0",
        }}>
          <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ margin:0, fontWeight:800, fontSize:15, color:"#0F172A" }}>🔲 Code de vérification</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748B" }}>Présentez ce QR code à l'accueil de l'établissement</p>
            </div>
            <button onClick={() => setQrExpanded(!qrExpanded)} style={{ background:"#EEF2FF", border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, color:"#1B4FD8", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
              {qrExpanded ? "Réduire ↑" : "Agrandir ↓"}
            </button>
          </div>

          <div style={{ padding:"24px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
            <div onClick={() => setQrExpanded(!qrExpanded)} style={{ width: qrExpanded?260:160, height: qrExpanded?260:160, background:"#F8FAFC", borderRadius:20, border:"3px solid #E2E8F0", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .35s cubic-bezier(.34,1.56,.64,1)", boxShadow:"0 4px 16px rgba(26,86,219,.12)" }}>
              {qrUrl
                ? <img src={qrUrl} alt="QR Code" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                : <span style={{ fontSize:48 }}>⬛</span>
              }
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:800, color:"#1a56db", fontFamily:"monospace", letterSpacing:1 }}>{numeroCarte}</p>
              <p style={{ margin:"2px 0 0", fontSize:11, color:"#94A3B8" }}>{card.name}</p>
              <p style={{ margin:"4px 0 0", fontSize:11, color:"#64748B" }}>Appuyez sur le QR pour agrandir</p>
            </div>
          </div>

          {dependents?.length > 0 && (
            <div style={{ padding:"0 20px 16px", borderTop:"1px solid #F1F5F9", paddingTop:14 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#64748B", margin:"0 0 10px", textTransform:"uppercase", letterSpacing:.8 }}>Bénéficiaires couverts</p>
              {dependents.map((dep, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"#F8FAFC", borderRadius:12, padding:"10px 14px", marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>{dep.type === "spouse" ? "💑" : "👶"}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#0F172A", flex:1 }}>{dep.firstname} {dep.name}</span>
                  <span style={{ fontSize:11, color:"#64748B", background:"#E2E8F0", borderRadius:6, padding:"3px 8px" }}>{dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal QR agrandi ─────────────────────────────────────────────── */}
      {qrExpanded && (
        <div onClick={() => setQrExpanded(false)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.85)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:28, padding:32, textAlign:"center", maxWidth:360, width:"100%" }}>
            <p style={{ margin:"0 0 16px", fontSize:16, fontWeight:800, color:"#0F172A" }}>🔲 QR Code Awoundjô</p>
            <div style={{ width:280, height:280, margin:"0 auto 16px", borderRadius:16, overflow:"hidden", border:"3px solid #E2E8F0" }}>
              {qrUrl && <img src={qrUrl} alt="QR Code" style={{ width:"100%", height:"100%" }} />}
            </div>
            <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:800, color:"#1a56db", fontFamily:"monospace", letterSpacing:1 }}>{numeroCarte}</p>
            <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:700, color:"#0F172A" }}>{card.name}</p>
            <p style={{ margin:"0 0 20px", fontSize:12, color:"#64748B" }}>{card.mutual_number} · {plan.name}</p>
            <button onClick={() => setQrExpanded(false)} style={{ width:"100%", background:"linear-gradient(135deg,#1a56db,#1e40af)", color:"#fff", border:"none", borderRadius:14, padding:14, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif" }}>Fermer</button>
          </div>
        </div>
      )}

      {/* ── Actions scanner / partager ───────────────────────────────────── */}
      <div style={{ display:"flex", gap:12, marginBottom:16, opacity: visible?1:0, transition:"all .5s .25s", transform: visible?"translateY(0)":"translateY(10px)" }}>
        <button onClick={openCamera} style={{ flex:1, background:"linear-gradient(135deg,#1a56db,#1e40af)", color:"#fff", border:"none", borderRadius:16, padding:"14px 10px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", boxShadow:"0 4px 16px rgba(26,86,219,.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          📷 Scanner
        </button>
        <button onClick={() => navigator.share?.({ title:"Ma carte Awoundjô", text:`${card.name} — ${numeroCarte}` })} style={{ flex:1, background:"linear-gradient(135deg,#059669,#064e3b)", color:"#fff", border:"none", borderRadius:16, padding:"14px 10px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", boxShadow:"0 4px 16px rgba(5,150,105,.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          📤 Partager
        </button>
      </div>

      {/* ── Modal Caméra ─────────────────────────────────────────────────── */}
      {scanning && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.95)", zIndex:300, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, padding:"20px 20px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:10 }}>
            <div>
              <p style={{ color:"#fff", fontWeight:700, fontSize:16, margin:0, fontFamily:"'Poppins',sans-serif" }}>📷 Scanner un QR code</p>
              <p style={{ color:"rgba(255,255,255,.6)", fontSize:12, margin:"2px 0 0", fontFamily:"'Poppins',sans-serif" }}>Pointez vers le QR code à vérifier</p>
            </div>
            <button onClick={closeCamera} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:"50%", width:40, height:40, color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
          <div style={{ position:"relative", width:"100%", maxWidth:400 }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width:"100%", borderRadius:0, display:"block" }} />
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
              <div style={{ width:240, height:240, position:"relative" }}>
                {[
                  { top:0, left:0, borderTop:"3px solid #fff", borderLeft:"3px solid #fff", borderRadius:"12px 0 0 0" },
                  { top:0, right:0, borderTop:"3px solid #fff", borderRight:"3px solid #fff", borderRadius:"0 12px 0 0" },
                  { bottom:0, left:0, borderBottom:"3px solid #fff", borderLeft:"3px solid #fff", borderRadius:"0 0 0 12px" },
                  { bottom:0, right:0, borderBottom:"3px solid #fff", borderRight:"3px solid #fff", borderRadius:"0 0 12px 0" },
                ].map((corner, i) => (
                  <div key={i} style={{ position:"absolute", width:30, height:30, ...corner }} />
                ))}
                <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, #1a56db, transparent)", animation:"scan 2s linear infinite", top:"50%" }} />
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display:"none" }} />
          <div style={{ position:"absolute", bottom:60, left:0, right:0, display:"flex", justifyContent:"center" }}>
            <button onClick={captureFrame} style={{ background:"#fff", border:"4px solid rgba(255,255,255,.3)", borderRadius:"50%", width:72, height:72, fontSize:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>📷</button>
          </div>
        </div>
      )}

      {/* ── Résultat scan ────────────────────────────────────────────────── */}
      {scanResult && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.7)", backdropFilter:"blur(8px)", zIndex:250, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={() => setScanRes(null)}>
          <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:380, textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width:80, height:80, background: scanResult.valid ? "#ECFDF5" : "#FEF2F2", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:36 }}>
              {scanResult.valid ? "✅" : "❌"}
            </div>
            <h3 style={{ fontSize:20, fontWeight:800, color:"#0F172A", margin:"0 0 6px" }}>{scanResult.valid ? "Carte valide" : "Carte invalide"}</h3>
            {scanResult.valid && (
              <div style={{ background:"#F8FAFC", borderRadius:14, padding:16, marginTop:16, textAlign:"left" }}>
                {[
                  { label:"Nom",    value: scanResult.name   },
                  { label:"N°",     value: scanResult.number },
                  { label:"Plan",   value: scanResult.plan   },
                  { label:"Statut", value: scanResult.status },
                ].map((r, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom: i<3 ? 10 : 0 }}>
                    <span style={{ fontSize:12, color:"#64748B" }}>{r.label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setScanRes(null)} style={{ width:"100%", background:"linear-gradient(135deg,#1a56db,#1e40af)", color:"#fff", border:"none", borderRadius:14, padding:14, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", marginTop:20 }}>Fermer</button>
          </div>
        </div>
      )}

      {/* ── Zone QR imprimable (cachée à l'écran, visible à l'impression en mode QR) ── */}
      <div id="qr-print-zone">
        <div style={{ position:"relative" }}>
          <QrWithLogo qrUrl={qrUrl} size={200} />
        </div>
        <p style={{ margin:"4px 0 0", fontSize:9, fontWeight:700, color:"#1a56db", fontFamily:"monospace", letterSpacing:1, textAlign:"center" }}>{numeroCarte} · {card.name}</p>
        <p style={{ margin:"3px 0 0", fontSize:7.5, color:"#475569", textAlign:"center", fontFamily:"'Poppins',sans-serif", fontWeight:600, lineHeight:1.3 }}>
          En cas de perte/urgence, veuillez contacter : 0171721668
        </p>
      </div>

      {/* ── Modal choix d'impression ──────────────────────────────────────── */}
      {printMode === 'choose' && (
        <div onClick={() => setPrintMode(null)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.8)", backdropFilter:"blur(8px)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:28, padding:28, textAlign:"center", maxWidth:340, width:"100%" }}>
            <p style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, color:"#0F172A" }}>🖨️ Que voulez-vous imprimer ?</p>
            <p style={{ margin:"0 0 20px", fontSize:13, color:"#64748B" }}>Choisissez le format d'impression</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <button onClick={() => doPrint('carte')} style={{ background:"linear-gradient(135deg,#1a56db,#1e40af)", color:"#fff", border:"none", borderRadius:16, padding:"16px 20px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
                <span style={{ fontSize:28 }}>💳</span>
                <div>
                  <div>Carte PVC (85.6×54mm)</div>
                  <div style={{ fontSize:11, opacity:.8, fontWeight:500 }}>Format carte d'identité, compatible Epson L8050</div>
                </div>
              </button>
              <button onClick={() => doPrint('qr')} style={{ background:"linear-gradient(135deg,#059669,#064e3b)", color:"#fff", border:"none", borderRadius:16, padding:"16px 20px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
                <span style={{ fontSize:28 }}>🔲</span>
                <div>
                  <div>QR Code seul (85.6×54mm)</div>
                  <div style={{ fontSize:11, opacity:.8, fontWeight:500 }}>Avec logo Awoundjô et contact d'urgence</div>
                </div>
              </button>
            </div>
            <button onClick={() => setPrintMode(null)} style={{ marginTop:16, width:"100%", background:"#F1F5F9", color:"#64748B", border:"none", borderRadius:12, padding:12, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Poppins',sans-serif" }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding:16 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[220, 60, 180, 60].map((h, i) => (
        <div key={i} style={{ height:h, borderRadius:24, marginBottom:14, background:"linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}
