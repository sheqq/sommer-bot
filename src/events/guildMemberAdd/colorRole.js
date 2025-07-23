const {Client, GuildMember} = require("discord.js");
const {storeColorRole, createRandomColor, createColorRole, findColorRole} = require("../../utils/colorRoles");

/**
 *
 * @param {Client} client
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {

    const color = createRandomColor();
    console.log(color);

    const key = await findColorRole(color);

    let role;
    if(key == null) {
        role = createColorRole(member.guild, color);
    }
    storeColorRole(color, role.id);

    // Rolle zuweisen
    await member.roles.add(role);
}