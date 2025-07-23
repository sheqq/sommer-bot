const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'colorRoles.json');

function colorRoles(color, roleId) {
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
    pairs.push({ key: color, value: roleId });
    fs.writeFileSync(filePath, JSON.stringify(pairs, null, 2), 'utf8');
}

module.exports = { storeColorRole: colorRoles }