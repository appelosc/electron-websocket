import { authApi } from './client'
import { getToken } from '../storage/token'

export const logoutUser = () =>
  authApi<{ message: string }>('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken('refreshtoken')}` },
    keepalive: true
  })

