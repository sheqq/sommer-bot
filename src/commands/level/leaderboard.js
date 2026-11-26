const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const levelService = require('../../services/levelService');
const { getLevelProgress } = require('../../utils/levels');

module.exports = {
    name: 'rangliste',
    description: 'Zeigt die Top 10 Level-Spieler an',
    options: [
        {
            name: 'platz',
            description: 'Anzahl der Spieler zum Anzeigen (max. 50)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 50,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ViewChannel],

    callback: async (client, interaction) => {
        await interaction.deferReply();
        
        const limit = interaction.options.getInteger('platz') || 10;
        const levels = await levelService.getAllUserEntries(interaction.guildId);

        if (!levels || levels.length === 0) {
            return interaction.editReply({
                content: 'Es wurden noch keine Level-Daten gefunden.',
            });
        }

        const sorted = levels
            .filter((entry) => {
                const progress = getLevelProgress(entry);
                return progress.level > 1 || progress.xp > 0;
            })
            .sort((a, b) => {
                const levelDiff = getLevelProgress(b).level - getLevelProgress(a).level;
                if (levelDiff !== 0) return levelDiff;
                return getLevelProgress(b).xp - getLevelProgress(a).xp;
            })
            .slice(0, limit);

        if (sorted.length === 0) {
            return interaction.editReply({
                content: 'Es wurden noch keine Level-Daten gefunden.',
            });
        }

        // Erstelle eine Leaderboard-Liste
        let leaderboardText = `**📊 Level-Leaderboard (Top ${sorted.length})**\n\n`;
        
        for (let i = 0; i < sorted.length; i++) {
            const userLevel = sorted[i];
            const userId = userLevel.userId;
            const { level, xp } = getLevelProgress(userLevel);

            const member = interaction.guild.members.cache.get(userId);
            const userName = member?.displayName || `<@${userId}>`;

            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`${i + 1}.\``;
            leaderboardText += `${medal} **${userName}** - Level **${level}** (${xp} XP)\n`;
        }

        return interaction.editReply({
            content: leaderboardText,
        });
    },
};
