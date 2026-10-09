const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const levelService = require('../../services/jsonService.js');
const { getLevelFromXp, getXp } = require('../../utils/levels');

module.exports = {
    name: 'leaderboard',
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
        const service = levelService();
        const pairs = service.getFile('levels.json');

        if (!pairs || pairs.length === 0) {
            return interaction.editReply({
                content: 'Es wurden noch keine Level-Daten gefunden.',
            });
        }

        const sorted = pairs
            .filter(pair => getXp(pair.value) > 0)
            .sort((a, b) => {
                const levelDiff = getLevelFromXp(b.value) - getLevelFromXp(a.value);
                if (levelDiff !== 0) return levelDiff;
                return getXp(b.value) - getXp(a.value);
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
            const pair = sorted[i];
            const userId = pair.key;
            const level = getLevelFromXp(pair.value);
            const xp = getXp(pair.value);

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
