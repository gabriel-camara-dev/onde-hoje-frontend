// Remembers (per device) that someone already signed up / logged in here, so the
// header can offer "Entrar" instead of "Registrar" on return visits. Never cleared
// on logout — it reflects device history, not the current session.
const KEY = 'onde-hoje:has-account'

export function markDeviceHasAccount() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // ignore (private mode etc.)
  }
}

export function deviceHasAccount() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
