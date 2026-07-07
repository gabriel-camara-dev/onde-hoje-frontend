import { ResendConfirmationCard } from '../../../../components/auth/ResendConfirmationCard'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { useLoginForm } from './hooks/useLoginForm'

export function LoginForm() {
  const { errors, isEmailNotVerified, isPending, isSubmitting, loginValue, register, submit } =
    useLoginForm()

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <Input
        {...register('login')}
        error={errors.login?.message}
        label="Email ou username"
        required
      />
      <Input
        {...register('password')}
        error={errors.password?.message}
        label="Senha"
        required
        type="password"
      />
      {errors.root && <p className="text-sm font-medium text-red-700">{errors.root.message}</p>}
      {isEmailNotVerified && (
        <ResendConfirmationCard email={loginValue?.includes('@') ? loginValue : ''} />
      )}
      <Button type="submit" disabled={isSubmitting || isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
