const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioResource, StreamType } = require("@discordjs/voice");
const ytdl = require("discord-ytdl-core");
const YouTube = require("youtube-sr").default;
const scdl = require("soundcloud-downloader").default;

const { searchEngine } = require("./SearchEngine");
const { StreamDispatcher } = require("./StreamDispatcher");
const { State } = require("./Utils");

/**
 * @typedef QueueOptions
 * @property {string} guildId - Discord guild id
 * @property {object} voiceChannel - Discord.js voice or stage channel
 * @property {object} textChannel - Discord.js text channel
 */

const defaultQueueOptions = {
    guildId: null,
    voiceChannel: null,
    textChannel: null
}

class Queue {
    /**
     * Queue constructor
     * @param {object} client 
     * @param {QueueOptions} options 
     */
    constructor(client, options = defaultQueueOptions) {
        /** Client bound to this queue */
        this.client = client

        /** State of this queue */
        this.state = State.DISCONNECTED;

        /** Guild id of this queue */
        this.guildId = options.guildId;

        /** Voice channel bound to this queue */
        this.voiceChannel = options.voiceChannel;

        /** Text channel bound to this queue */
        this.textChannel = options.textChannel;

        /** Stream dispatcher of this queue */
        this.streamDispatcher = null;

        /** Tracks of this queue */
        this.tracks = [];

        /** Skiplist of this queue */
        this.skiplist = [];

        /** Paused mode of this queue */
        this.paused = false;

        /** Loop mode of this queue */
        this.loop = false;

        /** Loop queue mode of this queue */
        this.loopQueue = false;

        /** Volume of this queue */
        this.volume = 100;

        /** Filters the queue is using */
        this.filters = {
            seek: null,
            FFmpeg: []
        }
    }

    /**
     * Shortcut to the SearchEngine on the queue itself.
     * @param {string} query 
     * @param {import("./SearchEngine").SearchOptions} options 
     * @returns {import("./SearchEngine").SearchResult}
     */
    async search(query, options) {
        return await searchEngine(query, options);
    }

    /**
     * Connect to the voice or stage channel
     * @param {object} channel
     * @returns {object} 
     */
    async connect(channel = this.voiceChannel) {
        if (!channel) throw new RangeError("Failed to find a voice channel to connect to.");
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

            // Listen for connection error
            this.streamDispatcher.connection.on("error", (error) => {
                console.log(error);
                this.textChannel.send(this.client.emotes.error + " **An error occurred with the connection to** <#" + this.voiceChannel.id + ">");
            });

            // Listen for the audio resource start
            this.streamDispatcher.on("start", (metadata) => {
                if (!this.filters.seek && this.filters.FFmpeg.length === 0) this.textChannel.send(this.client.emotes.playerFrozen + " **Now Playing** `" + metadata.title + "`");
            });

            // Listen for audio resource to finish
            this.streamDispatcher.on("finish", (metadata) => {
                this.skiplist = [];
                this.filters.seek = null;
                this.filters.FFmpeg = [];

                if (this.loop === true) {
                    this.play(this.tracks[0]);
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
        this.state = State.CONNECTED;
        return this;
    }

    /**
     * Disconnects from the voice or stage channel
     * @returns {object}
     */
    disconnect() {
        if (this.voiceChannel === null) return this;
        this.state = State.DISCONNECTING;

        if (!this.streamDispatcher || this.streamDispatcher.connection.state.status !== VoiceConnectionStatus.Destroyed) this.streamDispatcher.connection.destroy();

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
     * Creates readable and streams audio
     * @param {import("./SearchEngine").Track} track 
     * @param {PlayOptions} options 
     */
    async play(track = this.tracks[0], options = defaultPlayOptions) {
        let stream;

        if (!track) {
            // Handle end cooldown
            return;
        }

        let streamOptions = {
            filter: track.isLive ? "audio" : "audioonly", // filter: audioonly does not work with livestreams
            quality: "highestaudio",
            highWaterMark: 1 << 25,
            opusEncoded: false,
            seek: options.seek / 1000,
            encoderArgs: options.FFmpeg
        }

        // Download readable stream
        if (track.source === "youtube" || track.source === "spotify") {
            if (track.source === "spotify") {
                const streamData = await YouTube.searchOne(track.title);
                if (!streamData) {
                    this.skiplist = [];
                    this.filters.seek = null;
                    this.filters.FFmpeg = [];
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
            stream = ytdl(track.streamURL, streamOptions);
        } else if (track.source === "soundcloud") {
            stream = ytdl.arbitraryStream(await scdl.download(track.streamURL), streamOptions);
        }

        // Listen for stream error
        stream.on("error", (error) => {
            // HTTP request destroyed, retry request
            if (error.message === "Status code: 403") {
                this.skiplist = [];
                this.filters.seek = null;
                this.filters.FFmpeg = [];
                this.play(this.tracks[0]);
                return;
            }
            // Unknown error, play the next track 
            else {
                console.log(error);
                this.textChannel.send(this.client.emotes.error + " **An error occurred while attempting to play** " + "`" + track.title + "`");

                this.skiplist = [];
                this.filters.seek = null;
                this.filters.FFmpeg = [];
                this.tracks.shift();
                this.play(this.tracks[0]);
                return;
            }
        });

        // Create audio resource for audio player
        const resource = createAudioResource(stream, {
            inputType: StreamType.Raw,
            metadata: track,
            inlineVolume: true
        });

        // Attach filters to the queue 
        if (options.seek) this.filters.seek = options.seek;
        if (options.FFmpeg) this.filters.FFmpeg = options.FFmpeg;

        // Play audio resource across audio player
        this.streamDispatcher.audioPlayer.play(resource);
    }
}

/**
 * @typedef PlayOptions
 * @property {number|null} seek - Amount in seconds to seek the track
 * @property {array} FFmpeg - FFmpeg filters if any
 */

const defaultPlayOptions = {
    seek: null,
    FFmpeg: [],
}

module.exports = { Queue }