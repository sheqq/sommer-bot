const { userService } = require('../services/userService');

module.exports = async (guild, cachedMembers = null) => {
    let members = cachedMembers;

    if (!members) {
        try {
            members = await guild.members.fetch();
        } catch (error) {
            console.error(`Konnte Mitglieder von ${guild.name} nicht laden:`, error?.message || error);
            return;
        }
    }

    for (const member of members.values()) {
        if (member.user.bot) continue;

        try {
            await userService.upsertUser({
                id: member.id,
                username: member.user.username,
            });
        } catch (error) {
            console.error(`Konnte Discord-User ${member.id} nicht synchronisieren:`, error?.message || error);
        }
    }
};
