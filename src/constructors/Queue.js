const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require("@discordjs/voice");
const StreamDispatcher = require("./StreamDispatcher");

module.exports = class Queue {
    /**
     * Queue constructor
     * @param {string} guildId The id of the guild that instantiated this queue
     */
    constructor(guildId) {
        /**
         * Guild of this queue
         */
        this.id = guildId;

        /**
         * Stream dispatcher of this queue
         */
        this.streamDispatcher = null;

        /**
         * Tracks of this queue
         */
        this.tracks = [];

        /**
         * Skiplist of this queue
         */
        this.skiplist = [];

        /**
         * Paused mode of this queue
         */
        this.paused = false;

        /**
         * Volume of this queue
         */
        this.volume = 100;

        /**
         * Loop mode of this queue
         */
        this.loop = false;

        /**
         * Loop queue mode of this queue
         */
        this.loopQueue = false;

        /**
         * Additional stream time of this queue
         */
        this.additionalStreamTime = 0;
    }

    /**
     * Duration of this queue
     * @returns {number}
     */
    duration() {
        let totalDuration = 0;
        for (let i = 0; i < this.tracks.length; i++) {
            totalDuration += this.tracks[i].duration;
        }
        return totalDuration;
    }

    /**
     * 
     * @param {Object} data Discord.js message or interaction object
     * @param {Object} channel The voice or stage channel object
     */
    async connect(data, channel) {
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

        if (!this.streamDispatcher) this.streamDispatcher = new StreamDispatcher(data, connection);
    }
}
