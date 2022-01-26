const { Client, VoiceChannel, TextChannel, Snowflake } = require("discord.js");
const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioResource, StreamType } = require("@discordjs/voice");
const { FFmpeg } = require("prism-media");

const play = require("play-dl");
const ytdl = require("discord-ytdl-core");
const YouTube = require("youtube-sr").default;
const scdl = require("soundcloud-downloader").default;

const { searchEngine } = require("./SearchEngine");
const StreamDispatcher = require("./StreamDispatcher");
const { State } = require("../utils/constants");
const { handleEndCooldown, handleStopCooldown } = require("../utils/cooldowns");

class Queue {
    /**
     * Queue constructor
     * @param {Client} client 
     * @param {QueueOptions} options 
     */
    constructor(client, options) {
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
         * @type {?Snowflake}
         */
        this.guildId = null;

        /**
         * Voice channel bound to this queue
         * @type {?VoiceChannel}
         */
        this.voiceChannel = null;

        /**
         * Text channel bound to this queue
         * @type {?TextChannel}
         */
        this.textChannel = null;

        /**
         * Stream dispatcher of this queue
         * @type {?StreamDispatcher}
         */
        this.streamDispatcher = null;

        /**
         * Tracks of this queue
         * @type {import("./SearchEngine").Track[]}
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

        /**
         * Cooldown of this queue
         * @type {?NodeJS.Timeout}
         */
        this.cooldown = null;

        if (!this.client) throw new RangeError("Client has not been initialized");

        if (this.client.queues.has(options.guildId)) {
            return this.client.queues.get(options.guildId);
        }

        if (options.guildId) this.guildId = options.guildId;
        if (options.voiceChannel) this.voiceChannel = options.voiceChannel;
        if (options.textChannel) this.textChannel = options.textChannel;

        this.client.queues.set(options.guildId, this);
    }

    /**
     * Shortcut to the SearchEngine on the queue itself.
     * @param {string} query 
     * @param {import("./SearchEngine").SearchEngineOptions} options 
     * @returns {import("./SearchEngine").SearchResult}
     */
    async search(query, options) {
        return await searchEngine(query, options);
    }

    /**
     * Connect to the voice or stage channel
     * @param {VoiceChannel} [channel]
     * @returns {Queue} 
     */
    async connect(channel = this.voiceChannel) {
        if (!channel) throw new RangeError("No voice channel has been initialized");
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
        } catch (error) {
            connection.destroy();
            throw error;
        }

        if (!this.streamDispatcher) {
            this.streamDispatcher = new StreamDispatcher(connection, this);

            connection.on("error", (error) => {
                console.log(error);
                this.textChannel.send(this.client.emotes.error + " **Error** `VoiceConnectionError: " + error.message + "`");
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
        }

        this.voiceChannel = channel;
        handleEndCooldown(this);
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

        if (this.streamDispatcher && this.streamDispatcher.connection.state.status !== VoiceConnectionStatus.Destroyed) this.streamDispatcher.connection.destroy();

        this.voiceChannel = null;
        this.state = State.DISCONNECTED;
        return this;
    }

    /**
     * Destroys the queue
     */
    destroy() {
        this.state = State.DESTROYING;
        this.disconnect();

        this.client.queues.delete(this.guildId);
    }

    /**
     * Create readable stream and plays it on the audio player
     * @param {import("./SearchEngine").Track} track 
     * @param {number} [seek]
     */
    async play(track = this.tracks[0], seek) {
        if (!track) {
            handleEndCooldown(this);
            return;
        }

        let stream = null;
        let streamType = null;
        let bufferTimeout = 0;

        if (track.source === "youtube" || track.source === "spotify") {
            if (track.source === "spotify") {
                const streamData = await YouTube.searchOne(track.title);
                if (!streamData) {
                    this.skiplist = [];
                    this.additionalStreamTime = null;
                    this.tracks.shift();
                    this.play(this.tracks[0]);
                }

                track.title = streamData.title;
                track.streamURL = streamData.url
                track.duration = parseInt(streamData.duration);
                track.durationFormatted = streamData.durationFormatted;
                track.isLive = streamData.live;

                if (track.isLive === true || track.duration === 0) {
                    track.durationFormatted = "LIVE";
                    track.isLive = true;
                }
            }

            const info = await play.video_info(track.streamURL);

            if (seek) {
                if (track.isLive) throw new Error("Cannot seek live tracks");

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

                const ffmpeg_instance = new FFmpeg({
                    args: final_args,
                });

                stream = ffmpeg_instance;
                streamType = StreamType.OggOpus;

                this.additionalStreamTime = seek;
            } else {
                const play_instance = await play.stream_from_info(info);
                stream = play_instance.stream;
                streamType = play_instance.type;
            }
        } else if (track.source === "soundcloud") {
            const ytdl_instance = ytdl.arbitraryStream(await scdl.download(track.streamURL), {
                opusEncoded: true,
                seek: seek / 1000,
            });

            stream = ytdl_instance;
            streamType = StreamType.Opus;
        }

        // Create resource
        const resource = createAudioResource(stream, {
            inputType: streamType,
            metadata: track,
            inlineVolume: true
        });

        // Set initial volume
        resource.volume.setVolumeLogarithmic(this.volume / 100);

        // Play resoure on audio player
        setTimeout(() => {
            this.streamDispatcher.audioPlayer.play(resource);
        }, bufferTimeout);

        // Set initial pause state
        if (this.paused) {
            this.streamDispatcher.audioPlayer.pause();
            handleStopCooldown(this);
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