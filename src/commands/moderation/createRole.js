const {PermissionFlagsBits} = require("discord.js");
const {storeColorRole, pairs} = require("../../utils/colorRoles.js");
const createRandomColor = require("../../utils/createRandomColor.js");
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
            type: 9,
            required: false,
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],

    callback: async (client, interaction) => {
        const color = interaction.options.getString("farbe") || createRandomColor();
        const user = interaction.options.getUser("nutzer") || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        const guild = interaction.guild;
        const botMember = guild.members.me;
        const highestBotRole = botMember.roles.highest;
        console.log(color);

        const role = await guild.roles.create({
            name: `` + color,
            color: color,
            position: highestBotRole.position, // möglichst weit oben
            reason: "Neue Farbrolle für neues Mitglied"
        });

        await member.roles.add(role);
        storeColorRole(color, role.id);
        interaction.reply({content: `Die Rolle **${role.name}** wurde erstellt und ${user} zugewiesen.`});
    },
};