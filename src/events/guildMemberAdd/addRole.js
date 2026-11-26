const {
    assignColorToMember,
    createRandomColor,
    getRandomColorRole,
} = require('../../services/roleService');
const guildService = require('../../services/guildService');

module.exports = async (_client, member) => {
    if (member.user.bot) return;

    let settings;
    try {
        settings = await guildService.getGuild(member.guild.id);
    } catch (error) {
        console.error(`Farbkonfiguration für Server ${member.guild.id} konnte nicht geladen werden:`, error?.message || error);
        return;
    }

    if (!settings?.colorsEnabled) return;

    const chosenColor = getRandomColorRole(member.guild)?.name || createRandomColor();
    try {
        const { warnings } = await assignColorToMember(
            member,
            chosenColor,
            settings.maxColorRoles ?? 100,
        );
        for (const warning of warnings) {
            console.error(`Farbrolle für ${member.user.tag}:`, warning.message);
        }
    } catch (error) {
        console.error('Konnte Farbrolle nicht zuweisen:', error?.message || error);
    }
};
