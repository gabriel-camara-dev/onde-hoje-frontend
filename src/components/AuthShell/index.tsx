import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../Logo'
import { PageTransition } from '../PageTransition'

type AuthShellProps = {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}

export function AuthShell({ title, description, actions, children }: AuthShellProps) {
  return (
    <main className="grid min-h-[calc(100vh-1.5rem)] place-items-center bg-paper p-4 text-ink lg:min-h-[calc(100vh-2.5rem)]">
      <PageTransition>
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <section className="relative flex flex-col justify-between gap-5 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,.18),_transparent_42%),linear-gradient(160deg,_#0f766e,_#063f3a_60%,_#042f2e)] p-6 text-white lg:p-7">
              <div className="max-w-xl">
                <Logo className="text-[24px]" tone="light" />
                <h1 className="mt-3 text-2xl font-semibold leading-tight lg:text-3xl">{title}</h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/78">{description}</p>
              </div>

              <div className="hidden rounded-xl border border-white/12 bg-white/6 p-3.5 text-sm leading-6 text-white/84 backdrop-blur-sm sm:block">
                Descubra lugares, vote com seu grupo e acompanhe seu histórico em uma unica conta.
              </div>

              <div className="hidden items-center gap-3 text-sm font-medium text-white/72 lg:flex">
                <Link className="transition hover:text-white" to="/">
                  Explorar mapa público
                </Link>
                <span className="h-1 w-1 rounded-full bg-white/35" />
                <Link className="transition hover:text-white" to="/login">
                  Entrar na conta
                </Link>
              </div>
            </section>

            <section className="flex flex-col justify-center p-5 sm:p-6 lg:p-7">
              <div className="mb-4 flex flex-wrap items-center gap-3">{actions}</div>
              {children}
            </section>
          </div>
        </div>
      </PageTransition>
    </main>
  )
}
