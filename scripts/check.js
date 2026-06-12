const fs = require('fs');
const path = require('path');
const vm = require('vm');

function collectFiles(directory, predicate) {
    if (!fs.existsSync(directory)) {
        return [];
    }

    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...collectFiles(fullPath, predicate));
            continue;
        }

        if (predicate(fullPath)) {
            files.push(fullPath);
        }
    }

    return files;
}

function assertJsSyntax(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    new vm.Script(code, { filename: filePath });
}

function assertJsonSyntax(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
}

const root = path.resolve(__dirname, '..');
const jsFiles = collectFiles(path.join(root, 'src'), (filePath) => filePath.endsWith('.js'))
    .concat(collectFiles(path.join(root, 'scripts'), (filePath) => filePath.endsWith('.js')));
const jsonFiles = [
    path.join(root, 'package.json'),
    path.join(root, 'config.json'),
];

for (const filePath of jsFiles) {
    assertJsSyntax(filePath);
}

for (const filePath of jsonFiles) {
    if (fs.existsSync(filePath)) {
        assertJsonSyntax(filePath);
    }
}

console.log(`OK: ${jsFiles.length} JavaScript-Dateien und ${jsonFiles.filter(fs.existsSync).length} JSON-Dateien geprüft.`);

