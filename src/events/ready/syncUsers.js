const syncGuildUsers = require('../../utils/syncGuildUsers');

module.exports = async (client) => {
    for (const guild of client.guilds.cache.values()) {
        await syncGuildUsers(guild, guild.members.cache);
    }
};
