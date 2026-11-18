import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  FileText,
  Search,
  LayoutDashboard,
  AlertOctagon,
  Languages,
  Menu,
  X,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { dashboardService } from '../services/dashboardService'

export default function Navbar() {
  const { lang, toggleLanguage, t } = useLanguage()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking') // 'online' | 'offline' | 'checking'

  useEffect(() => {
    let isMounted = true

    const checkServer = async () => {
      try {
        await dashboardService.checkHealth()
        if (isMounted) setBackendStatus('online')
      } catch {
        if (isMounted) setBackendStatus('offline')
      }
    }

    checkServer()
    const interval = setInterval(checkServer, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const navLinks = [
    { to: '/', label: t('navHome'), icon: ShieldCheck },
    { to: '/register', label: t('navRegister'), icon: FileText, highlight: true },
    { to: '/track', label: t('navTrack'), icon: Search },
    { to: '/officer', label: t('navOfficer'), icon: LayoutDashboard },
    { to: '/officer/incidents', label: t('navIncidents'), icon: AlertOctagon },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* India Tricolor Header Stripe */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-[#FF9933]" />
        <div className="bg-white border-y border-slate-200/40" />
        <div className="bg-[#138808]" />
      </div>

      {/* Top Gov Branding Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            {lang === 'hi' ? 'भारत सरकार • लोक शिकायत एवं पेंशन मंत्रालय' : 'Government of India • Ministry of Personnel, Public Grievances & Pensions'}
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">
            National Public Grievance Intelligence Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Backend Status indicator */}
          <div className="flex items-center gap-1.5" title="Backend FastAPI status">
            {backendStatus === 'online' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-medium">{t('backendOnline')}</span>
              </>
            ) : backendStatus === 'offline' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-rose-300 font-medium">{t('backendOffline')}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300">Connecting...</span>
              </>
            )}
          </div>

          <span className="text-slate-600">|</span>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1 text-slate-200 hover:text-white font-semibold transition-colors cursor-pointer px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('switchLang')}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Portal Title & Emblem */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-900 to-blue-950 text-white flex items-center justify-center shadow-md border border-blue-800">
              <ShieldCheck className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-serif">
                  {t('appName')}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 uppercase tracking-widest border border-blue-200">
                  AI 2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {t('appSub')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.to)

              if (link.highlight) {
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="inline-flex items-center gap-2 ml-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-amber-300" />
                    <span>{link.label}</span>
                  </Link>
                )
              }

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.to)

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  link.highlight
                    ? 'bg-blue-800 text-white shadow-xs'
                    : active
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${link.highlight ? 'text-amber-300' : active ? 'text-blue-700' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
