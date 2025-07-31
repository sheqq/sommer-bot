const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'colorRoles.json');

function storeColorRole(color, role) {
    let pairs = [];
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.trim().length > 0) {
            try {
                const parsed = JSON.parse(content);
                pairs = Array.isArray(parsed) ? parsed : [];
            } catch {
                pairs = [];
            }
        }
    }
    const index = pairs.findIndex(p => p.key === color);
    if (index === -1) {

        pairs.push({key: color, value: role});
    } else {
        // what happpens if the role is already inside the json file?
        // amount attribute needs to be implemented into each json object wich increases for users with the same color
    }
    fs.writeFileSync(filePath, JSON.stringify(pairs, null, 2), 'utf8');
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
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.trim().length > 0) {
            try {
                const pairs = JSON.parse(content);
                const pair = pairs.find(p => p.key === color);
                return pair ? pair.value : null;
            } catch {
                return null;
            }
        }
    }
    return null;
}

module.exports = { storeColorRole, createRandomColor, createColorRole, getColorRole };