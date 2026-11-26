const assert = require('assert');
const Module = require('module');
const { MessageFlags } = require('discord.js');

const calls = [];
let replyContent;
let assignedLimit;
let canUseByRole = true;
let isAdministrator = false;
let settings = {
    colorsEnabled: true,
    maxColorRoles: 25,
    createAllowedRoleIds: ['allowed-role'],
};

function mockModule(modulePath, exports) {
    const resolvedPath = require.resolve(modulePath);
    const mockedModule = new Module(resolvedPath);
    mockedModule.filename = resolvedPath;
    mockedModule.loaded = true;
    mockedModule.exports = exports;
    require.cache[resolvedPath] = mockedModule;
}

mockModule('../src/services/roleService', {
    assignColorToMember: async (_member, _color, maxColorRoles) => {
        calls.push('assignColor');
        assignedLimit = maxColorRoles;
        return { role: { name: '#123456' }, warnings: [] };
    },
    createRandomColor: () => '#123456',
});

mockModule('../src/services/guildService', {
    getGuild: async () => {
        calls.push('getSettings');
        return settings;
    },
    setCreateAllowedRoleIds: async (_guild, roleIds) => {
        calls.push('saveAllowedRoles');
        settings = { ...settings, createAllowedRoleIds: roleIds };
    },
});

const command = require('../src/commands/moderation/createColor');
const permissionsCommand = require('../src/commands/moderation/createPermissions');

function createInteraction() {
    return {
        guildId: 'guild-id',
        guild: {
            members: {
                fetch: async (userId) => {
                    calls.push('fetchMember');
                    return {
                        id: userId,
                        permissions: { has: () => isAdministrator },
                        roles: { cache: { has: () => canUseByRole } },
                    };
                },
            },
        },
        options: {
            getUser: () => null,
            getString: () => null,
        },
        user: { id: 'user-id', tag: 'tester' },
        deferReply: async (options) => {
            calls.push('deferReply');
            assert.deepStrictEqual(options, { flags: MessageFlags.Ephemeral });
        },
        editReply: async (content) => {
            calls.push('editReply');
            replyContent = content;
        },
        reply: async () => {
            throw new Error('Command should edit its deferred reply');
        },
    };
}

function createPermissionsInteraction(subcommand, role) {
    return {
        guildId: 'guild-id',
        guild: {
            roles: {
                cache: {
                    get: (roleId) => roleId === role.id ? role : undefined,
                },
            },
        },
        options: {
            getSubcommand: () => subcommand,
            getRole: () => role,
        },
        deferReply: async (options) => {
            calls.push('deferReply');
            assert.deepStrictEqual(options, { flags: MessageFlags.Ephemeral });
        },
        editReply: async (content) => {
            calls.push('editReply');
            replyContent = content;
        },
    };
}

async function run() {
    const interaction = createInteraction();
    await command.callback({}, interaction);
    assert.deepStrictEqual(calls, [
        'deferReply',
        'getSettings',
        'fetchMember',
        'assignColor',
        'editReply',
    ]);
    assert.strictEqual(assignedLimit, 25);
    assert.match(replyContent.content, /wurde erstellt\/gewählt/);

    calls.length = 0;
    replyContent = undefined;
    settings = { colorsEnabled: false };
    await command.callback({}, interaction);
    assert.deepStrictEqual(calls, ['deferReply', 'getSettings', 'editReply']);
    assert.strictEqual(
        replyContent,
        'Farbrollen sind auf diesem Server deaktiviert.',
    );

    calls.length = 0;
    replyContent = undefined;
    settings = {
        colorsEnabled: true,
        maxColorRoles: 25,
        createAllowedRoleIds: ['allowed-role'],
    };
    canUseByRole = false;
    await command.callback({}, interaction);
    assert.deepStrictEqual(calls, [
        'deferReply',
        'getSettings',
        'fetchMember',
        'editReply',
    ]);
    assert.match(replyContent, /keine Berechtigung/);

    calls.length = 0;
    replyContent = undefined;
    settings = { createAllowedRoleIds: [] };
    const role = { id: 'new-role', toString: () => '<@&new-role>' };
    await permissionsCommand.callback(
        {},
        createPermissionsInteraction('hinzufuegen', role),
    );
    assert.deepStrictEqual(calls, [
        'deferReply',
        'getSettings',
        'saveAllowedRoles',
        'editReply',
    ]);
    assert.deepStrictEqual(settings.createAllowedRoleIds, ['new-role']);
    assert.match(replyContent, /darf jetzt `\/farbrolle-erstellen` verwenden/);

    calls.length = 0;
    replyContent = undefined;
    await permissionsCommand.callback(
        {},
        createPermissionsInteraction('entfernen', role),
    );
    assert.deepStrictEqual(calls, [
        'deferReply',
        'getSettings',
        'saveAllowedRoles',
        'editReply',
    ]);
    assert.deepStrictEqual(settings.createAllowedRoleIds, []);

    console.log('OK: /farbrolle-erstellen und /farbrollen-rechte prüfen Guild-Rechte.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
