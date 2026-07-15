import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Panel } from '../../../../components/ui/Panel'
import { StatusBanner } from '../../../../components/ui/StatusBanner'
import { useRegisterForm } from './hooks/useRegisterForm'

export function RegisterForm() {
  const { errors, isSubmitting, isPending, register, submit } = useRegisterForm()

  return (
    <>
      <StatusBanner error={errors.root?.message} />

      <Panel className="rounded-2xl p-5">
        <p className="mb-2 text-xs font-semibold uppercase text-teal">Cadastro</p>
        <h2 className="mb-4 text-2xl font-semibold">Crie sua conta</h2>
        <form className="grid gap-3" onSubmit={submit}>
          <Input
            {...register('name')}
            error={errors.name?.message}
            label="Nome completo"
            placeholder="Seu nome"
            required
          />
          <Input
            {...register('username')}
            error={errors.username?.message}
            label="Username"
            placeholder="seu_username"
            required
          />
          <Input
            {...register('email')}
            error={errors.email?.message}
            label="Email"
            placeholder="seu.email@email.com"
            required
            type="email"
          />
          <Input
            {...register('password')}
            error={errors.password?.message}
            label="Senha"
            required
            type="password"
          />
          <Input
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            label="Confirmar senha"
            required
            type="password"
          />
          <Button className="mt-2" disabled={isSubmitting || isPending} type="submit">
            {isPending ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>
      </Panel>
    </>
  )
}
