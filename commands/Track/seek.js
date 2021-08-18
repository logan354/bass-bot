const { player } = require("../../structures/Player");
const { parseDuration, formatDuration } = require("../../utils/Formatting");

module.exports = {
    name: "seek",
    aliases: [],
    category: "Track",
    description: "Seeks to a certain point in the current track.",
    utilisation: "{prefix}seek <time>",

    execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        const serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!args[0]) return message.channel.send(client.emotes.error + " **Invalid usage:** `" + client.config.discord.prefix + "seek [Time in seconds]`");

        if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        let time = args[0];

        //Checks if a input is 0 because parseDuration returns 0 if input is invalid
        if (time === "0") {
            player(message, serverQueue.tracks[0], time);
            return message.channel.send(client.emotes.seek + " **Set position to** `" + formatDuration(time) + "`");
        }

        time = parseDuration(time); //Returns in milliseconds
        if (time === 0) return message.channel.send(client.emotes.error + " **Invalid format:** Example formats:\n\n`0:30` `1:30` `2:15` `5:20`");
        if (time > serverQueue.tracks[0].duration) return message.channel.send(client.emotes.error + "**Time cannot be longer than the song**");
        player(message, serverQueue.tracks[0], time);
        message.channel.send(client.emotes.seek + " **Set position to** `" + formatDuration(time) + "`");
    }
}