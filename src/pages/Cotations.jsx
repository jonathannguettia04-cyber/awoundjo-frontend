// src/pages/Cotations.jsx
// Génération de devis PDF pour prospects entreprise/groupe.
// Saisie 100% manuelle (pas de calcul automatique lié aux formules/barèmes) —
// l'agent renseigne lui-même les tarifs qu'il propose au prospect.
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BASE = import.meta.env.VITE_API_URL || "";

const PLAN_OPTIONS = ["Basique", "Essentielle", "Ivoirienne", "Turquoise", "Sur mesure"];
const BAREME_PLANS = ["Ivoirienne", "Turquoise"]; // formules couvertes par le barème groupe

// Cherche la tranche d'effectif applicable dans le barème (min inclus, max inclus ou null = infini)
function findTranche(tranches, effectif) {
  if (!Array.isArray(tranches)) return null;
  const eff = Number(effectif) || 0;
  return tranches.find((t) => eff >= (t.min ?? 0) && (t.max == null || eff <= t.max)) || null;
}

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function generateRef() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DEV-${y}${m}${d}-${rand}`;
}

const emptyLine = () => ({
  formule: "Essentielle",
  effectif: 1,
  prix_adhesion: 0,
  prix_mensualite: 0,
});

export default function Cotations() {
  const { user } = useAuth();

  const [ref]        = useState(generateRef());
  const [entreprise, setEntreprise]   = useState("");
  const [secteur, setSecteur]         = useState("");
  const [ville, setVille]             = useState("");
  const [contact, setContact]         = useState("");
  const [fonction, setFonction]       = useState("");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [validite, setValidite]       = useState(todayPlus(30));
  const [notes, setNotes]             = useState(
    "Ce devis est valable jusqu'à la date d'échéance indiquée ci-dessus. Il ne vaut pas confirmation d'adhésion — celle-ci intervient après validation du dossier et premier paiement."
  );
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState("");

  // ── Barème groupe (paramètre back-office public "tarifs_groupe") ──────
  const [tarifsGroupe, setTarifsGroupe] = useState(null); // { adhesion, tranches } | null tant que non chargé
  const [baremeError, setBaremeError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/settings/public`);
        const data = await res.json(); // objet plat { key: value, ... }
        if (!res.ok) throw new Error();
        if (!cancelled && data?.tarifs_groupe) setTarifsGroupe(data.tarifs_groupe);
      } catch {
        if (!cancelled) setBaremeError(true); // pas bloquant : saisie manuelle reste possible
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function updateLine(i, field, value) {
    setLines((ls) => ls.map((l, idx) => {
      if (idx !== i) return l;
      const next = { ...l, [field]: value };

      // Auto-remplissage depuis le barème quand la formule ou l'effectif changent
      if ((field === "formule" || field === "effectif") && tarifsGroupe && BAREME_PLANS.includes(next.formule)) {
        const tranche = findTranche(tarifsGroupe.tranches, next.effectif);
        if (tranche) {
          next.prix_adhesion = tarifsGroupe.adhesion ?? next.prix_adhesion;
          next.prix_mensualite = tranche[next.formule.toLowerCase()] ?? next.prix_mensualite;
        }
      }
      return next;
    }));
  }
  function addLine() {
    setLines((ls) => [...ls, emptyLine()]);
  }
  function removeLine(i) {
    setLines((ls) => ls.filter((_, idx) => idx !== i));
  }

  const totalEffectif    = lines.reduce((s, l) => s + (Number(l.effectif) || 0), 0);
  const totalAdhesion    = lines.reduce((s, l) => s + (Number(l.effectif) || 0) * (Number(l.prix_adhesion) || 0), 0);
  const totalMensualite  = lines.reduce((s, l) => s + (Number(l.effectif) || 0) * (Number(l.prix_mensualite) || 0), 0);

  function validate() {
    if (!entreprise.trim()) return "Le nom de l'entreprise ou du groupe est requis.";
    if (!contact.trim())    return "Le nom du contact est requis.";
    if (!phone.trim())      return "Le téléphone du contact est requis.";
    if (!lines.length)      return "Ajoutez au moins une ligne de formule.";
    const tropPetite = lines.find((l) => BAREME_PLANS.includes(l.formule) && (Number(l.effectif) || 0) < 20);
    if (tropPetite) return `Effectif minimum 20 personnes pour la formule ${tropPetite.formule}.`;
    return "";
  }

  function generatePdf() {
    const msg = validate();
    setError(msg);
    if (msg) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 15;

    // ── En-tête ──────────────────────────────────────────────
    doc.setFillColor(26, 95, 168); // #1a5fa8 — bleu de marque
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Awoundjô", marginX, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Mutuelle santé · Côte d'Ivoire", marginX, 23);

    doc.setFontSize(10);
    doc.text(`Devis N° ${ref}`, pageWidth - marginX, 14, { align: "right" });
    doc.text(`Émis le ${fmtDate(new Date().toISOString())}`, pageWidth - marginX, 20, { align: "right" });

    doc.setTextColor(30, 41, 59);

    // ── Bloc entreprise / contact ───────────────────────────
    let y = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Devis Entreprise / Groupe", marginX, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const infoLeft = [
      ["Entreprise / groupe", entreprise],
      ["Secteur d'activité", secteur || "—"],
      ["Ville", ville || "—"],
    ];
    const infoRight = [
      ["Contact", `${contact}${fonction ? " (" + fonction + ")" : ""}`],
      ["Téléphone", phone],
      ["Email", email || "—"],
    ];
    infoLeft.forEach(([label, val], i) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label} :`, marginX, y + i * 6);
      doc.setFont("helvetica", "normal");
      doc.text(String(val), marginX + 42, y + i * 6);
    });
    const rightX = pageWidth / 2 + 5;
    infoRight.forEach(([label, val], i) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label} :`, rightX, y + i * 6);
      doc.setFont("helvetica", "normal");
      doc.text(String(val), rightX + 28, y + i * 6);
    });
    y += infoLeft.length * 6 + 8;

    doc.setFont("helvetica", "bold");
    doc.text(`Validité de l'offre :`, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(fmtDate(validite), marginX + 42, y);
    y += 10;

    // ── Tableau des formules ────────────────────────────────
    autoTable(doc, {
      startY: y,
      head: [["Formule", "Effectif", "Prix adhésion (u.)", "Sous-total adhésion", "Prix mensualité (u.)", "Sous-total mensuel"]],
      body: lines.map((l) => {
        const eff = Number(l.effectif) || 0;
        const pa  = Number(l.prix_adhesion) || 0;
        const pm  = Number(l.prix_mensualite) || 0;
        return [
          l.formule,
          String(eff),
          `${pa.toLocaleString("fr-FR")} F`,
          `${(eff * pa).toLocaleString("fr-FR")} F`,
          `${pm.toLocaleString("fr-FR")} F`,
          `${(eff * pm).toLocaleString("fr-FR")} F`,
        ];
      }),
      foot: [[
        "Total", String(totalEffectif), "",
        `${totalAdhesion.toLocaleString("fr-FR")} F`, "",
        `${totalMensualite.toLocaleString("fr-FR")} F`,
      ]],
      headStyles: { fillColor: [14, 42, 73], textColor: 255, fontStyle: "bold", fontSize: 9 },
      footStyles: { fillColor: [240, 244, 248], textColor: [14, 42, 73], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: marginX, right: marginX },
    });

    y = doc.lastAutoTable.finalY + 12;

    // ── Notes / conditions ───────────────────────────────────
    if (notes.trim()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Conditions", marginX, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const split = doc.splitTextToSize(notes, pageWidth - marginX * 2);
      doc.text(split, marginX, y);
      y += split.length * 4.5 + 6;
    }

    // ── Bloc signature agent ─────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.text("Établi par", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(user?.name || "—", marginX, y + 5);

    // ── Pied de page ─────────────────────────────────────────
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Awoundjô — Mutuelle santé — Côte d'Ivoire", marginX, pageHeight - 10);
    doc.text(`Document généré le ${fmtDate(new Date().toISOString())}`, pageWidth - marginX, pageHeight - 10, { align: "right" });

    doc.save(`${ref}-${entreprise.replace(/[^a-z0-9]+/gi, "_") || "devis"}.pdf`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cotations</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Générer un devis PDF à envoyer à un prospect entreprise ou groupe.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl px-4 py-3">
          <i className="ti ti-alert-triangle" style={{ fontSize: 15 }} aria-hidden="true" />
          {error}
        </div>
      )}

      {baremeError && (
        <div className="mb-5 flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-sm font-medium rounded-xl px-4 py-3">
          <i className="ti ti-alert-triangle" style={{ fontSize: 15 }} aria-hidden="true" />
          Barème groupe indisponible — saisissez les prix manuellement.
        </div>
      )}

      {/* ── Bloc entreprise ─────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Entreprise / groupe</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nom de l'entreprise / du groupe" required>
            <input className="input" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder="Ex: SARL Koffi & Fils" />
          </Field>
          <Field label="Secteur d'activité">
            <input className="input" value={secteur} onChange={(e) => setSecteur(e.target.value)} placeholder="Ex: BTP, Commerce…" />
          </Field>
          <Field label="Ville">
            <input className="input" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ex: Abidjan" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Field label="Nom du contact" required>
            <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nom complet" />
          </Field>
          <Field label="Fonction">
            <input className="input" value={fonction} onChange={(e) => setFonction(e.target.value)} placeholder="Ex: DRH, Gérant…" />
          </Field>
          <Field label="Téléphone" required>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 XX XX XX XX" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Field label="Email">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@entreprise.ci" />
          </Field>
          <Field label="Validité de l'offre">
            <input className="input" type="date" value={validite} onChange={(e) => setValidite(e.target.value)} />
          </Field>
        </div>
      </section>

      {/* ── Lignes de formules ──────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700">Formules proposées</h2>
          <button onClick={addLine} className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" /> Ajouter une ligne
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.3fr_0.7fr_1fr_1fr_auto] gap-3 items-end border-b border-slate-50 pb-3 last:border-0">
              <Field label="Formule" small>
                <select className="input" value={line.formule} onChange={(e) => updateLine(i, "formule", e.target.value)}>
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Effectif" small>
                <input
                  className="input" type="number"
                  min={BAREME_PLANS.includes(line.formule) ? 20 : 1}
                  value={line.effectif}
                  onChange={(e) => updateLine(i, "effectif", e.target.value)}
                />
              </Field>
              <Field label="Prix adhésion (F CFA / pers.)" small>
                <input className="input" type="number" min="0" step="500" value={line.prix_adhesion} onChange={(e) => updateLine(i, "prix_adhesion", e.target.value)} />
              </Field>
              <Field label="Prix mensualité (F CFA / pers.)" small>
                <input className="input" type="number" min="0" step="500" value={line.prix_mensualite} onChange={(e) => updateLine(i, "prix_mensualite", e.target.value)} />
              </Field>
              {lines.length > 1 && (
                <button onClick={() => removeLine(i)} title="Retirer cette ligne" className="text-slate-300 hover:text-red-500 mb-2">
                  <i className="ti ti-trash" style={{ fontSize: 16 }} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-slate-100 text-sm">
          <div><span className="text-slate-400">Effectif total : </span><strong className="text-slate-700">{totalEffectif}</strong></div>
          <div><span className="text-slate-400">Total adhésion : </span><strong className="text-slate-700">{totalAdhesion.toLocaleString("fr-FR")} F</strong></div>
          <div><span className="text-slate-400">Total mensuel : </span><strong className="text-slate-700">{totalMensualite.toLocaleString("fr-FR")} F</strong></div>
        </div>
      </section>

      {/* ── Notes ────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Conditions / notes (affichées sur le devis)</h2>
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </section>

      <div className="flex justify-end">
        <button
          onClick={generatePdf}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <i className="ti ti-file-download" style={{ fontSize: 15 }} aria-hidden="true" />
          Générer le devis PDF
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #E2E8F0;
          border-radius: 0.6rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          color: #334155;
          background: #fff;
          outline: none;
        }
        .input:focus { border-color: #1a5fa8; box-shadow: 0 0 0 2px rgba(26,95,168,0.15); }
      `}</style>
    </div>
  );
}

function Field({ label, required, small, children }) {
  return (
    <label className="block">
      <span className={`block text-slate-500 mb-1 ${small ? "text-[11px]" : "text-xs"}`}>
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
