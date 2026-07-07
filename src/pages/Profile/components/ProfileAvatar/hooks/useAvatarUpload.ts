import { useMutation } from '@tanstack/react-query'
import type { ChangeEvent } from 'react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { uploadAvatar } from '../../../../../api/ondeHoje'
import { useUserStore } from '../../../../../stores/userStore'

export function useAvatarUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateStoredUser = useUserStore((state) => state.updateUser)

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      if (updatedUser && typeof updatedUser === 'object') {
        updateStoredUser(updatedUser)
      }
      toast.success('Foto atualizada.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]

    if (file) {
      avatarMutation.mutate(file)
    }

    event.currentTarget.value = ''
  }

  return { fileInputRef, openFilePicker, handleAvatarChange }
}
