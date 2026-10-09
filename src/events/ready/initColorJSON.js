const roleService = require('../../services/jsonService.js');
const service = roleService();

module.exports = async (client) => {
    console.log('Starte ColorRole Sync...');
    const colorRoleCounts = new Map();

    for (const guild of client.guilds.cache.values()) {
        await guild.roles.fetch();
        await guild.members.fetch();

        const colorRoles = guild.roles.cache.filter(role =>
            /^#[0-9A-F]{6}$/i.test(role.name)
        );

        for (const [, role] of colorRoles) {
            const amount = role.members.size;

            if (amount === 0) {
                try {
                    await role.delete('Keine Mitglieder mit dieser Farbrolle mehr');
                } catch (error) {
                    console.error(`Konnte leere Farbrolle ${role.name} nicht löschen:`, error?.message || error);
                }
                continue;
            }

            colorRoleCounts.set(
                role.name,
                (colorRoleCounts.get(role.name) || 0) + amount
            );
        }
    }

    service.writeFile(
        [...colorRoleCounts.entries()].map(([key, amount]) => ({
            key,
            value: String(amount),
        })),
        'colorRoles.json'
    );

    console.log('ColorRole Sync abgeschlossen.');
};