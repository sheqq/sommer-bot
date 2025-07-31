const {Client, Message} = require("discord.js");
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'levels.json');

/**
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = (client, message) => {
    let pairs = [];
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
    }
    const index = pairs.findIndex(p => p.key === color);
    if (index === -1) {
        pairs.push({key: message.author, value: {xp: 0, level: 1}});
    } else {
        pairs[index].value.xp += 10; // XP erhöhen
        const nextLevelXp = pairs[index].value.level * 100;

        if (pairs[index].value.xp >= nextLevelXp) {
            pairs[index].value.level += 1;
            pairs[index].value.xp = 0;
            message.channel.send(`${message.author.tag}, du bist jetzt Level ${pairs[index].value.level}!`);
        }
    }
    fs.writeFileSync(filePath, JSON.stringify(pairs, null, 2), 'utf8');

    console.log(`${message.author.tag}, du hast jetzt ${pairs[index].value.xp} XP und bist level: ${pairs[index].value.level}!`);
}