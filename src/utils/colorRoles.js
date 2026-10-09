const roleService = require('../services/jsonService.js');
const service = roleService();

async function createColorRole(guild, color) {
    const highestBotRole = guild.members.me?.roles.highest;

    if (!highestBotRole) {
        throw new Error('Der Bot hat noch keine Rollenposition oder ist nicht vollständig im Cache verfügbar.');
    }

    return await guild.roles.create({
        name: color,
        color: color,
        position: highestBotRole.position,
        reason: 'Neue Farbrolle für neues Mitglied',
    });
}

function createRandomColor() {
    return '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}

function getColorRole(color) {
    const entry = service.getEntry('colorRoles.json', color);
    if (!entry) return null;
    return {
        key: entry.key,
        amount: getAmount(entry.value),
    };
}

function getAmount(value) {
    return Number(typeof value === 'object' ? value?.amount : value) || 0;
}

function upsertColorRoleEntry(color, delta = 1) {
    const existing = service.getEntry('colorRoles.json', color);
    const currentAmount = existing ? getAmount(existing.value) : 0;
    const newAmount = Math.max(currentAmount + delta, 0);

    if (newAmount === 0) {
        service.removeEntry('colorRoles.json', color);
    } else {
        service.addEntry('colorRoles.json', color, String(newAmount));
    }
    return getColorRole(color);
}

function decrementColorRoleEntry(color) {
    const existing = service.getEntry('colorRoles.json', color);
    if (!existing) return null;

    const currentAmount = getAmount(existing.value);
    const newAmount = Math.max(currentAmount - 1, 0);

    if (newAmount === 0) {
        const removed = service.removeEntry('colorRoles.json', color);
        return removed ? { key: removed.key, amount: 0, removed: true } : null;
    }

    service.addEntry('colorRoles.json', color, String(newAmount));
    return { key: color, amount: newAmount, removed: false };
}

function loadColorRoles() {
    return service.getFile('colorRoles.json')
        .map((entry) => ({
            key: entry.key,
            amount: getAmount(entry.value),
        }));
}

async function ensureRoleForColor(guild, color) {
    const existingRole = guild.roles.cache.find((role) => role.name === color) || null;

    if (existingRole) {
        return existingRole;
    }

    return createColorRole(guild, color);
}

async function assignColorToMember(member, color) {
    const role = await ensureRoleForColor(member.guild, color);

    if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
    }

    const amount = role.members.size;
    if (amount === 0) {
        service.removeEntry('colorRoles.json', color);
    } else {
        service.addEntry('colorRoles.json', color, String(amount));
    }

    return role;
}

async function unassignColorFromMember(member) {
    const pair = [...member.roles.cache.values()]
        .find(role => /^#[0-9A-F]{6}$/i.test(role.name));

    if (!pair) return null;

    const color = pair.name;
    const role = member.guild.roles.cache.find((r) => r.name === color) || null;

    if (role) {
        try {
            await member.roles.remove(role);
        } catch {
            return null;
        }
    }

    const updated = decrementColorRoleEntry(color);

    if (!updated || updated.amount === 0) {
        if (role) {
            await role.delete().catch(() => null);
        }

        return {
            key: color,
            amount: 0,
            removed: true,
        };
    }

    return {
        key: color,
        amount: updated.amount,
        removed: false,
    };
}

async function cleanupColorRoleAfterMemberLeave(member) {
    const colorRole = [...member.roles.cache.values()]
        .find((role) => /^#[0-9A-F]{6}$/i.test(role.name));

    if (!colorRole) return null;

    const color = colorRole.name;
    const role = member.guild.roles.cache.find((guildRole) => guildRole.id === colorRole.id) || null;
    const remainingMembers = role
        ? role.members.filter((roleMember) => roleMember.id !== member.id).size
        : 0;

    if (remainingMembers === 0) {
        service.removeEntry('colorRoles.json', color);

        if (role) {
            await role.delete('Keine Mitglieder mit dieser Farbrolle mehr').catch(() => null);
        }

        return { key: color, amount: 0, removed: true };
    }

    service.addEntry('colorRoles.json', color, String(remainingMembers));
    return { key: color, amount: remainingMembers, removed: false };
}

module.exports = {
    createRandomColor,
    createColorRole,
    getColorRole,
    assignColorToMember,
    unassignColorFromMember,
    cleanupColorRoleAfterMemberLeave,
};
