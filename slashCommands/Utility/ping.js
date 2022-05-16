const { Client, CommandInteraction, CommandInteractionOptionResolver } = require("discord.js");

module.exports = {
    name: "ping",
    category: "Utility",
    description: "Checks Bass's response time to Discord",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        interaction.reply(client.emotes.ping + " Ping: **" + client.ws.ping + "ms**");
    }
}