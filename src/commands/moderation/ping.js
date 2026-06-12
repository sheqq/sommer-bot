module.exports = {
    name: 'ping',
    description: 'Zeigt die Antwortzeit des Bots an',

    callback: async (client, interaction) => {
        const sent = await interaction.reply({
            content: 'Pinging...',
            fetchReply: true,
        });

        const responseTime = sent.createdTimestamp - interaction.createdTimestamp;
        const websocketPing = Math.round(client.ws.ping);

        await interaction.editReply(
            `Pong! Antwortzeit: **${responseTime}ms** | WebSocket: **${websocketPing}ms**`
        );
    },
};

