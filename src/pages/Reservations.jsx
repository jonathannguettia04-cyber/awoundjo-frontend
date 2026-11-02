import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ADMIN_BASE } from "../config/adminBase";

const API = import.meta.env.VITE_API_URL || "";

/* Mêmes tokens que Dashboard.jsx */
const BG = "#070f1e";
const SURFACE = "rgba(255,255,255,0.035)";
const SURFACE_HI = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_HI = "rgba(255,255,255,0.16)";
const TEXT = "#eef2f8";
const TEXT_MUTED = "#8ea0bd";
const TEXT_FAINT = "#4d5b78";
const BRAND_LT = "#5ba1e6";
const TEAL = "#1fd1bd";
const AMBER = "#f5a524";
const GOLD = "#D4A017";

const PAGE_SIZE = 50;

const fcfa = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

const waLink = (phone, name) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const msg = `Bonjour ${name || ""}, nous avons bien reçu votre réservation Awoundjô 2027. Merci pour votre confiance !`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
};

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function Reservations({ embedded = false, onClose }) {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("all"); // all | confirmed | pending
  const [formule, setFormule] = useState("all");

  const token = localStorage.getItem("token");

  function load(p = page) {
    setLoading(true);
    setError("");
    fetch(`${API}/api/payments/reservations?page=${p}&limit=${PAGE_SIZE}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const d = json?.data;
        if (!d) throw new Error(json?.message || "Réponse invalide");
        setRows(d.reservations || []);
        setTotal(d.total || 0);
      })
      .catch((e) => setError(e.message || "Impossible de charger les réservations"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page); /* eslint-disable-next-line */ }, [page]);

  const formules = useMemo(
    () => Array.from(new Set(rows.map((r) => r.formule_souhaitee).filter(Boolean))),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statut === "confirmed" && !r.confirmed) return false;
      if (statut === "pending" && r.confirmed) return false;
      if (formule !== "all" && r.formule_souhaitee !== formule) return false;
      if (!q) return true;
      return [r.name, r.phone, r.email, r.city].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [rows, search, statut, formule]);

  const confirmees = rows.filter((r) => r.confirmed).length;
  const encaisse = rows.reduce((s, r) => s + (r.confirmed ? Number(r.amount_paid || r.montant_reservation || 0) : 0), 0);
  const nbPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function exportCsv() {
    const head = ["Nom", "Téléphone", "Email", "Ville", "Formule", "Composition", "Montant", "Statut", "Date réservation", "Date confirmation", "Transaction"];
    const lines = filtered.map((r) => [
      r.name, r.phone, r.email, r.city, r.formule_souhaitee, r.composition_souhaitee,
      r.amount_paid || r.montant_reservation, r.confirmed ? "Confirmé" : "En attente",
      r.created_at, r.confirmed_at, r.transaction_id,
    ].map(csvEscape).join(";"));
    const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-2027-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const css = `
    .awj-res * { box-sizing: border-box; }
    .awj-res { font-family: inherit; color: ${TEXT}; ${embedded ? "" : `background: ${BG}; min-height: 100vh;`} }
    .awj-res-card { background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 16px; }
    .awj-res-input { background: ${SURFACE}; border: 1px solid ${BORDER}; color: ${TEXT}; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-family: inherit; outline: none; }
    .awj-res-input:focus { border-color: ${BRAND_LT}; }
    .awj-res-input option { background: #0b1830; color: ${TEXT}; }
    .awj-res-btn { background: ${SURFACE}; color: ${TEXT}; border: 1px solid ${BORDER}; border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
    .awj-res-btn:hover:not(:disabled) { background: ${SURFACE_HI}; border-color: ${BORDER_HI}; }
    .awj-res-btn:disabled { opacity: 0.4; cursor: default; }
    .awj-res-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .awj-res-table th { text-align: left; padding: 12px 16px; font-size: 10px; letter-spacing: 0.09em; text-transform: uppercase; color: ${TEXT_MUTED}; border-bottom: 1px solid ${BORDER}; white-space: nowrap; }
    .awj-res-table td { padding: 14px 16px; border-bottom: 1px solid ${BORDER}; vertical-align: top; }
    .awj-res-table tr:last-child td { border-bottom: none; }
    .awj-res-table tbody tr:hover { background: ${SURFACE_HI}; }
    .awj-res-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }
    @media (max-width: 768px) { .awj-res-kpis { grid-template-columns: 1fr; } .awj-res > div { padding: 16px 14px 60px !important; } }
  `;

  if (!isAdmin) {
    return (
      <>
        <style>{css}</style>
        <div className="awj-res" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: TEXT_MUTED }}>Accès réservé aux administrateurs.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="awj-res">
        <div style={{ maxWidth: 1340, margin: "0 auto", padding: embedded ? "0" : "32px 24px 80px" }}>

          {/* En-tête */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              {!embedded && (
                <Link to={ADMIN_BASE} style={{ color: BRAND_LT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  <i className="ti ti-arrow-left" style={{ fontSize: 12 }} /> Tableau de bord
                </Link>
              )}
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "8px 0 4px" }}>Réservations 2027</h1>
              <p style={{ color: TEXT_MUTED, fontSize: 13, margin: 0 }}>
                Adhésions de réservation des formules gestionnaire maladie (Classic, Aisance, Harmony, Premium).
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="awj-res-btn" onClick={() => load(page)}><i className="ti ti-refresh" style={{ fontSize: 14 }} /> Actualiser</button>
              <button className="awj-res-btn" onClick={exportCsv} disabled={!filtered.length}><i className="ti ti-download" style={{ fontSize: 14 }} /> Export CSV</button>
              {embedded && onClose && (
                <button className="awj-res-btn" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /> Fermer</button>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="awj-res-kpis">
            {[
              { label: "Total réservations", value: total, color: TEXT },
              { label: "Paiements confirmés (page)", value: confirmees, color: TEAL },
              { label: "Encaissé (page)", value: fcfa(encaisse), color: GOLD },
            ].map((k) => (
              <div key={k.label} className="awj-res-card" style={{ padding: "18px 20px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: TEXT_MUTED, margin: "0 0 6px" }}>{k.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: k.color, margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <input className="awj-res-input" style={{ flex: "1 1 240px" }} placeholder="Rechercher nom, téléphone, email, ville…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="awj-res-input" value={statut} onChange={(e) => setStatut(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="confirmed">Confirmées</option>
              <option value="pending">En attente de paiement</option>
            </select>
            <select className="awj-res-input" value={formule} onChange={(e) => setFormule(e.target.value)}>
              <option value="all">Toutes les formules</option>
              {formules.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Tableau */}
          <div className="awj-res-card" style={{ overflow: "hidden" }}>
            {loading ? (
              <p style={{ textAlign: "center", color: TEXT_MUTED, fontSize: 13, padding: "48px 0" }}>Chargement…</p>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 14px" }}>{error}</p>
                <button className="awj-res-btn" onClick={() => load(page)}>Réessayer</button>
              </div>
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: "center", color: TEXT_FAINT, fontSize: 13, padding: "48px 0" }}>
                {rows.length === 0 ? "Aucune réservation pour le moment." : "Aucun résultat pour ces filtres."}
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="awj-res-table">
                  <thead>
                    <tr>
                      <th>Souscripteur</th>
                      <th>Contact</th>
                      <th>Formule</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const wa = waLink(r.phone, r.name);
                      return (
                        <tr key={r.transaction_id}>
                          <td>
                            <strong style={{ color: TEXT, display: "block" }}>{r.name || "—"}</strong>
                            <span style={{ fontSize: 11, color: TEXT_FAINT }}>{r.city || "—"}</span>
                          </td>
                          <td>
                            <span style={{ display: "block" }}>{r.phone || "—"}</span>
                            <span style={{ fontSize: 11, color: TEXT_MUTED }}>{r.email || ""}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: BRAND_LT, display: "block" }}>{r.formule_souhaitee || "—"}</span>
                            <span style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "capitalize" }}>{r.composition_souhaitee || ""}</span>
                          </td>
                          <td style={{ whiteSpace: "nowrap", color: GOLD, fontWeight: 700 }}>
                            {fcfa(r.amount_paid || r.montant_reservation)}
                          </td>
                          <td>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap",
                              background: r.confirmed ? "rgba(31,209,189,0.14)" : "rgba(245,165,36,0.14)",
                              color: r.confirmed ? TEAL : AMBER,
                            }}>
                              {r.confirmed ? "Confirmée" : "En attente"}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, color: TEXT_MUTED, whiteSpace: "nowrap" }}>
                            {fmtDate(r.confirmed_at || r.created_at)}
                          </td>
                          <td>
                            {wa && (
                              <a className="awj-res-btn" style={{ padding: "6px 10px", fontSize: 12 }} href={wa} target="_blank" rel="noreferrer">
                                <i className="ti ti-brand-whatsapp" style={{ fontSize: 14, color: TEAL }} /> Contacter
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {nbPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 20 }}>
              <button className="awj-res-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>Page {page} / {nbPages}</span>
              <button className="awj-res-btn" disabled={page >= nbPages} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
