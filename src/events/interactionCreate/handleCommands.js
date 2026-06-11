const { devId, guildId } = require("../../../config.json");
const getLocalCommands = require("../../utils/getLocalCommands");

module.exports = async (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const localCommands = getLocalCommands();

    try {
        const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName);

        if (!commandObject) return;

        if (typeof commandObject.callback !== 'function') {
            console.warn(`Command ${commandObject.name} hat keine callback-Funktion.`);
            return;
        }

        if (commandObject.devOnly && devId !== interaction.member?.id) {
            return interaction.reply({
                content: `Der Command **${commandObject.name}** ist nur für Entwickler verfügbar.`,
                ephemeral: true,
            });
        }

        if (commandObject.testOnly && guildId !== interaction.guild?.id) {
            return interaction.reply({
                content: `Der Command **${commandObject.name}** ist nur im Test-Server verfügbar.`,
                ephemeral: true,
            });
        }

        if (commandObject.permissionsRequired?.length) {
            const missingPermissions = commandObject.permissionsRequired.filter(
                (permission) => !interaction.memberPermissions?.has(permission)
            );

            if (missingPermissions.length > 0) {
                return interaction.reply({
                    content: `Du brauchst diese Berechtigungen für **${commandObject.name}**: ${commandObject.permissionsRequired.join(', ')}`,
                    ephemeral: true,
                });
            }
        }

        await commandObject.callback(client, interaction);

    } catch (error) {
        console.error(`Fehler beim Ausführen von Command ${interaction.commandName}:`, error);
    }

};