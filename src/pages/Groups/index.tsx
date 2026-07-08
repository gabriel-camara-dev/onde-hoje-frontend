import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  acceptGroupMember,
  createGroup,
  getPublicGroup,
  inviteGroupMember,
  joinGroup,
  leaveGroup,
  listFriends,
  listMyGroups,
  listPublicGroups,
  removeGroupMember,
  requestFriendship,
  respondGroupInvite,
} from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { useUserStore } from '../../stores/userStore'
import { GroupDetail, GroupListItem, TabButton } from './components'
import { isGroupPublicId, normalizeSearch, resolveCurrentCity } from './helpers'
import type { GroupTab } from './types'

type GroupsPageProps = {
  city?: string
}

export default function GroupsPage({ city = '' }: GroupsPageProps) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const { groupPublicId } = useParams<{ groupPublicId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const handledJoinInviteRef = useRef(false)
  const user = useUserStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<GroupTab>('PUBLIC')
  const [modal, setModal] = useState<'create' | 'join' | null>(null)
  const [createPrivacy, setCreatePrivacy] = useState<GroupTab>('PUBLIC')
  const [joinNeedsPassword, setJoinNeedsPassword] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string>()
  const [currentCity, setCurrentCity] = useState(city)
  const [groupSearch, setGroupSearch] = useState('')
  const [onlyMyGroups, setOnlyMyGroups] = useState(false)
  const [requestedFriendUsernames, setRequestedFriendUsernames] = useState<Set<string>>(new Set())
  const groupsCity = city || currentCity

  useEffect(() => {
    let isMounted = true

    if (city) {
      setCurrentCity(city)
      return () => {
        isMounted = false
      }
    }

    resolveCurrentCity().then((location) => {
      if (isMounted && location?.city) {
        setCurrentCity(location.city)
      }
    })

    return () => {
      isMounted = false
    }
  }, [city])

  useEffect(() => {
    if (!user && activeTab === 'PRIVATE') {
      setActiveTab('PUBLIC')
    }
  }, [activeTab, user])

  useEffect(() => {
    if (!groupPublicId) {
      return
    }

    setActiveTab('PUBLIC')
    setSelectedGroupId(groupPublicId)
  }, [groupPublicId])

  const groupsQuery = useQuery({
    queryKey: ['groups', groupsCity],
    queryFn: () => listPublicGroups(groupsCity),
  })
  const myGroupsQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['my-groups'],
    queryFn: listMyGroups,
  })
  const friendsQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['friends'],
    queryFn: listFriends,
  })

  useEffect(() => {
    const loadError = groupsQuery.error ?? myGroupsQuery.error
    if (loadError) {
      toast.error(loadError.message)
    }
  }, [groupsQuery.error, myGroupsQuery.error])

  const createMutation = useMutation({
    mutationFn: (form: FormData) =>
      createGroup({
        name: String(form.get('name')),
        description: String(form.get('description') || '') || undefined,
        privacy: String(form.get('privacy')) as 'PUBLIC' | 'PRIVATE',
        password: String(form.get('password') || '') || undefined,
      }),
    onSuccess: () => {
      setModal(null)
      refreshGroups()
      toast.success('Grupo criado.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const joinMutation = useMutation({
    mutationFn: (input: { name?: string; password?: string; groupPublicId?: string }) =>
      joinGroup(input),
    onSuccess: (membership) => {
      setModal(null)
      refreshGroups()
      toast.success(
        membership?.status === 'PENDING' ? 'Entrada solicitada.' : 'Voce entrou no grupo.',
      )
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const acceptMutation = useMutation({
    mutationFn: ({ groupId, username }: { groupId: string; username: string }) =>
      acceptGroupMember(groupId, username),
    onSuccess: () => {
      refreshGroups()
      toast.success('Membro aprovado.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const inviteMutation = useMutation({
    mutationFn: ({ groupId, username }: { groupId: string; username: string }) =>
      inviteGroupMember(groupId, username.replace(/^@/, '')),
    onSuccess: () => {
      refreshGroups()
      toast.success('Convite enviado. A pessoa precisa aceitar para entrar.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const respondInviteMutation = useMutation({
    mutationFn: ({ groupId, action }: { groupId: string; action: 'accept' | 'decline' }) =>
      respondGroupInvite(groupId, action),
    onSuccess: (_data, variables) => {
      refreshGroups()
      queryClient.invalidateQueries({ queryKey: ['notifications'] })

      if (variables.action === 'decline') {
        setSelectedGroupId(undefined)
        toast.success('Convite recusado.')
      } else {
        toast.success('Voce entrou no grupo.')
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const removeMutation = useMutation({
    mutationFn: ({ groupId, username }: { groupId: string; username: string }) =>
      removeGroupMember(groupId, username),
    onSuccess: () => {
      refreshGroups()
      toast.success('Membro removido.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const leaveMutation = useMutation({
    mutationFn: leaveGroup,
    onSuccess: (_data, groupId) => {
      setSelectedGroupId(undefined)
      refreshGroups()
      toast.success('Voce saiu do grupo.')

      if (groupPublicId === groupId) {
        navigate('/groups', { replace: true })
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const requestFriendshipMutation = useMutation({
    mutationFn: requestFriendship,
    onSuccess: async (_data, username) => {
      setRequestedFriendUsernames((current) => new Set(current).add(username))
      toast.success('Pedido de amizade enviado.')
      await queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function refreshGroups() {
    queryClient.invalidateQueries({ queryKey: ['groups'] })
    queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    queryClient.invalidateQueries({ queryKey: ['public-group'] })
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(new FormData(event.currentTarget))
  }

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const groupPublicId = String(form.get('groupPublicId') || '').trim()
    const password = joinNeedsPassword ? String(form.get('password') || '') || undefined : undefined

    if (!isGroupPublicId(groupPublicId)) {
      toast.error('Informe um ID de grupo valido.')
      return
    }

    joinMutation.mutate({ groupPublicId, password })
  }

  const publicGroups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data])
  const myGroups = useMemo(() => myGroupsQuery.data ?? [], [myGroupsQuery.data])
  const visibleGroups = useMemo(() => {
    if (!user) {
      return publicGroups
    }

    if (activeTab === 'PRIVATE') {
      return myGroups.filter((group) => group.privacy === 'PRIVATE')
    }

    const myPublicGroups = myGroups.filter((group) => group.privacy === 'PUBLIC')

    if (onlyMyGroups) {
      return myPublicGroups
    }

    const myPublicIds = new Set(myPublicGroups.map((group) => group.id))

    return [...myPublicGroups, ...publicGroups.filter((group) => !myPublicIds.has(group.id))]
  }, [activeTab, myGroups, onlyMyGroups, publicGroups, user])
  const filteredGroups = useMemo(() => {
    const query = normalizeSearch(groupSearch)

    if (!query) {
      return visibleGroups
    }

    return visibleGroups.filter((group) => normalizeSearch(group.name).includes(query))
  }, [groupSearch, visibleGroups])
  const friendByUsername = new Map(
    (friendsQuery.data ?? [])
      .filter((friendship) => friendship.friend.username)
      .map((friendship) => [friendship.friend.username!, friendship])
  )
  const selectedMyGroup = myGroups.find((group) => group.id === selectedGroupId)
  const selectedPublicGroupQuery = useQuery({
    enabled: Boolean(selectedGroupId && (!selectedMyGroup || activeTab === 'PUBLIC')),
    queryKey: ['public-group', selectedGroupId],
    queryFn: () => getPublicGroup(selectedGroupId!),
  })
  const selectedGroup = selectedMyGroup ?? selectedPublicGroupQuery.data
  const isLoadingSelectedGroup = Boolean(selectedGroupId && !selectedGroup && selectedPublicGroupQuery.isLoading)
  const joinedPublicGroupIds = new Set(
    myGroups.filter((group) => group.privacy === 'PUBLIC').map((group) => group.id)
  )
  const selectedGroupInviteUrl = selectedGroup
    ? `${window.location.origin}/groups/${selectedGroup.id}?join=1`
    : ''

  // Group invite link (/groups/:id?join=1): act on the id from the URL directly
  // so it works for private groups too (which never load via getPublicGroup) and
  // regardless of whether the group panel finished loading.
  useEffect(() => {
    if (!searchParams.has('join') || !groupPublicId || handledJoinInviteRef.current) {
      return
    }

    handledJoinInviteRef.current = true

    if (!user) {
      navigate(`/login?returnTo=${encodeURIComponent(`/groups/${groupPublicId}?join=1`)}`, {
        replace: true,
      })
      return
    }

    const alreadyActive = myGroups.some(
      (item) => item.id === groupPublicId && item.myStatus === 'ACTIVE'
    )

    if (!alreadyActive) {
      joinMutation.mutate({ groupPublicId })
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('join')
    setSearchParams(nextSearchParams, { replace: true })
  }, [groupPublicId, joinMutation, myGroups, navigate, searchParams, setSearchParams, user])

  function loginForGroupInvite() {
    const nextSearchParams = new URLSearchParams(location.search)
    nextSearchParams.set('join', '1')
    const returnTo = `${location.pathname}?${nextSearchParams.toString()}`

    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return (
    <>
      <StatusBanner
        loading={groupsQuery.isLoading || myGroupsQuery.isLoading || friendsQuery.isLoading}
      />

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(360px,.8fr)_minmax(0,1.2fr)]">
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Grupos</h1>
              <p className="mt-1 text-sm text-muted">
                {user
                  ? 'Entre em grupos, veja membros e gerencie convites.'
                  : groupsCity
                    ? `Grupos publicos em ${groupsCity} para acompanhar onde a galera vai hoje.`
                    : 'Grupos publicos principais para acompanhar onde a galera vai hoje.'}
              </p>
            </div>
            {user && (
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setModal('join')}>
                  Entrar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setCreatePrivacy('PUBLIC')
                    setModal('create')
                  }}
                >
                  Novo grupo
                </Button>
              </div>
            )}
          </div>

          {user && (
            <div className="mb-4 grid grid-cols-2 rounded-lg border border-line bg-surface-muted p-1">
              <TabButton active={activeTab === 'PUBLIC'} onClick={() => setActiveTab('PUBLIC')}>
                Publicos
              </TabButton>
              <TabButton active={activeTab === 'PRIVATE'} onClick={() => setActiveTab('PRIVATE')}>
                Privados
              </TabButton>
            </div>
          )}

          <div className="mb-4">
            <Input
              label="Pesquisar grupo"
              name="groupSearch"
              placeholder="Digite o nome do grupo"
              type="search"
              value={groupSearch}
              onChange={(event) => setGroupSearch(event.currentTarget.value)}
            />
          </div>

          {user && activeTab === 'PUBLIC' && (
            <label className="mb-4 flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-semibold text-ink">
              <span>Meus grupos</span>
              <input
                checked={onlyMyGroups}
                className="size-4 accent-teal"
                type="checkbox"
                onChange={(event) => setOnlyMyGroups(event.currentTarget.checked)}
              />
            </label>
          )}

          <div className="grid gap-3">
            {filteredGroups.length === 0 ? (
              <EmptyState
                title={activeTab === 'PRIVATE' ? 'Nenhum grupo privado' : 'Nenhum grupo publico'}
                description={
                  user
                    ? 'Crie um grupo ou entre usando nome e senha.'
                    : 'Quando houver grupos publicos nessa cidade, eles aparecem aqui.'
                }
              />
            ) : (
              filteredGroups.map((group) => (
                <GroupListItem
                  key={group.id}
                  group={group}
                  canJoin={Boolean(
                    user && group.privacy === 'PUBLIC' && !joinedPublicGroupIds.has(group.id)
                  )}
                  selected={group.id === selectedGroupId}
                  onSelect={() => setSelectedGroupId(group.id)}
                  onJoin={() => joinMutation.mutate({ groupPublicId: group.id })}
                />
              ))
            )}
          </div>
        </Panel>

        {selectedGroup ? (
          <GroupDetail
            currentUserPublicId={user?.id}
            friendByUsername={friendByUsername}
            friends={friendsQuery.data ?? []}
            group={selectedGroup}
            inviteUrl={selectedGroupInviteUrl}
            isRequestingFriend={requestFriendshipMutation.isPending}
            requestedFriendUsernames={requestedFriendUsernames}
            onAccept={
              'myRole' in selectedGroup
                ? (username) => acceptMutation.mutate({ groupId: selectedGroup.id, username })
                : undefined
            }
            onInvite={
              'myRole' in selectedGroup
                ? (username) => inviteMutation.mutate({ groupId: selectedGroup.id, username })
                : undefined
            }
            onJoin={
              'myRole' in selectedGroup || !user
                ? undefined
                : () => joinMutation.mutate({ groupPublicId: selectedGroup.id })
            }
            onLeave={
              selectedMyGroup?.myStatus === 'ACTIVE'
                ? () => leaveMutation.mutate(selectedGroup.id)
                : undefined
            }
            onAcceptInvite={
              selectedMyGroup?.myStatus === 'INVITED'
                ? () => respondInviteMutation.mutate({ groupId: selectedGroup.id, action: 'accept' })
                : undefined
            }
            onDeclineInvite={
              selectedMyGroup?.myStatus === 'INVITED'
                ? () => respondInviteMutation.mutate({ groupId: selectedGroup.id, action: 'decline' })
                : undefined
            }
            onLoginToJoin={
              'myRole' in selectedGroup || user || selectedGroup.privacy !== 'PUBLIC'
                ? undefined
                : loginForGroupInvite
            }
            onRemove={
              'myRole' in selectedGroup
                ? (username) => removeMutation.mutate({ groupId: selectedGroup.id, username })
                : undefined
            }
            onRequestFriend={(username) => requestFriendshipMutation.mutate(username)}
          />
        ) : isLoadingSelectedGroup ? (
          <Panel>
            <div className="rounded-lg border border-line bg-surface-muted p-4 text-sm font-semibold text-muted">
              Carregando grupo...
            </div>
          </Panel>
        ) : (
          <Panel>
            <EmptyState
              title="Abra um grupo"
              description={
                user
                  ? 'Selecione um grupo para ver membros, aceitar pedidos ou convidar amigos.'
                  : 'Selecione um grupo publico para ver seus membros.'
              }
            />
          </Panel>
        )}
      </section>

      {user && modal === 'create' && (
        <Modal title="Novo grupo" onClose={() => setModal(null)}>
          <form className="grid gap-3" onSubmit={submitCreate}>
            <Input label="Nome" maxLength={80} minLength={2} name="name" required />
            <label className="grid gap-1.5 text-xs font-medium text-muted">
              Descricao
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
                { label: 'Publico', value: 'PUBLIC' },
                { label: 'Privado', value: 'PRIVATE' },
              ]}
              required
              value={createPrivacy}
              onChange={(nextValue: string) => setCreatePrivacy(nextValue as GroupTab)}
            />
            {createPrivacy === 'PRIVATE' && (
              <Input label="Senha" minLength={4} name="password" required type="password" />
            )}
            <Button disabled={createMutation.isPending} type="submit">
              Criar grupo
            </Button>
          </form>
        </Modal>
      )}

      {user && modal === 'join' && (
        <Modal title="Entrar em grupo" onClose={() => setModal(null)}>
          <form className="grid gap-3" onSubmit={submitJoin}>
            <Input label="ID do grupo" name="groupPublicId" placeholder="Cole o ID copiado" required />
            <label className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-semibold text-ink">
              <span>Grupo privado</span>
              <input
                checked={joinNeedsPassword}
                className="size-4 accent-teal"
                type="checkbox"
                onChange={(event) => setJoinNeedsPassword(event.currentTarget.checked)}
              />
            </label>
            {joinNeedsPassword && <Input label="Senha" name="password" type="password" />}
            <Button disabled={joinMutation.isPending} type="submit" variant="secondary">
              Entrar
            </Button>
          </form>
        </Modal>
      )}
    </>
  )
}

