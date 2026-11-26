const getLocalCommands = require('../utils/getLocalCommands');
const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const guildService = require('../services/guildService');
const selfRoleService = require('../services/selfRoleService');
const SELF_ROLE_MENU_ID = require('../services/selfRoleService').customId;

async function interactionHandler(client, interaction) {
    try {
        if (interaction.isStringSelectMenu() && interaction.customId === SELF_ROLE_MENU_ID) {
            await selfRoleService.handleSelection(interaction);
            return;
        }

        if (!interaction.isChatInputCommand()) return;
        const localCommands = getLocalCommands();
        const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName);

        if (!commandObject) return;

        if (typeof commandObject.callback !== 'function') {
            console.warn(`Command ${commandObject.name} hat keine callback-Funktion.`);
            return;
        }

        if (commandObject.permissionsRequired?.length) {
            const missingPermissions = commandObject.permissionsRequired.filter(
                (permission) => !interaction.memberPermissions?.has(permission)
            );

            if (missingPermissions.length > 0) {
                return interaction.reply({
                    content: `Du brauchst diese Berechtigungen für **${commandObject.name}**: ${commandObject.permissionsRequired.join(', ')}`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        if (commandObject.requiresGuildManagement) {
            if (!interaction.inGuild()) {
                return interaction.reply({
                    content: 'Dieser Befehl kann nur auf einem Server verwendet werden.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const isAdministrator = interaction.memberPermissions?.has(
                PermissionFlagsBits.Administrator,
            );
            if (!isAdministrator) {
                const settings = await guildService.getGuild(interaction.guildId);
                const allowedRoleIds = settings?.managementRoleIds ?? [];
                let memberRoles = interaction.member?.roles?.cache;
                if (!memberRoles) {
                    const member = await interaction.guild.members.fetch(interaction.user.id);
                    memberRoles = member.roles.cache;
                }

                const hasAllowedRole = allowedRoleIds.some((roleId) => memberRoles.has(roleId));
                if (!hasAllowedRole) {
                    return interaction.reply({
                        content: 'Du benötigst Administratorrechte oder eine konfigurierte Verwaltungsrolle.',
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }

        await commandObject.callback(client, interaction);
    } catch (error) {
        console.error(`Fehler beim Ausführen von Command ${interaction.commandName}:`, error);

        const errorMessage = `Fehler beim Ausführen des Commands: ${error?.message || 'Unbekannter Fehler'}`;
        try {
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else if (interaction.replied) {
                await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            }
        } catch (replyError) {
            console.error('Fehlermeldung konnte nicht an Discord gesendet werden:', replyError);
        }
    }
}

module.exports = interactionHandler;
