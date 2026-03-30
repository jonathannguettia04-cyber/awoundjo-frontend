// src/pages/client/ClientCotisations.jsx
// ─────────────────────────────────────────────────────────────
//  Page Cotisations — Portail Client Awoundjô
//  Affiche l'historique des paiements + permet de payer
//  la mensualité en cours via Wave (lien direct)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import WavePayButton from "../../components/WavePayButton";

// ── Palette portail client ────────────────────────────────────
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

// Prix mensuel par plan
const PLAN_PRICES = {
  ESSENTIELLE: 10000,
  IVOIRIENNE:  15000,
  TURQUOISE:   35000,
};

// Lien Wave marchand Awoundjô
const WAVE_BASE = "https://pay.wave.com/m/M_Sh7TOpfh6ALd/c/ci/";

function buildWaveLink(amount, clientName, mutualNumber) {
  const msg = `Mensualite Awoundjo - ${clientName} (${mutualNumber})`;
  return `${WAVE_BASE}?amount=${amount}&message=${encodeURIComponent(msg)}`;
}

// ── Helpers UI ────────────────────────────────────────────────
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

// Statut de paiement → couleur + label
function statusStyle(status) {
  if (status === "payé"   || status === "paid")    return { color: C.primary, bg: C.primaryL, label: "✅ Payé"        };
  if (status === "attente"|| status === "pending")  return { color: C.gold,    bg: C.goldL,    label: "⏳ En attente"  };
  if (status === "retard" || status === "overdue")  return { color: C.red,     bg: C.redL,     label: "🔴 En retard"   };
  return                                                   { color: C.slate,   bg: C.bg,       label: status           };
}

