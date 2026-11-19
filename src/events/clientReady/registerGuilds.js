const guildService = require('../../services/guildService');

module.exports = async (client) => {
    for (const guild of client.guilds.cache.values()) {
        try {
            await guildService.registerGuild(guild.id);
        } catch (error) {
            console.error(`Server ${guild.id} konnte nicht in der API gespeichert werden:`, error?.message || error);
        }
    }

    console.log('Vorhandene Server wurden mit der API synchronisiert.');
};
