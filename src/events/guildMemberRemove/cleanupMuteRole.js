const spamProtectionService = require('../../services/spamProtectionService');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    try {
        await spamProtectionService.cleanupAfterMemberLeave(member);
    } catch (error) {
        console.error(`Mute-Rolle für ${member.user.tag} konnte nicht bereinigt werden:`, error?.message || error);
    }
};
