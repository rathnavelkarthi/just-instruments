import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Instruments from './pages/Instruments'
import TestEquipment from './pages/TestEquipment'
import CalibrationStaff from './pages/CalibrationStaff'
import Certificates from './pages/Certificates'
import CreateCertificate from './pages/CreateCertificate'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="instruments" element={<Instruments />} />
                <Route path="test-equipment" element={<TestEquipment />} />
                <Route path="calibration-staff" element={<CalibrationStaff />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="certificates/create" element={<CreateCertificate />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
