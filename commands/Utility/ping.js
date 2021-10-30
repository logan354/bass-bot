module.exports = {
    name: "ping",
    aliases: [],
    category: "Utility",
    description: "Checks the bot's response time to Discord.",
    utilisation: "{prefix}ping",
    permissions: {
        channel: [],
        member: [],
    },

    execute(client, message, args) {
        message.channel.send(`${client.emotes.ping} Ping: **${client.ws.ping}ms**`);
    },

    slashCommand: {
        options: [],

        execute(client, interaction, args) {
            interaction.reply(`${client.emotes.ping} Ping: **${client.ws.ping}ms**`);
        }
    }
}
