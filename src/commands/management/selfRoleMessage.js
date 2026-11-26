const {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    MessageFlags,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
} = require('discord.js');
const guildService = require('../../services/guildService');
const selfRoleService = require('../../services/selfRoleService');

const roleOptions = Array.from({ length: 20 }, (_, index) => ({
    type: ApplicationCommandOptionType.Role,
    name: `rolle${index + 1}`,
    description: `Selbstrolle ${index + 1}.`,
    required: index === 0,
}));

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
    name: 'selbstrollen-nachricht',
    description: 'Erstellt eine Nachricht, über die Mitglieder Rollen umschalten können.',
    requiresGuildManagement: true,
    options: [
        {
            type: ApplicationCommandOptionType.Channel,
            name: 'kanal',
            description: 'Textkanal für die Selbstrollen-Nachricht.',
            required: true,
            channel_types: [0, 5],
        },
        ...roleOptions,
        {
            type: ApplicationCommandOptionType.String,
            name: 'titel',
            description: 'Überschrift der Nachricht.',
            required: false,
            max_length: 100,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'beschreibung',
            description: 'Kurze Anleitung zur Rollenauswahl.',
            required: false,
            max_length: 500,
        },
    ],

    callback: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.options.getChannel('kanal');
        const roles = roleOptions
            .map(({ name }) => interaction.options.getRole(name))
            .filter(Boolean);
        const uniqueRoles = [...new Map(roles.map((role) => [role.id, role])).values()];

        if (uniqueRoles.some((role) => !isRoleAssignable(interaction, role))) {
            return interaction.editReply(
                'Der Bot benötigt „Rollen verwalten“; alle ausgewählten Rollen müssen unter seiner höchsten Rolle liegen und dürfen nicht verwaltet sein.',
            );
        }

        const permissions = channel.permissionsFor(client.user);
        if (
            !channel.isTextBased() ||
            !permissions?.has(PermissionFlagsBits.SendMessages)
        ) {
            return interaction.editReply('Der Bot kann in diesem Kanal keine Nachrichten senden.');
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId(selfRoleService.customId)
            .setPlaceholder('Rollen auswählen, um sie hinzuzufügen oder zu entfernen')
            .setMinValues(1)
            .setMaxValues(uniqueRoles.length)
            .addOptions(uniqueRoles.map((role) => ({
                label: role.name,
                value: role.id,
            })));
        const content = [
            interaction.options.getString('titel'),
            interaction.options.getString('beschreibung') ||
                'Wähle die Rollen aus, die du hinzufügen oder entfernen möchtest. Jede Auswahl schaltet die Rolle um.',
        ].filter(Boolean).join('\n\n');

        let message;
        try {
            message = await channel.send({
                content,
                components: [new ActionRowBuilder().addComponents(menu)],
                allowedMentions: { parse: [] },
            });
            await guildService.addSelfRolePanel(interaction.guild, {
                channelId: channel.id,
                messageId: message.id,
                roleIds: uniqueRoles.map((role) => role.id),
            });
        } catch (error) {
            if (message) {
                try {
                    await message.delete();
                } catch (cleanupError) {
                    console.error('Nicht gespeicherte Selbstrollen-Nachricht konnte nicht gelöscht werden:', cleanupError);
                }
            }
            throw error;
        }

        return interaction.editReply(`Selbstrollen-Nachricht in ${channel} erstellt.`);
    },
};
