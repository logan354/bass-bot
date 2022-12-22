const { Client, Snowflake, TextChannel, VoiceChannel, User } = require("discord.js");
const { State, QueryTypes, LoadType } = require("../utils/constants");
const { searchEngine } = require("./searchEngine");
const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioResource, StreamType } = require("@discordjs/voice");
const StreamDispatcher = require("./StreamDispatcher");
const play = require("play-dl");
const { FFmpeg } = require("prism-media");
const ytdl = require("discord-ytdl-core");
const scdl = require("soundcloud-downloader").default;

class Queue {
    /**
     * Queue constructor
     * @param {Client} client
     */
    constructor(client, guildId, textChannel) {
        /**
         * Client bound to this queue
         * @type {Client}
         */
        this.client = client

        /**
         * State of this queue
         * @type {State}
         */
        this.state = State.DISCONNECTED;

        /**
         * Guild id of this queue
         * @type {Snowflake}
         */
        this.guildId = guildId;

        /**
         * Text channel bound to this queue
         * @type {TextChannel}
         */
        this.textChannel = textChannel;

        /**
         * Voice channel bound to this queue
         * @type {?VoiceChannel}
         */
        this.voiceChannel = null;

        /**
         * Stream dispatcher of this queue
         * @type {?StreamDispatcher}
         */
        this.streamDispatcher = null;

        /**
         * Tracks of this queue
         * @type {import("./searchEngine").Track[]}
         */
        this.tracks = [];

        /**
         * Skiplist of this queue
         * @type {Snowflake[]}
         */
        this.skiplist = [];

        /**
         * Paused mode of this queue
         * @type {boolean}
         */
        this.paused = false;

        /**
         * Loop mode of this queue
         * @type {boolean}
         */
        this.loop = false;

        /**
         * Loop queue mode of this queue
         * @type {boolean}
         */
        this.loopQueue = false;

        /**
         * Volume of this queue
         * @type {number}
         */
        this.volume = 100;

        /**
         * Additional stream time of this queue
         * @type {?number}
         */
        this.additionalStreamTime = null;


        if (this.client.queues.has(guildId)) {
            return this.client.queues.get(guildId);
        }
        else {
            this.client.queues.set(guildId, this);
        }
    }

    /**
     * Shortcut to the search engine on the queue itself.
     * @param {string} query
     * @param {User} requester
     * @param {import("./searchEngine").SearchEngineOptions} options 
     * @returns {import("./searchEngine").SearchResult}
     */
    async search(query, requester, options) {
        return await searchEngine(query, requester, options);
    }

    /**
     * Connect to the voice or stage channel
     * @param {VoiceChannel} channel
     * @returns {Queue} 
     */
    async connect(channel) {
        this.state = State.CONNECTING;

        /**
         * Here, we try to establish a connection to a voice channel. If we're already connected
         * to this voice channel, @discordjs/voice will just return the existing connection for us!
         */
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
        } catch (e) {
            connection.destroy();
            throw e;
        }

        if (!this.streamDispatcher) {
            this.streamDispatcher = new StreamDispatcher(this, connection);

            connection.on("error", (e) => {
                console.error(e);
                this.textChannel.send(this.client.emotes.error + " **Error(VoiceConnectionError):** `" + e.message + "`");
            });

            this.streamDispatcher.on("start", (track) => {
                if (!this.additionalStreamTime) this.textChannel.send(this.client.emotes.playing + " **Now Playing** `" + track.title + "`");
            });

            this.streamDispatcher.on("finish", (track) => {
                this.skiplist = [];
                this.additionalStreamTime = null;

                if (this.loop) {
                    this.play(this.tracks[0]);
                } else if (this.loopQueue) {
                    const shiffed = this.tracks.shift();
                    this.tracks.push(shiffed);
                    this.play(this.tracks[0]);
                } else {
                    this.tracks.shift();
                    this.play(this.tracks[0]);
                }
            });

            this.streamDispatcher.on("error", (e) => {
                console.error(e);
                this.textChannel.send(this.client.emotes.error + " **Error(AudioPlayerError):** `" + e.message + "`");
            });
        }

