import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Status } from '../main/api/connection'

// Custom APIs for renderer
const api = {
  loginUser: (username: string, password: string) =>
    ipcRenderer.invoke('user:login', username, password),
  logOut: () => ipcRenderer.invoke('user:logout'),
  //lyssnare, kopplas ihop med "BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('user:logged-out'))"
  onLoggedOut: (cb: () => void) => {
    const listener = (): void => cb()
    ipcRenderer.on('user:logged-out', listener)
    return () => ipcRenderer.removeListener('user:logged-out', listener)
  },
  refreshUser: () => ipcRenderer.invoke('user:refresh'),
  clearSession: () => ipcRenderer.invoke('user:session'),
  hasToken: () => ipcRenderer.invoke('user:hastoken')
}
const socket = {
  connectSocket: () => ipcRenderer.invoke('socket:connect'),
  getStatus: () => ipcRenderer.invoke('socket:getStatus'),
  emitMessage: (text: string) => ipcRenderer.send('socket:emit', text),
  //lyssnare med payload som är status, vilket är av typ Status
  onStatus: (cb: (status: Status) => void) => {
    const listener = (_e: IpcRendererEvent, status: Status): void => cb(status)
    ipcRenderer.on('socket:status', listener)
    return () => ipcRenderer.removeListener('socket:status', listener)
  },
  // samma sak som ovanför, men med text, detta är alltså lyssnare för våra meddelanden som skickas över servern
  onMessage: (cb: (text: string) => void) => {
    const listener = (_e: IpcRendererEvent, text: string): void => cb(text)
    ipcRenderer.on('socket:message', listener)
    return () => ipcRenderer.removeListener('socket:message', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('socket', socket)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.socket = socket
}
