const {ApplicationCommandOptionType, PermissionFlagsBits} = require("discord.js");

module.exports = {
    name: 'ban',
    description: "Nutzer bannen",
    devOnly: true,
    options: [
        {
            name: "target",
            description: "Nutzer",
            required: true,
            type:ApplicationCommandOptionType.Mentionable,
        },
        {
            name: "reason",
            description: "Grund",
            required: false,
            type:ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
};