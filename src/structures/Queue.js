function createQueue(message) {

    const serverQueue = message.client.queue.get(message.guild.id);

    //Check if a queue already exsits
    if (serverQueue) return

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
        duration: 0,

    };

    message.client.queue.set(message.guild.id, queueConstruct);

}

module.exports = { createQueue }

