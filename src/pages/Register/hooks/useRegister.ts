import { useSearchParams } from 'react-router-dom'

export function useRegister() {
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const loginPath = returnTo?.startsWith('/')
    ? '/login?returnTo=' + encodeURIComponent(returnTo)
    : '/login'

  return { loginPath }
}
