// src/pages/client/ClientReseau.jsx
import { useState } from "react";

const NETWORK = [
  { name: "Pharmacie de Duekoue",              type: "pharmacy", address: "Duekoue",              city: "Duekoue",      phone: "0757486781", phone2: "0708302010" },
  { name: "Pharmacie Les Magnolais 220 Logements", type: "pharmacy", address: "Yamoussoukro",     city: "Yamoussoukro", phone: "708021472" },
  { name: "Pharmacie Aset La Divine",          type: "pharmacy", address: "Azaguie",              city: "Azaguie",      phone: "102034874" },
  { name: "Pharmacie Espoir",                  type: "pharmacy", address: "Bouake",               city: "Bouaké",       phone: "0749337049", phone2: "0152298109" },
  { name: "Pharmacie Indépendance",            type: "pharmacy", address: "Bouake",               city: "Bouaké",       phone: "22530623042" },
  { name: "Pharmacie du Commerce",             type: "pharmacy", address: "Bouake",               city: "Bouaké",       phone: "709373775" },
  { name: "Pharmacie du Marché Akeikoi",       type: "pharmacy", address: "Abobo",                city: "Abidjan",      phone: "707431539" },
  { name: "Nouvelle Pharmacie de la Me",       type: "pharmacy", address: "Abobo",                city: "Abidjan",      phone: "102928463" },
  { name: "Pharmacie Le Belier",               type: "pharmacy", address: "Adjame",               city: "Abidjan",      phone: "20371216" },
  { name: "Pharmacie Adjame Santé Nouvelle",   type: "pharmacy", address: "Adjame",               city: "Abidjan",      phone: "788696307" },
  { name: "Pharmacie Sarah",                   type: "pharmacy", address: "Adjame",               city: "Abidjan",      phone: "757579502" },
  { name: "Pharmacie Ebenezer",                type: "pharmacy", address: "Bonoua",               city: "Bonoua",       phone: "102802008" },
  { name: "Pharmacie Eden",                    type: "pharmacy", address: "Bonoua",               city: "Bonoua",       phone: "758094667" },
  { name: "Pharmacie Sainte Rita",             type: "pharmacy", address: "Bonoua",               city: "Bonoua",       phone: "151480857" },
  { name: "Pharmacie Las Palmas",              type: "pharmacy", address: "2 Plateaux",           city: "Abidjan",      phone: "101216565" },
  { name: "Pharmacie Arras",                   type: "pharmacy", address: "Treichville",          city: "Abidjan",      phone: "748465148" },
  { name: "Pharmacie du Rond Point du CHU",    type: "pharmacy", address: "Treichville",          city: "Abidjan",      phone: "797505556" },
  { name: "Pharmacie Merouane",                type: "pharmacy", address: "Treichville",          city: "Abidjan",      phone: "2721240929" },
  { name: "Pharmacie des Brasseurs",           type: "pharmacy", address: "Treichville",          city: "Abidjan",      phone: "2721251725" },
  { name: "Pharmacie du Cenacle",              type: "pharmacy", address: "Yopougon",             city: "Abidjan",      phone: "2723522323", phone2: "2723451474" },
  { name: "Pharmacie St Ange Emmanuel",        type: "pharmacy", address: "Yopougon",             city: "Abidjan",      phone: "101074853" },
  { name: "Pharmacie Carrefour Koweit",        type: "pharmacy", address: "Yopougon",             city: "Abidjan",      phone: "2723458407" },
  { name: "Pharmacie Yopougon Koute",          type: "pharmacy", address: "Yopougon",             city: "Abidjan",      phone: "103387425" },
  { name: "Pharmacie de la Bagoue",            type: "pharmacy", address: "Yopougon",             city: "Abidjan",      phone: "2721286414" },
  { name: "Pharmacie Yopougon Anador",         type: "pharmacy", address: "Yopougon",             city: "Abidjan",      phone: "545488803" },
  { name: "Pharmacie Saint Andre",             type: "pharmacy", address: "Yopougon",             city: "Abidjan",      phone: "749930113" },
  { name: "Pharmacie du Wharf",                type: "pharmacy", address: "Port Bouet",           city: "Abidjan",      phone: "779829100" },
  { name: "Pharmacie Balnéaire",               type: "pharmacy", address: "Port Bouet",           city: "Abidjan",      phone: "2721276370" },
  { name: "Grande Pharmacie de Lagneby",       type: "pharmacy", address: "Agboville",            city: "Agboville",    phone: "102036625" },
  { name: "Nouvelle Pharmacie de la Me",       type: "pharmacy", address: "San Pedro",            city: "San Pédro",    phone: "708422879" },
  { name: "Pharmacie Nitoro",                  type: "pharmacy", address: "San Pedro",            city: "San Pédro",    phone: "34713911" },
  { name: "Pharmacie Nabenou",                 type: "pharmacy", address: "San Pedro",            city: "San Pédro",    phone: "77741813" },
  { name: "Pharmacie Nour",                    type: "pharmacy", address: "San Pedro",            city: "San Pédro",    phone: "" },
  { name: "Pharmacie Bien Etre",               type: "pharmacy", address: "San Pedro",            city: "San Pédro",    phone: "" },
  { name: "Pharmamacie Jules Vernes",          type: "pharmacy", address: "Bingerville",          city: "Bingerville",  phone: "797038344" },
  { name: "Pharmacie Akre Albert Assamoi",     type: "pharmacy", address: "Bingerville",          city: "Bingerville",  phone: "0757136836", phone2: "0140952428" },
  { name: "La Grande Pharmacie de Gbagra",     type: "pharmacy", address: "Bingerville",          city: "Bingerville",  phone: "707853139" },
  { name: "Pharmacie St Sylvestre",            type: "pharmacy", address: "Bingerville",          city: "Bingerville",  phone: "758176159" },
  { name: "Pharmacie Hosanna",                 type: "pharmacy", address: "Riviera 4",            city: "Abidjan",      phone: "797643350" },
  { name: "Pharmacie Ephrata",                 type: "pharmacy", address: "Riviera 4",            city: "Abidjan",      phone: "575379407" },
  { name: "Pharmacie St Pierre des Rosees",    type: "pharmacy", address: "Riviera 4",            city: "Abidjan",      phone: "2722474217" },
  { name: "Pharmacie Grd Marché Marcory",      type: "pharmacy", address: "Marcory",              city: "Abidjan",      phone: "2721569096", phone2: "2721260076" },
  { name: "Pharmacie des Allées",              type: "pharmacy", address: "Angre",                city: "Abidjan",      phone: "777374428" },
  { name: "Pharmacie Cephas",                  type: "pharmacy", address: "Abatta",               city: "Abatta",       phone: "707694867" },
  { name: "Pharmacie Berekyah",                type: "pharmacy", address: "Cocody",               city: "Abidjan",      phone: "757490842" },
  { name: "Pharmacie Mathe",                   type: "pharmacy", address: "Gagnoa",               city: "Gagnoa",       phone: "708843069" },
  { name: "Pharmacie Saint Agathe",            type: "pharmacy", address: "—",                    city: "—",            phone: "2722474819" },
  { name: "Pharmacie Longchamp",               type: "pharmacy", address: "Plateau",              city: "Abidjan",      phone: "2720223262" },
  { name: "Grande Pharmacie Marie Esther",     type: "pharmacy", address: "Riviera Palmeraie",    city: "Abidjan",      phone: "779775771" },
  { name: "Pharmacie Keneya",                  type: "pharmacy", address: "Yopougon",             city: "Abidjan",      phone: "2723454465" },
  { name: "Pharmacie Baity",                   type: "pharmacy", address: "—",                    city: "—",            phone: "707088715" },
  { name: "Pharmacie des Hibiscus",            type: "pharmacy", address: "—",                    city: "—",            phone: "747509293" },
  { name: "Pharmacie de Linjs",                type: "pharmacy", address: "Marcory",              city: "Abidjan",      phone: "779030143" },
];

