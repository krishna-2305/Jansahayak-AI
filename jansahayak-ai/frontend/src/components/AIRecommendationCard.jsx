import { Sparkles, Building2, AlertTriangle, ShieldAlert, Check, Lightbulb } from 'lucide-react'
import PriorityBadge from './PriorityBadge'

export default function AIRecommendationCard({
  analysis,
  onApply,
  showApplyButton = true,
  compact = false,
}) {
  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center">
        <Sparkles className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-pulse" />
        <p className="text-sm font-medium text-slate-700">JanSahayak AI Copilot Idle</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Start typing your grievance title and description. The AI engine will automatically analyze urgency, recommend departments, and flag public safety hazards.
        </p>
      </div>
    )
  }

  const {
    recommendedDepartmentName,
    confidence,
    suggestedPriority,
    suggestedCategory,
    detectedHazards = [],
    rationale,
  } = analysis

  return (
    <div className="rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50/80 via-white to-blue-50/50 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              JanSahayak AI Intelligence Analysis
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Live NLP
              </span>
            </h4>
          </div>
        </div>

        {/* Confidence metric */}
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xs text-slate-500">Confidence:</span>
            <span className="text-xs font-bold text-indigo-700">{confidence}%</span>
          </div>
          <div className="w-20 h-1.5 bg-indigo-100 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Recommendations */}
      <div className={`mt-4 grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
        {/* Department Match */}
        <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Recommended Dept</span>
          </div>
          <p className="font-semibold text-sm text-slate-900">
            {recommendedDepartmentName || 'General Administration'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Auto-detected from problem context
          </p>
        </div>

        {/* Priority Level */}
        <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Calculated Priority</span>
          </div>
          <div className="mt-0.5">
            <PriorityBadge priority={suggestedPriority} size="sm" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Assessed based on public impact
          </p>
        </div>

        {/* Suggested Category */}
        <div className="rounded-lg bg-white border border-slate-200 p-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            <span>Detected Category</span>
          </div>
          <p className="font-semibold text-sm text-slate-900">
            {suggestedCategory}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Civic grievance classification
          </p>
        </div>
      </div>

      {/* Safety Hazards if detected */}
      {detectedHazards.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-900 uppercase tracking-wide">
                Critical Safety Alert Triggered
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {detectedHazards.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300"
                  >
                    ⚠️ {h.label} ({h.severity})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rationale */}
      {rationale && (
        <div className="mt-3 text-xs text-indigo-900/80 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
          <span className="font-semibold text-indigo-950">AI Rationale: </span>
          {rationale}
        </div>
      )}

      {/* Evidence and Rules */}
      {(analysis.departmentReason || analysis.priorityReason || analysis.departmentEvidence?.length || analysis.priorityEvidence?.length) && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold text-slate-800">Department Rule</p>
            {analysis.departmentReason && <p className="mt-1 text-xs text-slate-600">{analysis.departmentReason}</p>}
            {analysis.departmentEvidence?.length > 0 && (
              <p className="mt-1 text-[11px] text-slate-500">Evidence: {analysis.departmentEvidence.join(', ')}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold text-slate-800">Priority Rule</p>
            {analysis.priorityReason && <p className="mt-1 text-xs text-slate-600">{analysis.priorityReason}</p>}
            {analysis.priorityEvidence?.length > 0 && (
              <p className="mt-1 text-[11px] text-slate-500">Evidence: {analysis.priorityEvidence.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Apply Button */}
      {showApplyButton && onApply && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onApply(analysis)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Apply AI Suggestions to Form
          </button>
        </div>
      )}
    </div>
  )
}
