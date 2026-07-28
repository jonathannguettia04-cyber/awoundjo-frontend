// src/pages/client/ClientFamille.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clientDepsAPI } from "../../clientApi";
import { uploadFile } from "../../supabaseClient";

const EMPTY_SPOUSE = { type: "spouse", name: "", firstname: "", birth_date: "", birth_place: "", identity_document: "", photo: null, piece: null };
const EMPTY_CHILD  = { type: "child",  name: "", firstname: "", birth_date: "", birth_place: "", identity_document: "", photo: null, piece: null };

// Surprime mensuelle par formule (appliquée après validation admin)
const SURPRIME_ENFANT = { ESSENTIELLE: 2000, IVOIRIENNE: 3000, TURQUOISE: 5000 };

const DEP_GRADIENTS = {
  spouse: "linear-gradient(135deg, #DB2777 0%, #9D174D 100%)",
  child:  "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
};

// Génère le numéro de carte ayant droit
function buildDepNumber(mutualNumber, type, index) {
  if (!mutualNumber) return "";
  const suffix = type === "spouse" ? "-C1" : `-E${index}`;
  return `${mutualNumber}${suffix}`;
}

// Construit le contenu du QR
function buildQrContent(dep, depNumber) {
  return [
    `Carte: ${depNumber}`,
    `Nom: ${dep.firstname} ${dep.name}`,
    `Type: ${dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}`,
  ].join(" | ");
}

