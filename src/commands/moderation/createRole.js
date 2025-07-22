const {PermissionFlagsBits} = require("discord.js");
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

    callback: (client, interaction) => {
        const color = interaction.options.getString("color") || createRandomColor();
        console.log(color);
    },
};