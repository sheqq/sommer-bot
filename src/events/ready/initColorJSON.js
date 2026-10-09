const roleService = require('../../services/jsonService.js');
const service = roleService();

module.exports = async (client) => {
    console.log('Starte ColorRole Sync...');

    for (const guild of client.guilds.cache.values()) {
        await guild.roles.fetch();
        await guild.members.fetch();

        const colorRoles = guild.roles.cache.filter(role =>
            /^#[0-9A-F]{6}$/i.test(role.name)
        );

        for (const [, role] of colorRoles) {
            const amount = role.members.size;
            if (amount === 0) {
                service.removeEntry('colorRoles.json', role.name);
            } else {
                service.addEntry('colorRoles.json', role.name, String(amount));
            }
        }
    }

    console.log('ColorRole Sync abgeschlossen.');
};