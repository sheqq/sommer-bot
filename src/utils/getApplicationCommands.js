module.exports = async (client, guildId) => {
    const applicationCommands = guildId
        ? (await client.guilds.fetch(guildId)).commands
        : client.application.commands;

    await applicationCommands.fetch();
    return applicationCommands;
};