module.exports = {
    name: 'avatar',
    description: 'Zeigt dein Profilbild',

    callback: (client, interaction) => {
        interaction.reply({
            content: interaction.user.displayAvatarURL({ dynamic: false, size: 2048 }),
        });
    },
};