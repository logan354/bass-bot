const { RepeatMode } = require("../utils/constants");

class Queue extends Array {

    /**
     * The previous queue of this queue
     * @type {import("./searchEngine").Track[]}
     */
    previousQueue = [];

    /**
     * The repeat mode of this queue
     * @type {RepeatMode}
     */
    repeat = RepeatMode.OFF;

    /**
     * Whether the current track was skipped from the queue
     */
    _next = false;

    /**
     * Whether the current track is from the previous queue
     * @type {boolean}
     */
    _previous = false;


    /**
     * Adds a track to the queue
     * @param {import("./searchEngine").Track|import("./searchEngine").Track[]} track
     */
    add(track) {
        if (Array.isArray(track)) {
            this.push(...track);
        }
        else {
            this.push(track);
        }
    }

    /**
     * Moves a track in this queue
     * @param {number} index 
     * @param {number} position 
     */
    move(index, position) {
        const track = this[index + 1];
        this.splice(index + 1, 1);
        this.splice(position + 1, 0, track)
    }

    /**
     * Removes a track in this queue
     * @param {number} index 
     */
    remove(index) {
        this.splice(index, 1);
    }

    process() {
        if (this.repeat === RepeatMode.QUEUE) {
            this.previousQueue.push(shifted);

            if (this.previousQueue > 5) this.previousQueue.shift();

            this.queue.push(shifted);
            this.play(this.queue[0]);
        }
        else {
            if (this._previous) {
                this.splice(0, 0, ...this.previousQueue.splice(this.previousQueue.length - 1, 1))
            }
            else {
                this.previousQueue.push(this.shift());

                if (this.previousQueue > 5) this.previousQueue.shift();
            }
        }

        this._next = false;
        this._previous = false;
    }

    next()

    previous()

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