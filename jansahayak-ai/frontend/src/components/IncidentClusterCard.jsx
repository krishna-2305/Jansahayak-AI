import { useState } from 'react'
import { AlertOctagon, MapPin, Building, Users, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'

export default function IncidentClusterCard({ cluster }) {
  const [expanded, setExpanded] = useState(false)

  if (!cluster) return null

  const isCritical = cluster.severity === 'Critical'
  const isHigh = cluster.severity === 'High'

  const borderClass = isCritical
    ? 'border-red-300 bg-red-50/40 ring-1 ring-red-200'
    : isHigh
    ? 'border-orange-300 bg-orange-50/40 ring-1 ring-orange-200'
    : 'border-slate-200 bg-white'

  const badgeClass = isCritical
    ? 'bg-red-600 text-white'
    : isHigh
    ? 'bg-orange-600 text-white'
    : 'bg-amber-600 text-white'

  return (
    <div className={`rounded-xl border p-5 shadow-xs transition-all ${borderClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isCritical ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}
          >
            <AlertOctagon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}>
                {cluster.severity} Incident
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">
                {cluster.id}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                <Users className="w-3 h-3" />
                {cluster.complaintCount} Citizen Grievances
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-1">
              {cluster.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
              <span className="inline-flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {cluster.locality}, {cluster.district}
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {cluster.departmentName}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <span>{expanded ? 'Hide Linked Grievances' : `View ${cluster.complaintCount} Grievances`}</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-600 bg-white/80 p-3 rounded-lg border border-slate-200">
        <strong className="text-slate-800">Intelligence Brief: </strong>
        {cluster.summary}
      </p>

      {/* Expanded Linked Complaints */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Linked Citizen Complaints in this Cluster:
          </p>
          <div className="grid grid-cols-1 divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 overflow-hidden">
            {cluster.complaints.map((c) => (
              <div key={c.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700">
                      {c.reference_id}
                    </span>
                    <PriorityBadge priority={c.priority} size="sm" />
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 truncate mt-1">
                    {c.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {c.description}
                  </p>
                </div>

                <Link
                  to={`/track/${c.reference_id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors shrink-0"
                >
                  <span>Track</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
