// src/hooks/usePlans.js
// ─────────────────────────────────────────────────────────────
//  Hook partagé — charge les formules depuis /api/plans
//  Remplace les arrays PLANS / PLANS_FED / PLANS_DIAS hardcodés
//
//  Usage :
//    const { plans, plansLoading } = usePlans();
//    const { plans, plansLoading, defaultPlan } = usePlans();
//
//  Retourne :
//    plans        — tableau d'objets API  { slug, name, monthly_price, adhesion_price, coverage_percent, ... }
//    plansLoading — boolean
//    defaultPlan  — premier plan (ou undefined si loading)
//    planBySlug   — fonction (slug) => plan | undefined
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Icônes par défaut (correspondant aux slugs connus)
export const PLAN_ICONS = { ESSENTIELLE: "🌿", IVOIRIENNE: "🌍", TURQUOISE: "💎" };
export const planIcon = (slug) => PLAN_ICONS[slug?.toUpperCase()] || "📋";

export function usePlans() {
  const [plans,        setPlans]        = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("agent_token");
    fetch(`${BASE}/api/plans`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) setPlans(data);
      })
      .catch(console.error)
      .finally(() => setPlansLoading(false));
  }, []);

  const defaultPlan = plans[0];
  const planBySlug  = (slug) => plans.find((p) => p.slug.toUpperCase() === slug?.toUpperCase());

  return { plans, plansLoading, defaultPlan, planBySlug };
}
