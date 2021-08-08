module.exports = {
    name: "debug",
    aliases: [],
    category: "Utility",
    description: "Shows amount of voice channels the bot is in.",
    utilisation: "{prefix}debug",

    execute(client, message) {
        message.channel.send(client.emotes.success + " " + client.user.username + " connected in **" + client.voice.connections.size + "** voice channel(s)");
    }
}