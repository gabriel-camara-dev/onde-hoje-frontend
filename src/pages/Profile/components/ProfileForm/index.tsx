import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { useProfileForm } from './hooks/useProfileForm'

type ProfileFormProps = {
  userId: string
  name: string
  username?: string | null
}

export function ProfileForm({ userId, name, username }: ProfileFormProps) {
  const { handleUpdate } = useProfileForm(userId)

  return (
    <form className="mx-auto mt-8 grid max-w-xl gap-4 text-left" onSubmit={handleUpdate}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome" name="name" defaultValue={name} />
        <Input
          label="Username"
          maxLength={30}
          minLength={3}
          name="username"
          pattern="[a-z0-9_]+"
          defaultValue={username ?? ''}
        />
      </div>
      <Button type="submit">Salvar perfil</Button>
    </form>
  )
}
