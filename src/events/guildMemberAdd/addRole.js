const { assignColorToMember } = require('../../utils/colorRoles');
const { userService } = require('../../services/userService');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    const chosenColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');

    try {
        await assignColorToMember(member, chosenColor);
    } catch (e) {
        console.error('Konnte Farbrolle nicht zuweisen:', e?.message || e);
    }

    try {
        await userService.upsertUser({
            id: member.id,
            username: member.user.username,
        });
    } catch (e) {
        console.error('Konnte Member nicht mit der API synchronisieren:', e?.message || e);
    }
};
