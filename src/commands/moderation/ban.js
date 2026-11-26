const { ApplicationCommandOptionType, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { unassignColorFromMember } = require('../../services/roleService');
const levelService = require('../../services/levelService');

module.exports = {
    name: 'nutzer-bannen',
    description: 'Einen Nutzer bannen',
    options: [
        {
            name: 'nutzer',
            description: 'Wer',
            required: true,
            type: ApplicationCommandOptionType.User,
        },
        {
            name: 'grund',
            description: 'Warum',
            required: false,
            type: ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: async (client, interaction) => {
        const user = interaction.options.getUser('nutzer') || null;
        const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                content: 'Du hast keine Berechtigung zum Bannen.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: 'Nutzer nicht gefunden.', flags: MessageFlags.Ephemeral });
        }

        const { warnings } = await unassignColorFromMember(member);
        for (const warning of warnings) {
            console.error(`Farbrolle für ${user.tag}:`, warning.message);
        }
        await levelService.removeUser(user.id, interaction.guildId);
        await member.ban({ reason });
        await interaction.reply({ content: `Nutzer **${user.tag}** wurde gebannt. Grund: ${reason}` });
    },
};