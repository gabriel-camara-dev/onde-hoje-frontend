import { Link } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { GoogleSignInButton } from '../Login/components'
import { RegisterForm } from './components'
import { useRegister } from './hooks/useRegister'

export function Register() {
  const { loginPath } = useRegister()

  return (
    <AuthShell
      title="Crie sua conta"
      description="Cadastre-se para votar, participar de grupos e salvar seu histórico no OndeHoje."
      actions={
        <div className="flex w-full gap-2">
          <Link
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-teal px-3 py-2 text-center text-sm font-semibold text-on-teal transition hover:bg-teal-dark"
            to={loginPath}
          >
            Já tenho conta
          </Link>
          <Link
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line bg-surface px-3 py-2 text-center text-sm font-semibold text-ink transition hover:bg-teal-soft"
            to="/"
          >
            Explorar mapa público
          </Link>
        </div>
      }
    >
      <GoogleSignInButton />
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-medium uppercase text-muted">
        <span className="h-px bg-line" />
        ou
        <span className="h-px bg-line" />
      </div>
      <RegisterForm />
    </AuthShell>
  )
}
