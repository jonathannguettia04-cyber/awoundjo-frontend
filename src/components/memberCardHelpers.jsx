// ─────────────────────────────────────────────────────────────
//  memberCardHelpers.jsx
//
//  USAGE : importez ou copiez ces helpers dans
//    - DiasporaPages.jsx
//    - ReferralPages.jsx
//
//  Ils remplacent la logique "status !== ACTIVE → afficher Payer"
//  par une logique à 3 états :
//    1. status_payment === 'unpaid'           → 💳 Payer (cliquable)
//    2. paid + status_validation !== approved → ⏳ En attente validation (non cliquable)
//    3. active + paid + approved             → ✅ Actif (non cliquable)
//    4. rejected                             → ❌ Refusé (non cliquable)
// ─────────────────────────────────────────────────────────────

// ── 1. Helper de statut ───────────────────────────────────────
/**
 * Retourne { label, bg, color, canPay } selon l'état du membre.
 * Fonctionne pour les ambassadeurs diaspora ET les membres referral
 * (les deux ont status_payment et status_validation en DB).
 */
export function memberStatusInfo(m) {
  const unpaid    = m.status_payment    === "unpaid";
  const rejected  = m.status_validation === "rejected";
  const validated = m.status_validation === "approved";
  const active    = m.status            === "ACTIVE";

  if (active && !unpaid && validated) {
    return { label: "✅ Actif",                      bg: "#ECFDF5", color: "#059669", canPay: false };
  }
  if (rejected) {
    return { label: "❌ Compte refusé",               bg: "#FEF2F2", color: "#DC2626", canPay: false };
  }
  if (unpaid) {
    return { label: "💳 Paiement requis",             bg: "#EFF6FF", color: "#0072C6", canPay: true  };
  }
  if (!validated) {
    return { label: "⏳ En attente validation admin",  bg: "#FFFBEB", color: "#D97706", canPay: false };
  }
  // Payé + approuvé mais status pas encore synchronisé — afficher comme actif
  return { label: "✅ Actif",                         bg: "#ECFDF5", color: "#059669", canPay: false };
}


// ── 2. Composant MemberCard générique ─────────────────────────
/**
 * Remplace les <Card> inline dans chaque liste de membres.
 *
 * Props :
 *   member       — objet membre (doit avoir id, name, email, plan, created_at,
 *                  status, status_payment, status_validation)
 *   icon         — emoji ex: "🗺️", "🤝", "⭐"
 *   iconBg       — couleur de fond de l'icône ex: "#ECFDF5"
 *   extra        — JSX optionnel affiché sous email/date (ex: badge plan)
 *   onPayClick   — callback(member) appelé quand on clique "Payer"
 */
export function MemberCard({ member: m, icon, iconBg, extra, onPayClick }) {
  const si = memberStatusInfo(m);
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const C = {
    dark: "#0F172A", slate: "#64748B", border: "#E2E8F0",
  };

  return (
    <div
      onClick={() => si.canPay && onPayClick(m)}
      onMouseEnter={e => { if (si.canPay) e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
      style={{
        background: "#fff", borderRadius: 14,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        padding: 20,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
        cursor: si.canPay ? "pointer" : "default",
        transition: "box-shadow .15s",
      }}
    >
      {/* Infos */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: C.dark }}>{m.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
            {m.email} • {fmtDate(m.created_at || m.createdAt)}
          </p>
          {extra}
          {m.plan && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 8px",
              borderRadius: 999,
              background: iconBg, color: si.color,
            }}>
              {m.plan}
            </span>
          )}
        </div>
      </div>

      {/* Badge statut + bouton Payer */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {si.canPay && (
          <button
            onClick={e => { e.stopPropagation(); onPayClick(m); }}
            style={{
              padding: "5px 12px", borderRadius: 8,
              background: "linear-gradient(135deg,#0072C6,#005A9E)",
              color: "#fff", border: "none",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
            }}
          >
            💳 Payer
          </button>
        )}
        <span style={{
          background: si.bg, color: si.color,
          padding: "3px 12px", borderRadius: 999,
          fontSize: 11, fontWeight: 700,
        }}>
          {si.label}
        </span>
      </div>
    </div>
  );
}


// ── 3. Exemple d'utilisation dans DiasporaRegisterPays ────────
/*

import { MemberCard } from "./memberCardHelpers";   // ou copier inline

// Dans le rendu :
{list.map(a => (
  <MemberCard
    key={a.id}
    member={a}
    icon="🗺️"
    iconBg="#ECFDF5"
    onPayClick={setPayMember}
  />
))}

*/


// ── 4. Exemple d'utilisation dans ReferralRegisterLeader ──────
/*

{list.map(m => (
  <MemberCard
    key={m.id}
    member={m}
    icon="⭐"
    iconBg="#EEF2FF"
    onPayClick={setPayMember}
  />
))}

*/


// ── 5. Mapping icône/bg par rôle (pratique si vous bouclez) ───
export const ROLE_CARD_STYLE = {
  AMBASSADEUR_PAYS: { icon: "🗺️", iconBg: "#ECFDF5" },
  RECRUTEUR:        { icon: "🤝", iconBg: "#FFFBEB" },
  RUM:              { icon: "👑", iconBg: "#F5F3FF" },
  LEADER:           { icon: "⭐", iconBg: "#EEF2FF" },
  PASTEUR:          { icon: "⛪", iconBg: "#F0FDFA" },
  RESPONSABLE:      { icon: "🤝", iconBg: "#FFFBEB" },
};
