import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clock3, Copy, LogOut, Link2, Send, Trash2, UserPlus } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { resolveApiUrl } from '../../api/api'
import type { FriendListItem, Group, MyGroup } from '../../@types/OndeHoje'
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
  type GroupMemberSummary,
  type PublicGroupDetails,
} from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { loadGoogleMaps } from '../../lib/googleMaps'
import { useUserStore } from '../../stores/userStore'

type GroupsPageProps = {
  city?: string
}

type GroupTab = 'PUBLIC' | 'PRIVATE'

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
      toast.success('Membro convidado.')
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

  useEffect(() => {
    if (
      !user ||
      !selectedGroup ||
      !searchParams.has('join') ||
      handledJoinInviteRef.current ||
      'myRole' in selectedGroup
    ) {
      return
    }

    handledJoinInviteRef.current = true
    joinMutation.mutate({ groupPublicId: selectedGroup.id })
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('join')
    setSearchParams(nextSearchParams, { replace: true })
  }, [joinMutation, searchParams, selectedGroup, setSearchParams, user])

  function loginForGroupInvite() {
    const nextSearchParams = new URLSearchParams(location.search)
    nextSearchParams.set('join', '1')
    const returnTo = `${location.pathname}?${nextSearchParams.toString()}`

    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return (
    <>
      <StatusBanner
        error={groupsQuery.error?.message ?? myGroupsQuery.error?.message}
        loading={groupsQuery.isLoading || myGroupsQuery.isLoading || friendsQuery.isLoading}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(360px,.8fr)_minmax(0,1.2fr)]">
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

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      className={`min-h-10 rounded-md px-3 text-sm font-semibold transition ${
        active ? 'bg-surface text-teal shadow-sm' : 'text-muted hover:bg-surface'
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function GroupListItem({
  canJoin,
  group,
  onJoin,
  onSelect,
  selected,
}: {
  canJoin?: boolean
  group: Group | MyGroup
  onJoin?: () => void
  onSelect: () => void
  selected: boolean
}) {
  const canOpen = 'members' in group

  return (
    <div
      className={`grid cursor-pointer gap-3 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 ${
        selected ? 'border-teal bg-teal-soft' : 'border-line bg-surface hover:bg-teal-soft'
      }`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold uppercase text-teal">
            {group.privacy === 'PRIVATE' ? 'Privado' : 'Publico'}
            {canOpen && ' - meu grupo'}
          </p>
          <h2 className="text-lg font-semibold">{group.name}</h2>
          <p className="mt-1 text-sm text-muted">{group.description || 'Grupo sem descricao.'}</p>
        </div>
        {canJoin && onJoin && (
          <Button
            className="shrink-0"
            type="button"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              onJoin()
            }}
          >
            <UserPlus size={16} />
            Entrar
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Metric label="membros" value={group.membersCount ?? 0} />
        <Metric label="votos hoje" value={group.todayVotesCount ?? 0} />
      </div>
    </div>
  )
}

function GroupDetail({
  currentUserPublicId,
  friendByUsername,
  friends,
  group,
  inviteUrl,
  isRequestingFriend,
  onAccept,
  onInvite,
  onJoin,
  onLeave,
  onLoginToJoin,
  onRemove,
  onRequestFriend,
  requestedFriendUsernames,
}: {
  currentUserPublicId?: string
  friendByUsername: Map<string, FriendListItem>
  friends: FriendListItem[]
  group: MyGroup | PublicGroupDetails
  inviteUrl: string
  isRequestingFriend?: boolean
  onAccept?: (username: string) => void
  onInvite?: (username: string) => void
  onJoin?: () => void
  onLeave?: () => void
  onLoginToJoin?: () => void
  onRemove?: (username: string) => void
  onRequestFriend: (username: string) => void
  requestedFriendUsernames: Set<string>
}) {
  const canManage = 'myRole' in group && group.myRole === 'OWNER' && group.myStatus === 'ACTIVE'
  const isMember = 'myRole' in group && group.myStatus === 'ACTIVE'
  const pendingMembers = group.members.filter((member) => member.status === 'PENDING')
  const activeMembers = group.members.filter((member) => member.status === 'ACTIVE')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<
    { type: 'leave' } | { type: 'remove'; username: string; name: string } | null
  >(null)
  const [inviteFriendSearch, setInviteFriendSearch] = useState('')
  const [selectedInviteUsernames, setSelectedInviteUsernames] = useState<Set<string>>(new Set())
  const activeMemberUsernames = new Set(activeMembers.map((member) => member.user.username))
  const inviteFriends = friends.filter((friendship) => {
    const username = friendship.friend.username

    if (friendship.status !== 'ACCEPTED' || !username || activeMemberUsernames.has(username)) {
      return false
    }

    const query = normalizeSearch(inviteFriendSearch)

    return !query || normalizeSearch(`${friendship.friend.name} ${username}`).includes(query)
  })

  function confirmRemoveMember(username: string) {
    const member = group.members.find((item) => item.user.username === username)

    setConfirmAction({
      type: 'remove',
      username,
      name: member?.user.name ?? `@${username}`,
    })
  }

  function confirmActionSubmit() {
    if (!confirmAction) {
      return
    }

    if (confirmAction.type === 'leave') {
      onLeave?.()
    } else {
      onRemove?.(confirmAction.username)
    }

    setConfirmAction(null)
  }

  async function copyGroupId() {
    try {
      await navigator.clipboard.writeText(group.id)
      toast.success('ID do grupo copiado.')
    } catch {
      toast.error('Nao foi possivel copiar o ID agora.')
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Link do grupo copiado.')
    } catch {
      toast.error('Nao foi possivel copiar o link agora.')
    }
  }

  function toggleInviteUsername(username: string) {
    setSelectedInviteUsernames((current) => {
      const next = new Set(current)

      if (next.has(username)) {
        next.delete(username)
      } else {
        next.add(username)
      }

      return next
    })
  }

  function sendSelectedInvites() {
    if (!onInvite || selectedInviteUsernames.size === 0) {
      return
    }

    for (const username of selectedInviteUsernames) {
      onInvite(username)
    }

    setSelectedInviteUsernames(new Set())
    setIsInviteModalOpen(false)
  }


  return (
    <>
      <Panel>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase text-teal">
            {group.privacy === 'PRIVATE' ? 'Privado' : 'Publico'}
            {'myRole' in group ? ` - ${group.myRole}` : ''}
          </p>
          <h2 className="text-2xl font-semibold">{group.name}</h2>
          <p className="mt-2 text-sm text-muted">{group.description || 'Grupo sem descricao.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus size={17} />
              Convidar
            </Button>
            {isMember && onLeave && (
              <Button type="button" variant="danger" onClick={() => setConfirmAction({ type: 'leave' })}>
                <LogOut size={17} />
                Sair do grupo
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="membros" value={group.membersCount ?? activeMembers.length} />
          <Metric label="votos hoje" value={group.todayVotesCount ?? 0} />
        </div>
      </div>

      {(onJoin || onLoginToJoin) && !isMember && group.privacy === 'PUBLIC' && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted p-3">
          <p className="text-sm text-muted">
            Voce pode entrar neste grupo e votar junto com as pessoas que ja participam dele.
          </p>
          <Button type="button" onClick={onJoin ?? onLoginToJoin} variant="secondary">
            <UserPlus size={17} />
            Entrar no grupo
          </Button>
        </div>
      )}


      <div className="grid gap-5">
        {canManage && pendingMembers.length > 0 && (
          <MemberSection
            currentUserPublicId={currentUserPublicId}
            friendByUsername={friendByUsername}
            isRequestingFriend={isRequestingFriend}
            members={pendingMembers}
            requestedFriendUsernames={requestedFriendUsernames}
            title="Pedidos pendentes"
            onAccept={onAccept}
            onRemove={confirmRemoveMember}
            onRequestFriend={onRequestFriend}
          />
        )}

        <MemberSection
          currentUserPublicId={currentUserPublicId}
          friendByUsername={friendByUsername}
          isRequestingFriend={isRequestingFriend}
          members={activeMembers}
          requestedFriendUsernames={requestedFriendUsernames}
          title="Membros"
          onRemove={canManage ? confirmRemoveMember : undefined}
          onRequestFriend={onRequestFriend}
        />
      </div>
      </Panel>

      {confirmAction && (
        <Modal
          title={confirmAction.type === 'leave' ? 'Sair do grupo' : 'Remover membro'}
          onClose={() => setConfirmAction(null)}
        >
          <div className="grid gap-4">
            <p className="text-sm text-muted">
              {confirmAction.type === 'leave'
                ? canManage
                  ? 'Você e o dono deste grupo. Ao sair, o cargo de dono será transferido para outro membro do grupo. Se não houver outro membro ativo, o grupo será removido.'
                  : 'Você deixará de participar deste grupo e não poderá mais votar nele.'
                : `Tem certeza que deseja remover ${confirmAction.name} deste grupo?`}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setConfirmAction(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={confirmActionSubmit}>
                {confirmAction.type === 'leave' ? 'Sair do grupo' : 'Remover'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isInviteModalOpen && (
      <Modal title="Convidar para o grupo" onClose={() => setIsInviteModalOpen(false)}>
        <div className="grid gap-4">
          <section className="grid gap-2 rounded-lg border border-line bg-surface-muted p-3">
            <p className="text-sm font-semibold">Compartilhe o grupo</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <code className="flex min-h-10 items-center truncate rounded-md border border-line bg-surface px-3 text-xs font-semibold leading-none text-ink">
                {group.id}
              </code>
              <Button type="button" variant="secondary" onClick={copyGroupId}>
                <Copy size={16} />
                Copiar ID
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <code className="flex min-h-10 items-center truncate rounded-md border border-line bg-surface px-3 text-xs font-semibold leading-none text-ink">
                {inviteUrl}
              </code>
              <Button type="button" variant="secondary" onClick={copyInviteLink}>
                <Link2 size={16} />
                Copiar link
              </Button>
            </div>
            <p className="text-xs text-muted">
              O link leva a pessoa para este grupo. Se ela nao estiver logada, entra primeiro e depois volta para solicitar entrada.
            </p>
          </section>

          {canManage && onInvite && (
            <section className="grid gap-3 rounded-lg border border-line p-3">
              <div>
                <p className="text-sm font-semibold">Convidar amigos</p>
                <p className="text-xs text-muted">Pesquise e selecione pessoas da sua lista de amigos.</p>
              </div>
              <Input
                label="Buscar amigo"
                name="friendSearch"
                placeholder="Nome ou username"
                type="search"
                value={inviteFriendSearch}
                onChange={(event) => setInviteFriendSearch(event.currentTarget.value)}
              />
              <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                {inviteFriends.length === 0 ? (
                  <EmptyState title="Nenhum amigo disponivel" description="Amigos que nao estão no grupo aparecem aqui." />
                ) : (
                  inviteFriends.map((friendship) => {
                    const username = friendship.friend.username!
                    const selected = selectedInviteUsernames.has(username)

                    return (
                      <button
                        key={friendship.friend.publicId}
                        className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition ${
                          selected ? 'border-teal bg-teal-soft' : 'border-line hover:bg-teal-soft'
                        }`}
                        type="button"
                        onClick={() => toggleInviteUsername(username)}
                      >
                        <span className="min-w-0">
                          <strong className="block truncate text-sm">{friendship.friend.name}</strong>
                          <small className="text-teal">@{username}</small>
                        </span>
                        <span className="grid size-7 place-items-center rounded-md border border-line">
                          {selected && <Check size={16} />}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
              <Button disabled={selectedInviteUsernames.size === 0} type="button" onClick={sendSelectedInvites}>
                <Send size={16} />
                Enviar convites
              </Button>
            </section>
          )}
        </div>
      </Modal>
    )}
    </>
  )
}

