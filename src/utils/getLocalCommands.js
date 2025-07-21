const path = require('path');
const getAllFiles = require('./getAllFiles');

module.exports = (exceptions = []) => {
    let localCommands = [];

    const commandCategories = getAllFiles(
        path.join(__dirname, '..', 'commands'),
        true
    );

    console.log(commandCategories.toString());

    for (const commandCategory of commandCategories) {
        const commandFiles = getAllFiles(commandCategory);

        for(commandFile of commandFiles) {
            const commandObject = require(commandFile);

            if(exceptions.includes(commandObject.name)) {
                continue;
            }
            console.log(commandObject);
            localCommands.push(commandObject);
        }

        console.log(commandFiles.toString());
    }

    return localCommands;
}