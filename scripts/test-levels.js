const assert = require('assert');
const {
    getLevelFromXp,
    getXpProgress,
    getLevelProgress,
} = require('../src/utils/levels');

assert.strictEqual(getLevelFromXp(0), 1);
assert.strictEqual(getLevelFromXp(99), 1);
assert.strictEqual(getLevelFromXp(100), 2);
assert.strictEqual(getLevelFromXp(299), 2);
assert.strictEqual(getLevelFromXp(300), 3);
assert.strictEqual(getLevelFromXp(600), 4);

assert.deepStrictEqual(getXpProgress(300), {
    level: 3,
    xp: 0,
    nextLevelXp: 300,
});
assert.deepStrictEqual(getXpProgress(350), {
    level: 3,
    xp: 50,
    nextLevelXp: 300,
});

assert.deepStrictEqual(getLevelProgress({ level: 2, xp: 50 }), {
    level: 2,
    xp: 50,
    nextLevelXp: 200,
});
assert.deepStrictEqual(getLevelProgress({ xp: 350 }), {
    level: 3,
    xp: 50,
    nextLevelXp: 300,
});

console.log('OK: Levelaufstiege benötigen Level * 100 XP und XP werden je Level zurückgesetzt.');
