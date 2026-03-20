import { createBrowserRouter,Navigate } from 'react-router-dom'


import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import Payments from './pages/Payments'
import Consumption from './pages/Consumption'
import AuthGuard from './components/AuthGuard'
import AppLayout from './components/AppLayout'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AuthGuard>
      <AppLayout />
      </AuthGuard>,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'invoices', element: <Invoices /> },
      { path: 'payments', element: <Payments /> },
      { path: 'consumption', element: <Consumption /> },
    ]
  }
])

export default router
