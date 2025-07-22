const {PermissionFlagsBits} = require("discord.js");
module.exports = {
    name: "clear",
    description: "Nachrichten löschen",
    options: [
        {
            name: 'menge',
            description: 'Number of messages to delete',
            type: 4,
            required: false,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: (client, interaction) => {
        const amount = interaction.options.getInteger('amount') || 1;
        if (amount < 1 || amount > 100) {
            interaction.reply({ content: 'Bitte gib eine Zahl zwischen 1 und 100 an.'});
            return;
        }
        interaction.channel.bulkDelete(amount, true)
            .then(deleted => {
                interaction.reply({ content: `Es wurden ${deleted.size} Nachrichten gelöscht.`});
            })
            .catch(() => {
                interaction.reply({ content: 'Fehler beim Löschen der Nachrichten.'});
            });
    },
};