import { Message, SendableChannels, Snowflake, TextBasedChannel, VoiceBasedChannel } from "discord.js";
import { AudioPlayer, AudioPlayerPlayingState, AudioPlayerState, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, NoSubscriberBehavior, VoiceConnection, VoiceConnectionDisconnectReason, VoiceConnectionState, VoiceConnectionStatus } from "@discordjs/voice";
import youtubeDl from "youtube-dl-exec";
import { FFmpeg } from "prism-media";

import PlayerManager from "./PlayerManager";
import Queue from "../queue/Queue";
import { promisify } from "node:util";
import { QueueableAudioMedia } from "../AudioMedia";
import { AudioMediaSource, QueueableAudioMediaType, RepeatMode } from "../../utils/constants";
import { searchYouTube } from "../search/extractors/youtube";
import Track from "../models/Track";
import { createProgressBar, formatDurationTimestamp } from "../../utils/util";
import { createPlayerActionRows, createPlayerEmbed, createQueueEmptyMessage, createTrackConvertingEmbed } from "../../utils/common";

const wait = promisify(setTimeout);

interface PlayerMetadata {
    playerMessage: Message | null,
    playerMessageUpdateInterval: NodeJS.Timeout | null,
    addedPlaybackDuration: number
}

class Player {
    playerManager: PlayerManager;

    guildId: Snowflake;

    textChannel: SendableChannels;

    voiceChannel: VoiceBasedChannel | null = null;

    voiceConnection: VoiceConnection | null = null;

    audioPlayer: AudioPlayer | null = null;

    queue: Queue = new Queue();

    volume: number = 100;

    metadata: PlayerMetadata = {
        playerMessage: null,
        playerMessageUpdateInterval: null,
        addedPlaybackDuration: 0
    }

    constructor(playerManager: PlayerManager, guildId: Snowflake, textChannel: SendableChannels) {
        this.playerManager = playerManager;
        this.guildId = guildId;

        if (!textChannel.isSendable()) throw Error("Non-Sendable Channel")
        else this.textChannel = textChannel;
    }

