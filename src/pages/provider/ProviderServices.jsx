// src/pages/provider/ProviderServices.jsx
// Historique des actes enregistrés — lecture seule
// L'enregistrement se fait uniquement via ProviderScan

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { providerServiceAPI } from "../../providerApi";

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const CATEGORY_CONFIG = {
  consultation_generaliste:    { icon: "🩺",  label: "Consultation générale",    color: "#2563EB", bg: "#EFF6FF" },
  consultation_specialiste:    { icon: "👨‍⚕️", label: "Consultation spécialiste", color: "#7C3AED", bg: "#F5F3FF" },
  consultation_urgence:        { icon: "🚨",  label: "Urgence",                  color: "#DC2626", bg: "#FEF2F2" },
  hospitalisation_hebergement: { icon: "🏥",  label: "Hospitalisation",          color: "#DC2626", bg: "#FEF2F2" },
  hospitalisation_chirurgie:   { icon: "🔪",  label: "Chirurgie",                color: "#DC2626", bg: "#FEF2F2" },
  pharmacie:                   { icon: "💊",  label: "Pharmacie",                color: "#059669", bg: "#ECFDF5" },
  radiologie_imagerie:         { icon: "🩻",  label: "Radiologie / Imagerie",    color: "#0891B2", bg: "#ECFEFF" },
  analyses_biologiques:        { icon: "🔬",  label: "Analyses biologiques",     color: "#0891B2", bg: "#ECFEFF" },
  optique:                     { icon: "👓",  label: "Optique",                  color: "#D97706", bg: "#FFFBEB" },
  dentisterie:                 { icon: "🦷",  label: "Dentaire",                 color: "#64748B", bg: "#F8FAFC" },
  maternite_simple:            { icon: "🤱",  label: "Maternité — Simple",       color: "#DB2777", bg: "#FDF2F8" },
  maternite_multiple:          { icon: "🤱",  label: "Maternité — Gémellaire",   color: "#DB2777", bg: "#FDF2F8" },
  maternite_chirurgicale:      { icon: "🤱",  label: "Maternité — Césarienne",   color: "#DB2777", bg: "#FDF2F8" },
  transport_ambulance:         { icon: "🚑",  label: "Transport sanitaire",      color: "#7C3AED", bg: "#F5F3FF" },
};

const CATEGORIES = [
  { id: "",                          label: "Tous les actes" },
  { id: "consultation_generaliste",  label: "Cons. générale" },
  { id: "consultation_specialiste",  label: "Spécialiste" },
  { id: "consultation_urgence",      label: "Urgence" },
  { id: "hospitalisation_hebergement", label: "Hospitalisation" },
  { id: "hospitalisation_chirurgie", label: "Chirurgie" },
  { id: "pharmacie",                 label: "Pharmacie" },
  { id: "radiologie_imagerie",       label: "Radiologie" },
  { id: "analyses_biologiques",      label: "Biologie" },
  { id: "optique",                   label: "Optique" },
  { id: "dentisterie",               label: "Dentaire" },
  { id: "maternite_simple",          label: "Maternité" },
  { id: "transport_ambulance",       label: "Transport" },
];

