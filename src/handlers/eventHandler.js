const path = require('path');
const getAllFiles = require('../utils/getAllFiles');

module.exports = (client) => {
    const eventFolders = getAllFiles(path.join(__dirname, '..' , 'events'), true);
    console.log(eventFolders.toString());

    for (const eventFolder of eventFolders) {
        const eventFiles = getAllFiles(eventFolder);
        eventFiles.sort((a, b) => a > b);

        const eventName = eventFolder.replace(/\\/g, '/').split('/').pop();



        client.on(eventName, async (arg) => {
            for (const eventFile of eventFiles) {
                const eventFunction = require(eventFile);
                // Prüfung hinzufügen
                if (typeof eventFunction === 'function') {
                    await eventFunction(client, arg);
                } else {
                    console.error(`Event file ${eventFile} does not export a function:`, typeof eventFunction);
                }
            }
        });
    }

};