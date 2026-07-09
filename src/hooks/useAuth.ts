import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authenticate } from '../api/ondeHoje'
import { markDeviceHasAccount } from '../lib/deviceAccount'
import { useUserStore } from '../stores/userStore'

interface AuthData {
  login: string
  password: string
}

export function useAuth() {
  const setUser = useUserStore((state) => state.setUser)
  const logoutUser = useUserStore.getState().logout
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const loginMutation = useMutation({
    mutationFn: (data: AuthData) => authenticate(data),
    onSuccess: ({ token, user }) => {
      markDeviceHasAccount()
      setUser({ accessToken: token, user })
      navigate(returnTo && returnTo.startsWith('/') ? returnTo : '/')
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
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Não foi possível entrar agora.',
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
