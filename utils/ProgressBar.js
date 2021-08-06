const { formatDuration } = require("./Formatting");

/**
 * Creates progress bar
 * @param {object} message Discord.js message
 * @returns {string} Progress bar with timecodes and indicator
 */
function createProgressBar(message) {
    const queue = message.client.queues.get(message.guild.id);

    const currentStreamTime = queue.connection.dispatcher.streamTime;
    const totalTime = queue.tracks[0].duration;
    const length = 15;

    const index = Math.round((currentStreamTime / totalTime) * length);
    const indicator = "🔘";
    const line = "▬";

    if (index >= 1 && index <= length) {
        const bar = line.repeat(length - 1).split("");
        bar.splice(index, 0, indicator);
        const currentTimecode = formatDuration(currentStreamTime);
        const endTimecode = queue.tracks[0].durationFormatted;
        return `${currentTimecode} ┃ ${bar.join("")} ┃ ${endTimecode}`;
    } else {
        const currentTimecode = formatDuration(currentStreamTime);
        const endTimecode = queue.tracks[0].durationFormatted;
        return `${currentTimecode} ┃ ${indicator}${line.repeat(length - 1)} ┃ ${endTimecode}`;
    }
}

module.exports = { createProgressBar }