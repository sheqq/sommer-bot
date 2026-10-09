function getXp(value) {
    if (typeof value !== 'object' || value === null) {
        return Math.max(Number(value) || 0, 0);
    }

    const level = Math.max(Number(value.level) || 1, 1);
    const currentXp = Math.max(Number(value.xp) || 0, 0);
    const completedLevelXp = 100 * ((level - 1) * level / 2);

    return completedLevelXp + currentXp;
}

function getLevelFromXp(xp) {
    let level = 1;
    let remainingXp = Math.max(Number(xp) || 0, 0);
    let nextLevelXp = level * 100;

    while (remainingXp >= nextLevelXp) {
        remainingXp -= nextLevelXp;
        level += 1;
        nextLevelXp = level * 100;
    }

    return level;
}

function getXpProgress(xp) {
    let level = 1;
    let remainingXp = Math.max(Number(xp) || 0, 0);
    let nextLevelXp = level * 100;

    while (remainingXp >= nextLevelXp) {
        remainingXp -= nextLevelXp;
        level += 1;
        nextLevelXp = level * 100;
    }

    return { level, xp: remainingXp, nextLevelXp };
}

module.exports = {
    getXp,
    getLevelFromXp,
    getXpProgress,
};
