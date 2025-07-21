const {ApplicationCommandOptionType, PermissionFlagsBits} = require("discord.js");

module.exports = {
    name: 'ban',
    description: "Nutzer bannen",
    options: [
        {
            name: "target",
            required: true,
            type:ApplicationCommandOptionType.Mentionable,
        },
        {
            name: "reason",
            required: false,
            type:ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: (client, interaction) => {
        interaction.reply(`keiner wurde gebannt`);
    },
};