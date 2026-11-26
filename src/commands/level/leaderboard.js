const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const levelService = require('../../services/levelService');
const { getLevelFromXp, getXp } = require('../../utils/levels');

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
            .filter(level => getXp(level.xp) > 0)
            .sort((a, b) => {
                const levelDiff = getLevelFromXp(b.xp) - getLevelFromXp(a.xp);
                if (levelDiff !== 0) return levelDiff;
                return getXp(b.xp) - getXp(a.xp);
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
            const level = getLevelFromXp(userLevel.xp);
            const xp = getXp(userLevel.xp);

            // Versuche, den Benutzernamen zu erhalten
            let userName = `<@${userId}>`;
            try {
                const user = await client.users.fetch(userId);
                userName = user.username;
            } catch {
                userName = `Nutzer ${userId}`;
            }

            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`${i + 1}.\``;
            leaderboardText += `${medal} **${userName}** - Level **${level}** (${xp} XP)\n`;
        }

        return interaction.editReply({
            content: leaderboardText,
        });
    },
};
