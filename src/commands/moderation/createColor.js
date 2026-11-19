const { PermissionFlagsBits } = require('discord.js');
const { assignColorToMember, createRandomColor } = require('../../services/roleService');
const guildService = require('../../services/guildService');

module.exports = {
    name: 'create',
    description: 'Eine Farbrolle erstellen',
    options: [
        {
            name: 'farbe',
            description: 'Farbe der Rolle',
            type: 3,
            required: false,
        },
        {
            name: 'nutzer',
            description: 'welcher Nutzer bekommt die Rolle',
            type: 6,
            required: false,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: async (_client, interaction) => {
        if (!await guildService.areColorsEnabled(interaction.guildId)) {
            return interaction.reply({
                content: 'Farbrollen sind auf diesem Server deaktiviert.',
                ephemeral: true,
            });
        }

        const user = interaction.options.getUser('nutzer') || interaction.user;
        const guildMember = await interaction.guild.members.fetch(user.id);

        const color = interaction.options.getString('farbe') || createRandomColor();
        const { role, warnings } = await assignColorToMember(guildMember, color);

        for (const warning of warnings) {
            console.error(`Farbrolle für ${user.tag}:`, warning.message);
        }

        const warningText = warnings.length
            ? '\nDie bisherige Farbrolle konnte nicht vollständig gelöscht werden. Details stehen im Bot-Log.'
            : '';
        await interaction.reply({
            content: `Die Rolle **${role.name}** wurde erstellt/gewählt und ${user} zugewiesen.${warningText}`,
        });
    },
};