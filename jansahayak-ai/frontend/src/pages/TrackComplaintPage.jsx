import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Search,
  ShieldCheck,
  MapPin,
  Printer,
  Copy,
  AlertCircle,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { complaintService } from '../services/complaintService'
import { departmentService } from '../services/departmentService'
import { getErrorMessage } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import StatusTimeline from '../components/StatusTimeline'
import LoadingSpinner from '../components/LoadingSpinner'

export default function TrackComplaintPage() {
  const { referenceId: paramRefId } = useParams()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [inputRefId, setInputRefId] = useState(paramRefId || '')
  const [complaint, setComplaint] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(Boolean(paramRefId))
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Fetch departments for mapping department_id to readable name
  useEffect(() => {
    departmentService.getDepartments().then(setDepartments).catch(() => {})
  }, [])

  // If URL has referenceId param, load it automatically
  useEffect(() => {
    let isMounted = true

    if (paramRefId) {
      const cleanId = paramRefId.trim().toUpperCase()
      complaintService.getComplaintByRef(cleanId)
        .then((data) => {
          if (isMounted) {
            setComplaint(data)
            setError(null)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (isMounted) {
            setComplaint(null)
            if (err.response?.status === 404) {
              setError(`No grievance found with Reference ID "${cleanId}". Please check the ID and try again.`)
            } else {
              setError(getErrorMessage(err))
            }
            setLoading(false)
          }
        })
    }

    return () => {
      isMounted = false
    }
  }, [paramRefId])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputRefId.trim()) return
    setLoading(true)
    navigate(`/track/${inputRefId.trim().toUpperCase()}`)
  }

  const copyRefId = () => {
    if (!complaint?.reference_id) return
    navigator.clipboard.writeText(complaint.reference_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const getDepartmentName = (deptId) => {
    if (!deptId) return 'General Administration / Unassigned'
    const found = departments.find((d) => d.id === deptId)
    return found ? found.name : `Department #${deptId}`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8 text-left">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center">
            <Search className="w-4 h-4 text-amber-300" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Citizen Public Grievance Verification
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif">
          {t('trackHeading')}
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          {t('trackSubheading')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={inputRefId}
              onChange={(e) => setInputRefId(e.target.value)}
              placeholder="Enter Grievance Reference ID (e.g. JS-ABC12345)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {loading ? (
              <span>{t('trackingBtn')}</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t('trackBtn')}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-xs">
          <LoadingSpinner message="Retrieving grievance record from public grievance registry..." />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow-xs">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-rose-900">{t('notFoundTitle')}</h3>
          <p className="text-sm text-rose-700 mt-1 max-w-md mx-auto">{error}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setError(null)
                setInputRefId('')
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-rose-200 text-rose-800 hover:bg-rose-100 transition-colors"
            >
              Clear Search
            </button>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-800 hover:bg-blue-900 text-white transition-colors"
            >
              File New Grievance
            </Link>
          </div>
        </div>
      )}

      {/* Complaint Details Card */}
      {complaint && !loading && (
        <div className="space-y-6">
          {/* Main Receipt Sheet */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden text-left">
            {/* Gov Header strip on receipt */}
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-800 border border-blue-700 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                      Official Grievance Redressal Record
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-200 border border-blue-800">
                      ID: #{complaint.id}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-serif text-white mt-0.5">
                    {complaint.title}
                  </h2>
                </div>
              </div>

              {/* Status and Ref */}
              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                <StatusBadge status={complaint.status} size="lg" />
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  title="Print official receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>

            {/* Stepper / Timeline */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Resolution Lifecycle
              </p>
              <StatusTimeline status={complaint.status} createdAt={complaint.created_at} statusHistory={complaint.status_history || []} />
            </div>

            {/* Metadata Grid */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-slate-200">
                {/* Reference ID */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Reference ID
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-base font-extrabold text-blue-900">
                      {complaint.reference_id}
                    </span>
                    <button
                      type="button"
                      onClick={copyRefId}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Copy Reference ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                  </div>
                </div>

                {/* Assigned Department */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Department
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {getDepartmentName(complaint.department_id)}
                  </p>
                </div>

                {/* Priority */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Assessed Priority
                  </p>
                  <div className="mt-1">
                    <PriorityBadge priority={complaint.priority} size="md" />
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Filing Date & Time
                  </p>
                  <p className="text-xs font-medium text-slate-700 mt-1">
                    {new Date(complaint.created_at).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Geographic Location & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    District
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {complaint.district}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Locality / Ward
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {complaint.locality}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Grievance Category
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {complaint.category}
                  </p>
                </div>
              </div>

              {/* Description Body */}
              <div className="pt-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Citizen Grievance Description
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {complaint.description}
                </div>
              </div>

              {/* Official Seal / Verification Notice */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Digitally verified by JanSahayak AI Grievance Intake Daemon</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Audit Hash: {complaint.reference_id}-{complaint.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
