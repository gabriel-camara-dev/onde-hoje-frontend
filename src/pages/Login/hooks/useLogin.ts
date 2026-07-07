import { useSearchParams } from 'react-router-dom'

export function useLogin() {
  const [searchParams] = useSearchParams()
  const emailConfirmed = searchParams.get('emailConfirmed')
  const justRegistered = searchParams.get('justRegistered') === '1'
  const registeredEmail = searchParams.get('email') ?? ''
  const returnTo = searchParams.get('returnTo')
  const registerPath = returnTo?.startsWith('/')
    ? '/register?returnTo=' + encodeURIComponent(returnTo)
    : '/register'

  function rememberGoogleReturnTo() {
    if (returnTo?.startsWith('/')) {
      window.sessionStorage.setItem('onde-hoje:oauth-return-to', returnTo)
    }
  }

  return {
    emailConfirmed,
    justRegistered,
    registeredEmail,
    registerPath,
    rememberGoogleReturnTo,
  }
}
