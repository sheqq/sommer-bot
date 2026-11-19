const { ApplicationCommandOptionType, MessageFlags, PermissionFlagsBits } = require('discord.js');
const levelService = require('../../services/levelService');
const { getXpProgress } = require('../../utils/levels');

module.exports = {
    name: 'level',
    description: 'Zeigt den aktuellen Level-Stand an',
    options: [
        {
            name: 'nutzer',
            description: 'Nutzer, dessen Level angezeigt werden soll',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ViewChannel],

    callback: async (_client, interaction) => {
        const targetUser = interaction.options.getUser('nutzer') || interaction.user;
        const levels = await levelService.getAllUserEntries(interaction.guildId);
        const entry = levels.find((level) => level.userId === targetUser.id);

        if (!entry) {
            return interaction.reply({
                content: `Für **${targetUser.tag}** wurden noch keine Level-Daten gefunden.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        const { level, xp, nextLevelXp } = getXpProgress(entry.xp);
        const progressText = `${xp}/${nextLevelXp} XP`;

        return interaction.reply({
            content: `**${targetUser.tag}** ist aktuell **Level ${level}** mit **${progressText}**.`,
            flags: MessageFlags.Ephemeral,
        });
    },
};
