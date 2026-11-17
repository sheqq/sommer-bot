module.exports = (client) => {
    console.log(`Logged in as ${client.user?.tag ?? 'unknown user'}!`);
};