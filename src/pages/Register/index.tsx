import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { registerUser } from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { AuthShell } from '../Auth/AuthShell'

const schema = z
  .object({
    name: z.string().trim().min(3, 'Informe seu nome completo'),
    username: z
      .string()
      .trim()
      .min(3, 'O username deve ter no minimo 3 caracteres')
      .regex(/^[a-zA-Z0-9._]+$/, 'Use apenas letras, numeros, ponto ou underline'),
    email: z.string().trim().email('Informe um email valido'),
    password: z.string().min(6, 'A senha deve ter no minimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas precisam ser iguais',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof schema>

export function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
  })

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (_data, variables) => {
      reset()

      const loginParams = new URLSearchParams({ justRegistered: '1', email: variables.email })

      if (returnTo?.startsWith('/')) {
        loginParams.set('returnTo', returnTo)
      }

      navigate(`/login?${loginParams.toString()}`, { replace: true })
    },
    onError: (error) => {
      setError('root', {
        message: error instanceof Error ? error.message : 'Nao foi possivel criar sua conta agora.',
      })
    },
  })

  function onSubmit(data: RegisterFormData) {
    registerMutation.mutate({
      name: data.name,
      username: data.username,
      email: data.email,
      password: data.password,
    })
  }

  return (
    <AuthShell
      title="Crie sua conta"
      description="Cadastre-se para votar, participar de grupos e salvar seu historico no OndeHoje."
      actions={
        <>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-on-teal transition hover:bg-teal-dark"
            to={returnTo?.startsWith('/') ? '/login?returnTo=' + encodeURIComponent(returnTo) : '/login'}
          >
            Ja tenho conta
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-teal-soft"
            to="/"
          >
            Explorar mapa publico
          </Link>
        </>
      }
    >
      <StatusBanner
        error={errors.root?.message}
        message="Depois do cadastro, voce sera levado para o login. Confirme o email em ate 5 minutos para manter a conta ativa."
      />

      <Panel className="rounded-2xl p-5">
        <p className="mb-2 text-xs font-semibold uppercase text-teal">Cadastro</p>
        <h2 className="mb-4 text-2xl font-semibold">Crie sua conta</h2>
        <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
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
          <Button className="mt-2" disabled={isSubmitting || registerMutation.isPending} type="submit">
            {registerMutation.isPending ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>
      </Panel>
    </AuthShell>
  )
}