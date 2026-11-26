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
        managementRoleIds: existingGuild.managementRoleIds ?? [],
        levelRoles: existingGuild.levelRoles ?? [],
        selfRolePanels: existingGuild.selfRolePanels ?? [],
        welcomeChannelId: existingGuild.welcomeChannelId ?? null,
        welcomeMessage: existingGuild.welcomeMessage ?? null,
        welcomeImageUrl: existingGuild.welcomeImageUrl ?? null,
        spamProtection: existingGuild.spamProtection ?? null,
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
                managementRoleIds: [],
                levelRoles: [],
                selfRolePanels: [],
                welcomeChannelId: null,
                welcomeMessage: null,
                welcomeImageUrl: null,
                spamProtection: null,
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
                managementRoleIds: existingGuild.managementRoleIds ?? [],
                levelRoles: existingGuild.levelRoles ?? [],
                selfRolePanels: existingGuild.selfRolePanels ?? [],
                welcomeChannelId: existingGuild.welcomeChannelId ?? null,
                welcomeMessage: existingGuild.welcomeMessage ?? null,
                welcomeImageUrl: existingGuild.welcomeImageUrl ?? null,
                spamProtection: existingGuild.spamProtection ?? null,
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

    async setManagementRoleIds(guild, managementRoleIds) {
        const roleIds = [...new Set(managementRoleIds)];
        if (roleIds.length > 25) {
            throw new RangeError('Es können höchstens 25 Verwaltungsrollen festgelegt werden.');
        }
        return updateGuildSettings(guild, { managementRoleIds: roleIds });
    },

    async setLevelRoles(guild, levelRoles) {
        if (
            !Array.isArray(levelRoles) ||
            levelRoles.length > 100 ||
            levelRoles.some((entry) =>
                !entry ||
                !Number.isInteger(entry.level) ||
                entry.level < 1 ||
                entry.level > 1000 ||
                typeof entry.roleId !== 'string' ||
                !entry.roleId
            ) ||
            new Set(levelRoles.map((entry) => entry.roleId)).size !== levelRoles.length
        ) {
            throw new RangeError('Levelrollen müssen eindeutig sein und ein Level zwischen 1 und 1000 haben.');
        }
        return updateGuildSettings(guild, { levelRoles });
    },

    async addSelfRolePanel(guild, panel) {
        const existingGuild = await apiClient.getGuild(guild.id);
        if (!existingGuild) {
            throw new Error(`Server ${guild.id} ist nicht in der API gespeichert.`);
        }

        const selfRolePanels = existingGuild.selfRolePanels ?? [];
        if (selfRolePanels.length >= 100) {
            throw new RangeError('Auf diesem Server können höchstens 100 Selbstrollen-Nachrichten gespeichert werden.');
        }

        return apiClient.updateGuild(guild.id, {
            ...guildUpdatePayload(guild, existingGuild),
            selfRolePanels: [...selfRolePanels, panel],
        });
    },

    async setWelcomeSettings(guild, welcomeChannelId, welcomeMessage, welcomeImageUrl = null) {
        if (
            !(
                (welcomeChannelId === null && welcomeMessage === null && welcomeImageUrl === null) ||
                (
                    typeof welcomeChannelId === 'string' &&
                    welcomeChannelId.length > 0 &&
                    typeof welcomeMessage === 'string' &&
                    welcomeMessage.length > 0 &&
                    welcomeMessage.length <= 1800 &&
                    (
                        welcomeImageUrl === null ||
                        (
                            typeof welcomeImageUrl === 'string' &&
                            welcomeImageUrl.length <= 1000 &&
                            isHttpsUrl(welcomeImageUrl)
                        )
                    )
                )
            )
        ) {
            throw new RangeError('Kanal, Nachricht und HTTPS-Bild-URL der Willkommensnachricht sind ungültig.');
        }
        return updateGuildSettings(guild, {
            welcomeChannelId,
            welcomeMessage,
            welcomeImageUrl,
        });
    },

    async setSpamProtection(guild, spamProtection) {
        if (
            spamProtection !== null &&
            (
                !Number.isInteger(spamProtection.messagesPerMinute) ||
                spamProtection.messagesPerMinute < 1 ||
                spamProtection.messagesPerMinute > 120 ||
                typeof spamProtection.muteRoleName !== 'string' ||
                spamProtection.muteRoleName.trim().length === 0 ||
                spamProtection.muteRoleName.length > 100 ||
                (spamProtection.muteRoleId !== null &&
                    (typeof spamProtection.muteRoleId !== 'string' || !spamProtection.muteRoleId)) ||
                !Array.isArray(spamProtection.mutedMemberIds) ||
                spamProtection.mutedMemberIds.length > 10000 ||
                spamProtection.mutedMemberIds.some((id) => typeof id !== 'string' || !id) ||
                new Set(spamProtection.mutedMemberIds).size !== spamProtection.mutedMemberIds.length
            )
        ) {
            throw new RangeError('Die Spam-Schutz-Konfiguration ist ungültig.');
        }
        return updateGuildSettings(guild, { spamProtection });
    },
};

function isHttpsUrl(value) {
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
}
