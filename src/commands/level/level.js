const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const levelService = require('../../services/jsonService.js');

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
        const service = levelService();
        const pairs = service.getFile('levels.json');
        const entry = pairs.find((pair) => pair.key === targetUser.id);

        if (!entry) {
            return interaction.reply({
                content: `Für **${targetUser.tag}** wurden noch keine Level-Daten gefunden.`,
                ephemeral: true,
            });
        }

        const level = entry.value?.level ?? 1;
        const xp = entry.value?.xp ?? 0;
        const nextLevelXp = level * 100;
        const progressText = `${xp}/${nextLevelXp} XP`;

        return interaction.reply({
            content: `**${targetUser.tag}** ist aktuell **Level ${level}** mit **${progressText}**.`,
            ephemeral: true,
        });
    },
};

