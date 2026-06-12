const fs = require('fs');
const path = require('path');

module.exports = () => {
    const resolveFilePath = (filename) => path.join(__dirname, '..', '..', 'data', filename);

    function getFile(filename) {
        const filePath = resolveFilePath(filename);

        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            if (!content.trim()) {
                return [];
            }

            try {
                const parsed = JSON.parse(content);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }

        try {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
        } catch (error) {
            console.error(`Konnte JSON-Datei nicht anlegen: ${filePath}`, error);
        }

        return [];
    }

    function writeFile(content, filename) {
        const filePath = resolveFilePath(filename);

        try {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        } catch (error) {
            console.error(`Konnte JSON-Datei nicht schreiben: ${filePath}`, error);
        }
    }

    return {
        getFile,
        writeFile
    };
};
