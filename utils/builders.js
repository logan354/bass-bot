const { EmbedBuilder } = require("discord.js");
const MusicSubscription = require("../structures/MusicSubscription");

/**
 * Builds track embeds
 * @param {MusicSubscription} subscription
 * @param {import("../structures/searchEngine").Track} track
 * @returns {EmbedBuilder}
 */
function buildTrack(subscription, track) {
    const embed = new EmbedBuilder()
        .setColor("Default")
        .setAuthor({
            name: "Added to queue",
            iconURL: subscription.client.emotes.player
        })
        .setDescription(`**[${track.title}](${track.url})**`)
        .setFields(
            {
                name: "Channel",
                value: track.channel,
                inline: true
            },
            {
                name: "Song Duration",
                value: track.durationFormatted,
                inline: true
            },
            {
                name: "Position in queue",
                value: `${subscription.queue.length - 1}`,
                inline: true
            },
            {
                name: "\u200B",
                value: "**Requested by:** <@" + track.requestedBy + ">"
            }
        );

    return embed;
}

/**
 * Builds playlist embeds
 * @param {import("../structures/searchEngine").Track[]} tracks
 * @param {import("../structures/searchEngine").Playlist} playlist
 * @param {import("../structures/MusicSubscription")} queue
 * @returns {MessageEmbed}
 */
function buildPlaylist(tracks, playlist, queue) {
    const embed = new MessageEmbed()
        .setColor("BLACK")
        .setAuthor({
            name: "Playlist added to queue",
            iconURL: queue.client.emotes.player
        })
        .setDescription(`**[${playlist.title}](${playlist.url})**`)
        .setThumbnail(playlist.thumbnail)
        .setFields(
            {
                name: "Channel",
                value: playlist.channel,
                inline: true
            },
            {
                name: "Enqueued",
                value: "`" + tracks.length + "` songs",
                inline: true
            },
            {
                name: "Position in queue",
                value: `${queue.tracks.length - tracks.length}`,
                inline: true
            },
            {
                name: "\u200B",
                value: "**Requested by:** <@" + playlist.requestedBy + ">"
            }
        );

    return embed;
}

module.exports = { buildTrack, buildPlaylist }