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
        amount: Number(entry.value?.amount) || 0,
    };
}

function upsertColorRoleEntry(color, delta = 1) {
    const existing = service.getEntry('colorRoles.json', color);
    const currentAmount = existing ? Number(existing.value?.amount) || 0 : 0;
    const newAmount = Math.max(currentAmount + delta, 0);

    service.addEntry('colorRoles.json', color, { amount: newAmount });
    return getColorRole(color);
}

function decrementColorRoleEntry(color) {
    const existing = service.getEntry('colorRoles.json', color);
    if (!existing) return null;

    const currentAmount = Number(existing.value?.amount) || 0;
    const newAmount = Math.max(currentAmount - 1, 0);

    if (newAmount === 0) {
        const removed = service.removeEntry('colorRoles.json', color);
        return removed ? { key: removed.key, amount: 0, removed: true } : null;
    }

    service.addEntry('colorRoles.json', color, { amount: newAmount });
    return { key: color, amount: newAmount, removed: false };
}

function loadColorRoles() {
    return service.getFile('colorRoles.json')
        .map((entry) => ({
            key: entry.key,
            amount: Number(entry.value?.amount) || 0,
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

    await member.roles.add(role);
    upsertColorRoleEntry(color, 1);
    return role;
}

async function unassignColorFromMember(member) {
    const memberRoleNames = new Set(member.roles.cache.map((role) => role.name));
    const pair = loadColorRoles().find((entry) => memberRoleNames.has(entry.key));

    if (!pair) return null;

    const color = pair.key;
    const role = member.guild.roles.cache.find((r) => r.name === color) || null;

    if (role) {
        await member.roles.remove(role).catch(() => null);
    }

    const updated = decrementColorRoleEntry(color);
    if (!updated || updated.amount === 0) {
        if (role) {
            await role.delete().catch(() => null);
        }
        return { key: color, amount: 0, removed: true };
    }

    return { key: color, amount: updated.amount, removed: false };
}

module.exports = {
    createRandomColor,
    createColorRole,
    getColorRole,
    assignColorToMember,
    unassignColorFromMember,
};

