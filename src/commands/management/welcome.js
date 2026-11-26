const {
    ApplicationCommandOptionType,
    ChannelType,
    MessageFlags,
} = require('discord.js');
const guildService = require('../../services/guildService');

module.exports = {
    name: 'willkommen',
    description: 'Konfiguriert die Willkommensnachricht für neue Mitglieder.',
    requiresGuildManagement: true,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'setzen',
            description: 'Legt Kanal und Nachricht fest.',
            options: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'kanal',
                    description: 'Kanal, in dem neue Mitglieder begrüßt werden.',
                    required: true,
                    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'nachricht',
                    description: 'Text; Platzhalter: {user}, {username}, {server}, {memberCount}.',
                    required: true,
                    max_length: 1800,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'bild',
                    description: 'Optionale HTTPS-URL zu einem Bild.',
                    required: false,
                    max_length: 1000,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'deaktivieren',
            description: 'Deaktiviert die Willkommensnachricht.',
        },
    ],

    callback: async (_client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (interaction.options.getSubcommand() === 'deaktivieren') {
            await guildService.setWelcomeSettings(interaction.guild, null, null, null);
            return interaction.editReply('Die Willkommensnachricht wurde deaktiviert.');
        }

        const channel = interaction.options.getChannel('kanal');
        const message = interaction.options.getString('nachricht').trim();
        const imageUrl = interaction.options.getString('bild')?.trim() || null;
        if (!message) {
            return interaction.editReply('Die Willkommensnachricht darf nicht leer sein.');
        }

        if (imageUrl) {
            try {
                if (new URL(imageUrl).protocol !== 'https:') {
                    throw new Error('Das Bild muss über HTTPS erreichbar sein.');
                }
            } catch {
                return interaction.editReply('Bitte gib eine gültige Bild-URL mit HTTPS an.');
            }
        }

        await guildService.setWelcomeSettings(interaction.guild, channel.id, message, imageUrl);
        return interaction.editReply(
            `Willkommensnachricht für ${channel}${imageUrl ? ' mit Bild' : ''} gespeichert.`,
        );
    },
};
