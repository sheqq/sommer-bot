const levelService = require("../../services/jsonService.js");
const { getLevelFromXp, getXp } = require('../../utils/levels');

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

    const currentXP = entry ? getXp(entry.value) : 0;
    const updatedXP = currentXP + XP_PER_MESSAGE;
    const oldLevel = getLevelFromXp(currentXP);
    const updatedLevel = getLevelFromXp(updatedXP);

    if (updatedLevel > oldLevel) {
        await message.channel.send(`${message.author.tag}, du bist jetzt Level ${updatedLevel}!`);
    }

    service.addEntry(fileName, userId, String(updatedXP));

    console.log(`${message.author.tag}, du hast jetzt ${updatedXP} XP und bist Level ${updatedLevel}!`);
};
