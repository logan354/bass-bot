module.exports = {
    name: "disconnect",
    aliases: ["dc", "leave", "dis"],
    category: "Track",
    description: "Disconnects the bot from the voice channel it is in.",    
    utilisation: "{prefix}disconnect",

    async execute(client, message, args) {
        let voiceChannel = message.guild.me.voice.channel;

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");

        try {
            client.queues.delete(message.guild.id);
            await voiceChannel.leave();
        } catch (ex) {
            console.log(ex);
            return message.channel.send(client.emotes.error + " **Error: Leaving:** `" + voiceChannel.name + "`");
        }
        message.channel.send(client.emotes.disconnect + " **Successfully disconnected**");
    }
}