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
        apiClient = new ApiClient(baseURL),
        usersApi = new UsersApi(apiClient),
    } = options;

    const run = async (request) => {
        try {
            return await request;
        } catch (err) {
            const status = err?.response?.status || err?.status;
            const data = err?.response?.body ?? err?.response?.data;
            const message = `API-Fehler${status ? ` ${status}` : ''}: ${err.message}`;
            const wrapped = new Error(message);
            wrapped.status = status;
            wrapped.data = data;
            throw wrapped;
        }
    };

    const tryGet = async (id) => {
        try {
            const data = await run(usersApi.getUserById(id));
            return apiToDomain(data);
        } catch (e) {
            if (e.status === 404) return null;
            throw e;
        }
    };

    const pendingUpserts = new Map();
    const upsertUser = async (user) => {
        const pending = pendingUpserts.get(user.id);
        if (pending) return pending;

        const request = (async () => {
            const existing = await tryGet(user.id);

            if (!existing) {
                return service.createUser(user);
            }

            if (existing.username !== user.username) {
                return service.updateUser(user.id, user);
            }

            return existing;
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

    const service = {
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

        upsertUser,
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