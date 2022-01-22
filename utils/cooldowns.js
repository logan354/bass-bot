/**
 * Handles empty cooldown
 * @param {import("../structures/Queue")} queue 
 */
function handleEmptyCooldown(queue) {
    if (queue.cooldown) {
        clearTimeout(queue.cooldown);
        queue.cooldown = null;
    }

    if (queue.voiceChannel && queue.voiceChannel.members.filter(x => !x.user.bot).size === 0) {
        const timeout = setTimeout(() => {
            if (queue.voiceChannel && queue.voiceChannel.members.filter(x => !x.user.bot).size === 0) queue.destroy();
        }, 600000); // 10 minutes

        queue.cooldown = timeout;
    }
}

/**
 * Handles end cooldown
 * @param {import("../structures/Queue")} queue 
 */
function handleEndCooldown(queue) {
    if (queue.cooldown) {
        clearTimeout(queue.cooldown);
        queue.cooldown = null;
    }

    if (queue.voiceChannel && !queue.tracks.length) {
        const timeout = setTimeout(() => {
            if (queue.voiceChannel && !queue.tracks.length) queue.destroy();
        }, 600000); // 10 minutes

        queue.cooldown = timeout;
    }
}

/**
 * Handles stop cooldown
 * @param {import("../structures/Queue")} queue 
 */
function handleStopCooldown(queue) {
    if (queue.cooldown) {
        clearTimeout(queue.cooldown);
        queue.cooldown = null;
    }

    if (queue.voiceChannel && queue.paused) {
        const timeout = setTimeout(() => {
            if (queue.voiceChannel && queue.paused) queue.destroy();
        }, 600000); // 10 minutes

        queue.cooldown = timeout;
    }
}

module.exports = { handleEmptyCooldown, handleEndCooldown, handleStopCooldown }