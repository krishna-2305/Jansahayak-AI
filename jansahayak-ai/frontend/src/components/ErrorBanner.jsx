import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-900">An Error Occurred</h4>
            <p className="mt-1 text-sm text-red-700">{message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-100 hover:bg-red-200 text-red-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
