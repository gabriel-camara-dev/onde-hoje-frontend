import { MailCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../api/api'
import { ResendConfirmationCard } from '../../components/auth/ResendConfirmationCard'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { AuthShell } from '../Auth/AuthShell'
import { LoginForm } from './LoginForm'

export function Login() {
  const [searchParams] = useSearchParams()
  const emailConfirmed = searchParams.get('emailConfirmed')
  const justRegistered = searchParams.get('justRegistered') === '1'
  const registeredEmail = searchParams.get('email') ?? ''
  const returnTo = searchParams.get('returnTo')
  const registerPath = returnTo?.startsWith('/')
    ? '/register?returnTo=' + encodeURIComponent(returnTo)
    : '/register'

  function rememberGoogleReturnTo() {
    if (returnTo?.startsWith('/')) {
      window.sessionStorage.setItem('onde-hoje:oauth-return-to', returnTo)
    }
  }

  return (
    <AuthShell
      title="Entre na sua conta"
      description="Acesse sua conta para votar, participar de grupos e acompanhar seu historico."
      actions={
        <>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-on-teal transition hover:bg-teal-dark"
            to={registerPath}
          >
            Criar conta
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-teal-soft"
            to="/"
          >
            Explorar mapa publico
          </Link>
        </>
      }
    >
      <StatusBanner
        error={emailConfirmed === 'invalid' ? 'Link de confirmacao invalido ou expirado.' : undefined}
        message={emailConfirmed === 'success' ? 'Email confirmado. Agora voce pode entrar.' : undefined}
      />

      {justRegistered && (
        <div className="mb-4 grid gap-4">
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950 shadow-panel dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30">
                <MailCheck size={21} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Confirme seu email</p>
                <h2 className="mt-1 text-base font-semibold">Verifique sua caixa de entrada.</h2>
                <p className="mt-1 text-sm leading-5">
                  Enviamos um link para <strong>{registeredEmail || 'o email cadastrado'}</strong>.
                  Confirme em ate 5 minutos para ativar a conta.
                </p>
              </div>
            </div>
          </section>

          <ResendConfirmationCard email={registeredEmail} />
        </div>
      )}

      <Panel className="rounded-lg p-5">
        <p className="mb-2 text-xs font-semibold uppercase text-teal">Entrar</p>
        <h2 className="mb-4 text-2xl font-semibold">Acesse sua conta</h2>
        <a
          className="mb-3 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-teal-soft"
          href={API_BASE_URL + '/sessions/google'}
          onClick={rememberGoogleReturnTo}
        >
          <span className="grid size-5 place-items-center rounded-full bg-white text-sm font-semibold text-[#4285f4]">
            G
          </span>
          Entrar com Google
        </a>
        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-medium uppercase text-muted">
          <span className="h-px bg-line" />
          ou
          <span className="h-px bg-line" />
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-muted">
          Ainda nao tem conta?{' '}
          <Link className="font-semibold text-teal hover:text-teal-dark" to={registerPath}>
            Criar conta
          </Link>
        </p>
      </Panel>
    </AuthShell>
  )
}
