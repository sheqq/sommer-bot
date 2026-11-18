const roleService = require('../../services/roleService');

module.exports = async (client) => {
    for (const guild of client.guilds.cache.values()) {
        try {
            await guild.roles.fetch();
            await guild.members.fetch();
        } catch (error) {
            console.error(
                `Server-Cache für ${guild.id} konnte nicht initialisiert werden; ` +
                'leere Farbrollen werden nicht bereinigt:',
                error?.message || error
            );
            continue;
        }

        const emptyColorRoles = guild.roles.cache.filter(
            (role) => /^#[0-9A-F]{6}$/i.test(role.name) && role.members.size === 0
        );

        for (const [, role] of emptyColorRoles) {
            try {
                await roleService.deleteColorRole(
                    role,
                    'Keine Mitglieder mit dieser Farbrolle mehr'
                );
            } catch (error) {
                console.error(error.message);
            }
        }
    }

    console.log('Server-Cache initialisiert; Farbrollen geprüft.');
};
