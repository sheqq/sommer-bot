const fs = require('fs');
const path = require('path');

module.exports = (client, arg) => {
    function getFile(filename) {
        const filePath = path.join(__dirname, filename);
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

    function writeFile(content, filename) {
        const filePath = path.join(__dirname, filename);
        if(fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        } else {
            console.log("can not find file " + filename);
        }
    }

    return {
        getFile,
        writeFile
    };




}