    /**
     * Connects the player to a voice channel.
     * @param voiceChannel
     * @async
     * @throws
     * @returns 
     */
    async connect(voiceChannel: VoiceBasedChannel): Promise<boolean> {
        const voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        try {
            await entersState(voiceConnection, VoiceConnectionStatus.Ready, 10_000);
        }
        catch (error) {
            voiceConnection.destroy();
            throw error;
        }

        if (!this.voiceConnection) {
            voiceConnection.on("stateChange", async (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                        /**
                         * If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
                         * but there is a chance the connection will recover itself if the reason of the disconnect was due to
                         * switching voice channels. This is also the same code for the bot being kicked from the voice channel,
                         * so we allow 3 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
                         * the voice connection.
                         */
                        try {
                            // Probably moved voice channel
                            await entersState(voiceConnection, VoiceConnectionStatus.Connecting, 3_000);
                        } catch {
                            // Probably removed from voice channel

                            voiceConnection.destroy();
                        }
                    }
                    else if (voiceConnection.rejoinAttempts < 5) {
                        /**
                         * The disconnect in this case is recoverable, and we also have < 5 repeated attempts so we will reconnect.
                         */
                        await wait((voiceConnection.rejoinAttempts + 1) * 5_000);
                        voiceConnection.rejoin();
                    }
                    else {
                        /**
                         * The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
                         */
                        voiceConnection.destroy();
                    }
                }
                else if (newState.status === VoiceConnectionStatus.Destroyed) {
                    /**
                     * Once destroyed, stop the subscription.
                     */
                    this.voiceChannel = null;
                    this.voiceConnection = null;

                    this.audioPlayer!.stop(true);
                    this.audioPlayer = null;
                }
                else if (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling) {
                    /**
                     * In the Signalling or Connecting states, we set a 10 second time limit for the connection to become ready
                     * before destroying the voice connection. This stops the voice connection permanently existing in one of these
                     * states.
                     */
                    try {
                        await entersState(voiceConnection, VoiceConnectionStatus.Ready, 10_000);
                    }
                    catch {
                        if (voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) voiceConnection.destroy();
                    }
                }
            });
        }

        this.voiceChannel = voiceChannel;
        this.voiceConnection = voiceConnection;

        if (!this.audioPlayer) {
            const audioPlayer = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause
                }
            });

            // Events
            audioPlayer.on("stateChange", async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    /**
                     * If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                     * The queue is then processed to start playing the next track, if one is available.
                     */
                    const embed = createPlayerEmbed(this);
                    const actionRows = createPlayerActionRows(this);
                    
                    this.metadata.playerMessage!.edit({ embeds: [embed], components: actionRows });

                    if (this.queue.repeatMode !== RepeatMode.ONE) this.metadata.playerMessage = null;
                    this.metadata.playerMessageUpdateInterval!.close();
                    this.metadata.playerMessageUpdateInterval = null;

                    // Meaning no action by user. e.g next or previous functions
                    if (this.queue.locked) this.queue.next();
                    else this.queue.locked = true;

                    this.play();
                } else if (newState.status === AudioPlayerStatus.Playing) {
                    // If the Playing state has been entered, then a new track has started playback.
                    this.createMessage();
                }
            });

            voiceConnection.subscribe(audioPlayer);

            this.audioPlayer = audioPlayer;
        }

        return true;
    }

    /**
     * Disconnects the player from the voice channel
     */
    disconnect() {
        if (!this.voiceConnection) return;

        this.voiceConnection.destroy();
    }

    /**
     * Plays the queue, or a queueable audio media item.
     * Defaults item: first queue item.
     * @param options
     * @async
     * @returns
     */
    async play(options?: { item: QueueableAudioMedia }): Promise<void> {
        let item = this.queue.items[0];

        if (options) {
            if (options.item) item = options.item;
        }

        if (this.queue.isEmpty()) {
            this.textChannel.send(await createQueueEmptyMessage(this.playerManager.bot));
        }
        else {
            if (item.type === QueueableAudioMediaType.TRACK) {
                const track = item as Track;

                await this.playTrack(track);
            }
            else return;
        }
    }

    /**
     * Plays a track.
     * Defaults seek: 0.
     * @param track
     * @param options
     * @async
     * @returns
     */
    async playTrack(track: Track, options?: { seek?: number | null }): Promise<void> {
        let seek = null;

        if (options) {
            if (options.seek) seek = options.seek;
        }

        // Converter
        if (track.source === AudioMediaSource.SPOTIFY) {
            // Converting message
            this.textChannel.send({ embeds: [createTrackConvertingEmbed(track)] });

            const result = await searchYouTube(`${track.artists[0].name} - ${track.title} (${formatDurationTimestamp(track.duration)})`, {
                type: track.type,
                count: 1,
                requester: track.requester
            });

            track = result.items[0] as Track;
        }

        let input = null;

        // Downloader
        if (track.source === AudioMediaSource.YOUTUBE || track.source === AudioMediaSource.YOUTUBE_MUSIC) {
            const data = await youtubeDl.exec(
                track.url,
                {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true,
                    skipDownload: true,
                    extractAudio: true,
                }
            );

            const dataJSON = JSON.parse(data.stdout);

            input = dataJSON.url;
        }
        else if (track.source === AudioMediaSource.SOUNDCLOUD) {
            return;
        }

        // FFMPEG
        const stream = this.createFFmpegStream(input);

        const resource = createAudioResource(stream, {
            inlineVolume: true,
            metadata: track
        });

        this.audioPlayer?.play(resource);

        // Update now playing item. This achieves consistency
        this.queue.remove(0);
        this.queue.add(track, 0);
    }

    /**
     * Pauses the audio player
     * @returns
     */
    pause(): boolean {
        if (!this.audioPlayer) return false;

        return this.audioPlayer.pause();
    }

    /**
     * Resumes the audio player
     * @returns
     */
    resume(): boolean {
        if (!this.audioPlayer) return false;

        return this.audioPlayer.unpause();
    }

    /**
     * Stops the audio player
     * @returns
     */
    stop(): boolean {
        if (!this.audioPlayer) return false;

        return this.audioPlayer.stop(true);
    }

    /**
     * Skips to the next item in the queue
     * @param position
     */
    skipToNext(position?: number) {
        if (!this.audioPlayer) return;

        this.queue.next(position);
        this.stop();
    }

    /**
     * Skips to the previous item in the queue
     */
    skipToPrevious() {
        if (!this.audioPlayer) return;

        this.queue.previous();
        this.stop();
    }

    setVolume(level: number) {
        if (!this.audioPlayer) {
            return;
        }

        this.volume = level;

        if (this.isPlaying()) {
            const state = this.audioPlayer.state as AudioPlayerPlayingState;
            state.resource.volume?.setVolumeLogarithmic(this.volume / 100);
        }
    }

    setTextChannel(textChannel: SendableChannels): void {
        this.textChannel = textChannel;
    }

    playbackDuration(): number | void {
        if (!this.isPlaying) return;

        const state = this.audioPlayer?.state as AudioPlayerPlayingState;
        return state.playbackDuration + this.metadata.addedPlaybackDuration;
    }

    /**
     * Whether the player is connected
     * @returns 
     */
    isConnected(): boolean {
        if (!this.voiceConnection) return false;
        return this.voiceConnection.state.status === VoiceConnectionStatus.Ready;
    }

    /**
     * Whether the player is playing
     * @returns 
     */
    isPlaying(): boolean {
        if (!this.audioPlayer) return false;
        return this.audioPlayer.state.status === AudioPlayerStatus.Playing || this.audioPlayer.state.status === AudioPlayerStatus.Paused
    }

    /**
     * Whether the player is paused
     * @returns 
     */
    isPaused(): boolean {
        if (!this.audioPlayer) return false;
        return this.audioPlayer.state.status === AudioPlayerStatus.Paused;
    }

    createFFmpegStream(stream: any, options?: { seek?: number }) {
        let seek = null;

        if (options) {
            if (options.seek) seek = options.seek;
        }

        let FFMPEGArguments = [
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5",
            "-i", stream,
            "-analyzeduration", "0",
            "-loglevel", "0",
            "-f", "opus",
            "-ar", "48000",
            "-ac", "2",
        ];

        if (seek) {
            FFMPEGArguments.splice(FFMPEGArguments.findIndex(x => x === "-i"), 0,
                "-ss", seek.toString(),
                "-accurate_seek"
            );
        }

        const ffmpegStream = new FFmpeg({ args: FFMPEGArguments });

        return ffmpegStream;

    }

    async createMessage(): Promise<void> {
        const embed = createPlayerEmbed(this);
        const actionRows = createPlayerActionRows(this);

        if (this.metadata.playerMessage) {
            if (this.textChannel.id !== this.metadata.playerMessage.channel.id) {
                this.destroyMessage();

                const message = await this.textChannel.send({ embeds: [embed], components: actionRows });
                this.metadata.playerMessage = message;
            }
            else this.metadata.playerMessage.edit({ embeds: [embed], components: actionRows });
        }
        else {
            const message = await this.textChannel.send({ embeds: [embed], components: actionRows });
            this.metadata.playerMessage = message;
        }

        if (this.metadata.playerMessageUpdateInterval) {
            this.metadata.playerMessageUpdateInterval.close();
            this.metadata.playerMessageUpdateInterval = null;
        }

        const updateInterval = setInterval(async () => {
            const track = this.queue.items[0] as Track;
            const audioPlayerState = this.audioPlayer!.state as AudioPlayerPlayingState;
            const playbackDuration = audioPlayerState.playbackDuration + this.metadata.addedPlaybackDuration;

            embed.setFields(
                {
                    name: createProgressBar(playbackDuration, track.duration, false),
                    value: "`" + formatDurationTimestamp(playbackDuration) + "` **/** `" + formatDurationTimestamp(track.duration) + "`",
                }
            )
            const actionRows = createPlayerActionRows(this);

            if (this.metadata.playerMessage) {
                this.metadata.playerMessage.edit({ embeds: [embed], components: actionRows });
            }
        }, 1000);

        this.metadata.playerMessageUpdateInterval = updateInterval;
    }

    destroyMessage(): void {
        if (this.metadata.playerMessage) {
            this.metadata.playerMessage.delete();
            this.metadata.playerMessage = null;
        }

        if (this.metadata.playerMessageUpdateInterval) {
            this.metadata.playerMessageUpdateInterval.close();
            this.metadata.playerMessageUpdateInterval = null;
        }
    }
}

export default Player;