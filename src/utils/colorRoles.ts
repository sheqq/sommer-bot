import {Colors, Guild} from "discord.js";

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'colorRoles.json');

function storeColorRole(color: any, roleId: any) {
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
        pairs.push({key: color, value: roleId, amount: 1});
    } else {
        pairs[index].amount += 1;
    }
    fs.writeFileSync(filePath, JSON.stringify(pairs, null, 2), 'utf8');
}

async function createColorRole(guild: Guild, color: any) {
    const botMember = guild.members.me;
    const highestBotRole = botMember.roles.highest;

    return await guild.roles.create({
        name: `` + color,
        color: color,
        position: highestBotRole.position, // möglichst weit oben
        reason: "Neue Farbrolle für neues Mitglied"
    });
}

function createRandomColor() {
    return '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}

function findColorRole(color) {
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

module.exports = { storeColorRole, createRandomColor, createColorRole, findColorRole };