const levelService = require('../../services/levelService');
const spamProtectionService = require('../../services/spamProtectionService');
const { assignLevelRoles } = require('../../services/levelRoleService');
const { getLevelProgress } = require('../../utils/levels');

const LEVEL_SYSTEM_ENABLED = true;
const MIN_XP_PER_MESSAGE = 5;
const MAX_XP_PER_MESSAGE = 15;
const processingMessages = new Map();

async function awardXp(message) {
    if (message.author.bot || !message.guild || message.system) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    let updatedXP;
    let oldLevel;
    let updatedLevel;
    let settings;

    try {
        settings = await spamProtectionService.getSettings(guildId);
        if (await spamProtectionService.checkMessage(message, settings?.spamProtection ?? null)) {
            return;
        }

        const entry = await levelService.getUserEntry(userId, guildId);
        const progress = getLevelProgress(entry);
        oldLevel = progress.level;
        updatedLevel = oldLevel;
        const gainedXp = Math.floor(
            Math.random() * (MAX_XP_PER_MESSAGE - MIN_XP_PER_MESSAGE + 1),
        ) + MIN_XP_PER_MESSAGE;
        updatedXP = progress.xp + gainedXp;
        if (updatedXP >= progress.nextLevelXp) {
            updatedLevel += 1;
            updatedXP = 0;
        }
        await levelService.setUserXp(userId, updatedXP, guildId, updatedLevel);
    } catch (error) {
        console.error(`Level-Daten für ${userId} konnten nicht verarbeitet werden:`, error?.message || error);
        return;
    }

    if (updatedLevel > oldLevel) {
        try {
            await assignLevelRoles(
                message.member,
                updatedLevel,
                settings?.levelRoles ?? [],
            );
        } catch (error) {
            console.error(`Levelrollen für Server ${guildId} konnten nicht geladen werden:`, error?.message || error);
        }
        await message.channel.send(`${message.author.tag}, du bist jetzt Level ${updatedLevel}!`);
    }
}

module.exports = async (_client, message) => {
    if (!LEVEL_SYSTEM_ENABLED || message.author.bot || !message.guild || message.system) return;

    const key = `${message.guild.id}:${message.author.id}`;
    const previous = processingMessages.get(key) || Promise.resolve();
    const current = previous.then(() => awardXp(message));
    const settled = current.catch((error) => {
        console.error(`Level-Daten für ${message.author.id} konnten nicht verarbeitet werden:`, error?.message || error);
    });
    processingMessages.set(key, settled);

    try {
        await settled;
    } finally {
        if (processingMessages.get(key) === settled) {
            processingMessages.delete(key);
        }
    }
};

module.exports.MIN_XP_PER_MESSAGE = MIN_XP_PER_MESSAGE;
module.exports.MAX_XP_PER_MESSAGE = MAX_XP_PER_MESSAGE;
