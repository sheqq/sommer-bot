const { PermissionFlagsBits } = require('discord.js');

const COLOR_PATTERN = /^#[0-9A-F]{6}$/i;
const DEFAULT_MAX_COLOR_ROLES = 100;
const MAX_COLOR_ROLES = 250;
const colorRoleCreationQueues = new Map();

class ColorRoleLimitError extends Error {
    constructor(limit) {
        super(`Die Obergrenze von ${limit} Farbrollen ist erreicht.`);
        this.name = 'ColorRoleLimitError';
    }
}

function normalizeColor(color) {
    if (typeof color !== 'string' || !COLOR_PATTERN.test(color)) {
        throw new TypeError(`Ungültige Farbrolle "${color}". Erwartet wird ein HEX-Wert wie #A1B2C3.`);
    }

    return color.toUpperCase();
}

function isColorRole(role) {
    return COLOR_PATTERN.test(role.name);
}

function getRandomColorRole(guild) {
    const colorRoles = [...guild.roles.cache.values()].filter(isColorRole);
    if (colorRoles.length === 0) return null;

    return colorRoles[Math.floor(Math.random() * colorRoles.length)];
}

function assertCanManageRole(role, action) {
    const botMember = role.guild.members.me;
    if (!botMember) {
        throw new Error(`Der Bot kann die Farbrolle "${role.name}" nicht ${action}: Bot-Mitglied nicht verfügbar.`);
    }

    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        throw new Error(
            `Der Bot kann die Farbrolle "${role.name}" nicht ${action}: ` +
            'ihm fehlt die Berechtigung „Rollen verwalten“ (Manage Roles).'
        );
    }

    const highestBotRole = botMember.roles.highest;
    if (!highestBotRole || highestBotRole.comparePositionTo(role) <= 0) {
        throw new Error(
            `Der Bot kann die Farbrolle "${role.name}" nicht ${action}: ` +
            'die höchste Bot-Rolle muss in der Server-Rollenliste oberhalb dieser Farbrolle stehen.'
        );
    }
}

async function deleteColorRole(role, reason) {
    assertCanManageRole(role, 'löschen');

    try {
        return await role.delete(reason);
    } catch (error) {
        throw new Error(
            `Farbrolle "${role.name}" konnte nicht gelöscht werden. ` +
            'Prüfe die Berechtigung „Rollen verwalten“, die Rollen-Hierarchie und ob die Rolle verwaltet ist. ' +
            `Discord-Fehler: ${error?.message || error}`,
            { cause: error }
        );
    }
}

async function removeMemberRole(member, role) {
    assertCanManageRole(role, 'entfernen');

    try {
        await member.roles.remove(role);
    } catch (error) {
        throw new Error(
            `Farbrolle "${role.name}" konnte Member ${member.id} nicht entfernt werden. ` +
            'Prüfe die Berechtigung „Rollen verwalten“ und die Rollen-Hierarchie. ' +
            `Discord-Fehler: ${error?.message || error}`,
            { cause: error }
        );
    }
}

async function createColorRole(
    guild,
    color,
    maxColorRoles = DEFAULT_MAX_COLOR_ROLES
) {
    const normalizedColor = normalizeColor(color);
    const colorRoleLimit = normalizeMaxColorRoles(maxColorRoles);
    const colorRoleCount = guild.roles.cache.filter(isColorRole).size;
    if (colorRoleCount >= colorRoleLimit) {
        throw new ColorRoleLimitError(colorRoleLimit);
    }

    const highestBotRole = guild.members.me?.roles.highest;

    if (!highestBotRole) {
        throw new Error('Der Bot hat noch keine Rollenposition oder ist nicht vollständig im Cache verfügbar.');
    }

    return guild.roles.create({
        name: normalizedColor,
        colors: { primaryColor: normalizedColor },
        position: highestBotRole.position,
        reason: 'Neue Farbrolle für neues Mitglied',
    });
}

function createRandomColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0').toUpperCase();
}

function normalizeMaxColorRoles(limit = DEFAULT_MAX_COLOR_ROLES) {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_COLOR_ROLES) {
        throw new RangeError(`Die Obergrenze für Farbrollen muss zwischen 1 und ${MAX_COLOR_ROLES} liegen.`);
    }

    return limit;
}

async function withGuildRoleCreationLock(guildId, action) {
    const previous = colorRoleCreationQueues.get(guildId) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
        release = resolve;
    });
    colorRoleCreationQueues.set(guildId, current);
    await previous;

    try {
        return await action();
    } finally {
        release();
        if (colorRoleCreationQueues.get(guildId) === current) {
            colorRoleCreationQueues.delete(guildId);
        }
    }
}

async function ensureRoleForColor(guild, color, maxColorRoles) {
    const existingRole = guild.roles.cache.find(
        (role) => isColorRole(role) && normalizeColor(role.name) === color
    );
    if (existingRole) return existingRole;

    return withGuildRoleCreationLock(guild.id, async () => {
        const role = guild.roles.cache.find(
            (cachedRole) => isColorRole(cachedRole) && normalizeColor(cachedRole.name) === color
        );
        return role || createColorRole(guild, color, maxColorRoles);
    });
}

