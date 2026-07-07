import { MailCheck } from 'lucide-react'
import { ResendConfirmationCard } from '../../../../components/auth/ResendConfirmationCard'

export function ConfirmEmailNotice({ email }: { email: string }) {
  return (
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
              Enviamos um link para <strong>{email || 'o email cadastrado'}</strong>. Confirme em ate
              5 minutos para ativar a conta.
            </p>
          </div>
        </div>
      </section>

      <ResendConfirmationCard email={email} />
    </div>
  )
}
