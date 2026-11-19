const { ApiClient, Guild, GuildApi, Level, LevelApi } = require('./generated/client.cjs');

function createApiClient({
    baseUrl = process.env.API_URL,
    apiToken = process.env.API_TOKEN,
} = {}) {
    if (!baseUrl) {
        throw new Error('API_URL ist nicht konfiguriert.');
    }
    if (!apiToken) {
        throw new Error('API_TOKEN ist nicht konfiguriert.');
    }

    const apiClient = new ApiClient(new URL('/api/v1', baseUrl).toString());
    apiClient.authentications.ApiKeyAuth.apiKey = apiToken;
    const guildsApi = new GuildApi(apiClient);
    const levelsApi = new LevelApi(apiClient);

    return {
        async getGuild(guildId) {
            try {
                return await guildsApi.getGuildById(guildId);
            } catch (error) {
                if (error?.status === 404) {
                    return null;
                }
                throw error;
            }
        },

        createGuild(guild) {
            const model = new Guild(guild.guildId);
            model.name = guild.name;
            model.iconUrl = guild.iconUrl;
            model.colorsEnabled = guild.colorsEnabled;
            return guildsApi.createGuild(model);
        },

        updateGuild(guildId, guild) {
            const model = new Guild(guild.guildId);
            model.name = guild.name;
            model.iconUrl = guild.iconUrl;
            model.colorsEnabled = guild.colorsEnabled;
            return guildsApi.updateGuild(guildId, model);
        },

        getAllLevels(guildId) {
            return levelsApi.getAllLevels(guildId);
        },

        async getUserLevel(guildId, userId) {
            try {
                return await levelsApi.getUserById(userId, guildId);
            } catch (error) {
                if (error?.status === 404) {
                    return null;
                }
                throw error;
            }
        },

        createLevel(level) {
            const model = new Level(level.guildId, level.userId, level.xp);
            return levelsApi.createLevel(level.guildId, model);
        },

        updateLevel(guildId, userId, level) {
            const model = new Level(level.guildId, level.userId, level.xp);
            return levelsApi.updateLevel(userId, guildId, model);
        },

        deleteLevel(guildId, userId) {
            return levelsApi.deleteLevel(userId, guildId);
        },
    };
}

let defaultClient;
function getDefaultClient() {
    if (!defaultClient) {
        defaultClient = createApiClient();
    }
    return defaultClient;
}

const apiClient = {
    getGuild(...args) {
        return getDefaultClient().getGuild(...args);
    },
    createGuild(...args) {
        return getDefaultClient().createGuild(...args);
    },
    updateGuild(...args) {
        return getDefaultClient().updateGuild(...args);
    },
    getAllLevels(...args) {
        return getDefaultClient().getAllLevels(...args);
    },
    getUserLevel(...args) {
        return getDefaultClient().getUserLevel(...args);
    },
    createLevel(...args) {
        return getDefaultClient().createLevel(...args);
    },
    updateLevel(...args) {
        return getDefaultClient().updateLevel(...args);
    },
    deleteLevel(...args) {
        return getDefaultClient().deleteLevel(...args);
    },
};

module.exports = {
    createApiClient,
    apiClient,
};
