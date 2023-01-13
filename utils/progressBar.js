const { formatDuration } = require("./formats");

/**
 * Creates progress bar
 * @param {number} currentDuration
 * @param {number} totalDuration
 * @param {string} endTimecode
 * @returns {string}
 */
function createProgressBar(currentDuration, totalDuration, endTimecode) {
    const length = 15;

    const index = Math.round((currentDuration / totalDuration) * length);
    const indicator = "🔘";
    const line = "▬";

    if (index >= 1 && index <= length) {
        const bar = line.repeat(length - 1).split("");
        bar.splice(index, 0, indicator);
        const currentTimecode = formatDuration(currentDuration);
        return `${currentTimecode} ┃ ${bar.join("")} ┃ ${endTimecode}`;
    } else {
        const currentTimecode = formatDuration(currentDuration);
        return `${currentTimecode} ┃ ${indicator}${line.repeat(length - 1)} ┃ ${endTimecode}`;
    }
}

module.exports = { createProgressBar }