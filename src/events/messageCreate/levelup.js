const levelService = require('../../services/levelService');
const guildService = require('../../services/guildService');
const { assignLevelRoles } = require('../../services/levelRoleService');
const { getLevelFromXp, getXp } = require('../../utils/levels');

const LEVEL_SYSTEM_ENABLED = true;
const XP_PER_MESSAGE = 10;

module.exports = async (_client, message) => {
    if (message.author.bot || !message.guild) return;

    // Ignoriere System-Nachrichten (z.B. Willkommensnachrichten)
    if (message.system) return;

    if (!LEVEL_SYSTEM_ENABLED) return;

    const userId = message.author.id;
    let updatedXP;
    let oldLevel;
    let updatedLevel;

    try {
        const entry = await levelService.getUserEntry(userId, message.guild.id);
        const currentXP = entry ? getXp(entry.xp) : 0;
        updatedXP = currentXP + XP_PER_MESSAGE;
        oldLevel = getLevelFromXp(currentXP);
        updatedLevel = getLevelFromXp(updatedXP);
        await levelService.setUserXp(userId, updatedXP, message.guild.id);
    } catch (error) {
        console.error(`Level-Daten für ${userId} konnten nicht verarbeitet werden:`, error.message);
        return;
    }

    if (updatedLevel > oldLevel) {
        try {
            const settings = await guildService.getGuild(message.guild.id);
            await assignLevelRoles(
                message.member,
                updatedLevel,
                settings?.levelRoles ?? [],
            );
        } catch (error) {
            console.error(`Levelrollen für Server ${message.guild.id} konnten nicht geladen werden:`, error?.message || error);
        }
        await message.channel.send(`${message.author.tag}, du bist jetzt Level ${updatedLevel}!`);
    }

    console.log(`${message.author.tag}, du hast jetzt ${updatedXP} XP und bist Level ${updatedLevel}!`);
};
