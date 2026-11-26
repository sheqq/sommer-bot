module.exports = async (client, globalCommands) => {
    const globalCommandNames = new Set(
        [...globalCommands.values()].map((command) => command.name)
    );

    for (const guild of client.guilds.cache.values()) {
        const guildCommands = await guild.commands.fetch();

        for (const command of guildCommands.values()) {
            if (globalCommandNames.has(command.name)) {
                await guild.commands.delete(command.id);
                console.log(`Doppelte Server-Command-Registrierung entfernt: ${command.name} (${guild.id})`);
            }
        }
    }
};
