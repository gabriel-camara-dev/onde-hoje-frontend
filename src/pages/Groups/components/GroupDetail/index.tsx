import { Check, Copy, Link2, LogOut, Send, UserPlus, X } from 'lucide-react'
import type { FriendListItem, MyGroup } from '../../../../@types/OndeHoje'
import type { PublicGroupDetails } from '../../../../api/ondeHoje'
import { Avatar } from '../../../../components/Avatar'
import Button from '../../../../components/ui/Button'
import { EmptyState } from '../../../../components/ui/EmptyState'
import Input from '../../../../components/ui/Input'
import { Modal } from '../../../../components/ui/Modal'
import { Panel } from '../../../../components/ui/Panel'
import { GroupWeekVotes } from '../GroupWeekVotes'
import { MemberSection } from '../MemberSection'
import { Metric } from '../Metric'
import { useGroupDetailState } from './hooks/useGroupDetailState'

export function GroupDetail({
  currentUserPublicId,
  friendByUsername,
  friends,
  group,
  inviteUrl,
  isRequestingFriend,
  onAccept,
  onAcceptInvite,
  onDeclineInvite,
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
  onAcceptInvite?: () => void
  onDeclineInvite?: () => void
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
  const isInvited = 'myStatus' in group && group.myStatus === 'INVITED'
  const {
    activeMembers,
    callFriend,
    confirmAction,
    confirmActionSubmit,
    confirmRemoveMember,
    copyGroupId,
    copyInviteLink,
    inviteFriends,
    inviteFriendSearch,
    isFriendPickerOpen,
    isInviteModalOpen,
    pendingMembers,
    setConfirmAction,
    setInviteFriendSearch,
    setIsFriendPickerOpen,
    setIsInviteModalOpen,
  } = useGroupDetailState({ friends, group, inviteUrl, onInvite, onLeave, onRemove })

  return (
    <>
      <Panel>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase text-teal">
              {group.privacy === 'PRIVATE' ? 'Privado' : 'Público'}
              {'myRole' in group ? ` - ${group.myRole}` : ''}
            </p>
            <h2 className="text-2xl font-semibold">{group.name}</h2>
            <p className="mt-2 text-sm text-muted">{group.description || 'Grupo sem descrição.'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <GroupWeekVotes groupId={group.id} />
              <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus size={17} />
                Convidar
              </Button>
              {isMember && onLeave && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setConfirmAction({ type: 'leave' })}
                >
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

        {isInvited && (onAcceptInvite || onDeclineInvite) && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal/40 bg-teal-soft p-3">
            <p className="text-sm font-semibold text-ink">
              Você foi convidado para este grupo. Aceite para participar e votar junto.
            </p>
            <div className="flex gap-2">
              {onAcceptInvite && (
                <Button type="button" onClick={onAcceptInvite}>
                  <Check size={17} />
                  Aceitar convite
                </Button>
              )}
              {onDeclineInvite && (
                <Button type="button" variant="secondary" onClick={onDeclineInvite}>
                  <X size={17} />
                  Recusar
                </Button>
              )}
            </div>
          </div>
        )}

        {(onJoin || onLoginToJoin) && !isMember && !isInvited && group.privacy === 'PUBLIC' && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted p-3">
            <p className="text-sm text-muted">
              Você pode entrar neste grupo e votar junto com as pessoas que já participam dele.
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
                  : 'Você deixara de participar deste grupo e não podera mais votar nele.'
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
                O link leva a pessoa para este grupo. Se ela não estiver logada, entra primeiro e depois volta para solicitar entrada.
              </p>
            </section>

            {isMember && onInvite && (
              <Button
                type="button"
                onClick={() => {
                  setInviteFriendSearch('')
                  setIsFriendPickerOpen(true)
                }}
              >
                <UserPlus size={16} />
                Chamar um amigo
              </Button>
            )}
          </div>
        </Modal>
      )}

      {isFriendPickerOpen && (
        <Modal title="Chamar um amigo" onClose={() => setIsFriendPickerOpen(false)}>
          <Input
            label="Buscar amigo"
            name="friendSearch"
            placeholder="Nome ou username"
            type="search"
            value={inviteFriendSearch}
            onChange={(event) => setInviteFriendSearch(event.currentTarget.value)}
          />
          <div className="grid max-h-[45vh] gap-1.5 overflow-y-auto pr-1">
            {inviteFriends.length === 0 ? (
              <EmptyState
                title="Nenhum amigo disponível"
                description="Amigos que ainda não estão no grupo aparecem aqui."
              />
            ) : (
              inviteFriends.map((friendship) => {
                const username = friendship.friend.username!

                return (
                  <article
                    key={friendship.friend.publicId}
                    className="flex items-center gap-2.5 rounded-lg border border-line p-2"
                  >
                    <Avatar
                      name={friendship.friend.name}
                      src={friendship.friend.avatarUrl}
                      className="size-9 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">{friendship.friend.name}</strong>
                      <span className="block truncate text-xs font-medium text-teal">@{username}</span>
                    </div>
                    <Button
                      className="h-9 shrink-0 px-3 py-0 text-xs"
                      type="button"
                      variant="secondary"
                      onClick={() => callFriend(username)}
                    >
                      <Send size={15} />
                      Chamar
                    </Button>
                  </article>
                )
              })
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
