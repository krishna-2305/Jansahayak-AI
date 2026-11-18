import { Link } from 'react-router-dom'
import { ShieldAlert, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4 border border-slate-200">
        <ShieldAlert className="w-8 h-8 text-blue-800" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 font-serif">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mt-1">Page or Record Not Found</h2>
      <p className="text-xs text-slate-500 mt-2">
        The public grievance page or administrative route you requested does not exist or has been relocated.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-blue-800 hover:bg-blue-900 text-white shadow-xs transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Portal Home</span>
        </Link>
        <Link
          to="/track"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <span>Track Complaint</span>
        </Link>
      </div>
    </div>
  )
}
