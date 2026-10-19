import { authApi } from './client'
import { getToken, setToken} from '../storage/token'
import { logout } from './session';

export async function refreshUser(): Promise<{ message: string }> {
  const res = await authApi<{ message: string; token: string }>('/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken('refreshtoken')}` }
  })
  setToken('token', res.token)
  return { message: res.message }
}

let refreshPromise: Promise<string> | null = null

export function refreshToken(): Promise<string> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const res = await refreshUser()
      return res.message
    } catch (err) {
      logout()
      throw err
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function hasToken(): Promise<boolean> {
  return !!getToken('refreshtoken')
}
