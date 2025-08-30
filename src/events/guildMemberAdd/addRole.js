const {Client, GuildMember} = require("discord.js");
const {storeColorRole, createRandomColor, createColorRole, getColorRole} = require("../../utils/colorRoles");
const {userService} = require("../../services/userService");

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

    // User im Backend speichern / aktualisieren
    try {
        await userService.upsertDiscordMember(member, color);
    } catch (e) {
        console.error('Konnte Member nicht speichern:', e.message);
    }
}