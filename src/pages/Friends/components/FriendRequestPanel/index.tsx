import { Link2, UserPlus } from 'lucide-react'
import type { FormEvent } from 'react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Panel } from '../../../../components/ui/Panel'

type FriendRequestPanelProps = {
  canLink: boolean
  onSubmit: (username: string) => void
  onOpenLink: () => void
}

export function FriendRequestPanel({ canLink, onSubmit, onOpenLink }: FriendRequestPanelProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const username = String(new FormData(event.currentTarget).get('username') || '')
    onSubmit(username)
    event.currentTarget.reset()
  }

  return (
    <Panel>
      <h1 className="text-2xl font-semibold">Amizades</h1>
      <p className="mt-2 text-sm text-muted">Solicite amizade pelo username da pessoa.</p>
      <form className="mt-5 grid gap-3" onSubmit={submit}>
        <Input label="Username" name="username" placeholder="username" required />
        <Button type="submit">
          <UserPlus size={17} />
          Enviar pedido
        </Button>
      </form>
      <Button
        className="mt-3 w-full"
        disabled={!canLink}
        type="button"
        variant="secondary"
        onClick={onOpenLink}
      >
        <Link2 size={17} />
        Meu link de amizade
      </Button>
    </Panel>
  )
}
