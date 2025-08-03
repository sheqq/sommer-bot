const {Client, GuildMember} = require("discord.js");
const {storeColorRole, createRandomColor, createColorRole, getColorRole, removeColorRole} = require("../../utils/colorRoles");

/**
 *
 * @param {Client} client
 * @param {GuildMember} member
 */
module.exports = async (client, member) => {
    const currentColorRoleInJson = getColorRole(member.roles.color.hexColor)
    currentColorRoleInJson.amount--;
    if (currentColorRoleInJson.amount === 0) {
        // Rolle vom Server löschen
        const role = member.guild.roles.cache.get(currentColorRoleInJson.value.id);
        if (role) {
            await role.delete();
        }

        removeColorRole(member.guild, currentColorRoleInJson.key);
    }


}