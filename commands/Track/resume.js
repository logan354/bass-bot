module.exports = {
    name: "resume",
    aliases: ["re", "res", "continue"],
    category: "Track",
    description: "Resumes paused music.",
    utilisation: "{prefix}resume",
    permissions: {
        channel: [],
        member: [],
    },

    execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (serverQueue.paused === false) return message.channel.send(client.emotes.error + " **The player is not paused**");

        serverQueue.streamDispatcher.audioPlayer.unpause();
        serverQueue.paused = false;
        message.channel.send(client.emotes.resume + " **Resuming**");
    }
}