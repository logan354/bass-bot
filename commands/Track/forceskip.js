module.exports = {
    name: "forceskip",
    aliases: ["fs", "fskip"],
    category: "Track",
    description: "Skips the current playing song immediately.",
    utilisation: "{prefix}forceskip <number>",

    async execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        const serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size; //Gets the amount of users in the Voice Channel (execpt bots)
        if (voiceChannelSize > 1) if (!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send(client.emotes.error + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");

        if (!isNaN(args[0])) {
            for (let i = 0; i < parseInt(args[0]) - 1; i++) {
                serverQueue.tracks.shift();
            }
            try {
                serverQueue.connection.dispatcher.end();
            } catch (ex) {
                console.log(ex);
                return message.channel.send(client.emotes.error + " **Error:** `Skipping`");
            }
            return message.channel.send(client.emotes.skip + " **Skipped " + args[0] + " songs**");
        }

        try {
            serverQueue.connection.dispatcher.end();
        } catch (ex) {
            console.log(ex);
            return message.channel.send(client.emotes.error + " **Error:** `Skipping`");
        }
        message.channel.send(client.emotes.skip + " **Skipped**");
    }
}
