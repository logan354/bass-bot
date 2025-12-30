import { Message, SendableChannels, Snowflake, VoiceBasedChannel } from "discord.js";
import { AudioPlayer, AudioPlayerPlayingState, AudioPlayerState, AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, NoSubscriberBehavior, VoiceConnection, VoiceConnectionDisconnectReason, VoiceConnectionState, VoiceConnectionStatus } from "@discordjs/voice";
import { promisify } from "node:util";
import { FFmpeg } from "prism-media";
import ytdl from "youtube-dl-exec";

import PlayerManager from "./PlayerManager";
import Queue from "../queue/Queue";
import { QueueableAudioMedia } from "../AudioMedia";
import { AudioMediaSource, QueueableAudioMediaType, RepeatMode } from "../../utils/constants";
import { searchYouTube } from "../search/extractors/youtube";
import Track from "../models/Track";
import { createPlayerActionRows, createPlayerEmbed, createQueueEmptyMessage, createConvertingEmbed } from "../../utils/components";
import LiveStream from "../models/LiveStream";

const wait = promisify(setTimeout);

const defaultPlayerState = (): PlayerState => ({
    message: null,
    seekDuration: 0
});

interface PlayerState {
    message: {
        message: Message
        updater: NodeJS.Timeout
    } | null;

    seekDuration: number;
}

class Player {
    readonly playerManager: PlayerManager;

    readonly guildId: Snowflake;

    textChannel: SendableChannels;

    voiceChannel: VoiceBasedChannel | null = null;

    voiceConnection: VoiceConnection | null = null;

    private audioPlayer: AudioPlayer | null = null;

    readonly queue: Queue = new Queue();

    volume: number = 100;

    state: PlayerState = defaultPlayerState();

