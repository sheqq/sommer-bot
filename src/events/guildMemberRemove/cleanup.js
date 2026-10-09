const { cleanupColorRoleAfterMemberLeave } = require('../../utils/colorRoles');
const jsonService = require('../../services/jsonService.js');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    try {
        const service = jsonService();

        // Farbrolle des Users entfernen
        await cleanupColorRoleAfterMemberLeave(member);

        // Level des Users entfernen
        const removed = service.removeEntry('levels.json', member.user.id);
        if (removed) {
            console.log(`Level-Daten entfernt für Member ${member.user.tag}`);
        }
    } catch (error) {
        console.error('Fehler beim Entfernen der Daten für Member:', error?.message || error);
    }

};
