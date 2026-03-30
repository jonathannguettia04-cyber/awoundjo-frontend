// src/pages/client/ClientCotisations.jsx
import { useState, useEffect } from "react";
import WavePayButton from "../../components/WavePayButton";

const C = {
  primary: "#059669", primaryL: "#ECFDF5",
  blue:    "#1B4FD8", blueL:    "#EEF2FF",
  gold:    "#D97706", goldL:    "#FFFBEB",
  red:     "#DC2626", redL:     "#FEF2F2",
  slate:   "#64748B", dark:     "#0F172A",
  border:  "#E2E8F0", bg:       "#F8FAFC",
  wave:    "#1DC9A4", waveL:    "#F0FDF9",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })
  : "—";

const PLAN_PRICES = {
  ESSENTIELLE: 10000,
  IVOIRIENNE:  15000,
  TURQUOISE:   35000,
};

const WAVE_BASE = "https://pay.wave.com/m/M_Sh7TOpfh6ALd/c/ci/";

function buildWaveLink(amount, clientName, mutualNumber) {
  const msg = `Mensualite Awoundjo - ${clientName} (${mutualNumber})`;
  return `${WAVE_BASE}?amount=${amount}&message=${encodeURIComponent(msg)}`;
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      background: bg, color, padding: "3px 12px",
      borderRadius: 999, fontSize: 11, fontWeight: 700,
    }}>
      {label}
    </span>
  );
}

