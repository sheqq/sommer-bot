const { apiClient } = require('../api/client');

module.exports = {
    async registerGuild(guild) {
        const guildData = {
            guildId: guild.id,
            name: guild.name,
            iconUrl: guild.iconURL(),
        };

        try {
            return await apiClient.createGuild({ ...guildData, colorsEnabled: true });
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
            });
        }
    },

    async areColorsEnabled(guildId) {
        const guild = await apiClient.getGuild(guildId);
        return guild?.colorsEnabled === true;
    },

    async setColorsEnabled(guild, colorsEnabled) {
        const existingGuild = await apiClient.getGuild(guild.id);
        if (!existingGuild) {
            throw new Error(`Server ${guild.id} ist nicht in der API gespeichert.`);
        }

        return apiClient.updateGuild(guild.id, {
            guildId: guild.id,
            name: guild.name,
            iconUrl: guild.iconURL(),
            colorsEnabled,
        });
    },
};
