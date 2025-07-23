const pairs = [];

function storeColorRole(color, roleId) {
    const obj = {key: color, value: roleId};
    pairs.push(obj);
    console.log("storeColorRole:" + pairs.toString());
    pairs.forEach(pair => {`${pair.key} : ${pair.value}`});
    return obj;
}

module.exports = { storeColorRole }