// ── Composant principal ───────────────────────────────────────
export default function ClientCotisations() {
  const [client,     setClient]     = useState(null);
  const [cotisations,setCotisations]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [waveOpen,   setWaveOpen]   = useState(false); // modal Wave ouvert
  const [wavePaid,   setWavePaid]   = useState(false); // confirmation après paiement Wave

  useEffect(() => {
    // Charger données client + historique cotisations
    const token = localStorage.getItem("client_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const base = import.meta.env.VITE_API_URL || "http://localhost:3001";

    Promise.all([
      fetch(`${base}/api/client/me`,          { headers }).then(r => r.json()),
      fetch(`${base}/api/client/cotisations`,  { headers }).then(r => r.json()),
    ]).then(([me, cots]) => {
      setClient(me.client || me);
      setCotisations(cots.cotisations || cots.payments || []);
    }).catch(() => {
      // Données de démo si API non disponible
      setClient({
        name:          "Jean Koua",
        mutual_number: "AWJ-2024-0042",
        plan:          "IVOIRIENNE",
        status:        "actif",
      });
      setCotisations([
        { id:1, month:"Décembre 2024", amount:15000, status:"payé",    paid_at:"2024-12-05", method:"wave"  },
        { id:2, month:"Janvier 2025",  amount:15000, status:"payé",    paid_at:"2025-01-07", method:"wave"  },
        { id:3, month:"Février 2025",  amount:15000, status:"payé",    paid_at:"2025-02-04", method:"wave"  },
        { id:4, month:"Mars 2025",     amount:15000, status:"attente", paid_at:null,         method:null    },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const plan      = client?.plan || "IVOIRIENNE";
  const monthly   = PLAN_PRICES[plan] || 15000;
  const waveLink  = buildWaveLink(monthly, client?.name || "", client?.mutual_number || "");

  // Dernière cotisation non payée = cotisation en cours
  const pending   = cotisations.find(c => c.status === "attente" || c.status === "pending");
  const totalPaid = cotisations
    .filter(c => c.status === "payé" || c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const handleWaveClick = () => {
    setWaveOpen(true);
    setWavePaid(false);
  };

  const handleWaveConfirm = () => {
    setWavePaid(true);
    // Mettre à jour localement en attendant le webhook serveur
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
              // ── Confirmation réussie ──
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
              // ── Instructions Wave ──
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg,#1DC9A4,#15A882)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                  }}>🌊</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 17, color: C.dark }}>
                      Payer avec Wave
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
                      Cotisation mensuelle Awoundjô
                    </p>
                  </div>
                </div>

                {/* Récap paiement */}
                <div style={{
                  background: C.waveL, border: `1.5px solid ${C.wave}`,
                  borderRadius: 12, padding: "14px 16px", marginBottom: 20,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.slate }}>Adhérent</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{client?.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.slate }}>N° mutualiste</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.dark, fontFamily: "monospace" }}>
                      {client?.mutual_number}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.slate }}>Plan</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{plan}</span>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    paddingTop: 10, borderTop: `1px solid ${C.wave}44`,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>Montant à payer</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: C.wave }}>{fmt(monthly)}</span>
                  </div>
                </div>

                {/* Étapes */}
                <div style={{ marginBottom: 20 }}>
                  {[
                    "Cliquez sur le bouton Wave ci-dessous",
                    `Payez ${fmt(monthly)} à Awoundjô`,
                    "Revenez ici et confirmez votre paiement",
                  ].map((s, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      marginBottom: 8,
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 99,
                        background: C.wave, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 900, flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <p style={{ margin: 0, fontSize: 13, color: C.dark }}>{s}</p>
                    </div>
                  ))}
                </div>

                {/* Bouton Wave + fallback copier-coller */}
                <WavePayButton
                  amount={monthly}
                  message={`Mensualite Awoundjo - ${client?.name || ""} (${client?.mutual_number || ""})`}
                  label={`Ouvrir Wave — ${fmt(monthly)}`}
                  size="lg"
                />

                {/* Bouton confirmation */}
                <button
                  onClick={handleWaveConfirm}
                  style={{
                    width: "100%", padding: "12px 0",
                    background: C.primaryL,
                    color: C.primary, fontWeight: 700, fontSize: 14,
                    border: `1.5px solid ${C.primary}`,
                    borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                    marginBottom: 10,
                  }}
                >
                  ✅ J'ai payé — Confirmer
                </button>

                {/* Fermer */}
                <button
                  onClick={() => setWaveOpen(false)}
                  style={{
                    width: "100%", padding: "10px 0",
                    background: "none", border: "none",
                    color: C.slate, fontSize: 13, cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Titre page ──────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.dark }}>
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
          <Badge
            label={`Plan ${plan}`}
            color={C.primary} bg={C.primaryL}
          />
          <Badge
            label={fmt(monthly) + " / mois"}
            color={C.blue} bg={C.blueL}
          />
        </div>
      </Card>

      {/* ── Cartes résumé ───────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          {
            icon: "✅", label: "Total payé",
            value: fmt(totalPaid), color: C.primary, bg: C.primaryL,
          },
          {
            icon: "📅", label: "Mensualité",
            value: fmt(monthly), color: C.blue, bg: C.blueL,
          },
          {
            icon: "🧾", label: "Paiements",
            value: `${cotisations.filter(c => c.status==="payé"||c.status==="paid").length} / ${cotisations.length}`,
            color: C.gold, bg: C.goldL,
          },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center", padding: "16px 12px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 28 }}>{s.icon}</p>
            <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.slate, fontWeight: 600 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Cotisation en cours ─────────────────────────────── */}
      {pending && (
        <Card style={{
          marginBottom: 20,
          border: `2px solid ${C.wave}`,
          background: C.waveL,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: C.slate, fontWeight: 600 }}>
                COTISATION EN COURS
              </p>
              <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 900, color: C.dark }}>
                {pending.month}
              </p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.wave }}>
                {fmt(pending.amount || monthly)}
              </p>
            </div>

            {/* Bouton Wave */}
            <button
              onClick={handleWaveClick}
              style={{
                padding: "12px 22px",
                background: "linear-gradient(135deg,#1DC9A4,#15A882)",
                color: "#fff", fontWeight: 900, fontSize: 14,
                border: "none", borderRadius: 12,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 16px rgba(29,201,164,.4)",
                flexShrink: 0,
              }}
            >
              🌊 Payer avec Wave
            </button>
          </div>

          {/* Barre d'info */}
          <div style={{
            marginTop: 14, paddingTop: 12,
            borderTop: `1px solid ${C.wave}44`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>ℹ️</span>
            <p style={{ margin: 0, fontSize: 12, color: C.slate }}>
              Le lien Wave s'ouvrira directement dans votre application Wave CI.
              Payez exactement <strong>{fmt(pending.amount || monthly)}</strong> et revenez confirmer.
            </p>
          </div>
        </Card>
      )}

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
                  {/* Mois + date */}
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
                          <span style={{ marginLeft: 6, color: C.wave, fontWeight: 700 }}>
                            · 🌊 Wave
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Montant + statut + bouton Wave si en attente */}
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

      {/* ── Note de bas de page ─────────────────────────────── */}
      <p style={{ textAlign: "center", fontSize: 12, color: C.slate, marginTop: 20 }}>
        🔒 Paiements sécurisés · Awoundjô Mutuelle Santé CI<br />
        En cas de problème : <strong>+225 XX XX XX XX</strong>
      </p>
    </div>
  );
}
