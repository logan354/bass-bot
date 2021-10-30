/**
 * Handles empty cooldown
 * @param {Object} oldState Discord.js voiceStateUpdate parameter
 * @returns {void}
 */
function handleEmptyCooldown(oldState) {
    const serverQueue = oldState.client.queues.get(oldState.guild.id);
    const serverCooldown = oldState.client.cooldowns.get("empty-" + oldState.guild.id);
    const voiceChannel = oldState.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        oldState.client.cooldowns.delete("empty-" + oldState.guild.id);
    }

    if (voiceChannel && voiceChannel.members.filter(x => !x.user.bot).size === 0) {
        const timeout = setTimeout(() => {
            if (voiceChannel && voiceChannel.members.filter(x => !x.user.bot).size === 0) {
                serverQueue.streamDispatcher.connection.destroy();
            }
        }, 600000); //10 minutes

        oldState.client.cooldowns.set("empty-" + oldState.guild.id, timeout);
    }
}

/**
 * Handles end cooldown
 * @param {Object} data Discord.js message or interaction object
 * @returns {void}
 */
function handleEndCooldown(data) {
    const serverQueue = data.client.queues.get(data.guild.id);
    const serverCooldown = data.client.cooldowns.get("end-" + data.guild.id);
    let voiceChannel = data.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        data.client.cooldowns.delete("end-" + data.guild.id);
    }

    if (voiceChannel && serverQueue.tracks.length === 0) {
        const timeout = setTimeout(() => {
            if (voiceChannel && serverQueue.tracks.length === 0) {
                serverQueue.streamDispatcher.connection.destroy();
            }
        }, 600000); //10 minutes

        data.client.cooldowns.set("end-" + data.guild.id, timeout);
    }
}

/**
 * Handles stop cooldown
 * @param {Object} data Discord.js message or interaction object
 * @returns {void}
 */
function handleStopCooldown(data) {
    const serverQueue = data.client.queues.get(data.guild.id);
    const serverCooldown = data.client.cooldowns.get("stop-" + data.guild.id);
    let voiceChannel = data.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        data.client.cooldowns.delete("stop-" + data.guild.id);
    }

    if (voiceChannel && serverQueue.playing === false) {
        const timeout = setTimeout(() => {
            if (voiceChannel && serverQueue.playing === false) {
                serverQueue.streamDispatcher.connection.destroy();
            }
        }, 600000); //10 minutes

        data.client.cooldowns.set("stop-" + data.guild.id, timeout);
    }
}

module.exports = { handleEmptyCooldown, handleEndCooldown, handleStopCooldown }