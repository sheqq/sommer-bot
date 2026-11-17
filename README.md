# sommer-bot

Discord-Bot für den Sommer-Server.

## Voraussetzungen

- Node.js 22 oder neuer
- Eine Discord-Bot-App mit Token

## Einrichtung

1. Abhängigkeiten installieren:

```powershell
npm install
```

2. `.env.example` nach `.env` kopieren und den Discord-Token eintragen:

```env
TOKEN=dein_discord_bot_token
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
- `src/services/` – Dateispeicher

