const assert = require('node:assert/strict');
const removeGuildCommandDuplicates = require('../src/utils/removeGuildCommandDuplicates');

async function run() {
    const deletedIds = [];
    const guildCommands = [
        {
            id: 'guild-response-time',
            name: 'antwortzeit',
        },
        {
            id: 'guild-old-create',
            name: 'create',
        },
        {
            id: 'guild-custom',
            name: 'guild-custom',
        },
    ];
    const guild = {
        id: 'guild-1',
        commands: {
            async fetch() {
                return new Map(guildCommands.map((command) => [command.id, command]));
            },
            async delete(commandId) {
                deletedIds.push(commandId);
            },
        },
    };

    await removeGuildCommandDuplicates(
        { guilds: { cache: new Map([[guild.id, guild]]) } },
        new Map([['global-response-time', { name: 'antwortzeit' }]]),
        ['create']
    );

    assert.deepEqual(deletedIds, ['guild-response-time', 'guild-old-create']);
    console.log('OK: doppelte Guild-Commands werden entfernt, unabhängige bleiben erhalten.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
