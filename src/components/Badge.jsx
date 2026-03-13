const STATUS_STYLES = {
  actif:    "bg-green-100 text-green-700",
  attente:  "bg-amber-100 text-amber-700",
  suspendu: "bg-red-100   text-red-700",
};
const PLAN_STYLES = {
  ESSENTIELLE: "bg-blue-100   text-blue-700",
  IVOIRIENNE:  "bg-purple-100 text-purple-700",
  TURQUOISE:   "bg-teal-100   text-teal-700",
};
const TYPE_STYLES = {
  adhesion:   "bg-brand-50  text-brand-600",
  mensualite: "bg-slate-100 text-slate-600",
};
const METHOD_STYLES = {
  wave: "bg-orange-100 text-orange-700",
  cash: "bg-slate-100  text-slate-600",
};

export function StatusBadge({ status }) {
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
}
export function PlanBadge({ plan }) {
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_STYLES[plan] || "bg-gray-100 text-gray-600"}`}>{plan}</span>;
}
export function TypeBadge({ type }) {
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_STYLES[type] || "bg-gray-100 text-gray-600"}`}>{type}</span>;
}
export function MethodBadge({ method }) {
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full uppercase ${METHOD_STYLES[method] || "bg-gray-100 text-gray-600"}`}>{method}</span>;
}
