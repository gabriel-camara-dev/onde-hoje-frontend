import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { registerUser } from '../../../../../api/ondeHoje'
import { markDeviceHasAccount } from '../../../../../lib/deviceAccount'

const schema = z
  .object({
    name: z.string().trim().min(3, 'Informe seu nome completo'),
    username: z
      .string()
      .trim()
      .min(3, 'O username deve ter no mínimo 3 caracteres')
      .regex(/^[a-zA-Z0-9._]+$/, 'Use apenas letras, números, ponto ou underline'),
    email: z.string().trim().email('Informe um email válido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas precisam ser iguais',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof schema>

export function useRegisterForm() {
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
      markDeviceHasAccount()
      reset()

      const loginParams = new URLSearchParams({ justRegistered: '1', email: variables.email })

      if (returnTo?.startsWith('/')) {
        loginParams.set('returnTo', returnTo)
      }

      navigate(`/login?${loginParams.toString()}`, { replace: true })
    },
    onError: (error) => {
      setError('root', {
        message: error instanceof Error ? error.message : 'Não foi possível criar sua conta agora.',
      })
    },
  })

  const submit = handleSubmit((data) => {
    registerMutation.mutate({
      name: data.name,
      username: data.username,
      email: data.email,
      password: data.password,
    })
  })

  return {
    errors,
    isSubmitting,
    isPending: registerMutation.isPending,
    register,
    submit,
  }
}
