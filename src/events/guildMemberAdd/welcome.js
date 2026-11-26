const guildService = require('../../services/guildService');

function formatWelcomeMessage(template, member) {
    return template
        .replaceAll('{user}', member.toString())
        .replaceAll('{username}', member.user.username)
        .replaceAll('{server}', member.guild.name)
        .replaceAll('{memberCount}', String(member.guild.memberCount));
}

module.exports = async (_client, member) => {
    let settings;
    try {
        settings = await guildService.getGuild(member.guild.id);
    } catch (error) {
        console.error(`Willkommenseinstellungen für Server ${member.guild.id} konnten nicht geladen werden:`, error?.message || error);
        return;
    }

    if (!settings?.welcomeChannelId || !settings.welcomeMessage) return;

    try {
        const channel = member.guild.channels.cache.get(settings.welcomeChannelId)
            || await member.guild.channels.fetch(settings.welcomeChannelId);
        if (!channel?.isTextBased()) {
            throw new Error('Der konfigurierte Willkommenskanal ist nicht verfügbar.');
        }

        const payload = {
            content: formatWelcomeMessage(settings.welcomeMessage, member),
            allowedMentions: { users: [member.id], roles: [], parse: [] },
        };
        if (settings.welcomeImageUrl) {
            payload.embeds = [{ image: { url: settings.welcomeImageUrl } }];
        }

        await channel.send(payload);
    } catch (error) {
        console.error(`Willkommensnachricht für ${member.user.tag} konnte nicht gesendet werden:`, error?.message || error);
    }
};

module.exports.formatWelcomeMessage = formatWelcomeMessage;
