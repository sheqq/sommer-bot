const assert = require('assert');
const Module = require('module');

const entries = new Map([
    ['guild-a:user', { level: 1, xp: 95 }],
    ['guild-b:user', { level: 1, xp: 0 }],
]);
const writes = [];
const announcements = [];
let guildSettingsCalls = 0;

function mockModule(modulePath, exports) {
    const resolvedPath = require.resolve(modulePath);
    const mockedModule = new Module(resolvedPath);
    mockedModule.filename = resolvedPath;
    mockedModule.loaded = true;
    mockedModule.exports = exports;
    require.cache[resolvedPath] = mockedModule;
}

mockModule('../src/services/levelService', {
    getUserEntry: async (userId, guildId) => entries.get(`${guildId}:${userId}`) || null,
    setUserXp: async (userId, xp, guildId, level) => {
        entries.set(`${guildId}:${userId}`, { level, xp });
        writes.push({ userId, xp, guildId, level });
    },
});
mockModule('../src/services/guildService', {
    getGuild: async () => {
        guildSettingsCalls += 1;
        return { levelRoles: [] };
    },
});
mockModule('../src/services/spamProtectionService', {
    getSettings: async () => ({ levelRoles: [], spamProtection: null }),
    checkMessage: async () => false,
});
mockModule('../src/services/levelRoleService', {
    assignLevelRoles: async () => {},
});

const handleMessage = require('../src/events/messageCreate/levelup');

function createMessage(guildId, userId = 'user', { bot = false, system = false } = {}) {
    return {
        author: { id: userId, bot, tag: userId },
        guild: { id: guildId },
        member: {},
        system,
        channel: {
            send: async (content) => announcements.push(content),
        },
    };
}

async function run() {
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
        await handleMessage({}, createMessage('guild-a'));
        assert.deepStrictEqual(entries.get('guild-a:user'), { level: 2, xp: 0 });
        assert.strictEqual(announcements.length, 1);
        assert.match(announcements[0], /Level 2/);

        await Promise.all([
            handleMessage({}, createMessage('guild-a')),
            handleMessage({}, createMessage('guild-a')),
        ]);
        assert.strictEqual(writes.length, 3);
        assert.deepStrictEqual(entries.get('guild-a:user'), { level: 2, xp: 10 });

        await handleMessage({}, createMessage('guild-b'));
        assert.deepStrictEqual(entries.get('guild-b:user'), { level: 1, xp: 5 });
        assert.strictEqual(writes.length, 4);

        await handleMessage({}, createMessage('guild-a'));
        assert.deepStrictEqual(entries.get('guild-a:user'), { level: 2, xp: 15 });
        assert.strictEqual(writes.length, 5);

        await handleMessage({}, createMessage('guild-a', 'bot', { bot: true }));
        await handleMessage({}, createMessage('guild-a', 'system', { system: true }));
        assert.strictEqual(writes.length, 5);
        assert.strictEqual(guildSettingsCalls, 0);
    } finally {
        Math.random = originalRandom;
    }

    console.log('OK: Zufällige XP pro Nachricht und Guild-Trennung geprüft.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
