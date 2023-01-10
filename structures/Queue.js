const { Client, Snowflake, TextChannel, VoiceChannel, User, StageChannel } = require("discord.js");
const { State, QueryType, LoadType, Source, RepeatMode } = require("../utils/constants");
const { searchEngine } = require("./searchEngine");
const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioResource, StreamType, AudioPlayerStatus } = require("@discordjs/voice");
const Dispatcher = require("./Dispatcher");
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
         * The client bound to this queue
         * @type {Client}
         */
        this.client = client

        /**
         * The state of this queue
         * @type {State}
         */
        this.state = State.DISCONNECTED;

        /**
         * The guild id bound to this queue
         * @type {Snowflake}
         */
        this.guildId = guildId;

        /**
         * The text channel bound to this queue
         * @type {TextChannel}
         */
        this.textChannel = textChannel;

        /**
         * The voice channel of this queue
         * @type {?VoiceChannel|StageChannel}
         */
        this.voiceChannel = null;

        /**
         * The dispatcher of this queue
         * @type {?Dispatcher}
         */
        this.dispatcher = null;

        /**
         * The tracks of this queue
         * @type {import("./searchEngine").Track[]}
         */
        this.tracks = [];

        /**
         * The previous tracks of this queue
         * @param {import("./searchEngine").Track[]}
         */
        this.previousTracks = [];

        /**
         * The repeat mode of this queue
         * @type {RepeatMode}
         */
        this.repeat = RepeatMode.OFF;

        /**
         * The volume of this queue
         * @type {number}
         */
        this.volume = 100;

        this.additionalStreamTime = null;

        this.voteSkipList = [];


        if (this.client.queues.has(guildId)) {
            return this.client.queues.get(guildId);
        }
        else {
            this.client.queues.set(guildId, this);
        }
    }

    /**
     * Connects to the voice or stage channel
     * @param {VoiceChannel|StageChannel} channel
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
            await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
            this.voiceChannel = channel;
        } catch (error) {
            connection.destroy();
            throw error;
        }

        if (!this.dispatcher) {
            this.dispatcher = new Dispatcher(this, connection);

            this.dispatcher.on("voiceConnectionError", (error) => {
                console.error(error);
                this.textChannel.send(this.client.emotes.error + " **Error(VoiceConnectionError)** `" + error.message + "`");
            });

            this.dispatcher.on("start", (track) => { 
            });

            this.dispatcher.on("finish", (track) => { 
                this.additionalStreamTime = null;
                this.voteSkipList = [];
                
                if (this.repeat === RepeatMode.QUEUE) {
                    this.tracks.shift();
                    this.previousTracks = track;

                    if (this.previousTracks > 5) this.previousTracks.shift();

                    this.tracks.push(track);
                    this.play(this.tracks[0]);
                }
                else if (this.repeat === RepeatMode.TRACK) {
                    this.play(this.tracks[0]);
                }
                else {
                    this.tracks.shift();
                    this.previousTracks = track;

                    if (this.previousTracks > 5) this.previousTracks.shift();

                    this.play(this.tracks[0]);
                }
            });

            this.dispatcher.on("audioPlayerError", (error) => {
                console.error(error);
                this.textChannel.send(this.client.emotes.error + " **Error(AudioPlayerError)** `" + error.message + "`");
            });
        }

        this.state = State.CONNECTED;
        return this;
    }

    /**
     * Disconnects from the voice or stage channel
     * @returns {Queue}
     */
    disconnect() {
        if (this.state !== State.CONNECTED) return this;
        this.state = State.DISCONNECTING;

        this.dispatcher.voiceConnection.destroy();

        this.state = State.DISCONNECTED;
        return this;
    }

    /**
     * Destroys the queue
     * @param {boolean} [disconnect]
     */
    destroy(disconnect = true) {
        if (disconnect) {
            this.disconnect();
        }

        this.state = State.DESTROYING;

        this.client.queues.delete(this.guildId);
    }

    /**
     * Create readable stream and plays it on the audio player
     * @param {import("./searchEngine").Track} track 
     * @param {number} [seek]
     */
    async play(track = this.tracks[0], seek) {
        if (!track) return;

        let stream, streamType;
        let streamURL = track.url;

        // Get a readable stream
        try {
            if (track.source === Source.YOUTUBE || track.source === Source.SPOTIFY) {
                if (track.source === Source.SPOTIFY) {
                    const res = await this.search(track.channel + " - " + track.title, track.requestedBy, { queryType: QueryType.YOUTUBE_SEARCH });
                    if (res.loadType === LoadType.SEARCH_RESULT) {
                        track.duration = res.tracks[0].duration;
                        track.durationFormatted = res.tracks[0].durationFormatted;
                        track.isLive = res.tracks[0].live;

                        streamURL = res.tracks[0].url;
                    }
                    else if (res.loadType === LoadType.NO_MATCHES) {
                        this.textChannel.send(client.emotes.error + " **No results found**");
                        
                        this.tracks.shift();
                        this.play(this.tracks[0]);
                    }
                    else if (res.loadType === LoadType.LOAD_FAILED) {
                        this.textChannel.send(client.emotes.error + " **Error searching** `" + res.exception.message + "`");

                        this.tracks.shift();
                        this.previousTracks = track;
    
                        if (this.previousTracks > 5) this.previousTracks.shift();
    
                        this.play(this.tracks[0]);
                    }
                }

                // Getting track info from play-dl 
                const info = await play.video_info(streamURL);

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

                    this.additionalStreamTime = seek
                }
                else {
                    // Create readable stream from play-dl
                    const play_instance = await play.stream_from_info(info);

                    stream = play_instance.stream;
                    streamType = play_instance.type;
                }
            }
            else if (track.source === Source.SOUNDCLOUD) {
                // Create readable stream from discord-ytdl-core
                const ytdl_instance = ytdl.arbitraryStream(await scdl.download(streamURL), {
                    opusEncoded: true,
                    seek: seek / 1000,
                });

                stream = ytdl_instance;
                streamType = StreamType.Opus;

                if (seek) this.addtionalStreamTime = seek;
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
        this.dispatcher.audioPlayer.play(resource);
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

	isPlaying() {
        if (this.state !== State.CONNECTED) return false;
		return this.dispatcher.audioPlayer.state.status === AudioPlayerStatus.Playing || AudioPlayerStatus.Paused
	}

	isPaused() {
        if (this.state !== State.CONNECTED) return false;
		return this.dispatcher.audioPlayer.state.status === AudioPlayerStatus.Paused
	}
}

module.exports = Queue;