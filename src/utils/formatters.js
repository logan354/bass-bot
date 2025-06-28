

/**
 * Formats milliseconds to a formatted time 
 * e.g 0:30, 1:30, 2:15, 5:20
 * @param {number} milliseconds 
 * @returns {string}
 */
function formatDuration(milliseconds) {
    if (!milliseconds || !parseInt(milliseconds)) return "0:00";
    const seconds = Math.floor(milliseconds % 60000 / 1000);
    const minutes = Math.floor(milliseconds % 3600000 / 60000);
    const hours = Math.floor(milliseconds / 3600000);
    if (hours > 0) {
        return `${hours}:${formatInt(minutes)}:${formatInt(seconds)}`;
    }
    if (minutes > 0) {
        return `${minutes}:${formatInt(seconds)}`;
    }
    return `0:${formatInt(seconds)}`;
}

/**
 * Formats milliseconds to formal time 
 * e.g 3 hours 2 minutes 30 seconds
 * @param {number} milliseconds 
 * @returns {string}
 */
function formatFormalTime(milliseconds) {
    if (!milliseconds || !parseInt(milliseconds)) return undefined;
    const seconds = Math.floor(milliseconds % 60000 / 1000);
    const minutes = Math.floor(milliseconds % 3600000 / 60000);
    const hours = Math.floor(milliseconds / 3600000);
    const days = Math.floor(milliseconds / 86400000);
    if (days > 0) {
        return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
    }
    if (hours > 0) {
        return `${hours} hours ${minutes} minutes ${seconds} seconds`;
    }
    if (minutes > 0) {
        return `${minutes} minutes ${seconds} seconds`
    }
    return `${seconds} seconds`;
}



/**
 * Formats array into chunks
 * @param {Array} arr 
 * @param {number} size 
 * @returns {string[]}
 */
function formatChunk(arr, size) {
    const temp = [];
    for (let i = 0; i < arr.length; i += size) {
        temp.push(arr.slice(i, i + size));
    }
    return temp;
}

/**
 * Formats a title to a shortened format
 * @param {string} title 
 * @returns {string}
 */
function formatShortenedTitle(title) {
    const dots = " . . .";

    if (title.length > 50) {
        return title.substring(0, 49 - dots.length) + dots;
    }
    else return title;
}

module.exports = { formatDuration, formatFormalTime, parseDuration, formatChunk, formatShortenedTitle }