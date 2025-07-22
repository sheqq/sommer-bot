const {Client, GuildMember} = require("discord.js");

/**
 *
 * @param {Client} client
 * @param {GuildMember} member
 */
module.exports = (client, member) => {

    function randomColor() {
        let color = '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
    }
}