const TYPES = [
  { id: "all",      label: "Tous",       icon: "🗂️" },
  { id: "pharmacy", label: "Pharmacies", icon: "💊" },
  { id: "clinic",   label: "Cliniques",  icon: "🏥" },
  { id: "hospital", label: "Hôpitaux",   icon: "🏨" },
  { id: "lab",      label: "Labos",      icon: "🔬" },
];

const TYPE_STYLE = {
  pharmacy: { color: "#059669", bg: "#ECFDF5", icon: "💊" },
  clinic:   { color: "#1D4ED8", bg: "#EFF6FF", icon: "🏥" },
  hospital: { color: "#7C3AED", bg: "#F5F3FF", icon: "🏨" },
  lab:      { color: "#0891B2", bg: "#ECFEFF", icon: "🔬" },
};

const CITIES = ["Toutes", ...Array.from(new Set(NETWORK.map(n => n.city).filter(c => c && c !== "—"))).sort()];

export default function ClientReseau() {
  const [filter, setFilter] = useState("all");
  const [city,   setCity]   = useState("Toutes");
  const [search, setSearch] = useState("");

  const filtered = NETWORK.filter(n => {
    const matchType   = filter === "all" || n.type === filter;
    const matchCity   = city === "Toutes" || n.city === city;
    const matchSearch = !search || n.name.toLowerCase().includes(search.toLowerCase()) || (n.city || "").toLowerCase().includes(search.toLowerCase()) || (n.address || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchCity && matchSearch;
  });

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Réseau de Soins</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>{NETWORK.length} établissements partenaires Awoundjô</p>

      {/* Recherche */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
        <input type="text" placeholder="Rechercher un établissement..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "12px 14px 12px 42px", fontSize: 14, fontFamily: "'Poppins',sans-serif", boxSizing: "border-box", outline: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }} />
      </div>

      {/* Filtre ville */}
      <select value={city} onChange={e => setCity(e.target.value)}
        style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "11px 14px", fontSize: 13, fontFamily: "'Poppins',sans-serif", background: "#fff", outline: "none", color: "#0F172A", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        {CITIES.map(c => <option key={c}>{c}</option>)}
      </select>

      {/* Filtres type */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
        {TYPES.map(t => (
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

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 20 }}>
          <span style={{ fontSize: 48 }}>🏥</span>
          <p style={{ color: "#64748B", fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>Aucun résultat</p>
        </div>
      ) : (
        filtered.map((n, i) => {
          const tc = TYPE_STYLE[n.type] || TYPE_STYLE.pharmacy;
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
              <div style={{ width: 48, height: 48, background: tc.bg, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {tc.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: "0 0 2px" }}>{n.name}</p>
                <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 4px" }}>📍 {n.address}{n.city && n.city !== "—" ? `, ${n.city}` : ""}</p>
              </div>
              {n.phone ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                  <a href={`tel:${n.phone}`} style={{ background: "linear-gradient(135deg,#1a56db,#1e40af)", color: "#fff", borderRadius: 10, padding: "8px 12px", fontSize: 16, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(26,86,219,.3)" }}>📞</a>
                  {n.phone2 && <a href={`tel:${n.phone2}`} style={{ background: "#EFF6FF", color: "#1D4ED8", borderRadius: 10, padding: "8px 12px", fontSize: 16, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>📱</a>}
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
