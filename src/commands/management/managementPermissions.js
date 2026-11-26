const {
    ApplicationCommandOptionType,
    MessageFlags,
    PermissionFlagsBits,
} = require('discord.js');
const guildService = require('../../services/guildService');

module.exports = {
    name: 'verwaltung-rechte',
    description: 'Verwaltet Rollen, die Serverfunktionen konfigurieren dürfen.',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'hinzufuegen',
            description: 'Erlaubt einer Rolle die Verwaltung.',
            options: [{
                type: ApplicationCommandOptionType.Role,
                name: 'rolle',
                description: 'Die berechtigte Rolle.',
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'entfernen',
            description: 'Entzieht einer Rolle die Verwaltungsberechtigung.',
            options: [{
                type: ApplicationCommandOptionType.Role,
                name: 'rolle',
                description: 'Die zu entfernende Rolle.',
                required: true,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'anzeigen',
            description: 'Zeigt die konfigurierten Verwaltungsrollen.',
        },
    ],

    callback: async (_client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const settings = await guildService.getGuild(interaction.guildId);
        const roleIds = settings?.managementRoleIds ?? [];
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'anzeigen') {
            return interaction.editReply(
                roleIds.length
                    ? roleIds.map((roleId) => `<@&${roleId}>`).join('\n')
                    : 'Es sind keine Verwaltungsrollen festgelegt; nur Administratoren dürfen konfigurieren.',
            );
        }

        const role = interaction.options.getRole('rolle');
        if (subcommand === 'hinzufuegen' && role.id === interaction.guild.id) {
            return interaction.editReply('Die @everyone-Rolle kann nicht als Verwaltungsrolle festgelegt werden.');
        }
        const updatedRoleIds = subcommand === 'hinzufuegen'
            ? [...new Set([...roleIds, role.id])]
            : roleIds.filter((roleId) => roleId !== role.id);
        await guildService.setManagementRoleIds(interaction.guild, updatedRoleIds);
        return interaction.editReply(
            subcommand === 'hinzufuegen'
                ? `${role} darf jetzt Levelrollen, Selbstrollen-Nachrichten und Willkommen verwalten.`
                : `${role} wurde aus den Verwaltungsrollen entfernt.`,
        );
    },
};
