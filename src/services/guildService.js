const { apiClient } = require('../api/client');

module.exports = {
    async registerGuild(guildId) {
        try {
            return await apiClient.createGuild({ guildId, colorsEnabled: true });
        } catch (error) {
            if (error?.status !== 409) {
                throw error;
            }

            const guild = await apiClient.getGuild(guildId);
            if (!guild) {
                throw new Error(`Server ${guildId} wurde nach einem Konflikt nicht gefunden.`);
            }
            return guild;
        }
    },

    async areColorsEnabled(guildId) {
        const guild = await apiClient.getGuild(guildId);
        return guild?.colorsEnabled === true;
    },
};
