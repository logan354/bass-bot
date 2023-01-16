/**
 * Creates progress bar
 * @param {number} currentDuration
 * @param {number} totalDuration
 * @returns {string}
 */
function createProgressBar(currentDuration, totalDuration) {
    const length = 15;

    const index = Math.round((currentDuration / totalDuration) * length);
    const indicator = "🔘";
    const line = "▬";

    if (index >= 1 && index <= length) {
        const bar = line.repeat(length - 1).split("");
        bar.splice(index, 0, indicator);
        return `┃ ${bar.join("")} ┃`;
    } else {
        return `┃ ${indicator}${line.repeat(length - 1)} ┃`;
    }
}

module.exports = { createProgressBar }