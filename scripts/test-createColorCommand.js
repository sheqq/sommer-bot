const assert = require('assert');
const Module = require('module');
const { MessageFlags } = require('discord.js');

const calls = [];
let colorsEnabled = true;
let replyContent;

function mockModule(modulePath, exports) {
    const resolvedPath = require.resolve(modulePath);
    const mockedModule = new Module(resolvedPath);
    mockedModule.filename = resolvedPath;
    mockedModule.loaded = true;
    mockedModule.exports = exports;
    require.cache[resolvedPath] = mockedModule;
}

mockModule('../src/services/roleService', {
    assignColorToMember: async () => {
        calls.push('assignColor');
        return { role: { name: '#123456' }, warnings: [] };
    },
    createRandomColor: () => '#123456',
});

mockModule('../src/services/guildService', {
    areColorsEnabled: async () => {
        calls.push('checkColors');
        return colorsEnabled;
    },
});

const command = require('../src/commands/moderation/createColor');

function createInteraction() {
    return {
        guildId: 'guild-id',
        guild: {
            members: {
                fetch: async () => {
                    calls.push('fetchMember');
                    return {};
                },
            },
        },
        options: {
            getUser: () => null,
            getString: () => null,
        },
        user: { tag: 'tester' },
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

async function run() {
    const interaction = createInteraction();
    await command.callback({}, interaction);
    assert.deepStrictEqual(calls, [
        'deferReply',
        'checkColors',
        'fetchMember',
        'assignColor',
        'editReply',
    ]);
    assert.match(replyContent.content, /wurde erstellt\/gewählt/);

    calls.length = 0;
    replyContent = undefined;
    colorsEnabled = false;
    await command.callback({}, interaction);
    assert.deepStrictEqual(calls, ['deferReply', 'checkColors', 'editReply']);
    assert.strictEqual(
        replyContent,
        'Farbrollen sind auf diesem Server deaktiviert.',
    );

    console.log('OK: /create bestätigt Interactions vor langsamer Arbeit.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