export default function ClientFamille() {
  const navigate = useNavigate();
  const [deps, setDeps]         = useState([]);
  const [titular, setTitular]   = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY_SPOUSE);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const [photoFile, setPhotoFile]     = useState(null);
  const [pieceFile, setPieceFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pieceReady, setPieceReady]   = useState(false);
  const [uploading, setUploading]     = useState(false);

  const photoRef = useRef();
  const pieceRef = useRef();

  const load = () => {
    clientDepsAPI.get()
      .then(res => {
        setDeps(res.data.data);
        setTitular(res.data.titular || null);
        setPendingRequests(res.data.pendingRequests || []);
      })
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const spouse   = deps.filter(d => d.type === "spouse");
  const children = deps.filter(d => d.type === "child");

  const baseCap        = 3;
  const effectiveMax   = baseCap + (titular?.extra_children_approved || 0);
  const canAddDirectly = children.length < effectiveMax;
  const surprimeAmount = SURPRIME_ENFANT[titular?.plan] || 2000;

  const openModal = (type) => {
    setForm(type === "spouse" ? { ...EMPTY_SPOUSE } : { ...EMPTY_CHILD });
    setPhotoFile(null); setPieceFile(null);
    setPhotoPreview(null); setPieceReady(false);
    setError(""); setModal(type); // type: "spouse" | "child" | "child_request"
  };

  const handlePhotoChange = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePieceChange = (file) => {
    if (!file) return;
    setPieceFile(file); setPieceReady(true);
  };

  const handleAdd = async () => {
    if (!form.name || !form.firstname) return setError("Nom et prénom requis");
    setError(""); setSaving(true); setUploading(true);
    const isExtraRequest = modal === "child_request";
    try {
      const [photoUrl, pieceUrl] = await Promise.all([
        photoFile ? uploadFile(photoFile, "photos") : Promise.resolve(null),
        pieceFile ? uploadFile(pieceFile, "pieces") : Promise.resolve(null),
      ]);
      setUploading(false);
      if (photoFile && !photoUrl) return setError("Échec de l'upload de la photo. Réessayez.");
      if (pieceFile && !pieceUrl) return setError("Échec de l'upload du document. Réessayez.");

      const payload = {
        type: form.type, name: form.name, firstname: form.firstname,
        birth_date: form.birth_date, birth_place: form.birth_place,
        identity_document: form.identity_document,
        photo: photoUrl, piece: pieceUrl,
      };

      if (isExtraRequest) {
        await clientDepsAPI.requestExtraChild(payload);
        setSuccess("Demande envoyée à l'admin. Surprime appliquée après validation.");
      } else {
        // Le backend doit re-vérifier le cap (3 + extra_children_approved) côté serveur,
        // même si canAddDirectly a déjà filtré côté client.
        await clientDepsAPI.add(payload);
        setSuccess(`${form.type === "spouse" ? "Conjoint(e)" : "Enfant"} ajouté(e) !`);
      }

      setModal(null); load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.error || err.message || "Erreur lors de l'enregistrement");
    } finally { setSaving(false); }
  };


  if (loading) return <Skeleton />;

  const isBusy = saving || uploading;

  return (
    <div id="famille-page-root" style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* CSS impression */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }

          /* Le reste de la page ne doit occuper AUCUNE hauteur, sinon l'imprimante
             paginé sur toute la hauteur du scroll (pages blanches en trop) */
          body #famille-page-root {
            height: 0 !important; min-height: 0 !important; max-height: 0 !important;
            overflow: hidden !important; padding: 0 !important; margin: 0 !important;
          }

          .dep-carte-print, .dep-carte-print * { visibility: visible !important; }
          .dep-carte-print {
            position: fixed !important; left: 0 !important; top: 0 !important;
            width: 85.6mm !important; height: 54mm !important;
            border-radius: 4mm !important; box-shadow: none !important;
            margin: 0 !important; padding: 4mm !important; overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: 85.6mm 54mm; margin: 0; }
        }
      `}</style>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Ma Famille</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Gérez les bénéficiaires couverts par votre mutuelle</p>

      {success && (
        <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "1px solid #6EE7B7", borderRadius: 14, padding: "14px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          ✅ {success}
        </div>
      )}

      {/* Compteurs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { icon: "👤", label: "Souscripteur", count: 1,              max: 1, color: "#1D4ED8", bg: "#EFF6FF" },
          { icon: "💑", label: "Conjoint(e)",  count: spouse.length,  max: 1, color: "#DB2777", bg: "#FDF2F8" },
          { icon: "👶", label: "Enfants",      count: children.length, max: 3, color: "#059669", bg: "#ECFDF5" },
        ].map((item, i) => (
          <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: `1.5px solid ${item.bg}` }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.count}/{item.max}</span>
            <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textAlign: "center" }}>{item.label}</span>
            <div style={{ width: "100%", height: 4, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(item.count / item.max) * 100}%`, background: item.color, borderRadius: 2, transition: "width .4s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Section Conjoint ── */}
      <SectionHeader title="Conjoint(e)" icon="💑" color="#DB2777"
        canAdd={spouse.length < 1} onAdd={() => openModal("spouse")} />
      {spouse.length === 0
        ? <EmptyCard icon="💑" text="Aucun conjoint enregistré" color="#DB2777" onAdd={() => openModal("spouse")} />
        : spouse.map(d => (
            <DepCard key={d.id} dep={d}
              depNumber={buildDepNumber(titular?.mutual_number, "spouse", 1)}
              titular={titular} />
          ))}

      {/* ── Section Enfants ── */}
      <SectionHeader title={`Enfants (${children.length}/${effectiveMax})`} icon="👶" color="#059669"
        canAdd={true}
        onAdd={() => openModal(canAddDirectly ? "child" : "child_request")} />
      {children.length === 0
        ? <EmptyCard icon="👶" text="Aucun enfant enregistré" color="#059669" onAdd={() => openModal("child")} />
        : children.map((d, i) => (
            <DepCard key={d.id} dep={d}
              depNumber={buildDepNumber(titular?.mutual_number, "child", i + 1)}
              titular={titular} />
          ))}

      {!canAddDirectly && (
        <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 2px 0" }}>
          Cap atteint · un enfant de plus = +{surprimeAmount} FCFA/mois (soumis à validation)
        </p>
      )}

      {/* ── Demandes en attente ── */}
      {pendingRequests.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {pendingRequests.map(r => (
            <div key={r.id} style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#92400E" }}>{r.firstname} {r.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#B45309" }}>En attente de validation admin</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ajout ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={() => !isBusy && setModal(null)}>
          <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                  {modal === "spouse" ? "💑 Ajouter conjoint(e)" : modal === "child_request" ? "👶 Demande enfant supplémentaire" : "👶 Ajouter un enfant"}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>
                  {modal === "spouse" ? "1 conjoint maximum" : modal === "child_request" ? "Soumis à validation admin" : `${children.length}/${effectiveMax} enfants`}
                </p>
              </div>
              <button onClick={() => !isBusy && setModal(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {modal === "child_request" && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", color: "#92400E", fontSize: 13, marginBottom: 16 }}>
                💰 Surprime de <strong>+{surprimeAmount} FCFA/mois</strong> appliquée dès validation par l'admin.
              </div>
            )}

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Photo */}
            <div style={{ marginBottom: 20 }}>
              <label style={ls.label}>📸 Photo d'identité</label>
              <div onClick={() => photoRef.current?.click()} style={{ border: "2px dashed #CBD5E1", borderRadius: 14, padding: "16px", textAlign: "center", cursor: "pointer", background: photoPreview ? "#F0FDF4" : "#F8FAFC", transition: "all .2s" }}>
                {photoPreview
                  ? <img src={photoPreview} alt="photo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", margin: "0 auto" }} />
                  : <div><span style={{ fontSize: 32 }}>📷</span><p style={{ color: "#94A3B8", fontSize: 12, margin: "8px 0 0" }}>Cliquez pour importer</p></div>}
              </div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handlePhotoChange(e.target.files[0])} />
            </div>

            {/* Champs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Field label="Nom *" placeholder="Nom de famille" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="Prénom *" placeholder="Prénom" value={form.firstname} onChange={v => setForm(f => ({ ...f, firstname: v }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Field label="Date de naissance" type="date" value={form.birth_date} onChange={v => setForm(f => ({ ...f, birth_date: v }))} />
              <Field label="Lieu de naissance" placeholder="Ville" value={form.birth_place} onChange={v => setForm(f => ({ ...f, birth_place: v }))} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <Field
                label={modal === "spouse" ? "N° CNI / Passeport" : "N° Extrait de naissance"}
                placeholder="Numéro du document"
                value={form.identity_document}
                onChange={v => setForm(f => ({ ...f, identity_document: v }))} />
            </div>

            {/* Pièce */}
            <div style={{ marginBottom: 24 }}>
              <label style={ls.label}>{modal === "spouse" ? "📄 CNI / Passeport (scan)" : "📄 Extrait de naissance (scan)"}</label>
              <div onClick={() => pieceRef.current?.click()} style={{ border: "2px dashed #CBD5E1", borderRadius: 14, padding: "14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: pieceReady ? "#EFF6FF" : "#F8FAFC" }}>
                <span style={{ fontSize: 28 }}>{pieceReady ? "✅" : "📎"}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: pieceReady ? "#1D4ED8" : "#475569" }}>{pieceReady ? "Document prêt ✓" : "Importer le document"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94A3B8" }}>JPG, PNG ou PDF</p>
                </div>
              </div>
              <input ref={pieceRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
                onChange={e => handlePieceChange(e.target.files[0])} />
            </div>

            <button onClick={handleAdd} disabled={isBusy} style={{ width: "100%", background: isBusy ? "#94A3B8" : modal === "spouse" ? "linear-gradient(135deg,#DB2777,#9D174D)" : modal === "child_request" ? "linear-gradient(135deg,#D97706,#92400E)" : "linear-gradient(135deg,#059669,#065F46)", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 700, cursor: isBusy ? "not-allowed" : "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,.2)", transition: "background .2s" }}>
              {uploading ? "⬆️ Upload en cours..." : saving ? "⏳ Envoi..." : modal === "spouse" ? "✅ Enregistrer le conjoint" : modal === "child_request" ? `📨 Envoyer la demande (+${surprimeAmount} FCFA/mois)` : "✅ Enregistrer l'enfant"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Carte ayant droit ─────────────────────────────────────────────
function DepCard({ dep, depNumber, titular }) {
  const [expanded, setExpanded]     = useState(false);
  const [showCarte, setShowCarte]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const carteRef = useRef();

  const gradient = DEP_GRADIENTS[dep.type] || DEP_GRADIENTS.child;
  const expiry   = titular?.expiration_date
    ? new Date(titular.expiration_date).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" })
    : "12/26";

  const qrUrl = depNumber
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildQrContent(dep, depNumber))}&bgcolor=ffffff&color=1a56db&margin=8`
    : null;

  const handleDownload = async () => {
    if (!carteRef.current) return;
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
        width: el.offsetWidth,
        height: el.offsetHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
      });
      const link = document.createElement("a");
      link.download = `carte-${depNumber || dep.firstname}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Impossible de télécharger. Réessayez."); }
    finally { setDownloading(false); }
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden" }}>

      {/* Ligne résumé */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div style={{ width: 50, height: 50, background: dep.type === "spouse" ? "#FDF2F8" : "#ECFDF5", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, overflow: "hidden" }}>
          {dep.photo
            ? <img src={dep.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (dep.type === "spouse" ? "💑" : "👶")}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 2px" }}>{dep.firstname} {dep.name}</p>
          <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
            {dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}
            {dep.birth_date ? ` · Né(e) le ${new Date(dep.birth_date).toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 16, color: "#94A3B8", transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
        </div>
      </div>

      {/* Détails + carte */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "14px 16px", background: "#FAFAFA" }}>
          {dep.birth_place && <InfoRow label="Lieu de naissance" value={dep.birth_place} />}
          {dep.identity_document && <InfoRow label={dep.type === "spouse" ? "N° CNI/Passeport" : "N° Extrait"} value={dep.identity_document} />}
          {dep.piece && (
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <a href={dep.piece} target="_blank" rel="noreferrer" style={{ color: "#1D4ED8", fontSize: 13, fontWeight: 600 }}>📄 Voir le document</a>
            </div>
          )}

          {/* Bouton afficher carte */}
          <button
            onClick={() => setShowCarte(!showCarte)}
            style={{ width: "100%", background: showCarte ? "#F1F5F9" : gradient, color: showCarte ? "#475569" : "#fff", border: "none", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s" }}>
            💳 {showCarte ? "Masquer la carte" : "Voir la carte mutualiste"}
          </button>

          {/* ── Carte ayant droit ── */}
          {showCarte && (
            <div style={{ marginTop: 16 }}>

              {/* Carte physique */}
              <div
                ref={carteRef}
                className="dep-carte-print"
                style={{ background: gradient, borderRadius: 20, padding: 20, color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 12px 36px rgba(0,0,0,.25)", marginBottom: 12 }}>

                {/* Fond mappemonde stylisée — Afrique mise en évidence */}
                <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice"
                  style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
                  <defs>
                    <radialGradient id={`africaGlow-${dep.id || depNumber}`} cx="50%" cy="45%" r="65%">
                      <stop offset="0%" stopColor="rgba(255,255,255,.35)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                  </defs>
                  <path d="M18,18 Q42,8 68,22 Q92,12 108,32 Q98,54 78,58 Q58,74 38,62 Q14,52 18,18 Z" fill="rgba(255,255,255,.09)" />
                  <path d="M68,108 Q90,98 100,128 Q106,160 88,192 Q73,202 63,180 Q52,148 68,108 Z" fill="rgba(255,255,255,.09)" />
                  <path d="M182,18 Q202,8 222,18 Q228,34 212,44 Q196,50 186,40 Q176,30 182,18 Z" fill="rgba(255,255,255,.09)" />
                  <circle cx="208" cy="120" r="90" fill={`url(#africaGlow-${dep.id || depNumber})`} />
                  <path d="M188,58 Q222,52 238,80 Q248,112 237,146 Q227,178 206,188 Q184,178 178,146 Q168,112 174,80 Q179,64 188,58 Z"
                    fill="rgba(255,255,255,.38)" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" />
                  <path d="M244,24 Q292,13 332,34 Q353,55 337,80 Q311,91 280,76 Q254,65 244,45 Q239,34 244,24 Z" fill="rgba(255,255,255,.09)" />
                  <path d="M318,158 Q345,152 356,174 Q351,190 330,190 Q314,180 318,158 Z" fill="rgba(255,255,255,.09)" />
                </svg>
                {/* Cercles décoratifs */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -30, left: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />

                {/* ── Ligne 1 : puce + badge type ── */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18, position:"relative" }}>
                  <div style={{ width:38, height:29, borderRadius:6, background:"linear-gradient(135deg,#F5D889,#C9A24B)", position:"relative", boxShadow:"inset 0 0 0 1px rgba(0,0,0,.15)" }}>
                    <div style={{ position:"absolute", inset:4, border:"1px solid rgba(0,0,0,.25)", borderRadius:3 }} />
                    <div style={{ position:"absolute", top:"50%", left:4, right:4, height:1, background:"rgba(0,0,0,.25)" }} />
                    <div style={{ position:"absolute", left:"50%", top:4, bottom:4, width:1, background:"rgba(0,0,0,.25)" }} />
                  </div>
                  <div style={{ background:"rgba(255,255,255,.18)", backdropFilter:"blur(8px)", borderRadius:8, padding:"4px 10px", border:"1px solid rgba(255,255,255,.25)" }}>
                    <div style={{ fontSize:10, fontWeight:800, letterSpacing:.5 }}>{dep.type === "spouse" ? "CONJOINT(E)" : "ENFANT"}</div>
                  </div>
                </div>

                {/* ── Numéro façon carte bancaire ── */}
                <div style={{ fontSize:15, fontWeight:700, fontFamily:"monospace", letterSpacing:1.5, marginBottom:16, position:"relative", textShadow:"0 1px 2px rgba(0,0,0,.15)" }}>
                  {depNumber}
                </div>

                {/* ── Titulaire (ayant droit) + expiration ── */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16, position:"relative" }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:9, opacity:.65, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>Ayant droit</div>
                    <div style={{ fontSize:15, fontWeight:800, letterSpacing:.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {dep.firstname} {dep.name}
                    </div>
                    {dep.birth_date && (
                      <div style={{ fontSize:10, opacity:.75, marginTop:3 }}>Né(e) le {new Date(dep.birth_date).toLocaleDateString("fr-FR")}</div>
                    )}
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                    <div style={{ fontSize:9, opacity:.65, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>Expire fin</div>
                    <div style={{ fontSize:14, fontWeight:800 }}>{expiry}</div>
                  </div>
                </div>

                {/* ── Bas de carte : photo + logo/marque | QR ── */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:8, overflow:"hidden", border:"1px solid rgba(255,255,255,.35)", flexShrink:0, background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                      {dep.photo
                        ? <img src={dep.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} crossOrigin="anonymous" />
                        : (dep.type === "spouse" ? "💑" : "👶")}
                    </div>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:.5, lineHeight:1.25 }}>
                      MUTUELLE SANTÉ<br />AWOUNDJÔ
                    </div>
                  </div>
                  {qrUrl && (
                    <div style={{ width:44, height:44, background:"#fff", borderRadius:8, overflow:"hidden", border:"2px solid rgba(255,255,255,.3)", flexShrink:0 }}>
                      <img src={qrUrl} alt="QR" style={{ width:"100%", height:"100%", objectFit:"contain" }} crossOrigin="anonymous" />
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons télécharger / imprimer */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{ flex: 1, background: downloading ? "#94A3B8" : "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 10px", fontSize: 13, fontWeight: 700, cursor: downloading ? "not-allowed" : "pointer", fontFamily: "'Poppins',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {downloading ? "⏳ Export..." : "⬇️ Télécharger"}
                </button>
                <button
                  onClick={handlePrint}
                  style={{ flex: 1, background: "linear-gradient(135deg,#0891B2,#164e63)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  🖨️ Imprimer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Composants utilitaires ────────────────────────────────────────
function Field({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <div>
      <label style={ls.label}>{label}</label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#0F172A", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box", outline: "none", background: "#FAFAFA" }} />
    </div>
  );
}

function SectionHeader({ title, icon, color, canAdd, onAdd }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 24 }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{title}</span>
      {canAdd && (
        <button onClick={onAdd} style={{ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: `0 4px 12px ${color}40` }}>
          + Ajouter
        </button>
      )}
    </div>
  );
}

function EmptyCard({ icon, text, color, onAdd }) {
  return (
    <div onClick={onAdd} style={{ background: "#fff", borderRadius: 16, padding: "28px 20px", textAlign: "center", border: "2px dashed #E2E8F0", marginBottom: 8, cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <p style={{ color: "#94A3B8", fontSize: 14, margin: "10px 0 6px" }}>{text}</p>
      <p style={{ color, fontSize: 13, fontWeight: 600, margin: 0 }}>+ Ajouter</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: 16 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[80, 120, 120].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 16, marginBottom: 12, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

const ls = {
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 },
};

