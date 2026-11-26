const assert = require('node:assert/strict');
const removeGuildCommandDuplicates = require('../src/utils/removeGuildCommandDuplicates');
const getLocalCommands = require('../src/utils/getLocalCommands');

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

    const commands = getLocalCommands();
    for (const commandName of [
        'levelrolle',
        'selbstrollen-nachricht',
        'willkommen',
        'verwaltung-rechte',
    ]) {
        assert(commands.some((command) => command.name === commandName));
    }

    const selfRoleCommand = commands.find(
        (command) => command.name === 'selbstrollen-nachricht',
    );
    assert(selfRoleCommand.options.length <= 25);
    let optionalOptionSeen = false;
    for (const option of selfRoleCommand.options) {
        if (!option.required) {
            optionalOptionSeen = true;
        } else {
            assert.strictEqual(optionalOptionSeen, false);
        }
    }

    console.log('OK: doppelte Guild-Commands werden entfernt, unabhängige bleiben erhalten.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
