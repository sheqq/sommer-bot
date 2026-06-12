const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Zeigt dein Profilbild oder das eines anderen Nutzers',
    options: [
        {
            name: 'nutzer',
            description: 'Nutzer, dessen Avatar angezeigt werden soll',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],

    callback: async (client, interaction) => {
        const targetUser = interaction.options.getUser('nutzer') || interaction.user;

        try {
            await interaction.reply({
                content: targetUser.displayAvatarURL({ dynamic: false, size: 2048 }),
            });
        } catch (error) {
            console.error('Fehler beim Avatar-Befehl:', error);
        }
    },
};