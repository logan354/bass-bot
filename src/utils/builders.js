const { MessageEmbed } = require("discord.js");

/**
 * Builds track embeds
 * @param {Object} client Discord.js client object
 * @param {Object} queue The queue this track is pushed to
 * @param {Object} track Track data
 * @returns {Object}
 */
function buildTrack(client, queue, track) {
    const embed = new MessageEmbed()
        .setColor("2f3136")
        .setAuthor("Added to queue", client.emotes.player)
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
                value: queue.tracks.length - 1,
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
 * @param {Object} data Discord.js client object
 * @param {Object} queue The queue this track is pushed to
 * @param {Object} playlist Playlist data
 * @returns {Object}
 */
function buildPlaylist(client, queue, playlist) {
    const embed = new MessageEmbed()
        .setColor("2f3136")
        .setAuthor("Playlist added to queue", client.emotes.player)
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
                value: "`" + playlist.tracks.length + "` songs",
                inline: true
            },
            {
                name: "Position in queue",
                value: queue.tracks.length - playlist.tracks.length,
                inline: true
            },
            {
                name: "\u200B",
                value: "**Requested by:** <@" + playlist.requestedBy + ">"
            }
        );

    return embed;
}

/**
 * Builds now playing messages
 * @param {Object} client Discord.js client object
 * @param {Object} queue The queue this track is pushed to
 * @param {Object} track Track data
 * @returns {string}
 */
function buildNowPlaying(client, queue, track) {
    return client.emotes.playerFrozen + " **Now Playing** `" + track.title + "`";
}

module.exports = { buildTrack, buildPlaylist, buildNowPlaying}