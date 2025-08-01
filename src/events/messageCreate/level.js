const {Client, Message} = require("discord.js");
const levelService = require("../../services/levelService.js");

/**
 *
 * @param {Client} client
 * @param {Message} message
 */
module.exports = async (client, message) => {
    if (message.author.bot || !message.guild) return; // Ignoriere Bot-Nachrichten und Nachrichten außerhalb von Servern

    //levelService.getFile()
    const service = levelService(client,null);
    let pairs = service.getFile();

    //
    const index = pairs.findIndex(p => p.key === message.author.id);
    if (index === -1) {
        pairs.push({key: message.author.id, value: {xp: 10, level: 1}});
        newXP = pairs[pairs.length - 1].value.xp;
        newLevel = pairs[pairs.length - 1].value.level;
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
    service.writeFile(pairs);

    await console.log(`${message.author.tag}, du hast jetzt ${newXP} XP und bist level: ${newLevel}!`);
}