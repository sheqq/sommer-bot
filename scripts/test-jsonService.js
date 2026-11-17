const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const createJsonService = require('../src/services/jsonService');

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sommer-bot-json-'));

try {
    const service = createJsonService(dataDirectory);
    const filePath = path.join(dataDirectory, 'nested', 'entries.json');

    assert.deepStrictEqual(service.getFile(path.join('nested', 'entries.json')), []);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')), []);

    service.addEntry(path.join('nested', 'entries.json'), 'user-1', '100');
    assert.deepStrictEqual(service.getEntry(path.join('nested', 'entries.json'), 'user-1'), {
        key: 'user-1',
        value: '100',
    });

    service.removeEntry(path.join('nested', 'entries.json'), 'user-1');
    assert.deepStrictEqual(service.getFile(path.join('nested', 'entries.json')), []);

    fs.writeFileSync(filePath, '{invalid json', 'utf8');
    assert.throws(
        () => service.getFile(path.join('nested', 'entries.json')),
        /Ungültiges JSON/
    );
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), '{invalid json');

    fs.writeFileSync(filePath, '', 'utf8');
    assert.throws(
        () => service.getFile(path.join('nested', 'entries.json')),
        /ist leer/
    );

    fs.writeFileSync(filePath, JSON.stringify([{ key: 'missing-value' }]), 'utf8');
    assert.throws(
        () => service.getFile(path.join('nested', 'entries.json')),
        /Ungültiger Eintrag/
    );

    console.log('OK: JSON-Erstellung, Einträge und Fehlerbehandlung geprüft.');
} finally {
    fs.rmSync(dataDirectory, { recursive: true, force: true });
}
