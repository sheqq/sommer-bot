const spamProtectionService = require('../../services/spamProtectionService');

module.exports = async (_client, channel) => {
    if (!channel.guild) return;

    try {
        await spamProtectionService.applyToNewChannel(channel);
    } catch (error) {
        console.error(`Mute-Berechtigungen konnten für Kanal ${channel.id} nicht eingerichtet werden:`, error?.message || error);
    }
};
