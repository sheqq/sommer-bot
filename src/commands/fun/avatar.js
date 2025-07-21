module.exports = {
    name: "avatar",
    description: "Profilbild",

    callback: (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user;
        interaction.reply({ content: user.displayAvatarURL({ dynamic: false, size: 2048 })});
    }
};