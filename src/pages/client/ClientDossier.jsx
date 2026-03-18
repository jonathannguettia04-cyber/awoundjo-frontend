// src/pages/client/ClientDossier.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientMedicalAPI, PLANS } from "../../clientApi";

const PLAN_COLOR = { ESSENTIELLE: "#1D4ED8", IVOIRIENNE: "#059669", TURQUOISE: "#0891B2" };
const STATUS_LABEL = {
  active:           { label: "Actif",      color: "#059669", bg: "#ECFDF5" },
  attente:          { label: "En attente", color: "#D97706", bg: "#FFFBEB" },
  suspendu:         { label: "Suspendu",   color: "#DC2626", bg: "#FEF2F2" },
  renewal_required: { label: "À renouveler", color: "#D97706", bg: "#FFFBEB" },
};

export default function ClientDossier() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVis]     = useState(false);
  const [section, setSection] = useState("identity"); // identity | famille | couverture

  useEffect(() => {
    clientMedicalAPI.get()
      .then(res => { setData(res.data.data); setTimeout(() => setVis(true), 100); })
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data)   return null;

  const { client, dependents, stats } = data;
  const plan      = PLANS[client.plan] || PLANS.ESSENTIELLE;
  const planColor = PLAN_COLOR[client.plan] || "#1D4ED8";
  const status    = STATUS_LABEL[client.status] || STATUS_LABEL.active;
  const spouse    = dependents.filter(d => d.type === "spouse");
  const children  = dependents.filter(d => d.type === "child");

  const expiry = client.expiration_date
    ? new Date(client.expiration_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const regDate = client.registration_date
    ? new Date(client.registration_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Mon Dossier</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Informations de votre adhésion</p>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, ${planColor}, #1e3a8a)`,
        borderRadius: 24, padding: "22px 20px", color: "#fff",
        marginBottom: 16, position: "relative", overflow: "hidden",
        boxShadow: `0 12px 40px ${planColor}50`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, position: "relative" }}>
          <div style={{ width: 60, height: 60, background: "rgba(255,255,255,.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, border: "2px solid rgba(255,255,255,.3)", overflow: "hidden", flexShrink: 0 }}>
            {client.photo
              ? <img src={client.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : client.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 3px", letterSpacing: -.3 }}>{client.name}</h2>
            <p style={{ fontSize: 12, opacity: .75, margin: 0, fontFamily: "monospace", letterSpacing: 1.5 }}>{client.mutual_number}</p>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 12px", border: "1px solid rgba(255,255,255,.2)", flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: client.status === "active" ? "#10B981" : "#F59E0B", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>{status.label}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,.12)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)", position: "relative" }}>
          {[
            { label: "Formule",   value: plan.name },
            { label: "Couverture", value: plan.coverage },
            { label: "Expire",    value: expiry.split(" ").slice(0, 2).join(" ") },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: "12px 8px", borderRight: i < 2 ? "1px solid rgba(255,255,255,.15)" : "none", textAlign: "center" }}>
              <p style={{ fontSize: 10, opacity: .7, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: .8 }}>{item.label}</p>
              <p style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats rapides ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "all .5s .1s" }}>
        {[
          { icon: "👥", val: 1 + dependents.length, label: "Bénéficiaires", color: "#1D4ED8", bg: "#EFF6FF" },
          { icon: "💰", val: `${parseInt(stats.total).toLocaleString("fr-FR")}`, label: "FCFA payés", color: "#059669", bg: "#ECFDF5" },
          { icon: "🧾", val: stats.count, label: "Paiements", color: "#7C3AED", bg: "#F5F3FF" },
        ].map((st, i) => (
          <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 14, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: `1.5px solid ${st.bg}` }}>
            <span style={{ fontSize: 20 }}>{st.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: st.color }}>{st.val}</span>
            <span style={{ fontSize: 10, color: "#94A3B8", textAlign: "center", fontWeight: 500 }}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 14, padding: 4, marginBottom: 16, opacity: visible ? 1 : 0, transition: "all .5s .15s" }}>
        {[
          { id: "identity",  label: "👤 Identité" },
          { id: "famille",   label: "👨‍👩‍👧‍👦 Famille" },
          { id: "couverture",label: "🏥 Couverture" },
        ].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} style={{
            flex: 1, padding: "9px 4px", border: "none", borderRadius: 10,
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", transition: "all .2s",
            background: section === t.id ? "#fff" : "transparent",
            color: section === t.id ? "#1a56db" : "#64748B",
            boxShadow: section === t.id ? "0 2px 8px rgba(0,0,0,.08)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Section Identité ── */}
      {section === "identity" && (
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.06)" }}>
          {[
            { icon: "📱", label: "Téléphone",        val: client.phone       || "—" },
            { icon: "🏙️", label: "Ville",            val: client.city        || "—" },
            { icon: "🎂", label: "Date de naissance", val: client.birth_date ? new Date(client.birth_date).toLocaleDateString("fr-FR") : "—" },
            { icon: "📍", label: "Lieu de naissance", val: client.birth_place || "—" },
            { icon: "📅", label: "Date d'adhésion",   val: regDate },
            { icon: "⏳", label: "Date d'expiration", val: expiry },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ width: 38, height: 38, background: "#F8FAFC", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: .6 }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: "2px 0 0" }}>{item.val}</p>
              </div>
            </div>
          ))}
          {client.piece && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px" }}>
              <div style={{ width: 38, height: 38, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📄</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: .6 }}>Pièce d'identité</p>
                <a href={client.piece} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "#1D4ED8", textDecoration: "none" }}>📎 Voir le document</a>
              </div>
            </div>
          )}
          {client.agent_name && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9" }}>
              <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#1a56db,#1e3a8a)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👨‍💼</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: .6 }}>Agent responsable</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "2px 0 0" }}>{client.agent_name}</p>
              </div>
              {client.agent_phone && (
                <a href={`tel:${client.agent_phone}`} style={{ background: "#EFF6FF", color: "#1D4ED8", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>📞</a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Section Famille ── */}
      {section === "famille" && (
        <div>
          {/* Souscripteur */}
          <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>Souscripteur</p>
          <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: "1.5px solid #DBEAFE" }}>
            <div style={{ width: 50, height: 50, background: `linear-gradient(135deg,${planColor},#1e3a8a)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
              {client.photo ? <img src={client.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : client.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 2px" }}>{client.name}</p>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Titulaire · {client.mutual_number}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", borderRadius: 8, padding: "4px 10px" }}>Titulaire</span>
          </div>

          {/* Conjoint */}
          {spouse.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>Conjoint(e)</p>
              {spouse.map(d => <DepCard key={d.id} dep={d} />)}
            </>
          )}

          {/* Enfants */}
          {children.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, marginBottom: 10, marginTop: 16 }}>Enfants</p>
              {children.map(d => <DepCard key={d.id} dep={d} />)}
            </>
          )}

          {dependents.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
              <span style={{ fontSize: 48 }}>👨‍👩‍👧‍👦</span>
              <p style={{ color: "#64748B", fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>Aucun bénéficiaire</p>
              <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>Ajoutez votre famille dans l'onglet Ma Famille</p>
            </div>
          )}
        </div>
      )}

      {/* ── Section Couverture ── */}
      {section === "couverture" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.06)", marginBottom: 16 }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #F1F5F9" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .8, margin: "0 0 12px" }}>Votre formule</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, background: `linear-gradient(135deg,${planColor},#1e3a8a)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏥</div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 2px" }}>{plan.name}</p>
                  <p style={{ fontSize: 13, color: planColor, fontWeight: 700, margin: 0 }}>{plan.coverage} de couverture médicale</p>
                </div>
              </div>
            </div>
            {[
              { icon: "🏥", label: "Consultations médicales",   val: "Couvert" },
              { icon: "💊", label: "Médicaments prescrits",     val: "Couvert" },
              { icon: "🔬", label: "Analyses et examens",       val: "Couvert" },
              { icon: "🚑", label: "Urgences médicales",        val: "Couvert" },
              { icon: "👨‍👩‍👧‍👦", label: "Bénéficiaires couverts", val: `${1 + dependents.length} personnes` },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div style={{ width: 36, height: 36, background: "#F8FAFC", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {item.icon}
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", background: "#ECFDF5", borderRadius: 8, padding: "4px 10px" }}>{item.val}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "1px solid #FCD34D", borderRadius: 16, padding: "16px 18px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", margin: "0 0 6px" }}>⚠️ Validité de la carte</p>
            <p style={{ fontSize: 13, color: "#B45309", margin: 0 }}>
              Votre carte est valide jusqu'au <strong>{expiry}</strong>. Pensez à renouveler votre adhésion avant cette date.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DepCard({ dep }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
      <div style={{ width: 50, height: 50, background: dep.type === "spouse" ? "#FDF2F8" : "#ECFDF5", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, overflow: "hidden", flexShrink: 0 }}>
        {dep.photo ? <img src={dep.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (dep.type === "spouse" ? "💑" : "👶")}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 2px" }}>{dep.firstname} {dep.name}</p>
        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
          {dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}
          {dep.birth_date ? ` · Né(e) le ${new Date(dep.birth_date).toLocaleDateString("fr-FR")}` : ""}
          {dep.birth_place ? ` à ${dep.birth_place}` : ""}
        </p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, background: dep.type === "spouse" ? "#FDF2F8" : "#ECFDF5", color: dep.type === "spouse" ? "#DB2777" : "#059669", borderRadius: 8, padding: "4px 10px" }}>
        {dep.type === "spouse" ? "Conjoint(e)" : "Enfant"}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: 16 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[180, 80, 40, 200].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 20, marginBottom: 14, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}
