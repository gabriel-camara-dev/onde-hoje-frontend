import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { EMAIL_NOT_VERIFIED_MESSAGE } from '../../../../../api/apiErrorMessages'
import { useAuth } from '../../../../../hooks/useAuth'

const schema = z.object({
  login: z.string().trim().min(3, 'Informe seu email ou username'),
  password: z.string().min(6, 'A senha deve ter no minimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof schema>

export function useLoginForm() {
  const {
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  })

  const { authenticate, isPending } = useAuth()
  const isEmailNotVerified = errors.root?.message === EMAIL_NOT_VERIFIED_MESSAGE
  const loginValue = getValues('login')

  const submit = handleSubmit((data) => {
    authenticate(
      data,
      setError as unknown as (name: string, error: { message: string }) => void,
      reset
    )
  })

  return {
    errors,
    isEmailNotVerified,
    isPending,
    isSubmitting,
    loginValue,
    register,
    submit,
  }
}
