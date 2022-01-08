module.exports = {
    name: "disconnect",
    aliases: ["dc", "leave", "dis"],
    category: "Track",
    description: "Disconnects Bass from the voice channel",
    utilisation: "{prefix}disconnect",
    permissions: {
        channel: [],
        member: [],
    },

    execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        serverQueue.destroy();
        message.channel.send(client.emotes.disconnect + " **Successfully disconnected**");
    }
}