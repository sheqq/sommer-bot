const roleService = require('../../services/jsonService.js');
const service = roleService();

module.exports = {
    name: 'ready',
    once: true,

    async execute(client) {
        console.log(`${client.user.tag} ist online.`);

        for (const guild of client.guilds.cache.values()) {
            try {
                await guild.roles.fetch();
                await guild.members.fetch();

                const colorRoles = guild.roles.cache.filter(role =>
                    /^#[0-9A-F]{6}$/i.test(role.name)
                );

                let added = 0;
                let updated = 0;

                for (const [, role] of colorRoles) {
                    const memberCount = role.members.size;

                    const existing = service.getEntry(
                        'colorRoles.json',
                        role.name
                    );

                    if (!existing) {
                        service.addEntry('colorRoles.json', role.name, {
                            amount: memberCount
                        });

                        added++;
                        continue;
                    }

                    const storedAmount =
                        Number(existing.value?.amount) || 0;

                    if (storedAmount !== memberCount) {
                        service.addEntry('colorRoles.json', role.name, {
                            amount: memberCount
                        });

                        updated++;
                    }
                }

                console.log(
                    `[ColorRoleSync] ${guild.name}: ` +
                    `${colorRoles.size} Rollen gefunden, ` +
                    `${added} hinzugefügt, ` +
                    `${updated} aktualisiert`
                );
            } catch (error) {
                console.error(
                    `[ColorRoleSync] Fehler bei ${guild.name}:`,
                    error
                );
            }
        }
    }
};