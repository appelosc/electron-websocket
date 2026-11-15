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

## AI usage

Just as in project 1, I used AI as a research partner: to explain concepts, explain syntax and code, give examples and in some cases generate pseudocode when I got stuck. I only used the agentic coding tool Claude Code (Opus 5.5) to generate JSX, CSS and other boilerplate code. The logic and the TS files are code I took part in writing myself, in some cases with help from AI as mentioned at the start of this paragraph. AI was also used to support bug fixes. I understand the code I submitted.

## Reflection

Overall I thought this project was definitely more demanding than project 1. The WebSocket server was fairly easy because you only had to define an emit. The authentication there was a bit fiddly, but socket.io had good and readable documentation.

The browser client was also fairly easy at first, especially before it needed a refresh token. When I added the refresh token it got harder. The API part of the refresh token was not that difficult, but it was hard to think through the workflow and how to tie everything together on the frontend. When I then started adding more socket listeners to control the `connection status` on the frontend it got quite messy, but I solved it.

The hardest part for me in both project 1 and 2 was porting to Electron. When logic had to move to main, I had a very hard time visualizing the flow of information, especially for the socket part. What should go to main and what preload should look like was quite difficult. The hardest thing was, for example, calling socket.connect in main and then making the renderer understand that socket.connect had been called. That was easy when everything was in the frontend and you automatically knew whether it had been called or not. The same idea applies when the frontend wants main to run socket.connect: you have to send a signal to main, and then a signal back to the renderer that socket.connect has run. The logic behind this was very hard to visualize, and it is by far what I spent the most time on.
