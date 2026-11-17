const roleService = require('../../services/roleService');
const { guildId } = require('../../../config.json');

module.exports = async (client) => {
    let guild;

    try {
        guild = await client.guilds.fetch(guildId);
        await guild.roles.fetch();
        await guild.members.fetch();
    } catch (error) {
        console.error(
            `Server-Cache für ${guildId} konnte nicht initialisiert werden; ` +
            'leere Farbrollen werden nicht bereinigt:',
            error?.message || error
        );
        return;
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

    console.log('Server-Cache initialisiert; Farbrollen geprüft.');
};
