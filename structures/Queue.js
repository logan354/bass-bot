module.exports = class Queue {
    constructor(message) {
        /**
         * Guild id of this queue
         */
        this.guildID = message.guild.id;

        /**
         * Text channel of this queue
         */
        this.textChannel = message.channel;

        /**
         * Voice channel of this queue
         */
        this.voiceChannel = message.member.voice.channel;

        /**
         * Connection of this queue
         */
        this.connection = null;

        /**
         * Tracks of this queue
         */
        this.tracks = [];

        /**
         * Skiplist of this queue
         */
        this.skiplist = [];

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
         * Playing mode of this queue
         */
        this.playing = true;
    }

    /**
     * Duration of this queue
     */
    duration() {
        return this.tracks.map((x) => x.duration);
    }
}