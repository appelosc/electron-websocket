import { app, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

const file = (): string => path.join(app.getPath('userData'), 'tokens.json')
// istället för localstorage, skapar token.json och skriver/läser/deletar tokens med key value pair

function readAll(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(file(), 'utf-8'))
  } catch {
    return {}
  }
}

export function setToken(key: string, value: string): void {
  const all = readAll()
  all[key] = safeStorage.encryptString(value).toString('base64')
  fs.writeFileSync(file(), JSON.stringify(all))
}

export function getToken(key: string): string | null {
  const encToken = readAll()[key]
  return encToken ? safeStorage.decryptString(Buffer.from(encToken, 'base64')) : null
}

export function clearToken(): void {
  fs.rmSync(file(), { force: true })
}
