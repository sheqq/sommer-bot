const spamProtectionService = require('../../services/spamProtectionService');

module.exports = async (_client, oldMember, newMember) => {
    try {
        await spamProtectionService.cleanupAfterRoleRemoval(oldMember, newMember);
    } catch (error) {
        console.error(`Leere Mute-Rolle auf Server ${newMember.guild.id} konnte nicht bereinigt werden:`, error?.message || error);
    }
};
