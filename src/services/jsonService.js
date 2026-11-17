const fs = require('fs');
const path = require('path');

module.exports = (dataDirectory = path.join(__dirname, '..', '..', 'data')) => {
    const resolveFilePath = (filename) => path.join(dataDirectory, filename);
    const ensureParentDirectory = (filePath) => {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    };

    function validateEntries(entries, filename) {
        if (!Array.isArray(entries)) {
            throw new TypeError(`JSON-Datei "${filename}" muss ein Array enthalten.`);
        }

        entries.forEach((entry, index) => {
            if (
                !entry ||
                typeof entry !== 'object' ||
                Array.isArray(entry) ||
                typeof entry.key !== 'string' ||
                !Object.prototype.hasOwnProperty.call(entry, 'value') ||
                entry.value === undefined
            ) {
                throw new TypeError(
                    `Ungültiger Eintrag an Position ${index} in JSON-Datei "${filename}".`
                );
            }
        });

        return entries;
    }

    function getFile(filename) {
        const filePath = resolveFilePath(filename);

        if (!fs.existsSync(filePath)) {
            writeFile([], filename);
            return [];
        }

        let content;
        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Konnte JSON-Datei "${filename}" nicht lesen: ${error.message}`, {
                cause: error,
            });
        }

        if (!content.trim()) {
            throw new SyntaxError(`JSON-Datei "${filename}" ist leer; erwartet wurde ein JSON-Array.`);
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (error) {
            throw new SyntaxError(`Ungültiges JSON in "${filename}": ${error.message}`, {
                cause: error,
            });
        }

        return validateEntries(parsed, filename);
    }

    function writeFile(content, filename) {
        const filePath = resolveFilePath(filename);
        validateEntries(content, filename);

        try {
            ensureParentDirectory(filePath);
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        } catch (error) {
            throw new Error(`Konnte JSON-Datei "${filename}" nicht schreiben: ${error.message}`, {
                cause: error,
            });
        }
    }

    function getEntry(filename, key) {
        const entries = getFile(filename);
        return entries.find((entry) => entry.key === key) || null;
    }

    function addEntry(filename, key, value) {
        if (typeof key !== 'string' || !key || value === undefined) {
            throw new TypeError(`Ungültiger Schlüssel oder Wert für JSON-Datei "${filename}".`);
        }

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
        if (typeof key !== 'string' || !key) {
            throw new TypeError(`Ungültiger Schlüssel für JSON-Datei "${filename}".`);
        }

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
