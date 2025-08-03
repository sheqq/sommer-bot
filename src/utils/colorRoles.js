const roleService = require("../services/jsonService.js");
const service = roleService(null,null);

function storeColorRole(color, role) {
    let pairs = service.getFile('colorRoles.json');

    const index = pairs.findIndex(p => p.key === color);
    if (index === -1) {
        pairs.push({key: color, value: role, amount: 1});
    } else {
        pairs[index].amount += 1;
        // what happpens if the role is already inside the json file?
        // amount attribute needs to be implemented into each json object wich increases for users with the same color
    }
    service.writeFile(pairs, 'colorRoles.json');
}

async function createColorRole(guild, color) {
    const highestBotRole = guild.members.me.roles.highest;
    const position = highestBotRole.position;

    return await guild.roles.create({
        name: color,
        color: color,
        position: position, // möglichst weit oben
        reason: "Neue Farbrolle für neues Mitglied"
    });
}

function createRandomColor() {
    return '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}

function getColorRole(color) {
    const pairs = service.getFile('colorRoles.json');
    const pair = pairs.find(p => p.key === color);
    return pair ? pair : null;
}

function removeColorRole(guild, color) {
    let pairs = service.getFile('colorRoles.json');
    const index = pairs.findIndex(p => p.key === color);
    pairs.splice(index, 1);
    service.writeFile(pairs, 'colorRoles.json');
}

module.exports = { storeColorRole, createRandomColor, createColorRole, getColorRole, removeColorRole };