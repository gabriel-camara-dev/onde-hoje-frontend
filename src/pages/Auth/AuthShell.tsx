import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageTransition } from '../../components/PageTransition'

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
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface shadow-panel">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <section className="relative flex flex-col justify-between gap-8 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,.18),_transparent_42%),linear-gradient(160deg,_#0f766e,_#063f3a_60%,_#042f2e)] p-8 text-white lg:p-10">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-soft/90">
                  OndeHoje
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight lg:text-5xl">{title}</h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/78 lg:text-base">
                  {description}
                </p>
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84 backdrop-blur-sm">
                Descubra lugares, vote com seu grupo e acompanhe seu historico em uma unica conta.
              </div>

              <div className="hidden items-center gap-3 text-sm font-medium text-white/72 lg:flex">
                <Link className="transition hover:text-white" to="/">
                  Explorar mapa publico
                </Link>
                <span className="h-1 w-1 rounded-full bg-white/35" />
                <Link className="transition hover:text-white" to="/login">
                  Entrar na conta
                </Link>
              </div>
            </section>

            <section className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="mb-5 flex flex-wrap items-center gap-3">{actions}</div>
              {children}
            </section>
          </div>
        </div>
      </PageTransition>
    </main>
  )
}
