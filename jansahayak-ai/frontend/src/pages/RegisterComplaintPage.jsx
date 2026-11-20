import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Send,
  Building2,
  MapPin,
  Copy,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { complaintService } from '../services/complaintService'
import { departmentService } from '../services/departmentService'
import { getErrorMessage } from '../services/api'
import AIRecommendationCard from '../components/AIRecommendationCard'
import ErrorBanner from '../components/ErrorBanner'

const COMMON_DISTRICTS = [
  'Bhopal',
  'Indore',
  'Gwalior',
  'Jabalpur',
  'Ujjain',
  'Sagar',
  'Rewa',
  'Satna',
  'Ratlam',
  'Chhindwara',
]

const COMMON_CATEGORIES = [
  'Roads & Potholes',
  'Water Supply & Contamination',
  'Drainage & Sewage Overflow',
  'Electricity & Streetlights',
  'Garbage & Solid Waste',
  'Public Transport & Traffic Signals',
  'Public Health & Hospitals',
  'School & Education Facilities',
  'Encroachment & Land Records',
  'Other Civic Issues',
]

export default function RegisterComplaintPage() {
  const { lang, t } = useLanguage()

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'English',
    district: 'Bhopal',
    customDistrict: '',
    locality: '',
    category: 'Roads & Potholes',
    priority: 'Medium',
    department_id: '',
  })

  const [departments, setDepartments] = useState([])
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [createdComplaint, setCreatedComplaint] = useState(null)
  const [copied, setCopied] = useState(false)

  // Fetch departments on mount
  useEffect(() => {
    let isMounted = true
    departmentService
      .getDepartments()
      .then((data) => {
        if (isMounted) {
          setDepartments(data)
          if (data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              department_id: prev.department_id || data[0].id,
            }))
          }
          setLoadingDepts(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setSubmitError(getErrorMessage(err))
          setLoadingDepts(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    const effectiveDistrict = formData.district === 'Other' ? formData.customDistrict.trim() : formData.district
    if (formData.title.trim().length < 3 || formData.description.trim().length < 10 || !effectiveDistrict || formData.locality.trim().length < 2) {
      setAiAnalysis(null)
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setAiLoading(true)
      try {
        const result = await complaintService.analyzeComplaint({
          ...formData,
          district: effectiveDistrict,
          department_id: formData.department_id ? Number(formData.department_id) : null,
        })
        if (!cancelled) {
          const department = departments.find((item) => item.name === result.recommendedDepartmentName)
          setAiAnalysis({ ...result, recommendedDepartment: department || null })
        }
      } catch {
        if (!cancelled) setAiAnalysis(null)
      } finally {
        if (!cancelled) setAiLoading(false)
      }
    }, 450)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [formData.title, formData.description, formData.district, formData.customDistrict, formData.locality, formData.category, departments])

  const handleApplyAISuggestions = (analysis) => {
    if (!analysis) return

    setFormData((prev) => {
      const updates = { ...prev }

      if (analysis.recommendedDepartment) {
        updates.department_id = analysis.recommendedDepartment.id
      }
      if (analysis.suggestedPriority) {
        updates.priority = analysis.suggestedPriority
      }
      if (analysis.suggestedCategory) {
        updates.category = analysis.suggestedCategory
      }
      return updates
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    // Validation
    const effectiveDistrict = formData.district === 'Other'
      ? formData.customDistrict.trim()
      : formData.district.trim()

    if (formData.title.trim().length < 3) {
      setSubmitError('Title must be at least 3 characters long.')
      return
    }

    if (formData.description.trim().length < 10) {
      setSubmitError('Description must be at least 10 characters long.')
      return
    }

    if (!effectiveDistrict) {
      setSubmitError('Please enter a valid district name.')
      return
    }

    if (formData.locality.trim().length < 2) {
      setSubmitError('Locality / Ward must be at least 2 characters long.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        language: formData.language || (lang === 'hi' ? 'Hindi' : 'English'),
        district: effectiveDistrict,
        locality: formData.locality.trim(),
        category: formData.category.trim(),
        priority: formData.priority.trim() || 'Medium',
        department_id: formData.department_id ? Number(formData.department_id) : null,
      }

      const result = await complaintService.createComplaint(payload)
      setCreatedComplaint(result)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const copyRefId = () => {
    if (!createdComplaint?.reference_id) return
    navigator.clipboard.writeText(createdComplaint.reference_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // If successfully created, display confirmation screen
  if (createdComplaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-10 shadow-lg text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">✓</span>
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {t('successTitle')}
          </span>

          <h2 className="text-2xl font-bold text-slate-900 mt-3 font-serif">
            Grievance Formally Logged
          </h2>

          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            {t('successDesc')}
          </p>

          {/* Reference ID Showcase */}
          <div className="mt-8 p-6 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('refIdLabel')}
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-900 tracking-wider">
                {createdComplaint.reference_id}
              </span>
              <button
                type="button"
                onClick={copyRefId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                title="Copy Reference ID"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? t('copied') : t('copyId')}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Save this reference ID to track status updates or provide additional information.
            </p>
          </div>

          {/* Summary Details */}
          <div className="mt-6 text-left max-w-md mx-auto p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-xs space-y-1.5 text-slate-700">
            <p><strong>Title:</strong> {createdComplaint.title}</p>
            <p><strong>Location:</strong> {createdComplaint.locality}, {createdComplaint.district}</p>
            <p><strong>Priority:</strong> {createdComplaint.priority}</p>
            <p><strong>Status:</strong> {createdComplaint.status}</p>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={`/track/${createdComplaint.reference_id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-blue-800 hover:bg-blue-900 text-white shadow-md transition-all cursor-pointer"
            >
              <span>{t('trackNow')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setCreatedComplaint(null)
                setFormData({
                  title: '',
                  description: '',
                  language: 'English',
                  district: 'Bhopal',
                  customDistrict: '',
                  locality: '',
                  category: 'Roads & Potholes',
                  priority: 'Medium',
                  department_id: departments[0]?.id || '',
                })
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('registerAnother')}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8 text-left">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-300" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Citizen Grievance Filing Portal
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif">
          {t('regHeading')}
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          {t('regSubheading')}
        </p>
      </div>

      {submitError && (
        <div className="mb-6">
          <ErrorBanner message={submitError} onRetry={() => setSubmitError(null)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 text-left"
          >
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t('titleLabel')} *
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.title.length}/200
                </span>
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('titlePlaceholder')}
                required
                minLength={3}
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Provide a clear summary of the issue (min. 3 characters).
              </p>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t('descLabel')} *
                </label>
                <span className={`text-[11px] ${formData.description.length < 10 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {formData.description.length} chars (min 10)
                </span>
              </div>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder={t('descPlaceholder')}
                required
                minLength={10}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Mention specific landmarks, how long the issue has persisted, and any hazards.
              </p>
            </div>

            {/* Grid 2-cols: Language and District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {t('langLabel')} *
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी (Hindi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {t('districtLabel')} *
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {COMMON_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="Other">Other (Enter custom)</option>
                </select>
              </div>
            </div>

            {/* Custom District if 'Other' selected */}
            {formData.district === 'Other' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Enter District Name *
                </label>
                <input
                  type="text"
                  name="customDistrict"
                  value={formData.customDistrict}
                  onChange={handleChange}
                  placeholder="Enter district name"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {/* Locality */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                {t('localityLabel')} *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="locality"
                  value={formData.locality}
                  onChange={handleChange}
                  placeholder={t('localityPlaceholder')}
                  required
                  minLength={2}
                  maxLength={200}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {t('categoryLabel')} *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  {t('priorityLabel')} *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="Low">Low - Informational / Routine</option>
                  <option value="Medium">Medium - Regular Civic Action</option>
                  <option value="High">High - Urgent Public Inconvenience</option>
                  <option value="Critical">Critical - Safety Hazard / Emergency</option>
                </select>
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t('deptLabel')} (Auto-routed by AI)
                </label>
                {loadingDepts && (
                  <span className="text-[11px] text-blue-600">Loading departments...</span>
                )}
              </div>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  disabled={loadingDepts}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="">-- No Department Assigned / General Administration --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} — {dept.description || 'Public service portfolio'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-800 hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-md transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('submittingBtn')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>{t('submitBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: AI Copilot & Guidance (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Intelligence Card */}
          {aiLoading && <p className="text-xs text-slate-500 text-right">Analyzing with the backend intelligence service...</p>}
          <AIRecommendationCard
            analysis={aiAnalysis}
            onApply={handleApplyAISuggestions}
            showApplyButton={true}
          />

          {/* Citizen Help & Instructions Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs text-left space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Info className="w-4 h-4 text-blue-700" />
              <span>Guidelines for Grievance Registration</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>Keep titles specific (e.g., mention street name or landmark).</li>
              <li>You can type your description in either English or Hindi (Devanagari).</li>
              <li>The system AI automatically maps your grievance to the relevant administrative department.</li>
              <li>For life-threatening emergencies, immediately dial <strong>112</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
