const { Client, TextChannel, VoiceChannel, StageChannel, User } = require("discord.js");
const { State, RepeatMode, QueryTypes } = require("../utils/constants");
const StreamDispatcher = require("./StreamDispatcher");
const play = require("play-dl");
const { FFmpeg } = require("prism-media");
const { joinVoiceChannel, entersState, VoiceConnectionStatus, StreamType, createAudioResource } = require("@discordjs/voice");
const ytdl = require("discord-ytdl-core");
const { searchEngine } = require("./searchEngine");
const scdl = require("soundcloud-downloader").default;

class Player {
    /**
     * Player constructor
     * @param {Client} client 
     * @param {import("discord.js").Snowflake} guildId 
     * @param {TextChannel} textChannel
     * @returns {Player}
     */
    constructor(client, guildId, textChannel) {
        /**
         * The state of this player
         * @type {State}
         */
        this.state = State.DISCONNECTED;

        /**
         * The client bound to this player
         * @type {Client}
         */
        this.client = client;

        /**
         * The guild id bound to this player
         * @type {import("discord.js").Snowflake}
         */
        this.guildId = guildId;

        /**
         * The text channel bound to this player
         * @type {TextChannel}
         */
        this.textChannel = textChannel;

        /**
         * The voice or stage channel of this player
         * @type {?VoiceChannel|StageChannel}
         */
        this.voiceChannel = null;

        /**
         * The stream dispatcher of this player
         * @type {StreamDispatcher}
         */
        this.streamDispatcher = null;

        /**
         * The queue of this player
         * @type {import("./searchEngine").Track[]}
         */
        this.queue = [];

        /**
         * The current track of this player
         * @type {?import("./searchEngine").Track}
         */
        this.currentTrack = null;

        /**
         * The previous track of this player
         * @type {?import("./searchEngine").Track}
         */
        this.previousTrack = null;

        /**
         * The pause mode of this player
         * @type {boolean}
         */
        this.paused = false;

        /**
         * The repeat mode of this player
         * @type {RepeatMode}
         */
        this.repeat = RepeatMode.OFF;

        /**
         * The volume of this player
         * @type {number}
         */
        this.volume = 100;

        this.voteSkipList = [];

        this.addtionalStreamTime = null;


        if (this.client.players.has(this.guildId)) {
            return this.client.players.get(this.guildId);
        }
        else {
            this.client.players.set(this.guildId, this);
        }
    }

    /**
     * Connect to a voice or stage channel 
     * @param {VoiceChannel|StageChannel} channel
     * @returns {Player}
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
            await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
            this.voiceChannel = channel;
        } catch (error) {
            connection.destroy();
            throw error;
        }

        if (!this.streamDispatcher) {
            this.streamDispatcher = new StreamDispatcher(this, connection);

            this.streamDispatcher.on("start", (track) => {
                if (!this.addtionalStreamTime) { } // Player
            });

            this.streamDispatcher.on("finish", (track) => {
                this.voteSkipList = [];
                this.addtionalStreamTime = null;

                if (this.repeat === RepeatMode.QUEUE) {
                    const shifted = this.queue.shift();
                    this.currentTrack = shifted;
                    this.previousTrack = track;
                    this.queue.push(track);
                    this.play();
                }
                else if (this.repeat === RepeatMode.TRACK) {
                    this.play();
                }
                else {
                    const shifted = this.queue.shift();
                    this.currentTrack = shifted;
                    this.previousTrack = track;
                    this.play();
                }
            });

            this.streamDispatcher.on("voiceConnectionError", (error) => {
                console.error(e);
                this.textChannel.send(this.client.emotes.error + " **Error(VoiceConnectionError)** `" + error.message + "`");
            });

            this.streamDispatcher.on("audioPlayerError", (error) => {
                console.error(e);
                this.textChannel.send(this.client.emotes.error + " **Error(AudioPlayerError)** `" + error.message + "`");
            });
        }

        this.state = State.CONNECTED;
        return this;
    }

    /**
     * Disconnects from a voice or stage channel
     * @returns {Player}
     */
    disconnect() {
        if (this.state !== State.CONNECTED) return this;
        this.state = State.DISCONNECTING;

        this.streamDispatcher.voiceConnection.destroy();
        this.voiceChannel = null;
        this.streamDispatcher = null;

        this.state = State.DISCONNECTED;
        return this;
    }

