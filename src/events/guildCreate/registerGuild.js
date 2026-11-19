const guildService = require('../../services/guildService');

module.exports = async (_client, guild) => {
    try {
        await guildService.registerGuild(guild.id);
        console.log(`Server ${guild.id} wurde in der API gespeichert.`);
    } catch (error) {
        console.error(`Server ${guild.id} konnte nicht in der API gespeichert werden:`, error?.message || error);
    }
};
