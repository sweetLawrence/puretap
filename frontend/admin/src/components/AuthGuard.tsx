import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../utils/auth'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function AuthGuard({ children, allowedRoles }: Props) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}