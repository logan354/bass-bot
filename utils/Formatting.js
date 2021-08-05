const formatInt = int => {
  if (int < 10) return `0${int}`;
  return `${int}`;
}

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

function parseDuration(time) {
  const numberFormat = /^\d+$/;
  const timeFormat = /^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})(?:\.(\d{3}))?$/;
  const timeUnits = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
  };

  /**
   * Converts human friendly time to milliseconds. Supports the format
   * 00:00:00.000 for hours, minutes, seconds, and milliseconds respectively.
   * And 0ms, 0s, 0m, 0h, and together 1m1s.
   *
   * @param {number|string} time
   * @returns {number}
   */
  if (typeof time === 'number') { return time * 1000; }
  if (numberFormat.test(time)) { return +time * 1000; }
  const firstFormat = timeFormat.exec(time);
  if (firstFormat) {
    return (+(firstFormat[1] || 0) * timeUnits.h) +
      (+(firstFormat[2] || 0) * timeUnits.m) +
      (+firstFormat[3] * timeUnits.s) +
      +(firstFormat[4] || 0);
  } else {
    let total = 0;
    const r = /(-?\d+)(ms|s|m|h)/g;
    let rs;
    while ((rs = r.exec(time)) !== null) {
      total += +rs[1] * timeUnits[rs[2]];
    }
    return total;
  };
}

module.exports = { formatDuration, formatFormalTime, parseDuration }
