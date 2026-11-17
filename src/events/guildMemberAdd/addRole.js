const { assignColorToMember } = require('../../services/roleService');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    const chosenColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');

    try {
        const { warnings } = await assignColorToMember(member, chosenColor);
        for (const warning of warnings) {
            console.error(`Farbrolle für ${member.user.tag}:`, warning.message);
        }
    } catch (e) {
        console.error('Konnte Farbrolle nicht zuweisen:', e?.message || e);
    }

};
