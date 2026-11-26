const {
    ApplicationCommandOptionType,
    MessageFlags,
    PermissionFlagsBits,
} = require('discord.js');
const guildService = require('../../services/guildService');
const spamProtectionService = require('../../services/spamProtectionService');

module.exports = {
    name: 'spam-schutz',
    description: 'Konfiguriert Nachrichtenlimit und automatische Mute-Rolle.',
    requiresGuildManagement: true,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'setzen',
            description: 'Aktiviert den Spam-Schutz.',
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'nachrichten',
                    description: 'Maximale Nachrichten im rollierenden 60-Sekunden-Fenster.',
                    required: true,
                    min_value: 1,
                    max_value: 120,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'rollenname',
                    description: 'Name der automatisch eingerichteten Mute-Rolle.',
                    required: true,
                    min_length: 1,
                    max_length: 100,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'anzeigen',
            description: 'Zeigt die aktuelle Spam-Schutz-Konfiguration.',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'deaktivieren',
            description: 'Entfernt die Mute-Rolle und deaktiviert den Spam-Schutz.',
        },
    ],

    callback: async (_client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'anzeigen') {
            const settings = await guildService.getGuild(interaction.guildId);
            const protection = settings?.spamProtection;
            return interaction.editReply(
                protection
                    ? `Limit: **${protection.messagesPerMinute} Nachrichten pro 60 Sekunden**. Mute-Rolle: **${protection.muteRoleName}**.`
                    : 'Der Spam-Schutz ist deaktiviert.',
            );
        }

        if (subcommand === 'deaktivieren') {
            await spamProtectionService.disable(interaction.guild);
            return interaction.editReply('Spam-Schutz deaktiviert; die automatisch verwaltete Mute-Rolle wurde entfernt.');
        }

        const botMember = interaction.guild.members.me;
        if (
            !botMember?.permissions.has(PermissionFlagsBits.ManageRoles) ||
            !botMember.permissions.has(PermissionFlagsBits.ManageChannels)
        ) {
            return interaction.editReply('Der Bot benötigt „Rollen verwalten“ und „Kanäle verwalten“, um eine Mute-Rolle einzurichten.');
        }

        const messagesPerMinute = interaction.options.getInteger('nachrichten');
        const roleName = interaction.options.getString('rollenname').trim();
        const settings = await spamProtectionService.configure(
            interaction.guild,
            messagesPerMinute,
            roleName,
        );
        return interaction.editReply(
            `Spam-Schutz aktiv: Ab **${settings.messagesPerMinute} Nachrichten innerhalb von 60 Sekunden** erhält ein Mitglied die Mute-Rolle **${settings.muteRoleName}**.`,
        );
    },
};
