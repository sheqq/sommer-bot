const { apiClient } = require('../api/client');

module.exports = {
    getUserEntry(userId, guildId) {
        return apiClient.getUserLevel(guildId, userId);
    },

    getAllUserEntries(guildId) {
        return apiClient.getAllLevels(guildId);
    },

    async setUserXp(userId, xp, guildId, level = 1) {
        const levelEntry = { guildId, userId, xp, level };
        const existing = await apiClient.getUserLevel(guildId, userId);

        if (existing) {
            return apiClient.updateLevel(guildId, userId, levelEntry);
        }

        try {
            return await apiClient.createLevel(levelEntry);
        } catch (error) {
            if (error?.status !== 409) {
                throw error;
            }

            return apiClient.updateLevel(guildId, userId, levelEntry);
        }
    },

    removeUser(userId, guildId) {
        return apiClient.deleteLevel(guildId, userId);
    },
};
