# Clipboard Sync App – Electron desktop client

A desktop app built with Electron, React and TypeScript. The user logs in and then reaches a "pastebin" where everything typed is sent live over WebSocket (socket.io) to all other connected screens.

The app is a port of an earlier web frontend ([websocket-frontend](https://github.com/appelosc/websocket-frontend)) to Electron. All communication with the servers (login, tokens and socket) has been moved from the frontend to Electron's main process.

Related repos: [authn-authz](https://github.com/appelosc/authn-authz) (`project2` branch, authentication API) and [websocket](https://github.com/appelosc/websocket) (WebSocket server).

## Features

- Login against a separate auth API with an access token and a refresh token
- Automatic login on start if a valid refresh token is stored
- Tokens are stored encrypted on disk with Electron's `safeStorage`
- Live text sharing over socket.io
- Connection status light (green = connected, yellow = connecting, red = not connected) and a "Reconnect" button
- Automatic renewal of the access token when it has expired
- Automatic logout if the token is invalid or cannot be renewed

## Architecture

The Electron app is split into three parts:

| Part | Folder | Responsibility |
| --- | --- | --- |
| Main | `src/main` | The Node process. Talks to the auth API, handles the socket connection and stores tokens. |
| Preload | `src/preload` | The bridge between main and renderer. Exposes `window.api` and `window.socket` through `contextBridge`. |
| Renderer | `src/renderer` | The React interface (the Login and PasteBin pages). Has no direct network access. |

The renderer calls functions on `window.api` / `window.socket`. Preload forwards them as IPC messages to main, and main sends events (status, messages, logout) back to all windows.

```
Renderer (React)  ──window.api / window.socket──▶  Preload  ──IPC──▶  Main  ──HTTP / socket.io──▶  Servers
                  ◀──────── onStatus / onMessage / onLoggedOut ───────────────
```

### IPC channels

| Channel | Type | Description |
| --- | --- | --- |
| `user:login` | invoke | Logs in and stores the token and refresh token |
| `user:logout` | invoke | Disconnects the socket, clears the tokens and notifies the renderer |
| `user:refresh` | invoke | Fetches a new access token with the refresh token |
| `user:session` | invoke | Clears stored tokens |
| `user:hastoken` | invoke | Checks whether a refresh token is stored |
| `user:logged-out` | main → renderer | Sent when the user has been logged out; the renderer goes to `/login` |
| `socket:connect` | invoke | Starts the socket connection |
| `socket:getStatus` | invoke | Returns the current status (`green`, `yellow` or `red`) |
| `socket:emit` | send | Sends text to the server |
| `socket:status` | main → renderer | New connection status |
| `socket:message` | main → renderer | Text received from the server |

### Login and tokens

1. On start, the Login page checks whether a refresh token exists. If it does, the app tries to renew the access token and goes straight to the pastebin page.
2. Otherwise the user logs in. The server responds with an access token and a refresh token, which are stored encrypted in `tokens.json` in the app's `userData` folder.
3. The socket sends the access token when connecting. If the server answers `TokenExpiredError`, the token is renewed and the socket connects again. Several simultaneous renewals share the same request.
4. If the token is invalid, missing or cannot be renewed, the user is logged out automatically.

### Servers

- Auth API: `https://authn-authz-k1j2.onrender.com`
- WebSocket server: `https://websocket-2keq.onrender.com/`

The servers are hosted on Render and can take a while to wake up if they have not been used for some time.

## Project structure

```
src/
├── main/
│   ├── index.ts           # Creates the window and registers IPC
│   ├── ipc.ts             # All IPC handlers
│   ├── api/
│   │   ├── client.ts      # fetch wrapper that adds the Authorization header
│   │   ├── login.ts       # Login
│   │   ├── logout.ts      # Logout against the server
│   │   ├── refresh.ts     # Token renewal
│   │   ├── session.ts     # Clears the session and logs out locally
│   │   └── connection.ts  # socket.io connection and status
│   └── storage/
│       └── token.ts       # Encrypted token storage
├── preload/
│   ├── index.ts           # Exposes window.api and window.socket
│   └── index.d.ts         # Types for window.api and window.socket
└── renderer/
    └── src/
        ├── App.tsx        # Routing and logout listener
        ├── api/auth.ts    # Wrappers around window.api
        ├── pages/
        │   ├── Login.tsx
        │   └── PasteBin.tsx
        └── styling/
```

## Getting started

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Other commands

```bash
npm run typecheck   # Type check of main, preload and renderer
npm run lint        # ESLint
npm run format      # Prettier
```

On Linux a keyring (for example GNOME Keyring or KWallet) must be available for `safeStorage` to be able to encrypt tokens.
