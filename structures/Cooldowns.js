function handleEmptyCooldown(client, oldState) {
    const serverCooldown = client.cooldowns.has("empty-" + oldState.guild.id || "end-" + oldState.guild.id || "stop-" + oldState.guild.id);
    let voiceChannel = oldState.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        serverCooldown.delete();
    }

    if (voiceChannel) {
        if (voiceChannel.members.filter(x => !x.user.bot).size === 0) {
            let timeout = setTimeout(async function () {
                if (voiceChannel) {
                    if (voiceChannel.members.filter(x => !x.user.bot).size === 0) {
                        client.queues.delete(oldState.guild.id);
                        voiceChannel.leave();
                    }
                }
            }, 600000);

            client.cooldowns.set("empty-" + oldState.guild.id, timeout);
        }
    }
}

function handleEndCooldown(message) {
    const serverQueue = message.client.queues.get(message.guild.id);
    const serverCooldown = message.client.cooldowns.has("empty-" + message.guild.id || "end-" + message.guild.id || "stop-" + message.guild.id)
    let voiceChannel = message.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        serverCooldown.delete();
    }

    if (message.guild.me.voice.channel) {
        if (serverQueue.tracks.length === 0) {
            let timeout = setTimeout(async function () {
                if (message.guild.me.voice.channel) {
                    if (serverQueue.tracks.length === 0) {
                        message.client.queues.delete(message.guild.id);
                        voiceChannel.leave();
                    }
                }
            }, 600000);

            message.client.cooldowns.set("end-" + message.guild.id, timeout);
        }
    }
}

function handleStopCooldown(message) {
    const serverQueue = message.client.queues.get(message.guild.id);
    const serverCooldown = message.client.cooldowns.has("empty-" + message.guild.id || "end-" + message.guild.id || "stop-" + message.guild.id)
    let voiceChannel = message.guild.me.voice.channel;

    if (serverCooldown) {
        clearTimeout(serverCooldown);
        serverCooldown.delete();
    }

    if (message.guild.me.voice.channel) {
        if (serverQueue.playing === false) {
            let timeout = setTimeout(async function () {
                if (message.guild.me.voice.channel) {
                    if (serverQueue.playing === false) {
                        message.client.queues.delete(message.guild.id);
                        voiceChannel.leave();
                    }
                }
            }, 600000);

            message.client.cooldowns.set("stop-" + message.guild.id, timeout);
        }
    }
}

module.exports = { handleEmptyCooldown, handleEndCooldown, handleStopCooldown }