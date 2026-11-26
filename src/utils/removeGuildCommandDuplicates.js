module.exports = async (client, globalCommands, deprecatedCommandNames = []) => {
    const globalCommandNames = new Set(
        [...globalCommands.values()].map((command) => command.name)
    );
    const deprecatedNames = new Set(deprecatedCommandNames);

    for (const guild of client.guilds.cache.values()) {
        const guildCommands = await guild.commands.fetch();

        for (const command of guildCommands.values()) {
            if (globalCommandNames.has(command.name) || deprecatedNames.has(command.name)) {
                await guild.commands.delete(command.id);
                console.log(`Veraltete oder doppelte Server-Command-Registrierung entfernt: ${command.name} (${guild.id})`);
            }
        }
    }
};
