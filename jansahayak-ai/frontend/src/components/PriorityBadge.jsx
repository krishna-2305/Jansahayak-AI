import { Flame, AlertCircle, Info, ChevronDown } from 'lucide-react'

export default function PriorityBadge({ priority, size = 'md' }) {
  const norm = (priority || 'Medium').trim()

  const config = {
    Critical: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500 animate-pulse',
      icon: Flame,
      label: 'Critical',
    },
    High: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500',
      icon: AlertCircle,
      label: 'High',
    },
    Medium: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
      icon: Info,
      label: 'Medium',
    },
    Low: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      icon: ChevronDown,
      label: 'Low',
    },
  }[norm] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    icon: Info,
    label: norm,
  }

  const Icon = config.icon

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : size === 'lg'
    ? 'px-3.5 py-1.5 text-sm gap-2 font-semibold'
    : 'px-2.5 py-1 text-xs gap-1.5 font-medium'

  return (
    <span
      className={`inline-flex items-center rounded-md border shadow-xs ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  )
}