function getRemainingMembers(role, memberId) {
    return role.members.filter((member) => member.id !== memberId).size;
}

async function deleteEmptyRole(role, warnings) {
    try {
        await deleteColorRole(role, 'Keine Mitglieder mit dieser Farbrolle mehr');
    } catch (error) {
        warnings.push(error);
    }
}

async function assignColorToMember(
    member,
    color,
    maxColorRoles = DEFAULT_MAX_COLOR_ROLES
) {
    const normalizedColor = normalizeColor(color);
    const role = await ensureRoleForColor(
        member.guild,
        normalizedColor,
        normalizeMaxColorRoles(maxColorRoles)
    );
    const previousColorRoles = [...member.roles.cache.values()]
        .filter((memberRole) => isColorRole(memberRole) && memberRole.id !== role.id);
    const warnings = [];

    for (const previousRole of previousColorRoles) {
        await removeMemberRole(member, previousRole);

        if (getRemainingMembers(previousRole, member.id) === 0) {
            await deleteEmptyRole(previousRole, warnings);
        }
    }

    if (!member.roles.cache.has(role.id)) {
        assertCanManageRole(role, 'zuweisen');
        try {
            await member.roles.add(role);
        } catch (error) {
            throw new Error(
                `Farbrolle "${role.name}" konnte Member ${member.id} nicht zugewiesen werden. ` +
                'Prüfe die Berechtigung „Rollen verwalten“ und die Rollen-Hierarchie. ' +
                `Discord-Fehler: ${error?.message || error}`,
                { cause: error }
            );
        }
    }

    return { role, warnings };
}

async function unassignColorFromMember(member) {
    const colorRoles = [...member.roles.cache.values()].filter(isColorRole);
    const results = [];
    const warnings = [];

    for (const role of colorRoles) {
        await removeMemberRole(member, role);
        const remainingMembers = getRemainingMembers(role, member.id);
        results.push({ key: normalizeColor(role.name), amount: remainingMembers });

        if (remainingMembers === 0) {
            await deleteEmptyRole(role, warnings);
        }
    }

    return { results, warnings };
}

async function cleanupColorRoleAfterMemberLeave(member) {
    const colorRoles = [...member.roles.cache.values()].filter(isColorRole);
    const results = [];
    const warnings = [];

    for (const memberRole of colorRoles) {
        const role = member.guild.roles.cache.get(memberRole.id) || memberRole;
        const remainingMembers = getRemainingMembers(role, member.id);
        results.push({ key: normalizeColor(role.name), amount: remainingMembers });

        if (remainingMembers === 0) {
            await deleteEmptyRole(role, warnings);
        }
    }

    return { results, warnings };
}

async function deleteAllColorRoles(guild) {
    await guild.roles.fetch();
    const colorRoles = [...guild.roles.cache.values()].filter(isColorRole);
    const failures = [];

    for (const role of colorRoles) {
        try {
            await deleteColorRole(role, 'Farbrollen auf diesem Server deaktiviert');
        } catch (error) {
            failures.push(error);
        }
    }

    if (failures.length > 0) {
        throw new Error(
            `${failures.length} von ${colorRoles.length} Farbrollen konnten nicht gelöscht werden: ` +
            failures.map((error) => error.message).join(' | ')
        );
    }

    return colorRoles.length;
}

async function assignColorRolesToAllMembers(
    guild,
    maxColorRoles = DEFAULT_MAX_COLOR_ROLES
) {
    const members = await fetchGuildMembersWithRetry(guild);
    const failures = [];
    const warnings = [];
    let assigned = 0;
    let eligible = 0;
    let skipped = 0;
    let limitReached = false;

    for (const member of members.values()) {
        if (member.user.bot) continue;
        eligible += 1;
        if (limitReached) {
            skipped += 1;
            continue;
        }

        try {
            const result = await assignColorToMember(
                member,
                createRandomColor(),
                maxColorRoles
            );
            assigned += 1;
            warnings.push(...result.warnings.map((error) => ({
                member,
                error,
            })));
        } catch (error) {
            if (error instanceof ColorRoleLimitError) {
                limitReached = true;
                skipped += 1;
                continue;
            }
            failures.push({ member, error });
        }
    }

    return { assigned, eligible, failures, warnings, skipped, limitReached };
}

async function fetchGuildMembersWithRetry(guild) {
    try {
        return await guild.members.fetch();
    } catch (error) {
        const retryAfter = error?.data?.retry_after;
        if (
            error?.data?.opcode !== 8 ||
            typeof retryAfter !== 'number' ||
            !Number.isFinite(retryAfter) ||
            retryAfter <= 0
        ) {
            throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return guild.members.fetch();
    }
}

module.exports = {
    createRandomColor,
    getRandomColorRole,
    createColorRole,
    deleteColorRole,
    assignColorToMember,
    unassignColorFromMember,
    cleanupColorRoleAfterMemberLeave,
    deleteAllColorRoles,
    assignColorRolesToAllMembers,
};
