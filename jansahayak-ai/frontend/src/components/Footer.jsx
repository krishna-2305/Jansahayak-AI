import { PhoneCall } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      {/* Helpline strip */}
      <div className="bg-slate-950 py-4 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>National Citizen Emergency & Grievance Toll-Free Helplines:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-medium text-slate-300">
            <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
              National Emergency: <strong className="text-white">112</strong>
            </span>
            <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
              Citizen Grievance Helpline: <strong className="text-white">1800-11-4000</strong>
            </span>
            <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
              Women Helpline: <strong className="text-white">1091</strong>
            </span>
            <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
              Childline: <strong className="text-white">1098</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-bold">
                JS
              </div>
              <span className="text-base font-bold text-white font-serif">JanSahayak AI</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Public Grievance Intelligence and Incident Coordination System. Powered by modern machine learning classification and multi-department coordination workflows.
            </p>
            <div className="pt-2 text-[10px] text-slate-500">
              FastAPI SQLite Backend • React Vite Frontend • Secure Citizen Architecture
            </div>
          </div>

          {/* Col 2: Citizen Portals */}
          <div>
            <h5 className="text-white font-semibold uppercase tracking-wider text-xs mb-3">
              Citizen Services
            </h5>
            <ul className="space-y-2 text-[12px]">
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register Civic Grievance
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">
                  Track Complaint by Reference ID
                </Link>
              </li>
              <li>
                <Link to="/officer" className="hover:text-white transition-colors">
                  Department Officer Login
                </Link>
              </li>
              <li>
                <Link to="/officer/incidents" className="hover:text-white transition-colors">
                  Public Incident Intelligence
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Government Standards */}
          <div>
            <h5 className="text-white font-semibold uppercase tracking-wider text-xs mb-3">
              Redressal Departments
            </h5>
            <ul className="space-y-2 text-[12px]">
              <li>Public Works (Roads, Drainage, Bridges)</li>
              <li>Sanitation & Solid Waste Management</li>
              <li>Public Health & Medical Services</li>
              <li>Transport & Road Traffic Safety</li>
              <li>Education & School Administration</li>
              <li>Revenue & Land Record Administration</li>
            </ul>
          </div>

          {/* Col 4: Important Links */}
          <div>
            <h5 className="text-white font-semibold uppercase tracking-wider text-xs mb-3">
              Compliance & Security
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              This system adheres to the Open Government Data principles and Grievance Redressal Mechanism mandates of the Government of India.
            </p>
            <div className="text-[11px] text-amber-400 font-medium">
              Citizens are advised not to share banking credentials, OTPs, or passwords in grievance descriptions.
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>
            © {new Date().getFullYear()} JanSahayak AI. Designed for Public Service & District Incident Management.
          </p>
          <p className="flex items-center gap-1">
            Built with <span>Digital Public Infrastructure</span> standards
          </p>
        </div>
      </div>
    </footer>
  )
}
