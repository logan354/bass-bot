const { Client, Message } = require("discord.js");

module.exports = {
    name: "ping",
    aliases: [],
    category: "Utility",
    description: "Checks Bass's response time to Discord",
    utilisation: "{prefix}ping",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);

        message.channel.send(client.emotes.ping + " Ping: **" + client.ws.ping + "ms**");
    }
}