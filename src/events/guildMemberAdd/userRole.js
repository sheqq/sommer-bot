const {Client, GuildMember} = require("discord.js");
const {storeColorRole, createRandomColor, createColorRole, getColorRole} = require("../../utils/colorRoles");

/**
 *
 * @param {Client} client
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {

    const color = createRandomColor();
    console.log(color);

    const key = await getColorRole(color);

    let role;
    if(key == null) {
        role = await createColorRole(member.guild, color);
    }
    storeColorRole(color, role);

    // Rolle zuweisen
    await member.roles.add(role);
}