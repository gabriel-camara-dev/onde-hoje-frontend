import type { FormEvent } from 'react'
import type { ListUsersResponse } from '../../../../@types/OndeHoje'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Panel } from '../../../../components/ui/Panel'

type ListedUser = ListUsersResponse['data'][number]

type UsersPanelProps = {
  users: ListedUser[]
  total: number
  onFilter: (filters: { name: string; email: string; username: string }) => void
  onSelectUser: (user: ListedUser) => void
}

export function UsersPanel({ users, total, onFilter, onSelectUser }: UsersPanelProps) {
  function filterUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onFilter({
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      username: String(form.get('username') || ''),
    })
  }

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Usuários</h2>
          <p className="text-sm text-muted">{total} encontrados · clique para ver o histórico</p>
        </div>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={filterUsers}>
          <Input label="Nome" name="name" />
          <Input label="Username" name="username" placeholder="username" />
          <Input label="Email" name="email" />
          <Button className="self-end" type="submit">
            Buscar
          </Button>
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="px-3">Nome</th>
              <th className="px-3">Username</th>
              <th className="px-3">Email</th>
              <th className="px-3">Role</th>
              <th className="px-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((listedUser) => (
              <tr
                key={listedUser.id}
                className="cursor-pointer bg-teal-soft transition hover:brightness-95"
                role="button"
                tabIndex={0}
                onClick={() => onSelectUser(listedUser)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectUser(listedUser)
                  }
                }}
              >
                <td className="rounded-l-lg px-3 py-3 font-medium">{listedUser.name}</td>
                <td className="px-3 py-3 text-muted">
                  {listedUser.username ? `@${listedUser.username}` : '—'}
                </td>
                <td className="px-3 py-3">{listedUser.email}</td>
                <td className="px-3 py-3 font-semibold text-teal">{listedUser.role}</td>
                <td className="rounded-r-lg px-3 py-3 text-right text-xs font-semibold text-teal">
                  Ver histórico →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
