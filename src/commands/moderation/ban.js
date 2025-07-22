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
            type:ApplicationCommandOptionType.Mentionable,
        },
        {
            name: "grund",
            description: "Warum",
            required: false,
            type:ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
};