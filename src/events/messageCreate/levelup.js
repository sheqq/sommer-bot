const levelService = require("../../services/jsonService.js");

const LEVEL_SYSTEM_ENABLED = true;
const XP_PER_MESSAGE = 10;

module.exports = async (_client, message) => {
    if (message.author.bot || !message.guild) return;

    // Ignoriere System-Nachrichten (z.B. Willkommensnachrichten)
    if (message.system) return;

    if (!LEVEL_SYSTEM_ENABLED) return;

    const service = levelService();
    const fileName = 'levels.json';
    const userId = message.author.id;

    let entry = service.getEntry(fileName, userId);

    let currentLevel = 1;
    let currentXP = 0;

    if (entry) {
        currentLevel = Number(entry.value?.level) || 1;
        currentXP = Number(entry.value?.xp) || 0;
    }

    let updatedXP = currentXP + XP_PER_MESSAGE;
    let updatedLevel = currentLevel;
    let nextLevelXp = updatedLevel * 100;

    while (updatedXP >= nextLevelXp) {
        updatedXP -= nextLevelXp;
        updatedLevel += 1;
        nextLevelXp = updatedLevel * 100;
        await message.channel.send(`${message.author.tag}, du bist jetzt Level ${updatedLevel}!`);
    }

    service.addEntry(fileName, userId, { xp: updatedXP, level: updatedLevel });

    console.log(`${message.author.tag}, du hast jetzt ${updatedXP} XP und bist Level ${updatedLevel}!`);
};
