const {Client, GuildMember} = require("discord.js");
const {storeColorRole, createRandomColor, createColorRole, getColorRole} = require("../../utils/colorRoles");

/**
 *
 * @param {Client} client
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {

    if (member.user.bot) return;
    const color = createRandomColor();
    console.log(color);

    const colorRoleResult = await getColorRole(color);
    let role = colorRoleResult ? colorRoleResult.value : null;

    if(role == null) {
        role = await createColorRole(member.guild, color);
    }
    await storeColorRole(color, role);

    // Rolle zuweisen
    await member.roles.add(role);

}