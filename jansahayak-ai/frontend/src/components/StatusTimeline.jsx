import { Check, Clock, X } from 'lucide-react'

export default function StatusTimeline({ status = 'Submitted', createdAt }) {
  const normStatus = (status || 'Submitted').trim()
  const isRejected = normStatus === 'Rejected'

  const stages = isRejected
    ? [
        { key: 'Submitted', label: 'Complaint Registered', desc: 'Received in portal' },
        { key: 'Rejected', label: 'Complaint Rejected', desc: 'Does not meet criteria or invalid scope' },
      ]
    : [
        { key: 'Submitted', label: '1. Registered', desc: 'Complaint logged in system' },
        { key: 'Under Review', label: '2. Under Review', desc: 'Department verification & assignment' },
        { key: 'In Progress', label: '3. In Progress', desc: 'Field teams resolving issue' },
        { key: 'Resolved', label: '4. Resolved', desc: 'Civic action completed & verified' },
        { key: 'Closed', label: '5. Closed', desc: 'Citizen confirmed or closed by officer' },
      ]

  const statusOrder = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed']
  const currentIndex = isRejected ? 1 : statusOrder.indexOf(normStatus)

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="py-4">
      <div className="relative">
        {/* Progress track */}
        <div className="hidden sm:block absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIndex || (idx === currentIndex && normStatus === 'Closed')
            const isCurrent = idx === currentIndex && normStatus !== 'Closed'

            let stateColors = 'bg-slate-100 text-slate-400 border-slate-300'
            let badgeBg = 'text-slate-500'

            if (isRejected) {
              stateColors = idx === 1 ? 'bg-red-600 text-white border-red-600' : 'bg-emerald-600 text-white border-emerald-600'
            } else if (isCompleted) {
              stateColors = 'bg-emerald-600 text-white border-emerald-600'
              badgeBg = 'text-emerald-800'
            } else if (isCurrent) {
              stateColors = 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100'
              badgeBg = 'text-blue-900 font-bold'
            }

            return (
              <div key={stage.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-slate-200">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs border-2 shrink-0 transition-all ${stateColors}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 animate-pulse" />
                  ) : isRejected && idx === 1 ? (
                    <X className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="text-left sm:text-center">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${badgeBg}`}>
                    {stage.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
                  {idx === 0 && formattedDate && (
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{formattedDate}</p>
                  )}
                  {isCurrent && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 rounded">
                      Current Stage
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
