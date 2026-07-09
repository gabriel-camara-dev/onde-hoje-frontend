import { Link } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { ConfirmEmailNotice, GoogleSignInButton, LoginForm } from './components'
import { useLogin } from './hooks/useLogin'

export function Login() {
  const { emailConfirmed, justRegistered, registeredEmail, registerPath, rememberGoogleReturnTo } =
    useLogin()

  return (
    <AuthShell
      title="Entre na sua conta"
      description="Acesse sua conta para votar, participar de grupos e acompanhar seu histórico."
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
            Explorar mapa público
          </Link>
        </>
      }
    >
      <StatusBanner
        error={
          emailConfirmed === 'invalid' ? 'Link de confirmação inválido ou expirado.' : undefined
        }
        message={
          emailConfirmed === 'success' ? 'Email confirmado. Agora você pode entrar.' : undefined
        }
      />

      {justRegistered && <ConfirmEmailNotice email={registeredEmail} />}

      <Panel className="rounded-lg p-5">
        <p className="mb-2 text-xs font-semibold uppercase text-teal">Entrar</p>
        <h2 className="mb-4 text-2xl font-semibold">Acesse sua conta</h2>
        <GoogleSignInButton onBeforeRedirect={rememberGoogleReturnTo} />
        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-medium uppercase text-muted">
          <span className="h-px bg-line" />
          ou
          <span className="h-px bg-line" />
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-muted">
          Ainda não tem conta?{' '}
          <Link className="font-semibold text-teal hover:text-teal-dark" to={registerPath}>
            Criar conta
          </Link>
        </p>
      </Panel>
    </AuthShell>
  )
}
