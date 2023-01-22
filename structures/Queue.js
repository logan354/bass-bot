const { QueueDirection, RepeatMode } = require("../utils/constants");

class Queue extends Array {
    constructor() {
        super();

        /**
         * The direction of this queue
         * @type {QueueDirection}
         */
        this.direction = QueueDirection.NEUTRAL;

        /**
         * The repeat mode of this queue
         * @type {RepeatMode}
         */
        this.repeat = RepeatMode.OFF;

        /**
         * The previous queue of this queue
         * @type {import("./searchEngine").Track[]}
         */
        this.previousQueue = [];
    }


    /**
     * Adds a track or tracks to the queue
     * @param {import("./searchEngine").Track|import("./searchEngine").Track[]} input
     * @param {number} position
     */
    add(input, position) {
        if (!Array.isArray(input)) {
            if (position) {
                this.splice(position, 0, input);
            }
            else {
                this.push(input);
            }
        }
        else {
            if (position) {
                this.splice(position, 0, ...input)
            }
            else {
                this.push(...input);
            }
        }
    }

    /**
     * Moves a track in this queue
     * @param {number} index 
     * @param {number} position 
     */
    move(index, position) {
        const track = this.splice(index, 1);
        this.splice(position, 0, ...track)
    }

    /**
     * Removes a track in this queue
     * @param {number} index 
     */
    remove(index) {
        this.splice(index, 1);
    }

    /**
     * Processes this queue
     */
    process() {
        if (this.repeat === RepeatMode.QUEUE) {
            if (this.direction === QueueDirection.PREVIOUS) {
                // Add the last element in the queue to the start
                this.splice(0, 0, ...this.pop());

                this.previousQueue.splice(0);
            }
            else {
                // Push the current track to the end of the queue
                this.push(this.shift());

                this.previousQueue.splice(0);
            }
        }
        else if (this.repeat === RepeatMode.TRACK) {
            if (this.direction === QueueDirection.PREVIOUS) {
                // Add the previous track to the start of the queue
                this.splice(0, 0, this.previousQueue.pop());
            }
            else if (this.direction === QueueDirection.NEXT) {
                if (!this.length) {
                    this.previousQueue.splice(0);
                    return;
                }

                // Push the current track to the end of the previous queue
                this.previousQueue.push(this.shift());
            }
            else {
                return;
            }
        }
        else {
            if (this.direction === QueueDirection.PREVIOUS) {
                // Add the previous track to the start of the queue
                this.splice(0, 0, this.previousQueue.pop());
            }
            else {
                if (!this.length) {
                    this.previousQueue.splice(0);
                    return;
                }

                // Push the current track to the end of the previous queue
                this.previousQueue.push(this.shift());
            }
        }

        // Remove previous queue element
        if (this.previousQueue > 5) this.previousQueue.shift();

        this.direction = QueueDirection.NEUTRAL;
    }

    /**
     * Clears this queue
     */
    clear() {
        this.splice(1);
        this.previousQueue.splice(0);
    }

    /**
     * Shuffles this queue
     */
    shuffle() {
        const currentTrack = this.shift();

        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }

        this.unshift(currentTrack);
    }
}

module.exports = Queue;