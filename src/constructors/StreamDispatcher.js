const { createAudioPlayer, VoiceConnectionStatus, VoiceConnectionDisconnectReason, entersState } = require("@discordjs/voice");
const { promisify } = require("util");

const wait = promisify(setTimeout);

module.exports = class StreamDispatcher {
	/**
	 * Creates a stream dispatcher
	 * @param {Object} data Discord.js message or interaction object
	 * @param {Object} connection The connection to Discord
	 */
	constructor(data, connection) {
		this.connection = connection;
		this.audioPlayer = createAudioPlayer();

		this.connection.on('stateChange', async (_, newState) => {
			if (newState.status === VoiceConnectionStatus.Disconnected) {
				if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
					/*
						If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
						but there is a chance the connection will recover itself if the reason of the disconnect was due to
						switching voice channels. This is also the same code for the bot being kicked from the voice channel,
						so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
						the voice connection.
					*/
					try {
						await entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000);
						// Probably moved voice channel
					} catch {
						this.connection.destroy();
						// Probably removed from voice channel
					}
				} else if (this.connection.rejoinAttempts < 5) {
					/*
						The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
					*/
					await wait((this.connection.rejoinAttempts + 1) * 5_000);
					this.connection.rejoin();
				} else {
					/*
						The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
					*/
					this.connection.destroy();
				}
			} else if (newState.status === VoiceConnectionStatus.Destroyed) {
				/*
					Once destroyed, stop the subscription
				*/
				this.audioPlayer.stop();
				data.client.queues.delete(data.guild.id);
			} else if (
				!this.readyLock &&
				(newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
			) {
				/*
					In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
					before destroying the voice connection. This stops the voice connection permanently existing in one of these
					states.
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

		this.connection.on("error", (error) => {
			console.log(error);
			data.channel.send(`${data.client.emotes.error} **An error occurred with the connection to** <#${this.connection.joinConfig.channelId}>`);
		});

		this.connection.subscribe(this.audioPlayer);
	}

}