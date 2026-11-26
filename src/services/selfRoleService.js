const { MessageFlags } = require('discord.js');
const guildService = require('./guildService');

const customId = 'selbstrolle-umschalten';

async function handleSelection(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const settings = await guildService.getGuild(interaction.guildId);
    const panel = settings?.selfRolePanels?.find(
        (entry) => entry.messageId === interaction.message.id,
    );
    if (!panel) {
        return interaction.editReply('Diese Selbstrollen-Nachricht ist nicht mehr aktiv.');
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const changes = [];
    const failures = [];

    for (const roleId of new Set(interaction.values)) {
        if (!panel.roleIds.includes(roleId)) continue;

        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            failures.push(`Eine ausgewählte Rolle (${roleId}) existiert nicht mehr.`);
            continue;
        }

        try {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(role);
                changes.push(`-${role.name}`);
            } else {
                await member.roles.add(role);
                changes.push(`+${role.name}`);
            }
        } catch (error) {
            console.error(`Selbstrolle ${roleId} konnte nicht geändert werden:`, error?.message || error);
            failures.push(`„${role.name}“ konnte nicht geändert werden.`);
        }
    }

    const result = changes.length
        ? `Rollen geändert: ${changes.join(', ')}.`
        : 'Es wurden keine Rollen geändert.';
    const failureText = failures.length ? ` ${failures.join(' ')}` : '';
    return interaction.editReply(`${result}${failureText}`);
}

module.exports = {
    customId,
    handleSelection,
};
