# sommer-bot

Discord-Bot für den Sommer-Server.

## Voraussetzungen

- Node.js 22 oder neuer
- Eine Discord-Bot-App mit Token
- Optional: ein Backend für `src/services/userService.js`

## Einrichtung

1. Abhängigkeiten installieren:

```powershell
npm install
```

2. `.env.example` nach `.env` kopieren und ausfüllen:

```env
TOKEN=dein_discord_bot_token
API_BASE_URL=http://localhost:8080/api/v1
```

3. `config.json` prüfen:

```json
{
  "guildId": "...",
  "clientId": "...",
  "devId": "..."
}
```

## Start

```powershell
npm start
```

## Projekt prüfen

```powershell
npm run check
```

## API-Client generieren

```powershell
npm run gen:api
```

## Projektstruktur

- `src/index.js` – Einstiegspunkt
- `src/handlers/` – Event-Registrierung
- `src/events/` – Bot-Events
- `src/commands/` – Slash-Commands
- `src/utils/` – Hilfsfunktionen
- `src/services/` – Dateispeicher und API-Zugriff

