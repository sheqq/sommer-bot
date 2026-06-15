const fs = require('fs');
const path = require('path');

// get add und remove hier implementieren
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

    function getEntry(filename, key) {
        const entries = getFile(filename);
        return entries.find((entry) => entry.key === key) || null;
    }

    function addEntry(filename, key, value) {
        const entries = getFile(filename);
        const index = entries.findIndex((entry) => entry.key === key);

        if (index === -1) {
            entries.push({ key, value });
        } else {
            entries[index].value = value;
        }

        writeFile(entries, filename);
        return { key, value };
    }

    function removeEntry(filename, key) {
        const entries = getFile(filename);
        const index = entries.findIndex((entry) => entry.key === key);

        if (index === -1) {
            return null;
        }

        const removed = entries[index];
        entries.splice(index, 1);
        writeFile(entries, filename);
        return removed;
    }

    return {
        getFile,
        writeFile,
        getEntry,
        addEntry,
        removeEntry
    };
};
