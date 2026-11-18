import { Outlet, NavLink } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { LayoutDashboard, FileText, AlertOctagon, UserCheck, Shield } from 'lucide-react'

export default function OfficerLayout() {
  const tabs = [
    { to: '/officer', end: true, label: 'Analytics & Overview', icon: LayoutDashboard },
    { to: '/officer/complaints', end: false, label: 'Grievance Management', icon: FileText },
    { to: '/officer/incidents', end: false, label: 'Incident Intelligence Clusters', icon: AlertOctagon },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Officer Command Banner */}
      <div className="bg-slate-800 text-white border-b border-slate-700 py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  District Grievance Redressal & Incident Command
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Officer Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Department Escalation, Status Transition & Proactive Coordination Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Role: <strong>Nodal Redressal Officer (Zone 1)</strong></span>
          </div>
        </div>
      </div>

      {/* Officer Sub-navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
