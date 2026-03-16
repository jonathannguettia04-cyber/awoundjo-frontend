import { useNavigate } from "react-router-dom";

export default function StatsCard({ label, value, sub, icon, color = "brand", to, trend, trendLabel }) {
  const navigate = useNavigate();

  const themes = {
    brand:   { bg: "bg-white", border: "border-brand-200",   icon: "bg-brand-50   text-brand-600",   text: "text-brand-700",   bar: "bg-brand-500"   },
    success: { bg: "bg-white", border: "border-green-200",   icon: "bg-green-50   text-green-600",   text: "text-green-700",   bar: "bg-green-500"   },
    warning: { bg: "bg-white", border: "border-amber-200",   icon: "bg-amber-50   text-amber-600",   text: "text-amber-700",   bar: "bg-amber-500"   },
    danger:  { bg: "bg-white", border: "border-red-200",     icon: "bg-red-50     text-red-600",     text: "text-red-700",     bar: "bg-red-500"     },
    purple:  { bg: "bg-white", border: "border-purple-200",  icon: "bg-purple-50  text-purple-600",  text: "text-purple-700",  bar: "bg-purple-500"  },
    teal:    { bg: "bg-white", border: "border-teal-200",    icon: "bg-teal-50    text-teal-600",    text: "text-teal-700",    bar: "bg-teal-500"    },
  };

  const t = themes[color] || themes.brand;
  const isClickable = !!to;

  const trendUp   = trend > 0;
  const trendDown = trend < 0;
  const trendNeutral = trend === 0 || trend === undefined;

  const card = (
    <div
      onClick={() => isClickable && navigate(to)}
      className={`
        relative overflow-hidden rounded-2xl border ${t.border} ${t.bg} p-5
        transition-all duration-200
        ${isClickable ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-opacity-80 active:scale-[0.98]" : ""}
      `}
    >
      {/* Barre colorée en haut */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${t.bar} opacity-60`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
          <p className={`text-2xl font-bold ${t.text} leading-none truncate`}>{value ?? "—"}</p>
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}

          {/* Tendance */}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? "text-green-600" : trendDown ? "text-red-500" : "text-slate-400"}`}>
              <span>{trendUp ? "↑" : trendDown ? "↓" : "→"}</span>
              <span>{trendLabel || (trendUp ? `+${trend}%` : trendDown ? `${trend}%` : "Stable")}</span>
            </div>
          )}
        </div>

        {/* Icône */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${t.icon}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>

      {/* Flèche si cliquable */}
      {isClickable && (
        <div className="absolute bottom-3 right-3 opacity-20 text-slate-400 text-xs font-bold">→</div>
      )}
    </div>
  );

  return card;
}