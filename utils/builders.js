const { MessageEmbed } = require("discord.js");

/**
 * Builds track embeds
 * @param {import("../src/SearchEngine").Track} track
 * @param {import("../src/Queue").Queue} queue
 * @returns {MessageEmbed}
 */
function buildTrack(track, queue) {
    const embed = new MessageEmbed()
        .setColor("BLACK")
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
                name: "Song Duration",
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
 * @param {import("../src/SearchEngine").Track[]} tracks
 * @param {import("../src/SearchEngine").Playlist} playlist
 * @param {import("../src/Queue").Queue} queue
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