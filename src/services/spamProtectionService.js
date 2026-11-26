const { PermissionFlagsBits } = require('discord.js');
const guildService = require('./guildService');

const WINDOW_MS = 60_000;
const SETTINGS_CACHE_MS = 10_000;
const messageWindows = new Map();
const roleCreationLocks = new Map();
const settingsCache = new Map();

const MUTE_OVERWRITES = {
    SendMessages: false,
    SendMessagesInThreads: false,
    AddReactions: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
    Speak: false,
};

async function applyMuteOverwrites(channel, role) {
    if (!channel.permissionOverwrites?.edit) return;

    const botMember = channel.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.Administrator) &&
        !channel.permissionsFor(botMember)?.has(PermissionFlagsBits.ManageChannels)) {
        throw new Error(`Dem Bot fehlt „Kanäle verwalten“ in ${channel.name}.`);
    }

    await channel.permissionOverwrites.edit(role.id, MUTE_OVERWRITES);
}

async function createMuteRole(guild, name) {
    const botMember = guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles) ||
        !botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        throw new Error('Der Bot benötigt „Rollen verwalten“ und „Kanäle verwalten“.');
    }

    const role = await guild.roles.create({
        name,
        permissions: [],
        reason: 'Automatischer Spam-Schutz',
    });

    try {
        for (const channel of guild.channels.cache.values()) {
            await applyMuteOverwrites(channel, role);
        }
    } catch (error) {
        try {
            await role.delete('Spam-Schutz konnte nicht vollständig eingerichtet werden');
        } catch (cleanupError) {
            console.error('Nicht vollständig eingerichtete Mute-Rolle konnte nicht gelöscht werden:', cleanupError);
        }
        throw error;
    }

    return role;
}

async function withRoleCreationLock(guildId, operation) {
    const previous = roleCreationLocks.get(guildId) || Promise.resolve();
    const current = previous.then(operation);
    const settled = current.catch((error) => {
        throw error;
    });
    roleCreationLocks.set(guildId, settled);
    try {
        return await settled;
    } finally {
        if (roleCreationLocks.get(guildId) === settled) {
            roleCreationLocks.delete(guildId);
        }
    }
}

async function ensureMuteRole(guild, spamProtection) {
    const configuredRole = spamProtection.muteRoleId
        ? guild.roles.cache.get(spamProtection.muteRoleId)
        : null;
    if (configuredRole) return { role: configuredRole, spamProtection };

    return withRoleCreationLock(guild.id, async () => {
        const latest = await guildService.getGuild(guild.id);
        const latestProtection = latest?.spamProtection ?? spamProtection;
        const latestRole = latestProtection.muteRoleId
            ? guild.roles.cache.get(latestProtection.muteRoleId)
            : null;
        if (latestRole) return { role: latestRole, spamProtection: latestProtection };

        const role = await createMuteRole(guild, latestProtection.muteRoleName);
        const updatedProtection = {
            ...latestProtection,
            muteRoleId: role.id,
            mutedMemberIds: [],
        };
        try {
            await guildService.setSpamProtection(guild, updatedProtection);
        } catch (error) {
            try {
                await role.delete('Spam-Schutz-Einstellungen konnten nicht gespeichert werden');
            } catch (cleanupError) {
                console.error('Mute-Rolle nach fehlgeschlagener Speicherung konnte nicht gelöscht werden:', cleanupError);
            }
            throw error;
        }
        settingsCache.delete(guild.id);
        return { role, spamProtection: updatedProtection };
    });
}

async function configure(guild, messagesPerMinute, muteRoleName) {
    if (!Number.isInteger(messagesPerMinute) || messagesPerMinute < 1 || messagesPerMinute > 120) {
        throw new RangeError('Das Nachrichtenlimit muss zwischen 1 und 120 pro Minute liegen.');
    }
    const name = muteRoleName.trim();
    if (!name || name.length > 100) {
        throw new RangeError('Der Rollenname muss zwischen 1 und 100 Zeichen lang sein.');
    }

    const existing = await guildService.getGuild(guild.id);
    const currentProtection = existing?.spamProtection;
    let role = currentProtection?.muteRoleId
        ? guild.roles.cache.get(currentProtection.muteRoleId)
        : null;
    let createdRole = false;

    if (!role) {
        role = await createMuteRole(guild, name);
        createdRole = true;
    } else {
        await role.edit({ name, reason: 'Spam-Schutz konfiguriert' });
        for (const channel of guild.channels.cache.values()) {
            await applyMuteOverwrites(channel, role);
        }
    }

    const protection = {
        messagesPerMinute,
        muteRoleId: role.id,
        muteRoleName: name,
        mutedMemberIds: createdRole ? [] : currentProtection?.mutedMemberIds ?? [],
    };
    try {
        await guildService.setSpamProtection(guild, protection);
    } catch (error) {
        if (createdRole) {
            try {
                await role.delete('Spam-Schutz-Einstellungen konnten nicht gespeichert werden');
            } catch (cleanupError) {
                console.error('Mute-Rolle nach fehlgeschlagener Speicherung konnte nicht gelöscht werden:', cleanupError);
            }
        }
        throw error;
    }
    messageWindows.delete(guild.id);
    settingsCache.delete(guild.id);
    return protection;
}

