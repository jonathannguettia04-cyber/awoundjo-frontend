// src/pages/provider/ProviderScan.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { providerClientAPI } from "../../providerApi";

const fmt     = (n) => Number(n||0).toLocaleString("fr-FR") + " FCFA";
const PLAN_COLORS = { ESSENTIELLE: "#1565C0", IVOIRIENNE: "#2E7D32", TURQUOISE: "#00838F" };
const STATUS_MAP  = {
  active:           { label: "ACTIF",             color: "#22C55E", bg: "#F0FDF4" },
  suspended:        { label: "SUSPENDU",           color: "#EF4444", bg: "#FEF2F2" },
  renewal_required: { label: "RENOUVELLEMENT REQ.", color: "#F59E0B", bg: "#FFFBEB" },
};

export default function ProviderScan() {
  const navigate = useNavigate();
  const [mode,    setMode]    = useState("scan");   // scan | search
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [client,  setClient]  = useState(null);
  const [error,   setError]   = useState("");
  const videoRef  = useRef();
  const scannerRef = useRef(null);

  // ── QR Scanner via jsQR ──────────────────────────────────────
  useEffect(() => {
    if (mode !== "scan") return;
    let stream, animId;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Charger jsQR dynamiquement
        const jsQR = (await import("jsqr")).default;
        const canvas = document.createElement("canvas");
        const ctx    = canvas.getContext("2d");

        function scan() {
          const v = videoRef.current;
          if (v && v.readyState === v.HAVE_ENOUGH_DATA) {
            canvas.width  = v.videoWidth;
            canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code?.data) {
              handleScan(code.data);
              return;
            }
          }
          animId = requestAnimationFrame(scan);
        }
        scan();
      } catch {
        setError("Caméra inaccessible — utilisez la recherche manuelle");
        setMode("search");
      }
    }

    startCamera();
    return () => {
      cancelAnimationFrame(animId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [mode]);

  async function handleScan(value) {
    if (loading) return;
    setLoading(true); setError("");
    try {
      const { data } = await providerClientAPI.scan(value);
      setClient(data.client);
      setMode("result");
    } catch {
      setError("Client introuvable pour ce QR code");
    } finally { setLoading(false); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(""); setClient(null);
    try {
      const { data } = await providerClientAPI.search(query);
      if (data.clients.length === 1) {
        const { data: d } = await providerClientAPI.scan(data.clients[0].mutual_number);
        setClient(d.client);
        setMode("result");
      } else if (data.clients.length > 1) {
        setClient({ multiple: data.clients });
        setMode("result");
      } else {
        setError("Aucun client trouvé");
      }
    } catch {
      setError("Erreur de recherche");
    } finally { setLoading(false); }
  }

  const status = client ? STATUS_MAP[client.status] || STATUS_MAP.suspended : null;
  const planColor = client ? (PLAN_COLORS[client.plan] || "#0f2942") : "#0f2942";

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 20 }}>

      {/* Mode selector */}
      <div style={{ display: "flex", background: "#E8EDF2", borderRadius: 14, padding: 4, marginBottom: 16, gap: 4 }}>
        {[{ id: "scan", label: "📷 Scanner QR" }, { id: "search", label: "🔍 Recherche" }].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setClient(null); setError(""); }}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all .2s",
              background: mode === m.id ? "#0f2942" : "transparent",
              color:      mode === m.id ? "#fff" : "#64748B",
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* QR SCAN */}
      {mode === "scan" && (
        <div style={{ background: "#0f2942", borderRadius: 20, overflow: "hidden", position: "relative", marginBottom: 14 }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", display: "block", maxHeight: 320, objectFit: "cover" }} />
          {/* Viewfinder */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: 200, height: 200, border: "3px solid #00BCD4", borderRadius: 16, boxShadow: "0 0 0 9999px rgba(0,0,0,.45)" }}>
              {/* Coins */}
              {["top-left","top-right","bottom-left","bottom-right"].map(c => (
                <div key={c} style={{
                  position: "absolute",
                  width: 20, height: 20,
                  borderColor: "#00BCD4", borderStyle: "solid", borderWidth: 0,
                  ...(c.includes("top")    ? { top: -2, borderTopWidth: 3 }    : { bottom: -2, borderBottomWidth: 3 }),
                  ...(c.includes("left")   ? { left: -2, borderLeftWidth: 3 }  : { right: -2, borderRightWidth: 3 }),
                  borderRadius: c.includes("top-left") ? "4px 0 0 0" : c.includes("top-right") ? "0 4px 0 0" : c.includes("bottom-left") ? "0 0 0 4px" : "0 0 4px 0",
                }} />
              ))}
            </div>
          </div>
          <div style={{ padding: "12px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, margin: 0 }}>
              {loading ? "⏳ Vérification…" : "Pointez la caméra sur le QR code du patient"}
            </p>
          </div>
        </div>
      )}

      {/* SEARCH */}
      {mode === "search" && (
        <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="N° mutuelle ou téléphone…"
              style={{ flex: 1, border: "1.5px solid #CBD5E1", borderRadius: 12, padding: "13px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fff" }}
            />
            <button type="submit" disabled={loading} style={{
              background: "#0f2942", color: "#fff", border: "none", borderRadius: 12,
              padding: "13px 18px", fontSize: 18, cursor: "pointer",
            }}>🔍</button>
          </div>
        </form>
      )}

      {/* RESULT — Multiple */}
      {mode === "result" && client?.multiple && (
        <div>
          <p style={{ fontWeight: 700, color: "#0f2942", marginBottom: 10 }}>Plusieurs résultats :</p>
          {client.multiple.map(c => (
            <button key={c.id} onClick={async () => {
              const { data } = await providerClientAPI.scan(c.mutual_number);
              setClient(data.client);
            }} style={{
              width: "100%", background: "#fff", border: "1.5px solid #E2E8F0",
              borderRadius: 14, padding: "14px 16px", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "inherit",
            }}>
              <div style={{ width: 40, height: 40, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#1565C0", fontSize: 16 }}>
                {c.name?.charAt(0)}
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontWeight: 700, color: "#0f2942", margin: "0 0 2px", fontSize: 14 }}>{c.name}</p>
                <p style={{ color: "#64748B", fontSize: 12, margin: 0, fontFamily: "monospace" }}>{c.mutual_number}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* RESULT — Client */}
      {mode === "result" && client && !client.multiple && (
        <div>
          {/* Client card */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,.08)", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, background: `linear-gradient(135deg,${planColor},${planColor}aa)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 800 }}>
                {client.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, color: "#0f2942", margin: "0 0 3px", fontSize: 16 }}>{client.name}</p>
                <p style={{ color: "#64748B", fontSize: 12, margin: 0, fontFamily: "monospace", letterSpacing: 1 }}>{client.mutual_number}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, background: planColor + "18", color: planColor, border: `1px solid ${planColor}40`, borderRadius: 8, padding: "3px 8px" }}>
                {client.plan}
              </span>
            </div>

            {/* Status badges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: status?.bg, borderRadius: 12, padding: "12px", textAlign: "center" }}>
                <p style={{ fontSize: 10, color: "#64748B", margin: "0 0 4px", textTransform: "uppercase", fontWeight: 600 }}>Adhésion</p>
                <p style={{ fontWeight: 800, color: status?.color, margin: 0, fontSize: 13 }}>{status?.label}</p>
              </div>
              <div style={{
                background: client.contribution_ok ? "#F0FDF4" : "#FEF2F2",
                borderRadius: 12, padding: "12px", textAlign: "center",
              }}>
                <p style={{ fontSize: 10, color: "#64748B", margin: "0 0 4px", textTransform: "uppercase", fontWeight: 600 }}>Cotisations</p>
                <p style={{ fontWeight: 800, color: client.contribution_ok ? "#22C55E" : "#EF4444", margin: 0, fontSize: 13 }}>
                  {client.contribution_ok ? "À JOUR" : `${client.late_months} MOIS EN RETARD`}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => navigate(`/etablissement/services/new?client=${client.id}`)}
              style={{ background: "linear-gradient(135deg,#00BCD4,#0097A7)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              📝 Enregistrer acte
            </button>
            <button onClick={() => navigate(`/etablissement/medical/${client.id}`)}
              style={{ background: "#0f2942", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              📋 Dossier médical
            </button>
          </div>

          <button onClick={() => { setClient(null); setMode("scan"); setQuery(""); }}
            style={{ width: "100%", marginTop: 10, background: "none", border: "1.5px solid #CBD5E1", borderRadius: 14, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#64748B", fontFamily: "inherit" }}>
            ← Nouveau scan
          </button>
        </div>
      )}
    </div>
  );
}
