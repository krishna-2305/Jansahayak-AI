import { useState } from 'react'
import { X, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { complaintService } from '../services/complaintService'
import { getErrorMessage } from '../services/api'
import StatusBadge from './StatusBadge'

const ALLOWED_STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Closed',
  'Rejected',
]

export default function StatusUpdateModal({
  isOpen,
  onClose,
  complaint,
  onStatusUpdated,
}) {
  const [selectedStatus, setSelectedStatus] = useState(complaint?.status || 'Under Review')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !complaint) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedStatus === complaint.status) {
      onClose()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updated = await complaintService.updateComplaintStatus(
        complaint.id,
        selectedStatus,
        remarks.trim() || null
      )
      if (onStatusUpdated) {
        onStatusUpdated(updated)
      }
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900">
          Update Grievance Status
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Reference ID: <span className="font-mono font-bold text-blue-700">{complaint.reference_id}</span>
        </p>

        {/* Current vs Next state indicator */}
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current</p>
            <div className="mt-1">
              <StatusBadge status={complaint.status} size="sm" />
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">New Status</p>
            <div className="mt-1">
              <StatusBadge status={selectedStatus} size="sm" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select New Official Status *
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
            >
              {ALLOWED_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Action Notes / Remediation Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Road repair squad dispatched. Expected resolution within 48 hours."
              disabled={loading}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedStatus === complaint.status}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Updating...' : 'Confirm Status Change'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
