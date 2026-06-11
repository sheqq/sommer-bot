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

function normalizeColorRoleEntry(entry) {
    if (!entry || typeof entry.key !== 'string') {
        return null;
    }

    return {
        key: entry.key,
        amount: Number(entry.amount) || 0,
    };
}

function loadColorRoles() {
    return service.getFile('colorRoles.json')
        .map(normalizeColorRoleEntry)
        .filter(Boolean);
}

function saveColorRoles(entries) {
    service.writeFile(
        entries.map((entry) => ({ key: entry.key, amount: Number(entry.amount) || 0 })),
        'colorRoles.json'
    );
}

function getColorRole(color) {
    return loadColorRoles().find((entry) => entry.key === color) || null;
}

function upsertColorRoleEntry(color, delta = 1) {
    const entries = loadColorRoles();
    const index = entries.findIndex((entry) => entry.key === color);

    if (index === -1) {
        entries.push({ key: color, amount: Math.max(delta, 0) });
    } else {
        entries[index].amount = Math.max((entries[index].amount || 0) + delta, 0);
    }

    saveColorRoles(entries);
    return getColorRole(color);
}

function decrementColorRoleEntry(color) {
    const entries = loadColorRoles();
    const index = entries.findIndex((entry) => entry.key === color);

    if (index === -1) {
        return null;
    }

    entries[index].amount = Math.max((entries[index].amount || 0) - 1, 0);

    const updated = entries[index];
    if (updated.amount === 0) {
        entries.splice(index, 1);
    }

    saveColorRoles(entries);
    return updated;
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
    loadColorRoles,
    saveColorRoles,
};

