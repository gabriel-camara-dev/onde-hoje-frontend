import { Navigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

interface ProtectedRouteProps {
  children?: React.ReactNode
  requiredRole: 'ADMIN'
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const accessToken = useUserStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)

  if (!accessToken) {
    return <Navigate to="/" replace />
  } else if (user && user.role !== requiredRole) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}
