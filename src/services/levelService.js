const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'levelService.json');
module.exports = (client, arg) => {
    function getFile() {
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
        } else {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
            pairs = [];
        }
        return pairs;
    }

    function writeFile(content) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    }

    return {
        getFile,
        writeFile
    };




}