const fs = require('fs');
const path = require('path');

// get add und remove hier implementieren
module.exports = () => {
    const resolveFilePath = (filename) => path.join(__dirname, '..', '..', 'data', filename);

    function migrateEntries(filename, entries) {
        if (filename === 'colorRoles.json') {
            const migrated = entries
                .map((entry) => {
                    const amount = Number(
                        typeof entry.value === 'object' ? entry.value?.amount : entry.value
                    ) || 0;

                    return amount > 0
                        ? { ...entry, value: String(amount) }
                        : null;
                })
                .filter(Boolean);

            return {
                entries: migrated,
                changed: JSON.stringify(migrated) !== JSON.stringify(entries),
            };
        }

        if (filename === 'levels.json') {
            const migrated = entries.map((entry) => {
                if (typeof entry.value !== 'object' || entry.value === null) {
                    return entry;
                }

                const level = Math.max(Number(entry.value.level) || 1, 1);
                const currentXp = Math.max(Number(entry.value.xp) || 0, 0);
                const completedLevelXp = 100 * ((level - 1) * level / 2);

                return {
                    ...entry,
                    value: String(completedLevelXp + currentXp),
                };
            });

            return {
                entries: migrated,
                changed: JSON.stringify(migrated) !== JSON.stringify(entries),
            };
        }

        return { entries, changed: false };
    }

    function getFile(filename) {
        const filePath = resolveFilePath(filename);

        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            if (!content.trim()) {
                return [];
            }

            try {
                const parsed = JSON.parse(content);
                if (!Array.isArray(parsed)) {
                    return [];
                }

                const migration = migrateEntries(filename, parsed);
                if (migration.changed) {
                    writeFile(migration.entries, filename);
                    console.log(`JSON-Daten migriert: ${filename}`);
                }

                return migration.entries;
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
