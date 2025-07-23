const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'colorRoles.json');

function storeColorRole(color, roleId) {
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
    if(findColorRole(color) == null) {
        pairs.push({ key: color, value: roleId, amount: 1 });
    } else {

    }
    fs.writeFileSync(filePath, JSON.stringify(pairs, null, 2), 'utf8');
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

module.exports = { storeColorRole }