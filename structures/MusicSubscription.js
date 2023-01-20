const { Client, TextChannel, VoiceChannel, StageChannel, EmbedBuilder, User, Message, ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { VoiceConnection, AudioPlayer, createAudioPlayer, NoSubscriberBehavior, joinVoiceChannel, VoiceConnectionStatus, VoiceConnectionDisconnectReason, entersState, AudioPlayerStatus, StreamType, createAudioResource } = require("@discordjs/voice");
const Queue = require("./Queue");
const { searchEngine } = require("./searchEngine");
const { RepeatMode, Source, QueryType, LoadType } = require("../utils/constants");
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
         * @type {import("./searchEngine").Track[]}
         */
        this.queue = new Queue();

        /**
         * The previous queue of this subscription
         * @type {import("./searchEngine").Track[]}
         */
        this.previousQueue = new Array(5);

        /**
         * The repeat mode of this subscription
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
             * The additional playback duration to add to the audio player
             * @type {?number}
             */
            additionalPlaybackDuration: null,

            /**
             * The array of user ids, who want to skip the current track
             * @type {User}
             */
            voteSkipList: [],
        }


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

            // Configure audio player
            this.audioPlayer.on("stateChange", (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                    // The queue is then processed to start playing the next track, if one is available.
                    if (playingMessage) {
                        playingMessage.edit({ components: [row.components.forEach((x) => x.setDisabled()), row2.components.forEach((x) => x.setDisabled())] });
                    }

                    playingMessage = null;


                    if (this.repeat === RepeatMode.QUEUE) {
                        const shifted = this.queue.shift();
                        this.previousQueue.push(shifted);

                        if (this.previousQueue > 5) this.previousQueue.shift();

                        this.queue.push(shifted);
                        this.play(this.queue[0]);
                    }
                    else if (this.repeat === RepeatMode.TRACK) {
                        this.play(this.queue[0]);
                    }
                    else {
                        const shifted = this.queue.shift();
                        this.previousQueue.push(shifted);

                        if (this.previousQueue > 5) this.previousQueue.shift();

                        this.play(this.queue[0]);
                    }
                }
                else if (newState.status === AudioPlayerStatus.Playing && oldState.status === AudioPlayerStatus.Buffering) {
                    // If the Playing state has been entered, then a new track has started playback.
                    if (this.metadata.additionalPlaybackDuration) return;

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
    * Creates a readable stream and plays it on the audio player
    * @param {import("./searchEngine").Track} track 
    * @param {number} [seek]
    */
    async play(track = this.queue[0], seek) {
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
                        this.queue.shift();
                        this.play(this.queue[0]);
                    }
                    else if (res.loadType === LoadType.LOAD_FAILED) {
                        this.queue.shift();
                        this.previousQueue.push(track);

                        if (this.previousQueue > 5) this.previousQueue.shift();

                        this.play(this.queue[0]);
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

                    this.metadata.additionalPlaybackDuration = seek
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

                if (seek) this.metadata.additionalPlaybackDuration = seek;
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

    isPlaying() {
        if (!this.connection) return false;
        return this.audioPlayer.state.status === AudioPlayerStatus.Playing || this.audioPlayer.state.status === AudioPlayerStatus.Paused;
    }

    isPaused() {
        if (!this.connection) return true;
        return this.audioPlayer.state.status === AudioPlayerStatus.Paused;
    }
}

module.exports = MusicSubscription;