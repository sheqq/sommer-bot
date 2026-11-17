const { guildId } = require('../../config.json');
const { apiClient } = require('../api/client');

module.exports = {
    getUserEntry(userId, targetGuildId = guildId) {
        return apiClient.getUserLevel(targetGuildId, userId);
    },

    getAllUserEntries(targetGuildId = guildId) {
        return apiClient.getAllLevels(targetGuildId);
    },

    async setUserXp(userId, xp, targetGuildId = guildId) {
        const level = { guildId: targetGuildId, userId, xp };
        const existing = await apiClient.getUserLevel(targetGuildId, userId);

        if (existing) {
            return apiClient.updateLevel(targetGuildId, userId, level);
        }

        try {
            return await apiClient.createLevel(level);
        } catch (error) {
            if (error?.status !== 409) {
                throw error;
            }

            return apiClient.updateLevel(targetGuildId, userId, level);
        }
    },

    removeUser(userId, targetGuildId = guildId) {
        return apiClient.deleteLevel(targetGuildId, userId);
    },
};
