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

const formatInt = int => {
  if (int < 10) return `0${int}`;
  return `${int}`;
}

module.exports = { formatDuration }