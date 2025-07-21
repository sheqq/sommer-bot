const {PermissionFlagsBits} = require("discord.js");
module.exports = {
    name: "clear",
    description: "Nachrichten löschen",
    options: [
        {
            name: 'amount',
            description: 'Number of messages to delete',
            type: 4,
            required: false,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
};