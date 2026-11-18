import { CheckCircle2, Clock, ArrowRightCircle, XCircle, ShieldCheck } from 'lucide-react'

export default function StatusBadge({ status, size = 'md' }) {
  const normStatus = (status || 'Submitted').trim()

  const config = {
    Submitted: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
      label: 'Submitted',
    },
    'Under Review': {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      label: 'Under Review',
    },
    'In Progress': {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: ArrowRightCircle,
      label: 'In Progress',
    },
    Resolved: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      label: 'Resolved',
    },
    Closed: {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: ShieldCheck,
      label: 'Closed',
    },
    Rejected: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
      label: 'Rejected',
    },
  }[normStatus] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
    label: normStatus,
  }

  const Icon = config.icon

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : size === 'lg'
    ? 'px-3.5 py-1.5 text-sm gap-2 font-semibold'
    : 'px-2.5 py-1 text-xs gap-1.5 font-medium'

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  )
}
