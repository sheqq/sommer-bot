const {
    ApplicationCommandOptionType,
    MessageFlags,
    PermissionFlagsBits,
} = require('discord.js');
const guildService = require('../../services/guildService');

function isRoleAssignable(interaction, role) {
    const botMember = interaction.guild.members.me;
    const botRole = botMember?.roles.highest;
    return botMember?.permissions.has(PermissionFlagsBits.ManageRoles) === true &&
        role.id !== interaction.guild.id &&
        !role.managed &&
        botRole &&
        role.comparePositionTo(botRole) < 0;
}

module.exports = {
    name: 'levelrolle',
    description: 'Verknüpft Serverrollen mit erreichten Leveln.',
    requiresGuildManagement: true,
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'hinzufuegen',
            description: 'Vergibt eine Rolle ab einem bestimmten Level.',
            options: [
                {
                    type: ApplicationCommandOptionType.Role,
                    name: 'rolle',
                    description: 'Die Levelrolle.',
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'level',
                    description: 'Level, ab dem die Rolle vergeben wird.',
                    required: true,
                    min_value: 1,
                    max_value: 1000,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'entfernen',
            description: 'Entfernt eine Levelrollen-Verknüpfung.',
            options: [
                {
                    type: ApplicationCommandOptionType.Role,
                    name: 'rolle',
                    description: 'Die zu entfernende Levelrolle.',
                    required: true,
                },
            ],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'anzeigen',
            description: 'Zeigt alle Levelrollen-Verknüpfungen.',
        },
    ],

    callback: async (_client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const settings = await guildService.getGuild(interaction.guildId);
        const levelRoles = settings?.levelRoles ?? [];
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'anzeigen') {
            const mappings = levelRoles
                .slice()
                .sort((a, b) => a.level - b.level)
                .map(({ level, roleId }) => `Level ${level}: <@&${roleId}>`);
            return interaction.editReply(
                mappings.length ? mappings.join('\n') : 'Es sind noch keine Levelrollen konfiguriert.',
            );
        }

        const role = interaction.options.getRole('rolle');
        if (subcommand === 'entfernen') {
            const updated = levelRoles.filter((entry) => entry.roleId !== role.id);
            if (updated.length === levelRoles.length) {
                return interaction.editReply('Diese Rolle ist keiner Levelstufe zugeordnet.');
            }
            await guildService.setLevelRoles(interaction.guild, updated);
            return interaction.editReply(`Die Levelrollen-Verknüpfung für ${role} wurde entfernt.`);
        }

        if (!isRoleAssignable(interaction, role)) {
            return interaction.editReply(
                'Der Bot benötigt „Rollen verwalten“; die Rolle muss unter seiner höchsten Rolle liegen und darf nicht verwaltet sein.',
            );
        }

        const level = interaction.options.getInteger('level');
        const updated = [
            ...levelRoles.filter((entry) => entry.roleId !== role.id),
            { level, roleId: role.id },
        ];
        await guildService.setLevelRoles(interaction.guild, updated);
        return interaction.editReply(`${role} wird ab Level ${level} vergeben.`);
    },
};
