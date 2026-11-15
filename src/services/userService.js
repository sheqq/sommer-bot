const path = require('path');

let cachedApiFactory = null;

function loadGeneratedApi() {
    if (cachedApiFactory) {
        return cachedApiFactory;
    }

    try {
        const { ApiClient, UsersApi } = require(path.join(__dirname, '..', 'api', 'generated', 'sommer', 'dist'));

        cachedApiFactory = { ApiClient, UsersApi };
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
        username: apiUser.username,
    };
}

function toApiUser(user) {
    return {
        id: user.id,
        username: user.username,
    };
}

function createUserService(options = {}) {
    const { ApiClient, UsersApi } = loadGeneratedApi();
    const {
        baseURL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1',
        apiKey = process.env.API_KEY,
        apiClient = new ApiClient(baseURL),
        usersApi = new UsersApi(apiClient),
    } = options;

    if (apiKey) {
        apiClient.defaultHeaders['X-API-Key'] = apiKey;
    }

    const run = async (request) => {
        try {
            return await request;
        } catch (err) {
            const cause = err?.error ?? err;
            const status = err?.response?.status || err?.status || cause?.status;
            const data = err?.response?.body ?? err?.response?.data ?? err?.body;
            const detail = cause?.message || (typeof cause === 'string' ? cause : 'Unbekannter Fehler');
            const message = `API-Fehler${status ? ` ${status}` : ''}: ${detail}`;
            const wrapped = new Error(message);
            wrapped.status = status;
            wrapped.data = data;
            wrapped.code = cause?.code;
            wrapped.cause = cause;
            throw wrapped;
        }
    };

    const pendingUpserts = new Map();
    const upsertKnownUser = async (user, knownUsers) => {
        const pending = pendingUpserts.get(user.id);
        if (pending) return pending;

        const request = (async () => {
            const existing = knownUsers.get(user.id);
            let result;

            if (!existing) {
                result = await service.createUser(user);
            } else if (existing.username !== user.username) {
                result = await service.updateUser(user.id, user);
            } else {
                result = existing;
            }

            knownUsers.set(user.id, result);
            return result;
        })();

        pendingUpserts.set(user.id, request);
        try {
            return await request;
        } finally {
            if (pendingUpserts.get(user.id) === request) {
                pendingUpserts.delete(user.id);
            }
        }
    };

    const getKnownUsers = async () => {
        const users = await run(usersApi.getAllUsers());
        if (!Array.isArray(users)) {
            throw new Error('API-Fehler: GET /users hat keine Nutzerliste zurückgegeben.');
        }

        return new Map(users.map(apiToDomain).filter(Boolean).map(user => [user.id, user]));
    };

    const service = {
        async getAllUsers() {
            const users = await run(usersApi.getAllUsers());
            if (!Array.isArray(users)) {
                throw new Error('API-Fehler: GET /users hat keine Nutzerliste zurückgegeben.');
            }
            return users.map(apiToDomain).filter(Boolean);
        },

        async getUser(id) {
            const data = await run(usersApi.getUserById(id));
            return apiToDomain(data);
        },

        async createUser(domainUser) {
            const apiPayload = toApiUser(domainUser);
            const data = await run(usersApi.createUser(apiPayload));
            return apiToDomain(data);
        },

        async updateUser(id, domainUser) {
            const apiPayload = toApiUser({ ...domainUser, id });
            const data = await run(usersApi.updateUser(id, apiPayload));
            return apiToDomain(data);
        },

        async upsertUser(user) {
            const knownUsers = await getKnownUsers();
            return upsertKnownUser(user, knownUsers);
        },

        async upsertUsers(users) {
            const knownUsers = await getKnownUsers();
            const results = [];

            for (const user of users) {
                try {
                    await upsertKnownUser(user, knownUsers);
                } catch (error) {
                    results.push({ user, error });
                }
            }

            return results;
        },
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