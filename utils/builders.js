const { EmbedBuilder } = require("discord.js");

/**
 * Builds track embeds
 * @param {import("../structures/searchEngine").Track} track
 * @param {import("../structures/Queue")} queue
 * @returns {EmbedBuilder}
 */
function buildTrack(track, queue) {
    const embed = new EmbedBuilder()
        .setColor("Default")
        .setAuthor({
            name: "Added to queue",
            iconURL: queue.client.emotes.player
        })
        .setDescription(`**[${track.title}](${track.url})**`)
        .setThumbnail(track.thumbnail)
        .setFields(
            {
                name: "Channel",
                value: track.channel,
                inline: true
            },
            {
                name: "Track duration",
                value: track.durationFormatted,
                inline: true
            },
            {
                name: "Position in queue",
                value: `${queue.tracks.length - 1}`,
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
 * @param {import("../structures/Queue")} queue
 * @returns {EmbedBuilder}
 */
function buildPlaylist(tracks, playlist, queue) {
    const embed = new EmbedBuilder()
        .setColor("Default")
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
                value: "`" + tracks.length + "` tracks",
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