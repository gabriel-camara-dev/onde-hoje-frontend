import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteUser } from '../../../../../api/ondeHoje'
import { useAuth } from '../../../../../hooks/useAuth'

export function useDeleteAccount(userId: string) {
  const { logout } = useAuth()

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: logout,
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function requestDelete() {
    if (window.confirm('Remover sua conta? Esta acao nao pode ser desfeita.')) {
      deleteMutation.mutate()
    }
  }

  return { logout, requestDelete }
}
