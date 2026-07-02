import { useMutation } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../api/api'
import { registerUser } from '../../api/ondeHoje'
import { ThemeToggle } from '../../components/ThemeToggle'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { LoginForm } from './LoginForm'

export function Login() {
  const [searchParams] = useSearchParams()
  const needsVoteAccount = searchParams.get('reason') === 'vote'

  const registerMutation = useMutation({
    mutationFn: (form: FormData) =>
      registerUser({
        name: String(form.get('name')),
        username: String(form.get('username')),
        email: String(form.get('email')),
        password: String(form.get('password')),
      }),
  })

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    registerMutation.mutate(new FormData(form), {
      onSuccess: () => form.reset(),
    })
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-paper px-4 py-8 text-ink lg:px-6">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <section className="mx-auto grid max-w-3xl justify-items-center text-center">
          <span className="inline-flex rounded-xl bg-teal px-3 py-2 text-xs font-black text-white shadow-[0_12px_30px_rgba(124,58,237,.35)]">
            ONDE HOJE
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-5xl">
            Entre ou crie sua conta para votar no role de hoje.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            O mapa continua publico, mas os votos precisam de uma conta para limitar a quantidade
            por dia e guardar seu historico.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              className="inline-flex min-h-11 items-center rounded-xl bg-teal px-4 py-2 text-sm font-black text-white transition hover:bg-teal-dark"
              href="#cadastro"
            >
              Criar conta para votar
            </a>
            <Link
              className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 py-2 text-sm font-black text-ink transition hover:bg-teal-soft"
              to="/"
            >
              Explorar mapa publico
            </Link>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-4xl gap-4">
          {needsVoteAccount && (
            <section className="rounded-2xl border border-line bg-teal-soft p-4 shadow-panel">
              <p className="text-xs font-black uppercase text-teal">Cadastro necessario</p>
              <h2 className="mt-1 text-xl font-black">Voce precisa criar uma conta para votar.</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                O mapa e publico, mas votos ficam ligados ao seu perfil para limitar os votos do
                dia e mostrar seu historico.
              </p>
              <a
                className="mt-3 inline-flex text-sm font-black text-teal hover:text-teal-dark"
                href="#cadastro"
              >
                Ir para cadastro
              </a>
            </section>
          )}

          <StatusBanner
            error={registerMutation.error?.message}
            loading={registerMutation.isPending}
            message={
              registerMutation.isSuccess
                ? 'Conta criada. Entre com seu email e senha.'
                : undefined
            }
          />

          <div className="grid items-start gap-4 md:grid-cols-2">
            <Panel className="rounded-2xl p-5">
              <p className="mb-2 text-xs font-black uppercase text-teal">Entrar</p>
              <h2 className="mb-4 text-2xl font-black">Acesse sua conta</h2>
              <a
                className="mb-3 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-bold text-ink transition hover:bg-teal-soft"
                href={`${API_BASE_URL}/sessions/google`}
              >
                <span className="grid size-5 place-items-center rounded-full bg-white text-sm font-black text-[#4285f4]">
                  G
                </span>
                Entrar com Google
              </a>
              <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-bold uppercase text-muted">
                <span className="h-px bg-line" />
                ou
                <span className="h-px bg-line" />
              </div>
              <LoginForm />
            </Panel>

            <Panel id="cadastro" className="scroll-mt-4 rounded-2xl p-5">
              <p className="mb-2 text-xs font-black uppercase text-teal">Cadastro local</p>
              <h2 className="mb-2 text-2xl font-black">Criar conta</h2>
              <p className="mb-4 text-sm text-muted">
                Depois de criar sua conta, use seu email ou username para entrar.
              </p>
              <form className="grid gap-3" onSubmit={handleRegister}>
                <Input label="Nome" minLength={4} name="name" placeholder="Seu nome" required />
                <Input
                  label="Username"
                  maxLength={30}
                  minLength={3}
                  name="username"
                  pattern="[a-z0-9_]+"
                  placeholder="seu_username"
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  placeholder="voce@email.com"
                  required
                  type="email"
                />
                <Input
                  label="Senha"
                  minLength={6}
                  name="password"
                  placeholder="Minimo 6 caracteres"
                  required
                  type="password"
                />
                <Button disabled={registerMutation.isPending} type="submit">
                  Criar conta
                </Button>
              </form>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  )
}
