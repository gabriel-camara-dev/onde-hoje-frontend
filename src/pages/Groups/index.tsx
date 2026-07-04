import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Trash2, UserPlus, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { Group, MyGroup } from '../../@types/OndeHoje'
import {
  acceptGroupMember,
  createGroup,
  inviteGroupMember,
  joinGroup,
  listMyGroups,
  listPublicGroups,
  removeGroupMember,
} from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
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
  const user = useUserStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<GroupTab>('PUBLIC')
  const [modal, setModal] = useState<'create' | 'join' | null>(null)
  const [createPrivacy, setCreatePrivacy] = useState<GroupTab>('PUBLIC')
  const [selectedGroupId, setSelectedGroupId] = useState<string>()
  const [currentCity, setCurrentCity] = useState(city)
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

  const groupsQuery = useQuery({
    queryKey: ['groups', groupsCity],
    queryFn: () => listPublicGroups(groupsCity),
  })
  const myGroupsQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['my-groups'],
    queryFn: listMyGroups,
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
    },
  })
  const joinMutation = useMutation({
    mutationFn: (form: FormData) =>
      joinGroup({
        name: String(form.get('name')),
        password: String(form.get('password') || '') || undefined,
      }),
    onSuccess: () => {
      setModal(null)
      refreshGroups()
    },
  })
  const acceptMutation = useMutation({
    mutationFn: ({ groupId, username }: { groupId: string; username: string }) =>
      acceptGroupMember(groupId, username),
    onSuccess: () => refreshGroups(),
  })
  const inviteMutation = useMutation({
    mutationFn: ({ groupId, username }: { groupId: string; username: string }) =>
      inviteGroupMember(groupId, username.replace(/^@/, '')),
    onSuccess: () => refreshGroups(),
  })
  const removeMutation = useMutation({
    mutationFn: ({ groupId, username }: { groupId: string; username: string }) =>
      removeGroupMember(groupId, username),
    onSuccess: () => refreshGroups(),
  })

  function refreshGroups() {
    queryClient.invalidateQueries({ queryKey: ['groups'] })
    queryClient.invalidateQueries({ queryKey: ['my-groups'] })
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(new FormData(event.currentTarget))
  }

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    joinMutation.mutate(new FormData(event.currentTarget))
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
    const myPublicIds = new Set(myPublicGroups.map((group) => group.id))

    return [...myPublicGroups, ...publicGroups.filter((group) => !myPublicIds.has(group.id))]
  }, [activeTab, myGroups, publicGroups, user])
  const selectedGroup = myGroups.find((group) => group.id === selectedGroupId)

  return (
    <>
      <StatusBanner
        error={
          groupsQuery.error?.message ??
          myGroupsQuery.error?.message ??
          createMutation.error?.message ??
          joinMutation.error?.message ??
          acceptMutation.error?.message ??
          inviteMutation.error?.message ??
          removeMutation.error?.message
        }
        loading={
          groupsQuery.isLoading ||
          myGroupsQuery.isLoading ||
          createMutation.isPending ||
          joinMutation.isPending ||
          acceptMutation.isPending ||
          inviteMutation.isPending ||
          removeMutation.isPending
        }
        message={
          createMutation.isSuccess
            ? 'Grupo criado.'
            : joinMutation.isSuccess
              ? 'Entrada solicitada.'
              : acceptMutation.isSuccess
                ? 'Membro aprovado.'
                : inviteMutation.isSuccess
                  ? 'Membro convidado.'
                  : removeMutation.isSuccess
                    ? 'Membro removido.'
                    : undefined
        }
      />

      <section className={user ? 'grid gap-4 xl:grid-cols-[minmax(360px,.8fr)_minmax(0,1.2fr)]' : 'grid gap-4'}>
        <Panel className={user ? '' : 'mx-auto w-full max-w-4xl'}>
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

          <div className="grid gap-3">
            {visibleGroups.length === 0 ? (
              <EmptyState
                title={activeTab === 'PRIVATE' ? 'Nenhum grupo privado' : 'Nenhum grupo publico'}
                description={user ? 'Crie um grupo ou entre usando nome e senha.' : 'Quando houver grupos publicos nessa cidade, eles aparecem aqui.'}
              />
            ) : (
              visibleGroups.map((group) => (
                <GroupListItem
                  key={group.id}
                  group={group}
                  selected={group.id === selectedGroupId}
                  onSelect={() => setSelectedGroupId(group.id)}
                />
              ))
            )}
          </div>
        </Panel>

        {user && (selectedGroup ? (
          <GroupDetail
            group={selectedGroup}
            onAccept={(username) => acceptMutation.mutate({ groupId: selectedGroup.id, username })}
            onInvite={(username) => inviteMutation.mutate({ groupId: selectedGroup.id, username })}
            onRemove={(username) => removeMutation.mutate({ groupId: selectedGroup.id, username })}
          />
        ) : (
          <Panel>
            <EmptyState
              title="Abra um grupo"
              description="Selecione um grupo seu para ver membros, aceitar pedidos ou convidar amigos."
            />
          </Panel>
        ))}
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
            <label className="grid gap-1.5 text-xs font-medium text-muted">
              <span>
                Privacidade <span className="text-teal">*</span>
              </span>
              <select
                className="min-h-10 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                name="privacy"
                required
                value={createPrivacy}
                onChange={(event) => setCreatePrivacy(event.currentTarget.value as GroupTab)}
              >
                <option value="PUBLIC">Publico</option>
                <option value="PRIVATE">Privado</option>
              </select>
            </label>
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
            <Input label="Nome do grupo" name="name" required />
            <Input label="Senha" name="password" type="password" />
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
  group,
  onSelect,
  selected,
}: {
  group: Group | MyGroup
  onSelect: () => void
  selected: boolean
}) {
  const canOpen = 'members' in group

  return (
    <button
      className={`grid gap-3 rounded-lg border p-4 text-left transition ${
        selected ? 'border-teal bg-teal-soft' : 'border-line bg-surface hover:bg-teal-soft'
      }`}
      type="button"
      onClick={onSelect}
    >
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-teal">
          {group.privacy === 'PRIVATE' ? 'Privado' : 'Publico'}
          {canOpen && ' - meu grupo'}
        </p>
        <h2 className="text-lg font-semibold">{group.name}</h2>
        <p className="mt-1 text-sm text-muted">{group.description || 'Grupo sem descricao.'}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Metric label="membros" value={group.membersCount ?? 0} />
        <Metric label="votos hoje" value={group.todayVotesCount ?? 0} />
      </div>
    </button>
  )
}

