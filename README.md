# electron-websocket

En desktop-app byggd med Electron, React och TypeScript. Användaren loggar in och kommer sedan till en "pastebin" där allt man skriver skickas live via WebSocket (socket.io) till alla andra anslutna skärmar.

Appen är en port av en tidigare webb-frontend till Electron. All kommunikation med servrarna (inloggning, tokens och socket) har flyttats från frontenden till Electrons main-process.

## Funktioner

- Inloggning mot ett separat auth-API med access token och refresh token
- Automatisk inloggning vid start om en giltig refresh token finns sparad
- Tokens sparas krypterat på disk med Electrons `safeStorage`
- Live-delning av text via socket.io
- Statuslampa för anslutningen (grön = ansluten, gul = ansluter, röd = inte ansluten) och en "Reconnect"-knapp
- Automatisk förnyelse av access token när den har gått ut
- Automatisk utloggning om token är ogiltig eller inte kan förnyas

## Arkitektur

Electron-appen är uppdelad i tre delar:

| Del | Mapp | Ansvar |
| --- | --- | --- |
| Main | `src/main` | Node-processen. Pratar med auth-API:t, hanterar socket-anslutningen och sparar tokens. |
| Preload | `src/preload` | Bryggan mellan main och renderer. Exponerar `window.api` och `window.socket` via `contextBridge`. |
| Renderer | `src/renderer` | React-gränssnittet (Login- och PasteBin-sidorna). Har ingen direkt nätverkskontakt. |

Renderern anropar funktioner på `window.api` / `window.socket`. Preload skickar vidare dem som IPC-meddelanden till main, och main skickar tillbaka händelser (status, meddelanden, utloggning) till alla fönster.

```
Renderer (React)  ──window.api / window.socket──▶  Preload  ──IPC──▶  Main  ──HTTP / socket.io──▶  Servrar
                  ◀──────── onStatus / onMessage / onLoggedOut ───────────────
```

### IPC-kanaler

| Kanal | Typ | Beskrivning |
| --- | --- | --- |
| `user:login` | invoke | Loggar in och sparar token + refresh token |
| `user:logout` | invoke | Kopplar ner socketen, rensar tokens och meddelar renderern |
| `user:refresh` | invoke | Hämtar en ny access token med refresh token |
| `user:session` | invoke | Rensar sparade tokens |
| `user:hastoken` | invoke | Kollar om en refresh token finns sparad |
| `user:logged-out` | main → renderer | Skickas när användaren loggats ut, renderern går till `/login` |
| `socket:connect` | invoke | Startar socket-anslutningen |
| `socket:getStatus` | invoke | Returnerar nuvarande status (`green`, `yellow` eller `red`) |
| `socket:emit` | send | Skickar text till servern |
| `socket:status` | main → renderer | Ny anslutningsstatus |
| `socket:message` | main → renderer | Text som tagits emot från servern |

### Inloggning och tokens

1. Vid start kollar Login-sidan om en refresh token finns. Finns den försöker appen förnya access token och går direkt till pastebin-sidan.
2. Annars loggar användaren in. Servern svarar med en access token och en refresh token som sparas krypterat i `tokens.json` i appens `userData`-mapp.
3. Socketen skickar med access token vid anslutning. Om servern svarar `TokenExpiredError` förnyas token och socketen ansluter igen. Flera samtidiga förnyelser delar på samma anrop.
4. Om token är ogiltig, saknas eller inte går att förnya loggas användaren ut automatiskt.

### Servrar

- Auth-API: `https://authn-authz-k1j2.onrender.com`
- WebSocket-server: `https://websocket-2keq.onrender.com/`

Servrarna ligger på Render och kan ta en stund att vakna om de inte använts på ett tag.

## Projektstruktur

```
src/
├── main/
│   ├── index.ts           # Skapar fönstret och registrerar IPC
│   ├── ipc.ts             # Alla IPC-handlers
│   ├── api/
│   │   ├── client.ts      # fetch-wrapper som lägger till Authorization-header
│   │   ├── login.ts       # Inloggning
│   │   ├── logout.ts      # Utloggning mot servern
│   │   ├── refresh.ts     # Förnyelse av token
│   │   ├── session.ts     # Rensar session och loggar ut lokalt
│   │   └── connection.ts  # socket.io-anslutning och status
│   └── storage/
│       └── token.ts       # Krypterad lagring av tokens
├── preload/
│   ├── index.ts           # Exponerar window.api och window.socket
│   └── index.d.ts         # Typer för window.api och window.socket
└── renderer/
    └── src/
        ├── App.tsx        # Routing och lyssnare för utloggning
        ├── api/auth.ts    # Wrappers runt window.api
        ├── pages/
        │   ├── Login.tsx
        │   └── PasteBin.tsx
        └── styling/
```

## Kom igång

### Installera

```bash
npm install
```

### Utveckling

```bash
npm run dev
```

### Bygga

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Övriga kommandon

```bash
npm run typecheck   # Typkontroll av main, preload och renderer
npm run lint        # ESLint
npm run format      # Prettier
```

På Linux behöver en nyckelring (t.ex. GNOME Keyring eller KWallet) finnas för att `safeStorage` ska kunna kryptera tokens.

## AI-användning

Precis som i projekt 1 har jag använt AI som researchpartner för att be AI förklara koncept, förklara syntax + kod, ge exempel samt i vissa fall generera pseudokod när jag har kört fast. Jag har endast använt det agentiska kodningsverktyget Claude Code (Opus 5.5) för att generera JSX, CSS samt annan "boilerplate-kod". Logiken samt TS-filerna är kod jag själv varit med och skrivit, i vissa fall med hjälp av AI som jag nämnde i början av paragrafen. AI har även använts för att stöda vid buggfixar. Jag förstår den kod jag lämnat in.

## Reflektion

Överlag tyckte jag att detta projekt definitivt var mer krävande än projekt 1. WebSocket-servern var ganska lätt eftersom man endast behövde definiera en emit. Autentiseringen där var lite strulig, men socket.io hade ganska bra och lättläst dokumentation.

Browserklienten var i början också ganska lätt, speciellt utan att behöva ha refresh token ännu. Men sedan när jag la till refresh token blev det lite jobbigt. API-delen av refresh token var inte så svår, men det blev svårt att tänka ut arbetsflödet och hur man skulle knyta samman allt på frontenden. Sedan när jag började lägga till fler lyssnare för sockets för att styra `connection status` på frontenden blev det ganska rörigt, men jag löste det.

Det absolut svåraste för mig i både projekt 1 och 2 var nog att porta till Electron. När man måste flytta logik till main hade jag väldigt svårt att visualisera flödet av information, speciellt när det kom till socket-delen. Vad som skulle till main och hur preload skulle se ut var ganska svårt. Svårast var nog att man t.ex. skulle anropa socket.connect i main, men sedan få renderern att förstå att man hade anropat socket.connect. Det var lätt när man hade allt i frontenden och automatiskt fick reda på om man hade anropat den eller inte. Samma idé gäller när man på frontenden vill att main ska köra socket.connect: då måste man skicka en signal till main, och sedan en signal tillbaka till renderern om att socket.connect hade körts. Logiken bakom detta var mycket svår att visualisera och jag spenderade överlägset mest tid på det.
