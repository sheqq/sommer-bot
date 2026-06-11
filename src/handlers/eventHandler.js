const path = require('path');
const getAllFiles = require('../utils/getAllFiles');

module.exports = (client) => {
    const eventFolders = getAllFiles(path.join(__dirname, '..', 'events'), true);

    for (const eventFolder of eventFolders) {
        const eventFiles = getAllFiles(eventFolder).sort((a, b) => a.localeCompare(b));
        const eventName = path.basename(eventFolder);

        client.on(eventName, async (...args) => {
            for (const eventFile of eventFiles) {
                let eventFunction;

                try {
                    eventFunction = require(eventFile);
                } catch (error) {
                    console.error(`Konnte Event-Datei ${eventFile} nicht laden:`, error);
                    continue;
                }

                if (typeof eventFunction === 'function') {
                    await eventFunction(client, ...args);
                } else {
                    console.warn(`Event-Datei ${eventFile} exportiert keine Funktion.`);
                }
            }
        });
    }

};