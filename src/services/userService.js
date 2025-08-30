// Datei: src/services/userService.js
const axios = require('axios');
const { Configuration } = require('../generated/sommer/configuration');
const { UserApiFp } = require('../generated/sommer/services/user-api');

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
    const {
        baseURL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1',
        axiosInstance = axios.create({ baseURL }),
        configuration = new Configuration({ basePath: baseURL }),
    } = options;

    const fp = UserApiFp(configuration);

    async function run(requestFactory) {
        try {
            const request = await requestFactory;
            const response = await request(axiosInstance, '');
            return response.data;
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            const msg = `API Fehler${status ? ' ' + status : ''}: ${err.message}`;
            const wrapped = new Error(msg);
            wrapped.status = status;
            wrapped.data = data;
            throw wrapped;
        }
    }

    async function tryGet(id) {
        try {
            const data = await run(fp.getUserById(id));
            return apiToDomain(data);
        } catch (e) {
            if (e.status === 404) return null;
            throw e;
        }
    }

    return {
        async listUsers() {
            const data = await run(fp.getAllUsers());
            return Array.isArray(data) ? data.map(apiToDomain) : [];
        },

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

        async deleteUser(id) {
            await run(fp.deleteUser(id));
            return true;
        },

        // Neu: Discord Member speichern / upsert
        async upsertDiscordMember(guildMember, colorHex) {
            const id = guildMember.id;
            const name = guildMember.user?.username || guildMember.displayName;
            const color = (colorHex || '#000000').toUpperCase();
            const existing = await tryGet(id);
            if (!existing) {
                return await this.createUser({ id, name, color });
            }
            // Nur aktualisieren falls Farbe geändert
            if (existing.color !== color) {
                return await this.updateUser(id, { ...existing, name, color });
            }
            return existing;
        },

        _mapping: { apiToDomain, domainToApi },
        _axios: axiosInstance,
    };
}

const defaultUserService = createUserService();

module.exports = {
    createUserService,
    userService: defaultUserService,
};