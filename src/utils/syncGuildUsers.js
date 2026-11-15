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

    const users = [...members.values()]
        .filter(member => !member.user.bot)
        .map(member => ({
                id: member.id,
                username: member.user.username,
            }));
    let failures;

    try {
        failures = await userService.upsertUsers(users);
    } catch (error) {
        console.error(`Konnte Nutzerliste für ${guild.name} nicht abrufen:`, error?.message || error);
        return;
    }

    for (const { user, error } of failures) {
        console.error(`Konnte Discord-User ${user.id} nicht synchronisieren:`, error?.message || error);
    }
};
