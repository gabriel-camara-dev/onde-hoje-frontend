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
        <>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-on-teal transition hover:bg-teal-dark"
            to={loginPath}
          >
            Já tenho conta
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
