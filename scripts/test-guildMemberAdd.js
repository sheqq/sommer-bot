const assert = require('assert');
const Module = require('module');

const assigned = [];
let createRandomColorCalls = 0;
const existingRole = { name: '#A1B2C3' };

function mockModule(modulePath, exports) {
    const resolvedPath = require.resolve(modulePath);
    const mockedModule = new Module(resolvedPath);
    mockedModule.filename = resolvedPath;
    mockedModule.loaded = true;
    mockedModule.exports = exports;
    require.cache[resolvedPath] = mockedModule;
}

mockModule('../src/services/roleService', {
    assignColorToMember: async (member, color, maxColorRoles) => {
        assigned.push({ member, color, maxColorRoles });
        return { warnings: [] };
    },
    createRandomColor: () => {
        createRandomColorCalls += 1;
        return '#FFFFFF';
    },
    getRandomColorRole: () => existingRole,
});

mockModule('../src/services/guildService', {
    getGuild: async () => ({ colorsEnabled: true, maxColorRoles: 25 }),
});

const handleGuildMemberAdd = require('../src/events/guildMemberAdd/addRole');

async function run() {
    const member = {
        user: { bot: false, tag: 'tester' },
        guild: { id: 'guild-id' },
    };

    await handleGuildMemberAdd({}, member);

    assert.strictEqual(assigned.length, 1);
    assert.strictEqual(assigned[0].member, member);
    assert.strictEqual(assigned[0].color, existingRole.name);
    assert.strictEqual(assigned[0].maxColorRoles, 25);
    assert.strictEqual(createRandomColorCalls, 0);

    console.log('OK: Neue Mitglieder verwenden vorhandene Farbrollen wieder.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
