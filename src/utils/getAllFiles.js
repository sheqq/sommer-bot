const fs = require("fs");
const path = require("path");

module.exports = (directory, foldersOnly = false) => {
    if (!fs.existsSync(directory)) {
        return [];
    }

    const files = fs.readdirSync(directory, { withFileTypes: true });

    return files
        .filter((file) => (foldersOnly ? file.isDirectory() : file.isFile()))
        .map((file) => path.join(directory, file.name))
        .sort((a, b) => a.localeCompare(b));
};
