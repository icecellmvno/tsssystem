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
import UsersShow from '@/pages/users/show'
import UsersCreate from '@/pages/users/create'
import UsersEdit from '@/pages/users/edit'
import RolesIndex from '@/pages/roles/index'
import RolesShow from '@/pages/roles/show'
import RolesCreate from '@/pages/roles/create'
import RolesEdit from '@/pages/roles/edit'
import PermissionsIndex from '@/pages/permissions/index'
import PermissionsShow from '@/pages/permissions/show'
import PermissionsCreate from '@/pages/permissions/create'
import PermissionsEdit from '@/pages/permissions/edit'
import DevicesIndex from '@/pages/devices/index'
import DeviceShow from '@/pages/devices/show'
import CountrySitesIndex from '@/pages/countrysites/index'
import CountrySiteCreate from '@/pages/countrysites/create'
import CountrySiteEdit from '@/pages/countrysites/edit'
import DeviceGroupsIndex from '@/pages/device-groups/index'
import DeviceGroupCreate from '@/pages/device-groups/create'
import DeviceGroupEdit from '@/pages/device-groups/edit'

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
import AlarmLogsIndex from '@/pages/alarm-logs/index'
import AlarmLogsShow from '@/pages/alarm-logs/show'
import FiltersIndex from '@/pages/filters/index'
import FiltersCreate from '@/pages/filters/create'
import FiltersEdit from '@/pages/filters/edit'
import FiltersShow from '@/pages/filters/show'
import ScheduleTasksIndex from '@/pages/schedule-tasks/index'
import ScheduleTasksCreate from '@/pages/schedule-tasks/create'
import ScheduleTasksShow from '@/pages/schedule-tasks/show'
import ScheduleTasksEdit from '@/pages/schedule-tasks/edit'
import UssdLogsIndex from '@/pages/ussd-logs/index'
import UssdLogsShow from '@/pages/ussd-logs/show'
import SimCardsIndex from '@/pages/sim-cards/index'
import SimCardsCreate from '@/pages/sim-cards/create'
import SimCardsShow from '@/pages/sim-cards/show'
import SimCardsEdit from '@/pages/sim-cards/edit'
// import SmppRoutingsIndex from '@/pages/smpp-routings/index'
// import SmppRoutingsCreate from '@/pages/smpp-routings/create'
// import SmppRoutingsShow from '@/pages/smpp-routings/show'
// import SmppRoutingsEdit from '@/pages/smpp-routings/edit'

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
            <Route path="/users/create" element={
              <ProtectedRoute>
                <UsersCreate />
              </ProtectedRoute>
            } />
            <Route path="/users/:id" element={
              <ProtectedRoute>
                <UsersShow />
              </ProtectedRoute>
            } />
            <Route path="/users/:id/edit" element={
              <ProtectedRoute>
                <UsersEdit />
              </ProtectedRoute>
            } />
            
            {/* Roles routes */}
            <Route path="/roles" element={
              <ProtectedRoute>
                <RolesIndex />
              </ProtectedRoute>
            } />
            <Route path="/roles/create" element={
              <ProtectedRoute>
                <RolesCreate />
              </ProtectedRoute>
            } />
            <Route path="/roles/:id" element={
              <ProtectedRoute>
                <RolesShow />
              </ProtectedRoute>
            } />
            <Route path="/roles/:id/edit" element={
              <ProtectedRoute>
                <RolesEdit />
              </ProtectedRoute>
            } />
            
            {/* Permissions routes */}
            <Route path="/permissions" element={
              <ProtectedRoute>
                <PermissionsIndex />
              </ProtectedRoute>
            } />
            <Route path="/permissions/create" element={
              <ProtectedRoute>
                <PermissionsCreate />
              </ProtectedRoute>
            } />
            <Route path="/permissions/:id" element={
              <ProtectedRoute>
                <PermissionsShow />
              </ProtectedRoute>
            } />
            <Route path="/permissions/:id/edit" element={
              <ProtectedRoute>
                <PermissionsEdit />
              </ProtectedRoute>
            } />
            
            {/* Sitenames routes */}
            <Route path="/country-sites" element={
              <ProtectedRoute>
                <CountrySitesIndex />
              </ProtectedRoute>
            } />
            <Route path="/country-sites/create" element={
              <ProtectedRoute>
                <CountrySiteCreate />
              </ProtectedRoute>
            } />
            <Route path="/country-sites/:id/edit" element={
              <ProtectedRoute>
                <CountrySiteEdit />
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
            
            {/* Alarm Logs routes */}
            <Route path="/alarm-logs" element={
              <ProtectedRoute>
                <AlarmLogsIndex />
              </ProtectedRoute>
            } />
            <Route path="/alarm-logs/:id" element={
              <ProtectedRoute>
                <AlarmLogsShow />
              </ProtectedRoute>
            } />
            
            {/* Filters routes */}
            <Route path="/filters" element={
              <ProtectedRoute>
                <FiltersIndex />
              </ProtectedRoute>
            } />
            <Route path="/filters/create" element={
              <ProtectedRoute>
                <FiltersCreate />
              </ProtectedRoute>
            } />
            <Route path="/filters/:id" element={
              <ProtectedRoute>
                <FiltersShow />
              </ProtectedRoute>
            } />
            <Route path="/filters/:id/edit" element={
              <ProtectedRoute>
                <FiltersEdit />
              </ProtectedRoute>
            } />
            
            {/* Schedule Tasks routes */}
            <Route path="/schedule-tasks" element={
              <ProtectedRoute>
                <ScheduleTasksIndex />
              </ProtectedRoute>
            } />
            <Route path="/schedule-tasks/create" element={
              <ProtectedRoute>
                <ScheduleTasksCreate />
              </ProtectedRoute>
            } />
            <Route path="/schedule-tasks/:id" element={
              <ProtectedRoute>
                <ScheduleTasksShow />
              </ProtectedRoute>
            } />
            <Route path="/schedule-tasks/:id/edit" element={
              <ProtectedRoute>
                <ScheduleTasksEdit />
              </ProtectedRoute>
            } />
            
            {/* USSD Logs routes */}
            <Route path="/ussd-logs" element={
              <ProtectedRoute>
                <UssdLogsIndex />
              </ProtectedRoute>
            } />
            <Route path="/ussd-logs/:id" element={
              <ProtectedRoute>
                <UssdLogsShow />
              </ProtectedRoute>
            } />
            
            {/* SIM Cards routes */}
            <Route path="/sim-cards" element={
              <ProtectedRoute>
                <SimCardsIndex />
              </ProtectedRoute>
            } />
            <Route path="/sim-cards/create" element={
              <ProtectedRoute>
                <SimCardsCreate />
              </ProtectedRoute>
            } />
            <Route path="/sim-cards/:id" element={
              <ProtectedRoute>
                <SimCardsShow />
              </ProtectedRoute>
            } />
            <Route path="/sim-cards/:id/edit" element={
              <ProtectedRoute>
                <SimCardsEdit />
              </ProtectedRoute>
            } />
            
            {/* SMPP Routings routes - TODO: Convert from Inertia.js to React Router */}
            {/* <Route path="/smpp-routings" element={
              <ProtectedRoute>
                <SmppRoutingsIndex />
              </ProtectedRoute>
            } />
            <Route path="/smpp-routings/create" element={
              <ProtectedRoute>
                <SmppRoutingsCreate />
              </ProtectedRoute>
            } />
            <Route path="/smpp-routings/:id" element={
              <ProtectedRoute>
                <SmppRoutingsShow />
              </ProtectedRoute>
            } />
            <Route path="/smpp-routings/:id/edit" element={
              <ProtectedRoute>
                <SmppRoutingsEdit />
              </ProtectedRoute>
            } /> */}
            
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