function Loader() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"48px 0" }}>
      <div style={{
        width: 36, height: 36,
        border: `3px solid ${C.primaryL}`,
        borderTop: `3px solid ${C.primary}`,
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function statusStyle(status) {
  if (status === "payé"   || status === "paid")    return { color: C.primary, bg: C.primaryL, label: "✅ Payé"        };
  if (status === "attente"|| status === "pending")  return { color: C.gold,    bg: C.goldL,    label: "⏳ En attente"  };
  if (status === "retard" || status === "overdue")  return { color: C.red,     bg: C.redL,     label: "🔴 En retard"   };
  return                                                   { color: C.slate,   bg: C.bg,       label: status           };
}

export default function ClientCotisations() {
  const [client,      setClient]      = useState(null);
  const [cotisations, setCotisations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [waveOpen,    setWaveOpen]    = useState(false);
  const [wavePaid,    setWavePaid]    = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("client_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const base = import.meta.env.VITE_API_URL || "http://localhost:3001";

    Promise.all([
      fetch(`${base}/api/client/me`,         { headers }).then(r => r.json()),
      fetch(`${base}/api/client/cotisations`, { headers }).then(r => r.json()),
    ]).then(([me, cots]) => {
      setClient(me.client || me);
      setCotisations(cots.cotisations || cots.payments || []);
    }).catch(() => {
      setClient({
        name:          "Jean Koua",
        mutual_number: "AWJ-2024-0042",
        plan:          "IVOIRIENNE",
        status:        "actif",
      });
      setCotisations([
        { id:1, month:"Décembre 2024", amount:15000, status:"payé",    paid_at:"2024-12-05", method:"wave" },
        { id:2, month:"Janvier 2025",  amount:15000, status:"payé",    paid_at:"2025-01-07", method:"wave" },
        { id:3, month:"Février 2025",  amount:15000, status:"payé",    paid_at:"2025-02-04", method:"wave" },
        { id:4, month:"Mars 2025",     amount:15000, status:"payé",    paid_at:"2025-03-01", method:"wave" },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const plan     = client?.plan || "IVOIRIENNE";
  const monthly  = PLAN_PRICES[plan] || 15000;
  const waveLink = buildWaveLink(monthly, client?.name || "", client?.mutual_number || "");

  const pending   = cotisations.find(c => c.status === "attente" || c.status === "pending");
  const paidCount = cotisations.filter(c => c.status === "payé" || c.status === "paid").length;
  const totalPaid = cotisations
    .filter(c => c.status === "payé" || c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  // ── Calcul mois d'avance ────────────────────────────────────
  // On considère que chaque paiement "payé" couvre 1 mois.
  // Le mois courant = mois actuel de l'année en cours.
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear  = now.getFullYear();

  // On estime le nombre de mois attendus depuis le début (premier paiement)
  const firstPaid = cotisations
    .filter(c => c.status === "payé" || c.status === "paid")
    .sort((a, b) => new Date(a.paid_at) - new Date(b.paid_at))[0];

  let monthsAhead = 0;
  if (firstPaid && paidCount > 0) {
    const start = new Date(firstPaid.paid_at);
    const monthsElapsed =
      (currentYear - start.getFullYear()) * 12 + (currentMonth - start.getMonth()) + 1;
    monthsAhead = paidCount - monthsElapsed;
  }

  const isUpToDate = !pending && paidCount > 0;

  const handleWaveClick = () => { setWaveOpen(true); setWavePaid(false); };

  const handleWaveConfirm = () => {
    setWavePaid(true);
    setCotisations(prev => prev.map(c =>
      (c.status === "attente" || c.status === "pending")
        ? { ...c, status:"payé", paid_at: new Date().toISOString(), method:"wave" }
        : c
    ));
    setTimeout(() => setWaveOpen(false), 2000);
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 720, margin: "0 auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Modal Wave ─────────────────────────────────────── */}
      {waveOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: 28,
            maxWidth: 420, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            {wavePaid ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: C.dark }}>
                  Paiement confirmé !
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: C.slate }}>
                  Votre cotisation de {fmt(monthly)} a été enregistrée.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg,#1DC9A4,#15A882)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                  }}>🌊</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 17, color: C.dark }}>Payer avec Wave</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
                      {fmt(monthly)} · Mensualité Awoundjô
                    </p>
                  </div>
                </div>

                <div style={{ background: C.waveL, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: C.slate, fontWeight: 600 }}>
                    Instructions :
                  </p>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.dark, lineHeight: 1.8 }}>
                    <li>Cliquez sur <strong>"Ouvrir Wave"</strong></li>
                    <li>Payez exactement <strong>{fmt(monthly)}</strong></li>
                    <li>Revenez et cliquez <strong>"J'ai payé"</strong></li>
                  </ol>
                </div>

                <a
                  href={waveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block", width: "100%", textAlign: "center",
                    background: "linear-gradient(135deg,#1DC9A4,#15A882)",
                    color: "#fff", fontWeight: 900, fontSize: 15,
                    padding: "14px 0", borderRadius: 12,
                    textDecoration: "none", marginBottom: 12,
                    boxShadow: "0 4px 16px rgba(29,201,164,.4)",
                  }}
                >
                  🌊 Ouvrir Wave — {fmt(monthly)}
                </a>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setWaveOpen(false)}
                    style={{
                      flex: 1, padding: "12px 0", border: `1px solid ${C.border}`,
                      borderRadius: 12, background: "#fff", color: C.slate,
                      fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleWaveConfirm}
                    style={{
                      flex: 2, padding: "12px 0",
                      background: "linear-gradient(135deg,#059669,#047857)",
                      border: "none", borderRadius: 12, color: "#fff",
                      fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    ✅ J'ai payé
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Titre ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.dark, letterSpacing: -.3 }}>
          💳 Mes cotisations
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: C.slate }}>
          Suivi de vos paiements mensuels Awoundjô
        </p>
      </div>

      {/* ── Carte info client ───────────────────────────────── */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: C.dark }}>{client?.name}</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: C.slate, fontFamily: "monospace" }}>
            {client?.mutual_number}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge label={`Plan ${plan}`}            color={C.primary} bg={C.primaryL} />
          <Badge label={fmt(monthly) + " / mois"}  color={C.blue}    bg={C.blueL}    />
        </div>
      </Card>

      {/* ── Cartes résumé ───────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { icon: "✅", label: "Total payé",   value: fmt(totalPaid),                                              color: C.primary, bg: C.primaryL },
          { icon: "📅", label: "Mensualité",   value: fmt(monthly),                                                color: C.blue,    bg: C.blueL    },
          { icon: "🧾", label: "Paiements",    value: `${paidCount} / ${cotisations.length}`,                     color: C.gold,    bg: C.goldL    },
          { icon: "⏩", label: "Mois d'avance",value: monthsAhead > 0 ? `+${monthsAhead} mois` : "À jour",       color: monthsAhead > 0 ? C.primary : C.slate, bg: monthsAhead > 0 ? C.primaryL : C.bg },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center", padding: "16px 12px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 28 }}>{s.icon}</p>
            <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.slate, fontWeight: 600 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Bloc paiement — TOUJOURS VISIBLE ────────────────── */}
      <Card style={{
        marginBottom: 20,
        border: `2px solid ${isUpToDate ? C.primary : C.wave}`,
        background: isUpToDate ? C.primaryL : C.waveL,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: C.slate, fontWeight: 600 }}>
              {isUpToDate ? "COTISATION — PAYER EN AVANCE" : "COTISATION EN COURS"}
            </p>

            {/* Badge "À jour" si pas de pending */}
            {isUpToDate && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.primary, borderRadius: 20, padding: "4px 12px", marginBottom: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>À JOUR</span>
              </div>
            )}

            {pending && (
              <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 900, color: C.dark }}>
                {pending.month}
              </p>
            )}

            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: isUpToDate ? C.primary : C.wave }}>
              {fmt(pending?.amount || monthly)}
            </p>

            {monthsAhead > 0 && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.primary, fontWeight: 600 }}>
                ⏩ Vous êtes en avance de <strong>{monthsAhead} mois</strong>
              </p>
            )}
          </div>

          {/* Bouton Wave — toujours visible */}
          <button
            onClick={handleWaveClick}
            style={{
              padding: "12px 22px",
              background: isUpToDate
                ? "linear-gradient(135deg,#059669,#047857)"
                : "linear-gradient(135deg,#1DC9A4,#15A882)",
              color: "#fff", fontWeight: 900, fontSize: 14,
              border: "none", borderRadius: 12,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: isUpToDate
                ? "0 4px 16px rgba(5,150,105,.4)"
                : "0 4px 16px rgba(29,201,164,.4)",
              flexShrink: 0,
            }}
          >
            🌊 {isUpToDate ? "Payer en avance" : "Payer avec Wave"}
          </button>
        </div>

        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: `1px solid ${isUpToDate ? C.primary : C.wave}44`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 12, color: C.slate }}>
            {isUpToDate
              ? "Votre cotisation est à jour. Vous pouvez payer des mois à l'avance pour rester serein."
              : `Le lien Wave s'ouvrira directement dans votre app. Payez exactement ${fmt(pending?.amount || monthly)} et revenez confirmer.`
            }
          </p>
        </div>
      </Card>

      {/* ── Historique des cotisations ──────────────────────── */}
      <Card>
        <p style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 15, color: C.dark }}>
          📋 Historique des paiements
        </p>

        {cotisations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 36, margin: "0 0 10px" }}>🧾</p>
            <p style={{ margin: 0, color: C.slate, fontSize: 14 }}>Aucun historique disponible</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {cotisations.map((cot, i) => {
              const s = statusStyle(cot.status);
              const isPending = cot.status === "attente" || cot.status === "pending";
              return (
                <div
                  key={cot.id || i}
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 4px",
                    borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                    flexWrap: "wrap", gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: isPending ? C.goldL : C.primaryL,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {isPending ? "⏳" : "✅"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.dark }}>
                        {cot.month}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>
                        {cot.paid_at ? `Payé le ${fmtDate(cot.paid_at)}` : "Non payé"}
                        {cot.method === "wave" && (
                          <span style={{ marginLeft: 6, color: C.wave, fontWeight: 700 }}>· 🌊 Wave</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: isPending ? C.gold : C.primary }}>
                      {fmt(cot.amount || monthly)}
                    </span>
                    <Badge label={s.label} color={s.color} bg={s.bg} />
                    {isPending && (
                      <button
                        onClick={handleWaveClick}
                        style={{
                          padding: "6px 14px",
                          background: "linear-gradient(135deg,#1DC9A4,#15A882)",
                          color: "#fff", fontWeight: 700, fontSize: 12,
                          border: "none", borderRadius: 8,
                          cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        🌊 Payer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p style={{ textAlign: "center", fontSize: 12, color: C.slate, marginTop: 20 }}>
        🔒 Paiements sécurisés · Awoundjô Mutuelle Santé CI<br />
        En cas de problème : <strong>+225 XX XX XX XX</strong>
      </p>
    </div>
  );
}
