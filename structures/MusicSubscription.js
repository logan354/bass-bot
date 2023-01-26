const { Client, TextChannel, VoiceChannel, StageChannel, EmbedBuilder, User, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { VoiceConnection, AudioPlayer, createAudioPlayer, NoSubscriberBehavior, joinVoiceChannel, VoiceConnectionStatus, VoiceConnectionDisconnectReason, entersState, AudioPlayerStatus, StreamType, createAudioResource } = require("@discordjs/voice");
const Queue = require("./Queue");
const { searchEngine } = require("./searchEngine");
const { Source, QueryType, LoadType, QueueDirection, RepeatMode } = require("../utils/constants");
const play = require("play-dl");
const { FFmpeg } = require("prism-media");
const ytdl = require("discord-ytdl-core");
const scdl = require("soundcloud-downloader").default;

const { promisify } = require("node:util");

const wait = promisify(setTimeout);

class MusicSubscription {
    /**
     * Music subscription constructor
     * @param {Client} client 
     * @param {import("discord.js").Snowflake} guildId 
     * @param {TextChannel} textChannel 
     */
    constructor(client, guildId, textChannel) {
        /**
         * The client bound to this subscription
         * @type {Client}
         */
        this.client = client;

        /**
         * The guild id bound to this subscription
         * @type {import("discord.js").Snowflake}
         */
        this.guildId = guildId;

        /**
         * The text channel bound to this subscription
         * @type {TextChannel}
         */
        this.textChannel = textChannel;

        /**
         * The voice channel of this subscription
         * @type {?VoiceChannel|StageChannel}
         */
        this.voiceChannel = null;

        /**
         * The connection of this subscription
         * @type {?VoiceConnection}
         */
        this.connection = null;

        /**
         * The audio player of this subscription
         * @type {?AudioPlayer}
         */
        this.audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Stop,
            }
        });

        /**
         * The queue of this subscription
         * @type {Queue}
         */
        this.queue = new Queue();

        /**
         * The repeat mode of this queue
         * @type {RepeatMode}
         */
        this.repeat = RepeatMode.OFF;

        /**
         * The volume of this subscription
         * @type {number}
         */
        this.volume = 100;

        /**
         * The metadata of this subscription
         */
        this.metadata = {
            /**
             * The array of user ids, who want to skip the current track
             * @type {User}
             */
            voteSkipList: [],
        }

        /**
         * The additional playback duration to add to the audio player playback duration
         * @type {?number}
         */
        this._additionalPlaybackDuration = null;


        if (this.client.subscriptions.has(guildId)) {
            return this.client.subscriptions.get(guildId);
        }
        else {
            this.client.subscriptions.set(guildId, this);
        }
    }


    /**
     * Shortcut to the search engine on the subscription itself.
     * @param {string} query
     * @param {User} requester
     * @param {import("./searchEngine").SearchEngineOptions} options 
     * @returns {import("./searchEngine").SearchResult}
     */
    async search(query, requester, options) {
        return await searchEngine(query, requester, options);
    }

    /**
     * Connects to the voice or stage channel
     * @param {VoiceChannel|StageChannel} channel
     * @returns {MusicSubscription} 
     */
    async connect(channel) {
        const isCurrentConnection = this.connection ? true : false;

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
            this.voiceChannel = channel;
        } catch (error) {
            connection.destroy();
            throw error;
        }

        if (!isCurrentConnection) {
            //Configure connection

            this.connection = connection;

            this.connection.on("stateChange", async (_, newState) => {
                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                        /**
                         * If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
                         * but there is a chance the connection will recover itself if the reason of the disconnect was due to
                         * switching voice channels. This is also the same code for the bot being kicked from the voice channel,
                         * so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
                         * the voice connection.
                         */
                        try {
                            await entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000);
                            // Probably moved voice channel
                        }
                        catch {
                            this.connection.destroy();
                            // Probably removed from voice channel
                        }
                    }
                    else if (this.connection.rejoinAttempts < 5) {
                        /**
                         * The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
                         */
                        await wait((this.connection.rejoinAttempts + 1) * 5_000);
                        this.connection.rejoin();
                    }
                    else {
                        /**
                         * The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
                         */
                        this.connection.destroy();
                    }
                }
                else if (newState.status === VoiceConnectionStatus.Destroyed) {
                    /**
                     * Once destroyed, stop the subscription.
                     */
                    this.audioPlayer.stop(true);

                    this.voiceChannel = null;
                    this.connection = null;
                    this.audioPlayer = null;

                    this.destroy();
                }
                else if (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling) {
                    /**
                     * In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
                     * before destroying the voice connection. This stops the voice connection permanently existing in one of these
                     * states.
                     */
                    try {
                        await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
                    }
                    catch {
                        if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) this.connection.destroy();
                    }
                }
            });

            this.connection.on("error", (error) => {
                console.error(error);
                this.textChannel.send(this.client.emotes.error + " **Error(VoiceConnectionError)** `" + error.message + "`");
            });


            let playingMessage;

            // Configure audio player
            this.audioPlayer.on("stateChange", (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                    // The queue is then processed to start playing the next track, if one is available.
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("shuffle")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("🔀")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("previous")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("⏮️")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("resume-pause")
                                .setStyle(ButtonStyle.Success)
                                .setEmoji("⏸️")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("next")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("⏭️")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("repeat")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("🔁")
                                .setDisabled()
                        );

                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("block")
                                .setStyle(ButtonStyle.Primary)
                                .setLabel("\u200B")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("volume-down")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("🔉")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("stop")
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji("⏹️")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("volume-up")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("🔊")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("queue")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("📚")
                                .setDisabled()
                        );


                    if (playingMessage) {
                        playingMessage.edit({ components: [row, row2] });
                    }

                    playingMessage = null;


                    // Process the queue
                    this.queue._process();
                    this.play();
                }
                else if (newState.status === AudioPlayerStatus.Playing && oldState.status === AudioPlayerStatus.Buffering) {
                    // If the Playing state has been entered, then a new track has started playback.
                    if (this._additionalPlaybackDuration) return;

                    const embed = new EmbedBuilder()
                        .setColor("DarkGreen")
                        .setAuthor({
                            name: "Playing",
                            iconURL: this.client.guilds.cache.get(this.guildId).iconURL()
                        })
                        .setDescription(`**[${newState.resource.metadata.title}](${newState.resource.metadata.url})**`)
                        .setThumbnail(newState.resource.metadata.thumbnail)
                        .setFields(
                            {
                                name: "Channel",
                                value: newState.resource.metadata.channel,
                                inline: true
                            },
                            {
                                name: "Duration",
                                value: newState.resource.metadata.durationFormatted,
                                inline: true
                            },
                            {
                                name: "Requested by",
                                value: "<@" + newState.resource.metadata.requestedBy + ">",
                                inline: true
                            }
                        );

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("shuffle")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("🔀"),
                            new ButtonBuilder()
                                .setCustomId("previous")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("⏮️"),
                            new ButtonBuilder()
                                .setCustomId("resume-pause")
                                .setStyle(ButtonStyle.Success)
                                .setEmoji("⏸️"),
                            new ButtonBuilder()
                                .setCustomId("next")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("⏭️"),
                            new ButtonBuilder()
                                .setCustomId("repeat")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("🔁")
                        );

                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("block")
                                .setStyle(ButtonStyle.Primary)
                                .setLabel("\u200B"),
                            new ButtonBuilder()
                                .setCustomId("volume-down")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("🔉"),
                            new ButtonBuilder()
                                .setCustomId("stop")
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji("⏹️"),
                            new ButtonBuilder()
                                .setCustomId("volume-up")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("🔊"),
                            new ButtonBuilder()
                                .setCustomId("queue")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("📚")
                        );


                    this.textChannel.send({ embeds: [embed], components: [row, row2] })
                        .then((message) => playingMessage = message);
                }
            });

            this.audioPlayer.on("error", (error) => {
                console.error(error);
                this.textChannel.send(this.client.emotes.error + " **Error(AudioPlayerError)** `" + error.message + "`");
            });


            // Subscribe the connection
            this.connection.subscribe(this.audioPlayer);
        }

        return this;
    }

    /**
     * Disconnects from the voice or stage channel
     * @returns {MusicSubscription}
     */
    disconnect() {
        if (!this.connection) return false;

        this.connection.destroy();

        return this;
    }

    /**
     * Destroys the subscription
     */
    destroy() {
        this.disconnect();

        this.client.subscriptions.delete(this.guildId);
    }

    /**
    * Plays a track on the audio player
    * @param {import("./searchEngine").Track} track
    * @param {PlayOptions} [options]
    */
    async play(track = this.queue[0], options = defaultPlayOptions) {
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
                        this.queue.direction = QueueDirection.NEXT;
                        this.queue._process();

                        this.play();
                    }
                    else if (res.loadType === LoadType.LOAD_FAILED) {
                        this.queue.direction = QueueDirection.NEXT;
                        this.queue._process();

                        this.play();
                    }
                }

                // Getting track info from play-dl 
                const info = await play.video_info(streamURL);

                if (options.seek) {
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

                    final_args.push("-ss", `${(options.seek / 1000).toString()}`, "-accurate_seek"); // Seeks 5 second in audio. You can also use hh:mm:ss format.
                    final_args.push("-i", highestaudio);
                    final_args.push(...FFMPEG_OPUS_ARGUMENTS);

                    // Create readable stream from FFmpeg
                    const ffmpeg_instance = new FFmpeg({
                        args: final_args,
                    });

                    stream = ffmpeg_instance;
                    streamType = StreamType.OggOpus;

                    this._additionalPlaybackDuration = options.seek
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
                    seek: options.seek / 1000,
                });

                stream = ytdl_instance;
                streamType = StreamType.Opus;

                if (options.seek) this._additionalPlaybackDuration = options.seek;
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
        this.audioPlayer.play(resource);
    }

    /**
     * Pauses the audio player
     */
    pause() {
        this.audioPlayer.pause();
    }

    /**
     * Resumes the audio player
     */
    resume() {
        this.audioPlayer.unpause();
    }

    /**
     * Skips to the next track or jumps to a track in the queue
     * @param {number} jump 
     */
    next(jump) {
        if (jump) {
            for (let i = 0; i < jump - 1; i++) {
                this.queue.direction = QueueDirection.NEXT;
                this.queue._process();
            }
        }

        this.queue.direction = QueueDirection.NEXT;
        this.audioPlayer.stop();
    }

    /**
     * Skips to the previous track
     */
    previous() {
        this.queue.direction = QueueDirection.PREVIOUS;
        this.audioPlayer.stop();
    }

    isPlaying() {
        if (!this.connection) return false;
        return this.audioPlayer.state.status === AudioPlayerStatus.Playing || this.audioPlayer.state.status === AudioPlayerStatus.Paused;
    }

    isPaused() {
        if (!this.connection) return true;
        return this.audioPlayer.state.status === AudioPlayerStatus.Paused;
    }
}

/**
 * The default play options
 * @type {PlayOptions}
 */
const defaultPlayOptions = {
    seek: null
}

/**
 * @typedef PlayOptions
 * @property {?number} seek
 */

module.exports = MusicSubscription;