function createQueue(message) {

    const serverQueue = message.client.queue.get(message.guild.id);

    if (serverQueue) return
    else {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: message.member.voice.channel,
            connection: null,
            tracks: [],
            skiplist: [],
            volume: 100,
            loop: false,
            loopQueue: false,
            playing: true,
            totalTime: 0,

        };

        message.client.queue.set(message.guild.id, queueConstruct);

    }
}

module.exports = { createQueue }

