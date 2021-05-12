module.exports = {
    name: 'ping',
    aliases: [],
    category: 'Utility',
    utilisation: '{prefix}ping',

    execute(client, message) {
        message.channel.send(`${client.emotes.ping} - Ping : **${client.ws.ping}ms** !`);
    },
};