const {PermissionFlagsBits} = require("discord.js");
const {storeColorRole, createColorRole, createRandomColor, getColorRole} = require("../../utils/colorRoles.js");
module.exports = {
    name: "create",
    description: "eine Farbrolle erstellen",
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
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: async (client, interaction) => {

        const user = interaction.options.getUser("nutzer") || interaction.user;
        const guildMember = await interaction.guild.members.fetch(user.id);

        const color = interaction.options.getString("farbe") || createRandomColor();
        console.log(color);

        let role = await getColorRole(color);

        if(role == null) {
            role = await createColorRole(interaction.guild, color);

        }
        storeColorRole(color, role);

        // Rolle zuweisen
        await guildMember.roles.add(role);
        interaction.reply({content: `Die Rolle **${role.name}** wurde erstellt und ${user} zugewiesen.`});
    },
};