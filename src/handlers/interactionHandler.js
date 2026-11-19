const getLocalCommands = require('../utils/getLocalCommands');
const { MessageFlags } = require('discord.js');

async function interactionHandler(client, interaction) {
    if (!interaction.isChatInputCommand()) return;
    const localCommands = getLocalCommands();

    try {
        const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName);

        if (!commandObject) return;

        if (typeof commandObject.callback !== 'function') {
            console.warn(`Command ${commandObject.name} hat keine callback-Funktion.`);
            return;
        }

        if (commandObject.permissionsRequired?.length) {
            const missingPermissions = commandObject.permissionsRequired.filter(
                (permission) => !interaction.memberPermissions?.has(permission)
            );

            if (missingPermissions.length > 0) {
                return interaction.reply({
                    content: `Du brauchst diese Berechtigungen für **${commandObject.name}**: ${commandObject.permissionsRequired.join(', ')}`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        await commandObject.callback(client, interaction);
    } catch (error) {
        console.error(`Fehler beim Ausführen von Command ${interaction.commandName}:`, error);

        const errorMessage = `Fehler beim Ausführen des Commands: ${error?.message || 'Unbekannter Fehler'}`;
        try {
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else if (interaction.replied) {
                await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            }
        } catch (replyError) {
            console.error('Fehlermeldung konnte nicht an Discord gesendet werden:', replyError);
        }
    }
}

module.exports = interactionHandler;
