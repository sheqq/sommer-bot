const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const guildService = require('../../services/guildService');

module.exports = {
    name: 'farbrollen-rechte',
    description: 'Verwaltet Rollen, die /farbrolle-erstellen verwenden dürfen.',
    options: [
        {
            type: 1,
            name: 'hinzufuegen',
            description: 'Eine Rolle für /farbrolle-erstellen freischalten.',
            options: [
                {
                    type: 8,
                    name: 'rolle',
                    description: 'Freizuschaltende Rolle.',
                    required: true,
                },
            ],
        },
        {
            type: 1,
            name: 'entfernen',
            description: 'Einer Rolle die Berechtigung für /farbrolle-erstellen entziehen.',
            options: [
                {
                    type: 8,
                    name: 'rolle',
                    description: 'Zu entfernende Rolle.',
                    required: true,
                },
            ],
        },
        {
            type: 1,
            name: 'anzeigen',
            description: 'Zeigt alle freigeschalteten Rollen.',
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: async (_client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const settings = await guildService.getGuild(interaction.guildId);
        if (!settings) {
            return interaction.editReply('Dieser Server ist nicht in der API gespeichert.');
        }

        const allowedRoleIds = settings.createAllowedRoleIds ?? [];
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'anzeigen') {
            if (allowedRoleIds.length === 0) {
                return interaction.editReply(
                    'Es sind keine Rollen freigeschaltet. Nur Administratoren können `/farbrolle-erstellen` verwenden.'
                );
            }

            const roles = allowedRoleIds.map((roleId) => {
                const role = interaction.guild.roles.cache.get(roleId);
                return role ? `${role}` : `Gelöschte Rolle (${roleId})`;
            });
            return interaction.editReply(
                `Freigeschaltete Rollen für \`/farbrolle-erstellen\`:\n${roles.join('\n')}`
            );
        }

        const role = interaction.options.getRole('rolle');
        if (subcommand === 'hinzufuegen') {
            if (allowedRoleIds.includes(role.id)) {
                return interaction.editReply(`${role} ist bereits für \`/farbrolle-erstellen\` freigeschaltet.`);
            }

            await guildService.setCreateAllowedRoleIds(
                interaction.guild,
                [...allowedRoleIds, role.id]
            );
            return interaction.editReply(`${role} darf jetzt \`/farbrolle-erstellen\` verwenden.`);
        }

        if (!allowedRoleIds.includes(role.id)) {
            return interaction.editReply(`${role} war nicht für \`/farbrolle-erstellen\` freigeschaltet.`);
        }

        await guildService.setCreateAllowedRoleIds(
            interaction.guild,
            allowedRoleIds.filter((roleId) => roleId !== role.id)
        );
        return interaction.editReply(`${role} darf \`/farbrolle-erstellen\` nicht mehr verwenden.`);
    },
};
