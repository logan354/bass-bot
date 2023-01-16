class Queue extends Array {
    shuffle() {
        const currentTrack = this.shift();

        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
          }

        this.unshift(currentTrack);
    }

    clear() {
        this.splice(0);
    }
}

module.exports = Queue;