import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import api from './services/api'

function Home() {
  const [health, setHealth] = useState('Checking...')

  useEffect(() => {
    api
      .get('/api/health')
      .then((response) => setHealth(response.data.message))
      .catch(() => setHealth('Backend unavailable'))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Development environment
        </p>
        <h1 className="text-4xl font-bold">JanSahayak AI</h1>
        <p className="mt-3 text-slate-600">
          Public Grievance Intelligence &amp; Incident Coordination System
        </p>
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Backend status</p>
          <p className="mt-1 font-medium">{health}</p>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
