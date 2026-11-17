const assert = require('assert');
const http = require('http');
const { once } = require('events');
const { apiClient: defaultApiClient, createApiClient } = require('../src/api/client');
const { Level } = require('../src/api/generated/client.cjs');
const levelService = require('../src/services/levelService');

async function run() {
    const calls = [];
    const server = http.createServer((request, response) => {
        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            calls.push({
                method: request.method,
                url: request.url,
                apiKey: request.headers['x-api-key'],
                body: body ? JSON.parse(body) : null,
            });

            if (request.method === 'GET' && request.url.endsWith('/missing/level')) {
                response.writeHead(404).end();
            } else if (request.method === 'GET' && request.url === '/api/v1/guild/guild/level') {
                response.writeHead(500).end('API failed');
            } else if (request.method === 'DELETE') {
                response.writeHead(204).end();
            } else if (request.method === 'POST' || request.method === 'PUT') {
                response.writeHead(request.method === 'POST' ? 201 : 200, {
                    'Content-Type': 'application/json',
                }).end(JSON.stringify(JSON.parse(body)));
            } else {
                response.writeHead(200, { 'Content-Type': 'application/json' }).end(
                    JSON.stringify({ guildId: 'guild', userId: 'user', xp: 40 })
                );
            }
        });
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    try {
        const address = server.address();
        const client = createApiClient({
            baseUrl: `http://127.0.0.1:${address.port}`,
            apiToken: 'test-token',
        });
        const level = await client.getUserLevel('guild', 'user');

        assert(level instanceof Level);
        assert.strictEqual(level.xp, 40);
        assert.strictEqual(calls[0].apiKey, 'test-token');
        assert.deepStrictEqual(await client.getUserLevel('guild', 'missing'), null);
        assert.strictEqual(await client.deleteLevel('guild', 'user'), null);
        await assert.rejects(client.getAllLevels('guild'), (error) => error.status === 500);

        const newLevel = { guildId: 'guild', userId: 'user', xp: 40 };
        assert((await client.createLevel(newLevel)) instanceof Level);
        assert.strictEqual(calls[4].method, 'POST');
        assert.deepStrictEqual(calls[4].body, newLevel);
        assert((await client.updateLevel('guild', 'user', { ...newLevel, xp: 50 })) instanceof Level);
        assert.strictEqual(calls[5].method, 'PUT');
    } finally {
        server.close();
        await once(server, 'close');
    }

    const originalMethods = {
        getUserLevel: defaultApiClient.getUserLevel,
        createLevel: defaultApiClient.createLevel,
        updateLevel: defaultApiClient.updateLevel,
    };
    const writes = [];
    let existingLevel = null;
    let createConflict = false;

    defaultApiClient.getUserLevel = async () => existingLevel;
    defaultApiClient.createLevel = async (level) => {
        writes.push({ method: 'create', level });
        if (createConflict) {
            throw { status: 409 };
        }
        return level;
    };
    defaultApiClient.updateLevel = async (guildId, userId, level) => {
        writes.push({ method: 'update', guildId, userId, level });
        return level;
    };

    try {
        const newLevel = await levelService.setUserXp('user', 10, 'guild');
        assert.deepStrictEqual(newLevel, { guildId: 'guild', userId: 'user', xp: 10 });
        assert.strictEqual(writes[0].method, 'create');

        existingLevel = newLevel;
        await levelService.setUserXp('user', 20, 'guild');
        assert.strictEqual(writes[1].method, 'update');

        existingLevel = null;
        createConflict = true;
        await levelService.setUserXp('user', 30, 'guild');
        assert.strictEqual(writes[3].method, 'update');
    } finally {
        Object.assign(defaultApiClient, originalMethods);
    }

    console.log('OK: generierter API-Client, Level-Model und Service geprüft.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
