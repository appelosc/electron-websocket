import { ElectronAPI } from '@electron-toolkit/preload'
// typ declaration for ts så ts vet att de finns och vad för typ de returnerar.
declare global {
  type Status = 'green' | 'yellow' | 'red'
  interface Window {
    electron: ElectronAPI
    api: {
      loginUser: (username: string, password: string) => Promise<{ message: string }>
      logOut: () => Promise<void>
      refreshUser: () => Promise<{ message: string }>
      clearSession: () => Promise<void>
      hasToken: () => Promise<boolean>
      onLoggedOut: (cb: () => void) => () => void
    }
    socket: {
      connectSocket: () => Promise<void>
      getStatus: () => Promise<Status>
      emitMessage: (text: string) => void
      onStatus: (cb: (status: Status) => void) => () => void
      onMessage: (cb: (text: string) => void) => () => void
    }
  }
}

export {}