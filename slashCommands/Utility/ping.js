module.exports = {
    name: "ping",
    category: "Utility",
    description: "Checks the bot's response time to Discord.",
    utilisation: "{prefix}ping",
    permissions: {
        channel: [],
        member: [],
    },

    execute(client, interaction, args) {
        interaction.reply(client.emotes.ping + " Ping: **" + client.ws.ping + "ms**");
    }
}