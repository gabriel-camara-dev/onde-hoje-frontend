import { useMutation } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { updateUser } from '../../../../../api/ondeHoje'
import { useUserStore } from '../../../../../stores/userStore'

export function useProfileForm(userId: string) {
  const updateStoredUser = useUserStore((state) => state.updateUser)

  const updateMutation = useMutation({
    mutationFn: (form: FormData) =>
      updateUser(userId, {
        name: String(form.get('name') || '') || undefined,
        username: String(form.get('username') || '') || undefined,
      }),
    onSuccess: (updatedUser) => {
      updateStoredUser(updatedUser)
      toast.success('Perfil atualizado.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateMutation.mutate(new FormData(event.currentTarget))
  }

  return { handleUpdate, isPending: updateMutation.isPending }
}
