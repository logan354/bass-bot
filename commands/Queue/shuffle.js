module.exports = {
    name: "shuffle",
    aliases: ["random"],
    category: "Queue",
    description: "Shuffles the entire queue.",
    utilisation: "{prefix}shuffle",

    execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        const serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        const currentTrack = serverQueue.tracks.shift();

        for (let i = serverQueue.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [serverQueue.tracks[i], serverQueue.tracks[j]] = [serverQueue.tracks[j], serverQueue.tracks[i]];
        }

        serverQueue.tracks.unshift(currentTrack);
        message.channel.send(client.emotes.shuffle + " **Shuffled**");
    }
}