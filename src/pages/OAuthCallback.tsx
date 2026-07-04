import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from '../@types/User'
import { Panel } from '../components/ui/Panel'
import { useUserStore } from '../stores/userStore'

export function OAuthCallback() {
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
      setUser({ accessToken: token, user })
      navigate('/', { replace: true })
    } catch {
      setError('O retorno do Google veio incompleto. Tente entrar novamente.')
    }
  }, [navigate, setUser])

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-4 text-ink">
      <Panel className="w-full max-w-md rounded-lg p-6 text-center">
        <p className="text-xs font-semibold uppercase text-teal">Google OAuth</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {error ? 'Login nao concluido' : 'Concluindo seu login...'}
        </h1>
        {error && <p className="mt-3 text-sm text-muted">{error}</p>}
        {error && (
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-dark"
            to="/login"
          >
            Voltar para login
          </Link>
        )}
      </Panel>
    </main>
  )
}

function decodeOAuthUser(value: string): User {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '='
  )
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  const json = new TextDecoder().decode(bytes)

  return JSON.parse(json) as User
}
