import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authenticate } from '../api/ondeHoje'
import { useUserStore } from '../stores/userStore'

interface AuthData {
  login: string
  password: string
}

export function useAuth() {
  const setUser = useUserStore((state) => state.setUser)
  const logoutUser = useUserStore.getState().logout
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: (data: AuthData) => authenticate(data),
    onSuccess: ({ token, user }) => {
      setUser({ accessToken: token, user })
      navigate('/')
    },
  })

  const authenticateUser = async (
    data: AuthData,
    setError: (name: string, error: { message: string }) => void,
    reset: () => void
  ) => {
    try {
      await loginMutation.mutateAsync(data)
      reset()
    } catch {
      setError('root', {
        message: 'Email ou senha incorretos',
      })
    }
  }

  const logout = () => {
    logoutUser()
    navigate('/login', { replace: true })
  }

  return {
    authenticate: authenticateUser,
    logout,
    isPending: loginMutation.isPending,
    error: loginMutation.error,
  }
}
