const { Client, Message, PermissionsBitField, EmbedBuilder } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { formatDuration } = require("../../utils/formats");
const { createProgressBar } = require("../../utils/progressBar");

module.exports = {
    name: "nowplaying",
    aliases: ["np"],
    category: "Track",
    description: "Shows the current playing song",
    utilisation: "nowplaying",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        /**
         * @type {MusicSubscription}
         */
        const subscription = client.subscriptions.get(message.guild.id);

        const botPermissionsFor = message.channel.permissionsFor(message.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + message.channel.id + ">");
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + message.channel.id + ">");

        if (!subscription || !subscription.connection) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.**");

        if (!subscription.queue.length) return message.channel.send(client.emotes.error + " **Nothing is in the queue**, let's get this party started! :tada:");

        if (!subscription.isPlaying()) return message.channel.send(client.emotes.error + " **The player is not playing**");

        const currentPlaybackDuration = subscription.audioPlayer.state.playbackDuration + subscription.metadata.additionalPlaybackDuration;

        const embed = new EmbedBuilder()
            .setColor("DarkGreen")
            .setAuthor({
                name: "Now Playing",
                iconURL: message.guild.iconURL()
            })
            .setDescription(`**[${subscription.queue[0].title}](${subscription.queue[0].url})**`)
            .setThumbnail(subscription.queue[0].thumbnail)
            .setFields(
                {
                    name: "Channel",
                    value: subscription.queue[0].channel,
                    inline: true
                },
                {
                    name: "Duration",
                    value: subscription.queue[0].durationFormatted,
                    inline: true
                },
                {
                    name: "Requested by",
                    value: "<@" + subscription.queue[0].requestedBy + ">",
                    inline: true
                },
                {
                    name: createProgressBar(currentPlaybackDuration, subscription.queue[0].duration),
                    value: "`" + formatDuration(currentPlaybackDuration) + "` **/** `" + subscription.queue[0].durationFormatted + "`",
                }
            );

        message.channel.send({ embeds: [embed] });
    }
}