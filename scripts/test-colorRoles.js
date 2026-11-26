const assert = require('assert');
const {
    assignColorRolesToAllMembers,
    deleteAllColorRoles,
} = require('../src/services/roleService');

async function run() {
    const highestBotRole = { comparePositionTo: () => 1, position: 10 };
    const botMember = {
        permissions: { has: () => true },
        roles: { highest: highestBotRole },
    };
    const members = [
        createMember('user-1', false),
        createMember('user-2', false),
        createMember('bot-1', true),
    ];
    const createOptions = [];
    let memberFetchAttempts = 0;
    const guild = {
        members: {
            me: botMember,
            fetch: async () => {
                memberFetchAttempts += 1;
                if (memberFetchAttempts === 1) {
                    const error = new Error('Gateway member request rate limited');
                    error.data = { opcode: 8, retry_after: 0.01 };
                    throw error;
                }
                return new Map(members.map((member) => [member.id, member]));
            },
        },
        roles: {
            cache: createCollection(),
            fetch: async () => {},
            create: async (options) => {
                createOptions.push(options);
                const role = {
                    id: `role-${guild.roles.cache.size + 1}`,
                    name: options.name,
                    guild,
                };
                guild.roles.cache.set(role.id, role);
                return role;
            },
        },
    };
    for (const member of members) {
        member.guild = guild;
    }

    const assigned = await assignColorRolesToAllMembers(guild);
    assert.strictEqual(memberFetchAttempts, 2);
    assert.strictEqual(assigned.assigned, 2);
    assert.strictEqual(assigned.eligible, 2);
    assert.strictEqual(assigned.failures.length, 0);
    assert.strictEqual(guild.roles.cache.size, 2);
    assert(createOptions.every((options) =>
        options.colors.primaryColor === options.name && !Object.hasOwn(options, 'color')
    ));
    assert.strictEqual(members[0].roles.cache.size, 1);
    assert.strictEqual(members[1].roles.cache.size, 1);
    assert.strictEqual(members[2].roles.cache.size, 0);

    const deleted = [];
    const colorRole = (id, name) => ({
        id,
        name,
        guild: {
            members: {
                me: botMember,
            },
        },
        delete: async () => deleted.push(id),
    });
    const roleCache = createCollection([
        colorRole('color-1', '#123456'),
        colorRole('color-2', '#ABCDEF'),
        colorRole('other', 'Moderator'),
    ]);
    const deletedCount = await deleteAllColorRoles({
        roles: {
            cache: roleCache,
            fetch: async () => {},
        },
    });

    assert.strictEqual(deletedCount, 2);
    assert.deepStrictEqual(deleted, ['color-1', 'color-2']);

    console.log('OK: Farbrollen-Aktivierung und -Deaktivierung geprüft.');
}

function createMember(id, bot) {
    return {
        id,
        user: { bot, tag: id },
        roles: {
            cache: new Map(),
            add: async function (role) {
                this.cache.set(role.id, role);
            },
        },
    };
}

function createCollection(entries = []) {
    const collection = new Map(entries.map((role) => [role.id, role]));
    collection.find = (callback) => [...collection.values()].find(callback);
    return collection;
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
