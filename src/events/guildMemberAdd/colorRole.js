const {Client, GuildMember} = require("discord.js");
const createRandomColor = require("../../utils/createRandomColor.js");
const {storeColorRole, pairs} = require("../../utils/colorRoles");

/**
 *
 * @param {Client} client
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {
    // Rolle erstellen (ganz oben, direkt unter der höchsten Bot-Rolle)
    const guild = member.guild;
    const botMember = guild.members.me;
    const highestBotRole = botMember.roles.highest;
    const color = createRandomColor();
    console.log(color);

    const role = await guild.roles.create({
        name: ``+color,
        color: color,
        position: highestBotRole.position, // möglichst weit oben
        reason: "Neue Farbrolle für neues Mitglied"
    });

    // Rolle zuweisen
    await member.roles.add(role);
    storeColorRole(color, role.id);
}