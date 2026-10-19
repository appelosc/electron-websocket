import { authApi } from './client'
import { setToken } from '../storage/token'

export async function loginUser(userData: {
  username: string
  password: string
}): Promise<{ message: string }> {
  const res = await authApi<{ message: string; token: string; refresh: string }>(`/auth/login`, {
    method: 'POST',
    body: JSON.stringify(userData)
  })
  setToken('token', res.token)
  setToken('refreshtoken', res.refresh)
  return { message: res.message }
}
