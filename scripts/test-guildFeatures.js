const assert = require('assert');
const Module = require('module');
const { PermissionFlagsBits } = require('discord.js');

function mockModule(modulePath, exports) {
    const resolvedPath = require.resolve(modulePath);
    const mockedModule = new Module(resolvedPath);
    mockedModule.filename = resolvedPath;
    mockedModule.loaded = true;
    mockedModule.exports = exports;
    require.cache[resolvedPath] = mockedModule;
}

let guildSettings = {
    managementRoleIds: ['manager-role'],
    selfRolePanels: [{
        channelId: 'channel',
        messageId: 'panel-message',
        roleIds: ['role-1', 'role-2'],
    }],
    welcomeChannelId: 'welcome-channel',
    welcomeMessage: 'Willkommen {user}',
    welcomeImageUrl: 'https://example.com/welcome.png',
};
mockModule('../src/services/guildService', {
    getGuild: async () => guildSettings,
});
mockModule('../src/utils/getLocalCommands', () => [{
    name: 'test-command',
    requiresGuildManagement: true,
    callback: async () => {
        callbackCount += 1;
    },
}]);

let callbackCount = 0;
const selfRoleService = require('../src/services/selfRoleService');
const interactionHandler = require('../src/handlers/interactionHandler');
const { assignLevelRoles } = require('../src/services/levelRoleService');
const { formatWelcomeMessage } = require('../src/events/guildMemberAdd/welcome');
const welcomeEvent = require('../src/events/guildMemberAdd/welcome');

async function testLevelRoles() {
    const availableRoles = new Map([
        ['role-5', { id: 'role-5' }],
        ['role-10', { id: 'role-10' }],
    ]);
    const memberRoleIds = new Set(['role-5']);
    const added = [];
    const member = {
        user: { tag: 'tester' },
        guild: { id: 'guild', roles: { cache: availableRoles } },
        roles: {
            cache: { has: (roleId) => memberRoleIds.has(roleId) },
            add: async (role) => {
                added.push(role.id);
                memberRoleIds.add(role.id);
            },
        },
    };

    await assignLevelRoles(member, 10, [
        { level: 5, roleId: 'role-5' },
        { level: 10, roleId: 'role-10' },
        { level: 15, roleId: 'future-role' },
    ]);
    assert.deepStrictEqual(added, ['role-10']);
}

async function testSelfRoleToggle() {
    const memberRoleIds = new Set(['role-1']);
    const member = {
        roles: {
            cache: { has: (roleId) => memberRoleIds.has(roleId) },
            add: async (role) => memberRoleIds.add(role.id),
            remove: async (role) => memberRoleIds.delete(role.id),
        },
    };
    const roles = new Map([
        ['role-1', { id: 'role-1', name: 'Rolle Eins' }],
        ['role-2', { id: 'role-2', name: 'Rolle Zwei' }],
    ]);
    let response;
    const interaction = {
        guildId: 'guild',
        user: { id: 'user' },
        message: { id: 'panel-message' },
        values: ['role-1', 'role-2', 'unconfigured-role'],
        guild: {
            members: { fetch: async () => member },
            roles: { cache: roles },
        },
        deferReply: async () => {},
        editReply: async (content) => {
            response = content;
        },
    };

    await selfRoleService.handleSelection(interaction);
    assert.deepStrictEqual([...memberRoleIds], ['role-2']);
    assert.match(response, /Rollen geändert/);
}

async function testWelcomeImage() {
    let payload;
    const channel = {
        isTextBased: () => true,
        send: async (message) => {
            payload = message;
        },
    };
    const member = {
        id: 'user-id',
        toString: () => '<@user-id>',
        user: { username: 'Sommer', tag: 'Sommer#0001' },
        guild: {
            id: 'guild',
            name: 'Sommer Server',
            memberCount: 7,
            channels: { cache: new Map([['welcome-channel', channel]]) },
        },
    };

    await welcomeEvent({}, member);
    assert.strictEqual(payload.content, 'Willkommen <@user-id>');
    assert.deepStrictEqual(payload.embeds, [{
        image: { url: 'https://example.com/welcome.png' },
    }]);
}

async function testManagementPermission() {
    let reply;
    const makeInteraction = ({ administrator, roleCache }) => ({
        commandName: 'test-command',
        user: { id: 'user' },
        member: { roles: { cache: roleCache } },
        memberPermissions: { has: (permission) => (
            permission === PermissionFlagsBits.Administrator && administrator
        ) },
        guildId: 'guild',
        guild: { members: { fetch: async () => ({ roles: { cache: roleCache } }) } },
        inGuild: () => true,
        isChatInputCommand: () => true,
        isStringSelectMenu: () => false,
        reply: async (message) => {
            reply = message.content;
        },
    });

    const before = callbackCount;
    await interactionHandler({}, makeInteraction({
        administrator: false,
        roleCache: { has: (roleId) => roleId === 'manager-role' },
    }));
    assert.strictEqual(callbackCount, before + 1);

    await interactionHandler({}, makeInteraction({
        administrator: false,
        roleCache: { has: () => false },
    }));
    assert.strictEqual(callbackCount, before + 1);
    assert.match(reply, /Administratorrechte oder eine konfigurierte Verwaltungsrolle/);

    await interactionHandler({}, makeInteraction({
        administrator: true,
        roleCache: { has: () => false },
    }));
    assert.strictEqual(callbackCount, before + 2);
}

async function run() {
    await testLevelRoles();
    await testSelfRoleToggle();
    await testWelcomeImage();

    const member = {
        id: 'user-id',
        toString: () => '<@user-id>',
        user: { username: 'Sommer' },
        guild: { name: 'Sommer Server', memberCount: 7 },
    };
    assert.strictEqual(
        formatWelcomeMessage('Hallo {user} / {username} bei {server} ({memberCount})', member),
        'Hallo <@user-id> / Sommer bei Sommer Server (7)',
    );

    await testManagementPermission();
    console.log('OK: Levelrollen, Selbstrollen, Willkommens-Platzhalter und Verwaltungsrechte geprüft.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
