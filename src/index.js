const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const token = process.env.TOKEN?.trim();

if (!token) {
    console.error('Fehler: `TOKEN` fehlt in der `.env`. Bitte einen gültigen Discord Bot Token eintragen.');
    process.exit(1);
}

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildPresences,
    ],
});

eventHandler(client);


client.login(token).catch(error => {
    if (error?.code === 'TokenInvalid') {
        console.error('Fehler: Der Discord Token ist ungültig. Bitte einen neuen Bot Token im Discord Developer Portal erstellen und in der `.env` hinterlegen.');
    } else {
        console.error('Fehler beim Start des Bots:', error);
    }

    process.exit(1);
});
