import { Link } from 'react-router-dom'
import { Panel } from '../../components/ui/Panel'
import { useOAuthCallback } from './hooks/useOAuthCallback'

export function OAuthCallback() {
  const { error } = useOAuthCallback()

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-4 text-ink">
      <Panel className="w-full max-w-md rounded-lg p-6 text-center">
        <p className="text-xs font-semibold uppercase text-teal">Google OAuth</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {error ? 'Login não concluido' : 'Concluindo seu login...'}
        </h1>
        {error && <p className="mt-3 text-sm text-muted">{error}</p>}
        {error && (
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-teal px-4 py-2 text-sm font-medium text-on-teal transition hover:bg-teal-dark"
            to="/login"
          >
            Voltar para login
          </Link>
        )}
      </Panel>
    </main>
  )
}
