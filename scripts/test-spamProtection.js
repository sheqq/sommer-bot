const assert = require('assert');
const Module = require('module');

let spamProtection = null;
let roleNumber = 0;
const roles = new Map();

function mockModule(modulePath, exports) {
    const resolvedPath = require.resolve(modulePath);
    const mockedModule = new Module(resolvedPath);
    mockedModule.filename = resolvedPath;
    mockedModule.loaded = true;
    mockedModule.exports = exports;
    require.cache[resolvedPath] = mockedModule;
}

mockModule('../src/services/guildService', {
    getGuild: async () => ({ spamProtection }),
    setSpamProtection: async (_guild, value) => {
        spamProtection = value;
        return value;
    },
});

const guild = {
    id: 'guild',
    channels: { cache: new Map() },
    members: {
        me: {
            permissions: { has: () => true },
        },
    },
    roles: {
        cache: roles,
        create: async ({ name }) => {
            const role = {
                id: `mute-role-${++roleNumber}`,
                name,
                members: new Map(),
                deleted: false,
                edit: async ({ name: newName }) => {
                    role.name = newName;
                },
                delete: async () => {
                    role.deleted = true;
                    roles.delete(role.id);
                },
            };
            roles.set(role.id, role);
            return role;
        },
    },
};

const spamProtectionService = require('../src/services/spamProtectionService');

function makeMember() {
    const memberRoleIds = new Set();
    const member = {
        id: 'member',
        user: { tag: 'member' },
        guild,
        roles: {
            cache: { has: (roleId) => memberRoleIds.has(roleId) },
            add: async (role) => {
                memberRoleIds.add(role.id);
                role.members.set(member.id, member);
            },
            remove: async (role) => {
                memberRoleIds.delete(role.id);
                role.members.delete(member.id);
            },
        },
    };
    return { member, memberRoleIds };
}

async function run() {
    const originalNow = Date.now;
    let now = 1000;
    Date.now = () => now;
    try {
        const configured = await spamProtectionService.configure(guild, 3, 'Stumm');
        assert.strictEqual(configured.messagesPerMinute, 3);
        assert.strictEqual(roles.size, 1);

        const { member, memberRoleIds } = makeMember();
        const message = {
            guild,
            member,
            author: { id: member.id, tag: member.user.tag },
        };
        assert.strictEqual(await spamProtectionService.checkMessage(message, spamProtection), false);
        now += 1000;
        assert.strictEqual(await spamProtectionService.checkMessage(message, spamProtection), false);
        now += 1000;
        assert.strictEqual(await spamProtectionService.checkMessage(message, spamProtection), true);

        const firstRole = roles.get(spamProtection.muteRoleId);
        assert(memberRoleIds.has(firstRole.id));
        assert.deepStrictEqual(spamProtection.mutedMemberIds, ['member']);

        const oldMember = {
            ...member,
            roles: { cache: { has: (roleId) => roleId === firstRole.id } },
        };
        const newMember = {
            ...member,
            roles: { cache: { has: () => false } },
        };
        await member.roles.remove(firstRole);
        await spamProtectionService.cleanupAfterRoleRemoval(oldMember, newMember);
        assert.strictEqual(firstRole.deleted, true);
        assert.strictEqual(spamProtection.muteRoleId, null);
        assert.deepStrictEqual(spamProtection.mutedMemberIds, []);

        now += 1000;
        await spamProtectionService.checkMessage(message, spamProtection);
        now += 1000;
        await spamProtectionService.checkMessage(message, spamProtection);
        now += 1000;
        assert.strictEqual(await spamProtectionService.checkMessage(message, spamProtection), true);
        assert.strictEqual(roleNumber, 2);
        assert.notStrictEqual(spamProtection.muteRoleId, firstRole.id);
    } finally {
        Date.now = originalNow;
    }

    console.log('OK: Nachrichtengrenze, Mute-Rolle, Leeren-Bereinigung und Neuanlage geprüft.');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
