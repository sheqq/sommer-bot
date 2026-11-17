const jsonService = require('./jsonService')();

const LEVELS_FILE = 'levels.json';

module.exports = {
    getUserEntry(userId) {
        return jsonService.getEntry(LEVELS_FILE, userId);
    },

    getAllUserEntries() {
        return jsonService.getFile(LEVELS_FILE);
    },

    setUserXp(userId, xp) {
        return jsonService.addEntry(LEVELS_FILE, userId, String(xp));
    },

    removeUser(userId) {
        return jsonService.removeEntry(LEVELS_FILE, userId);
    },
};
