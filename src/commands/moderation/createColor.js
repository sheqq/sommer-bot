const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { assignColorToMember, createRandomColor } = require('../../services/roleService');
const guildService = require('../../services/guildService');

module.exports = {
    name: 'farbrolle-erstellen',
    description: 'Erstellt oder verwendet eine Farbrolle für einen Nutzer.',
    options: [
        {
            name: 'farbe',
            description: 'HEX-Farbe; bestehende Farbrollen werden wiederverwendet.',
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
    callback: async (_client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const settings = await guildService.getGuild(interaction.guildId);
        if (!settings?.colorsEnabled) {
            return interaction.editReply('Farbrollen sind auf diesem Server deaktiviert.');
        }

        const invokingMember = await interaction.guild.members.fetch(interaction.user.id);
        const isAdministrator = invokingMember.permissions.has(
            PermissionFlagsBits.Administrator
        );
        const hasAllowedRole = (settings.createAllowedRoleIds ?? []).some(
            (roleId) => invokingMember.roles.cache.has(roleId)
        );
        if (!isAdministrator && !hasAllowedRole) {
            return interaction.editReply(
                'Du hast keine Berechtigung, den Befehl `/farbrolle-erstellen` zu verwenden.'
            );
        }

        const user = interaction.options.getUser('nutzer') || interaction.user;
        const guildMember = user.id === invokingMember.id
            ? invokingMember
            : await interaction.guild.members.fetch(user.id);

        const color = interaction.options.getString('farbe') || createRandomColor();
        const { role, warnings } = await assignColorToMember(
            guildMember,
            color,
            settings.maxColorRoles ?? 100
        );

        for (const warning of warnings) {
            console.error(`Farbrolle für ${user.tag}:`, warning.message);
        }

        const warningText = warnings.length
            ? '\nDie bisherige Farbrolle konnte nicht vollständig gelöscht werden. Details stehen im Bot-Log.'
            : '';
        await interaction.editReply({
            content: `Die Rolle **${role.name}** wurde erstellt/gewählt und ${user} zugewiesen.${warningText}`,
        });
    },
};