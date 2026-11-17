const { cleanupColorRoleAfterMemberLeave } = require('../../services/roleService');
const levelService = require('../../services/levelService');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    try {
        const { warnings } = await cleanupColorRoleAfterMemberLeave(member);
        for (const warning of warnings) {
            console.error(`Farbrolle für ${member.user.tag}:`, warning.message);
        }

        // Level des Users entfernen
        const removed = levelService.removeUser(member.user.id);
        if (removed) {
            console.log(`Level-Daten entfernt für Member ${member.user.tag}`);
        }
    } catch (error) {
        console.error('Fehler beim Entfernen der Daten für Member:', error?.message || error);
    }

};
