module.exports = {
    name: "resume",
    aliases: ["re", "res", "continue"],
    category: "Track",
    description: "Resumes paused music.",
    utilisation: "{prefix}resume",

    execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        const serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (serverQueue.playing === true) return message.channel.send(client.emotes.error + " **The player is not paused**");

        if (serverQueue.tracks.length === 0) {
            serverQueue.playing = true;
            return message.channel.send(client.emotes.resume + " **Resuming**");
        }

        try {
            //This is a bug in discord.js#5300
            serverQueue.connection.dispatcher.resume();
            serverQueue.connection.dispatcher.pause();
            serverQueue.connection.dispatcher.resume();
            serverQueue.playing = true;
        } catch (ex) {
            console.log(ex);
            return message.channel.send(client.emotes.error + " **Error:** `Resuming`");
        }
        message.channel.send(client.emotes.resume + " **Resuming**");
    }
}