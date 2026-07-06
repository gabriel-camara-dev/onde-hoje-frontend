import { useMutation } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { resendEmailConfirmation } from '../../../api/ondeHoje'
import Button from '../../ui/Button'

interface ResendConfirmationCardProps {
  email?: string
}

export function ResendConfirmationCard({ email = '' }: ResendConfirmationCardProps) {
  const targetEmail = email.trim()

  const resendMutation = useMutation({
    mutationFn: () => resendEmailConfirmation(targetEmail),
    onSuccess: () => {
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
            Confira spam ou lixo eletronico. Se precisar, reenviamos o link de confirmacao.
          </p>
        </div>
      </div>
      {targetEmail ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-sm text-muted">
            Enviaremos para <strong className="break-all font-semibold text-ink">{targetEmail}</strong>
          </p>
          <Button
            className="shrink-0"
            disabled={resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
            type="button"
            variant="secondary"
          >
            <Send size={16} />
            {resendMutation.isPending ? 'Enviando...' : 'Reenviar'}
          </Button>
        </div>
      ) : (
        <p className="text-xs font-medium text-muted">
          Entre com o email que voce usou no cadastro para reenviar o link de confirmacao.
        </p>
      )}
    </div>
  )
}
