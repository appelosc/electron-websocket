import { logoutUser } from './logout'
import { getToken, clearToken } from '../storage/token'
import { socket } from './connection'
import { BrowserWindow } from 'electron'

export function clearSession() {
  if (getToken('refreshtoken')) {
    logoutUser().catch(() => {})
  }
  clearToken()
}

export function logout() {
  socket.disconnect()
  clearSession()
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('user:logged-out'))
}
