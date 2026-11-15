const syncGuildUsers = require('../../utils/syncGuildUsers');

module.exports = async (_client, guild) => {
    await syncGuildUsers(guild);
};
