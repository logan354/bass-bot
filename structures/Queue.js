class Queue extends Array {

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
        this.splice(index + 1, 1);
    }

    /**
     * Clears this queue
     */
    clear() {
        const currentTrack = this[0];
        this.splice(0);
        this.push(currentTrack);
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