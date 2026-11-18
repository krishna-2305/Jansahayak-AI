import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import MainLayout from './layouts/MainLayout'
import OfficerLayout from './layouts/OfficerLayout'
import HomePage from './pages/HomePage'
import RegisterComplaintPage from './pages/RegisterComplaintPage'
import TrackComplaintPage from './pages/TrackComplaintPage'
import OfficerDashboardPage from './pages/OfficerDashboardPage'
import OfficerComplaintsPage from './pages/OfficerComplaintsPage'
import OfficerComplaintDetailPage from './pages/OfficerComplaintDetailPage'
import OfficerIncidentsPage from './pages/OfficerIncidentsPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Citizen Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterComplaintPage />} />
            <Route path="/track" element={<TrackComplaintPage />} />
            <Route path="/track/:referenceId" element={<TrackComplaintPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Department Officer Command Routes */}
          <Route element={<OfficerLayout />}>
            <Route path="/officer" element={<OfficerDashboardPage />} />
            <Route path="/officer/complaints" element={<OfficerComplaintsPage />} />
            <Route path="/officer/complaints/:referenceId" element={<OfficerComplaintDetailPage />} />
            <Route path="/officer/incidents" element={<OfficerIncidentsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
