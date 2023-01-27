const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { formatDuration, parseDuration } = require("../../utils/formats");

module.exports = {
    name: "scrub",
    aliases: ["sc", "seek"],
    category: "Music",
    description: "Scrubs to a certain position on the current playing song.",
    utilisation: "scrub <time>",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    async execute(client, message, args) {
        /**
         * @type {MusicSubscription}
         */
        const subscription = client.subscriptions.get(message.guild.id);

        const botPermissionsFor = message.channel.permissionsFor(message.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + message.channel.id + ">");


        if (!args[0]) return message.channel.send(client.emotes.error + " **A time is required**");


        if (!message.member.voice.channel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!subscription || !subscription.connection) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.**");

        if (subscription && subscription.connection && message.member.voice.channel.id !== subscription.voiceChannel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!subscription.isPlaying()) return message.channel.send(client.emotes.error + " **The player is not playing**");


        let time = args[0];

        // Checks if a input is 0 because parseDuration returns 0 if input is invalid
        if (Number(time) === 0) {
            await subscription.play(subscription.queue[0]);
            return message.channel.send(client.emotes.seek + " **Set position to** `" + formatDuration(time) + "`");
        }

        // Returns time in milliseconds
        time = parseDuration(time);

        if (time === 0) return message.channel.send(client.emotes.error + " **Error invalid format.** Example formats: `5:30`, `45s`, `1h24m`");

        if (subscription.queue[0].isLive) return message.channel.send(client.emotes.error + " **Cannot seek a live song**");

        if (time > subscription.queue[0].duration) return message.channel.send(client.emotes.error + "**Time cannot be longer than the song**");

        await subscription.play(subscription.queue[0], { seek: time });
        message.channel.send(client.emotes.seek + " **Set position to** `" + formatDuration(time) + "`");
    }
}