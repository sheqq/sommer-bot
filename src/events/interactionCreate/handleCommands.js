const { devId, guildId } = require("../../../config.json");
const getLocalCommands = require("../../utils/getLocalCommands");

module.exports =async (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;



    const localCommands = getLocalCommands();

    try {
        const commandObject = localCommands.find(
            (cmd) => cmd.name === interaction.commandName
        );

        if (!commandObject) return;

        if (commandObject.devOnly) {
            if (devId !== interaction.member.id) {
                interaction.reply({
                    content: `${commandObject.name} (${commandObject.description}) only developers are allowed`,
                });
                return;
            }
        }

        if (commandObject.testOnly) {
            if (guildId !== interaction.guild.id) {
                interaction.reply({
                    content: `${commandObject.name} (${commandObject.description}) cannot be rann here`,
                });
                return;
            }
        }

        if (commandObject.permissionsRequired?.length) {
            for (const permission of commandObject.permissionsRequired) {
                if (!interaction.member.permissions.has(permission)) {
                    interaction.reply({
                        content: `${commandObject.name} (${commandObject.description}) has permissions ${commandObject.permissionsRequired.toString()}`,
                    });
                    break;
                }
            }
        }

        await commandObject.callback(client, interaction);

    } catch (error) {
        console.error(`Error while getting local commands: ${error}`);
    }


};