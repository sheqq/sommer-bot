module.exports = {
    name: "avatar",
    description: "zeige dein Profilbild",

    callback: (client, interaction) => {
        interaction.reply({ content: interaction.user.displayAvatarURL({ dynamic: false, size: 2048 })});
    },
};