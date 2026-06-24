// src/pages/public/Reseau.jsx
import { useState } from "react";
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

export default function Reseau() {
  const [filter, setFilter] = useState("Tous");
  const types = ["Tous", "Clinique", "Hôpital", "Pharmacie", "Laboratoire"];
  const filtered = filter === "Tous" ? PROVIDERS : PROVIDERS.filter(p => p.type === filter);

  return (
    <>
      <FontLoader />
      <Nav />
      <ResponsiveStyles />
      <section className="awj-page-pad awj-section" style={{ background: C.cream, padding: "140px 24px 96px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, color: C.gold, marginBottom: 12 }}>RÉSEAU DE SOINS</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: C.slate, margin: 0 }}>
              Nos établissements partenaires
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                padding: "8px 18px", borderRadius: 20, cursor: "pointer",
                background: filter === t ? C.green : C.white,
                color: filter === t ? C.white : C.slate,
                border: `1.5px solid ${filter === t ? C.green : "#E2E8F0"}`,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.10)", height: "min(480px, 60vh)" }}>
            <MapContainer center={[5.345, -4.008]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map(p => (
                <Marker key={p.name} position={[p.lat, p.lng]}>
                  <Popup>
                    <strong>{p.name}</strong><br />
                    <span style={{ color: C.green }}>{p.type}</span>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
