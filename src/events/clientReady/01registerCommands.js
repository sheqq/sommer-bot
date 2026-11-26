const getLocalCommands = require('../../utils/getLocalCommands.js');
const getApplicationCommands = require('../../utils/getApplicationCommands.js');
const areCommandsDifferent = require('../../utils/areCommandsDifferent.js');
const removeGuildCommandDuplicates = require('../../utils/removeGuildCommandDuplicates.js');

const DEPRECATED_COMMAND_NAMES = [
    'ping',
    'clear',
    'ban',
    'avatar',
    'leaderboard',
    'level',
    'create',
    'create-rechte',
];

module.exports = async (client) => {
    try {
        const localCommands = getLocalCommands();
        const applicationCommands = await getApplicationCommands(client);

        for (const commandName of DEPRECATED_COMMAND_NAMES) {
            const deprecatedCommand = applicationCommands.cache.find(
                (command) => command.name === commandName
            );
            if (deprecatedCommand) {
                await applicationCommands.delete(deprecatedCommand.id);
                console.log(`Veralteter Command gelöscht: ${commandName}`);
            }
        }

        for (const localCommand of localCommands) {
            const { name, description, options = [] } = localCommand;

            const existingCommand = applicationCommands.cache.find((cmd) => cmd.name === name);

            if (existingCommand) {
                if (localCommand.deleted) {
                    await applicationCommands.delete(existingCommand.id);
                    console.log(`Command gelöscht: ${existingCommand.name}`);
                    continue;
                }

                if (areCommandsDifferent(existingCommand, localCommand)) {
                    await applicationCommands.edit(existingCommand.id, {
                        description,
                        options,
                    });
                    console.log(`Command aktualisiert: ${name}`);
                }
            } else {
                if (localCommand.deleted) {
                    console.log(`Command übersprungen: ${name}`);
                    continue;
                }

                await applicationCommands.create({
                    name,
                    description,
                    options,
                })

                console.log(`Command registriert: ${name}`);
            }
        }

        const synchronizedCommands = await getApplicationCommands(client);
        await removeGuildCommandDuplicates(
            client,
            synchronizedCommands.cache,
            DEPRECATED_COMMAND_NAMES
        );
    } catch (error) {
        console.error('Konnte Slash-Commands nicht registrieren:', error);
    }
};