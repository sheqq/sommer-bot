const {Client, Message} = require("discord.js");

const xpMap = new Map();

/**
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = (client, message) => {
    console.log("Event ausgelöst, message:", message);
    if (message.author?.bot) {
        console.log("nachricht von einem Bot ignoriert");
        return;
    }
    const userId = message.author?.id;
    const xp = xpMap.get(userId) || { xp: 0, level: 1 };

    xp.xp += 10; // XP pro Nachricht
    const nextLevelXp = xp.level * 100;

    if (xp.xp >= nextLevelXp) {
        xp.level += 1;
        xp.xp = 0;
        message.channel.send(`${message.author?.tag}, du bist jetzt Level ${xp.level}!`);
    }

    xpMap.set(userId, xp);

    console.log(`${userId}, du hast jetzt ${xp.xp} XP!`);
}