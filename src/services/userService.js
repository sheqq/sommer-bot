const axios = require('axios');
const path = require('path');

let cachedApiFactory = null;

function loadGeneratedApi() {
    if (cachedApiFactory) {
        return cachedApiFactory;
    }

    try {
        const { Configuration } = require(path.join(__dirname, '..', 'generated', 'sommer', 'configuration'));
        const { UserApiFp } = require(path.join(__dirname, '..', 'generated', 'sommer', 'services', 'user-api'));

        cachedApiFactory = { Configuration, UserApiFp };
        return cachedApiFactory;
    } catch (error) {
        const wrapped = new Error(
            'Der generierte OpenAPI-Client fehlt. Bitte zuerst `npm run gen:api` ausführen.'
        );
        wrapped.cause = error;
        throw wrapped;
    }
}

function apiToDomain(apiUser) {
    if (!apiUser) return null;
    return {
        id: apiUser.id,
        name: apiUser.username,
        member: Array.isArray(apiUser.member) ? apiUser.member.map(d => new Date(d)) : undefined,
        level: apiUser.level,
        color: apiUser.color ? apiUser.color.toUpperCase() : undefined,
    };
}

function domainToApi(domainUser) {
    if (!domainUser) return null;
    return {
        id: domainUser.id,
        username: domainUser.name,
        member: Array.isArray(domainUser.member)
            ? domainUser.member.map(d => typeof d === 'string' ? d : d.toISOString().substring(0, 10))
            : undefined,
        level: domainUser.level,
        color: domainUser.color,
    };
}

function createUserService(options = {}) {
    const { Configuration, UserApiFp } = loadGeneratedApi();
    const {
        baseURL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1',
        axiosInstance = axios.create({ baseURL }),
        configuration = new Configuration({ basePath: baseURL }),
    } = options;

    const fp = UserApiFp(configuration);
    const run = async (requestFactory) => {
        try {
            const request = await requestFactory;
            const response = await request(axiosInstance, '');
            return response.data;
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            const message = `API-Fehler${status ? ` ${status}` : ''}: ${err.message}`;
            const wrapped = new Error(message);
            wrapped.status = status;
            wrapped.data = data;
            throw wrapped;
        }
    };

    const tryGet = async (id) => {
        try {
            const data = await run(fp.getUserById(id));
            return apiToDomain(data);
        } catch (e) {
            if (e.status === 404) return null;
            throw e;
        }
    };

    const service = {
        async getUser(id) {
            const data = await run(fp.getUserById(id));
            return apiToDomain(data);
        },

        async createUser(domainUser) {
            const apiPayload = domainToApi(domainUser);
            const data = await run(fp.createUser(apiPayload));
            return apiToDomain(data);
        },

        async updateUser(id, domainUser) {
            const apiPayload = domainToApi({ ...domainUser, id });
            const data = await run(fp.updateUser(id, apiPayload));
            return apiToDomain(data);
        },

        async upsertDiscordMember(guildMember, colorHex) {
            const id = guildMember.id;
            const name = guildMember.user?.username || guildMember.displayName;
            const color = (colorHex || '#000000').toUpperCase();
            const existing = await tryGet(id);

            if (!existing) {
                return service.createUser({ id, name, color });
            }

            if (existing.color !== color) {
                return service.updateUser(id, { ...existing, name, color });
            }

            return existing;
        },

        _axios: axiosInstance,
    };

    return service;
}

let defaultUserService;

function getDefaultUserService() {
    if (!defaultUserService) {
        defaultUserService = createUserService();
    }

    return defaultUserService;
}

const userService = new Proxy({}, {
    get(_target, prop) {
        const service = getDefaultUserService();
        const value = service[prop];

        return typeof value === 'function' ? value.bind(service) : value;
    },
});

module.exports = {
    userService,
};