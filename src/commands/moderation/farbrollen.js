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
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: async (_client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (interaction.options.getSubcommand() === 'deaktivieren') {
            await guildService.setColorsEnabled(interaction.guild, false);
            const deletedRoles = await deleteAllColorRoles(interaction.guild);
            return interaction.editReply(
                `Farbrollen wurden deaktiviert. Alle ${deletedRoles} Farbrollen wurden gelöscht.`
            );
        }

        await guildService.setColorsEnabled(interaction.guild, true);
        const { assigned, eligible, failures, warnings } =
            await assignColorRolesToAllMembers(interaction.guild);

        for (const { member, error } of warnings) {
            console.error(`Farbrolle für ${member.user.tag}:`, error.message);
        }
        for (const { member, error } of failures) {
            console.error(`Farbrolle für ${member.user.tag} konnte nicht zugewiesen werden:`, error.message);
        }

        const result = failures.length
            ? `Farbrollen wurden aktiviert. ${assigned} von ${eligible} Mitgliedern erhielten eine Farbrolle; ` +
              `${failures.length} Zuweisungen sind fehlgeschlagen. Details stehen im Bot-Log.`
            : `Farbrollen wurden aktiviert. Alle ${assigned} Mitglieder erhielten eine neue Farbrolle.`;

        return interaction.editReply(result);
    },
};
