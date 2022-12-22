const { Client, Message, Permissions } = require("discord.js");
const { formatDuration, parseDuration } = require("../../utils/formats");

module.exports = {
    name: "seek",
    aliases: [],
    category: "Track",
    description: "Seeks to a certain point in the current playing track",
    utilisation: "{prefix}seek <time>",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    async execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        const botPermissionsFor = message.channel.permissionsFor(message.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + message.channel.name + "`");

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        if (!args[0]) return message.channel.send(client.emotes.error + " **A time is required**");

        let time = args[0];

        // Checks if a input is 0 because parseDuration returns 0 if input is invalid
        if (Number(time) === 0) {
            await serverQueue.play(serverQueue.tracks[0], time);
            return message.channel.send(client.emotes.seek + " **Set position to** `" + formatDuration(time) + "`");
        }

        // Returns time in milliseconds
        time = parseDuration(time);

        if (time === 0) return message.channel.send(client.emotes.error + " **Invalid format.** Example formats: `5:30`, `45s`, `1h24m`");

        if (serverQueue.tracks[0].isLive) return message.channel.send(client.emotes.error + " **Cannot seek a live song**");

        if (time > serverQueue.tracks[0].duration) return message.channel.send(client.emotes.error + "**Time cannot be longer than the song**");

        await serverQueue.play(serverQueue.tracks[0], time);
        message.channel.send(client.emotes.seek + " **Set position to** `" + formatDuration(time) + "`");
    }
}