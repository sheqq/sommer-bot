const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const guildService = require('../../services/guildService');
const {
    assignColorRolesToAllMembers,
    deleteAllColorRoles,
} = require('../../services/roleService');

module.exports = {
    name: 'farbrollen',
    description: 'Farbrollen verwalten; Deaktivieren löscht alle Farbrollen.',
    options: [
        {
            type: 1,
            name: 'aktivieren',
            description: 'Aktiviert Farbrollen und weist jedem Mitglied eine neue zu.',
        },
        {
            type: 1,
            name: 'deaktivieren',
            description: 'Deaktiviert Farbrollen und löscht alle Farbrollen.',
        },
        {
            type: 1,
            name: 'obergrenze',
            description: 'Legt die maximale Anzahl von Farbrollen fest.',
            options: [
                {
                    type: 4,
                    name: 'anzahl',
                    description: 'Maximale Anzahl von Farbrollen (1–250).',
                    required: true,
                    min_value: 1,
                    max_value: 250,
                },
            ],
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: async (_client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'obergrenze') {
            const maxColorRoles = interaction.options.getInteger('anzahl');
            await guildService.setMaxColorRoles(interaction.guild, maxColorRoles);
            return interaction.editReply(
                `Die Obergrenze für Farbrollen wurde auf ${maxColorRoles} gesetzt.`
            );
        }

        if (subcommand === 'deaktivieren') {
            await guildService.setColorsEnabled(interaction.guild, false);
            const deletedRoles = await deleteAllColorRoles(interaction.guild);
            return interaction.editReply(
                `Farbrollen wurden deaktiviert. Alle ${deletedRoles} Farbrollen wurden gelöscht.`
            );
        }

        const settings = await guildService.setColorsEnabled(interaction.guild, true);
        const { assigned, eligible, failures, warnings, skipped } =
            await assignColorRolesToAllMembers(
                interaction.guild,
                settings.maxColorRoles ?? 100
            );

        for (const { member, error } of warnings) {
            console.error(`Farbrolle für ${member.user.tag}:`, error.message);
        }
        for (const { member, error } of failures) {
            console.error(`Farbrolle für ${member.user.tag} konnte nicht zugewiesen werden:`, error.message);
        }

        let result = failures.length || skipped
            ? `Farbrollen wurden aktiviert. ${assigned} von ${eligible} Mitgliedern erhielten eine Farbrolle.`
            : `Farbrollen wurden aktiviert. Alle ${assigned} Mitglieder erhielten eine neue Farbrolle.`;
        if (failures.length) {
            result += ` ${failures.length} Zuweisungen sind fehlgeschlagen. Details stehen im Bot-Log.`;
        }
        if (skipped) {
            result += ` ${skipped} Mitglieder wurden wegen der Obergrenze von ${settings.maxColorRoles ?? 100} Farbrollen übersprungen.`;
        }

        return interaction.editReply(result);
    },
};
