// src/pages/public/Reseau.jsx
import { useState } from "react";
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
import { C, PROVIDERS } from "../../data/constants";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TYPE_CONFIG = {
  Clinique:     { color: C.green,   icon: "🏥" },
  Hôpital:      { color: "#0E7490", icon: "🏨" },
  Pharmacie:    { color: C.gold,    icon: "💊" },
  Laboratoire:  { color: "#7C3AED", icon: "🔬" },
  Dentiste:     { color: "#DB2777", icon: "🦷" },
};

const VILLES = ["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro", "Korhogo", "Man", "Daloa", "Gagnoa", "Abengourou", "Divo", "Soubré", "Grand-Bassam"];

const RESEAU_STATS = [
  { value: "120+", label: "Établissements", icon: "🏥" },
  { value: "12",   label: "Villes couvertes", icon: "📍" },
  { value: "48h",  label: "Délai remboursement hors réseau", icon: "⚡" },
  { value: "0 F",  label: "Avance de frais dans le réseau", icon: "💳" },
];

export default function Reseau() {
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");

  const types = ["Tous", "Clinique", "Hôpital", "Pharmacie", "Laboratoire"];
  const filtered = PROVIDERS.filter(p => {
    const typeOk = filter === "Tous" || p.type === filter;
    const searchOk = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return typeOk && searchOk;
  });

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(150deg, #0A2E18 0%, ${C.green} 100%)`,
        padding: "140px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: `radial-gradient(circle at 70% 30%, ${C.gold} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 16, textTransform: "uppercase" }}>Réseau de soins</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#FFFFFF", margin: "0 0 20px", lineHeight: 1.15 }}>
            Soignez-vous partout<br /><span style={{ color: C.gold }}>en Côte d'Ivoire</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#A8CDB8", lineHeight: 1.75 }}>
            120+ établissements partenaires dans 12 villes vous accueillent avec votre carte Mansa, sans avance de frais.
          </p>
        </div>
      </section>

      {/* ── STATS RÉSEAU ─────────────────────────────────────── */}
      <div style={{ background: C.white, borderBottom: "1.5px solid #EBF5F0" }}>
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
              {types.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                  padding: "9px 20px", borderRadius: 22, cursor: "pointer",
                  background: filter === t ? C.green : C.white,
                  color: filter === t ? "#FFFFFF" : C.slate,
                  border: `1.5px solid ${filter === t ? C.green : "#E2E8F0"}`,
                  transition: "all .15s",
                }}>
                  {t !== "Tous" && TYPE_CONFIG[t] ? `${TYPE_CONFIG[t].icon} ` : ""}{t}
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

          {/* Carte */}
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", height: "min(520px, 65vh)", marginBottom: 32 }}>
            <MapContainer center={[5.345, -4.008]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map(p => (
                <Marker key={p.name} position={[p.lat, p.lng]}>
                  <Popup>
                    <div style={{ fontFamily: "Inter, sans-serif", minWidth: 140 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.slate, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: TYPE_CONFIG[p.type]?.color || C.green, fontWeight: 600 }}>
                        {TYPE_CONFIG[p.type]?.icon} {p.type}
                      </div>
                      <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>✓ Carte Mansa acceptée</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Liste résultats */}
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.gray, marginBottom: 16 }}>
            {filtered.length} établissement{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </div>
          <div className="awj-grid-3" style={{ gap: 16 }}>
            {filtered.map(p => (
              <div key={p.name} style={{
                background: C.white, borderRadius: 14, padding: "18px 20px",
                border: "1.5px solid #EBF5F0", display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${TYPE_CONFIG[p.type]?.color || C.green}15`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{TYPE_CONFIG[p.type]?.icon || "🏥"}</div>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: C.slate, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: TYPE_CONFIG[p.type]?.color || C.green, fontWeight: 600, marginBottom: 4 }}>{p.type}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.gray }}>✓ Carte Mansa acceptée</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VILLES COUVERTES ─────────────────────────────────── */}
      <section style={{ background: C.white, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 14, textTransform: "uppercase" }}>Couverture nationale</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: C.slate, margin: "0 0 36px" }}>
            Présents dans 12 villes de Côte d'Ivoire
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {VILLES.map(v => (
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
      <section style={{ background: C.greenPale, padding: "80px 24px", borderTop: "1.5px solid #DCF0E5" }}>
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
