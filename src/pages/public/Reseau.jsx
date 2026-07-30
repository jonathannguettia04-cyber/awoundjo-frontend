// src/pages/public/Reseau.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import FontLoader from "../../components/shared/FontLoader";
import Nav from "../../components/shared/Nav";
import Footer from "../../components/shared/Footer";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import ResponsiveStyles from "../../components/shared/ResponsiveStyles";
import { C } from "../../data/constants";
import { healthcareAPI } from "../../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Mêmes types que l'espace admin (HealthcareAdmin.jsx) — à garder synchronisés
const TYPE_CONFIG = {
  pharmacy: { label: "Pharmacie",    icon: "💊", color: C.gold },
  clinic:   { label: "Clinique",     icon: "🏥", color: C.green },
  hospital: { label: "Hôpital",      icon: "🏨", color: "#0E7490" },
  lab:      { label: "Laboratoire",  icon: "🔬", color: "#7C3AED" },
  optician: { label: "Opticien",     icon: "👓", color: "#4338CA" },
  dentist:  { label: "Dentiste",     icon: "🦷", color: "#DB2777" },
  midwife:  { label: "Sage-femme",   icon: "🩺", color: "#DB2777" },
};

// Coordonnées approximatives des centres-villes — utilisées pour regrouper
// les établissements sur la carte tant que le backend n'expose pas de lat/lng par établissement.
const CITY_COORDS = {
  "Abidjan":       [5.345,  -4.008],
  "Bouaké":        [7.6906, -5.0300],
  "Yamoussoukro":  [6.8206, -5.2767],
  "San-Pédro":     [4.7485, -6.6363],
  "Korhogo":       [9.4580, -5.6296],
  "Man":           [7.4125, -7.5540],
  "Daloa":         [6.8770, -6.4502],
  "Gagnoa":        [6.1319, -5.9506],
  "Abengourou":    [6.7297, -3.4964],
  "Divo":          [5.8391, -5.3572],
  "Soubré":        [5.7858, -6.5987],
  "Grand-Bassam":  [5.2119, -3.7391],
};

