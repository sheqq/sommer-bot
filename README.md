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

## Server-Funktionen

- Mitglieder starten auf Level 1 mit 0 XP. Der nächste Levelaufstieg benötigt
  `aktuelles Level * 100` XP; dabei wird der Fortschritt auf 0 zurückgesetzt.
  Es gibt 10 XP höchstens einmal pro Minute. `/levelstand` zeigt den Fortschritt,
  `/rangliste` die Server-Topliste.
- `/levelrolle hinzufuegen rolle level` verknüpft eine Rolle mit dem Level, ab
  dem sie vergeben wird. `entfernen` und `anzeigen` verwalten die Zuordnungen.
- `/selbstrollen-nachricht` erstellt eine Nachricht mit bis zu 20 auswählbaren
  Rollen; jede Auswahl schaltet die jeweilige Rolle um.
- `/willkommen setzen kanal nachricht bild` konfiguriert Begrüßungen neuer
  Mitglieder; `bild` ist eine optionale HTTPS-Bild-URL.
  Platzhalter: `{user}`, `{username}`, `{server}`, `{memberCount}`.
- `/verwaltung-rechte` verwaltet Rollen, die diese Einstellungen ändern dürfen.
  Administratoren haben immer Zugriff.

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

