const { apiClient } = require('../api/client');

module.exports = {
    getUserEntry(userId, guildId) {
        return apiClient.getUserLevel(guildId, userId);
    },

    getAllUserEntries(guildId) {
        return apiClient.getAllLevels(guildId);
    },

    async setUserXp(userId, xp, guildId) {
        const level = { guildId, userId, xp };
        const existing = await apiClient.getUserLevel(guildId, userId);

        if (existing) {
            return apiClient.updateLevel(guildId, userId, level);
        }

        try {
            return await apiClient.createLevel(level);
        } catch (error) {
            if (error?.status !== 409) {
                throw error;
            }

            return apiClient.updateLevel(guildId, userId, level);
        }
    },

    removeUser(userId, guildId) {
        return apiClient.deleteLevel(guildId, userId);
    },
};
