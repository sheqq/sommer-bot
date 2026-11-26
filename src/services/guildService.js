const { apiClient } = require('../api/client');

const DEFAULT_MAX_COLOR_ROLES = 100;

function guildUpdatePayload(guild, existingGuild) {
    return {
        guildId: guild.id,
        name: guild.name,
        iconUrl: guild.iconURL(),
        colorsEnabled: existingGuild.colorsEnabled === true,
        maxColorRoles: existingGuild.maxColorRoles ?? DEFAULT_MAX_COLOR_ROLES,
        createAllowedRoleIds: existingGuild.createAllowedRoleIds ?? [],
    };
}

async function updateGuildSettings(guild, changes) {
    const existingGuild = await apiClient.getGuild(guild.id);
    if (!existingGuild) {
        throw new Error(`Server ${guild.id} ist nicht in der API gespeichert.`);
    }

    return apiClient.updateGuild(guild.id, {
        ...guildUpdatePayload(guild, existingGuild),
        ...changes,
    });
}

module.exports = {
    async registerGuild(guild) {
        const guildData = {
            guildId: guild.id,
            name: guild.name,
            iconUrl: guild.iconURL(),
        };

        try {
            return await apiClient.createGuild({
                ...guildData,
                colorsEnabled: true,
                maxColorRoles: DEFAULT_MAX_COLOR_ROLES,
                createAllowedRoleIds: [],
            });
        } catch (error) {
            if (error?.status !== 409) {
                throw error;
            }

            const existingGuild = await apiClient.getGuild(guild.id);
            if (!existingGuild) {
                throw new Error(`Server ${guild.id} wurde nach einem Konflikt nicht gefunden.`);
            }

            return apiClient.updateGuild(guild.id, {
                ...guildData,
                colorsEnabled: existingGuild.colorsEnabled === true,
                maxColorRoles:
                    existingGuild.maxColorRoles ?? DEFAULT_MAX_COLOR_ROLES,
                createAllowedRoleIds: existingGuild.createAllowedRoleIds ?? [],
            });
        }
    },

    async getGuild(guildId) {
        return apiClient.getGuild(guildId);
    },

    async areColorsEnabled(guildId) {
        const guild = await apiClient.getGuild(guildId);
        return guild?.colorsEnabled === true;
    },

    async setColorsEnabled(guild, colorsEnabled) {
        return updateGuildSettings(guild, { colorsEnabled });
    },

    async setMaxColorRoles(guild, maxColorRoles) {
        if (!Number.isInteger(maxColorRoles) || maxColorRoles < 1 || maxColorRoles > 250) {
            throw new RangeError('Die Obergrenze muss zwischen 1 und 250 liegen.');
        }

        return updateGuildSettings(guild, { maxColorRoles });
    },

    async setCreateAllowedRoleIds(guild, createAllowedRoleIds) {
        return updateGuildSettings(guild, {
            createAllowedRoleIds: [...new Set(createAllowedRoleIds)],
        });
    },
};
