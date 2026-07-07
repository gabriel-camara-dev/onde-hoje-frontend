import Button from '../../../../components/ui/Button'
import { useDeleteAccount } from './hooks/useDeleteAccount'

export function ProfileActions({ userId }: { userId: string }) {
  const { logout, requestDelete } = useDeleteAccount(userId)

  return (
    <div className="mx-auto mt-4 grid max-w-xl gap-2 sm:grid-cols-2">
      <Button type="button" variant="secondary" onClick={logout}>
        Sair
      </Button>
      <Button type="button" variant="danger" onClick={requestDelete}>
        Remover conta
      </Button>
    </div>
  )
}
