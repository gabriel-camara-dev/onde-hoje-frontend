import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import {
  acceptGroupMember,
  createGroup,
  joinGroup,
  listPublicGroups,
} from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'

type GroupsPageProps = {
  city?: string
}

export default function GroupsPage({ city = '' }: GroupsPageProps) {
  const queryClient = useQueryClient()
  const groupsQuery = useQuery({
    queryKey: ['groups', city],
    queryFn: () => listPublicGroups(city),
  })
  const createMutation = useMutation({
    mutationFn: (form: FormData) =>
      createGroup({
        name: String(form.get('name')),
        description: String(form.get('description') || '') || undefined,
        privacy: String(form.get('privacy')) as 'PUBLIC' | 'PRIVATE',
        city: String(form.get('city') || '') || undefined,
        state: String(form.get('state') || '') || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
  const joinMutation = useMutation({
    mutationFn: joinGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
  const acceptMutation = useMutation({
    mutationFn: (form: FormData) =>
      acceptGroupMember(String(form.get('groupPublicId')), String(form.get('userPublicId'))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(new FormData(event.currentTarget))
    event.currentTarget.reset()
  }

  function submitAcceptance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    acceptMutation.mutate(new FormData(event.currentTarget))
    event.currentTarget.reset()
  }

  const groups = groupsQuery.data ?? []

  return (
    <>
      <StatusBanner
        error={
          groupsQuery.error?.message ??
          createMutation.error?.message ??
          joinMutation.error?.message ??
          acceptMutation.error?.message
        }
        loading={
          groupsQuery.isLoading ||
          createMutation.isPending ||
          joinMutation.isPending ||
          acceptMutation.isPending
        }
        message={
          createMutation.isSuccess
            ? 'Grupo criado.'
            : joinMutation.isSuccess
              ? 'Solicitacao enviada.'
              : acceptMutation.isSuccess
                ? 'Membro aprovado.'
                : undefined
        }
      />
      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-black">Grupos publicos</h1>
            <strong className="text-muted">{groups.length}</strong>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.length === 0 ? (
              <EmptyState title="Nenhum grupo publico" description="Crie o primeiro grupo desta cidade." />
            ) : (
              groups.map((group) => (
                <article
                  key={group.id}
                  className="grid gap-4 rounded-lg border border-line bg-surface p-4"
                >
                  <div>
                    <p className="mb-2 text-xs font-black uppercase text-coral">
                      {group.privacy === 'PRIVATE' ? 'Privado' : 'Publico'}
                    </p>
                    <h2 className="text-lg font-black">{group.name}</h2>
                    <p className="mt-2 text-sm text-muted">{group.description || 'Grupo sem descricao.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="rounded-lg border border-line p-3 text-sm">
                      <strong className="block text-lg">{group.membersCount}</strong>
                      membros
                    </span>
                    <span className="rounded-lg border border-line p-3 text-sm">
                      <strong className="block text-lg">{group.todayVotesCount}</strong>
                      votos hoje
                    </span>
                  </div>
                  <Button type="button" onClick={() => joinMutation.mutate(group.id)}>
                    Entrar
                  </Button>
                </article>
              ))
            )}
          </div>
        </Panel>
        <div className="grid gap-4">
          <Panel>
            <h2 className="mb-4 text-lg font-black">Novo grupo</h2>
            <form className="grid gap-3" onSubmit={submit}>
              <Input label="Nome" maxLength={80} minLength={2} name="name" required />
              <label className="grid gap-1.5 text-xs font-bold text-muted">
                Descricao
                <textarea
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-teal"
                  maxLength={280}
                  name="description"
                  rows={4}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-muted">
                Privacidade
                <select
                  className="min-h-10 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-teal"
                  name="privacy"
                >
                  <option value="PUBLIC">Publico</option>
                  <option value="PRIVATE">Privado</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Cidade" name="city" />
                <Input label="Estado" name="state" />
              </div>
              <Button type="submit">Criar grupo</Button>
            </form>
          </Panel>
          <Panel>
            <h2 className="mb-2 text-lg font-black">Aprovar membro</h2>
            <p className="mb-4 text-sm text-muted">
              Apenas o lider do grupo consegue aprovar solicitacoes privadas.
            </p>
            <form className="grid gap-3" onSubmit={submitAcceptance}>
              <Input label="PublicId do grupo" name="groupPublicId" required />
              <Input label="PublicId do usuario" name="userPublicId" required />
              <Button type="submit" variant="secondary">
                Aprovar membro
              </Button>
            </form>
          </Panel>
        </div>
      </section>
    </>
  )
}