function GroupDetail({
  group,
  onAccept,
  onInvite,
  onRemove,
}: {
  group: MyGroup
  onAccept: (username: string) => void
  onInvite: (username: string) => void
  onRemove: (username: string) => void
}) {
  const canManage = group.myRole === 'OWNER' && group.myStatus === 'ACTIVE'
  const pendingMembers = group.members.filter((member) => member.status === 'PENDING')
  const activeMembers = group.members.filter((member) => member.status === 'ACTIVE')

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const username = String(new FormData(form).get('username') || '').replace(/^@/, '')

    if (username) {
      onInvite(username)
      form.reset()
    }
  }

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-teal">
            {group.privacy === 'PRIVATE' ? 'Privado' : 'Publico'} - {group.myRole}
          </p>
          <h2 className="text-2xl font-semibold">{group.name}</h2>
          <p className="mt-2 text-sm text-muted">{group.description || 'Grupo sem descricao.'}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="membros" value={group.membersCount ?? activeMembers.length} />
          <Metric label="votos hoje" value={group.todayVotesCount ?? 0} />
        </div>
      </div>

      {canManage && (
        <form className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={submitInvite}>
          <Input label="Convidar por username" name="username" placeholder="amigo_username" required />
          <Button className="self-end" type="submit" variant="secondary">
            <UserPlus size={17} />
            Convidar
          </Button>
        </form>
      )}

      <div className="grid gap-5">
        {canManage && pendingMembers.length > 0 && (
          <MemberSection
            members={pendingMembers}
            title="Pedidos pendentes"
            onAccept={onAccept}
            onRemove={onRemove}
          />
        )}

        <MemberSection
          members={activeMembers}
          title="Membros"
          onRemove={canManage ? onRemove : undefined}
        />
      </div>
    </Panel>
  )
}

function MemberSection({
  members,
  onAccept,
  onRemove,
  title,
}: {
  members: MyGroup['members']
  onAccept?: (username: string) => void
  onRemove?: (username: string) => void
  title: string
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase text-muted">{title}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        {members.length === 0 ? (
          <EmptyState title="Nada aqui" description="Quando houver membros, eles aparecem nesta area." />
        ) : (
          members.map((member) => (
            <div
              key={member.user.publicId}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-line p-3"
            >
              <span className="min-w-0">
                <strong className="block truncate text-sm">{member.user.name}</strong>
                <small className="text-teal">@{member.user.username}</small>
              </span>
              <span className="inline-flex gap-2">
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

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm">
      <section className="grid w-full max-w-lg gap-4 rounded-lg border border-line bg-surface p-5 text-ink shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button className="size-12 p-0" type="button" variant="ghost" onClick={onClose}>
            <X size={26} strokeWidth={2.6} />
          </Button>
        </div>
        {children}
      </section>
    </div>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg border border-line p-3 text-sm">
      <strong className="block text-lg">{value}</strong>
      {label}
    </span>
  )
}

