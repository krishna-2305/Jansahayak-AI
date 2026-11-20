import { useState, useEffect } from 'react'
import {
  AlertOctagon,
  RefreshCw,
  Users,
  Flame,
  CheckCircle,
} from 'lucide-react'
import { departmentService } from '../services/departmentService'
import { incidentService } from '../services/incidentService'
import { getErrorMessage } from '../services/api'
import IncidentClusterCard from '../components/IncidentClusterCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

export default function OfficerIncidentsPage() {
  const [departments, setDepartments] = useState([])
  const [backendIncidents, setBackendIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      departmentService.getDepartments(),
      incidentService.listIncidents().catch(() => []),
    ])
      .then(([deptsRes, incidentsRes]) => {
        if (isMounted) {
          setDepartments(deptsRes)
          setBackendIncidents(incidentsRes)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getErrorMessage(err))
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const [deptsRes, incidentsRes] = await Promise.all([
        departmentService.getDepartments(),
        incidentService.listIncidents().catch(() => []),
      ])
      setDepartments(deptsRes)
      setBackendIncidents(incidentsRes)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRefreshing(false)
    }
  }

  const clusters = backendIncidents.map((incident) => ({
    id: `INC-${incident.id}`,
    title: incident.title,
    locality: incident.locality || 'Not specified',
    district: incident.district || 'Not specified',
    departmentName: departments.find((item) => item.id === incident.department_id)?.name || 'Unassigned',
    complaintCount: incident.complaints?.length || 0,
    complaints: (incident.complaints || []).map((item) => ({
      id: item.complaint_id,
      reference_id: item.reference_id,
      title: `Complaint ${item.reference_id}`,
      description: item.matching_signals?.officer_decision_reason || 'Officer-managed incident relationship',
      priority: 'Medium',
      status: 'Submitted',
    })),
    severity: incident.severity,
    summary: incident.notes || 'Officer-created incident. Individual complaint relationships require review.',
  }))

  const criticalClustersCount = clusters.filter((c) => c.severity === 'Critical').length
  const totalImpactedCitizens = clusters.reduce((acc, c) => acc + c.complaintCount, 0)

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              Proactive Spatial Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 mt-1">
            Incident Coordination & Grievance Clustering Cell
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated spatial and category correlation detects multi-citizen emergencies and localized infrastructure breakdowns.
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-700' : ''}`} />
          <span>{refreshing ? 'Re-scanning...' : 'Re-scan Clusters'}</span>
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={handleManualRefresh} />}

      {/* Metric strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Active Incident Clusters</span>
            <AlertOctagon className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{clusters.length}</p>
          <p className="text-xs text-slate-500 mt-1">Detected across all wards</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Critical Outages / Hazards</span>
            <Flame className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-extrabold text-red-700 mt-2 font-mono">{criticalClustersCount}</p>
          <p className="text-xs text-slate-500 mt-1">Require immediate emergency dispatch</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Linked Citizen Reports</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-900 mt-2 font-mono">{totalImpactedCitizens}</p>
          <p className="text-xs text-slate-500 mt-1">Complaints consolidated into incidents</p>
        </div>
      </div>

      {/* Cluster List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 bg-white rounded-2xl border border-slate-200">
            <LoadingSpinner message="Scanning complaint database for spatial clusters..." />
          </div>
        ) : clusters.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Multi-Citizen Incident Clusters Detected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Complaints are currently distributed normally across disparate locations without localized clustering.
              As multiple complaints arrive from the same locality or ward, the AI correlation engine will automatically group them here.
            </p>
          </div>
        ) : (
          clusters.map((cluster) => (
            <IncidentClusterCard key={cluster.id} cluster={cluster} />
          ))
        )}
      </div>
    </div>
  )
}
