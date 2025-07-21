const {guildId} = require('../../../config.json')
const getLocalCommands = require('../../utils/getLocalCommands.js');
const getApplicationCommands = require('../../utils/getApplicationCommands.js');
const areCommandsDifferent = require('../../utils/areCommandsDifferent.js');

module.exports = async (client) => {


    try {
        const localCommands = getLocalCommands();
        const applicationCommands = await getApplicationCommands(client, guildId);

        for (const localCommand of localCommands) {
            const { name, description, options } = localCommand;

            const existingCommand = await applicationCommands.cache.find(
                (cmd) => cmd.name === name
            );

            if (existingCommand) {
                if(localCommand.deleted) {
                    await applicationCommands.delete(existingCommand.id);
                    console.log("deleted command ", existingCommand);
                    continue;
                }

                if(areCommandsDifferent(existingCommand, localCommand)) {
                    await applicationCommands.edit(existingCommand.id, {
                        description,
                        options,
                    });
                }
            } else {
                if (localCommand.deleted) {
                    console.log("skipping command ", localCommand);
                    continue;
                }

                await applicationCommands.create({
                    name,
                    description,
                    options,
                })

                console.log("registered command ", localCommand);
            }
        }
    } catch (error) {
        console.error(error);
    }
};