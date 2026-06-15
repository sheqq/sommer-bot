const levelService = require("../../services/jsonService.js");

const LEVEL_SYSTEM_ENABLED = true;
const XP_PER_MESSAGE = 10;

module.exports = async (_client, message) => {
    if (message.author.bot || !message.guild) return;

    if (!LEVEL_SYSTEM_ENABLED) return;

    const service = levelService();
    const fileName = 'levels.json';
    const pairs = service.getFile(fileName);

    let entry = pairs.find((pair) => pair.key === message.author.id);

    if (!entry) {
        entry = { key: message.author.id, value: { xp: 0, level: 1 } };
        pairs.push(entry);
    }

    const currentLevel = Number(entry.value?.level) || 1;
    const currentXP = Number(entry.value?.xp) || 0;
    let updatedXP = currentXP + XP_PER_MESSAGE;
    let updatedLevel = currentLevel;
    let nextLevelXp = updatedLevel * 100;

    while (updatedXP >= nextLevelXp) {
        updatedXP -= nextLevelXp;
        updatedLevel += 1;
        nextLevelXp = updatedLevel * 100;
        await message.channel.send(`${message.author.tag}, du bist jetzt Level ${updatedLevel}!`);
    }

    entry.value.xp = updatedXP;
    entry.value.level = updatedLevel;
    service.writeFile(pairs, fileName);

    console.log(`${message.author.tag}, du hast jetzt ${updatedXP} XP und bist Level ${updatedLevel}!`);
};
