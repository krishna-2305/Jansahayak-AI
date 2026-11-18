import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import {
  FileText,
  Clock,
  ArrowRightCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  AlertOctagon,
} from 'lucide-react'
import { dashboardService } from '../services/dashboardService'
import { complaintService } from '../services/complaintService'
import { departmentService } from '../services/departmentService'
import { detectIncidentClusters } from '../services/aiIntelligence'
import { getErrorMessage } from '../services/api'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import StatusUpdateModal from '../components/StatusUpdateModal'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

// Theme colors for charts
const STATUS_COLORS = {
  Submitted: '#3b82f6',
  'Under Review': '#f59e0b',
  'In Progress': '#6366f1',
  Resolved: '#10b981',
  Closed: '#64748b',
  Rejected: '#f43f5e',
}

const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#0ea5e9',
  Low: '#94a3b8',
}

export default function OfficerDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Status modal state
  const [selectedComplaintForStatus, setSelectedComplaintForStatus] = useState(null)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      dashboardService.getSummary(),
      complaintService.listComplaints(0, 100),
      departmentService.getDepartments(),
    ])
      .then(([summaryRes, complaintsRes, deptsRes]) => {
        if (isMounted) {
          setSummary(summaryRes)
          setComplaints(complaintsRes)
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

    return () => {
      isMounted = false
    }
  }, [])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const [summaryRes, complaintsRes, deptsRes] = await Promise.all([
        dashboardService.getSummary(),
        complaintService.listComplaints(0, 100),
        departmentService.getDepartments(),
      ])

      setSummary(summaryRes)
      setComplaints(complaintsRes)
      setDepartments(deptsRes)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRefreshing(false)
    }
  }

  const handleStatusUpdated = (updatedComplaint) => {
    // Optimistically update complaint in list
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
    )
    // Refresh dashboard summary counts
    dashboardService.getSummary().then(setSummary).catch(() => {})
  }

  // Calculate incident clusters
  const incidentClusters = detectIncidentClusters(complaints, departments)

  // Prepare chart data
  const statusChartData = summary?.by_status
    ? Object.entries(summary.by_status).map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#94a3b8',
      }))
    : []

  const priorityChartData = summary?.by_priority
    ? ['Critical', 'High', 'Medium', 'Low'].map((p) => ({
        name: p,
        count: summary.by_priority[p] || 0,
        fill: PRIORITY_COLORS[p],
      }))
    : []

  // Department workload distribution
  const deptMap = {}
  departments.forEach((d) => (deptMap[d.id] = d.name))

  const deptCounts = {}
  complaints.forEach((c) => {
    const dName = c.department_id ? deptMap[c.department_id] || 'Unassigned' : 'Unassigned'
    deptCounts[dName] = (deptCounts[dName] || 0) + 1
  })

  const departmentChartData = Object.entries(deptCounts).map(([name, count]) => ({
    name: name.length > 14 ? `${name.slice(0, 14)}...` : name,
    fullName: name,
    count,
  }))

  const totalRegistered = summary?.total_complaints || complaints.length || 0
  const underReviewCount = summary?.by_status?.['Under Review'] || 0
  const inProgressCount = summary?.by_status?.['In Progress'] || 0
  const resolvedCount = (summary?.by_status?.Resolved || 0) + (summary?.by_status?.Closed || 0)
  const criticalCount = (summary?.by_priority?.Critical || 0) + (summary?.by_priority?.High || 0)

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner message="Aggregating public grievance intelligence and metrics..." size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 text-left">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Operations & Grievance Intelligence Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time public grievance monitoring, departmental workloads, and spatial incident detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-700' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <Link
            to="/officer/complaints"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-blue-800 hover:bg-blue-900 text-white shadow-xs transition-colors"
          >
            <span>Manage All Complaints</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={handleManualRefresh} />}

      {/* Incident Alert Banner if clusters found */}
      {incidentClusters.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50/80 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                  <span>{incidentClusters.length} Active Incident Clusters Detected</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-900 uppercase">
                    Coordination Required
                  </span>
                </h3>
                <p className="text-xs text-red-800 mt-0.5">
                  Top Alert: <strong>{incidentClusters[0].title}</strong> ({incidentClusters[0].complaintCount} citizen reports).
                </p>
              </div>
            </div>

            <Link
              to="/officer/incidents"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-700 hover:bg-red-800 text-white shadow-xs self-start sm:self-auto transition-colors"
            >
              <span>View Incident Command</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Registered"
          value={totalRegistered}
          subtitle="All complaints logged"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Under Review"
          value={underReviewCount}
          subtitle="Awaiting officer triage"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="In Remediation"
          value={inProgressCount}
          subtitle="Field action active"
          icon={ArrowRightCircle}
          color="indigo"
        />
        <StatCard
          title="Resolved / Closed"
          value={resolvedCount}
          subtitle="Completed grievances"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="High / Critical"
          value={criticalCount}
          subtitle="Urgent public safety alerts"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Breakdown: 4 cols */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Status Breakdown
            </h3>
            <p className="text-xs text-slate-500">Distribution across resolution stages</p>
          </div>

          <div className="h-64 w-full flex-1">
            {statusChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No complaint status data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} Grievances`, name]}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Distribution: 4 cols */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Priority Levels
            </h3>
            <p className="text-xs text-slate-500">Severity assessment breakdown</p>
          </div>

          <div className="h-64 w-full flex-1">
            {totalRegistered === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No priority records recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val) => [`${val} Grievances`, 'Volume']}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department Workload: 4 cols */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Department Workload
            </h3>
            <p className="text-xs text-slate-500">Grievances assigned per department</p>
          </div>

          <div className="h-64 w-full flex-1">
            {departmentChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No department assignments yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={departmentChartData}
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip
                    formatter={(val, name, item) => [`${val} Grievances`, item.payload.fullName]}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Grievances Queue */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Recent Grievances Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest citizen grievances received in the district registry
            </p>
          </div>

          <Link
            to="/officer/complaints"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
          >
            <span>View Full Grievance Registry ({complaints.length})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Complaints Registered Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Citizen complaints submitted via the portal will appear here in real time.
            </p>
            <Link
              to="/register"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-800 text-white hover:bg-blue-900 transition-colors"
            >
              Register a Test Complaint
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Title & Issue</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {complaints.slice(0, 7).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-800">
                      <Link to={`/officer/complaints/${c.reference_id}`} className="hover:underline">
                        {c.reference_id}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{c.category}</p>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {c.department_id ? deptMap[c.department_id] || 'Unassigned' : 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {c.locality}, {c.district}
                    </td>

                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedComplaintForStatus(c)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                      >
                        Update
                      </button>

                      <Link
                        to={`/officer/complaints/${c.reference_id}`}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {selectedComplaintForStatus && (
        <StatusUpdateModal
          key={selectedComplaintForStatus.id}
          isOpen={!!selectedComplaintForStatus}
          complaint={selectedComplaintForStatus}
          onClose={() => setSelectedComplaintForStatus(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  )
}