export default function Reseau() {
  const [providers, setProviders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const { data } = await healthcareAPI.getProviders({ active: true });
        const active = (data.providers || []).filter(p => p.status ? p.status === "ACTIVE" : true);
        setProviders(active);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const typeFilters = [
    { id: "all", label: "Tous" },
    ...Object.entries(TYPE_CONFIG).map(([id, t]) => ({ id, label: t.label })),
  ];

  const filtered = providers.filter(p => {
    const typeOk = filter === "all" || p.type === filter;
    const q = search.toLowerCase();
    const searchOk = !search
      || p.name.toLowerCase().includes(q)
      || (p.city || "").toLowerCase().includes(q)
      || (p.commune || "").toLowerCase().includes(q);
    return typeOk && searchOk;
  });

  // Regroupement par ville, pour la carte ET pour "villes couvertes"
  const byCity = filtered.reduce((acc, p) => {
    const city = p.city?.trim();
    if (!city) return acc;
    if (!acc[city]) acc[city] = [];
    acc[city].push(p);
    return acc;
  }, {});
  const villesCouvertes = Object.keys(providers.reduce((acc, p) => {
    if (p.city?.trim()) acc[p.city.trim()] = true;
    return acc;
  }, {})).sort((a, b) => a.localeCompare(b, "fr"));

  const RESEAU_STATS = [
    { value: `${providers.length}+`, label: "Établissements",                icon: "🏥" },
    { value: `${villesCouvertes.length}`, label: "Villes couvertes",         icon: "📍" },
    { value: "48h",  label: "Délai remboursement hors réseau", icon: "⚡" },
    { value: "0 F",  label: "Avance de frais dans le réseau",  icon: "💳" },
  ];

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, ${C.slate} 0%, ${C.green} 100%)`,
        padding: "140px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: `radial-gradient(circle at 70% 30%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Réseau de soins</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.15 }}>
            Soignez-vous partout<br /><span style={{ color: C.gold }}>en Côte d'Ivoire</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.75 }}>
            {providers.length > 0 ? `${providers.length} établissements partenaires` : "Nos établissements partenaires"} dans {villesCouvertes.length || "plusieurs"} villes vous accueillent avec votre carte Mansa, sans avance de frais.
          </p>
        </div>
      </section>

      {/* ── STATS RÉSEAU ─────────────────────────────────────── */}
      <div style={{ background: C.white, borderBottom: `1.5px solid ${C.greenPale}` }}>
        <div className="awj-grid-4" style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 24px", gap: 24 }}>
          {RESEAU_STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: 30, color: C.green, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.gray, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARTE INTERACTIVE ────────────────────────────────── */}
      <section style={{ background: C.cream, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Carte interactive</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", color: C.slate, margin: "0 0 28px" }}>
              Trouvez un établissement proche de vous
            </h2>
            {/* Filtres */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
              {typeFilters.map(t => (
                <button key={t.id} onClick={() => setFilter(t.id)} style={{
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                  padding: "9px 20px", borderRadius: 22, cursor: "pointer",
                  background: filter === t.id ? C.green : C.white,
                  color: filter === t.id ? "#FFFFFF" : C.slate,
                  border: `1.5px solid ${filter === t.id ? C.green : "#E2E8F0"}`,
                  transition: "all .15s",
                }}>
                  {t.id !== "all" && TYPE_CONFIG[t.id] ? `${TYPE_CONFIG[t.id].icon} ` : ""}{t.label}
                </button>
              ))}
            </div>
            {/* Barre de recherche */}
            <div style={{ maxWidth: 400, margin: "0 auto" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un établissement..."
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: 10,
                  border: "1.5px solid #E2E8F0", fontFamily: "Inter, sans-serif",
                  fontSize: 14, color: C.slate, boxSizing: "border-box", outline: "none",
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.gray, fontFamily: "Inter, sans-serif" }}>
              Chargement du réseau…
            </div>
          ) : loadError ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.gray, fontFamily: "Inter, sans-serif" }}>
              Impossible de charger le réseau pour le moment. Réessayez plus tard.
            </div>
          ) : (
            <>
              {/* Carte — un marqueur par ville regroupant les établissements */}
              <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", height: "min(520px, 65vh)", marginBottom: 32 }}>
                <MapContainer center={[7.5, -5.5]} zoom={7} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {Object.entries(byCity).map(([city, list]) => {
                    const coords = CITY_COORDS[city];
                    if (!coords) return null;
                    return (
                      <Marker key={city} position={coords}>
                        <Popup>
                          <div style={{ fontFamily: "Inter, sans-serif", minWidth: 160 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: C.slate, marginBottom: 6 }}>{city}</div>
                            <div style={{ fontSize: 12, color: C.gray, marginBottom: 6 }}>{list.length} établissement{list.length > 1 ? "s" : ""}</div>
                            {list.slice(0, 6).map(p => (
                              <div key={p.id} style={{ fontSize: 12, color: TYPE_CONFIG[p.type]?.color || C.green, marginBottom: 2 }}>
                                {TYPE_CONFIG[p.type]?.icon} {p.name}
                              </div>
                            ))}
                            {list.length > 6 && (
                              <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>+ {list.length - 6} autre(s)</div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Liste résultats */}
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, marginBottom: 16 }}>
                {filtered.length} établissement{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontFamily: "Inter, sans-serif" }}>
                  Aucun établissement ne correspond à votre recherche.
                </div>
              ) : (
                <div className="awj-grid-3" style={{ gap: 16 }}>
                  {filtered.map(p => (
                    <div key={p.id} style={{
                      background: C.white, borderRadius: 14, padding: "18px 20px",
                      border: `1.5px solid ${C.greenPale}`, display: "flex", gap: 14, alignItems: "flex-start",
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: `${TYPE_CONFIG[p.type]?.color || C.green}15`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      }}>{TYPE_CONFIG[p.type]?.icon || "🏥"}</div>
                      <div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: TYPE_CONFIG[p.type]?.color || C.green, fontWeight: 600, marginBottom: 4 }}>{TYPE_CONFIG[p.type]?.label || p.type}</div>
                        {(p.address || p.commune || p.city) && (
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray, marginBottom: 2 }}>
                            📍 {[p.address, p.commune, p.city].filter(Boolean).join(", ")}
                          </div>
                        )}
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray }}>✓ Carte Mansa acceptée</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── VILLES COUVERTES ─────────────────────────────────── */}
      <section style={{ background: C.white, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Couverture nationale</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: C.slate, margin: "0 0 36px" }}>
            {villesCouvertes.length > 0 ? `Présents dans ${villesCouvertes.length} ville${villesCouvertes.length > 1 ? "s" : ""} de Côte d'Ivoire` : "Un réseau en pleine croissance"}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {villesCouvertes.map(v => (
              <span key={v} style={{
                fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
                color: C.green, background: C.greenPale,
                padding: "8px 18px", borderRadius: 22,
                border: `1.5px solid ${C.green}25`,
              }}>📍 {v}</span>
            ))}
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, marginTop: 24 }}>
            Notre réseau s'agrandit chaque trimestre. Vous ne trouvez pas votre ville ?{" "}
            <Link to="/contact" style={{ color: C.green, fontWeight: 600, textDecoration: "none" }}>Contactez-nous</Link>
          </p>
        </div>
      </section>

      {/* ── POUR LES ÉTABLISSEMENTS ──────────────────────────── */}
      <section style={{ background: C.greenPale, padding: "80px 24px", borderTop: `1.5px solid ${C.greenPale}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🏥</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: C.slate, margin: "0 0 14px" }}>
            Vous êtes un établissement de santé ?
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.gray, lineHeight: 1.75, marginBottom: 28, maxWidth: 560, margin: "0 auto 28px" }}>
            Rejoignez le réseau Awoundjô, accueillez nos adhérents et bénéficiez d'une facturation directe et de remboursements rapides.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/etablissement/login" style={{
              background: C.green, color: "#FFFFFF",
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 28px", borderRadius: 10, textDecoration: "none",
            }}>Accéder à l'espace établissement →</Link>
            <Link to="/contact" style={{
              background: "transparent", color: C.green,
              fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
              padding: "13px 24px", borderRadius: 10, textDecoration: "none",
              border: `1.5px solid ${C.green}`,
            }}>Nous contacter</Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
