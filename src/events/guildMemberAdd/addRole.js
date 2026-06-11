const { assignColorToMember } = require('../../utils/colorRoles');
const { userService } = require('../../services/userService');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    try {
        const chosenColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
        await assignColorToMember(member, chosenColor);

        await userService.upsertDiscordMember(member, chosenColor);
    } catch (e) {
        console.error('Konnte Member nicht speichern/Onboarding nicht abschließen:', e?.message || e);
    }
};
