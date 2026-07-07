import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../../stores/userStore'
import { decodeOAuthUser } from '../helpers'

export function useOAuthCallback() {
  const navigate = useNavigate()
  const setUser = useUserStore((state) => state.setUser)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash ? window.location.hash.slice(1) : window.location.search
    )
    const token = params.get('token')
    const encodedUser = params.get('user')

    if (!token || !encodedUser) {
      setError('Nao foi possivel concluir o login com Google.')
      return
    }

    try {
      const user = decodeOAuthUser(encodedUser)
      const returnTo = window.sessionStorage.getItem('onde-hoje:oauth-return-to')
      window.sessionStorage.removeItem('onde-hoje:oauth-return-to')
      setUser({ accessToken: token, user })
      navigate(returnTo?.startsWith('/') ? returnTo : '/', { replace: true })
    } catch {
      setError('O retorno do Google veio incompleto. Tente entrar novamente.')
    }
  }, [navigate, setUser])

  return { error }
}