    /**
     * Destroys the player
     * @param {boolean} [disconnect]
     */
    destroy(disconnect = true) {
        this.state = State.DESTROYING;
        if (disconnect) {
            this.disconnect();
        }

        this.client.players.delete(this.guildId);
    }

    /**
     * Plays a track on the audio player
     * @param {import("./searchEngine").Track} track
     * @param {number} [scrub]
     */
    async play(track = this.currentTrack, scrub) {
        if (!track) return;
        if (!this.currentTrack) this.currentTrack = track;

        let stream, streamType;
        let streamURL = track.url;

        try {
            if (track.source === "youtube" || track.source === "spotify") {
                if (track.source === "spotify") {
                    const res = await this.search(track.channel + " - " + track.title, track.requestedBy, { queryType: QueryTypes.YOUTUBE_SEARCH });
                    if (res.loadType === LoadType.SEARCH_RESULT) {
                        track.duration = res.tracks[0].duration;
                        track.durationFormatted = res.tracks[0].durationFormatted;
                        track.isLive = res.tracks[0].live;

                        streamURL = res.tracks[0].url;
                    }
                    else if (res.loadType === LoadType.NO_MATCHES) {
                        this.textChannel.send(client.emotes.error + " **No results found**");
                        const shifted = this.queue.shift();
                        this.currentTrack = shifted;
                        this.previousTrack = track;
                        this.play();
                    }
                    else if (res.loadType === LoadType.LOAD_FAILED) {
                        this.textChannel.send(client.emotes.error + " **Error searching** `" + res.exception.message + "`");
                        const shifted = this.queue.shift();
                        this.currentTrack = shifted;
                        this.previousTrack = track;
                        this.play();
                    }
                }

                // Getting track info from play-dl 
                const info = await play.video_info(streamURL);

                if (scrub) {
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

                    final_args.push("-ss", `${(scrub / 1000).toString()}`, "-accurate_seek"); // Seeks 5 second in audio. You can also use hh:mm:ss format.
                    final_args.push("-i", highestaudio);
                    final_args.push(...FFMPEG_OPUS_ARGUMENTS);

                    // Create readable stream from FFmpeg
                    const ffmpeg_instance = new FFmpeg({
                        args: final_args,
                    });

                    stream = ffmpeg_instance;
                    streamType = StreamType.OggOpus;

                    this.addtionalStreamTime = scrub;
                }
                else {
                    // Create readable stream from play-dl
                    const play_instance = await play.stream_from_info(info);

                    stream = play_instance.stream;
                    streamType = play_instance.type;
                }
            }
            else if (track.source === "soundcloud") {
                // Create readable stream from discord-ytdl-core
                const ytdl_instance = ytdl.arbitraryStream(await scdl.download(streamURL), {
                    opusEncoded: true,
                    seek: scrub / 1000,
                });

                stream = ytdl_instance;
                streamType = StreamType.Opus;

                if (scrub) this.addtionalStreamTime = scrub;
            }
        } catch (error) {
            console.error(error);
            this.textChannel.send(this.client.emotes.error + " **Error(StreamError)** `" + error.message + "`");
        }

        // Create audio resource
        const resource = createAudioResource(stream, {
            inputType: streamType,
            metadata: track,
            inlineVolume: true
        });

        resource.volume.setVolumeLogarithmic(this.volume / 100);

        // Play audio resource on audio player
        this.streamDispatcher.audioPlayer.play(resource);
    }

    /**
     * Pauses the audio player
     */
    pause() {
        this.streamDispatcher.audioPlayer.pause();
        this.paused = true;
    }

    /**
     * Shortcut to the search engine on the player itself
     * @param {string} query 
     * @param {User} requester 
     * @param {import("./searchEngine").SearchEngineOptions} options 
     */
    async search(query, requester, options) {
        return await searchEngine(query, requester, options);
    }
}

module.exports = Player;