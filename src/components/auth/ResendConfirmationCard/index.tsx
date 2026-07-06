import { useMutation } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { resendEmailConfirmation } from '../../../api/ondeHoje'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

interface ResendConfirmationCardProps {
  initialEmail?: string
}

export function ResendConfirmationCard({ initialEmail = '' }: ResendConfirmationCardProps) {
  const [email, setEmail] = useState(initialEmail)
  const [sent, setSent] = useState(false)

  const resendMutation = useMutation({
    mutationFn: (value: string) => resendEmailConfirmation(value),
    onSuccess: () => {
      setSent(true)
      toast.success('Se o email existir, enviamos um novo link de confirmacao.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel reenviar o email agora.')
    },
  })

  return (
    <div className="rounded-lg border border-line bg-surface p-3 shadow-panel">
      <div className="mb-2 flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-teal-soft text-teal">
          <Send size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Nao recebeu o email?</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            Confira spam ou lixo eletronico. Se precisar, envie outro link de confirmacao.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            aria-label="Email para reenvio"
            onChange={(event) => {
              setEmail(event.target.value)
              setSent(false)
            }}
            type="email"
            value={email}
          />
        </div>
        <Button
          disabled={!email.trim() || resendMutation.isPending}
          onClick={() => resendMutation.mutate(email.trim())}
          type="button"
          variant="secondary"
        >
          <Send size={16} />
          {resendMutation.isPending ? 'Enviando...' : 'Reenviar'}
        </Button>
      </div>
      {sent && (
        <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          Um novo link foi enviado.
        </p>
      )}
    </div>
  )
}
