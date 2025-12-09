import { Message, SendableChannels, Snowflake, TextBasedChannel, VoiceBasedChannel } from "discord.js";
import { AudioPlayer, AudioPlayerPlayingState, AudioPlayerState, AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, NoSubscriberBehavior, VoiceConnection, VoiceConnectionDisconnectReason, VoiceConnectionState, VoiceConnectionStatus } from "@discordjs/voice";
import youtubeDl from "youtube-dl-exec";
import { FFmpeg } from "prism-media";

import PlayerManager from "./PlayerManager";
import Queue from "../queue/Queue";
import { promisify } from "node:util";
import { QueueableAudioMedia } from "../AudioMedia";
import { AudioMediaSource, QueueableAudioMediaType, RepeatMode } from "../../utils/constants";
import { searchYouTube } from "../search/extractors/youtube";
import Track from "../models/Track";
import { createProgressBar, formatTimestamp } from "../../utils/util";
import { createPlayerActionRows, createPlayerEmbed, createQueueEmptyMessage, createTrackConvertingEmbed } from "../../utils/components";
import LiveStream from "../models/LiveStream";

const wait = promisify(setTimeout);

interface PlayerState {
    addedPlaybackDuration: number
    playerMessage: Message | null
    playerMessageLock: boolean
    playerMessageUpdateInterval: NodeJS.Timeout | null
    streamUrl: string | null
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

    state: PlayerState = {
        addedPlaybackDuration: 0,
        playerMessage: null,
        playerMessageLock: false,
        playerMessageUpdateInterval: null,
        streamUrl: null
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
                    const save = this.queue.repeatMode === RepeatMode.ONE ? true : this.state.playerMessageLock;
                    this.closePlayerMessage(save);
                    this.state.playerMessageLock = false;

                    // Meaning no action by user. e.g next or previous functions
                    if (this.queue.lock) this.queue.next();
                    else this.queue.lock = true;

                    this.play();
                } else if (newState.status === AudioPlayerStatus.Playing) {
                    // If the Playing state has been entered, then a new track has started playback.
                    // Update now playing item. This achieves consistency
                    this.queue.remove(0);
                    this.queue.add(newState.resource.metadata as QueueableAudioMedia, 0);

                    this.createPlayerMessage();
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
            if (item.type === QueueableAudioMediaType.LIVE_STREAM) {
                const liveStream = item as LiveStream;
                await this.playLiveStream(liveStream);
            }
            else if (item.type === QueueableAudioMediaType.TRACK) {
                const track = item as Track;
                await this.playTrack(track);
            }
            else return;
        }
    }

    async playLiveStream(liveStream: LiveStream): Promise<void> {
        // TODO
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

            const result = await searchYouTube(`${track.title} - ${track.artists[0].name}`, {
                type: track.type,
                count: 1,
                requester: track.requester
            });

            track = result.items[0] as Track;

            this.queue.remove(0);
            this.queue.add(track, 0);
        }

        let input = null;

        // Downloader
        if (this.queue.repeatMode === RepeatMode.ONE || seek !== null) {
            input = this.state.streamUrl;
        }
        else {
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
        }

        this.state.streamUrl = input;

        // FFMPEG
        let stream

        if (seek !== null) {
            stream = this.createFFmpegStream(input, { seek: seek });
            this.state.playerMessageLock = true;
        }
        else stream = this.createFFmpegStream(input);

        const resource = createAudioResource(stream, {
            inlineVolume: true,
            metadata: track
        });

        this.audioPlayer?.play(resource);
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
        return state.playbackDuration + this.state.addedPlaybackDuration;
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
                "-ss", (seek / 1000).toString(),
                "-accurate_seek"
            );

            this.state.addedPlaybackDuration = seek;
        }

        const ffmpegStream = new FFmpeg({ args: FFMPEGArguments });

        return ffmpegStream;
    }

    async createPlayerMessage(): Promise<void> {
        const embed = createPlayerEmbed(this);
        const actionRows = createPlayerActionRows(this);

        if (this.state.playerMessage) {
            if (this.textChannel.id !== this.state.playerMessage.channel.id) {
                this.destroyPlayerMessage();

                const message = await this.textChannel.send({ embeds: [embed], components: actionRows });
                this.state.playerMessage = message;
            }
            else this.state.playerMessage.edit({ embeds: [embed], components: actionRows });
        }
        else {
            const message = await this.textChannel.send({ embeds: [embed], components: actionRows });
            this.state.playerMessage = message;
        }

        if (this.state.playerMessageUpdateInterval) {
            this.state.playerMessageUpdateInterval.close();
            this.state.playerMessageUpdateInterval = null;
        }

        const updateInterval = setInterval(async () => {
            const embed = createPlayerEmbed(this);
            const actionRows = createPlayerActionRows(this);

            if (this.state.playerMessage) {
                this.state.playerMessage.edit({ embeds: [embed], components: actionRows });
            }
        }, 1000);

        this.state.playerMessageUpdateInterval = updateInterval;
    }

    async updatePlayerMessage(): Promise<void> {
        if (!this.state.playerMessage) return;

        const embed = createPlayerEmbed(this);
        const actionRows = createPlayerActionRows(this);

        await this.state.playerMessage.edit({ embeds: [embed], components: actionRows });
    }

    closePlayerMessage(save: boolean) {
        this.updatePlayerMessage();

        if (!save) this.state.playerMessage = null;

        if (this.state.playerMessageUpdateInterval !== null) {
            this.state.playerMessageUpdateInterval.close();
            this.state.playerMessageUpdateInterval = null;
        }
    }

    destroyPlayerMessage(): void {
        if (this.state.playerMessage !== null) this.state.playerMessage.delete();

        this.closePlayerMessage(false);
    }
}

export default Player;