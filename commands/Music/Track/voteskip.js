module.exports = {
    name: "voteskip",
    aliases: ["skip", "next", "s"],
    category: "Track",
    description: "Votes to skip the current playing song.",
    utilisation: "{prefix}voteskip",

    execute(client, message, args) {

        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        //Command Rules
        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");
        
        if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");


        client.player.skip(message)

    }
}

