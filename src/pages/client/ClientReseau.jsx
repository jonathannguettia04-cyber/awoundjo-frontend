import { useEffect, useState } from "react";
import { healthcareAPI } from "../../services/api";

const TYPES = [
  { id: "all",      label: "Tous",        icon: "🗂️" },
  { id: "pharmacy", label: "Pharmacies",  icon: "💊" },
  { id: "clinic",   label: "Cliniques",   icon: "🏥" },
  { id: "hospital", label: "Hôpitaux",    icon: "🏨" },
  { id: "lab",      label: "Laboratoires",icon: "🔬" },
];

const TYPE_STYLE = {
  pharmacy: { color: "#059669", bg: "#ECFDF5", icon: "💊" },
  clinic:   { color: "#1D4ED8", bg: "#EFF6FF", icon: "🏥" },
  hospital: { color: "#7C3AED", bg: "#F5F3FF", icon: "🏨" },
  lab:      { color: "#0891B2", bg: "#ECFEFF", icon: "🔬" },
};

export default function ClientReseau() {
  const [providers, setProviders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [city,      setCity]      = useState("Toutes");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    healthcareAPI.getProviders()
      .then(({ data }) => setProviders(data.providers || []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  const cities = ["Toutes", ...Array.from(new Set(providers.map((p) => p.city).filter(Boolean))).sort()];

  const filtered = providers.filter((p) => {
    const matchType   = filter === "all" || p.type === filter;
    const matchCity   = city === "Toutes" || p.city === city;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.address || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchCity && matchSearch;
  });

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>
        Réseau de Soins
      </h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
        {providers.length} établissements partenaires Awoundjô
      </p>

      {/* Recherche */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
        <input type="text" placeholder="Rechercher un établissement..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "12px 14px 12px 42px", fontSize: 14, fontFamily: "'Poppins',sans-serif", boxSizing: "border-box", outline: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }} />
      </div>

      {/* Filtre ville */}
      <select value={city} onChange={(e) => setCity(e.target.value)}
        style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "11px 14px", fontSize: 13, fontFamily: "'Poppins',sans-serif", background: "#fff", outline: "none", color: "#0F172A", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        {cities.map((c) => <option key={c}>{c}</option>)}
      </select>

      {/* Filtres type */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
        {TYPES.map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding: "8px 14px", borderRadius: 20, border: "none",
            background: filter === t.id ? "linear-gradient(135deg,#1a56db,#1e40af)" : "#fff",
            color: filter === t.id ? "#fff" : "#475569",
            fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: "'Poppins',sans-serif",
            boxShadow: filter === t.id ? "0 4px 12px rgba(26,86,219,.3)" : "0 2px 8px rgba(0,0,0,.06)",
            transition: "all .2s", display: "flex", alignItems: "center", gap: 5,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10, fontWeight: 500 }}>
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ width: 36, height: 36, border: "4px solid #1a56db", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 20 }}>
          <span style={{ fontSize: 48 }}>🏥</span>
          <p style={{ color: "#64748B", fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>Aucun résultat</p>
        </div>
      ) : (
        filtered.map((p, i) => {
          const tc = TYPE_STYLE[p.type] || TYPE_STYLE.pharmacy;
          return (
            <div key={p.id || i} style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
              <div style={{ width: 48, height: 48, background: tc.bg, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {tc.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: "0 0 2px" }}>{p.name}</p>
                <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 4px" }}>
                  📍 {[p.address, p.city].filter(Boolean).join(", ") || "—"}
                </p>
                {p.email && <p style={{ fontSize: 11, color: "#94A3B8" }}>✉️ {p.email}</p>}
              </div>
              {p.phone ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                  <a href={`tel:${p.phone}`} style={{ background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", borderRadius: 10, padding: "8px 12px", fontSize: 16, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(26,86,219,.3)" }}>📞</a>
                  {p.phone2 && (
                    <a href={`tel:${p.phone2}`} style={{ background: "#EFF6FF", color: "#1D4ED8", borderRadius: 10, padding: "8px 12px", fontSize: 16, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>📱</a>
                  )}
                </div>
              ) : (
                <div style={{ width: 40, height: 40, background: "#F1F5F9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📵</div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
