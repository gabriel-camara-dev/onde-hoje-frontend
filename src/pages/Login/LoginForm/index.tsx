import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { useAuth } from '../../../hooks/useAuth'

const schema = z.object({
  login: z.string().trim().min(3, 'Informe email, CPF ou username'),
  password: z.string().min(6, 'A senha deve ter no minimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof schema>

export function LoginForm() {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  })

  const { authenticate, isPending } = useAuth()

  const onSubmit = (data: LoginFormData) => {
    authenticate(
      data,
      setError as unknown as (name: string, error: { message: string }) => void,
      reset
    )
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('login')}
        error={errors.login?.message}
        label="Identificador"
        placeholder="email, cpf ou username"
      />
      <Input
        {...register('password')}
        error={errors.password?.message}
        label="Senha"
        type="password"
      />
      {errors.root && <p className="text-sm font-bold text-red-700">{errors.root.message}</p>}
      <Button type="submit" disabled={isSubmitting || isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
