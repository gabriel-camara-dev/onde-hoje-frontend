import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { axiosPrivate } from '../api/api'

interface AuthData {
  email: string
  password: string
}

interface AuthResponse {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'NORMAL_USER'
    created_at: string
    updated_at: string
  }
}

export function useAuth() {
  const setUser = useUserStore((state) => state.setUser)
  const logoutUser = useUserStore.getState().logout
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async (data: AuthData) => {
      const response = await axiosPrivate.post<AuthResponse>('/sessions', data)
      return response.data
    },
    onSuccess: ({ accessToken, user }) => {
      setUser({ accessToken, user })

      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    },
  })

  const authenticate = async (
    data: AuthData,
    setError: (name: string, error: { message: string }) => void,
    reset: () => void
  ) => {
    try {
      const res = await loginMutation.mutateAsync(data)
      reset()

      if (res.user.role !== 'ADMIN') {
        setError('root', {
          message: 'Você não tem permissão para acessar o site',
        })
        navigate('/')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (!err.response) {
        setError('root', {
          message: 'Erro ao tentar se conectar com o servidor',
        })
      } else if (err.response.status === 400) {
        setError('root', {
          message: 'E-mail ou senha incorretos',
        })
      } else {
        setError('root', {
          message: 'Erro desconhecido, tente novamente.',
        })
      }
    }
  }

  const logout = async () => {
    try {
      await axiosPrivate.delete('/sessions')
    } finally {
      logoutUser()
      navigate('/login', { replace: true })
    }
  }

  return {
    authenticate,
    logout,
    isPending: loginMutation.isPending,
    error: loginMutation.error,
  }
}
