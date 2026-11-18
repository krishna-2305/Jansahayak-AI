import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  Building2,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { dashboardService } from '../services/dashboardService'
import { departmentService } from '../services/departmentService'

export default function HomePage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [quickRefId, setQuickRefId] = useState('')
  const [summary, setSummary] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [sumData, deptData] = await Promise.all([
          dashboardService.getSummary().catch(() => null),
          departmentService.getDepartments().catch(() => []),
        ])
        if (isMounted) {
          setSummary(sumData)
          setDepartments(deptData)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  const handleQuickTrack = (e) => {
    e.preventDefault()
    if (!quickRefId.trim()) return
    navigate(`/track/${quickRefId.trim().toUpperCase()}`)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-linear-to-b from-blue-900 via-blue-950 to-slate-900 text-white py-16 lg:py-24 overflow-hidden">
        {/* Subtle background mesh */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left text */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-800/80 border border-blue-700/60 text-xs font-semibold text-blue-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>{t('heroBadge')}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight font-serif">
                {t('heroTitle')}
              </h1>

              <p className="text-base sm:text-lg text-blue-100/90 leading-relaxed max-w-2xl">
                {t('heroDesc')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('btnFileGrievance')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/track"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs shadow-md transition-all duration-200 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-blue-300" />
                  <span>{t('btnTrackStatus')}</span>
                </Link>
              </div>

              {/* Fast Track Input Box */}
              <div className="pt-4 max-w-xl">
                <form
                  onSubmit={handleQuickTrack}
                  className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-xl"
                >
                  <Search className="w-5 h-5 text-blue-300 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={quickRefId}
                    onChange={(e) => setQuickRefId(e.target.value)}
                    placeholder="Fast Track: Enter JS-Reference ID (e.g., JS-8F3A2B1C)"
                    className="flex-1 bg-transparent border-0 text-white placeholder-blue-200/70 text-sm focus:outline-hidden font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Track
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Live Impact Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6 text-left">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Live Grievance Redressal</h3>
                      <p className="text-xs text-blue-200">Real-time Public Administration Status</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">Total Registered</p>
                    <p className="text-3xl font-extrabold text-white mt-1 font-mono">
                      {summary?.total_complaints ?? (loading ? '...' : 0)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">Resolved & Closed</p>
                    <p className="text-3xl font-extrabold text-emerald-300 mt-1 font-mono">
                      {(summary?.by_status?.Resolved || 0) + (summary?.by_status?.Closed || 0)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">Under Remediation</p>
                    <p className="text-3xl font-extrabold text-amber-300 mt-1 font-mono">
                      {summary?.by_status?.['In Progress'] || 0}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">Active Departments</p>
                    <p className="text-3xl font-extrabold text-blue-200 mt-1 font-mono">
                      {departments.length || 6}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/officer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-blue-200 border border-white/10 transition-colors"
                  >
                    <span>View Official Officer Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              End-to-End Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 font-serif">
              {t('howItWorks')}
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Combining citizen participation with automated incident intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:shadow-md transition-shadow text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step1Title')}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{t('step1Desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:shadow-md transition-shadow text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step2Title')}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{t('step2Desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:shadow-md transition-shadow text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step3Title')}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{t('step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
                Departmental Coverage
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1 font-serif">
                Civic Redressal Portfolios
              </h2>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
            >
              <span>Submit a grievance across any department</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{dept.name}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {dept.description || 'Public service grievance redressal and civil infrastructure monitoring.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
