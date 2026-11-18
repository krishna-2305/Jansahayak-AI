import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  AlertOctagon,
  Users,
  ExternalLink,
  Edit,
  Printer,
  Copy,
} from 'lucide-react'
import { complaintService } from '../services/complaintService'
import { departmentService } from '../services/departmentService'
import {
  analyzeGrievanceText,
  findRelatedComplaints,
  detectIncidentClusters,
} from '../services/aiIntelligence'
import { getErrorMessage } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import StatusTimeline from '../components/StatusTimeline'
import AIRecommendationCard from '../components/AIRecommendationCard'
import StatusUpdateModal from '../components/StatusUpdateModal'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

export default function OfficerComplaintDetailPage() {
  const { referenceId } = useParams()

  const [complaint, setComplaint] = useState(null)
  const [allComplaints, setAllComplaints] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Status update modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    if (referenceId) {
      Promise.all([
        complaintService.getComplaintByRef(referenceId),
        complaintService.listComplaints(0, 200).catch(() => []),
        departmentService.getDepartments().catch(() => []),
      ])
        .then(([compRes, allRes, deptsRes]) => {
          if (isMounted) {
            setComplaint(compRes)
            setAllComplaints(allRes)
            setDepartments(deptsRes)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(getErrorMessage(err))
            setLoading(false)
          }
        })
    }

    return () => {
      isMounted = false
    }
  }, [referenceId])

  const handleManualReload = async () => {
    setLoading(true)
    setError(null)
    try {
      const [compRes, allRes, deptsRes] = await Promise.all([
        complaintService.getComplaintByRef(referenceId),
        complaintService.listComplaints(0, 200).catch(() => []),
        departmentService.getDepartments().catch(() => []),
      ])
      setComplaint(compRes)
      setAllComplaints(allRes)
      setDepartments(deptsRes)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdated = (updated) => {
    setComplaint(updated)
  }

  const copyRefId = () => {
    if (!complaint?.reference_id) return
    navigator.clipboard.writeText(complaint.reference_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // AI Analysis of this complaint
  const aiAnalysis = complaint
    ? analyzeGrievanceText(complaint.title, complaint.description, departments)
    : null

  // Related Complaints
  const relatedComplaints = complaint
    ? findRelatedComplaints(complaint, allComplaints)
    : []

  // Check if part of an incident cluster
  const clusters = detectIncidentClusters(allComplaints, departments)
  const matchingCluster = complaint
    ? clusters.find((cl) =>
        cl.locality.toLowerCase().trim() === complaint.locality.toLowerCase().trim()
      )
    : null

  const getDepartmentName = (deptId) => {
    if (!deptId) return 'General Administration / Unassigned'
    const found = departments.find((d) => d.id === deptId)
    return found ? found.name : `Department #${deptId}`
  }

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner message="Loading complaint dossier and intelligence cross-checks..." size="lg" />
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="py-12 max-w-2xl mx-auto text-left">
        <ErrorBanner message={error || 'Complaint not found.'} onRetry={handleManualReload} />
        <div className="mt-4">
          <Link
            to="/officer/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Complaints Registry</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/officer/complaints"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Back to complaints"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Grievance Intelligence Dossier
              </span>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {complaint.reference_id}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-1">
              {complaint.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-800 hover:bg-blue-900 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Update Status</span>
          </button>

          <Link
            to={`/track/${complaint.reference_id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Public View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Print dossier"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Incident Alert if this complaint matches an incident cluster */}
      {matchingCluster && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-900 uppercase tracking-wide">
                  Active Incident Cluster Warning
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-900">
                  {matchingCluster.severity}
                </span>
              </div>
              <p className="text-xs text-red-800 mt-1">
                This grievance is part of <strong>{matchingCluster.title}</strong> with{' '}
                <strong>{matchingCluster.complaintCount} linked citizen reports</strong> in {complaint.locality}.
              </p>
              <div className="mt-2">
                <Link
                  to="/officer/incidents"
                  className="text-xs font-bold text-red-900 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Incident Command Cell</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: 7 cols dossier, 5 cols AI & related */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dossier Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            {/* Status and Priority Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Current Status:</span>
                <StatusBadge status={complaint.status} size="lg" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Assessed Priority:</span>
                <PriorityBadge priority={complaint.priority} size="md" />
              </div>
            </div>

            {/* Stepper Progression */}
            <div className="py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Lifecycle Progression
              </p>
              <StatusTimeline status={complaint.status} createdAt={complaint.created_at} />
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Reference Number</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-bold text-blue-900 text-sm">{complaint.reference_id}</span>
                  <button onClick={copyRefId} className="text-slate-400 hover:text-slate-600">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Department Portfolio</span>
                <p className="font-semibold text-slate-900 mt-1 text-sm">{getDepartmentName(complaint.department_id)}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Jurisdiction / Location</span>
                <p className="font-semibold text-slate-900 mt-1">
                  {complaint.locality}, {complaint.district}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Filing Language</span>
                <p className="font-semibold text-slate-900 mt-1">
                  {complaint.language || 'English'}
                </p>
              </div>
            </div>

            {/* Full Citizen Description */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Citizen Statement & Description
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </div>
            </div>

            {/* Officer Action Log */}
            <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
              <span>Submitted on {new Date(complaint.created_at).toLocaleString()}</span>
              <span className="font-mono">Record ID: #{complaint.id}</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Related Incident Clusters */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Intelligence Card */}
          <AIRecommendationCard
            analysis={aiAnalysis}
            showApplyButton={false}
          />

          {/* Related Complaints in Same Locality / Category */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-left">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  Related Local Grievances ({relatedComplaints.length})
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Cross-Checked
              </span>
            </div>

            {relatedComplaints.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 italic">
                No overlapping grievances found in {complaint.locality}.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 space-y-2">
                {relatedComplaints.map((rc) => (
                  <div key={rc.id} className="pt-2 first:pt-0">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        to={`/officer/complaints/${rc.reference_id}`}
                        className="font-mono font-bold text-blue-800 hover:underline"
                      >
                        {rc.reference_id}
                      </Link>
                      <div className="flex items-center gap-1">
                        <PriorityBadge priority={rc.priority} size="sm" />
                        <StatusBadge status={rc.status} size="sm" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                      {rc.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                      <span>Matches: {rc.reasons.join(', ')}</span>
                      <span>•</span>
                      <span>{rc.locality}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <StatusUpdateModal
          key={complaint.id}
          isOpen={isStatusModalOpen}
          complaint={complaint}
          onClose={() => setIsStatusModalOpen(false)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  )
}
