const { unassignColorFromMember } = require('../../utils/colorRoles');
const jsonService = require('../../services/jsonService.js');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    try {
        const service = jsonService();

        // Farbrolle des Users entfernen
        await unassignColorFromMember(member);

        // Level des Users entfernen
        const levels = service.getFile('levels.json');
        const index = levels.findIndex((entry) => entry.key === member.user.id);

        if (index !== -1) {
            const removed = levels.splice(index, 1);
            if (removed.length > 0) {
                service.writeFile(levels, 'levels.json');
                console.log(`Level-Daten entfernt für Member ${member.user.tag}`);
            }
        }
    } catch (error) {
        console.error('Fehler beim Entfernen der Daten für Member:', error?.message || error);
    }

};
