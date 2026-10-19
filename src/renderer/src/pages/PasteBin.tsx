import { useEffect, useState } from 'react'
import { logout } from '../api/logout'
import type { Status } from '../types/status.ts'
import '../styling/PasteBin.css'

function PasteBin() {
  const statusText: Record<Status, string> = {
    green: 'Connected',
    yellow: 'Connecting…',
    red: 'Not connected'
  }
  const [received, setReceived] = useState('')
  const [status, setStatus] = useState<Status>('yellow')

  useEffect(() => {
    window.socket.getStatus().then(setStatus)
    window.socket.connectSocket()

    const unsubscribeStatus = window.socket.onStatus((s) => setStatus(s))
    const unsubscribeMessage = window.socket.onMessage((text) => setReceived(text))

    return () => {
      unsubscribeStatus()
      unsubscribeMessage()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    window.socket.emitMessage(value)
  }

  return (
    <main className="paste">
      <header className="paste-header">
        <div className="paste-titlebar">
          <h1 className="paste-title">Pastebin</h1>
          <button className="paste-logout" type="button" onClick={logout}>
            Log out
          </button>
        </div>
        <p className="paste-intro">Type on the left. Every connected screen sees it as you type.</p>
        <div className="paste-status" role="status">
          <span className={`paste-light paste-light--${status}`} aria-hidden="true" />
          <span>{statusText[status]}</span>
          {status === 'red' && (
            <button
              className="paste-reconnect"
              type="button"
              onClick={() => window.socket.connectSocket()}
            >
              Reconnect
            </button>
          )}
        </div>
      </header>

      <label className="paste-field">
        <span>Your text</span>
        <textarea
          className="paste-input"
          onChange={handleChange}
          spellCheck={false}
          placeholder="Start typing…"
        />
      </label>

      <section className="paste-echo" aria-live="polite">
        <h2 className="paste-label">From other screens</h2>
        <div className="paste-sheet">
          {received ? (
            <p className="paste-received">{received}</p>
          ) : (
            <p className="paste-empty">Nothing yet. Text typed on another screen appears here.</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default PasteBin
