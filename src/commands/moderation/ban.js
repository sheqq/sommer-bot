const {ApplicationCommandOptionType, PermissionFlagsBits} = require("discord.js");

module.exports = {
    name: 'ban',
    description: "einen Nutzer bannen",
    devOnly: true,
    options: [
        {
            name: "nutzer",
            description: "Wer",
            required: true,
            type: 9,
        },
        {
            name: "grund",
            description: "Warum",
            required: false,
            type: 3,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
};