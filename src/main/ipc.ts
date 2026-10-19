import { ipcMain } from 'electron'
import { loginUser } from './api/login'
import { logout } from './api/session'
import { refreshUser } from './api/refresh'
import { clearSession } from './api/session'
import { hasToken } from './api/refresh'
import { connectSocket } from './api/connection'
import { getStatus } from './api/connection'
import { emitMessage } from './api/connection'

export function registerIpc() {
  ipcMain.handle('user:login', (_e, username, password) => loginUser({ username, password }))
  ipcMain.handle('user:logout', () => logout())
  ipcMain.handle('user:refresh', () => refreshUser())
  ipcMain.handle('user:session', () => clearSession())
  ipcMain.handle('user:hastoken', () => hasToken())
  ipcMain.handle('socket:connect', () => connectSocket())
  ipcMain.handle('socket:getStatus',() => getStatus())
  ipcMain.on('socket:emit', (_e, text) => emitMessage(text))
}