export default function ProviderServices() {
  const navigate = useNavigate();
  const [services,  setServices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [selected,  setSelected]  = useState(null);
  const [category,  setCategory]  = useState("");
  const [from,      setFrom]      = useState("");
  const [to,        setTo]        = useState("");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const LIMIT = 20;

  async function load(reset = false) {
    setLoading(true); setError("");
    const p = reset ? 1 : page;
    try {
      const { data } = await providerServiceAPI.getAll({
        page: p, limit: LIMIT,
        ...(category && { category }),
        ...(from && { from }),
        ...(to   && { to: to + "T23:59:59" }),
      });
      setServices(data.services || []);
      setTotal(data.total || 0);
      if (reset) setPage(1);
    } catch { setError("Impossible de charger les actes"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page]);

  function handleFilter(e) {
    e.preventDefault();
    load(true);
  }

  // KPIs rapides
  const totalAmount  = services.reduce((s, r) => s + Number(r.total_amount), 0);
  const totalMutual  = services.reduce((s, r) => s + Number(r.mutual_part),  0);
  const totalPages   = Math.ceil(total / LIMIT);

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", paddingBottom: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f2942", margin: 0 }}>Historique des actes</h2>
          <p style={{ color: "#64748B", fontSize: 13, margin: "2px 0 0" }}>{total} acte{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => navigate("/etablissement/scan")}
          style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Nouvel acte
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Actes (page)",       value: services.length,    icon: "📝", color: "#2563EB", bg: "#EFF6FF" },
          { label: "Total facturé",      value: fmt(totalAmount),   icon: "💰", color: "#D97706", bg: "#FFFBEB" },
          { label: "Part mutuelle",      value: fmt(totalMutual),   icon: "🏥", color: "#059669", bg: "#ECFDF5" },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 14, padding: "14px", border: `1px solid ${k.color}20` }}>
            <p style={{ fontSize: 10, color: "#64748B", margin: "0 0 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: .8 }}>{k.icon} {k.label}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <form onSubmit={handleFilter} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 140px" }}>
            <label style={sty.label}>Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={sty.select}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <label style={sty.label}>Du</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={sty.input} />
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <label style={sty.label}>Au</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={sty.input} />
          </div>
          <button type="submit" style={{ ...sty.btn, flexShrink: 0 }}>Filtrer</button>
        </div>
      </form>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>Chargement…</div>
      ) : services.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 20, color: "#94A3B8" }}>
          <p style={{ fontSize: 36 }}>📋</p>
          <p>Aucun acte enregistré sur cette période</p>
          <button onClick={() => navigate("/etablissement/scan")}
            style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, marginTop: 8 }}>
            + Enregistrer un acte
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {services.map(svc => {
            const cat = CATEGORY_CONFIG[svc.category] || { icon: "📋", label: svc.category, color: "#64748B", bg: "#F8FAFC" };
            const isOpen = selected?.id === svc.id;
            return (
              <div key={svc.id}
                onClick={() => setSelected(isOpen ? null : svc)}
                style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,.04)", cursor: "pointer", border: `1.5px solid ${isOpen ? "#2563EB" : "#F1F5F9"}`, transition: "border-color .15s" }}>

                {/* Ligne principale */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: "#0f2942", margin: 0, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {svc.catalog_label || svc.catalog_code}
                    </p>
                    <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>
                      {svc.client_name} · {svc.mutual_number}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontWeight: 800, color: "#0f2942", margin: 0, fontSize: 13 }}>{fmt(svc.total_amount)}</p>
                    <p style={{ color: "#94A3B8", fontSize: 11, margin: 0 }}>{fmtDate(svc.created_at)}</p>
                  </div>
                </div>

                {/* Détail déroulant */}
                {isOpen && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      {[
                        { label: "Code acte",     value: svc.catalog_code },
                        { label: "Catégorie",     value: cat.label },
                        { label: "Part mutuelle", value: fmt(svc.mutual_part),  color: "#0097A7" },
                        { label: "Reste patient", value: fmt(svc.client_part),  color: "#DC2626" },
                        { label: "Couverture",    value: `${svc.coverage_pct}%` },
                        { label: "Statut facture",value: svc.invoice_id ? "✅ Facturé" : "⏳ En attente" },
                      ].map((row, i) => (
                        <div key={i}>
                          <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 2px" }}>{row.label}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: row.color || "#1E293B", margin: 0 }}>{row.value}</p>
                        </div>
                      ))}
                    </div>
                    {svc.description && (
                      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#475569" }}>
                        {svc.description}
                      </div>
                    )}
                    {svc.prescription_content && (
                      <div style={{ marginTop: 8, background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 12px" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: .6, margin: "0 0 4px" }}>📋 Ordonnance</p>
                        <p style={{ fontSize: 12, color: "#78350F", margin: 0, whiteSpace: "pre-line" }}>{svc.prescription_content}</p>
                      </div>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/etablissement/medical/${svc.client_id}`); }}
                      style={{ marginTop: 10, background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#2563EB", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                      📂 Voir dossier médical
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ ...sty.btn, opacity: page === 1 ? 0.4 : 1 }}>← Préc.</button>
          <span style={{ padding: "10px 16px", fontSize: 13, color: "#64748B" }}>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            style={{ ...sty.btn, opacity: page === totalPages ? 0.4 : 1 }}>Suiv. →</button>
        </div>
      )}
    </div>
  );
}

const sty = {
  label:  { display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 },
  input:  { width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  select: { width: "100%", border: "1.5px solid #CBD5E1", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "#fff" },
  btn:    { background: "#0f2942", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};
