import { createBrowserRouter } from 'react-router-dom'

import Layout from './components/Layout'
import Login from './pages/Login'
import AuthGuard from './components/AuthGuard'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Meters from './pages/Meters'
import Readings from './pages/Readings'

import Users from './pages/Users'
import Tariffs from './pages/Tariffs'
import Invoices from './pages/Invoices'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import AuditLogs from './pages/AuditLogs'
import SubmitReading from './pages/SubmitReading'
import MyReadings from './pages/Myreadings'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Login />
      },

    
      {
        path: '/',
        element: (
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        ),
        children: [
          {
            path: 'dashboard',
            element: (
              <AuthGuard allowedRoles={['admin','field_staff']}>
                <Dashboard />
              </AuthGuard>
            )
          },
          {
            path: 'customers',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Customers />
              </AuthGuard>
            )
          },
          {
            path: 'meters',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Meters />
              </AuthGuard>
            )
          },
          {
            path: 'readings',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Readings />
              </AuthGuard>
            )
          },
          {
            path: 'tariffs',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Tariffs />
              </AuthGuard>
            )
          },
          {
            path: 'invoices',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Invoices />
              </AuthGuard>
            )
          },
          {
            path: 'payments',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Payments />
              </AuthGuard>
            )
          },
          {
            path: 'reports',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Reports />
              </AuthGuard>
            )
          },
          {
            path: 'notifications',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Notifications />
              </AuthGuard>
            )
          },
          {
            path: 'audit-logs',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <AuditLogs />
              </AuthGuard>
            )
          },
          {
            path: 'users',
            element: (
              <AuthGuard allowedRoles={['admin']}>
                <Users />
              </AuthGuard>
            )
          },
          {
            path: 'submit-reading',
            element: (
              <AuthGuard allowedRoles={['admin','field_staff']}>
                <SubmitReading />
              </AuthGuard>
            )
          },
          {
            path: 'my-readings',
           element: (
              <AuthGuard allowedRoles={['admin','field_staff']}>
                <MyReadings />
              </AuthGuard>
            )
          },
            {
        path: '/unauthorized',
        element: (
          <div className='min-h-screen bg-back-500 flex items-center justify-center'>
            <p className='text-text-500 text-lg'>Access denied.</p>
          </div>
        )
      },
        ]
      }
    ]
  }
])

export default router
