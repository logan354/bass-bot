const { Util } = require("../src/Utils");

/**
 * Creates progress bar
 * @param {number} currentStreamTime
 * @param {number} totalTime
 * @param {string} endTimecode
 * @returns 
 */
function createProgressBar(currentStreamTime, totalTime, endTimecode) {
    const length = 15;

    const index = Math.round((currentStreamTime / totalTime) * length);
    const indicator = "🔘";
    const line = "▬";

    if (index >= 1 && index <= length) {
        const bar = line.repeat(length - 1).split("");
        bar.splice(index, 0, indicator);
        const currentTimecode = Util.formatDuration(currentStreamTime);
        return `${currentTimecode} ┃ ${bar.join("")} ┃ ${endTimecode}`;
    } else {
        const currentTimecode = Util.formatDuration(currentStreamTime);
        return `${currentTimecode} ┃ ${indicator}${line.repeat(length - 1)} ┃ ${endTimecode}`;
    }
}

module.exports = { createProgressBar }