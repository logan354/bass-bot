const { EventEmitter } = require("events");
const { promisify } = require("node:util");
const wait = promisify(setTimeout);

const { VoiceConnection, createAudioPlayer, NoSubscriberBehavior, VoiceConnectionStatus, VoiceConnectionDisconnectReason, entersState, AudioPlayerStatus, AudioPlayer } = require("@discordjs/voice");

class StreamDispatcher extends EventEmitter {
    /**
     * Stream dispatcher constructor
     * @param {VoiceConnection} connection 
     * @param {import("./Queue")} queue 
     */
    constructor(connection, queue) {
        super();
        
        /**
         * Connection of this stream dispatcher
         * @type {VoiceConnection}
         */
        this.connection = connection;

        /**
         * Audio player of this stream dispatcher
         * @type {AudioPlayer}
         */
        this.audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            }
        });

        /**
         * Queue bound to this stream dispatcher
         * @type {import("./Queue")}
         */
        this.queue = queue;

        /**
         * Ready lock of this stream dispatcher
         * @type {boolean}
         */
        this.readyLock = false;

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
                    } catch {
                        this.connection.destroy();
                        // Probably removed from voice channel
                    }
                } else if (this.connection.rejoinAttempts < 5) {
                    /**
                     * The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
                     */
                    await wait((this.connection.rejoinAttempts + 1) * 5_000);
                    this.connection.rejoin();
                } else {
                    /**
                     * The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
                     */
                    this.connection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                /**
                 * Once destroyed, stop the subscription.
                 */
                this.stop();
            } else if (
                !this.readyLock &&
                (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
            ) {
                /**
                 * In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
                 * before destroying the voice connection. This stops the voice connection permanently existing in one of these
                 * states.
                 */
                this.readyLock = true;
                try {
                    await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
                } catch {
                    if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) this.connection.destroy();
                } finally {
                    this.readyLock = false;
                }
            }
        });

        // Configure audio player
        this.audioPlayer.on("stateChange", (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                this.emit("finish", oldState.resource.metadata);
            } else if (newState.status === AudioPlayerStatus.Playing && oldState.status === AudioPlayerStatus.Buffering) {
                // If the Playing state has been entered, then a new track has started playback.
                this.emit("start", newState.resource.metadata);
            }
        });

        this.audioPlayer.on("error", (error) => {
            console.log(error);
            this.queue.textChannel.send(this.queue.client.emotes.error + " **Error** `AudioPlayerError: " + error.message + "`");
        });

        this.connection.subscribe(this.audioPlayer);
    }

    /**
     * Stops audio player and destroys queue
     */
    stop() {
        this.audioPlayer.stop();
        this.queue.client.queues.delete(this.queue.guildId);
    }
}

/**
 * Emitted when the audio player starts playing
 * @event StreamDispatcher#start
 * @param {import("./SearchEngine").Track} metadata  
 */

/**
 * Emitted when the audio player finishes playing
 * @event StreamDispatcher#finish
 * @param {import("./SearchEngine").Track} metadata
 */

module.exports = StreamDispatcher;