    constructor(playerManager: PlayerManager, guildId: Snowflake, textChannel: SendableChannels) {
        this.playerManager = playerManager;
        this.guildId = guildId;
        this.textChannel = textChannel
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
        catch (e) {
            voiceConnection.destroy();
            throw e;
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
                        }
                        catch {
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

                        // Prevent use of voiceStateUpdate
                        const voiceChannel = this.playerManager.bot.channels.cache.get(voiceConnection.joinConfig.channelId!) as VoiceBasedChannel;
                        this.voiceChannel = voiceChannel;
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

            audioPlayer.on("stateChange", async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    /**
                     * If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                     * The queue is then processed to start playing the next track, if one is available.
                     */
                    // State
                    if (this.queue.repeatMode !== RepeatMode.ONE) this.closeMessage(false);

                    this.state.seekDuration = 0;

                    // Queue
                    if (this.queue.lock) this.queue.next(true);
                    else this.queue.lock = true;

                    // Player
                    this.play();
                } else if (newState.status === AudioPlayerStatus.Playing) {
                    // If the Playing state has been entered, then a new track has started playback.
                    // State
                    if (!this.state.message) this.createMessage();
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
     * @param item
     * @async
     * @returns
     */
    async play(item?: QueueableAudioMedia): Promise<void> {
        if (!this.audioPlayer) return;

        if (item) {
            this.queue.remove(0);
            this.queue.add(item, 0);
        }
        else {
            if (this.queue.isEmpty()) {
                this.textChannel.send(await createQueueEmptyMessage(this.playerManager.bot));
                return;
            }

            item = this.queue.items[0];
        }

        let streamURL = null;

        if (item.streamURL) streamURL = item.streamURL;
        else {
            // Convert Spotify to YouTube
            if (item.source === AudioMediaSource.SPOTIFY) {
                if (item.type === QueueableAudioMediaType.TRACK) {
                    const track = item as Track;

                    this.textChannel.send({ embeds: [createConvertingEmbed(track)] });

                    const result = await searchYouTube(`${track.title} - ${track.artists[0].name}`, {
                        type: track.type,
                        count: 1,
                        requester: track.requester
                    });

                    item = result.items[0] as QueueableAudioMedia;
                }
                else {
                    // Skipped
                    return;
                }
            }

            // Downloader
            if (item.source === AudioMediaSource.YOUTUBE || item.source === AudioMediaSource.YOUTUBE_MUSIC || item.source === AudioMediaSource.SOUNDCLOUD) {
                streamURL = await this.getStreamURL(item);
                item.streamURL = streamURL!;
            }
            else {                
                this.queue.next(true);
                this.play();

                // Skipped Embed
                return;
            }
        }

        const stream = this.createFFmpegStream(streamURL);

        const resource = createAudioResource(stream, {
            inlineVolume: true,
            metadata: item
        });

        this.audioPlayer.play(resource);
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

        this.queue.next(false, position);
        this.stop();
    }

    /**
     * Skips to the previous item in the queue
     */
    skipToPrevious() {
        if (!this.audioPlayer) return;

        this.queue.previous(false);
        this.stop();
    }

    /**
     * Seek currently playing item
     * @param milliseconds 
     * @returns 
     */
    seek(milliseconds: number): void {
        if (!this.isPlaying()) return;

        const item = this.queue.items[0];

        if (item.type === QueueableAudioMediaType.LIVE_STREAM) return;
        else if (item.type === QueueableAudioMediaType.TRACK) {
            const stream = this.createFFmpegStream(item.streamURL, milliseconds);

            const resource = createAudioResource(stream, {
                inlineVolume: true,
                metadata: item,
            });

            this.audioPlayer!.play(resource);
        }
    }

    /**
     * Set the player volume
     * @param level 
     * @returns 
     */
    setVolume(level: number): void {
        if (!this.audioPlayer || !this.isPlaying()) return;

        const volume = Math.max(0, Math.min(200, level));

        const state = this.audioPlayer.state as AudioPlayerPlayingState;
        state.resource.volume!.setVolumeLogarithmic(volume / 100);

        this.volume = volume;
    }

    /**
     * Set the player text channel
     * @param textChannel 
     */
    setTextChannel(textChannel: SendableChannels) {
        this.textChannel = textChannel;
    }

    playbackDuration(): number | void {
        if (!this.isPlaying()) return;

        const state = this.audioPlayer?.state as AudioPlayerPlayingState;
        return state.playbackDuration + this.state.seekDuration;
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

    async getStreamURL(item: QueueableAudioMedia): Promise<string | undefined> {
        let url;

        if (item.type === QueueableAudioMediaType.LIVE_STREAM) {
            const liveStream = item as LiveStream;
            url = liveStream.url;
        }
        else if (item.type === QueueableAudioMediaType.TRACK) {
            const track = item as Track;
            url = track.url;
        }
        else return undefined;

        const data = await ytdl.exec(
            url,
            {
                dumpSingleJson: true,
                extractAudio: true
            }
        );

        const dataJSON = JSON.parse(data.stdout);

        return dataJSON.url;
    }

    private createFFmpegStream(streamURL: any, seek?: number) {
        let args = [
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5",
            "-i", streamURL,
            "-analyzeduration", "0",
            "-loglevel", "0",
            "-f", "opus",
            "-ar", "48000",
            "-ac", "2",
        ];

        if (seek) {
            args.splice(args.indexOf("-i"), 0, "-ss", (seek / 1000).toString(), "-accurate_seek");
            this.state.seekDuration = seek;

            this.state.seekDuration = seek;
        }

        const stream = new FFmpeg({ args: args });

        return stream;
    }

    async createMessage(): Promise<void> {
        if (this.state.message) await this.closeMessage(true);

        const embed = createPlayerEmbed(this);
        const actionRows = createPlayerActionRows(this);

        const message = await this.textChannel.send({ embeds: [embed], components: actionRows });

        const updater = setInterval(async () => {
            const embed = createPlayerEmbed(this);
            const actionRows = createPlayerActionRows(this);

            this.state.message!.message.edit({ embeds: [embed], components: actionRows });
        }, 1000);

        this.state.message = {
            message: message,
            updater: updater
        }
    }

    private async closeMessage(_delete: boolean): Promise<void> {
        if (!this.state.message) return;

        const embed = createPlayerEmbed(this);
        const actionRows = createPlayerActionRows(this);

        await this.state.message.message.edit({ embeds: [embed], components: actionRows });

        if (_delete) await this.state.message.message.delete();
        clearInterval(this.state.message.updater);

        this.state.message = null;
    }
}

export default Player;