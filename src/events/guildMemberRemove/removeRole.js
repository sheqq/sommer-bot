const { unassignColorFromMember } = require('../../utils/colorRoles');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    try {
        await unassignColorFromMember(member);
    } catch (error) {
        console.error('Fehler beim Entfernen der Farbrolle für Member:', error?.message || error);
    }

};
