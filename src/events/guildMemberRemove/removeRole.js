const {Client, GuildMember} = require("discord.js");
const {storeColorRole, createRandomColor, createColorRole, getColorRole, removeColorRole} = require("../../utils/colorRoles");

/**
 *
 * @param {Client} client
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {
    const currentColorRoleInJson = getColorRole(member.roles.color)
    currentColorRoleInJson.amount--;
    if (currentColorRoleInJson.amount === 0) {
        removeColorRole(member.guild, currentColorRoleInJson.key);
    }
}