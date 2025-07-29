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
            type: ApplicationCommandOptionType.User,
        },
        {
            name: "grund",
            description: "Warum",
            required: false,
            type: ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: async (client, interaction) => {
            const user = interaction.options.getUser('nutzer') || null;
            const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return await interaction.reply({ content: 'Du hast keine Berechtigung zum Bannen.', ephemeral: true });
            }

            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) {
                return await interaction.reply({ content: 'Nutzer nicht gefunden.', ephemeral: true });
            }

            await member.ban({ reason });
            await interaction.reply({ content: `Nutzer **${user.tag}** wurde gebannt. Grund: ${reason}` });
    },
};