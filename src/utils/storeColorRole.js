const pairs = [];

function storeColorRole(color, roleId) {
    const obj = { key: color, value: roleId };
    pairs.push(obj);
    return obj;
}

module.exports = { storeColorRole, pairs };