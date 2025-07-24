import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import './index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuthStore } from '@/stores/auth-store'
import { WebSocketProvider } from '@/contexts/websocket-context'
import { SettingsPage } from '@/pages/SettingsPage'
import Dashboard from '@/pages/dashboard'
import Login from '@/pages/auth/login'
import Register from '@/pages/auth/register'
import ForgotPassword from '@/pages/auth/forgot-password'
import UsersIndex from '@/pages/users/index'
import DevicesIndex from '@/pages/devices/index'
import DeviceShow from '@/pages/devices/show'
import SitenamesIndex from '@/pages/sitenames/index'
import SitenameCreate from '@/pages/sitenames/create'
import SitenameEdit from '@/pages/sitenames/edit'
import DeviceGroupsIndex from '@/pages/device-groups/index'
import DeviceGroupCreate from '@/pages/device-groups/create'
import DeviceGroupEdit from '@/pages/device-groups/edit'
import WebSocketTest from '@/pages/websocket-test'
import QRGenerator from '@/pages/qr-generator'
import BlacklistNumbersIndex from '@/pages/blacklist-numbers/index'
import BlacklistNumbersCreate from '@/pages/blacklist-numbers/create'
import BlacklistNumbersEdit from '@/pages/blacklist-numbers/edit'
import BlacklistNumbersShow from '@/pages/blacklist-numbers/show'
import SmppUsersIndex from '@/pages/smpp-users/index'
import SmppUsersCreate from '@/pages/smpp-users/create'
import SmppUsersEdit from '@/pages/smpp-users/edit'
import SmppUsersShow from '@/pages/smpp-users/show'
import SmsLogsIndex from '@/pages/sms-logs/index'
import SmsLogsShow from '@/pages/sms-logs/show'

function App() {
  const { checkAuth } = useAuthStore();

  // Initialize auth state on app startup
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <WebSocketProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
   
            <Route path="/devices" element={
              <ProtectedRoute>
                <DevicesIndex />
              </ProtectedRoute>
            } />
            <Route path="/devices/:imei" element={
              <ProtectedRoute>
                <DeviceShow />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <UsersIndex />
              </ProtectedRoute>
            } />
            
            {/* Sitenames routes */}
            <Route path="/sitenames" element={
              <ProtectedRoute>
                <SitenamesIndex />
              </ProtectedRoute>
            } />
            <Route path="/sitenames/create" element={
              <ProtectedRoute>
                <SitenameCreate />
              </ProtectedRoute>
            } />
            <Route path="/sitenames/:id/edit" element={
              <ProtectedRoute>
                <SitenameEdit />
              </ProtectedRoute>
            } />
            
            {/* Device Groups routes */}
            <Route path="/device-groups" element={
              <ProtectedRoute>
                <DeviceGroupsIndex />
              </ProtectedRoute>
            } />
            <Route path="/device-groups/create" element={
              <ProtectedRoute>
                <DeviceGroupCreate />
              </ProtectedRoute>
            } />
            <Route path="/device-groups/:id/edit" element={
              <ProtectedRoute>
                <DeviceGroupEdit />
              </ProtectedRoute>
            } />
            
            <Route path="/websocket-test" element={
              <ProtectedRoute>
                <WebSocketTest />
              </ProtectedRoute>
            } />
            
            <Route path="/qr-generator" element={
              <ProtectedRoute>
                <QRGenerator />
              </ProtectedRoute>
            } />
            
            {/* Blacklist Numbers routes */}
            <Route path="/blacklist-numbers" element={
              <ProtectedRoute>
                <BlacklistNumbersIndex />
              </ProtectedRoute>
            } />
            <Route path="/blacklist-numbers/create" element={
              <ProtectedRoute>
                <BlacklistNumbersCreate />
              </ProtectedRoute>
            } />
            <Route path="/blacklist-numbers/:id" element={
              <ProtectedRoute>
                <BlacklistNumbersShow />
              </ProtectedRoute>
            } />
            <Route path="/blacklist-numbers/:id/edit" element={
              <ProtectedRoute>
                <BlacklistNumbersEdit />
              </ProtectedRoute>
            } />
            
            {/* SMPP Users routes */}
            <Route path="/smpp-users" element={
              <ProtectedRoute>
                <SmppUsersIndex />
              </ProtectedRoute>
            } />
            <Route path="/smpp-users/create" element={
              <ProtectedRoute>
                <SmppUsersCreate />
              </ProtectedRoute>
            } />
            <Route path="/smpp-users/:id" element={
              <ProtectedRoute>
                <SmppUsersShow />
              </ProtectedRoute>
            } />
            <Route path="/smpp-users/:id/edit" element={
              <ProtectedRoute>
                <SmppUsersEdit />
              </ProtectedRoute>
            } />
            
            {/* SMS Logs routes */}
            <Route path="/sms-logs" element={
              <ProtectedRoute>
                <SmsLogsIndex />
              </ProtectedRoute>
            } />
            <Route path="/sms-logs/:id" element={
              <ProtectedRoute>
                <SmsLogsShow />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </div>
        </Router>
      </WebSocketProvider>
    </ThemeProvider>
  )
}

export default App 