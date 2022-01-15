const { Client, Message } = require("discord.js");

module.exports = {
    name: "ping",
    aliases: [],
    category: "Utility",
    description: "Checks Bass response time to Discord",
    utilisation: "{prefix}ping",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        message.channel.send(client.emotes.ping + " Ping: **" + client.ws.ping + "ms**");
    }
}