async function getSettings(guildId) {
    const cached = settingsCache.get(guildId);
    if (cached && Date.now() - cached.cachedAt < SETTINGS_CACHE_MS) {
        return cached.settings;
    }

    const settings = await guildService.getGuild(guildId);
    settingsCache.set(guildId, { settings, cachedAt: Date.now() });
    return settings;
}

async function disable(guild) {
    const settings = await guildService.getGuild(guild.id);
    const protection = settings?.spamProtection;
    if (protection?.muteRoleId) {
        const role = guild.roles.cache.get(protection.muteRoleId);
        if (role) await role.delete('Spam-Schutz deaktiviert');
    }
    await guildService.setSpamProtection(guild, null);
    messageWindows.delete(guild.id);
    settingsCache.delete(guild.id);
}

async function recordMemberMute(guild, member, protection) {
    const { role, spamProtection } = await ensureMuteRole(guild, protection);
    if (!member.roles.cache.has(role.id)) {
        const mutedMemberIds = [...new Set([...spamProtection.mutedMemberIds, member.id])];
        if (mutedMemberIds.length > 10000) {
            throw new RangeError('Zu viele Mitglieder sind gleichzeitig durch den Spam-Schutz stummgeschaltet.');
        }

        const updatedProtection = { ...spamProtection, mutedMemberIds };
        await guildService.setSpamProtection(guild, updatedProtection);
        settingsCache.delete(guild.id);
        try {
            await member.roles.add(role, 'Nachrichtenlimit pro Minute überschritten');
        } catch (error) {
            await guildService.setSpamProtection(guild, spamProtection);
            throw error;
        }
    }
}

async function checkMessage(message, protection) {
    if (!protection) return false;
    if (protection.muteRoleId && message.member.roles.cache.has(protection.muteRoleId)) {
        return true;
    }

    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const recent = (messageWindows.get(key) || []).filter(
        (timestamp) => now - timestamp < WINDOW_MS,
    );
    recent.push(now);
    messageWindows.set(key, recent);
    if (messageWindows.size > 5000) {
        const cutoff = now - WINDOW_MS;
        for (const [windowKey, timestamps] of messageWindows) {
            const active = timestamps.filter((timestamp) => timestamp > cutoff);
            if (active.length) messageWindows.set(windowKey, active);
            else messageWindows.delete(windowKey);
        }
    }

    if (recent.length < protection.messagesPerMinute) {
        return false;
    }

    messageWindows.delete(key);
    try {
        await recordMemberMute(message.guild, message.member, protection);
    } catch (error) {
        console.error(`Mute-Rolle konnte ${message.author.tag} nicht zugewiesen werden:`, error?.message || error);
    }
    return true;
}

async function removeMemberFromMuteRole(guild, memberId) {
    const settings = await guildService.getGuild(guild.id);
    const protection = settings?.spamProtection;
    if (!protection?.mutedMemberIds?.includes(memberId)) return;

    const remainingMemberIds = protection.mutedMemberIds.filter((id) => id !== memberId);
    const role = protection.muteRoleId
        ? guild.roles.cache.get(protection.muteRoleId)
        : null;

    if (remainingMemberIds.length === 0 && role && role.members.size === 0) {
        await role.delete('Mute-Rolle ist leer');
        await guildService.setSpamProtection(guild, {
            ...protection,
            muteRoleId: null,
            mutedMemberIds: [],
        });
        settingsCache.delete(guild.id);
        return;
    }

    await guildService.setSpamProtection(guild, {
        ...protection,
        ...(remainingMemberIds.length === 0 && !role ? { muteRoleId: null } : {}),
        mutedMemberIds: remainingMemberIds,
    });
    settingsCache.delete(guild.id);
}

async function cleanupAfterRoleRemoval(oldMember, newMember) {
    const settings = await getSettings(newMember.guild.id);
    const roleId = settings?.spamProtection?.muteRoleId;
    if (!roleId || !oldMember.roles.cache.has(roleId) || newMember.roles.cache.has(roleId)) return;

    await removeMemberFromMuteRole(newMember.guild, newMember.id);
}

async function cleanupAfterMemberLeave(member) {
    await removeMemberFromMuteRole(member.guild, member.id);
    settingsCache.delete(member.guild.id);
}

async function applyToNewChannel(channel) {
    const settings = await getSettings(channel.guild.id);
    const roleId = settings?.spamProtection?.muteRoleId;
    const role = roleId ? channel.guild.roles.cache.get(roleId) : null;
    if (role) await applyMuteOverwrites(channel, role);
}

module.exports = {
    configure,
    disable,
    getSettings,
    checkMessage,
    applyMuteOverwrites,
    cleanupAfterRoleRemoval,
    cleanupAfterMemberLeave,
    applyToNewChannel,
};
