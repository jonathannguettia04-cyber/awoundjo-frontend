export default function StatsCard({ label, value, sub, icon, color = "brand" }) {
  const colors = {
    brand:   "bg-brand-50   border-brand-100  text-brand-600",
    success: "bg-success-50 border-green-100  text-success-700",
    warning: "bg-warning-50 border-amber-100  text-warning-500",
    danger:  "bg-danger-50  border-red-100    text-danger-500",
    purple:  "bg-purple-50  border-purple-100 text-purple-600",
    teal:    "bg-teal-50    border-teal-100   text-teal-600",
  };

  return (
    <div className={`rounded-xl border p-5 animate-fade-in ${colors[color] || colors.brand}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-2xl font-bold mt-1">{value ?? "—"}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
        {icon && <span className="text-3xl opacity-80">{icon}</span>}
      </div>
    </div>
  );
}