        this.voiceChannel = channel;
        this.state = State.CONNECTED;
        return this;
    }

    /**
     * Disconnects from the voice or stage channel
     * @returns {Queue}
     */
    disconnect() {
        if (this.voiceChannel === null) return this;
        this.state = State.DISCONNECTING;

        this.streamDispatcher.voiceConnection.destroy();

        this.voiceChannel = null;
        this.state = State.DISCONNECTED;
        return this;
    }

    /**
     * Destroys the queue
     */
    destroy(disconnect = true) {
        this.state = State.DESTROYING;
        if (disconnect) {
            this.disconnect();
        }

        this.client.queues.delete(this.guildId);
    }

    /**
     * Create readable stream and plays it on the audio player
     * @param {import("./searchEngine").Track} track 
     * @param {number} [seek]
     */
    async play(track = this.tracks[0], seek) {
        if (!track) {
            return;
        }

        let stream = null;
        let streamType = null;
        let bufferTimeout = 0;

        try {
            if (track.source === "youtube" || track.source === "spotify") {
                if (track.source === "spotify") {
                    const res = await searchEngine(track.channel + " - " + track.title, track.requestedBy, { queryType: QueryTypes.YOUTUBE_SEARCH });
                    if (res.loadType === LoadType.SEARCH_RESULT) {
                        track.title = res.tracks[0].title;
                        track.streamURL = res.tracks[0].url
                        track.duration = res.tracks[0].duration;
                        track.durationFormatted = res.tracks[0].durationFormatted;
                        track.isLive = res.tracks[0].live;
                    }
                    else if (res.loadType === LoadType.NO_MATCHES) {
                        this.tracks.shift();
                        this.play(this.tracks[0]);
                        return this.textChannel.send(client.emotes.error + " **No results found**");
                    }
                    else if (res.loadType === LoadType.LOAD_FAILED) {
                        this.tracks.shift();
                        this.play(this.tracks[0]);
                        return this.textChannel.send(client.emotes.error + " **Error searching** `" + res.exception.message + "`");
                    }
                }

                // Track info from play-dl
                const info = await play.video_info(track.streamURL);

                if (seek) {
                    const FFMPEG_OPUS_ARGUMENTS = [
                        "-analyzeduration",
                        "0",
                        "-loglevel",
                        "0",
                        "-acodec",
                        "libopus",
                        "-f",
                        "opus",
                        "-ar",
                        "48000",
                        "-ac",
                        "2",
                    ];

                    const highestaudio = info.format[info.format.length - 1].url;

                    const final_args = [];

                    final_args.push("-ss", `${(seek / 1000).toString()}`, "-accurate_seek"); // Seeks 5 second in audio. You can also use hh:mm:ss format.
                    final_args.push("-i", highestaudio);
                    final_args.push(...FFMPEG_OPUS_ARGUMENTS);

                    // Create readable stream from FFmpeg
                    const ffmpeg_instance = new FFmpeg({
                        args: final_args,
                    });

                    stream = ffmpeg_instance;
                    streamType = StreamType.OggOpus;

                    this.additionalStreamTime = seek;
                } else {
                    // Create readable stream from play-dl
                    const play_instance = await play.stream_from_info(info);

                    stream = play_instance.stream;
                    streamType = play_instance.type;
                }
            } else if (track.source === "soundcloud") {
                // Create readable stream from discord-ytdl-core
                const ytdl_instance = ytdl.arbitraryStream(await scdl.download(track.streamURL), {
                    opusEncoded: true,
                    seek: seek / 1000,
                });

                stream = ytdl_instance;
                streamType = StreamType.Opus;
            }
        } catch (e) {
            console.error(e);
            this.textChannel.send(this.client.emotes.error + " **Error(StreamError):** `" + e.message + "`");
        }


        const resource = createAudioResource(stream, {
            inputType: streamType,
            metadata: track,
            inlineVolume: true
        });

        // Set initial volume
        resource.volume.setVolumeLogarithmic(this.volume / 100);

        setTimeout(() => {
            this.streamDispatcher.audioPlayer.play(resource);
        }, bufferTimeout);

        // Set initial pause state
        if (this.paused) {
            this.streamDispatcher.audioPlayer.pause();
        }
    }
}

/** 
 * @typedef QueueOptions
 * @property {Snowflake} guildId - Discord guild id
 * @property {VoiceChannel} voiceChannel - Discord.js voice or stage channel
 * @property {TextChannel} textChannel - Discord.js text channel
 */

module.exports = Queue;