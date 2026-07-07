import type { FormEvent } from 'react'
import type { ListUsersResponse } from '../../../../@types/OndeHoje'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Panel } from '../../../../components/ui/Panel'

type UsersPanelProps = {
  users: ListUsersResponse['data']
  total: number
  onFilter: (filters: { name: string; email: string }) => void
}

export function UsersPanel({ users, total, onFilter }: UsersPanelProps) {
  function filterUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onFilter({
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
    })
  }

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Usuarios</h2>
          <p className="text-sm text-muted">{total} encontrados</p>
        </div>
        <form className="grid gap-2 md:grid-cols-3" onSubmit={filterUsers}>
          <Input label="Nome" name="name" />
          <Input label="Email" name="email" />
          <Button className="self-end" type="submit">
            Buscar
          </Button>
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="px-3">Nome</th>
              <th className="px-3">Email</th>
              <th className="px-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((listedUser) => (
              <tr key={listedUser.id} className="bg-teal-soft">
                <td className="rounded-l-lg px-3 py-3 font-medium">{listedUser.name}</td>
                <td className="px-3 py-3">{listedUser.email}</td>
                <td className="rounded-r-lg px-3 py-3 font-semibold text-teal">{listedUser.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