function MemberSection({
  currentUserPublicId,
  friendByUsername,
  isRequestingFriend,
  members,
  onAccept,
  onRemove,
  onRequestFriend,
  requestedFriendUsernames,
  title,
}: {
  currentUserPublicId?: string
  friendByUsername: Map<string, FriendListItem>
  isRequestingFriend?: boolean
  members: GroupMemberSummary[]
  onAccept?: (username: string) => void
  onRemove?: (username: string) => void
  onRequestFriend: (username: string) => void
  requestedFriendUsernames: Set<string>
  title: string
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase text-muted">{title}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        {members.length === 0 ? (
          <EmptyState
            title="Nada aqui"
            description="Quando houver membros, eles aparecem nesta area."
          />
        ) : (
          members.map((member) => (
            <div
              key={member.user.publicId}
              className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-line p-3"
            >
              <Avatar name={member.user.name} src={member.user.avatarUrl} />
              <span className="min-w-0">
                <strong className="block truncate text-sm">{member.user.name}</strong>
                <small className="text-teal">@{member.user.username}</small>
              </span>
              <span className="inline-flex gap-2">
                {member.user.publicId !== currentUserPublicId && (
                  <FriendshipButton
                    friendship={friendByUsername.get(member.user.username)}
                    isPending={isRequestingFriend}
                    requested={requestedFriendUsernames.has(member.user.username)}
                    username={member.user.username}
                    onRequestFriend={onRequestFriend}
                  />
                )}
                {onAccept && (
                  <Button
                    className="size-9 p-0"
                    type="button"
                    variant="secondary"
                    onClick={() => onAccept(member.user.username)}
                  >
                    <Check size={16} />
                  </Button>
                )}
                {onRemove && member.role !== 'OWNER' && (
                  <Button
                    className="size-9 p-0"
                    type="button"
                    variant="danger"
                    onClick={() => onRemove(member.user.username)}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FriendshipButton({
  friendship,
  isPending,
  onRequestFriend,
  requested,
  username,
}: {
  friendship?: FriendListItem
  isPending?: boolean
  onRequestFriend: (username: string) => void
  requested?: boolean
  username: string
}) {
  if (friendship?.status === 'ACCEPTED') {
    return null
  }

  if (friendship || requested) {
    return (
      <Button
        aria-label={`Enviado @${username}`}
        className="size-12 border-amber-200 bg-amber-50 p-0 text-amber-800 hover:bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200"
        disabled
        title={`Enviado @${username}`}
        type="button"
        variant="secondary"
      >
        <Clock3 size={26} strokeWidth={2.7} />
      </Button>
    )
  }

  return (
    <Button
      aria-label={`Adicionar @${username}`}
      className="size-12 p-0"
      disabled={isPending}
      title={`Adicionar @${username}`}
      type="button"
      variant="secondary"
      onClick={() => onRequestFriend(username)}
    >
      <UserPlus size={27} strokeWidth={2.7} />
    </Button>
  )
}
function Avatar({ name, src }: { name: string; src?: string | null }) {
  const avatarSrc = resolveApiUrl(src)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  if (avatarSrc) {
    return (
      <img
        alt=""
        className="size-10 rounded-md border border-line object-cover"
        referrerPolicy="no-referrer"
        src={avatarSrc}
      />
    )
  }

  return (
    <span className="grid size-10 place-items-center rounded-md bg-teal text-xs font-medium text-on-teal">
      {initials || 'U'}
    </span>
  )
}

function resolveCurrentCity() {
  return new Promise<{ city?: string; state?: string } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const googleApi = await loadGoogleMaps()
          const geocoder = new googleApi.maps.Geocoder()

          geocoder.geocode(
            {
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            },
            (results, status) => {
              if (status !== googleApi.maps.GeocoderStatus.OK || !results?.[0]) {
                resolve(null)
                return
              }

              const result = results[0]

              resolve({
                city:
                  geocodeComponent(result, 'administrative_area_level_2', 'long_name') ??
                  geocodeComponent(result, 'locality', 'long_name'),
                state: geocodeComponent(result, 'administrative_area_level_1', 'short_name'),
              })
            }
          )
        } catch {
          resolve(null)
        }
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 6000,
      }
    )
  })
}

function geocodeComponent(
  result: google.maps.GeocoderResult,
  type: string,
  nameKind: 'long_name' | 'short_name'
) {
  return result.address_components.find((item) => item.types.includes(type))?.[nameKind]
}

function isGroupPublicId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg border border-line p-3 text-sm">
      <strong className="block text-lg">{value}</strong>
      {label}
    </span>
  )
}




















