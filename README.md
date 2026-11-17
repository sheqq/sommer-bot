# sommer-bot

Discord-Bot für den Sommer-Server.

## Voraussetzungen

- Node.js 22 oder neuer
- Java 11 oder neuer (OpenAPI Generator)
- Eine Discord-Bot-App mit Token

## Einrichtung

1. Abhängigkeiten installieren:

```powershell
npm install
```

2. `.env.example` nach `.env` kopieren und Discord- sowie API-Zugangsdaten eintragen:

```env
BOT_TOKEN=dein_discord_bot_token
API_URL=https://sommer.vercel.app
API_TOKEN=dein_api_token
```

3. `config.json` prüfen:

```json
{
  "guildId": "...",
  "devId": "..."
}
```

`guildId` wird für die Slash-Command-Registrierung und den Farbrollen-Abgleich benötigt.
`devId` beschränkt Entwickler-Commands. Eine `clientId` wird vom Bot nicht verwendet.

## API-Dokumentation

`npm run build` erzeugt aus `src/api/sommer-facade.yaml` die HTML-Dokumentation unter `docs/api.html`.
OpenAPI Generator erzeugt daraus außerdem Client und Models unter `src/api/generated`.
Der Level-Service verwendet den generierten Client über `API_URL` und `API_TOKEN`.

## Start

```powershell
npm start
```

## Projekt prüfen

```powershell
npm run check
```

## Projektstruktur

- `src/index.js` – Einstiegspunkt
- `src/handlers/` – Event-Registrierung
- `src/events/` – Bot-Events
- `src/commands/` – Slash-Commands
- `src/utils/` – Hilfsfunktionen
- `src/services/` – Anwendungsservices

