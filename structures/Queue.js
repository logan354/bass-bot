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

        /**
         * The maximum number of tracks stored in the previous queue
         * @type {number}
         */
        this.previousQueueLimit = 5;
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
        this.splice(position, 0, ...this.splice(index, 1))
    }

    /**
     * Removes a track in this queue
     * @param {number} index 
     */
    remove(index) {
        this.splice(index, 1);
    }

    /**
     * Clears this queue
     * @param {boolean} current
     */
    clear(current) {
        if (current) {
            this.splice(0);
        }
        else {
            this.splice(1);
        }

        this.previousQueue.splice(0);
    }

    /**
     * Shuffles this queue
     */
    shuffle() {
        const current = this.shift();

        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }

        this.unshift(current);
    }

    /**
     * Processes this queue
     */
    _process() {
        if (this.direction === QueueDirection.NEXT) {
            if (this.repeat === RepeatMode.QUEUE) {
                this.push(this.shift());
            }
            else if (this.repeat === RepeatMode.TRACK || this.repeat === RepeatMode.OFF) {
                this.previousQueue.push(this.shift());
            }
        }
        else if (this.direction === QueueDirection.PREVIOUS) {
            if (this.repeat === RepeatMode.QUEUE) {
                this.splice(0, 0, this.pop());
            }
            else if (this.repeat === RepeatMode.TRACK || this.repeat === RepeatMode.OFF) {
                if (this.previousQueue.length) {
                    this.splice(0, 0, this.previousQueue.pop());
                }
            }
        }
        else if (this.direction === QueueDirection.NEUTRAL) {
            if (this.repeat === RepeatMode.QUEUE) {
                this.push(this.shift());
            }
            else if (this.repeat === RepeatMode.OFF) {
                this.previousQueue.push(this.shift());
            }
        }

        // Clear the previous queue if the repeat mode is set to QUEUE
        if (this.repeat === RepeatMode.QUEUE) {
            this.previousQueue.splice(0);
        }

        // Remove the furthest track if the previous queue is over its limit
        if (this.previousQueue > this.previousQueueLimit) {
            this.previousQueue.shift();
        }

        // Reset the queue direction to neutral
        this.direction = QueueDirection.NEUTRAL;
    }
}

module.exports = Queue;