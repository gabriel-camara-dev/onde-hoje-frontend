import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../../hooks/useAuth'
import Input from '../../../components/ui/Input'
import styles from './styles.module.css'
import Button from '../../../components/ui/Button'

const schema = z.object({
  emailOrCPF: z
    .string()
    .nonempty('Você precisa inserir um e-mail ou CPF')
    .transform((val) => val.trim()),
  password: z
    .string()
    .nonempty('Você precisa inserir uma senha')
    .min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof schema>

export function LoginForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  })

  const { authenticate, isPending } = useAuth()

  const onSubmit = (data: LoginForm) => {
    authenticate(
      {
        email: data.emailOrCPF,
        password: data.password,
      },
      setError as unknown as (name: string, error: { message: string }) => void,
      reset
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <Input
        {...register('emailOrCPF')}
        placeholder="Email ou CPF"
        error={errors.emailOrCPF?.message}
      />
      <Input
        {...register('password')}
        type="password"
        placeholder="Senha"
        error={errors.password?.message}
      />

      {errors.root && <p className={styles.error}>{errors.root.message}</p>}

      <Button type="submit" disabled={isSubmitting || isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
