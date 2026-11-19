const { assignColorToMember } = require('../../services/roleService');
const guildService = require('../../services/guildService');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    let colorsEnabled;
    try {
        colorsEnabled = await guildService.areColorsEnabled(member.guild.id);
    } catch (error) {
        console.error(`Farbkonfiguration für Server ${member.guild.id} konnte nicht geladen werden:`, error?.message || error);
        return;
    }

    if (!colorsEnabled) return;

    const chosenColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
    try {
        const { warnings } = await assignColorToMember(member, chosenColor);
        for (const warning of warnings) {
            console.error(`Farbrolle für ${member.user.tag}:`, warning.message);
        }
    } catch (error) {
        console.error('Konnte Farbrolle nicht zuweisen:', error?.message || error);
    }
};
