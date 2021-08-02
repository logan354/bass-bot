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

function parseDuration(duration) {
  const args = duration.split(":");
  let dur = 0;

  switch (args.length) {
    case 3:
      dur = parseInt(args[0]) * 60 * 60 * 1000 + parseInt(args[1]) * 60 * 1000 + parseInt(args[2]) * 1000;
      break;
    case 2:
      dur = parseInt(args[0]) * 60 * 1000 + parseInt(args[1]) * 1000;
      break;
    default:
      dur = parseInt(args[0]) * 1000;
  }

  return dur;
}

module.exports = { formatDuration, formatFormalTime, parseDuration }