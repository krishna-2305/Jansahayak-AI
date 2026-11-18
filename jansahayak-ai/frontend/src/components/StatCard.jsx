export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50/50',
      border: 'border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-600 text-white',
      accent: 'text-blue-700',
    },
    amber: {
      bg: 'bg-amber-50/50',
      border: 'border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-600 text-white',
      accent: 'text-amber-800',
    },
    indigo: {
      bg: 'bg-indigo-50/50',
      border: 'border-indigo-100 hover:border-indigo-300',
      iconBg: 'bg-indigo-600 text-white',
      accent: 'text-indigo-700',
    },
    emerald: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-600 text-white',
      accent: 'text-emerald-700',
    },
    red: {
      bg: 'bg-red-50/50',
      border: 'border-red-100 hover:border-red-300',
      iconBg: 'bg-red-600 text-white',
      accent: 'text-red-700',
    },
  }

  const theme = colorMap[color] || colorMap.blue

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-white p-5 shadow-xs transition-all duration-200 ${
        theme.border
      } ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-xs ${theme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-slate-500">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  )
}
