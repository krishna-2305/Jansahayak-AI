import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Search,
  RefreshCw,
  ExternalLink,
  Download,
} from 'lucide-react'
import { complaintService } from '../services/complaintService'
import { departmentService } from '../services/departmentService'
import { getErrorMessage } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import StatusUpdateModal from '../components/StatusUpdateModal'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

export default function OfficerComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('date_desc')

  // Status update modal
  const [modalComplaint, setModalComplaint] = useState(null)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      complaintService.listComplaints(0, 300),
      departmentService.getDepartments(),
    ])
      .then(([complaintsRes, deptsRes]) => {
        if (isMounted) {
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
      const [complaintsRes, deptsRes] = await Promise.all([
        complaintService.listComplaints(0, 300),
        departmentService.getDepartments(),
      ])
      setComplaints(complaintsRes)
      setDepartments(deptsRes)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRefreshing(false)
    }
  }

  const handleStatusUpdated = (updated) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    )
  }

  // Department ID to Name map
  const deptMap = useMemo(() => {
    const map = {}
    departments.forEach((d) => (map[d.id] = d.name))
    return map
  }, [departments])

  // Filtered & Sorted complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchRef = c.reference_id?.toLowerCase().includes(q)
        const matchTitle = c.title?.toLowerCase().includes(q)
        const matchLoc = c.locality?.toLowerCase().includes(q)
        const matchDist = c.district?.toLowerCase().includes(q)
        const matchCat = c.category?.toLowerCase().includes(q)
        if (!matchRef && !matchTitle && !matchLoc && !matchDist && !matchCat) {
          return false
        }
      }

      // Status
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false
      }

      // Priority
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) {
        return false
      }

      // Department
      if (deptFilter !== 'ALL') {
        if (deptFilter === 'UNASSIGNED') {
          if (c.department_id !== null) return false
        } else if (Number(deptFilter) !== c.department_id) {
          return false
        }
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      if (sortBy === 'date_asc') {
        return new Date(a.created_at) - new Date(b.created_at)
      }
      if (sortBy === 'priority') {
        const pOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0)
      }
      return 0
    })
  }, [complaints, searchQuery, statusFilter, priorityFilter, deptFilter, sortBy])

  // Export filtered complaints to CSV
  const exportToCSV = () => {
    if (filteredComplaints.length === 0) return

    const headers = ['Reference ID', 'Title', 'Category', 'Department', 'District', 'Locality', 'Priority', 'Status', 'Filing Date']
    const rows = filteredComplaints.map((c) => [
      `"${c.reference_id}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.category || '').replace(/"/g, '""')}"`,
      `"${c.department_id ? deptMap[c.department_id] || '' : 'Unassigned'}"`,
      `"${(c.district || '').replace(/"/g, '""')}"`,
      `"${(c.locality || '').replace(/"/g, '""')}"`,
      `"${c.priority || ''}"`,
      `"${c.status || ''}"`,
      `"${new Date(c.created_at).toISOString()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `JanSahayak_Complaints_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Public Grievance Registry & Triage Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter, search, audit, and transition citizen grievances across all administrative departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredComplaints.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-700' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={handleManualRefresh} />}

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Reference ID, Title, Locality, District, or Category..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Departments</option>
              <option value="UNASSIGNED">Unassigned</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="priority">Priority (Critical First)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong>{filteredComplaints.length}</strong> of {complaints.length} grievances
          </span>
          {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || deptFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('ALL')
                setPriorityFilter('ALL')
                setDeptFilter('ALL')
              }}
              className="text-blue-700 hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading grievance registry..." />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-16 p-6">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Matching Grievances Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords, clearing status filters, or selecting a different department.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Date Filed</th>
                  <th className="py-3 px-4">Grievance Title & Summary</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Ref ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-800">
                      <Link
                        to={`/officer/complaints/${c.reference_id}`}
                        className="hover:underline flex items-center gap-1"
                        title="Open Officer Dossier"
                      >
                        <span>{c.reference_id}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Title & Desc */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-900 line-clamp-1">{c.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {c.department_id ? deptMap[c.department_id] || 'Unassigned' : 'Unassigned'}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <p className="font-medium text-slate-900">{c.locality}</p>
                      <p className="text-[10px] text-slate-400">{c.district}</p>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => setModalComplaint(c)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                        title="Update Status"
                      >
                        Update
                      </button>

                      <Link
                        to={`/officer/complaints/${c.reference_id}`}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Details
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
      {modalComplaint && (
        <StatusUpdateModal
          key={modalComplaint.id}
          isOpen={!!modalComplaint}
          complaint={modalComplaint}
          onClose={() => setModalComplaint(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  )
}
