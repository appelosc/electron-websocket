import { io } from 'socket.io-client'
import { logout } from './session'
import { getToken } from '../storage/token'
import { BrowserWindow } from 'electron'

import { refreshToken } from './refresh'
const BASE = 'https://websocket-2keq.onrender.com/'

export type Status = 'green' | 'yellow' | 'red'

let currentStatus: Status = 'red'

function setStatus(status) {
  currentStatus = status
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('socket:status', status))
}

export const socket = io(BASE, {
  autoConnect: false,
  reconnectionAttempts: 5,
  auth: (cb) => cb({ token: getToken('token') })
})

socket.on('connect', () => setStatus('green'))
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    socket.connect()
    setStatus('yellow')
  }
  setStatus(socket.active ? 'yellow' : 'red')
})

socket.on('connect_error', async (err) => {
  if (err.message === 'No token provided' || err.message === 'Invalid token') {
    logout()
    return
  }
  if (err.message !== 'TokenExpiredError') {
    setStatus(socket.active ? 'yellow' : 'red')
    return
  }
  try {
    setStatus('yellow')
    await refreshToken()
    socket.connect()
  } catch {
    // errors handled
  }
  setStatus(socket.active ? 'yellow' : 'red')
})
// Tar hand om statusen i main nu iställer för i frontenden.
socket.io.on('reconnect_attempt', () => setStatus('yellow'))
socket.io.on('reconnect_failed', () => setStatus('red'))
//skickar till alla öppna windows som vi har via channeln message med text som payload.
socket.on('message', (text: string) =>
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('socket:message', text))
)

export function connectSocket() {
  if (socket.connected) return
  setStatus('yellow')
  socket.connect()
}
export function emitMessage(text) {
  socket.emit('message', text)
}
export function getStatus() {
  return currentStatus
}
