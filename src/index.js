require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildPresences
    ],
});

// client.on('ready', () => {
//     console.log(`Logged in as ${client.user.tag}!`);
// });
//
// client.on('messageCreate', msg => {
//     if (!msg.author.bot) {
//         msg.reply(msg.content + ".");
//     }
// });
//
// client.on('interactionCreate', (interaction) => {
//     if(!interaction.isCommand()) return;
//
//     if(interaction.commandName === 'avatar') {
//         const user = interaction.options.getUser('user') || interaction.user;
//         interaction.reply({ content: user.displayAvatarURL({ dynamic: false, size: 2048 })});
//     }
//
//     if(interaction.commandName === 'clear') {
//         const amount = interaction.options.getInteger('amount') || 1;
//         if (amount < 1 || amount > 100) {
//             interaction.reply({ content: 'Bitte gib eine Zahl zwischen 1 und 100 an.'});
//             return;
//         }
//         interaction.channel.bulkDelete(amount, true)
//             .then(deleted => {
//                 interaction.reply({ content: `Es wurden ${deleted.size} Nachrichten gelöscht.`});
//             })
//             .catch(() => {
//                 interaction.reply({ content: 'Fehler beim Löschen der Nachrichten.'});
//             });
//     }
// });

eventHandler(client);

client.login(process.env.TOKEN);