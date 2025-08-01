const {Client, Message} = require("discord.js");
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'resources', 'levels.json');

/**
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
    if (message.author.bot || !message.guild) return; // Ignoriere Bot-Nachrichten und Nachrichten außerhalb von Servern
    let pairs = [];
    let newXP;
    let newLevel;
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.trim().length > 0) {
            try {
                const parsed = JSON.parse(content);
                pairs = Array.isArray(parsed) ? parsed : [];
            } catch {
                pairs = [];
            }
        }
    } else {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
        pairs = [];
    }

    const index = pairs.findIndex(p => p.key === message.author.id);
    if (index === -1) {
        pairs.push({key: message.author.id, value: {xp: 10, level: 1}});
    } else {
        pairs[index].value.xp += 10;
        newXP = pairs[index].value.xp;
        const nextLevelXp = pairs[index].value.level * 100;

        if (pairs[index].value.xp >= nextLevelXp) {
            pairs[index].value.level += 1;
            pairs[index].value.xp = 0;
            message.channel.send(`${message.author.tag}, du bist jetzt Level ${pairs[index].value.level}!`);
        }
        newLevel = pairs[index].value.level;
    }
    await fs.writeFileSync(filePath, JSON.stringify(pairs, null, 2), 'utf8');

    await console.log(`${message.author.tag}, du hast jetzt ${newXP} XP und bist level: ${newLevel}!`);
}