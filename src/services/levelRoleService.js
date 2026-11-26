async function assignLevelRoles(member, level, levelRoles) {
    const earnedRoleIds = new Set(
        levelRoles
            .filter((entry) => entry.level <= level)
            .map((entry) => entry.roleId),
    );

    for (const roleId of earnedRoleIds) {
        if (member.roles.cache.has(roleId)) continue;

        const role = member.guild.roles.cache.get(roleId);
        if (!role) {
            console.error(`Levelrolle ${roleId} existiert auf Server ${member.guild.id} nicht mehr.`);
            continue;
        }

        try {
            await member.roles.add(role);
        } catch (error) {
            console.error(`Levelrolle ${roleId} konnte ${member.user.tag} nicht zugewiesen werden:`, error?.message || error);
        }
    }
}

module.exports = {
    assignLevelRoles,
};
