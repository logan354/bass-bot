/**
 * Handles empty cooldown
 * @param {object} client Discord.js client object
 * @param {object} oldState Discord.js voiceStateUpdate parameter
 */
function handleEmptyCooldown(client, oldState) {
    const serverCooldown = client.cooldowns.get("empty-" + oldState.guild.id);
    let voiceChannel = oldState.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        client.cooldowns.delete("empty-" + oldState.guild.id);
    }

    if (voiceChannel && voiceChannel.members.filter(x => !x.user.bot).size === 0) {
        let timeout = setTimeout(() => {
            if (voiceChannel && voiceChannel.members.filter(x => !x.user.bot).size === 0) {
                client.queues.delete(oldState.guild.id);
                voiceChannel.leave();
            }
        }, 600000); //10 minutes

        client.cooldowns.set("empty-" + oldState.guild.id, timeout);
    }
}

/**
 * Handles end cooldown
 * @param {object} message Discord.js message object
 */
function handleEndCooldown(message) {
    const serverQueue = message.client.queues.get(message.guild.id);
    const serverCooldown = message.client.cooldowns.get("end-" + message.guild.id);
    let voiceChannel = message.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        message.client.cooldowns.delete("end-" + message.guild.id);
    }

    if (voiceChannel && serverQueue.tracks.length === 0) {
        let timeout = setTimeout(() => {
            if (voiceChannel && serverQueue.tracks.length === 0) {
                message.client.queues.delete(message.guild.id);
                voiceChannel.leave();
            }
        }, 600000); //10 minutes

        message.client.cooldowns.set("end-" + message.guild.id, timeout);
    }
}

/**
 * Handles stop cooldown
 * @param {object} message Discord.js message object
 */
function handleStopCooldown(message) {
    const serverQueue = message.client.queues.get(message.guild.id);
    const serverCooldown = message.client.cooldowns.get("stop-" + message.guild.id);
    let voiceChannel = message.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        message.client.cooldowns.delete("stop-" + message.guild.id);
    }

    if (voiceChannel && serverQueue.playing === false) {
        let timeout = setTimeout(() => {
            if (voiceChannel && serverQueue.playing === false) {
                message.client.queues.delete(message.guild.id);
                voiceChannel.leave();
            }
        }, 600000); //10 minutes

        message.client.cooldowns.set("stop-" + message.guild.id, timeout);
    }
}

module.exports = { handleEmptyCooldown, handleEndCooldown, handleStopCooldown }