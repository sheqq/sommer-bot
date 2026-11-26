const assert = require('node:assert/strict');
const guildService = require('../src/services/guildService');

async function run() {
    const originalAreColorsEnabled = guildService.areColorsEnabled;
    const calls = [];
    guildService.areColorsEnabled = async () => {
        calls.push('check-colors');
        return false;
    };

    try {
        const command = require('../src/commands/moderation/createColor');
        const interaction = {
            guildId: 'guild-1',
            async deferReply() {
                calls.push('defer');
            },
            async editReply(content) {
                calls.push(['edit', content]);
            },
            async reply() {
                throw new Error('A deferred interaction must not use reply().');
            },
        };

        await command.callback(null, interaction);

        assert.deepEqual(calls, [
            'defer',
            'check-colors',
            ['edit', 'Farbrollen sind auf diesem Server deaktiviert.'],
        ]);
        console.log('OK: create bestätigt die Interaction vor langsamen Aufrufen.');
    } finally {
        guildService.areColorsEnabled = originalAreColorsEnabled;
    }
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
