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
        path: '/unauthorized',
        element: (
          <div className='min-h-screen bg-back-500 flex items-center justify-center'>
            <p className='text-text-500 text-lg'>Access denied.</p>
          </div>
        )
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
              <AuthGuard allowedRoles={['admin']}>
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
              <div className='p-4 text-text-500'>Invoices coming soon</div>
            )
          },
          {
            path: 'payments',
            element: (
              <div className='p-4 text-text-500'>Payments coming soon</div>
            )
          },
          {
            path: 'reports',
            element: (
              <div className='p-4 text-text-500'>Reports coming soon</div>
            )
          },
          {
            path: 'notifications',
            element: (
              <div className='p-4 text-text-500'>Notifications coming soon</div>
            )
          },
          {
            path: 'audit-logs',
            element: (
              <div className='p-4 text-text-500'>Audit logs coming soon</div>
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
              <div className='p-4 text-text-500'>
                Submit reading coming soon
              </div>
            )
          },
          {
            path: 'my-readings',
            element: (
              <div className='p-4 text-text-500'>My readings coming soon</div>
            )
          }
        ]
      }
    ]
  }
])

export default router
