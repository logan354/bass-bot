const { MessageEmbed } = require("discord.js");

const QueryTypes = {
    // Playlists
    YOUTUBE_PLAYLIST: "youtube-playlist",
    SPOTIFY_ALBUM: "spotify-album",
    SPOTIFY_PLAYLIST: "spotify-playlist",
    SOUNDCLOUD_PLAYLIST: "soundcloud-playlist",
    // Videos
    YOUTUBE_VIDEO: "youtube-video",
    SPOTIFY_SONG: "spotify-song",
    SOUNDCLOUD_SONG: "soundcloud-song",
    // General Search
    YOUTUBE_VIDEO_SEARCH: "youtube-video-search",
    // Custom searches
    YOUTUBE_SEARCH: "youtube-search",
    SOUNDCLOUD_SEARCH: "soundcloud-search"
}

const QueryTypesRegex = {
    // Playlists
    YOUTUBE_PLAYLIST: /^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/,
    SPOTIFY_ALBUM: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/,
    SPOTIFY_PLAYLIST: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/,
    SOUNDCLOUD_PLAYLIST: /^https?:\/\/(soundcloud\.com|snd\.sc)\/([A-Za-z0-9_-]+)\/sets\/([A-Za-z0-9_-]+)\/?$/,
    // Videos
    YOUTUBE_VIDEO: /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi,
    SPOTIFY_SONG: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/,
    SOUNDCLOUD_SONG: /^https?:\/\/(soundcloud\.com)\/(.*)$/gi
}

const numberFormat = /^\d+$/;
const timeFormat = /^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})(?:\.(\d{3}))?$/;
const timeUnits = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
}

const formatInt = int => {
    if (int < 10) return `0${int}`;
    return `${int}`;
}

class Util {
    /**
     * Resolves query type
     * @param {string} query
     * @returns {string}
     */
    static resolveQueryType(query) {
        // Check if the query matches a playlist regex
        if (query.match(QueryTypesRegex.YOUTUBE_PLAYLIST)) return QueryTypes.YOUTUBE_PLAYLIST;
        if (query.match(QueryTypesRegex.SPOTIFY_ALBUM)) return QueryTypes.SPOTIFY_ALBUM;
        if (query.match(QueryTypesRegex.SPOTIFY_PLAYLIST)) return QueryTypes.SPOTIFY_PLAYLIST;
        if (query.match(QueryTypesRegex.SOUNDCLOUD_PLAYLIST)) return QueryTypes.SOUNDCLOUD_PLAYLIST;
        // Check if the query matches a video regex
        if (query.match(QueryTypesRegex.YOUTUBE_VIDEO)) return QueryTypes.YOUTUBE_VIDEO;
        if (query.match(QueryTypesRegex.SPOTIFY_SONG)) return QueryTypes.SPOTIFY_SONG;
        if (query.match(QueryTypesRegex.SOUNDCLOUD_SONG)) return QueryTypes.SOUNDCLOUD_SONG;
        // If playlist and video regex checks are false default to search
        return QueryTypes.YOUTUBE_VIDEO_SEARCH;
    }

    /**
     * Formats milliseconds to a formatted time 
     * e.g 0:30, 1:30, 2:15, 5:20
     * @param {number} milliseconds 
     * @returns {string}
     */
    static formatDuration(milliseconds) {
        if (!milliseconds || !parseInt(milliseconds)) return "0:00";
        const seconds = Math.floor(milliseconds % 60000 / 1000);
        const minutes = Math.floor(milliseconds % 3600000 / 60000);
        const hours = Math.floor(milliseconds / 3600000);
        if (hours > 0) {
            return `${hours}:${formatInt(minutes)}:${formatInt(seconds)}`;
        }
        if (minutes > 0) {
            return `${minutes}:${formatInt(seconds)}`;
        }
        return `0:${formatInt(seconds)}`;
    }

    /**
     * Formats milliseconds to formal time 
     * e.g 3 hours 2 minutes 30 seconds
     * @param {number} milliseconds 
     * @returns {string}
     */
    static formatFormalTime(milliseconds) {
        if (!milliseconds || !parseInt(milliseconds)) return undefined;
        const seconds = Math.floor(milliseconds % 60000 / 1000);
        const minutes = Math.floor(milliseconds % 3600000 / 60000);
        const hours = Math.floor(milliseconds / 3600000);
        const days = Math.floor(milliseconds / 86400000);
        if (days > 0) {
            return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
        }
        if (hours > 0) {
            return `${hours} hours ${minutes} minutes ${seconds} seconds`;
        }
        if (minutes > 0) {
            return `${minutes} minutes ${seconds} seconds`
        }
        return `${seconds} seconds`;
    }

    /**
     * Converts human friendly time to milliseconds. Supports the format
     * 00:00:00.000 for hours, minutes, seconds, and milliseconds respectively.
     * And 0ms, 0s, 0m, 0h, and together 1m1s.
     *
     * @param {number|string} time
     * @returns {number}
     */
    static parseDuration(time) {
        if (typeof time === "number") { return time * 1000; }
        if (numberFormat.test(time)) { return +time * 1000; }
        const firstFormat = timeFormat.exec(time);
        if (firstFormat) {
            return (+(firstFormat[1] || 0) * timeUnits.h) +
                (+(firstFormat[2] || 0) * timeUnits.m) +
                (+firstFormat[3] * timeUnits.s) +
                +(firstFormat[4] || 0);
        } else {
            let total = 0;
            const r = /(-?\d+)(ms|s|m|h)/g;
            let rs;
            while ((rs = r.exec(time)) !== null) {
                total += +rs[1] * timeUnits[rs[2]];
            }
            return total;
        };
    }
}

class Builders {
    // No color emebeds hex color: 2f3136

    /**
     * Builds track embeds
     * @param {import("./SearchEngine").Track} track
     * @param {object} queue
     * @returns {object}
     */
    static buildTrack(track, queue) {
        const embed = new MessageEmbed()
            .setColor("BLACK")
            .setAuthor("Added to queue", queue.client.emotes.player)
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
     * @param {import("./SearchEngine").Track[]} tracks
     * @param {import("./SearchEngine").Playlist} playlist
     * @param {object} queue
     * @returns {object}
     */
    static buildPlaylist(tracks, playlist, queue) {
        const embed = new MessageEmbed()
            .setColor("BLACK")
            .setAuthor("Playlist added to queue", queue.client.emotes.player)
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
}

const LoadType = {
    TRACK_LOADED: "TRACK_LOADED",
    PLAYLIST_LOADED: "PLAYLIST_LOADED",
    SEARCH_RESULT: "SEARCH_RESULT",
    LOAD_FAILED: "LOAD_FAILED",
    NO_MATCHES: "NO_MATCHES"
}

const State = {
    CONNECTED: "CONNECTED",
    CONNECTING: "CONNECTING",
    DISCONNECTED: "DISCONNECTED",
    DISCONNECTING: "DISCONNECTING",
    DESTROYING: "DESTROYING"
}

module.exports = { Builders, LoadType, State, QueryTypes, Util }