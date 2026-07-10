import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Group } from '../../@types/OndeHoje'
import { createGroup } from '../../api/ondeHoje'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Modal } from '../ui/Modal'
import Select from '../ui/Select'

type Privacy = 'PUBLIC' | 'PRIVATE'

export function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated?: (group: Group) => void
}) {
  const queryClient = useQueryClient()
  const [privacy, setPrivacy] = useState<Privacy>('PUBLIC')

  const createMutation = useMutation({
    mutationFn: (form: FormData) =>
      createGroup({
        name: String(form.get('name')),
        description: String(form.get('description') || '') || undefined,
        privacy: String(form.get('privacy')) as Privacy,
        password: String(form.get('password') || '') || undefined,
      }),
    onSuccess: async (group) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['groups'] }),
      ])
      toast.success('Grupo criado.')
      onCreated?.(group)
      onClose()
    },
    onError: (error) => toast.error(error.message),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(new FormData(event.currentTarget))
  }

  return (
    <Modal title="Novo grupo" onClose={onClose}>
      <form className="grid gap-3" onSubmit={submit}>
        <Input label="Nome" maxLength={80} minLength={2} name="name" required />
        <label className="grid gap-1.5 text-xs font-medium text-muted">
          Descrição
          <textarea
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            maxLength={280}
            name="description"
            rows={4}
          />
        </label>
        <Select
          label="Privacidade"
          name="privacy"
          options={[
            { label: 'Público', value: 'PUBLIC' },
            { label: 'Privado', value: 'PRIVATE' },
          ]}
          required
          value={privacy}
          onChange={(nextValue) => setPrivacy(nextValue as Privacy)}
        />
        {privacy === 'PRIVATE' && (
          <Input label="Senha" minLength={4} name="password" required type="password" />
        )}
        <Button disabled={createMutation.isPending} type="submit">
          Criar grupo
        </Button>
      </form>
    </Modal>
  )
}
